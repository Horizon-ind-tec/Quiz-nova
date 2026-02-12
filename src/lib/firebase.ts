import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Custom Firebase configuration as requested for direct connectivity.
 */
const firebaseConfig = {
  apiKey: "AIzaSyBIrVhWKjMHcAEhtdh6AqJUZLm-jdxaaBs",
  authDomain: "studio-770359382-db111.firebaseapp.com",
  projectId: "studio-770359382-db111",
  storageBucket: "studio-770359382-db111.firebasestorage.app",
  messagingSenderId: "79648401698",
  appId: "1:79648401698:web:29e11f54e360d730e2dd7b",
};

// Singleton initialization pattern as requested
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
