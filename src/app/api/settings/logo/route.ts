import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { supabase as defaultClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/server-auth'
import { getLogoSettings, hasKeyColumn, upsertSiteSettings } from '@/lib/site-settings-db'

const ALLOWED_TYPES = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

function getSupabase() {
  try {
    return getSupabaseAdmin()
  } catch {
    return defaultClient
  }
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

    const settings = await getLogoSettings(supabase)

    return NextResponse.json({
      logoUrl: settings.logoUrl,
      logoDarkUrl: settings.logoDarkUrl,
      faviconUrl: settings.faviconUrl,
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
// FAQAT ADMIN: logoni faqat admin o'zgartira oladi (security)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

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
      const result = await upsertSiteSettings(supabase, [{ key: imageKey, value: dataUrl }])

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 })
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
      const result = await upsertSiteSettings(supabase, upserts)
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save logo'
    console.error('[Logo] Save error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE — remove logo(s)
// FAQAT ADMIN: logoni faqat admin o'chira oladi
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key') // 'logo_url' | 'logo_dark_url' | 'favicon_url' | null (all)

    // Eski sxemada logo kolonnasi yo'q — o'chirish no-op (xato emas)
    if (await hasKeyColumn(supabase)) {
      if (key) {
        await supabase.from('site_settings').delete().eq('key', key)
      } else {
        await supabase
          .from('site_settings')
          .delete()
          .in('key', ['logo_url', 'logo_dark_url', 'favicon_url'])
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete logo' }, { status: 500 })
  }
}
