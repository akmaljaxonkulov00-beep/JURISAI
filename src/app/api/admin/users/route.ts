import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Admin-only: Get all users with search and filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const role = searchParams.get('role');

    const skip = (page - 1) * limit;

    // Build query for search and filters
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    const { data: users, error, count } = await query;

    if (error) throw error;

    // Get subscription history for each user
    const formattedUsers = await Promise.all(
      (users || []).map(async (user) => {
        const { data: subscriptions } = await supabase
          .from('subscription_history')
          .select('*')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .limit(1);

        const { data: usageCount } = await supabase
          .from('usage_tracking')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);

        return {
          id: user.id,
          email: user.email,
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ')[1] || '',
          phone: user.phone || '',
          role: user.role,
          status: 'ACTIVE', // Mock status
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          subscription: subscriptions && subscriptions.length > 0 ? {
            id: subscriptions[0].id,
            planName: subscriptions[0].plan_name,
            planPrice: subscriptions[0].plan_price,
            status: 'ACTIVE',
            currentPeriodEnd: subscriptions[0].expires_at,
          } : null,
          aiUsageCount: usageCount?.length || 0,
        };
      })
    );

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Foydalanuvchilarni olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

// PATCH - Admin-only: Update user status or subscription
export async function PATCH(request: NextRequest) {
  try {
    const { userId, action, data } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Foydalanuvchi topilmadi' },
        { status: 404 }
      );
    }

    let updatedUser;

    switch (action) {
      case 'block':
        updatedUser = await supabase
          .from('users')
          .update({ status: 'SUSPENDED' })
          .eq('id', userId)
          .select()
          .single();
        break;

      case 'unblock':
        updatedUser = await supabase
          .from('users')
          .update({ status: 'ACTIVE' })
          .eq('id', userId)
          .select()
          .single();
        break;

      case 'changeSubscription':
        if (!data.planId) {
          return NextResponse.json(
            { error: 'Plan ID is required' },
            { status: 400 }
          );
        }

        const planPrices: Record<string, number> = {
          basic: 49000,
          pro: 99000,
          premium: 199000
        };

        const planPrice = planPrices[data.planId] || 99000;
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        // Update user subscription
        updatedUser = await supabase
          .from('users')
          .update({
            subscription_plan: data.planId,
            subscription_expires_at: expiresAt.toISOString()
          })
          .eq('id', userId)
          .select()
          .single();

        // Add to subscription history
        await supabase
          .from('subscription_history')
          .insert({
            id: crypto.randomUUID(),
            user_id: userId,
            plan_id: data.planId,
            plan_name: data.planId.charAt(0).toUpperCase() + data.planId.slice(1),
            plan_price: planPrice,
            started_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            payment_id: null
          });
        break;

      case 'changeRole':
        if (!data.role) {
          return NextResponse.json(
            { error: 'Role is required' },
            { status: 400 }
          );
        }

        updatedUser = await supabase
          .from('users')
          .update({ role: data.role })
          .eq('id', userId)
          .select()
          .single();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: 'Foydalanuvchi ma\'lumotlari muvaffaqiyatli yangilandi',
      user: updatedUser,
    });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Foydalanuvchini yangilashda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
