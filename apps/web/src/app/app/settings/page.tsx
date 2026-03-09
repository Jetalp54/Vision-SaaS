'use client';

import { useState, useEffect, useCallback } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { getHealth, getDevUserId } from '@/lib/api-client';
import type { HealthResponse } from '@vision-saas/types';

const API_BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:8787';

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#111] last:border-0 gap-4">
      <span className="text-xs text-gray-600 shrink-0 w-36">{label}</span>
      <span className={`flex-1 text-xs text-gray-300 truncate ${mono ? 'font-mono' : ''}`}>{value}</span>
      <button
        onClick={copy}
        className="shrink-0 text-[10px] text-gray-700 hover:text-indigo-400 transition-colors"
      >
        {copied ? '✓' : 'copy'}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const loadHealth = useCallback(async () => {
    try {
      const res = await getHealth();
      if (res.success) setHealth(res.data);
    } catch { /* silent */ } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => { void loadHealth(); }, [loadHealth]);

  const allOk = health?.status === 'ok';

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Settings" subtitle="Configuration & system info" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">

        {/* Connection */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Connection</h2>
          <Card className="p-4">
            <InfoRow label="API Base URL"  value={API_BASE_URL} mono />
            <InfoRow label="Auth Mode"     value="X-User-ID header (dev)" />
            <InfoRow label="Dev User ID"   value={typeof window !== 'undefined' ? getDevUserId() : '—'} mono />
            <InfoRow label="Environment"   value={process.env.NODE_ENV ?? 'production'} mono />
          </Card>
        </section>

        {/* System status */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">System Status</h2>
            <button
              onClick={() => void loadHealth()}
              className="text-[10px] text-gray-700 hover:text-indigo-400 transition-colors"
            >
              ↺ refresh
            </button>
          </div>
          <Card className="p-4">
            {healthLoading ? (
              <div className="space-y-3">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="skeleton h-5 rounded-md" />
                ))}
              </div>
            ) : health ? (
              <>
                <div className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 ${allOk ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-yellow-500/20 bg-yellow-500/5'}`}>
                  <span className={`h-2 w-2 rounded-full ${allOk ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`} />
                  <span className={`text-xs font-medium ${allOk ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    {allOk ? 'All systems operational' : 'Partial outage detected'}
                  </span>
                  {health.version && (
                    <span className="ml-auto text-[10px] text-gray-700 font-mono">v{health.version}</span>
                  )}
                </div>
                {(Object.entries(health.services) as [string, 'ok' | 'error'][]).map(([key, status]) => (
                  <div key={key} className="flex items-center justify-between py-2.5 border-b border-[#111] last:border-0">
                    <span className="text-xs text-gray-500 capitalize font-mono">{key}</span>
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${status === 'ok' ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`} />
                      <span className={`text-xs font-medium ${status === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {status === 'ok' ? 'Operational' : 'Degraded'}
                      </span>
                    </div>
                  </div>
                ))}
                <p className="mt-3 text-[10px] text-gray-700 font-mono">
                  API timestamp: {new Date(health.timestamp).toISOString()}
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-700 text-center py-4">Unable to reach API.</p>
            )}
          </Card>
        </section>

        {/* About */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">About</h2>
          <Card className="p-4">
            <InfoRow label="Product"    value="VisionPrompt" />
            <InfoRow label="AI Model"   value="@cf/llava-hf/llava-1.5-7b-hf" mono />
            <InfoRow label="Runtime"    value="Cloudflare Workers" />
            <InfoRow label="Storage"    value="Cloudflare R2 + D1" />
            <InfoRow label="Cache"      value="Cloudflare Workers KV" />
          </Card>
        </section>

      </div>
    </div>
  );
}
