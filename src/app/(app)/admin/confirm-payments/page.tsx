'use client';

/**
 * Debug mode: Redirects disabled.
 * This page previously redirected to /notifications.
 */
export default function RedirectPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-xl font-bold mb-2">Debug Mode: Redirects Disabled</h1>
      <p className="text-muted-foreground mb-4">You are currently on the confirm-payments route.</p>
      <a href="/notifications" className="text-primary hover:underline font-medium">Click here to go to Notifications manually</a>
    </div>
  );
}
