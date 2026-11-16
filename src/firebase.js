import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBZDyo1uyVP2S9BZFu8t12roH3iPdU-TZY",
  authDomain: "bge-progress.firebaseapp.com",
  projectId: "bge-progress",
  storageBucket: "bge-progress.firebasestorage.app",
  messagingSenderId: "29876816244",
  appId: "1:29876816244:web:827e8bf74e8bb977830421",
  measurementId: "G-6P9FMZ4KR9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});