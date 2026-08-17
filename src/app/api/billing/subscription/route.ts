import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  try {
    // Get auth header from request
    const authHeader = request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user with Supabase
    const admin = getSupabaseAdmin()
    const {
      data: { user },
      error,
    } = await admin.auth.getUser(authHeader)

    if (error || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription from Supabase
    const { data: subscription, error: subError } = await admin
      .from('subscriptions')
      .select(
        `
        *,
        subscription_plans (*)
      `
      )
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .single()

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subError)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
