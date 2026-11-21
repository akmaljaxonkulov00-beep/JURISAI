import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredRooms } from '@/lib/court/multiplayer-db'

/**
 * GET/POST /api/court/multiplayer/cleanup
 * Idempotent cron / background cleanup worker for expired, abandoned & stale rooms.
 * Can be triggered periodically by Vercel Cron, Supabase PG Cron, or admin dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Allow in dev, or verify cron secret in production
    if (process.env.NODE_ENV === 'production' && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow internal invocation with query token as secondary check
      const url = new URL(request.url)
      const token = url.searchParams.get('token')
      if (token !== cronSecret) {
        return NextResponse.json({ success: false, error: 'Ruxsat etilmagan (Unauthorized)' }, { status: 401 })
      }
    }

    const result = await cleanupExpiredRooms()
    return NextResponse.json({
      success: true,
      message: 'Muddati o‘tgan va faoliyatsiz sud zallari muvaffaqiyatli tozalandi',
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('Court cleanup worker error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Cleanup bajarishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
