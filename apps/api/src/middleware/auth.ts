import type { Context, Next } from 'hono';
import type { Bindings, Variables } from '../types';
import { AppError } from './error-handler';

// ─── Cloudflare Access JWT Validation ────────────────────────────────────────
//
// This middleware validates JWTs issued by Cloudflare Access.
// In production, every request to the API Worker passes through a
// Cloudflare Access policy which injects a signed `Cf-Access-Jwt-Assertion`
// header. We verify the JWT against the public JWKS endpoint.
//
// Docs: https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/

const CF_ACCESS_CERTS_URL = (teamDomain: string) =>
  `https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`;

interface CfAccessPayload {
  sub: string;       // User identifier (email or UUID depending on IdP)
  email?: string;
  aud: string[];
  iss: string;
  iat: number;
  exp: number;
  // Custom claims you can add via Access policies
  'custom:user_id'?: string;
  'custom:tier'?: 'free' | 'pro' | 'enterprise';
}

// Simple in-memory JWKS cache (per isolate lifetime, ~30s on Workers)
let jwksCache: { keys: JsonWebKey[]; fetchedAt: number } | null = null;
const JWKS_TTL_MS = 60_000; // 1 minute

async function getJwks(teamDomain: string): Promise<JsonWebKey[]> {
  if (jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const res = await fetch(CF_ACCESS_CERTS_URL(teamDomain));
  if (!res.ok) throw new Error('Failed to fetch Cloudflare Access JWKS');
  const data = (await res.json()) as { keys: JsonWebKey[] };
  jwksCache = { keys: data.keys, fetchedAt: Date.now() };
  return data.keys;
}

async function verifyJwt(
  token: string,
  jwks: JsonWebKey[],
  audience: string,
): Promise<CfAccessPayload> {
  // Decode header to find key ID
  const [headerB64, payloadB64, sigB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !sigB64) {
    throw AppError.unauthorized('Malformed JWT token.');
  }

  const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/'))) as {
    kid?: string;
    alg: string;
  };

  // Find the matching key
  const jwk = jwks.find((k) => !header.kid || (k as { kid?: string }).kid === header.kid);
  if (!jwk) throw AppError.unauthorized('No matching JWK found for token kid.');

  // Import the public key
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  // Reconstruct the signed data
  const encoder = new TextEncoder();
  const signingInput = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = Uint8Array.from(
    atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')),
    (c) => c.charCodeAt(0),
  );

  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signature, signingInput);
  if (!valid) throw AppError.unauthorized('JWT signature verification failed.');

  // Decode payload
  const payload = JSON.parse(
    atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')),
  ) as CfAccessPayload;

  // Validate claims
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw AppError.unauthorized('JWT token has expired.');
  if (!payload.aud.includes(audience)) {
    throw AppError.unauthorized('JWT audience mismatch.');
  }

  return payload;
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────

export async function requireAuth(
  ctx: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next,
) {
  const env = ctx.env;

  // ── Development shortcut: trust X-User-ID header ─────────────────────────
  if (env.ENVIRONMENT === 'development') {
    const devUserId = ctx.req.header('X-User-ID');
    if (devUserId) {
      ctx.set('userId', devUserId);
      ctx.set('userTier', 'pro'); // generous defaults for local dev
      return next();
    }
    throw AppError.unauthorized('X-User-ID header required in development mode.');
  }

  // ── Production: validate Cloudflare Access JWT ────────────────────────────
  const jwtToken =
    ctx.req.header('Cf-Access-Jwt-Assertion') ??
    ctx.req.header('Authorization')?.replace(/^Bearer\s+/, '');

  if (!jwtToken) throw AppError.unauthorized('Missing authentication token.');

  const teamDomain = (env as unknown as Record<string, string>)['CF_ACCESS_TEAM_DOMAIN'] ?? '';
  const audience = (env as unknown as Record<string, string>)['CF_ACCESS_AUD'] ?? '';

  if (!teamDomain || !audience) {
    console.error('[auth] CF_ACCESS_TEAM_DOMAIN or CF_ACCESS_AUD not configured');
    throw AppError.unauthorized('Authentication service misconfigured.');
  }

  const jwks = await getJwks(teamDomain);
  const payload = await verifyJwt(jwtToken, jwks, audience);

  // Map CF Access claims → app context
  // The user ID comes from a custom claim; fall back to the CF `sub`
  const userId = payload['custom:user_id'] ?? payload.sub;
  const tier = payload['custom:tier'] ?? 'free';

  ctx.set('userId', userId);
  ctx.set('userTier', tier);

  await next();
}

// ─── Optional Auth (does not throw if no token) ───────────────────────────────

export async function optionalAuth(
  ctx: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next,
) {
  try {
    await requireAuth(ctx, next);
  } catch {
    // Not authenticated — continue without userId set
    await next();
  }
}
