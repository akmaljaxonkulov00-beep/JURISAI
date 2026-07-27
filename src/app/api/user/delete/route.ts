import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, authToken } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, error: 'Foydalanuvchi ID yoki email talab qilinadi' },
        { status: 400 }
      );
    }

    // ── Verify auth — server-side session check ──
    // The client sends the session auth token. We verify it matches at least one identifier.
    // Additionally check the jurisai_auth cookie set by firebase-auth.ts on login.
    const cookieAuth = request.cookies.get('jurisai_auth')?.value;
    
    // If no valid auth token and no auth cookie, reject
    const hasValidToken = authToken && (authToken === userId || authToken === email);
    const hasValidCookie = cookieAuth === '1' && (userId || email);
    
    if (!hasValidToken && !hasValidCookie) {
      return NextResponse.json(
        { success: false, error: 'Ruxsat etilmagan. Iltimos, qayta kiring.' },
        { status: 401 }
      );
    }

    // ── 1. Delete from Supabase tables ──
    let supabaseDeleted = false;
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const headers = {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        };

        // Delete from profiles
        if (userId) {
          await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
            method: 'DELETE', headers,
          });
        }

        // Delete from payments — by user_id OR user_email
        const paymentFilters = [];
        if (userId) paymentFilters.push(`user_id=eq.${encodeURIComponent(userId)}`);
        if (email) paymentFilters.push(`user_email=eq.${encodeURIComponent(email)}`);
        if (paymentFilters.length > 0) {
          await fetch(`${supabaseUrl}/rest/v1/payments?or=(${paymentFilters.join(',')})`, {
            method: 'DELETE', headers,
          });
        }

        // Delete from subscriptions
        if (userId) {
          await fetch(`${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(userId)}`, {
            method: 'DELETE', headers,
          });
        }

        // Delete from usage_logs
        if (userId) {
          await fetch(`${supabaseUrl}/rest/v1/usage_logs?user_id=eq.${encodeURIComponent(userId)}`, {
            method: 'DELETE', headers,
          });
        }

        // Delete from login_activity
        if (email) {
          await fetch(`${supabaseUrl}/rest/v1/login_activity?email=eq.${encodeURIComponent(email)}`, {
            method: 'DELETE', headers,
          });
        }

        supabaseDeleted = true;
      }
    } catch (dbError) {
      console.error('Supabase deletion error:', dbError);
      // Continue — client will clear locally
    }

    return NextResponse.json({
      success: true,
      message: 'Hisob muvaffaqiyatli o\'chirildi',
      supabaseDeleted,
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Hisobni o\'chirishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
