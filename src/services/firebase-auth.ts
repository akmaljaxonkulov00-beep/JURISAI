/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JURISAI — Authentication Service
 *
 * NOW USING: Supabase Auth (previously Firebase Auth)
 * The API interface remains the same so NO importing component needs changes.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { supabase } from '@/lib/supabase-browser'
import { isAdminRole, normalizeRole } from '@/lib/roles'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  subscription_plan?: string
  subscription_expires_at?: string
  avatar?: string
  phone?: string
  /** Kirish usuli: email | google | ... */
  provider?: string
  /** OAuth duplicate birlashtirilganda true — session user o'chirilgan bo'ladi */
  accountMerged?: boolean
}

// ── Admin configuration ───────────────────────────────────────────
// Rol manbai — Supabase registered_users (database). Hardcoded email
// orqali admin aniqlanmaydi: ADMIN/SUPER_ADMIN qiymatlari isAdminRole()
// orqali tan olinadi.

function checkIsAdmin(user: AuthUser): boolean {
  return isAdminRole(user.role)
}

export function setAdminEmail(email: string) {
  localStorage.setItem('jurisai_admin_email', email)
}

export function getAdminEmail(): string | null {
  return localStorage.getItem('jurisai_admin_email')
}

export function ensureSuperAdmin(user: AuthUser): AuthUser {
  // Rol database'dan keladi — bu yerda faqat admin rolini ichki formatga keltiramiz.
  return isAdminRole(user.role) ? { ...user, role: 'ADMIN' as const } : user
}

export function makeCurrentUserAdmin(user: AuthUser): AuthUser {
  const adminUser = { ...user, role: 'ADMIN' as const }
  saveUserToLocal(adminUser)
  setAdminEmail(user.email)
  return adminUser
}

// ── Helpers ────────────────────────────────────────────────────────

/** Map Supabase user to our AuthUser interface */
function mapSupabaseUser(sbUser: any): AuthUser {
  const meta = sbUser.user_metadata || {}
  // Provider: auth.user.app_metadata.provider — Supabase tomonidan yoziladi
  // (email | google | github | ...). Eski yozuvlarda bo'lmasa 'email'.
  const appMeta = sbUser.app_metadata || {}
  const providers = Array.isArray(appMeta.providers) ? appMeta.providers : []
  const provider =
    (typeof appMeta.provider === 'string' && appMeta.provider) || providers[0] || 'email'
  return {
    id: sbUser.id,
    email: sbUser.email || '',
    name: meta.name || sbUser.email?.split('@')[0] || 'Foydalanuvchi',
    role: meta.role || 'USER',
    subscription_plan: meta.subscription_plan || 'free',
    subscription_expires_at: meta.subscription_expires_at || undefined,
    avatar: sbUser.avatar || meta.avatar || undefined,
    phone: sbUser.phone || meta.phone || undefined,
    provider,
  }
}

/**
 * Foydalanuvchi rolini ISHONCHLI manbadan aniqlaydi:
 *   1. Supabase registered_users jadvali (role, subscription) — asosiy manba
 *   2. Rol auth user_metadata ga yoziladi — sahifa yangilanganda ham saqlanadi
 *   3. Manba topilmasa — email asosidagi admin ro'yxati (ensureSuperAdmin)
 */
