/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JURISAI — Authentication Service
 *
 * NOW USING: Supabase Auth (previously Firebase Auth)
 * The API interface remains the same so NO importing component needs changes.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/lib/supabase-browser';

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

// ── Admin configuration ───────────────────────────────────────────
const ADMIN_SETTING_KEY = 'jurisai_admin_email';
const SUPER_ADMIN_EMAIL = 'akmaljaxonkulov00@gmail.com';

function checkIsAdmin(user: AuthUser): boolean {
  if (user.role === 'ADMIN') return true;
  if (user.email === SUPER_ADMIN_EMAIL) return true;
  try {
    const adminEmail = localStorage.getItem(ADMIN_SETTING_KEY);
    if (adminEmail && user.email === adminEmail) return true;
  } catch {}
  return false;
}

export function setAdminEmail(email: string) {
  localStorage.setItem(ADMIN_SETTING_KEY, email);
}

export function getAdminEmail(): string | null {
  return localStorage.getItem(ADMIN_SETTING_KEY);
}

export function ensureSuperAdmin(user: AuthUser): AuthUser {
  if (user.email === SUPER_ADMIN_EMAIL) {
    const adminUser = { ...user, role: 'ADMIN' as const };
    setAdminEmail(user.email);
    return adminUser;
  }
  return user;
}

export function makeCurrentUserAdmin(user: AuthUser): AuthUser {
  const adminUser = { ...user, role: 'ADMIN' as const };
  saveUserToLocal(adminUser);
  setAdminEmail(user.email);
  return adminUser;
}

// ── Helpers ────────────────────────────────────────────────────────

/** Map Supabase user to our AuthUser interface */
function mapSupabaseUser(sbUser: any): AuthUser {
  const meta = sbUser.user_metadata || {};
  return {
    id: sbUser.id,
    email: sbUser.email || '',
    name: meta.name || sbUser.email?.split('@')[0] || 'Foydalanuvchi',
    role: meta.role || 'USER',
    subscription_plan: meta.subscription_plan || 'free',
    subscription_expires_at: meta.subscription_expires_at || undefined,
    avatar: sbUser.avatar || meta.avatar || undefined,
    phone: sbUser.phone || meta.phone || undefined,
  };
}

async function logAuthEvent(email: string, method: string, userId?: string, success?: boolean) {
  try {
    await fetch('/api/log/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, method, userId, success }),
    });
  } catch {}
}

export async function logUsage(userId: string, email: string, name: string, tokens: number, action: string, metadata?: Record<string, any>) {
  try {
    await fetch('/api/log/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, name, tokens, action, metadata }),
    });
  } catch {}
}

// ── Local persistence ────────────────────────────────────────────

