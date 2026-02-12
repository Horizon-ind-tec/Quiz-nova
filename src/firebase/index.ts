'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Initializes Firebase SDKs.
 * We wrap persistence in a try-catch because it can fail in certain environments
 * (like private browsing or restricted webviews) and we don't want it to block the app.
 */
export async function initializeFirebase() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  
  try {
    // Set persistence to local to keep the user signed in across browser sessions.
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.warn('Firebase persistence initialization failed, falling back to memory:', error);
  }
  
  return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
