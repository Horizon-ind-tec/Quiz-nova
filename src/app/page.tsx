'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // For a static export intended for a mobile wrapper,
    // we want to go straight to the main content.
    // The dashboard and other protected routes will handle auth checks.
    router.replace('/dashboard');
  }, [router]);

  // Render a loader while the redirect is happening.
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
    </div>
  );
}
