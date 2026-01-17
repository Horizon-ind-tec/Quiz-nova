'use server';

import { initializeApp, getApps, App, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

const ADMIN_APP_NAME = '__ADMIN_APP__';

/**
 * Initializes and returns a singleton Firebase Admin SDK App instance.
 * It ensures that an app is only initialized once.
 */
function getInitializedAdminApp(): App {
    // Check if the app is already initialized
    const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
    if (existingApp) {
        return existingApp;
    }

    // If not initialized, create a new instance.
    
    // Check for explicit credentials in environment variables
    if (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_PROJECT_ID) {
        return initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        }, ADMIN_APP_NAME);
    } 
    
    // Otherwise, try to use Application Default Credentials.
    // This is the standard for environments like Cloud Run, Cloud Functions, etc.
    try {
        return initializeApp({
            credential: applicationDefault(),
            projectId: firebaseConfig.projectId,
        }, ADMIN_APP_NAME);
    } catch (e) {
        // Fallback for environments where the default app might already exist without a specific name
        if (getApps().length > 0) {
            const defaultApp = getApps().find(app => app.name === '[DEFAULT]');
            if (defaultApp) return defaultApp;
        }

        console.error(`Firebase Admin SDK initialization failed for app "${ADMIN_APP_NAME}".`, e);
        console.error("Please ensure you have set the necessary environment variables or are running in a configured Google Cloud environment.");
        throw new Error('Firebase Admin SDK not initialized. Server environment is not configured.');
    }
}


/**
 * Returns an initialized Firestore instance for the admin app.
 * @returns The initialized Firestore instance.
 */
export async function getAdminDb(): Promise<Firestore> {
    const app = getInitializedAdminApp();
    return getFirestore(app);
}
