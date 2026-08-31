import { NextResponse } from 'next/server'
import { getSupabaseAuthClient } from '@/lib/supabase-auth-client'

/**
 * POST /api/auth/logout
 * Supabase session'ni tozalaydi.
 */
export async function POST() {
  try {
    const supabase = getSupabaseAuthClient()
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ success: true }) // Logout xatolik bo'lsa ham muvaffaqiyatli
  }
}