async function resolveUserRole(user: AuthUser): Promise<AuthUser> {
  const lookup = async () => {
    const params = new URLSearchParams()
    if (user.email) params.set('email', user.email)
    if (user.id && user.id !== 'super-admin') params.set('userId', user.id)
    const res = await fetch('/api/auth/user-role?' + params.toString(), {
      cache: 'no-cache',
    })
    if (!res.ok) throw new Error('user-role API failed: ' + res.status)
    return res.json()
  }

  try {
    let result = await lookup()
    // Bir martalik retry — tarmoq/API uzilishi holatida
    if (!result || !result.success || !result.data) {
      await new Promise(r => setTimeout(r, 600))
      result = await lookup()
    }

    if (result.success && result.data) {
      const d = result.data
      // Rol database'dan olinadi — ADMIN/SUPER_ADMIN/admin/super_admin
      // qiymatlarining barchasi admin deb tan olinadi (API normalizatsiya qilgan).
      const dbRole: 'USER' | 'ADMIN' = normalizeRole(d.role)
      const resolved: AuthUser = {
        ...user,
        role: dbRole,
      }
      if (d.subscription_plan) resolved.subscription_plan = d.subscription_plan
      if (d.subscription_expires_at) resolved.subscription_expires_at = d.subscription_expires_at
      if (d.name) resolved.name = d.name

      // ── Google identity linking ────────────────────────────────────────────
      // Google OAuth orqali kirganda Supabase automatic linking ishlamagan
      // bo'lsa (auth.identities bo'sh eski userlar), email bir xil bo'lsa ham
      // YANGI user yaratiladi (duplicate). Buni aniqlaymiz:
      //   API email fallback orqali rolni topgan — demak DB'dagi row bor,
      //   lekin uning id si session user id dan FARQ qilishi mumkin.
      if (d.id && d.id !== user.id) {
        const merged = await linkDuplicateIdentity(user.id, user.email, d.id).catch(() => false)
        if (merged) {
          // Session user (duplicate) o'chirildi — rol endi canonical user'dan
          resolved.id = d.id
          resolved.accountMerged = true
        }
      }

      // Rol va premium ma'lumotni auth user_metadata ga yozamiz —
      // shunda sahifa yangilanganda ham admin roli yo'qolmaydi.
      try {
        await supabase.auth.updateUser({
          data: {
            role: resolved.role,
            subscription_plan: resolved.subscription_plan || 'free',
            subscription_expires_at: resolved.subscription_expires_at || null,
            name: resolved.name,
          },
        })
      } catch {}
      return resolved
    }
  } catch {
    // API'ga ulanishda xato — pastdagi fallback
  }

  // Fallback: user_metadata dagi rol (avvalgi resolveUserRole DB'dan yozgan).
  // Hardcoded email ishlatilmaydi — faqat role qiymatiga qaraladi.
  return ensureSuperAdmin({ ...user, role: normalizeRole(user.role) })
}

/**
 * Supabase session foydalanuvchisini to'liq yakunlaydi:
 *   map → rol aniqlash → lokal saqlash. OAuth callback va login oqimlari
 *   buni chaqiradi. Qaytarilgan AuthUser'ning role maydoni ishonchli.
 */
export async function finalizeUserSession(sbUser: any): Promise<AuthUser> {
  const user = mapSupabaseUser(sbUser)
  const resolved = await resolveUserRole(user)
  const saved = saveUserToLocal(resolved)
  // Google OAuth kirishini auth_logs ga yozamiz (admin kirish loglari uchun)
  logAuthEvent(saved.email, 'google', saved.id, true).catch(() => {})
  return saved
}

/**
 * OAuth duplicate userni mavjud (email/parol) user bilan birlashtiradi.
 * Supabase admin API'da identity ko'chirish uchun maxsus endpoint yo'q,
 * shuning uchun migration 20250803 dagi public.merge_duplicate_users()
 * SQL funksiyasini RPC orqali chaqiramiz.
 *
 * @returns true — birlashtirildi (session user o'chirilgan)
 */
async function linkDuplicateIdentity(
  sessionUserId: string,
  email: string,
  canonicalUserId: string
): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/link-identity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userId: sessionUserId }),
    })
    if (!res.ok) return false
    const json = await res.json()
    return !!(json.success && json.merged)
  } catch {
    return false
  }
}

async function logAuthEvent(email: string, method: string, userId?: string, success?: boolean) {
  try {
    await fetch('/api/log/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, method, userId, success }),
    })
  } catch {}
}

