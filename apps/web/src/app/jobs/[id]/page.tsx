// Server component — required for generateStaticParams with static export.
// Redirects legacy /jobs/[id] to /app/history/[id] via client-side navigation.
import JobDetailRedirectClient from './JobDetailRedirectClient';

// Required for Next.js static export (output: 'export').
// dynamicParams = false + a placeholder param generates the static shell HTML.
// The actual redirect happens client-side in JobDetailRedirectClient via useParams().
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function JobDetailPage() {
  return <JobDetailRedirectClient />;
}
