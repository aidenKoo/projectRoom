
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// IMPORTANT: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: 'AIzaSy...YOUR_API_KEY',
  authDomain: 'your-project-id.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project-id.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc...YOUR_APP_ID',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
