import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCA5cKruT8J4jcbGO5vSrDMkP7z8QePO-g",
  authDomain: "jurisai-7e1e7.firebaseapp.com",
  projectId: "jurisai-7e1e7",
  storageBucket: "jurisai-7e1e7.firebasestorage.app",
  messagingSenderId: "224881299770",
  appId: "1:224881299770:web:1b6a60c3d1b13dbb28c003",
  measurementId: "G-Z2XK42WQZ9"
};

// Initialize Firebase (SSR-safe - only on client)
let app: FirebaseApp | undefined;
let auth: Auth | undefined;

if (typeof window !== 'undefined') {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    
    // Log successful initialization
    console.log('[Firebase] Initialized successfully:', firebaseConfig.projectId);
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
  }
}

export { app, auth };

// For Analytics - only import and use on client side
export async function getAnalyticsClient() {
  if (typeof window === 'undefined') return null;
  try {
    const { getAnalytics } = await import('firebase/analytics');
    if (app) {
      return getAnalytics(app);
    }
  } catch (error) {
    console.warn('[Firebase] Analytics not available:', error);
  }
  return null;
}
