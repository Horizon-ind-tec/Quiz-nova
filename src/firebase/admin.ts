
'use server';

import { initializeApp, getApps, App, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

// A map to cache initialized admin apps by a given name.
const adminApps: Record<string, App> = {};

/**
 * Initializes and returns a Firebase Admin SDK App instance.
 * It ensures that an app is only initialized once for a given name.
 * 
 * @param appName The unique name for the Firebase Admin App instance.
 * @returns The initialized Firebase Admin App.
 * @throws {Error} If the Firebase Admin SDK cannot be initialized.
 */
function getAdminApp(appName: string): App {
    if (adminApps[appName]) {
        return adminApps[appName];
    }
    
    // If an app with the default name exists and we are trying to get the default, return it.
    if (appName === '[DEFAULT]' && getApps().length > 0) {
        const defaultApp = getApps().find(app => app.name === '[DEFAULT]');
        if (defaultApp) {
            adminApps[appName] = defaultApp;
            return defaultApp;
        }
    }
    
    // If an app with the given name already exists, return it.
    const existingApp = getApps().find(app => app.name === appName);
    if (existingApp) {
        adminApps[appName] = existingApp;
        return existingApp;
    }

    let app: App;

    // Check for explicit credentials in environment variables
    if (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_PROJECT_ID) {
        app = initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        }, appName);
    } else {
        // Otherwise, try to use Application Default Credentials
        try {
            app = initializeApp({
                credential: applicationDefault(),
                projectId: firebaseConfig.projectId,
            }, appName);
        } catch (e) {
            console.error(`Firebase Admin SDK initialization failed for app "${appName}".`, e);
            console.error("Please ensure you have set the necessary environment variables (FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_PROJECT_ID) or are running in a configured Google Cloud environment.");
            throw new Error('Firebase Admin SDK not initialized. Server environment is not configured.');
        }
    }
    
    adminApps[appName] = app;
    return app;
}


/**
 * Returns an initialized Firestore instance for a given Admin App.
 * 
 * @param appName The unique name for the Firebase Admin App instance.
 * @returns The initialized Firestore instance.
 */
export function getAdminDb(appName: string = 'default-admin-app'): Firestore {
    const app = getAdminApp(appName);
    return getFirestore(app);
}

    