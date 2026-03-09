'use client';

import { useRef, useState, useCallback } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Spinner } from '@/components/ui/Spinner';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff'];
const MAX_BYTES = 10 * 1024 * 1024;

interface UploadZoneProps {
  onFile: (file: File) => void;
  preview: string | null;
  uploading?: boolean;
  error?: string | null;
}

export function UploadZone({ onFile, preview, uploading = false, error }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const validate = useCallback((f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) return 'Unsupported type. Use JPEG, PNG, WebP, GIF or TIFF.';
    if (f.size > MAX_BYTES) return 'File exceeds the 10 MB limit.';
    return null;
  }, []);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validate(f);
    if (err) { setLocalError(err); return; }
    setLocalError(null);
    onFile(f);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const err = validate(f);
    if (err) { setLocalError(err); return; }
    setLocalError(null);
    onFile(f);
  }

  const displayError = error ?? localError;

  return (
    <div className="space-y-2">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={[
          'relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden',
          uploading
            ? 'border-indigo-500 animate-pulse-ring cursor-not-allowed'
            : dragging
              ? 'border-indigo-500 bg-indigo-500/5 scale-[1.01]'
              : 'border-[#2a2a2a] hover:border-indigo-500/40 hover:bg-indigo-500/5',
        ].join(' ')}
      >
        {/* Upload progress shimmer */}
        {uploading && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent"
            style={{ animation: 'shimmer 1.5s linear infinite', backgroundSize: '200% 100%' }}
          />
        )}

        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 p-6 text-center">
          {uploading ? (
            <>
              <Spinner size="lg" />
              <p className="text-sm text-indigo-400 font-medium">Uploading to R2…</p>
              <p className="text-xs text-gray-600">Transferring your image securely</p>
            </>
          ) : preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="max-h-52 rounded-lg object-contain shadow-lg"
            />
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2a2a2a] bg-[#0d0d0d] text-3xl">
                🖼️
              </div>
              <div>
                <p className="text-sm font-medium text-gray-300">
                  Drop your image here
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  or <span className="text-indigo-400 underline underline-offset-2">browse files</span>
                </p>
              </div>
              <p className="text-[10px] text-gray-700 bg-[#0d0d0d] rounded-full px-3 py-1 border border-[#1e1e1e]">
                JPEG · PNG · WebP · GIF · TIFF · Max 10 MB
              </p>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleChange}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {displayError && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
          {displayError}
        </p>
      )}
    </div>
  );
}
