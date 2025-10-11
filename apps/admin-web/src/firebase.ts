
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase Emulator configuration for local development
const firebaseConfig = {
  apiKey: 'AIzaSyDemo-ProjectRoom-Key',
  authDomain: 'demo-projectroom.firebaseapp.com',
  projectId: 'demo-projectroom',
  storageBucket: 'demo-projectroom.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:demo-projectroom',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Connect to Firebase Emulator in development
const useEmulator = true; // Set to false for production
if (useEmulator && typeof window !== 'undefined') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  console.log('✅ Connected to Firebase Auth Emulator');
}

export default app;
