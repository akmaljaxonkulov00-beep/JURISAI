import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const ALLOWED_TYPES = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

function getSupabase() {
  if (!supabaseUrl || !supabaseKey || supabaseKey.includes('REPLACE_WITH')) return null
  return createClient(supabaseUrl, supabaseKey)
}

// GET — retrieve current logos (light, dark, favicon)
export async function GET() {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({
        logoUrl: null,
        logoDarkUrl: null,
        faviconUrl: null,
      })
    }

    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['logo_url', 'logo_dark_url', 'favicon_url'])

    const settings: Record<string, string> = {}
    if (data) {
      data.forEach(row => {
        settings[row.key] = row.value || ''
      })
    }

    return NextResponse.json({
      logoUrl: settings.logo_url || null,
      logoDarkUrl: settings.logo_dark_url || null,
      faviconUrl: settings.favicon_url || null,
    })
  } catch {
    return NextResponse.json({
      logoUrl: null,
      logoDarkUrl: null,
      faviconUrl: null,
    })
  }
}

// POST — upload/save logo URL (base64 data URL or URL string)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { logoUrl, logoDarkUrl, faviconUrl, imageData, imageType, imageKey } = body

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Handle base64 image upload
    if (imageData && imageType && imageKey) {
      // Validate type
      if (!ALLOWED_TYPES.includes(imageType)) {
        return NextResponse.json(
          { error: 'Faqat PNG, SVG, JPG, WEBP formatlariga ruxsat beriladi' },
          { status: 400 }
        )
      }

      // Validate size (approximate — base64 is ~33% larger)
      const sizeBytes = Math.ceil((imageData.length * 3) / 4)
      if (sizeBytes > MAX_SIZE) {
        return NextResponse.json({ error: 'Fayl hajmi 2MB dan oshmasligi kerak' }, { status: 400 })
      }

      // Store as data URL
      const dataUrl = `data:${imageType};base64,${imageData}`
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: imageKey, value: dataUrl }, { onConflict: 'key' })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, [imageKey]: dataUrl })
    }

    // Handle direct URL save (for logo_url, logo_dark_url, favicon_url)
    const upserts: Array<{ key: string; value: string }> = []

    if (logoUrl !== undefined) {
      upserts.push({ key: 'logo_url', value: logoUrl || '' })
    }
    if (logoDarkUrl !== undefined) {
      upserts.push({ key: 'logo_dark_url', value: logoDarkUrl || '' })
    }
    if (faviconUrl !== undefined) {
      upserts.push({ key: 'favicon_url', value: faviconUrl || '' })
    }

    if (upserts.length > 0) {
      const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to save logo' }, { status: 500 })
  }
}

// DELETE — remove logo(s)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key') // 'logo_url' | 'logo_dark_url' | 'favicon_url' | null (all)

    if (key) {
      await supabase.from('site_settings').delete().eq('key', key)
    } else {
      await supabase
        .from('site_settings')
        .delete()
        .in('key', ['logo_url', 'logo_dark_url', 'favicon_url'])
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete logo' }, { status: 500 })
  }
}
