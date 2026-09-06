import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { supabase as defaultClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/server-auth'
import { getSiteSettings, upsertSiteSettings } from '@/lib/site-settings-db'

function getDb() {
  try {
    return getSupabaseAdmin()
  } catch {
    return defaultClient
  }
}

// Fallback defaults — ijtimoiy tarmoqlar DEFAULT BO'SH (admin kiritadi).
// Yo'q/taxminiy URL ishlatilmaydi: admin saqlagan qiymat single source of truth.
const DEFAULTS = {
  contactSectionEnabled: true,
  contactLabel: "Biz bilan bog'lanish",
  contactHeading: "JURISTIV hamjamiyatiga qo'shiling",
  contactDescription:
    "Eng so'nggi yangiliklar, platforma yangilanishlari, foydali huquqiy materiallar va e'lonlardan xabardor bo'lib boring.",
  socialLinks: [
    { platform: 'telegram', url: '', enabled: false },
    { platform: 'instagram', url: '', enabled: false },
    { platform: 'youtube', url: '', enabled: false },
    { platform: 'linkedin', url: '', enabled: false },
    { platform: 'website', url: '', enabled: false },
  ] as Array<{
    platform: string
    url: string
    enabled: boolean
  }>,
}

// GET — public contact settings
export async function GET() {
  try {
    const supabase = getDb()

    const settings = await getSiteSettings(supabase, [
      'contact_section_enabled',
      'contact_label',
      'contact_heading',
      'contact_description',
      'social_telegram',
      'social_telegram_enabled',
      'social_instagram',
      'social_instagram_enabled',
      'social_youtube',
      'social_youtube_enabled',
      'social_linkedin',
      'social_linkedin_enabled',
      'social_website',
      'social_website_enabled',
    ])

    if (Object.keys(settings).length === 0) {
      return NextResponse.json({
        success: true,
        data: { ...DEFAULTS, socialLinks: DEFAULTS.socialLinks },
      })
    }

    const socialLinks = [
      {
        platform: 'telegram',
        url: settings.social_telegram || '',
        enabled: settings.social_telegram_enabled === 'true',
      },
      {
        platform: 'instagram',
        url: settings.social_instagram || '',
        enabled: settings.social_instagram_enabled === 'true',
      },
      {
        platform: 'youtube',
        url: settings.social_youtube || '',
        enabled: settings.social_youtube_enabled === 'true',
      },
      {
        platform: 'linkedin',
        url: settings.social_linkedin || '',
        enabled: settings.social_linkedin_enabled === 'true',
      },
      {
        platform: 'website',
        url: settings.social_website || '',
        enabled: settings.social_website_enabled === 'true',
      },
    ]

    return NextResponse.json({
      success: true,
      data: {
        contactSectionEnabled: settings.contact_section_enabled !== 'false',
        contactLabel: settings.contact_label || DEFAULTS.contactLabel,
        contactHeading: settings.contact_heading || DEFAULTS.contactHeading,
        contactDescription: settings.contact_description || DEFAULTS.contactDescription,
        socialLinks,
      },
    })
  } catch {
    return NextResponse.json({ success: true, data: DEFAULTS })
  }
}

// POST — admin update contact settings
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { contactSectionEnabled, contactLabel, contactHeading, contactDescription, socialLinks } =
      body

    const supabase = getDb()

    // Build upsert data
    const upserts = [
      { key: 'contact_section_enabled', value: String(contactSectionEnabled ?? true) },
      { key: 'contact_label', value: contactLabel || '' },
      { key: 'contact_heading', value: contactHeading || '' },
      { key: 'contact_description', value: contactDescription || '' },
    ]

    // Social links
    const platforms = ['telegram', 'instagram', 'youtube', 'linkedin', 'website']
    const linksArray = Array.isArray(socialLinks) ? socialLinks : []

    for (const platform of platforms) {
      const link = linksArray.find((l: { platform: string }) => l.platform === platform)
      upserts.push({ key: `social_${platform}`, value: link?.url || '' })
      upserts.push({
        key: `social_${platform}_enabled`,
        value: String(link?.enabled ?? false),
      })
    }

    const result = await upsertSiteSettings(supabase, upserts)

    if (result.error) {
      console.error('[Contact Settings] Save error:', result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, skipped: result.skipped || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
