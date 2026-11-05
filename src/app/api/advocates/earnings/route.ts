import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getAdvocateMonthlyEarnings } from '@/lib/advocate-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const now = new Date()
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10)
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10)

    const earnings = await getAdvocateMonthlyEarnings(auth.user.id, year, month)
    return NextResponse.json(earnings)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
