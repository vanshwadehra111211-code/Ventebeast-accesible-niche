import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
};

if (!getApps().length && firebaseConfig.apiKey) {
  initializeApp(firebaseConfig);
}

export const auth = () => getAuth();
export const provider = () => new GoogleAuthProvider();
export const signInWithGooglePopup = async () => signInWithPopup(getAuth(), new GoogleAuthProvider());
