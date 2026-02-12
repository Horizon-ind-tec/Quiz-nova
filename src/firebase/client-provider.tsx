'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { Loader2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // Safety timeout: If initialization takes more than 8 seconds, show a retry option
    const timer = setTimeout(() => {
      if (!firebaseServices) setTimedOut(true);
    }, 8000);

    const initFirebase = async () => {
      try {
        const services = await initializeFirebase();
        setFirebaseServices(services);
      } catch (err) {
        console.error('Firebase initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown initialization error');
      }
    };

    initFirebase();
    return () => clearTimeout(timer);
  }, [firebaseServices]);

  const handleRetry = () => {
    window.location.reload();
  };

  // Show a detailed error screen if initialization completely fails
  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-6 text-center bg-background">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <RefreshCcw className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Connection Error</h1>
        <p className="text-muted-foreground max-w-sm mb-6">
          We couldn't connect to the QuizNova servers. Please check your internet connection or try again.
        </p>
        <div className="bg-muted p-3 rounded text-xs font-mono mb-6 max-w-xs overflow-auto">
            {error}
        </div>
        <Button onClick={handleRetry} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Retry Connection
        </Button>
      </div>
    );
  }

  // Show the loader while Firebase services are being initialized
  if (!firebaseServices) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background">
        <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        </div>
        <div className="text-center space-y-2 px-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Initializing QuizNova...</h2>
            <p className="text-sm text-muted-foreground animate-pulse font-medium">
                {timedOut ? "This is taking longer than usual..." : "Preparing your learning dashboard."}
            </p>
            {timedOut && (
                <Button variant="ghost" size="sm" onClick={handleRetry} className="mt-4 text-primary underline">
                    Reload Page
                </Button>
            )}
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
