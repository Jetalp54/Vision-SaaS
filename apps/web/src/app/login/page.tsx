'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

/**
 * Dev-mode login page.
 * In production, Cloudflare Access handles authentication transparently —
 * this page is only used in local development where auth is disabled.
 *
 * The "login" here simply stores the user ID in localStorage so the
 * api-client can attach it as X-User-ID on every request.
 */
export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId]     = useState('demo-user-001');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId.trim()) { setError('User ID is required.'); return; }
    setLoading(true);
    setError(null);

    // Store dev user identity
    localStorage.setItem('dev_user_id', userId.trim());

    // Short delay to feel intentional
    setTimeout(() => {
      router.push('/app');
    }, 400);
  }

  const isProd = process.env.NODE_ENV === 'production';

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-4">
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-lg shadow-indigo-900/40">
              V
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-gray-600">Sign in to VisionPrompt</p>
        </div>

        {isProd ? (
          /* Production — Cloudflare Access handles auth */
          <Card className="p-6 text-center space-y-4">
            <div className="text-4xl">🔐</div>
            <p className="text-sm text-gray-400">
              Authentication is handled by{' '}
              <strong className="text-white">Cloudflare Access</strong>.
              You will be redirected to your organization&apos;s SSO provider.
            </p>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Continue with SSO
            </Button>
          </Card>
        ) : (
          /* Development — simple user ID form */
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
              <span className="text-yellow-400 text-sm">⚠</span>
              <p className="text-xs text-yellow-400/80">
                Dev mode — no real auth. Enter any user ID.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-600 uppercase tracking-wider font-medium">
                  Dev User ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="demo-user-001"
                  className="w-full rounded-xl border border-[#222] bg-[#0d0d0d] px-4 py-3 text-sm text-gray-200 placeholder-gray-700 font-mono focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  autoFocus
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Enter App →
              </Button>
            </form>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-[#1a1a1a]" />
              <span className="text-[10px] text-gray-700 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-[#1a1a1a]" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['demo-user-001', 'demo-user-002', 'test-user'].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setUserId(id)}
                  className="rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] px-2 py-2 text-[10px] text-gray-600 hover:text-indigo-400 hover:border-indigo-500/30 transition-all font-mono truncate"
                >
                  {id}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Production info */}
        <p className="text-center text-xs text-gray-700">
          In production, auth is handled by{' '}
          <a
            href="https://www.cloudflare.com/products/zero-trust/access/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:text-indigo-400"
          >
            Cloudflare Access
          </a>
        </p>
      </div>
    </div>
  );
}
