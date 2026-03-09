'use client';

// Legacy /jobs/[id] → redirects to /app/history/[id] client-side.
// Must be a client component because next/navigation's redirect() is
// incompatible with output: 'export'. useRouter handles this at runtime.
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function JobDetailRedirectClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/app/history/${id}`);
  }, [id, router]);

  return null;
}
