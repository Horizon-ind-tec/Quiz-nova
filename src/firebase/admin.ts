
'use server';

import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

// Define a unique name for the admin app to avoid conflicts.
const ADMIN_APP_NAME = 'QUIZNOVA_ADMIN_APP';

/**
 * Initializes and returns a singleton Firebase Admin SDK App instance.
 * This function is designed to be safe to call multiple times.
 */
const getAdminApp = (): App => {
  // Check if the app is already initialized to avoid re-initializing.
  const existingApp = getApps().find((app) => app.name === ADMIN_APP_NAME);
  if (existingApp) {
    return existingApp;
  }

  // If not initialized, create a new instance using Application Default Credentials.
  // This is the standard for server environments like Cloud Run and Firebase App Hosting.
  try {
    return initializeApp(
      {
        credential: applicationDefault(),
        projectId: firebaseConfig.projectId,
      },
      ADMIN_APP_NAME
    );
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization failed:', error);
    // This error is critical and indicates a server environment configuration problem.
    throw new Error('Firebase Admin SDK not initialized. Server environment is not configured correctly.');
  }
};

/**
 * Returns an initialized Firestore instance for the admin app.
 * This is the single entry point for accessing the admin Firestore instance
 * throughout the server-side of the application.
 */
export async function getAdminDb(): Promise<Firestore> {
  const app = getAdminApp();
  return getFirestore(app);
}
