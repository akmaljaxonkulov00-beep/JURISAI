import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/auth-users
 * 
 * Returns all authenticated users from Supabase Auth via service_role key.
 * This is the ONLY way to access auth.users (not queryable with anon key).
 * Used by admin panel to show real registered users.
 * 
 * Query params:
 *   ?search=email@example.com  — search by email or name
 *   ?page=1&limit=10           — pagination
 *   ?sort=created_at           — sort field
 *   ?order=desc                — sort order
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const offset = (page - 1) * limit;

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        users: [],
        total: 0,
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── Query auth.users table (requires service_role key!) ──
    // Supabase stores all authenticated users in auth.users
    let userQuery = supabase
      .from('auth_users_view')
      .select('*', { count: 'exact' });

    // If search is provided, filter by email
    if (search) {
      userQuery = userQuery.or(`email.ilike.%${search}%,raw_user_meta_data->>name.ilike.%${search}%`);
    }

    const { data: authUsers, error: authError, count } = await userQuery
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    // If auth_users_view doesn't exist (it's a Supabase view), try the raw table
    if (authError && authError.message?.includes('relation') || authError?.code === '42P01') {
      // auth schema requires explicit schema prefix
      const { data: users, error: usersError, count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .limit(limit)
        .order(sort === 'created_at' ? 'created_at' : sort, { ascending: order === 'asc' });

      if (!usersError && users) {
        const mapped = users.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name || u.display_name || '',
          role: u.role || 'USER',
          subscription_plan: u.subscription_plan || 'free',
          subscription_expires_at: u.subscription_expires_at || '',
          balance: u.balance || 0,
          blocked: u.blocked || false,
          created_at: u.created_at || u.createdAt || '',
          last_login: u.last_login || u.lastLogin || '',
          status: u.blocked ? 'blocked' : 'active',
          source: 'users_table',
        }));

        return NextResponse.json({
          success: true,
          users: mapped,
          total: usersCount || mapped.length,
          page,
          limit,
          source: 'users_table',
        });
      }

      // Try registered_users as final fallback
      const { data: regUsers, error: regError, count: regCount } = await supabase
        .from('registered_users')
        .select('*', { count: 'exact' })
        .limit(limit)
        .order('created_at', { ascending: order === 'asc' });

      if (!regError && regUsers) {
        const mapped = regUsers.map((u: any) => ({
          id: u.id,
          email: u.email || '',
          name: u.name || '',
          role: u.role || 'USER',
          subscription_plan: u.subscription_plan || 'free',
          subscription_expires_at: u.subscription_expires_at || '',
          balance: u.balance || 0,
          blocked: u.blocked || false,
          created_at: u.created_at || '',
          last_login: u.last_login || '',
          status: u.blocked ? 'blocked' : 'active',
          source: 'registered_users',
        }));

        return NextResponse.json({
          success: true,
          users: mapped,
          total: regCount || mapped.length,
          page,
          limit,
          source: 'registered_users',
        });
      }

      // All tables empty — return empty array, not mock data
      return NextResponse.json({
        success: true,
        users: [],
        total: 0,
        page,
        limit,
        message: 'Hali hech qanday foydalanuvchi ro\'yxatdan o\'tmagan',
        source: 'empty',
      });
    }

    if (authError) throw authError;

    // Map auth.users to admin-friendly format
    const mapped = (authUsers || []).map((u: any) => ({
      id: u.id,
      email: u.email || '',
      name: u.raw_user_meta_data?.name || u.raw_app_meta_data?.name || u.email?.split('@')[0] || '',
      role: u.raw_app_meta_data?.role || u.role || 'USER',
      subscription_plan: u.raw_user_meta_data?.subscription_plan || 'free',
      subscription_expires_at: u.raw_user_meta_data?.subscription_expires_at || '',
      balance: u.raw_user_meta_data?.balance || 0,
      blocked: u.raw_user_meta_data?.blocked || false,
      created_at: u.created_at || '',
      last_login: u.last_sign_in_at || u.updated_at || u.created_at || '',
      status: u.banned_until ? 'blocked' : 'active',
      source: 'auth.users',
      phone: u.phone || '',
      provider: u.app_metadata?.provider || 'email',
    }));

    return NextResponse.json({
      success: true,
      users: mapped,
      total: count || mapped.length,
      page,
      limit,
      source: 'auth.users',
    });
  } catch (error: any) {
    console.error('[Admin Auth Users] Error:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to fetch users',
      users: [],
      total: 0,
    });
  }
}
