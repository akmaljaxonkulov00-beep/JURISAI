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

// PATCH - Admin-only: Update user fields (role, subscription, block status)
// Accepts direct field updates — matches admin page syncUserToSupabase()
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, data, ...directFields } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Support both action-based (legacy) and direct field updates
    let updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (action) {
      switch (action) {
        case 'block':
          updatePayload.blocked = true;
          break;
        case 'unblock':
          updatePayload.blocked = false;
          break;
        case 'changeRole':
          updatePayload.role = data?.role || 'USER';
          break;
        case 'changeSubscription':
          updatePayload.subscription_plan = data?.planId || 'free';
          updatePayload.subscription_expires_at = data?.expiresAt || 
            new Date(Date.now() + 365 * 86400000).toISOString();
          break;
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    } else {
      // Direct field updates from syncUserToSupabase
      if (directFields.role !== undefined) updatePayload.role = directFields.role;
      if (directFields.subscription_plan !== undefined) updatePayload.subscription_plan = directFields.subscription_plan;
      if (directFields.subscription_expires_at !== undefined) updatePayload.subscription_expires_at = directFields.subscription_expires_at;
      if (directFields.blocked !== undefined) updatePayload.blocked = directFields.blocked;
      if (directFields.name !== undefined) updatePayload.name = directFields.name;
      if (directFields.email !== undefined) updatePayload.email = directFields.email;
    }

    // Use the same table name as analytics API: registered_users
    // Try update first to avoid creating phantom records
    const { data: existing, error: checkError } = await supabase
      .from('registered_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existing) {
      // Update existing user
      const { error: updateError } = await supabase
        .from('registered_users')
        .update(updatePayload)
        .eq('id', userId);

      if (updateError) {
        console.error('[Admin Users] Update error:', updateError);
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }
    } else {
      // Fallback to 'users' table
      const { error: fallbackError } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', userId);

      if (fallbackError) {
        console.error('[Admin Users] Fallback update error:', fallbackError);
        return NextResponse.json({ success: false, error: fallbackError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Foydalanuvchi maʼlumotlari yangilandi' });
  } catch (error: any) {
    console.error('[Admin Users] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

// DELETE - Admin-only: Remove user
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Try registered_users first, fallback to users
    const { error } = await supabase.from('registered_users').delete().eq('id', userId);
    
    if (error) {
      await supabase.from('users').delete().eq('id', userId);
    }

    return NextResponse.json({ success: true, message: 'Foydalanuvchi o\'chirildi' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
