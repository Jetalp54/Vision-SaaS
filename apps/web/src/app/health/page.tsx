'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { HealthResponse } from '@vision-saas/types';
import { getHealth } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type ServiceStatus = 'ok' | 'error' | 'loading';

const SERVICE_LABELS: Record<keyof HealthResponse['services'], string> = {
  d1: 'D1 Database',
  kv: 'Workers KV',
  r2: 'R2 Object Storage',
  ai: 'Workers AI (LLaVA)',
};

const SERVICE_ICONS: Record<keyof HealthResponse['services'], string> = {
  d1: '🗃️',
  kv: '⚡',
  r2: '🗄️',
  ai: '🤖',
};

function StatusDot({ status }: { status: ServiceStatus }) {
  return (
    <span
      className={[
        'inline-block h-2 w-2 rounded-full',
        status === 'ok'      ? 'bg-emerald-400' :
        status === 'error'   ? 'bg-red-400 animate-pulse' :
                               'bg-gray-600 animate-pulse',
      ].join(' ')}
    />
  );
}

function ServiceCard({ name, icon, status }: { name: string; icon: string; status: ServiceStatus }) {
  const label = status === 'ok' ? 'Operational' : status === 'error' ? 'Degraded' : 'Checking…';
  const labelColor = status === 'ok' ? 'text-emerald-400' : status === 'error' ? 'text-red-400' : 'text-gray-500';
  const borderColor = status === 'ok' ? 'border-emerald-500/20' : status === 'error' ? 'border-red-500/20' : 'border-[#1a1a1a]';

  return (
    <div className={`rounded-xl border ${borderColor} bg-[#0a0a0a] p-4 flex items-center gap-4 transition-all duration-300`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#141414] border border-[#222] text-xl">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-300">{name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <StatusDot status={status} />
          <span className={`text-xs ${labelColor}`}>{label}</span>
        </div>
      </div>
    </div>
  );
}

export default function HealthPage() {
  const [data, setData]             = useState<HealthResponse | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getHealth();
      if (!res.success) { setFetchError(res.detail); return; }
      setData(res.data);
      setLastChecked(new Date());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Could not reach the API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void check();
    const iv = setInterval(() => void check(), 30_000);
    return () => clearInterval(iv);
  }, [check]);

  const overallOk      = data?.status === 'ok';
  const overallLoading = loading && !data;

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-[#111] bg-[#050505]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">V</div>
            <span className="text-sm font-semibold text-white">VisionPrompt</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-sm text-gray-500 hover:text-white transition-colors">App</Link>
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 pt-28 pb-20 space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">System Status</h1>
          <p className="text-sm text-gray-600">
            {lastChecked
              ? `Last checked at ${lastChecked.toLocaleTimeString()}`
              : 'Checking now…'}
          </p>
        </div>

        {/* Overall banner */}
        <Card
          className={[
            'p-6 text-center transition-all duration-500',
            overallLoading ? '' :
            overallOk
              ? 'border-emerald-500/25 bg-gradient-to-b from-emerald-500/5 to-transparent'
              : 'border-red-500/25 bg-gradient-to-b from-red-500/5 to-transparent',
          ].join(' ')}
        >
          {overallLoading ? (
            <div className="space-y-3 py-2">
              <div className="flex justify-center gap-1">
                {[0,1,2].map((i) => (
                  <span key={i} className="h-2 w-2 rounded-full bg-indigo-500"
                    style={{ animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
              <p className="text-sm text-gray-500">Probing all services…</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-5xl">{overallOk ? '✅' : '⚠️'}</div>
              <p className={`text-lg font-semibold ${overallOk ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {overallOk ? 'All Systems Operational' : 'Partial Outage Detected'}
              </p>
              {data?.version && (
                <span className="inline-block rounded-full bg-[#1a1a1a] border border-[#222] px-3 py-0.5 text-[10px] text-gray-600 font-mono">
                  API v{data.version}
                </span>
              )}
            </div>
          )}
        </Card>

        {/* Fetch error */}
        {fetchError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            <strong>API Unreachable:</strong> {fetchError}
          </div>
        )}

        {/* Service grid */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Services</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(SERVICE_LABELS) as Array<keyof HealthResponse['services']>).map((key) => {
              const status: ServiceStatus = overallLoading ? 'loading' : data ? data.services[key] : 'loading';
              return (
                <ServiceCard
                  key={key}
                  name={SERVICE_LABELS[key]}
                  icon={SERVICE_ICONS[key]}
                  status={status}
                />
              );
            })}
          </div>
        </div>

        {/* Refresh + metadata */}
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            loading={loading}
            onClick={() => void check()}
          >
            {loading ? 'Checking…' : '↺ Refresh Now'}
          </Button>
          <p className="text-xs text-gray-700">Auto-refreshes every 30 seconds</p>
          {data && (
            <p className="text-[10px] text-gray-800 font-mono">
              API timestamp: {new Date(data.timestamp).toISOString()}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
