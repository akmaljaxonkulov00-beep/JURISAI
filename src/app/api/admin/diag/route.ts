import { NextResponse } from 'next/server';

/**
 * GET /api/admin/diag
 *
 * Diagnostic endpoint that tests ALL data sources and reports exactly
 * what works and what doesn't.
 *
 * Used to debug why admin panel shows empty users/payments.
 */
export async function GET() {
  const results: Record<string, any> = {};
  const errors: Record<string, string> = {};

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl) { errors.supabase_url = 'NEXT_PUBLIC_SUPABASE_URL is not set'; }
  if (!serviceRoleKey) { errors.service_role_key = 'SUPABASE_SERVICE_ROLE_KEY is not set'; }

  // ── 1. Test auth.users via Accept-Profile header ──
  results.test_auth_users_api = { status: 'pending', count: 0 };
  try {
    const authRes = await fetch(
      `${supabaseUrl}/rest/v1/users?select=id,email,created_at,last_sign_in_at&limit=5`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Accept-Profile': 'auth',
          'Content-Type': 'application/json',
        },
      }
    );
    results.test_auth_users_api.http_status = authRes.status;
    results.test_auth_users_api.http_ok = authRes.ok;
    if (authRes.ok) {
      const body = await authRes.json();
      results.test_auth_users_api.is_array = Array.isArray(body);
      results.test_auth_users_api.count = Array.isArray(body) ? body.length : 0;
      results.test_auth_users_api.sample = Array.isArray(body) && body.length > 0
        ? { id: body[0].id?.substring(0, 8) + '...', email: body[0].email }
        : 'empty array';
    } else {
      const errText = await authRes.text();
      results.test_auth_users_api.error_text = errText.substring(0, 200);
      errors.auth_users_api = `HTTP ${authRes.status}: ${errText.substring(0, 100)}`;
    }
  } catch (e: any) {
    results.test_auth_users_api.status = 'error';
    errors.auth_users_api = e?.message || 'fetch failed';
  }

  // ── 2. Test registered_users table ──
  results.test_registered_users = { status: 'pending', count: 0 };
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error, count } = await supabase
      .from('registered_users')
      .select('*', { count: 'exact', head: true });
    if (error) {
      results.test_registered_users.status = 'error';
      errors.registered_users = error.message;
    } else {
      results.test_registered_users.status = 'ok';
      results.test_registered_users.count = count || 0;
      results.test_registered_users.has_data = (count || 0) > 0;
    }
  } catch (e: any) {
    results.test_registered_users.status = 'error';
    errors.registered_users = e?.message || 'failed';
  }

  // ── 3. Test users table (legacy) ──
  results.test_users_table = { status: 'pending', count: 0 };
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    if (error) {
      results.test_users_table.status = 'error';
      errors.users_table = error.message;
    } else {
      results.test_users_table.status = 'ok';
      results.test_users_table.count = count || 0;
      results.test_users_table.has_data = (count || 0) > 0;
    }
  } catch (e: any) {
    results.test_users_table.status = 'error';
    errors.users_table = e?.message || 'failed';
  }

  // ── 4. Test payment_requests table ──
  results.test_payment_requests = { status: 'pending', count: 0 };
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error, count } = await supabase
      .from('payment_requests')
      .select('*', { count: 'exact', head: true });
    if (error) {
      results.test_payment_requests.status = 'error';
      errors.payment_requests = error.message;
    } else {
      results.test_payment_requests.status = 'ok';
      results.test_payment_requests.count = count || 0;
      results.test_payment_requests.has_data = (count || 0) > 0;
    }
  } catch (e: any) {
    results.test_payment_requests.status = 'error';
    errors.payment_requests = e?.message || 'failed';
  }

  // ── 5. Test categories table ──
  results.test_categories = { status: 'pending', count: 0 };
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error, count } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });
    if (error) {
      results.test_categories.status = 'error';
      errors.categories = error.message;
    } else {
      results.test_categories.status = 'ok';
      results.test_categories.count = count || 0;
      results.test_categories.has_data = (count || 0) > 0;
    }
  } catch (e: any) {
    results.test_categories.status = 'error';
    errors.categories = e?.message || 'failed';
  }

  // ── 6. Test auth_logs table ──
  results.test_auth_logs = { status: 'pending', count: 0 };
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error, count } = await supabase
      .from('auth_logs')
      .select('*', { count: 'exact', head: true });
    if (error) {
      results.test_auth_logs.status = 'error';
      errors.auth_logs = error.message;
    } else {
      results.test_auth_logs.status = 'ok';
      results.test_auth_logs.count = count || 0;
      results.test_auth_logs.has_data = (count || 0) > 0;
    }
  } catch (e: any) {
    results.test_auth_logs.status = 'error';
    errors.auth_logs = e?.message || 'failed';
  }

  // ── 7. Test usage_logs table ──
  results.test_usage_logs = { status: 'pending', count: 0 };
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error, count } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true });
    if (error) {
      results.test_usage_logs.status = 'error';
      errors.usage_logs = error.message;
    } else {
      results.test_usage_logs.status = 'ok';
      results.test_usage_logs.count = count || 0;
      results.test_usage_logs.has_data = (count || 0) > 0;
    }
  } catch (e: any) {
    results.test_usage_logs.status = 'error';
    errors.usage_logs = e?.message || 'failed';
  }

  // ── 8. Test pricing_plans table ──
  results.test_pricing_plans = { status: 'pending', count: 0 };
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error, count } = await supabase
      .from('pricing_plans')
      .select('*', { count: 'exact', head: true });
    if (error) {
      results.test_pricing_plans.status = 'error';
      errors.pricing_plans = error.message;
    } else {
      results.test_pricing_plans.status = 'ok';
      results.test_pricing_plans.count = count || 0;
      results.test_pricing_plans.has_data = (count || 0) > 0;
    }
  } catch (e: any) {
    results.test_pricing_plans.status = 'error';
    errors.pricing_plans = e?.message || 'failed';
  }

  // ── 9. Test site_settings table ──
  results.test_site_settings = { status: 'pending', count: 0 };
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error, count } = await supabase
      .from('site_settings')
      .select('*', { count: 'exact', head: true });
    if (error) {
      results.test_site_settings.status = 'error';
      errors.site_settings = error.message;
    } else {
      results.test_site_settings.status = 'ok';
      results.test_site_settings.count = count || 0;
      results.test_site_settings.has_data = (count || 0) > 0;
    }
  } catch (e: any) {
    results.test_site_settings.status = 'error';
    errors.site_settings = e?.message || 'failed';
  }

  return NextResponse.json({
    success: true,
    summary: {
      env_configured: !!supabaseUrl && !!serviceRoleKey,
      supabase_url: supabaseUrl?.substring(0, 30) + '...',
      auth_users_available: results.test_auth_users_api.count > 0,
      registered_users_table_ok: results.test_registered_users.status === 'ok',
      users_table_ok: results.test_users_table.status === 'ok',
      payment_requests_table_ok: results.test_payment_requests.status === 'ok',
    },
    results,
    errors,
  });
}
