import { NextRequest, NextResponse } from 'next/server'
import { getUsageStatus, getIdentityFromRequest } from '@/lib/usage-limits'

// GET /api/usage/status — foydalanuvchining limit holati (UI uchun)
export async function GET(request: NextRequest) {
  try {
    const identity = getIdentityFromRequest(request, {})

    if (!identity.userId && !identity.email) {
      // Kirish cookie'si bo'lmasa — query parametrlardan urinib ko'ramiz
      const { searchParams } = new URL(request.url)
      identity.userId = searchParams.get('userId') || undefined
      identity.email = searchParams.get('email') || undefined
    }

    const status = await getUsageStatus(identity.userId, identity.email)
    return NextResponse.json({ success: true, data: status })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Xatolik' },
      { status: 500 }
    )
  }
}
