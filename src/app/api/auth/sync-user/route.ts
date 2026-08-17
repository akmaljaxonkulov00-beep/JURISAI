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
    const {
      id,
      email,
      name,
      full_name,
      phone,
      avatar,
      role,
      subscription_plan,
      provider,
    } = body

    if (!id || !email) {
      return NextResponse.json({ success: false, error: 'id va email majburiy' }, { status: 400 })
    }

    // `name` bilan birga `full_name` ham yoziladi — Jamiyat a'zolar ro'yxati
    // va boshqa joylar full_name dan o'qiydi
    const resolvedName = full_name || name || email.split('@')[0] || ''

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

    const insertPayload: Record<string, any> = {
      id,
      email,
      name: resolvedName,
      full_name: resolvedName,
      role: role || 'USER',
      subscription_plan: subscription_plan || 'free',
      provider: provider || 'email',
      created_at: now,
      last_login: now,
    }
    if (phone) insertPayload.phone = phone
    if (avatar) insertPayload.avatar = avatar

    // ── Yozish (chidamli: phone ustuni bazada bo'lmasa unsiz qayta urinamiz) ──
    const runInsert = async (payload: Record<string, any>) =>
      supabase.from('registered_users').insert(payload)
    const runUpdate = async (payload: Record<string, any>) =>
      supabase.from('registered_users').update(payload).eq('id', id).select().single()

    // First try INSERT (for new users)
    let insertResult = await runInsert(insertPayload)

    // `phone` ustuni yo'q (eski baza) — phone'siz qayta urinamiz
    if (insertResult.error && /column.*phone|phone.*column/i.test(insertResult.error.message)) {
      const { phone: _drop, ...payloadNoPhone } = insertPayload
      insertResult = await runInsert(payloadNoPhone)
    }

    // If user already exists (duplicate key), only update metadata — keep created_at
    if (insertResult.error && insertResult.error.code === '23505') {
      const updatePayload: Record<string, any> = {
        email,
        name: resolvedName,
        full_name: resolvedName,
        role: role || 'USER',
        subscription_plan: subscription_plan || 'free',
        provider: provider || 'email',
        last_login: now,
      }
      if (phone) updatePayload.phone = phone
      if (avatar) updatePayload.avatar = avatar
      let updateResult = await runUpdate(updatePayload)
      if (updateResult.error && /column.*phone|phone.*column/i.test(updateResult.error.message)) {
        const { phone: _drop, ...payloadNoPhone } = updatePayload
        updateResult = await runUpdate(payloadNoPhone)
      }
      if (updateResult.error) {
        console.warn('[sync-user] Update error:', updateResult.error.message)
        return NextResponse.json({ success: false, error: updateResult.error.message }, { status: 200 })
      }
      return NextResponse.json({ success: true, data: updateResult.data })
    }

    if (insertResult.error) {
      console.warn('[sync-user] Insert error:', insertResult.error.message)
      return NextResponse.json({ success: false, error: insertResult.error.message }, { status: 200 })
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
