// Server component — required for generateStaticParams with static export.
// All data fetching happens client-side in HistoryDetailClient.
import HistoryDetailClient from './HistoryDetailClient';

// Required for Next.js static export (output: 'export').
// dynamicParams = false tells Next.js not to try to render unknown params at build time.
// generateStaticParams returns a placeholder so Next.js generates the shell HTML.
// The actual job ID is read at runtime via useParams() in HistoryDetailClient.
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function HistoryDetailPage() {
  return <HistoryDetailClient />;
}
