import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getErrorMessage } from '@/lib/errors'

// site_settings — YAGONA key-value jadval (20260905 migration).
// Public GET: sayt sozlamalarini key/value formatdan o'qiydi.
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

export async function GET() {
  try {
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
      console.error('[Settings Public] Error:', error)
    }

    const settings: Record<string, string> = {}
    if (data) {
      data.forEach(row => {
        settings[row.key] = row.value || ''
      })
    }

    const transformed = {
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

    return NextResponse.json({ success: true, data: transformed })
  } catch (error) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 })
  }
}
