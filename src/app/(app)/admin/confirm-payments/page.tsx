'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * This page is now a redirect to /notifications to avoid code duplication.
 * The functionality has been consolidated there.
 */
export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/notifications');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="ml-4 text-muted-foreground">Redirecting to notifications...</p>
    </div>
  );
}