export async function logUsage(
  userId: string,
  email: string,
  name: string,
  tokens: number,
  action: string,
  metadata?: Record<string, any>
) {
  try {
    await fetch('/api/log/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, name, tokens, action, metadata }),
    })
  } catch {}
}

// ── Local persistence ────────────────────────────────────────────

function saveUserToLocal(user: AuthUser) {
  const elevatedUser = ensureSuperAdmin(user)
  const effectiveRole = checkIsAdmin(elevatedUser) ? 'ADMIN' : elevatedUser.role
  const userWithRole = { ...elevatedUser, role: effectiveRole }
  const userWithMeta = {
    ...userWithRole,
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
  }
  sessionStorage.setItem('jurisai_user', JSON.stringify(userWithMeta))
  sessionStorage.setItem('auth_user', JSON.stringify(userWithMeta))
  sessionStorage.setItem('auth_token', user.id)
  if (typeof document !== 'undefined') {
    document.cookie = `jurisai_auth=1; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
  }

  // Append to registered_users list for admin
  try {
    const stored = localStorage.getItem('registered_users')
    const users = stored ? JSON.parse(stored) : []
    const existingIdx = users.findIndex((u: any) => u.id === user.id || u.uid === user.id)
    if (existingIdx >= 0) {
      users[existingIdx] = {
        ...users[existingIdx],
        ...userWithMeta,
        last_login: new Date().toISOString(),
      }
    } else {
      users.push(userWithMeta)
    }
    localStorage.setItem('registered_users', JSON.stringify(users))
  } catch {}

  // Sync to Supabase registered_users
  syncUserToSupabase(userWithMeta).catch(() => {})

  return userWithMeta
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
        provider: user.provider || 'email',
      }),
    })
  } catch {}
}

function clearUserFromLocal() {
  // Har ikkala storage'dan barcha identity keylarni tozalaymiz —
  // aks holda eski akkaunt ma'lumoti localStorage'da qolib, boshqa
  // akkaunt kirganda "egasi men" kabi chalkashliklar yuzaga keladi.
  for (const key of ['jurisai_user', 'auth_user', 'currentUser', 'auth_token']) {
    sessionStorage.removeItem(key)
    localStorage.removeItem(key)
  }
  localStorage.removeItem('profile_image')
}

// ── AUTH API ─────────────────────────────────────────────────────

export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; data?: AuthUser; error?: string }> {
  // Rol faqat Supabase database'dan (registered_users) aniqlanadi —
  // hardcoded email bypass yo'q.
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (!data?.user) throw new Error('Foydalanuvchi topilmadi')

    const user = mapSupabaseUser(data.user)
    const resolved = await resolveUserRole(user)
    const savedUser = saveUserToLocal(resolved)
    logAuthEvent(email, 'email', savedUser.id, true)
    return { success: true, data: savedUser }
  } catch (error: any) {
    let message = 'Login xatosi yuz berdi'
    const code = error?.message || error?.code || ''
    if (code.includes('Invalid login credentials') || code.includes('invalid_credentials')) {
      message = "Email yoki parol noto'g'ri"
    } else if (code.includes('Email not confirmed')) {
      message = 'Email tasdiqlanmagan. Iltimos, pochtangizni tekshiring.'
    } else if (code.includes('rate_limit')) {
      message = "Juda ko'p urinishlar. Birozdan so'ng qayta urinib ko'ring."
    }
    return { success: false, error: message }
  }
}

export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<
  | { success: true; data?: AuthUser; needsEmailConfirmation?: boolean }
  | { success: false; error: string }
> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, full_name: name, role: 'USER', subscription_plan: 'free' },
      },
    })
    if (error) throw error
    if (!data?.user) throw new Error("Ro'yxatdan o'tish xatosi")

    // ── Email tasdiqlash YOQILGAN (confirmed=false, session=null) ──
    // Bu holatda session yo'q — foydalanuvchini DARHOL dashboardga
    // yuborib bo'lmaydi (fake login bo'ladi). Tasdiqlash xati yuborilganini
    // ko'rsatamiz va /signin ga yo'naltiramiz. Fake session saqlanmaydi.
    if (!data.session) {
      return {
        success: true,
        needsEmailConfirmation: true,
        data: mapSupabaseUser(data.user),
      }
    }

    const user = mapSupabaseUser({
      ...data.user,
      user_metadata: { name, full_name: name, role: 'USER', subscription_plan: 'free' },
    })
    saveUserToLocal(user)
    return { success: true, data: user }
  } catch (error: any) {
    let message = "Ro'yxatdan o'tish xatosi"
    const code = error?.message || error?.code || ''
    if (
      code.includes('already registered') ||
      code.includes('already_exists') ||
      code.includes('duplicate')
    ) {
      message = "Bu email allaqachon ro'yxatdan o'tgan"
    } else if (code.includes('weak_password') || code.includes('6 characters')) {
      message = "Parol juda oddiy. Kamida 6 belgidan iborat bo'lishi kerak"
    } else if (code.includes('invalid')) {
      message = "Email formati noto'g'ri"
    } else if (code.includes('rate_limit')) {
      message = 'Juda ko\'p urinishlar. Bir necha daqiqadan so\'ng qayta urinib ko\'ring.'
    }
    return { success: false, error: message }
  }
}

export async function signInWithGoogle(): Promise<{
  success: boolean
  data?: AuthUser
  error?: string
}> {
  try {
    // Use dynamic redirectTo to the dedicated /auth/callback page.
    // This ensures a clean, dedicated callback handler for Supabase OAuth.
    const redirectTo = window.location.origin + '/auth/callback'
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    })
    if (error) throw error
    if (data?.url) {
      // Redirect user to Google OAuth page
      window.location.href = data.url
      return { success: true }
    }
    return { success: false, error: 'Google orqali kirishda xatolik' }
  } catch (error: any) {
    console.error('[OAuth] signInWithGoogle error:', error)
    return { success: false, error: error?.message || 'Google orqali kirishda xatolik yuz berdi' }
  }
}

export async function handleRedirectResult(): Promise<{
  success: boolean
  data?: AuthUser
  error?: string
}> {
  try {
    const { data } = await supabase.auth.getSession()
    if (data?.session?.user) {
      const savedUser = await finalizeUserSession(data.session.user)
      return { success: true, data: savedUser }
    }
    return { success: false }
  } catch (error: any) {
    return { success: false, error: error?.message || "Qayta yo'naltirish xatosi" }
  }
}

export async function signOut(): Promise<void> {
  try {
    // auth_logs jadvalidagi method cheklovi logout qiymatini qabul qilmaydi —
    // chiqish logi yozilmaydi (kirish loglari etarli)
    await supabase.auth.signOut()
  } catch {
    // Ignore signOut errors
  } finally {
    if (typeof window !== 'undefined') {
      clearUserFromLocal()
      // Clear cookie
      document.cookie = 'jurisai_auth=; path=/; max-age=0; SameSite=Lax'
      window.location.href = '/signin'
    }
  }
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    let message = 'Parolni tiklashda xatolik'
    if (error?.message?.includes('not found')) {
      message = "Bu email ro'yxatdan o'tmagan"
    }
    return { success: false, error: message }
  }
}

export async function updateProfile(
  updates: Partial<AuthUser>
): Promise<{ success: boolean; error?: string }> {
  try {
    const userToUpdate: any = {}
    if (updates.name) {
      userToUpdate.name = updates.name
      userToUpdate.full_name = updates.name
    }
    if (updates.role) userToUpdate.role = updates.role
    if (updates.subscription_plan) userToUpdate.subscription_plan = updates.subscription_plan
    if (updates.phone) userToUpdate.phone = updates.phone
    if (updates.avatar) userToUpdate.avatar = updates.avatar

    // Auth metadata (user_metadata) yangilanadi
    const { error } = await supabase.auth.updateUser({ data: userToUpdate })
    if (error) throw error

    // registered_users jadvaliga ham yozamiz (name + full_name + avatar + phone)
    const current = getCurrentUser()
    if (current?.id) {
      try {
        await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: current.id,
            email: updates.email || current.email,
            name: updates.name || current.name,
            full_name: updates.name || current.name,
            phone: updates.phone || current.phone,
            avatar: updates.avatar || current.avatar,
            role: updates.role || current.role || 'USER',
            subscription_plan: updates.subscription_plan || current.subscription_plan || 'free',
            provider: current.provider || 'email',
          }),
        })
      } catch {}
    }

    const storedUser =
      localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user') || '{}'
    const existingUser = storedUser ? JSON.parse(storedUser) : {}
    const updatedUser = { ...existingUser, ...updates }
    saveUserToLocal(updatedUser)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Profilni yangilash xatosi' }
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = getCurrentUser()
    if (!user?.email) return { success: false, error: "Foydalanuvchi topilmadi" }

    // 1) Joriy parolni tekshiramiz (haqiqiy login orqali)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (signInError) {
      return { success: false, error: "Joriy parol noto'g'ri" }
    }

    // 2) Yangi parolni o'rnatamiz
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Parolni o\'zgartirish xatosi' }
  }
}

export async function changeEmail(
  newEmail: string
): Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }> {
  try {
    const { data, error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) throw error

    // Email o'zgargan — session yangilanadi; yangi email tasdiqlashni talab
    // qiladi (Supabase konfiguratsiyasiga bog'liq).
    const user = getCurrentUser()
    if (user) {
      const updated = { ...user, email: data?.user?.email || newEmail }
      saveUserToLocal(updated)
    }
    return { success: true, needsConfirmation: true }
  } catch (error: any) {
    let message = 'Emailni o\'zgartirish xatosi'
    if (error?.message?.includes('already')) {
      message = "Bu email allaqachon ro'yxatdan o'tgan"
    }
    return { success: false, error: message }
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const stored = sessionStorage.getItem('jurisai_user') || sessionStorage.getItem('auth_user')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      /* yaroqsiz json — pastdagi manbalarga o'tamiz */
    }
  }
  // Yangi tab / refresh holatida sessionStorage bo'sh bo'ladi —
  // Supabase'ning o'z session storage'sidan (sb-<ref>-auth-token)
  // foydalanuvchini tiklaymiz. Bu har doim haqiqiy session.
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        const parsed = JSON.parse(raw)
        const u = parsed?.user
        if (u?.id) {
          return mapSupabaseUser(u)
        }
      }
    }
  } catch {
    /* localStorage o'qib bo'lmadi */
  }
  return null
}

export function isAuthenticated(): boolean {
  return !!getCurrentUser() && !!sessionStorage.getItem('auth_token')
}

export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  // First, check sessionStorage
  const storedUser = getCurrentUser()
  if (storedUser) callback(storedUser)

  // Subscribe to Supabase auth state changes
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    // USER_UPDATED bizning resolveUserRole() dagi updateUser() dan keladi —
    // cheksiz tsiklni oldini olish uchun e'tiborsiz qoldiramiz.
    if (event === 'USER_UPDATED') {
      const existing = getCurrentUser()
      if (existing) callback(existing)
      return
    }

    if (session?.user) {
      resolveUserRole(mapSupabaseUser(session.user))
        .then(resolved => {
          const savedUser = saveUserToLocal(resolved)
          callback(savedUser)
        })
        .catch(() => {
          const savedUser = saveUserToLocal(mapSupabaseUser(session.user))
          callback(savedUser)
        })
    } else {
      clearUserFromLocal()
      callback(null)
    }
  })

  return () => subscription.unsubscribe()
}

export const firebaseAuth = {
  signIn,
  signUp,
  signInWithGoogle,
  handleRedirectResult,
  signOut,
  resetPassword,
  updateProfile,
  changePassword,
  changeEmail,
  getCurrentUser,
  isAuthenticated,
  onAuthChange,
  finalizeUserSession,
}
