import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBIrVhWKjMHcAEhtdh6AqJUZLm-jdxaaBs",
  authDomain: "studio-770359382-db111.firebaseapp.com",
  projectId: "studio-770359382-db111",
  storageBucket: "studio-770359382-db111.firebasestorage.app",
  messagingSenderId: "79648401698",
  appId: "1:79648401698:web:29e11f54e360d730e2dd7b",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
