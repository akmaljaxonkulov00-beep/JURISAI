import { NextRequest, NextResponse } from 'next/server'
import { getUsageStatus, getIdentityFromRequest } from '@/lib/usage-limits'
import { requireUser } from '@/lib/server-auth'

// GET /api/usage/status — foydalanuvchining limit holati (UI uchun)
// Identity faqat tasdiqlangan session'dan olinadi — query parametrlar ishonilmaydi.
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const identity = await getIdentityFromRequest(request)
    if (!identity.userId && !identity.email) {
      return NextResponse.json({ success: false, error: 'Session aniqlanmadi' }, { status: 401 })
    }

    const status = await getUsageStatus(identity.userId, identity.email)
    return NextResponse.json({ success: true, data: status })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Xatolik'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
