import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCA5cKruT8J4jcbGO5vSrDMkP7z8QePO-g",
  authDomain: "jurisai-7e1e7.firebaseapp.com",
  projectId: "jurisai-7e1e7",
  storageBucket: "jurisai-7e1e7.firebasestorage.app",
  messagingSenderId: "224881299770",
  appId: "1:224881299770:web:1b6a60c3d1b13dbb28c003",
  measurementId: "G-Z2XK42WQZ9"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { app, auth };
