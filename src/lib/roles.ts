/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JURISTIV — UNIFIED PLATFORM ROLES & ACCESS CONTROL
 *
 * Yagona rol manbai:
 * 1. citizen       — Yuridik yordam so'rovchi fuqarolar (/citizen)
 * 2. law_student   — Amaliyotchi huquqshunos talabalar (/law-student)
 * 3. advocate      — Rasmiy tasdiqlangan professional advokatlar (/advocate)
 * 4. student       — Mavjud talaba sahifasi (O'ZGARISHSIZ saqlanadi: /dashboard)
 * 5. admin         — Platforma boshqaruvchilari (/admin)
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type PlatformRole = 'citizen' | 'law_student' | 'advocate' | 'student' | 'admin'

export type AdminLevel =
  | 'super_admin'
  | 'user_manager'
  | 'verification_manager'
  | 'content_moderator'
  | 'finance_manager'
  | 'support_manager'

/**
 * Admin deb quyidagi rol qiymatlari hisoblanadi (DB'dan qanday yozilganidan
 * qat'iy nazar): ADMIN, admin, SUPER_ADMIN, super_admin, superadmin.
 */
export function isAdminRole(role?: string | null): boolean {
  if (!role) return false
  const normalized = String(role).toLowerCase().trim()
  return (
    normalized === 'admin' ||
    normalized === 'super_admin' ||
    normalized === 'superadmin' ||
    normalized === 'user_manager' ||
    normalized === 'verification_manager' ||
    normalized === 'content_moderator' ||
    normalized === 'finance_manager' ||
    normalized === 'support_manager'
  )
}

export function isCitizenRole(role?: string | null): boolean {
  if (!role) return false
  const normalized = String(role).toLowerCase().trim()
  return normalized === 'citizen'
}

export function isLawStudentRole(role?: string | null): boolean {
  if (!role) return false
  const normalized = String(role).toLowerCase().trim()
  return normalized === 'law_student' || normalized === 'lawstudent'
}

export function isAdvocateRole(role?: string | null): boolean {
  if (!role) return false
  const normalized = String(role).toLowerCase().trim()
  return normalized === 'advocate' || normalized === 'lawyer'
}

export function isStudentRole(role?: string | null): boolean {
  if (!role) return true // default to existing student if unspecified
  const normalized = String(role).toLowerCase().trim()
  return (
    normalized === 'student' ||
    normalized === 'user' ||
    normalized === 'teacher' ||
    normalized === 'institution'
  )
}

/**
 * Har qanday kiritilgan rolni 5 ta asosiy platforma roliga ajratadi:
 * - admin
 * - citizen
 * - law_student
 * - advocate
 * - student (mavjud talaba roli)
 */
export function resolvePlatformRole(role?: string | null): PlatformRole {
  if (!role) return 'student'
  if (isAdminRole(role)) return 'admin'
  if (isCitizenRole(role)) return 'citizen'
  if (isLawStudentRole(role)) return 'law_student'
  if (isAdvocateRole(role)) return 'advocate'
  return 'student'
}

/**
 * Rolga mos bosh sahifa yo'nalishini (Dashboard URL) qaytaradi.
 * Mavjud `student` roli O'ZGARISHSIZ `/dashboard` ga boradi.
 */
export function getRoleDashboardPath(role?: string | null): string {
  const resolved = resolvePlatformRole(role)
  switch (resolved) {
    case 'admin':
      return '/admin'
    case 'citizen':
      return '/citizen'
    case 'law_student':
      return '/law-student'
    case 'advocate':
      return '/advocate'
    case 'student':
    default:
      return '/dashboard'
  }
}

/**
 * Rol nomini o'zbek tilida chiroyli ko'rsatish
 */
export function getRoleDisplayName(role?: string | null): string {
  const resolved = resolvePlatformRole(role)
  switch (resolved) {
    case 'admin':
      return 'Platforma Administratori'
    case 'citizen':
      return 'Fuqaro'
    case 'law_student':
      return 'Yurisprudensiya Talabasi'
    case 'advocate':
      return 'Professional Advokat'
    case 'student':
    default:
      return 'Talaba'
  }
}

/**
 * Eski kodlar bilan 100% orqaga moslik uchun:
 * admin → 'ADMIN', qolgani → 'USER'.
 */
export function normalizeRole(role?: string | null): 'ADMIN' | 'USER' {
  return isAdminRole(role) ? 'ADMIN' : 'USER'
}
