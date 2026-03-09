'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { ImageJob, JobStatus, JobType } from '@vision-saas/types';
import { listJobs, getDevUserId } from '@/lib/api-client';
import { TopBar } from '@/components/layout/TopBar';
import { StatusBadge, TypeBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
const PAGE_SIZE = 20;

const TYPE_ICON: Record<JobType, string> = {
  image_to_prompt: '🎨',
  image_to_text:   '📝',
  ocr:             '🔍',
};

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

const STATUSES: Array<JobStatus | 'all'> = ['all', 'pending', 'processing', 'completed', 'failed'];

export default function HistoryPage() {
  const [jobs, setJobs]               = useState<ImageJob[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { page: number; pageSize: number; status?: string } = {
        page,
        pageSize: PAGE_SIZE,
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await listJobs(getDevUserId(), params);
      if (!res.success) { setError(res.detail); return; }
      setJobs(res.data.jobs);
      setTotal(res.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { void fetchJobs(); }, [fetchJobs]);

  // Auto-refresh while active jobs present
  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === 'pending' || j.status === 'processing');
    if (!hasActive) return;
    const iv = setInterval(() => void fetchJobs(), 5000);
    return () => clearInterval(iv);
  }, [jobs, fetchJobs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Client-side search filter
  const filtered = search.trim()
    ? jobs.filter((j) => j.id.includes(search.trim()) || j.type.includes(search.trim()))
    : jobs;

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="History"
        subtitle={`${total} total generation${total !== 1 ? 's' : ''}`}
        actions={
          <Link href="/app">
            <Button size="sm">+ New</Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by ID or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-[#222] bg-[#0d0d0d] px-3 py-2 text-sm text-gray-300 placeholder-gray-700 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 w-56"
          />

          {/* Status tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium border transition-all capitalize',
                  statusFilter === s
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-[#222] text-gray-500 hover:border-[#333] hover:text-gray-300',
                ].join(' ')}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => void fetchJobs()}
            className="ml-auto text-xs text-gray-700 hover:text-gray-400 transition-colors"
          >
            ↺ Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
          {loading && jobs.length === 0 ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <p className="text-3xl">📭</p>
              <p className="text-sm text-gray-600">No generations found.</p>
              <Link href="/app" className="text-sm text-indigo-400 hover:text-indigo-300">
                Upload your first image →
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-[#1a1a1a]">
                <tr className="text-left text-[10px] text-gray-700 uppercase tracking-wider">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Mode</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Size</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111]">
                {filtered.map((job) => (
                  <tr key={job.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{TYPE_ICON[job.type]}</span>
                        <span className="font-mono text-xs text-gray-500">{job.id.slice(0, 13)}…</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><TypeBadge type={job.type} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={job.status} /></td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">{formatBytes(job.inputSizeBytes)}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      {job.processingMs != null ? `${job.processingMs} ms` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-700">{formatDate(job.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/app/history/${job.id}`}
                        className="text-xs text-indigo-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              ← Prev
            </Button>
            <span className="text-xs text-gray-600">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
