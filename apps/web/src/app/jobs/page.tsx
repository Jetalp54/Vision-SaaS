// Redirects legacy /jobs route to the new /app/history route
import { redirect } from 'next/navigation';
export default function JobsRedirect() {
  redirect('/app/history');
}
