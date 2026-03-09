'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { JobType } from '@vision-saas/types';
import { ModeSelector } from '@/components/upload/ModeSelector';
import { UploadZone } from '@/components/upload/UploadZone';
import { ResultDisplay } from '@/components/upload/ResultDisplay';
import { HistorySidebar } from '@/components/history/HistorySidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import {
  requestPresignedUpload,
  uploadFileToR2,
  confirmUpload,
  processJob,
  getDevUserId,
} from '@/lib/api-client';

type Step = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export default function DashboardPage() {
  const [file, setFile]         = useState<File | null>(null);
  const [jobType, setJobType]   = useState<JobType>('image_to_prompt');
  const [step, setStep]         = useState<Step>('idle');
  const [result, setResult]     = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [preview, setPreview]   = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | undefined>();

  // Revoke object URL on preview change / unmount
  const prevPreviewRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevPreviewRef.current;
    if (prev && prev !== preview) URL.revokeObjectURL(prev);
    prevPreviewRef.current = preview;
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setErrorMsg(null);
    setResult(null);
    setStep('idle');
    setPreview(URL.createObjectURL(f));
  }, []);

  async function handleAnalyze() {
    if (!file) return;
    setStep('uploading');
    setErrorMsg(null);
    setResult(null);

    try {
      const userId = getDevUserId();
      const presignRes = await requestPresignedUpload(
        { filename: file.name, mimeType: file.type, sizeBytes: file.size, jobType },
        userId,
      );
      if (!presignRes.success) throw new Error(presignRes.detail);
      const { uploadUrl, jobId } = presignRes.data;
      setActiveJobId(jobId);

      await uploadFileToR2(uploadUrl, file);

      const confirmRes = await confirmUpload(jobId, userId);
      if (!confirmRes.success) throw new Error(confirmRes.detail);

      setStep('processing');
      const processRes = await processJob({ jobId }, userId);
      if (!processRes.success) throw new Error(processRes.detail);

      setResult(processRes.data.result?.promptText ?? 'No result returned.');
      setStep('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setStep('error');
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setErrorMsg(null);
    setStep('idle');
    setActiveJobId(undefined);
  }

  const busy = step === 'uploading' || step === 'processing';

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Dashboard"
        subtitle="Upload an image and run AI analysis"
        actions={
          step !== 'idle' && (
            <Button variant="ghost" size="sm" onClick={reset}>
              ↺ Reset
            </Button>
          )
        }
      />

      {/* Bento grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main panel */}
        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Mode selector */}
          <section>
            <p className="mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Analysis Mode</p>
            <ModeSelector value={jobType} onChange={setJobType} />
          </section>

          {/* Upload zone */}
          <section>
            <p className="mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Image</p>
            <UploadZone
              onFile={handleFile}
              preview={preview}
              uploading={step === 'uploading'}
              error={errorMsg}
            />
            {file && step === 'idle' && (
              <p className="mt-2 text-center text-[11px] text-gray-700">
                {file.name} · {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </section>

          {/* Analyze button */}
          {file && step !== 'done' && (
            <Button
              className="w-full"
              size="lg"
              loading={busy}
              onClick={() => void handleAnalyze()}
              disabled={busy}
            >
              {step === 'uploading'
                ? 'Uploading to R2…'
                : step === 'processing'
                  ? 'Running LLaVA…'
                  : '✨ Analyze Image'}
            </Button>
          )}

          {/* Error */}
          {step === 'error' && errorMsg && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Result */}
          {(step === 'processing' || step === 'done') && (
            <ResultDisplay
              text={result ?? ''}
              processing={step === 'processing'}
              onReset={step === 'done' ? reset : undefined}
            />
          )}
        </main>

        {/* History sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-l border-[#1a1a1a] bg-[#080808]">
          <HistorySidebar activeJobId={activeJobId} />
        </aside>
      </div>
    </div>
  );
}
