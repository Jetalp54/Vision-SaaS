import type { JobStatus, JobType } from '@vision-saas/types';

const STATUS_STYLES: Record<JobStatus, string> = {
  pending:    'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20',
  processing: 'bg-blue-500/10  text-blue-400  ring-1 ring-blue-500/20',
  completed:  'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  failed:     'bg-red-500/10   text-red-400   ring-1 ring-red-500/20',
};

const STATUS_DOT: Record<JobStatus, string> = {
  pending:    'bg-yellow-400',
  processing: 'bg-blue-400 animate-pulse',
  completed:  'bg-emerald-400',
  failed:     'bg-red-400',
};

const TYPE_LABEL: Record<JobType, string> = {
  image_to_prompt: 'Prompt',
  image_to_text:   'Text',
  ocr:             'OCR',
};

const TYPE_STYLES: Record<JobType, string> = {
  image_to_prompt: 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20',
  image_to_text:   'bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20',
  ocr:             'bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20',
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {status}
    </span>
  );
}

export function TypeBadge({ type }: { type: JobType }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[type]}`}>
      {TYPE_LABEL[type]}
    </span>
  );
}
