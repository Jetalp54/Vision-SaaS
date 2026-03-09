'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { ImageJob, JobStatus, JobType } from '@vision-saas/types';
import { getJob, processJob, toggleFavorite, getDevUserId } from '@/lib/api-client';
import { TopBar } from '@/components/layout/TopBar';
import { StatusBadge, TypeBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ResultDisplay } from '@/components/upload/ResultDisplay';

interface HistoryEntry {
  id: string;
  promptText: string;
  confidence: number | null;
  tags: string | null;
  isFavorited: boolean;
  createdAt: number;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' });
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function parseTags(entry: HistoryEntry): string[] {
  if (!entry.tags) return [];
  try { return JSON.parse(entry.tags) as string[]; } catch { return []; }
}

const TYPE_LABEL: Record<JobType, string> = {
  image_to_prompt: '🎨 Image → Prompt',
  image_to_text:   '📝 Image → Text',
  ocr:             '🔍 OCR',
};

export default function HistoryDetailClient() {
  const { id: jobId } = useParams<{ id: string }>();

  const [job, setJob]           = useState<ImageJob | null>(null);
  const [history, setHistory]   = useState<HistoryEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      const res = await getJob(jobId, getDevUserId());
      if (!res.success) { setError(res.detail); return; }
      setJob(res.data.job);
      const detail = res.data as { job: typeof res.data.job; history?: HistoryEntry[] };
      setHistory(detail.history ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job.');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { void fetchJob(); }, [fetchJob]);

  useEffect(() => {
    if (!job || (job.status !== 'pending' && job.status !== 'processing')) return;
    const iv = setInterval(() => void fetchJob(), 3000);
    return () => clearInterval(iv);
  }, [job, fetchJob]);

  async function handleProcess() {
    if (!job) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await processJob({ jobId: job.id }, getDevUserId());
      if (!res.success) { setError(res.detail); return; }
      setJob(res.data.job);
      if (res.data.result) {
        setHistory((prev) => [res.data.result as unknown as HistoryEntry, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleToggleFavorite(entry: HistoryEntry) {
    if (!job) return;
    try {
      const res = await toggleFavorite(job.id, entry.id, getDevUserId());
      if (!res.success) return;
      setHistory((prev) =>
        prev.map((h) => h.id === entry.id ? { ...h, isFavorited: res.data.isFavorited } : h),
      );
    } catch { /* silent */ }
  }

  if (loading) {
    return (
      <div className="flex flex-col flex-1">
        <TopBar title="Job Detail" />
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col flex-1">
        <TopBar title="Not Found" />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-4xl">🔍</p>
          <p className="text-gray-500">Job not found.</p>
          <Link href="/app/history" className="text-indigo-400 hover:text-indigo-300 text-sm">
            ← Back to History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title={TYPE_LABEL[job.type as JobType]}
        subtitle={job.id}
        actions={
          <Link href="/app/history">
            <Button variant="ghost" size="sm">← History</Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl">
        {/* Status + actions row */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={job.status as JobStatus} />
          <TypeBadge type={job.type as JobType} />
          {(job.status === 'pending' || job.status === 'processing') && (
            <Button size="sm" loading={processing} onClick={() => void handleProcess()}>
              ✨ Analyze Now
            </Button>
          )}
        </div>

        {/* Metadata bento grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'MIME Type',   value: job.inputMimeType },
            { label: 'File Size',   value: formatBytes(job.inputSizeBytes) },
            { label: 'Model',       value: job.modelUsed ?? '—' },
            { label: 'Processing',  value: job.processingMs != null ? `${job.processingMs} ms` : '—' },
            { label: 'Tokens Used', value: job.tokensUsed != null ? String(job.tokensUsed) : '—' },
            { label: 'Created',     value: formatDate(job.createdAt) },
            { label: 'Updated',     value: formatDate(job.updatedAt) },
            { label: 'R2 Key',      value: job.r2Key.split('/').pop() ?? job.r2Key },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-3 space-y-1">
              <dt className="text-[10px] text-gray-700 uppercase tracking-wider">{label}</dt>
              <dd className="text-xs text-gray-300 truncate font-mono" title={value}>{value}</dd>
            </div>
          ))}
        </div>

        {/* Error message */}
        {job.errorMessage && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            <strong>Error:</strong> {job.errorMessage}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {history.length > 0 ? (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Results <span className="text-gray-700 font-normal normal-case">({history.length})</span>
            </h2>
            {history.map((entry) => {
              const tags = parseTags(entry);
              return (
                <div key={entry.id} className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
                  {/* Entry header */}
                  <div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-2.5">
                    <span className="font-mono text-[10px] text-gray-700">{entry.id}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => void handleToggleFavorite(entry)}
                        className={`text-lg transition-all hover:scale-110 ${entry.isFavorited ? 'text-yellow-400' : 'text-gray-700 hover:text-yellow-400'}`}
                        title={entry.isFavorited ? 'Remove favorite' : 'Add favorite'}
                      >
                        {entry.isFavorited ? '★' : '☆'}
                      </button>
                    </div>
                  </div>

                  {/* Result text with typewriter */}
                  <div className="p-4">
                    <ResultDisplay text={entry.promptText} />
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-4 pb-3">
                      {tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-[#1a1a1a] border border-[#222] px-2.5 py-0.5 text-[10px] text-gray-500">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Confidence bar */}
                  {entry.confidence != null && (
                    <div className="flex items-center gap-3 px-4 pb-4">
                      <span className="text-[10px] text-gray-700 w-20 shrink-0">Confidence</span>
                      <div className="flex-1 h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${Math.round(entry.confidence * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 w-8 text-right">
                        {Math.round(entry.confidence * 100)}%
                      </span>
                    </div>
                  )}

                  <div className="border-t border-[#111] px-4 py-2 text-[10px] text-gray-700">
                    {formatDate(entry.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : job.status === 'processing' ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500">AI is analyzing your image…</p>
            <p className="text-xs text-gray-700">Auto-refreshes every 3 seconds</p>
          </div>
        ) : job.status === 'completed' ? (
          <p className="text-center text-sm text-gray-700 py-12">No result entries found.</p>
        ) : null}
      </div>
    </div>
  );
}
