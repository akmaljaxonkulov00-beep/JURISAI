import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getErrorMessage } from '@/lib/errors'

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
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Settings Public] Error:', error)
    }

    // Transform snake_case to camelCase for frontend
    if (data) {
      const transformed: Record<string, unknown> = {
        announcementBanner: data.announcement_banner || '',
        heroTitle: data.hero_title || '',
        heroSubtitle: data.hero_subtitle || '',
        contactEmail: data.contact_email || '',
        contactPhone: data.contact_phone || '',
        telegramLink: data.telegram_link || '',
        legalDisclaimer: data.legal_disclaimer || '',
        systemPrompt: data.system_prompt || '',
        paymentCardNumber: data.payment_card_number || '',
        paymentDetails: data.payment_details || '',
      }
      return NextResponse.json({ success: true, data: transformed })
    }

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 })
  }
}
