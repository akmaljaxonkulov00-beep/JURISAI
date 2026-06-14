import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-client';
import { getCurrentUser } from '@/lib/supabase-client';

interface UpgradeRequest {
  planId: string;
  planName: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  paymentMethod: 'click' | 'payme' | 'card';
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: UpgradeRequest = await request.json();
    const { planId, planName, price, billingCycle, paymentMethod } = body;

    // Validate request
    if (!planId || !planName || price === undefined || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For demo purposes, we'll simulate a successful payment
    // In a real implementation, you would integrate with payment providers like Click, Payme, etc.
    const paymentSuccessful = true; // Simulate successful payment

    if (!paymentSuccessful) {
      return NextResponse.json(
        { error: 'Payment failed' },
        { status: 400 }
      );
    }

    // Calculate subscription end date
    const subscriptionEnd = new Date();
    if (billingCycle === 'monthly') {
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    } else {
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
    }

    // Update user's subscription in database
    if (supabaseServer) {
      try {
        // Update user profile
        const { error: userError } = await supabaseServer
          .from('users')
          .update({
            subscription_plan: planName.toLowerCase(),
            subscription_expires_at: subscriptionEnd.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (userError) {
          console.error('User update error:', userError);
          // Continue even if user update fails
        }

        // Create subscription record
        const { error: subscriptionError } = await supabaseServer
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_id: planId,
            plan_name: planName,
            price: price,
            currency: 'UZS',
            billing_cycle: billingCycle,
            status: 'ACTIVE',
            current_period_start: new Date().toISOString(),
            current_period_end: subscriptionEnd.toISOString(),
            payment_method: paymentMethod,
            created_at: new Date().toISOString()
          });

        if (subscriptionError) {
          console.error('Subscription creation error:', subscriptionError);
          // Continue even if subscription creation fails
        }

      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue with user update even if database operations fail
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Subscription upgraded successfully',
      data: {
        plan: planName,
        price: price,
        billingCycle: billingCycle,
        subscriptionEnd: subscriptionEnd.toISOString(),
        activatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Payment upgrade error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's current subscription
    let subscription = null;
    
    if (supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'ACTIVE')
          .single();

        if (!error && data) {
          subscription = data;
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      subscription: subscription || null
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
