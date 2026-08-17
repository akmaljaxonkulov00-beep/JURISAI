import type { SupabaseClient } from '@supabase/supabase-js'
import { requireAdmin, requireUser } from '@/lib/server-auth'

/**
 * Jamiyat API'larining umumiy server-side helperlari.
 *
 * XAVFSIZLIK QOIDASI: foydalanuvchi identity'si FAQAT tasdiqlangan Supabase
 * session'dan olinadi (`requireUser` / `requireAdmin`). Client yuborgan
 * `userId` / `actorId` / `moderatorId` HECH QACHON ishonilmaydi.
 */

type DbClient = SupabaseClient

/** Service-role Supabase client (RLS bypass — avtorizatsiya API darajasida tekshiriladi). */
export async function getServiceClient(): Promise<DbClient | null> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

/** Xato message'ni xavfsiz olish. */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export interface UserProfile {
  full_name?: string
  email?: string
  avatar?: string
  role?: string
}

interface GroupRow {
  created_by?: string | null
}

interface MemberRow {
  role?: string
  id?: string
}

/** registered_users'dan profil (full_name/email/avatar/role). */
export async function getUserProfile(
  supabase: DbClient,
  userId: string
): Promise<UserProfile | null> {
  if (!userId) return null
  try {
    const { data } = await supabase
      .from('registered_users')
      .select('id, full_name, email, avatar, role')
      .eq('id', userId)
      .maybeSingle()
    return (data as UserProfile | null) || null
  } catch {
    return null
  }
}

/** Foydalanuvchi guruh yaratuvchisi yoki moderatormi? */
export async function canModerateGroup(
  supabase: DbClient,
  groupId: string,
  userId: string
): Promise<boolean> {
  if (!userId) return false
  try {
    const { data: group } = await supabase
      .from('community_groups')
      .select('created_by')
      .eq('id', groupId)
      .single()
    if (group && group.created_by?.toString() === userId) return true
    const { data: member } = await supabase
      .from('community_group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle()
    return !!member && ['moderator', 'admin'].includes((member as MemberRow).role || '')
  } catch {
    return false
  }
}

/** Foydalanuvchi guruh a'zosimi yoki yaratuvchimi? */
export async function canAccessGroup(
  supabase: DbClient,
  groupId: string,
  userId: string
): Promise<boolean> {
  if (!userId) return false
  try {
    const { data: group } = await supabase
      .from('community_groups')
      .select('created_by')
      .eq('id', groupId)
      .single()
    if (group && group.created_by?.toString() === userId) return true
    const { data: member } = await supabase
      .from('community_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle()
    return !!member
  } catch {
    return false
  }
}

export { requireAdmin, requireUser }

export type { GroupRow, MemberRow }
