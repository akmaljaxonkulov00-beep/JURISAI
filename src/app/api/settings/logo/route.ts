import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// In-memory fallback for when Supabase is not configured
let logoUrlFallback: string | null = null

// GET — retrieve current logo URL
export async function GET() {
  try {
    if (supabaseUrl && supabaseKey && !supabaseKey.includes('REPLACE_WITH')) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'logo_url')
        .single()

      if (data?.value) {
        return NextResponse.json({ logoUrl: data.value })
      }
    }

    // Fallback
    return NextResponse.json({ logoUrl: logoUrlFallback })
  } catch {
    return NextResponse.json({ logoUrl: logoUrlFallback })
  }
}

// POST — upload/save logo URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { logoUrl } = body

    if (!logoUrl || typeof logoUrl !== 'string') {
      return NextResponse.json({ error: 'logoUrl is required' }, { status: 400 })
    }

    if (supabaseUrl && supabaseKey && !supabaseKey.includes('REPLACE_WITH')) {
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Upsert the logo URL into site_settings
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'logo_url', value: logoUrl }, { onConflict: 'key' })

      if (error) {
        console.error('[Logo API] Supabase upsert error:', error.message)
      }
    }

    // Also keep in-memory fallback
    logoUrlFallback = logoUrl

    return NextResponse.json({ success: true, logoUrl })
  } catch {
    return NextResponse.json({ error: 'Failed to save logo' }, { status: 500 })
  }
}

// DELETE — remove logo
export async function DELETE() {
  try {
    if (supabaseUrl && supabaseKey && !supabaseKey.includes('REPLACE_WITH')) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      await supabase.from('site_settings').delete().eq('key', 'logo_url')
    }

    logoUrlFallback = null

    return NextResponse.json({ success: true, logoUrl: null })
  } catch {
    return NextResponse.json({ error: 'Failed to delete logo' }, { status: 500 })
  }
}
