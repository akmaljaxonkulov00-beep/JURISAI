import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { isAdminRole } from '@/lib/roles'

/**
 * GET /api/log/auth?limit=50
 * So'nggi kirish loglarini qaytaradi (faqat admin uchun — role tekshiriladi).
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let supabase
    try {
      supabase = getSupabaseAdmin()
    } catch {
      return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 })
    }

    // JWT'dan foydalanuvchini olamiz va admin ekanligini tekshiramiz
    const { data: { user }, error: userErr } = await supabase.auth.getUser(authHeader)
    if (userErr || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('registered_users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || !isAdminRole(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '50'), 200)
    const { data: logs, error } = await supabase
      .from('auth_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, logs: logs || [] })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Xatolik' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, method, userId, success } = body

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    let supabase
    try {
      supabase = getSupabaseAdmin()
    } catch {
      // Supabase not configured - silently skip logging
      return NextResponse.json({ success: true, note: 'Supabase not configured' })
    }

    // auth_logs jadvali ustunlari: id, user_id, email, method, created_at
    // (success ustuni mavjud emas — shu sababli avval barcha yozuvlar fail bo'lgan)
    const { error } = await supabase.from('auth_logs').insert({
      user_id: userId || email,
      email,
      method: method || 'email',
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Auth log insert error:', error)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Auth logging API error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Logging failed' },
      { status: 500 }
    )
  }
}
