/**
 * Umumiy rol logikasi — desktop sidebar, mobil sidebar, route protection
 * va OAuth redirect uchun YAGONA manba.
 *
 * Admin deb quyidagi rol qiymatlari hisoblanadi (DB'dan qanday yozilganidan
 * qat'iy nazar): ADMIN, admin, SUPER_ADMIN, super_admin, superadmin.
 * Qolganlari (USER, user, undefined, ...) — oddiy foydalanuvchi.
 */

export function isAdminRole(role?: string | null): boolean {
  if (!role) return false
  const normalized = String(role).toLowerCase().trim()
  return normalized === 'admin' || normalized === 'super_admin' || normalized === 'superadmin'
}

/**
 * Rolni ichki formatga keltiradi: admin → 'ADMIN', qolgani → 'USER'.
 * OAuth redirect va sidebar filter shu qiymatdan foydalanadi.
 */
export function normalizeRole(role?: string | null): 'ADMIN' | 'USER' {
  return isAdminRole(role) ? 'ADMIN' : 'USER'
}
