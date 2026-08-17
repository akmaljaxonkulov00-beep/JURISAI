// ═══════════════════════════════════════════════════════════════════════════
// client-user.ts — Mijoz tomonida joriy foydalanuvchini aniqlash
// AI API'lariga userId/email yuborish uchun (limit hisobi to'g'ri ishlashi)
//
// ═══ ASOSIY MANBA: Supabase session storage (sb-<ref>-auth-token) ═══
// `jurisai_user`/`auth_user`/`currentUser` localStorage keylari eski
// akkauntdan qolib ketishi mumkin (logout ularni o'chirmagan holatlar) —
// shuning uchun IDENTITY uchun SUPABASE SESSION yagona haqiqiy manba.
// ═══════════════════════════════════════════════════════════════════════════

function readSupabaseSessionUser(): { userId?: string; email?: string } | null {
  try {
    if (typeof window === 'undefined') return null
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      // Faqat haqiqiy session token keylari (code-verifier emas)
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        const parsed = JSON.parse(raw)
        const u = parsed?.user || parsed?.currentSession?.user
        if (u?.id) {
          return { userId: u.id, email: u.email || '' }
        }
      }
    }
  } catch {
    /* localStorage o'qib bo'lmadi */
  }
  return null
}

export function getClientUser(): { userId?: string; email?: string } {
  // 1) Supabase session — doim haqiqiy, eski akkauntdan qolgan ma'lumot
  //    bilan ARALASHMAYDI (localStorage o'zgarishi bilan sinxronlanadi)
  const sessionUser = readSupabaseSessionUser()
  if (sessionUser?.userId) return sessionUser

  // 2) Fallback: eski saqlangan user ob'ektlari (session bo'lmaganda)
  try {
    const stored =
      sessionStorage.getItem('jurisai_user') ||
      sessionStorage.getItem('auth_user') ||
      localStorage.getItem('jurisai_user') ||
      localStorage.getItem('auth_user') ||
      localStorage.getItem('currentUser')
    if (stored) {
      const u = JSON.parse(stored)
      return {
        userId: u?.id || u?.uid || u?.sub || u?.user?.id || undefined,
        email: u?.email || u?.user?.email || undefined,
      }
    }
  } catch {}
  return {}
}

/**
 * AI API chaqiruvlariga qo'shiladigan body qismi: { userId, email }
 */
export function getUserIdentityPayload(): { userId?: string; email?: string } {
  return getClientUser()
}
