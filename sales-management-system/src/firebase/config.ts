import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBZCNS-RO3N2cKvN5UcJoIXejpqcBG9OXE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sales-management-system-2b9db.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sales-management-system-2b9db",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sales-management-system-2b9db.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "906466667644",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:906466667644:web:c2c5b1fa92be3cc29edf75"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;