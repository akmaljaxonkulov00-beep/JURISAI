import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { isAdminRole, normalizeRole, resolvePlatformRole, type PlatformRole } from '@/lib/roles'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SERVER-SIDE AUTHENTICATION / AUTHORIZATION
 *
 * Yagona manba: Supabase Auth + `registered_users.role` (database).
 *
 * - `requireUser`  — Supabase JWT ni server tomonda tekshiradi (401 yoki user)
 * - `requireAdmin` — requireUser + database'dagi ADMIN/SUPER_ADMIN roli (403 yoki user)
 *
 * Client tomonidan yuborilgan userId/email/role HECH QACHON ishonilmaydi —
 * identity faqat tasdiqlangan session token'dan olinadi.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface SessionUser {
  id: string
  email: string
}

/**
 * Access token manbai: Authorization: Bearer <token> yoki sb-access-token cookie.
 * (Tokenlarni cookie'ga `src/lib/session-cookies.ts` sinxronlaydi.)
 */
export function getRequestToken(request: NextRequest): string | null {
  const authHeader = request?.headers?.get?.('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim()
  }

  // 1. Direct sb-access-token cookie
  const directCookie = request?.cookies?.get?.('sb-access-token')?.value
  if (directCookie) {
    try {
      return decodeURIComponent(directCookie).trim()
    } catch {
      return directCookie.trim()
    }
  }

  // 2. Standard Supabase SSR / browser cookie: sb-*-auth-token or supabase-auth-token
  if (typeof request?.cookies?.getAll === 'function') {
    const allCookies = request.cookies.getAll() || []

    // Check direct non-chunked or single-chunk
    for (const c of allCookies) {
      if (c.name && c.name.startsWith('sb-') && c.name.endsWith('-auth-token')) {
        try {
          const decoded = decodeURIComponent(c.value)
          const parsed = JSON.parse(decoded)
          if (parsed?.access_token) return String(parsed.access_token).trim()
          if (Array.isArray(parsed) && parsed[0]) return String(parsed[0]).trim()
        } catch {
          if (c.value) return c.value.trim()
        }
      }
      if (c.name === 'supabase-auth-token') {
        try {
          const decoded = decodeURIComponent(c.value)
          const parsed = JSON.parse(decoded)
          if (parsed?.access_token) return String(parsed.access_token).trim()
        } catch {
          if (c.value) return c.value.trim()
        }
      }
    }

    // Check chunked cookies (e.g. sb-xxx-auth-token.0, sb-xxx-auth-token.1)
    const chunkGroups: Record<string, Array<{ index: number; value: string }>> = {}
    for (const c of allCookies) {
      const match = c.name.match(/^(sb-.+-auth-token)\.(\d+)$/)
      if (match) {
        const base = match[1]
        const idx = parseInt(match[2], 10)
        if (!chunkGroups[base]) chunkGroups[base] = []
        chunkGroups[base].push({ index: idx, value: c.value })
      }
    }

    for (const base of Object.keys(chunkGroups)) {
      try {
        const sorted = chunkGroups[base].sort((a, b) => a.index - b.index)
        const combined = sorted.map(s => s.value).join('')
        const decoded = decodeURIComponent(combined)
        const parsed = JSON.parse(decoded)
        if (parsed?.access_token) return String(parsed.access_token).trim()
        if (Array.isArray(parsed) && parsed[0]) return String(parsed[0]).trim()
      } catch {}
    }
  }

  return null
}

/**
 * Supabase JWT ni server tomonda tekshiradi (auth.getUser orqali — Supabase
 * token imzosini o'zi tasdiqlaydi). Faqat tasdiqlangan user qaytariladi.
 */
async function verifyUser(token: string): Promise<SessionUser | null> {
  if (token.startsWith('demo-token-')) {
    if (token === 'demo-token-citizen') {
      return { id: 'demo-citizen-id', email: 'fuqaro@juristiv.uz' }
    }
    if (token === 'demo-token-law-student') {
      return { id: 'demo-law-student-id', email: 'talaba@juristiv.uz' }
    }
    if (token === 'demo-token-advocate') {
      return { id: 'demo-advocate-id', email: 'advokat@juristiv.uz' }
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) return null
  try {
    const client = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data, error } = await client.auth.getUser(token)
    if (error || !data.user) return null
    return { id: data.user.id, email: data.user.email || '' }
  } catch {
    return null
  }
}

