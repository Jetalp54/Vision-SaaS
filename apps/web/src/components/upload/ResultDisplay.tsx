'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';

interface ResultDisplayProps {
  text: string;
  processing?: boolean | undefined;
  onReset?: (() => void) | undefined;
}

/** Character-by-character typewriter reveal */
function useTypewriter(text: string, active: boolean, speed = 12) {
  const [displayed, setDisplayed] = useState('');
  const rafRef = useRef<number | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!active || !text) { setDisplayed(text); return; }
    setDisplayed('');
    indexRef.current = 0;

    function tick() {
      if (indexRef.current < text.length) {
        const charsPerFrame = Math.max(1, Math.floor(text.length / (60 * (text.length / speed))));
        indexRef.current = Math.min(indexRef.current + charsPerFrame, text.length);
        setDisplayed(text.slice(0, indexRef.current));
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [text, active, speed]);

  return displayed;
}

export function ResultDisplay({ text, processing = false, onReset }: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);
  const displayed = useTypewriter(text, !processing && !!text, 14);

  function copy() {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  return (
    <div className="animate-fade-in rounded-xl border border-indigo-500/20 bg-[#0d1117] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
            AI Result
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-700 font-mono">
            {wordCount}w · {charCount}c
          </span>
          <button
            onClick={copy}
            className="rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-2.5 py-1 text-xs text-gray-400 hover:text-white hover:border-indigo-500/40 transition-all"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative min-h-[120px] p-4">
        {processing ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full bg-indigo-500"
                  style={{ animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">LLaVA is analyzing your image…</p>
          </div>
        ) : (
          <pre className="typewriter-text whitespace-pre-wrap text-sm text-gray-200 leading-relaxed font-sans">
            {displayed}
            {displayed.length < text.length && (
              <span className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 animate-pulse" />
            )}
          </pre>
        )}
      </div>

      {/* Footer */}
      {!processing && onReset && (
        <div className="border-t border-[#1a1a1a] px-4 py-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onReset}>
            ↺ New Analysis
          </Button>
        </div>
      )}
    </div>
  );
}
