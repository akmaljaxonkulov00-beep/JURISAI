import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/server-auth'
import { logAdminAction } from '@/lib/admin-audit'

// site_settings — YAGONA key-value jadval (20260905 migration).
// Admin GET/POST: sayt sozlamalarini key/value formatda o'qiydi/yozadi.
const SETTINGS_KEYS = [
  'announcement_banner',
  'hero_title',
  'hero_subtitle',
  'contact_email',
  'contact_phone',
  'telegram_link',
  'legal_disclaimer',
  'system_prompt',
  'payment_card_number',
  'payment_details',
]

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
      .select('key, value')
      .in('key', SETTINGS_KEYS)

    if (error) {
      console.error('Settings load error:', error)
    }

    const settings: Record<string, string> = {}
    if (data) {
      data.forEach(row => {
        settings[row.key] = row.value || ''
      })
    }

    const result = {
      announcementBanner: settings.announcement_banner || '',
      heroTitle: settings.hero_title || '',
      heroSubtitle: settings.hero_subtitle || '',
      contactEmail: settings.contact_email || '',
      contactPhone: settings.contact_phone || '',
      telegramLink: settings.telegram_link || '',
      legalDisclaimer: settings.legal_disclaimer || '',
      systemPrompt: settings.system_prompt || '',
      paymentCardNumber: settings.payment_card_number || '',
      paymentDetails: settings.payment_details || '',
    }

    return NextResponse.json({ success: true, data: result })
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

    // camelCase → snake_case key'larga o'girib key-value upsert
    const upserts: Array<{ key: string; value: string; updated_at: string }> = []
    for (const [camelKey, value] of Object.entries(settings)) {
      const snakeKey = keyMap[camelKey] || camelKey
      if (!SETTINGS_KEYS.includes(snakeKey)) continue
      upserts.push({
        key: snakeKey,
        value: value == null ? '' : String(value),
        updated_at: new Date().toISOString(),
      })
    }

    if (upserts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid settings to save' },
        { status: 400 }
      )
    }

    const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' })

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
