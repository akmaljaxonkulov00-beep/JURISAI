import { NextRequest } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export interface AuthenticatedCourtUser {
  id: string
  name: string
  email: string
}

/**
 * Resolves the current multiplayer Virtual Court user strictly from
 * verified server-side Supabase authentication (`requireUser`).
 * Client-supplied identity headers (e.g. `x-guest-id`) are never trusted.
 */
export async function resolveCourtUser(
  request: NextRequest
): Promise<AuthenticatedCourtUser | null> {
  const auth = await requireUser(request)
  if (!auth.ok) return null

  const fallbackName = auth.user.email ? auth.user.email.split('@')[0] : 'Foydalanuvchi'

  try {
    const admin = getSupabaseAdmin()
    const { data } = await admin
      .from('registered_users')
      .select('full_name, email')
      .eq('id', auth.user.id)
      .maybeSingle()

    return {
      id: auth.user.id,
      name: data?.full_name || fallbackName || 'Foydalanuvchi',
      email: auth.user.email || '',
    }
  } catch {
    return {
      id: auth.user.id,
      name: fallbackName || 'Foydalanuvchi',
      email: auth.user.email || '',
    }
  }
}
