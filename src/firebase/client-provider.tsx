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
    if (firebaseServices) return;

    const timer = setTimeout(() => {
      if (!firebaseServices) setTimedOut(true);
    }, 10000);

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

  if (!firebaseServices) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background">
        <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary/30" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        </div>
        <div className="text-center space-y-2 px-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Initializing QuizNova</h2>
            <p className="text-xs text-muted-foreground font-medium max-w-[200px] mx-auto">
                {timedOut ? "Network is slow, please wait..." : "Preparing your learning journey."}
            </p>
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
