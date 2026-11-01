import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/db/platform-db'
import { requireAdmin } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const adminAuth = await requireAdmin(request)
    if (!adminAuth.ok) return adminAuth.response

    // Real database aggregate statistics
    const stats = await platformDb.getPlatformStats()

    // Try to get real registered_users count from Supabase Postgres
    try {
      const supabase = getSupabaseAdmin()
      const { count: totalDbUsers } = await supabase
        .from('registered_users')
        .select('*', { count: 'exact', head: true })

      if (totalDbUsers && totalDbUsers > stats.totalUsers) {
        stats.totalUsers = totalDbUsers
      }
    } catch {}

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Statistikani yuklashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
