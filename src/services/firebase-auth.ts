import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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

// Admin email - kim admin bo'lishi mumkin
const ADMIN_SETTING_KEY = 'jurisai_admin_email';

// Check if user should be admin
function checkIsAdmin(user: AuthUser): boolean {
  if (user.role === 'ADMIN') return true;
  // Super admin auto-elevation
  if (user.email === SUPER_ADMIN_EMAIL) return true;
  try {
    const adminEmail = localStorage.getItem(ADMIN_SETTING_KEY);
    if (adminEmail && user.email === adminEmail) {
      return true;
    }
  } catch {}
  return false;
}

// Super Admin auto-elevation — hardcoded for production
const SUPER_ADMIN_EMAIL = 'akmaljaxonkulov00@gmail.com';

// Set admin email (call this from admin panel)
export function setAdminEmail(email: string) {
  localStorage.setItem(ADMIN_SETTING_KEY, email);
}

export function getAdminEmail(): string | null {
  return localStorage.getItem(ADMIN_SETTING_KEY);
}

// Auto-elevate super admin on login
export function ensureSuperAdmin(user: AuthUser): AuthUser {
  if (user.email === SUPER_ADMIN_EMAIL) {
    const adminUser = { ...user, role: 'ADMIN' as const };
    setAdminEmail(user.email);
    return adminUser;
  }
  return user;
}

// Give current user admin role
export function makeCurrentUserAdmin(user: AuthUser): AuthUser {
  const adminUser = { ...user, role: 'ADMIN' as const };
  saveUserToLocal(adminUser);
  setAdminEmail(user.email);
  return adminUser;
}

// Save user to sessionStorage for cross-component access (auto-logout on close)
function saveUserToLocal(user: AuthUser) {
  // Auto-elevate super admin
  const elevatedUser = ensureSuperAdmin(user);
  // Check if this user should be admin
  const effectiveRole = checkIsAdmin(elevatedUser) ? 'ADMIN' : elevatedUser.role;
  const userWithRole = { ...elevatedUser, role: effectiveRole };
  const userWithMeta = {
    ...userWithRole,
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
  };
  sessionStorage.setItem('jurisai_user', JSON.stringify(userWithMeta));
  sessionStorage.setItem('auth_user', JSON.stringify(userWithMeta));
  sessionStorage.setItem('auth_token', user.id);
  
  // Append to registered users list for admin analytics
  try {
    const stored = localStorage.getItem('registered_users');
    const users = stored ? JSON.parse(stored) : [];
    // Check if user already exists, if so update, else add
    const existingIdx = users.findIndex((u: any) => u.id === user.id || u.uid === user.id);
    if (existingIdx >= 0) {
      users[existingIdx] = { ...users[existingIdx], ...userWithMeta, last_login: new Date().toISOString() };
    } else {
      users.push(userWithMeta);
    }
    localStorage.setItem('registered_users', JSON.stringify(users));
  } catch (e) {
    // ignore localStorage errors
  }
  return userWithMeta;
}

function clearUserFromLocal() {
  sessionStorage.removeItem('jurisai_user');
  sessionStorage.removeItem('auth_user');
  sessionStorage.removeItem('auth_token');
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

// Sign in with Google - popup first, redirect as fallback
export async function signInWithGoogle(): Promise<{ success: boolean; data?: AuthUser; error?: string }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    if (!auth) {
      return { success: false, error: 'Firebase sozlanmagan. Iltimos, qayta urinib ko\'ring.' };
    }
    
    const result = await signInWithPopup(auth, provider);
    const user = mapFirebaseUser(result.user);
    saveUserToLocal(user);
    return { success: true, data: user };
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Kirish oynasi yopildi' };
    }
    if (error.code === 'auth/popup-blocked') {
      // Try redirect fallback
      try {
        if (auth) {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await signInWithRedirect(auth, provider);
          return { success: true };
        }
      } catch (redirectError: any) {
        return { success: false, error: 'Brauzeringizda pop-up blokerni o\'chiring va qayta urinib ko\'ring' };
      }
      return { success: false, error: 'Brauzeringizda pop-up blokerni o\'chiring va qayta urinib ko\'ring' };
    }
    if (error.code === 'auth/unauthorized-domain') {
      return { success: false, error: 'Bu domen Firebase autentifikatsiyasi uchun ruxsat etilmagan. Firebase konsolida domenni qo\'shing.' };
    }
    if (error.code === 'auth/operation-not-allowed') {
      return { success: false, error: 'Google orqali kirish yoqilmagan. Administratorga murojaat qiling.' };
    }
    if (error.code === 'auth/account-exists-with-different-credential') {
      return { success: false, error: 'Bu email boshqa usul bilan ro\'yxatdan o\'tgan. Email/parol orqali kiring.' };
    }
    console.error('[Firebase] Google sign-in error:', error.code, error.message);
    return { success: false, error: 'Google orqali kirishda xatolik yuz berdi. Qayta urinib ko\'ring.' };
  }
}

// Handle redirect result (call this on app startup)
export async function handleRedirectResult(): Promise<{ success: boolean; data?: AuthUser; error?: string }> {
  try {
    if (!auth) return { success: false };
    const result = await getRedirectResult(auth);
    if (result?.user) {
      const user = mapFirebaseUser(result.user);
      saveUserToLocal(user);
      return { success: true, data: user };
    }
    return { success: false };
  } catch (error: any) {
    console.error('[Firebase] Redirect result error:', error.code, error.message);
    return { success: false, error: error.message || 'Qayta yo\'naltirish xatosi' };
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

// Get current user from sessionStorage
export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem('jurisai_user') || sessionStorage.getItem('auth_user');
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
  return !!getCurrentUser() && !!sessionStorage.getItem('auth_token');
}

// Subscribe to auth state changes
export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  // First, check if we have a sessionStorage user (page refresh in same tab)
  const storedUser = getCurrentUser();
  if (storedUser) {
    callback(storedUser);
  }
  
  // Subscribe to Firebase auth state changes
  // With browserSessionPersistence, auth is auto-cleared on tab/browser close
  // No need for manual force sign-out — Firebase handles it
  const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      // Firebase has a user — sync to sessionStorage (restore or login)
      const existingSession = getCurrentUser();
      
      // If sessionStorage already has this user, just confirm it
      if (existingSession && existingSession.id === firebaseUser.uid) {
        callback(existingSession);
        return;
      }
      
      // New login or different session — save to sessionStorage
      const user = mapFirebaseUser(firebaseUser);
      const elevatedUser = ensureSuperAdmin(user);
      const savedUser = saveUserToLocal(elevatedUser);
      callback(savedUser);
    } else {
      // Firebase auth cleared (logout or session expired) — clear sessionStorage
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
  handleRedirectResult,
  signOut,
  resetPassword,
  updateProfile,
  getCurrentUser,
  isAuthenticated,
  onAuthChange
};
