// Redirects legacy /jobs/[id] route to the new /app/history/[id] route
import { redirect } from 'next/navigation';
export default async function JobDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/app/history/${id}`);
}
