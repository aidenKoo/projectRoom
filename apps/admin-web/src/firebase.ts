import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDykkJoWgo1XrH3qT_wbHmHHT-h6zepb8",
  authDomain: "projectroom-bd5c9.firebaseapp.com",
  projectId: "projectroom-bd5c9",
  storageBucket: "projectroom-bd5c9.firebasestorage.app",
  messagingSenderId: "131574076191",
  appId: "1:131574076191:web:5cfc7fe6c9acd534c1962a",
  measurementId: "G-N9TVBLJQ24"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
