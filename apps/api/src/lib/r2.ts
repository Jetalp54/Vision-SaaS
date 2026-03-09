import type { Bindings } from '../types';

// ─── Allowed MIME Types ───────────────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/tiff',
  'application/pdf',
]);

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── R2 Key Generator ─────────────────────────────────────────────────────────

export function buildR2Key(userId: string, jobId: string, filename: string): string {
  const ext = filename.split('.').pop() ?? 'bin';
  return `uploads/${userId}/${jobId}.${ext}`;
}

// ─── Signed Upload URL (PUT) ─────────────────────────────────────────────────
//
// Cloudflare R2's presigned URL implementation uses AWS Signature V4 via the
// S3-compatible API. Workers do not expose a native createPresignedPost helper,
// so we construct the signature manually using SubtleCrypto.
//
// The caller receives a PUT URL valid for `ttlSeconds` (default 15 min).
// The frontend uploads directly to R2 — the API never buffers the binary.

export async function createSignedUploadUrl(opts: {
  env: Bindings;
  r2Key: string;
  mimeType: string;
  ttlSeconds?: number;
}): Promise<{ url: string; expiresAt: number }> {
  const { env, r2Key, mimeType, ttlSeconds = 900 } = opts;

  // ── Build the S3-compatible endpoint ──────────────────────────────────────
  const accountId = env.AI_GATEWAY_ACCOUNT_ID; // reused — same CF account
  const bucketName =
    env.ENVIRONMENT === 'production'
      ? 'vision-saas-images'
      : 'vision-saas-images-preview';

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  const host = `${accountId}.r2.cloudflarestorage.com`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);

  const region = 'auto';
  const service = 's3';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  // Workers Secret bindings hold R2 API token parts.
  // In practice, use Wrangler secrets: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.
  const accessKeyId = (env as unknown as Record<string, string>)['R2_ACCESS_KEY_ID'];
  const secretAccessKey = (env as unknown as Record<string, string>)['R2_SECRET_ACCESS_KEY'];

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY secrets are not configured.');
  }

  const credential = `${accessKeyId}/${credentialScope}`;

  // ── Canonical query string (presigned URL style) ───────────────────────────
  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(ttlSeconds),
    'X-Amz-SignedHeaders': 'content-type;host',
  });
  // Must be sorted
  queryParams.sort();

  const canonicalUri = `/${bucketName}/${r2Key}`;
  const canonicalHeaders = `content-type:${mimeType}\nhost:${host}\n`;
  const canonicalQueryString = queryParams.toString();

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    'content-type;host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  // ── String to sign ────────────────────────────────────────────────────────
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(canonicalRequest),
  );
  const canonicalHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    canonicalHash,
  ].join('\n');

  // ── Signing key derivation ────────────────────────────────────────────────
  async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key instanceof Uint8Array ? (key.buffer as ArrayBuffer) : key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  }

  const signingKey = await hmac(
    await hmac(
      await hmac(
        await hmac(encoder.encode(`AWS4${secretAccessKey}`), dateStamp),
        region,
      ),
      service,
    ),
    'aws4_request',
  );

  const signatureBuffer = await hmac(signingKey, stringToSign);
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  queryParams.set('X-Amz-Signature', signature);

  const url = `${endpoint}${canonicalUri}?${queryParams.toString()}`;
  const expiresAt = Date.now() + ttlSeconds * 1000;

  return { url, expiresAt };
}