function saveUserToLocal(user: AuthUser) {
  const elevatedUser = ensureSuperAdmin(user);
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
  if (typeof document !== 'undefined') {
    document.cookie = `jurisai_auth=1; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
  }

  // Append to registered_users list for admin
  try {
    const stored = localStorage.getItem('registered_users');
    const users = stored ? JSON.parse(stored) : [];
    const existingIdx = users.findIndex((u: any) => u.id === user.id || u.uid === user.id);
    if (existingIdx >= 0) {
      users[existingIdx] = { ...users[existingIdx], ...userWithMeta, last_login: new Date().toISOString() };
    } else {
      users.push(userWithMeta);
    }
    localStorage.setItem('registered_users', JSON.stringify(users));
  } catch {}

  // Sync to Supabase registered_users
  syncUserToSupabase(userWithMeta).catch(() => {});

  return userWithMeta;
}

async function syncUserToSupabase(user: AuthUser): Promise<void> {
  try {
    await fetch('/api/auth/sync-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscription_plan: user.subscription_plan || 'free',
      }),
    });
  } catch {}
}

function clearUserFromLocal() {
  sessionStorage.removeItem('jurisai_user');
  sessionStorage.removeItem('auth_user');
  sessionStorage.removeItem('auth_token');
  localStorage.removeItem('profile_image');
}

// ── AUTH API ─────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<{ success: boolean; data?: AuthUser; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  // Super admin bypass (for development / recovery)
  if (normalizedEmail === SUPER_ADMIN_EMAIL.trim().toLowerCase()) {
    const adminData: AuthUser = {
      id: 'super-admin',
      email: SUPER_ADMIN_EMAIL,
      name: 'Super Admin',
      role: 'ADMIN',
      subscription_plan: 'pro',
    };
    saveUserToLocal(adminData);
    logAuthEvent(SUPER_ADMIN_EMAIL, 'email', 'super-admin', true);
    return { success: true, data: adminData };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data?.user) throw new Error('Foydalanuvchi topilmadi');

    const user = mapSupabaseUser(data.user);
    saveUserToLocal(user);
    logAuthEvent(email, 'email', user.id, true);
    return { success: true, data: user };
  } catch (error: any) {
    let message = 'Login xatosi yuz berdi';
    const code = error?.message || error?.code || '';
    if (code.includes('Invalid login credentials') || code.includes('invalid_credentials')) {
      message = 'Email yoki parol noto\'g\'ri';
    } else if (code.includes('Email not confirmed')) {
      message = 'Email tasdiqlanmagan. Iltimos, pochtangizni tekshiring.';
    } else if (code.includes('rate_limit')) {
      message = 'Juda ko\'p urinishlar. Birozdan so\'ng qayta urinib ko\'ring.';
    }
    return { success: false, error: message };
  }
}

export async function signUp(email: string, password: string, name: string): Promise<{ success: boolean; data?: AuthUser; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: 'USER', subscription_plan: 'free' },
      },
    });
    if (error) throw error;
    if (!data?.user) throw new Error('Ro\'yxatdan o\'tish xatosi');

    const user = mapSupabaseUser({ ...data.user, user_metadata: { name, role: 'USER', subscription_plan: 'free' } });
    saveUserToLocal(user);
    return { success: true, data: user };
  } catch (error: any) {
    let message = 'Ro\'yxatdan o\'tish xatosi';
    const code = error?.message || error?.code || '';
    if (code.includes('already registered') || code.includes('already_exists') || code.includes('duplicate')) {
      message = 'Bu email allaqachon ro\'yxatdan o\'tgan';
    } else if (code.includes('weak_password') || code.includes('6 characters')) {
      message = 'Parol juda oddiy. Kamida 6 belgidan iborat bo\'lishi kerak';
    } else if (code.includes('invalid')) {
      message = 'Email formati noto\'g\'ri';
    }
    return { success: false, error: message };
  }
}

export async function signInWithGoogle(): Promise<{ success: boolean; data?: AuthUser; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    if (data?.url) {
      // Redirect user to Google OAuth page
      window.location.href = data.url;
      return { success: true };
    }
    return { success: false, error: 'Google orqali kirishda xatolik' };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Google orqali kirishda xatolik yuz berdi' };
  }
}

export async function handleRedirectResult(): Promise<{ success: boolean; data?: AuthUser; error?: string }> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      const user = mapSupabaseUser(data.session.user);
      saveUserToLocal(user);
      return { success: true, data: user };
    }
    return { success: false };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Qayta yo\'naltirish xatosi' };
  }
}

export async function signOut(): Promise<void> {
  try {
    const user = getCurrentUser();
    if (user) logAuthEvent(user.email, 'logout', user.id, false);
    await supabase.auth.signOut();
  } catch {
    // Ignore signOut errors
  } finally {
    if (typeof window !== 'undefined') {
      // Clear auth-related data only, preserve user preferences
      sessionStorage.removeItem('jurisai_user');
      sessionStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_token');
      // Clear cookie
      document.cookie = 'jurisai_auth=; path=/; max-age=0; SameSite=Lax';
      window.location.href = '/signin';
    }
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    let message = 'Parolni tiklashda xatolik';
    if (error?.message?.includes('not found')) {
      message = 'Bu email ro\'yxatdan o\'tmagan';
    }
    return { success: false, error: message };
  }
}

export async function updateProfile(updates: Partial<AuthUser>): Promise<{ success: boolean; error?: string }> {
  try {
    const userToUpdate: any = {};
    if (updates.name) userToUpdate.name = updates.name;
    if (updates.role) userToUpdate.role = updates.role;
    if (updates.subscription_plan) userToUpdate.subscription_plan = updates.subscription_plan;
    if (updates.phone) userToUpdate.phone = updates.phone;
    if (updates.avatar) userToUpdate.avatar = updates.avatar;

    const { error } = await supabase.auth.updateUser({ data: userToUpdate });
    if (error) throw error;

    const storedUser = localStorage.getItem('auth_user');
    const existingUser = storedUser ? JSON.parse(storedUser) : {};
    const updatedUser = { ...existingUser, ...updates };
    saveUserToLocal(updatedUser);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Profilni yangilash xatosi' };
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem('jurisai_user') || sessionStorage.getItem('auth_user');
  if (stored) {
    try { return JSON.parse(stored); } catch { return null; }
  }
  return null;
}

export function isAuthenticated(): boolean {
  return !!getCurrentUser() && !!sessionStorage.getItem('auth_token');
}

export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  // First, check sessionStorage
  const storedUser = getCurrentUser();
  if (storedUser) callback(storedUser);

  // Subscribe to Supabase auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      const existingSession = getCurrentUser();
      if (existingSession && existingSession.id === session.user.id) {
        const upgradedUser = ensureSuperAdmin(existingSession);
        if (upgradedUser.role !== existingSession.role) {
          saveUserToLocal(upgradedUser);
          callback(upgradedUser);
        } else {
          callback(existingSession);
        }
        return;
      }
      const user = mapSupabaseUser(session.user);
      const elevatedUser = ensureSuperAdmin(user);
      const savedUser = saveUserToLocal(elevatedUser);
      callback(savedUser);
    } else {
      clearUserFromLocal();
      callback(null);
    }
  });

  return () => subscription.unsubscribe();
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
  onAuthChange,
};
