// ═══════════════════════════════════════════════════════════════════════════
// client-user.ts — Mijoz tomonida joriy foydalanuvchini aniqlash
// AI API'lariga userId/email yuborish uchun (limit hisobi to'g'ri ishlashi)
// ═══════════════════════════════════════════════════════════════════════════

export function getClientUser(): { userId?: string; email?: string } {
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
