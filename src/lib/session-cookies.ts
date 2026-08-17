'use client'

import { supabase } from '@/lib/supabase-browser'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SESSION COOKIE SINXRONI (CLIENT)
 *
 * supabase-js session'ni localStorage'da saqlaydi; server esa cookie o'qiy oladi.
 * Login/OAuth/TOKEN_REFRESHED paytlarida access+refresh tokenlarni cookie'ga
 * yozamiz — shunda server-side `requireUser`/`requireAdmin` token'ni
 * Supabase orqali tekshirib haqiqiy identity oladi (client userId ishonilmaydi).
 *
 * Cookie'lar HttpOnly emas (client yozadi) — lekin ular HECH QACHON server
 * tomonidan ishonilgan ro'l/manba emas: faqat JWT sifatida Supabase'ga
 * tekshirish uchun tashiladi. Supabase token'ni yaroqliligini o'zi tasdiqlaydi.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const ACCESS_COOKIE = 'sb-access-token'
const REFRESH_COOKIE = 'sb-refresh-token'

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
}

/** Joriy Supabase session'ni cookie'larga yozadi (login/OAuth/refresh da). */
export async function syncSessionCookies(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      const maxAge = session.expires_at
        ? Math.max(60, session.expires_at - Math.floor(Date.now() / 1000))
        : 3600
      setCookie(ACCESS_COOKIE, session.access_token, maxAge)
      if (session.refresh_token) setCookie(REFRESH_COOKIE, session.refresh_token, maxAge)
      return
    }
  } catch {
    /* session o'qib bo'lmadi — cookie tozalanadi */
  }
  clearSessionCookies()
}

/** Chiqishda cookie'larni tozalaydi. */
export function clearSessionCookies(): void {
  deleteCookie(ACCESS_COOKIE)
  deleteCookie(REFRESH_COOKIE)
}
