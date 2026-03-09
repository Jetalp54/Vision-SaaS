import type { JobType } from '@vision-saas/types';

const MODES: { type: JobType; label: string; desc: string; icon: string }[] = [
  { type: 'image_to_prompt', label: 'Image → Prompt', desc: 'Generate rich AI prompts', icon: '🎨' },
  { type: 'image_to_text',   label: 'Image → Text',   desc: 'Extract readable text',   icon: '📝' },
  { type: 'ocr',             label: 'OCR',             desc: 'Precise text recognition', icon: '🔍' },
];

interface ModeSelectorProps {
  value: JobType;
  onChange: (type: JobType) => void;
}

export function ModeSelector({ value, onChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {MODES.map(({ type, label, desc, icon }) => {
        const active = value === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={[
              'relative flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all duration-150',
              active
                ? 'border-indigo-500/60 bg-indigo-600/10 shadow-[0_0_0_1px_rgba(99,102,241,0.3)]'
                : 'border-[#222] bg-[#0d0d0d] hover:border-[#333] hover:bg-[#141414]',
            ].join(' ')}
          >
            <span className="text-lg">{icon}</span>
            <span className={`text-xs font-semibold ${active ? 'text-indigo-300' : 'text-gray-300'}`}>
              {label}
            </span>
            <span className="text-[10px] text-gray-600 leading-tight">{desc}</span>
            {active && (
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
