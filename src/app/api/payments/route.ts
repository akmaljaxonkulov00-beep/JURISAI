import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getPaymentAdminClient, resolvePlan } from '@/lib/payment-admin'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const supabase = getPaymentAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 503 }
      )
    }

    const userId = auth.user.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Foydalanuvchi faqat O'Z cheklarini ko'radi (session identity)
    const reqQuery = supabase
      .from('payment_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .eq('user_id', userId)

    if (status) reqQuery.eq('status', status)

    const { data: userRequests, error: reqError } = await reqQuery
    if (reqError) throw reqError

    return NextResponse.json({
      success: true,
      data: { payments: userRequests || [], total: userRequests?.length || 0 },
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { planId, checkImage, receiptImage } = body

    if (!planId || !checkImage) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getPaymentAdminClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 503 }
      )
    }

    // Tarif va narx — faqat server tomondagi pricing_plans'dan.
    // Client yuborgan planName/planPrice ishonilmaydi.
    const plan = await resolvePlan(supabase, planId)
    if (!plan || Number(plan.price) <= 0) {
      return NextResponse.json(
        { success: false, error: `Tarif topilmadi: ${planId}` },
        { status: 400 }
      )
    }

    const userId = auth.user.id
    const userEmail = auth.user.email

    const { data: payment, error } = await supabase
      .from('payment_requests')
      .insert({
        user_id: userId,
        user_email: userEmail,
        user_name: body?.userName || '',
        plan: plan.id,
        plan_id: plan.id,
        amount: Number(plan.price),
        receipt_image: checkImage || receiptImage || '',
        status: 'pending',
        billing_cycle: 'monthly',
      })
      .select()
      .single()

    if (error) {
      console.error('Payment create error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: payment })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ success: false, error: 'Failed to create payment' }, { status: 500 })
  }
}
