// Server component — required for generateStaticParams with static export.
// All data fetching happens client-side in HistoryDetailClient.
import HistoryDetailClient from './HistoryDetailClient';

// Required for Next.js static export (output: 'export').
// Returns empty array because job IDs are dynamic/user-specific;
// the client component fetches data at runtime via useParams() + API calls.
export function generateStaticParams() {
  return [];
}

export default function HistoryDetailPage() {
  return <HistoryDetailClient />;
}
