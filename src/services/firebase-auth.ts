import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  subscription_plan?: string;
  subscription_expires_at?: string;
  avatar?: string;
  phone?: string;
}

// Map Firebase user to our AuthUser
function mapFirebaseUser(firebaseUser: FirebaseUser, additionalData?: Partial<AuthUser>): AuthUser {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Foydalanuvchi',
    role: 'USER',
    subscription_plan: 'free',
    avatar: firebaseUser.photoURL || undefined,
    ...additionalData
  };
}

// Save user to localStorage for cross-component access
function saveUserToLocal(user: AuthUser) {
  localStorage.setItem('jurisai_user', JSON.stringify(user));
  localStorage.setItem('auth_user', JSON.stringify(user));
  localStorage.setItem('auth_token', user.id);
}

function clearUserFromLocal() {
  localStorage.removeItem('jurisai_user');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('profile_image');
}

// Sign in with email/password
export async function signIn(email: string, password: string): Promise<{ success: boolean; data?: AuthUser; error?: string }> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = mapFirebaseUser(result.user);
    saveUserToLocal(user);
    return { success: true, data: user };
  } catch (error: any) {
    let message = 'Login xatosi yuz berdi';
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        message = 'Email yoki parol noto\'g\'ri';
        break;
      case 'auth/user-disabled':
        message = 'Hisobingiz bloklangan';
        break;
      case 'auth/too-many-requests':
        message = 'Juda ko\'p urinishlar. Birozdan so\'ng qayta urinib ko\'ring';
        break;
      case 'auth/invalid-email':
        message = 'Email formati noto\'g\'ri';
        break;
    }
    return { success: false, error: message };
  }
}

// Sign up with email/password
export async function signUp(email: string, password: string, name: string): Promise<{ success: boolean; data?: AuthUser; error?: string }> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Update profile with display name
    await firebaseUpdateProfile(result.user, { displayName: name });
    const user = mapFirebaseUser(result.user, { name });
    saveUserToLocal(user);
    return { success: true, data: user };
  } catch (error: any) {
    let message = 'Ro\'yxatdan o\'tish xatosi';
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Bu email allaqachon ro\'yxatdan o\'tgan';
        break;
      case 'auth/weak-password':
        message = 'Parol juda oddiy. Kamida 6 belgidan iborat bo\'lishi kerak';
        break;
      case 'auth/invalid-email':
        message = 'Email formati noto\'g\'ri';
        break;
    }
    return { success: false, error: message };
  }
}

// Sign in with Google
export async function signInWithGoogle(): Promise<{ success: boolean; data?: AuthUser; error?: string }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = mapFirebaseUser(result.user);
    saveUserToLocal(user);
    return { success: true, data: user };
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Kirish oynasi yopildi' };
    }
    if (error.code === 'auth/popup-blocked') {
      return { success: false, error: 'Brauzeringizda pop-up blokerni o\'chiring va qayta urinib ko\'ring' };
    }
    return { success: false, error: 'Google orqali kirishda xatolik yuz berdi' };
  }
}

// Sign out
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } finally {
    clearUserFromLocal();
  }
}

// Send password reset email
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    let message = 'Parolni tiklashda xatolik';
    if (error.code === 'auth/user-not-found') {
      message = 'Bu email ro\'yxatdan o\'tmagan';
    }
    return { success: false, error: message };
  }
}

// Update user profile
export async function updateProfile(updates: Partial<AuthUser>): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'Foydalanuvchi tizimga kirmagan' };
    }
    
    // Update Firebase profile
    if (updates.name) {
      await firebaseUpdateProfile(currentUser, { displayName: updates.name });
    }

    // Get existing local data
    const storedUser = localStorage.getItem('auth_user');
    const existingUser = storedUser ? JSON.parse(storedUser) : {};
    const updatedUser = { ...existingUser, ...updates };
    
    saveUserToLocal(updatedUser);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Profilni yangilash xatosi' };
  }
}

// Get current user from localStorage
export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('jurisai_user') || localStorage.getItem('auth_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getCurrentUser() && !!localStorage.getItem('auth_token');
}

// Subscribe to auth state changes
export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      const user = mapFirebaseUser(firebaseUser);
      saveUserToLocal(user);
      callback(user);
    } else {
      clearUserFromLocal();
      callback(null);
    }
  });
  return unsubscribe;
}

export const firebaseAuth = {
  signIn,
  signUp,
  signInWithGoogle,
  signOut,
  resetPassword,
  updateProfile,
  getCurrentUser,
  isAuthenticated,
  onAuthChange
};
