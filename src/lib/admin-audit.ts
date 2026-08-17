import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type { SessionUser } from '@/lib/server-auth'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ADMIN AUDIT LOG — sezgir admin amallari kundaligi
 *
 * Har bir muhim amal (rol o'zgartirish, foydalanuvchi o'chirish, parol tiklash,
 * to'lov tasdiqlash/rad etish, narx/sozlamalar/limitlarni o'zgartirish)
 * `admin_audit_logs` jadvaliga yoziladi.
 *
 * XAVFSIZLIK:
 *  - Parol, token yoki boshqa maxfiy ma'lumotlar HECH QACHON logga yozilmaydi.
 *  - details faqat o'zgarish tavsifi (masalan 'USER -> ADMIN').
 *  - Yozuv muvaffaqiyatsiz bo'lsa ham asosiy amal buzilmaydi (non-blocking).
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface AuditEntry {
  admin: SessionUser
  action: string
  targetType?: string
  targetId?: string
  targetEmail?: string
  details?: Record<string, unknown>
  success?: boolean
}

export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) return
    await supabase.from('admin_audit_logs').insert({
      admin_id: entry.admin.id,
      admin_email: entry.admin.email || '',
      action: entry.action,
      target_type: entry.targetType || null,
      target_id: entry.targetId || null,
      target_email: entry.targetEmail || null,
      details: entry.details || {},
      success: entry.success !== false,
      created_at: new Date().toISOString(),
    })
  } catch {
    // Audit log yozuvidagi xato asosiy amalni buzmasin
  }
}
