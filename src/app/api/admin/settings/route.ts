import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/server-auth'
import { logAdminAction } from '@/lib/admin-audit'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    let supabase
    try {
      supabase = getSupabaseAdmin()
    } catch {
      return NextResponse.json({ success: false, error: 'Supabase not configured' })
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Settings load error:', error)
    }

    return NextResponse.json({ success: true, data: data || null })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Xatolik'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json({ success: false, error: 'Settings are required' }, { status: 400 })
    }

    let supabase
    try {
      supabase = getSupabaseAdmin()
    } catch {
      return NextResponse.json({ success: false, error: 'Supabase not configured' })
    }

    // Convert camelCase keys to snake_case for Supabase table
    const snakeCaseSettings: Record<string, unknown> = {
      id: 'global',
      updated_at: new Date().toISOString(),
    }

    const keyMap: Record<string, string> = {
      announcementBanner: 'announcement_banner',
      heroTitle: 'hero_title',
      heroSubtitle: 'hero_subtitle',
      contactEmail: 'contact_email',
      contactPhone: 'contact_phone',
      telegramLink: 'telegram_link',
      legalDisclaimer: 'legal_disclaimer',
      systemPrompt: 'system_prompt',
      paymentCardNumber: 'payment_card_number',
      paymentDetails: 'payment_details',
    }

    for (const [camelKey, value] of Object.entries(settings)) {
      const snakeKey = keyMap[camelKey] || camelKey
      snakeCaseSettings[snakeKey] = value
    }

    const { error } = await supabase.from('site_settings').upsert(snakeCaseSettings)

    if (error) {
      await logAdminAction({
        admin: auth.user,
        action: 'settings_update',
        targetType: 'settings',
        targetId: 'global',
        details: { error: error.message },
        success: false,
      })
      console.error('Settings save error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    await logAdminAction({
      admin: auth.user,
      action: 'settings_update',
      targetType: 'settings',
      targetId: 'global',
      details: { changedKeys: Object.keys(settings) },
      success: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Xatolik'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
