import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Fallback defaults
const DEFAULTS = {
  contactSectionEnabled: true,
  contactLabel: "Biz bilan bog'lanish",
  contactHeading: "JURISTIV hamjamiyatiga qo'shiling",
  contactDescription:
    "Eng so'nggi yangiliklar, platforma yangilanishlari, foydali huquqiy materiallar va e'lonlardan xabardor bo'lib boring.",
  socialLinks: [
    { platform: 'telegram', url: 'https://t.me/juristiv', enabled: true },
    { platform: 'instagram', url: 'https://instagram.com/juristiv', enabled: true },
  ] as Array<{
    platform: string
    url: string
    enabled: boolean
  }>,
}

// GET — public contact settings
export async function GET() {
  try {
    if (!supabaseUrl || !supabaseKey || supabaseKey.includes('REPLACE_WITH')) {
      return NextResponse.json({ success: true, data: DEFAULTS })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', [
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

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        data: { ...DEFAULTS, socialLinks: DEFAULTS.socialLinks },
      })
    }

    const settings: Record<string, string> = {}
    data.forEach(row => {
      settings[row.key] = row.value || ''
    })

    // Return ALL platforms with their saved state (admin needs to see all)
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
    const body = await request.json()
    const { contactSectionEnabled, contactLabel, contactHeading, contactDescription, socialLinks } =
      body

    if (!supabaseUrl || !supabaseKey || supabaseKey.includes('REPLACE_WITH')) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

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

    const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' })

    if (error) {
      console.error('[Contact Settings] Save error:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 })
  }
}
