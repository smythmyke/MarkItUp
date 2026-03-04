import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase config — public client-side values (not secrets)
const firebaseConfig = {
  apiKey: 'AIzaSyAhevK2vAtf59lAWo6BdtN6eGLkys1Bwf8',
  authDomain: 'markitup-ext.firebaseapp.com',
  projectId: 'markitup-ext',
  storageBucket: 'markitup-ext.firebasestorage.app',
  messagingSenderId: '561880138172',
  appId: '1:561880138172:web:ad72acafae5358b150abb9',
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

// Local persistence for Chrome extension context
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Error setting auth persistence:', error);
  });
}

const db = getFirestore(app);

export { app, auth, db };
