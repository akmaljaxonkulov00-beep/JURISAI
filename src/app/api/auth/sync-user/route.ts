import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/auth/sync-user
 *
 * Firebase Auth dan foydalanuvchi ma'lumotlarini Supabase registered_users
 * jadvaliga sinxronlash. Bu endpoint firebase-auth.ts dagi syncUserToSupabase()
 * funksiyasi tomonidan chaqiriladi.
 *
 * Agar SUPABASE_SERVICE_ROLE_KEY mavjud bo'lmasa, anon key bilan ishlaydi.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, email, name, role, subscription_plan } = body

    if (!id || !email) {
      return NextResponse.json({ success: false, error: 'id va email majburiy' }, { status: 400 })
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://blayqzykzlmrjuvhzvsk.supabase.co'
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsYXlxenlremxtcmp1dmh6dnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MzAzNzAsImV4cCI6MjEwMDMwNjM3MH0._4WASFfKkRenHpScrQM6vS2zPTZmyDfMCNr5GmAgOkw'

    // Try service role key first, fallback to anon key
    const key = serviceKey || anonKey
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Supabase key not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Insert or update: preserve original created_at
    const now = new Date().toISOString()

    // First try INSERT (for new users)
    const { error: insertError } = await supabase.from('registered_users').insert({
      id,
      email,
      name: name || email.split('@')[0] || '',
      role: role || 'USER',
      subscription_plan: subscription_plan || 'free',
      created_at: now,
      last_login: now,
    })

    // If user already exists (duplicate key), only update metadata — keep created_at
    if (insertError && insertError.code === '23505') {
      const { data: updated } = await supabase
        .from('registered_users')
        .update({
          email,
          name: name || email.split('@')[0] || '',
          role: role || 'USER',
          subscription_plan: subscription_plan || 'free',
          last_login: now,
        })
        .eq('id', id)
        .select()
        .single()

      return NextResponse.json({ success: true, data: updated })
    }

    if (insertError) {
      console.warn('[sync-user] Insert error:', insertError.message)
      return NextResponse.json({ success: false, error: insertError.message }, { status: 200 })
    }

    // Fetch the newly created record
    const { data, error: fetchError } = await supabase
      .from('registered_users')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      // If table doesn't exist or RLS blocks, silently ignore
      console.warn('[sync-user] Upsert error:', fetchError.message)
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 200 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.warn('[sync-user] Error:', error?.message)
    return NextResponse.json({ success: false, error: error?.message }, { status: 200 })
  }
}
