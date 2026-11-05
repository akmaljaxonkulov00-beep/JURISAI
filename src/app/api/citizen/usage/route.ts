import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getCitizenUsage, addCitizenQuestionCredits, CITIZEN_PRICING } from '@/lib/citizen-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const usage = await getCitizenUsage(auth.user.id)
    return NextResponse.json({
      success: true,
      data: {
        ...usage,
        pricing: CITIZEN_PRICING,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { packageType, provider = 'click' } = body

    let creditsToAdd = 0
    let amount = 0

    if (packageType === 'single') {
      creditsToAdd = 1
      amount = CITIZEN_PRICING.singleQuestion
    } else if (packageType === 'pack5') {
      creditsToAdd = 5
      amount = CITIZEN_PRICING.pack5Questions
    } else if (packageType === 'monthly') {
      creditsToAdd = CITIZEN_PRICING.monthlySubscriptionLimit
      amount = CITIZEN_PRICING.monthlySubscription
    } else {
      return NextResponse.json({ success: false, error: "Noto'g'ri paket turi tanlandi" }, { status: 400 })
    }

    const result = await addCitizenQuestionCredits(
      auth.user.id,
      creditsToAdd,
      amount,
      provider,
      `citizen_pack_${Date.now()}`
    )

    return NextResponse.json({
      success: true,
      message: `${creditsToAdd} ta savol krediti muvaffaqiyatli hisobingizga qo'shildi!`,
      data: result,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
