'use client';
import { initializeFirebase } from '.';
import { FirebaseProvider, FirebaseContextValue } from './provider';
import React, { useState, useEffect } from 'react';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebase, setFirebase] = useState<FirebaseContextValue | null>(null);

  useEffect(() => {
    // Initialize Firebase only on the client side
    const firebaseApp = initializeFirebase();
    setFirebase(firebaseApp);
  }, []);

  if (!firebase) {
    // You can render a loader here if needed
    return null;
  }

  return <FirebaseProvider {...firebase}>{children}</FirebaseProvider>;
}
