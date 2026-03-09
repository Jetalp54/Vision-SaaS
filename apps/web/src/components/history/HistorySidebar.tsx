'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { ImageJob } from '@vision-saas/types';
import { listJobs, getDevUserId } from '@/lib/api-client';
import { StatusBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_ICON: Record<string, string> = {
  image_to_prompt: '🎨',
  image_to_text: '📝',
  ocr: '🔍',
};

interface HistorySidebarProps {
  activeJobId?: string | undefined;
  onSelect?: ((job: ImageJob) => void) | undefined;
}

export function HistorySidebar({ activeJobId, onSelect }: HistorySidebarProps) {
  const [jobs, setJobs] = useState<ImageJob[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await listJobs(getDevUserId(), { pageSize: 30 });
      if (res.success) setJobs(res.data.jobs);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // Refresh every 10s to pick up new completions
    const iv = setInterval(() => void load(), 10_000);
    return () => clearInterval(iv);
  }, [load]);

  return (
    <aside className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent</span>
        <button
          onClick={() => void load()}
          className="text-[10px] text-gray-700 hover:text-gray-400 transition-colors"
        >
          ↺ refresh
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="px-4 py-8 text-center space-y-2">
            <p className="text-2xl">📭</p>
            <p className="text-xs text-gray-600">No generations yet</p>
          </div>
        ) : (
          jobs.map((job) => {
            const active = job.id === activeJobId;
            return (
              <div key={job.id}>
                {onSelect ? (
                  <button
                    onClick={() => onSelect(job)}
                    className={[
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-150 border-l-2',
                      active
                        ? 'bg-indigo-600/10 border-indigo-500'
                        : 'border-transparent hover:bg-white/5 hover:border-[#333]',
                    ].join(' ')}
                  >
                    <JobItem job={job} />
                  </button>
                ) : (
                  <Link
                    href={`/app/history/${job.id}`}
                    className={[
                      'flex items-start gap-3 px-4 py-3 transition-all duration-150 border-l-2',
                      active
                        ? 'bg-indigo-600/10 border-indigo-500'
                        : 'border-transparent hover:bg-white/5 hover:border-[#333]',
                    ].join(' ')}
                  >
                    <JobItem job={job} />
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

function JobItem({ job }: { job: ImageJob }) {
  return (
    <>
      {/* Thumbnail placeholder */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1a1a1a] border border-[#222] text-lg">
        {TYPE_ICON[job.type] ?? '🖼️'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-medium text-gray-300 truncate font-mono">
            {job.id.slice(0, 8)}…
          </span>
          <StatusBadge status={job.status} />
        </div>
        <p className="text-[10px] text-gray-600 mt-0.5">{formatRelative(job.createdAt)}</p>
      </div>
    </>
  );
}
