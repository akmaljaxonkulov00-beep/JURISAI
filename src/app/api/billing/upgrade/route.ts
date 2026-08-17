import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Stripe import with error handling
let stripe: {
  checkout: {
    sessions: {
      create: (o: Record<string, unknown>) => Promise<{ url?: string | null }>
    }
  }
} | null = null
try {
  if (process.env.STRIPE_SECRET_KEY) {
    const Stripe = require('stripe')
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
} catch (error) {
  console.warn('Stripe not available:', error)
}

export async function POST(request: NextRequest) {
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

    const { planId } = await request.json()

    // Get the plan from Supabase (pricing_plans — yagona manba, subscription_plans VIEW)
    const { data: plan, error: planError } = await admin
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Get user from Supabase (registered_users — yagona authoritative jadval)
    const { data: userData, error: userError } = await admin
      .from('registered_users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const stripeCustomerId = userData.email

    // Create Stripe checkout session
    const checkoutSession = await stripe?.checkout.sessions.create({
      customer_email: userData.email,
      billing_address_collection: 'required',
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: {
              name: plan.name,
              description: plan.description || undefined,
            },
            unit_amount: Math.round(Number(plan.price) * 100),
            recurring: {
              interval: plan.billing_cycle.toLowerCase() as 'month' | 'year',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'https://jurisai-dm4b-ten.vercel.app'}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'https://jurisai-dm4b-ten.vercel.app'}/billing?canceled=true`,
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
    })

    return NextResponse.json({
      checkoutUrl: checkoutSession?.url || null,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
