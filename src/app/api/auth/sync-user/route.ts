import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/sync-user
 *
 * Foydalanuvchi Firebase orqali ro'yxatdan o'tganda yoki login qilganda
 * Supabase registered_users jadvaliga yozish uchun chaqiriladi.
 *
 * Bu API orqali admin panel foydalanuvchilarni real vaqtda ko'ra oladi.
 * Service role key bilan ishlaydi — anon key bilan ishlamaydi.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, name, role, subscription_plan } = body;

    if (!id || !email) {
      return NextResponse.json(
        { success: false, error: 'id va email majburiy' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      // Supabase mavjud emas — faqat localStorage da saqlanadi
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        fallback: 'localStorage',
      });
    }

    // Sync to registered_users table via REST API (service_role key bilan)
    const endpoint = `${supabaseUrl}/rest/v1/registered_users`;
    const payload = {
      id,
      email,
      name: name || email.split('@')[0] || '',
      role: role || 'USER',
      subscription_plan: subscription_plan || 'free',
      last_login: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok && response.status !== 409) {
      // 409 = conflict (already exists, which is fine with merge-duplicates)
      const errText = await response.text().catch(() => 'unknown error');
      console.warn('[Sync-User] Supabase upsert warning:', response.status, errText.slice(0, 200));

      // Try alternative: check if table needs PATCH instead
      if (response.status === 404) {
        // Table might not exist — try creating via raw SQL or skip
        return NextResponse.json({
          success: false,
          error: 'registered_users table not found',
          fallback: 'localStorage',
        });
      }

      return NextResponse.json({
        success: false,
        error: `Supabase error: ${response.status}`,
        fallback: 'localStorage',
      });
    }

    // Success — also update the auth.users metadata if possible
    try {
      // Try to update ONLY this specific user's auth.users raw_user_meta_data
      const authEndpoint = `${supabaseUrl}/rest/v1/users?id=eq.${encodeURIComponent(id)}`;
      await fetch(authEndpoint, {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Accept-Profile': 'auth',
        },
        body: JSON.stringify({
          raw_user_meta_data: {
            name: payload.name,
            role: payload.role,
            subscription_plan: payload.subscription_plan,
            synced_at: new Date().toISOString(),
          },
        }),
      });
    } catch {
      // auth.users update is optional — non-critical
    }

    return NextResponse.json({
      success: true,
      message: 'Foydalanuvchi sinxronlashtirildi',
      userId: id,
    });
  } catch (error: any) {
    console.error('[Sync-User] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Sync xatosi' },
      { status: 500 }
    );
  }
}
