import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Lấy config bí mật từ biến môi trường (.env)
export function getStoredFirebaseConfig(): FirebaseConfig | null {
  const envConfig: FirebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };

  if (envConfig.projectId && envConfig.apiKey) {
    return envConfig;
  }

  return null;
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getFirebaseInstance(): { app: FirebaseApp | null; db: Firestore | null; isConfigured: boolean } {
  const config = getStoredFirebaseConfig();

  if (!config || !config.projectId || !config.apiKey) {
    return { app: null, db: null, isConfigured: false };
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    return { app, db, isConfigured: true };
  } catch (err) {
    console.warn('Firebase init warning:', err);
    return { app: null, db: null, isConfigured: false };
  }
}