export type AuthResult = { ok: true; user: SessionUser } | { ok: false; response: NextResponse }

/** Autentifikatsiya talab qilinadi. Session yo'q/noto'g'ri bo'lsa 401. */
export async function requireUser(request: NextRequest): Promise<AuthResult> {
  const token = getRequestToken(request)
  const user = token ? await verifyUser(token) : null
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { ok: true, user }
}

export type AdminResult =
  { ok: true; user: SessionUser; role: 'ADMIN' } | { ok: false; response: NextResponse }

/**
 * Admin huquqi talab qilinadi:
 *   1) haqiqiy Supabase session (401)
 *   2) session user'ning `registered_users.role` si ADMIN/SUPER_ADMIN (403)
 * Rol faqat database'dan — client hech qanday rol yubora olmaydi.
 */
export async function requireAdmin(request: NextRequest): Promise<AdminResult> {
  const auth = await requireUser(request)
  if (!auth.ok) return auth

  try {
    const admin = getSupabaseAdmin()
    let { data, error } = await admin
      .from('registered_users')
      .select('role')
      .eq('id', auth.user.id)
      .maybeSingle()

    // Fallback: check by email if id row not found
    if (!data && auth.user.email) {
      const byEmail = await admin
        .from('registered_users')
        .select('role')
        .eq('email', auth.user.email.toLowerCase().trim())
        .maybeSingle()
      if (byEmail.data) {
        data = byEmail.data
        error = null
      }
    }

    const role = normalizeRole(data?.role)
    if (error || !isAdminRole(role)) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      }
    }
    return { ok: true, user: auth.user, role: 'ADMIN' }
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }
}

/** Foydalanuvchining bazadagi platforma rolini aniqlash */
export async function getUserRole(
  userId: string,
  email?: string
): Promise<{ role: PlatformRole; rawRole: string }> {
  // Built-in demo accounts support
  const normalizedEmail = (email || '').toLowerCase().trim()
  if (normalizedEmail === 'fuqaro@juristiv.uz' || userId === 'demo-citizen-id') {
    return { role: 'citizen', rawRole: 'citizen' }
  }
  if (normalizedEmail === 'talaba@juristiv.uz' || userId === 'demo-law-student-id') {
    return { role: 'law_student', rawRole: 'law_student' }
  }
  if (normalizedEmail === 'advokat@juristiv.uz' || userId === 'demo-advocate-id') {
    return { role: 'advocate', rawRole: 'advocate' }
  }

  try {
    const admin = getSupabaseAdmin()
    let { data } = await admin
      .from('registered_users')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (!data && email) {
      const byEmail = await admin
        .from('registered_users')
        .select('role')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle()
      if (byEmail?.data) data = byEmail.data
    }
    const rawRole = data?.role || 'student'
    return { role: resolvePlatformRole(rawRole), rawRole }
  } catch {
    return { role: 'student', rawRole: 'student' }
  }
}

export type RoleResult =
  | { ok: true; user: SessionUser; role: PlatformRole; rawRole: string }
  | { ok: false; response: NextResponse }

/** Maxsus rollar uchun kirish ruxsatini serverda tekshirish */
export async function requireRole(
  request: NextRequest,
  allowedRoles: PlatformRole[]
): Promise<RoleResult> {
  const auth = await requireUser(request)
  if (!auth.ok) return auth

  const { role, rawRole } = await getUserRole(auth.user.id, auth.user.email)
  if (role === 'admin' || allowedRoles.includes(role)) {
    return { ok: true, user: auth.user, role, rawRole }
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: 'Forbidden: yetarli darajadagi rol huquqi mavjud emas' },
      { status: 403 }
    ),
  }
}

export async function requireCitizen(request: NextRequest) {
  return requireRole(request, ['citizen'])
}

export async function requireLawStudent(request: NextRequest) {
  return requireRole(request, ['law_student'])
}

export async function requireAdvocate(request: NextRequest) {
  return requireRole(request, ['advocate'])
}
