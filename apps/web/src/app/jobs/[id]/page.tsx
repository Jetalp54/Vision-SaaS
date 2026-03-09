// Server component — required for generateStaticParams with static export.
// Redirects legacy /jobs/[id] to /app/history/[id] via client-side navigation.
import JobDetailRedirectClient from './JobDetailRedirectClient';

// Required for Next.js static export (output: 'export').
export function generateStaticParams() {
  return [];
}

export default function JobDetailPage() {
  return <JobDetailRedirectClient />;
}
