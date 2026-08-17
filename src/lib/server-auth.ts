import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { isAdminRole, normalizeRole } from '@/lib/roles'

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
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim()
  }
  return request.cookies.get('sb-access-token')?.value || null
}

/**
 * Supabase JWT ni server tomonda tekshiradi (auth.getUser orqali — Supabase
 * token imzosini o'zi tasdiqlaydi). Faqat tasdiqlangan user qaytariladi.
 */
async function verifyUser(token: string): Promise<SessionUser | null> {
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
    const { data, error } = await admin
      .from('registered_users')
      .select('role')
      .eq('id', auth.user.id)
      .maybeSingle()

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
