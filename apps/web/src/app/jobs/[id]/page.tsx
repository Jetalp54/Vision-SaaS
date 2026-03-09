// Redirects legacy /jobs/[id] route to the new /app/history/[id] route
import { redirect } from 'next/navigation';
export default function JobDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/app/history/${params.id}`);
}
