import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getUsageStatus } from '@/lib/usage-limits'

/**
 * GET /api/usage-status
 * Returns the current user's AI usage status (remaining limits per feature)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const userId = auth.user.id
    const email = auth.user.email || undefined

    const status = await getUsageStatus(userId, email)
    return NextResponse.json({ success: true, data: status })
  } catch (error) {
    console.error('[Usage Status] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch usage status' },
      { status: 500 }
    )
  }
}
