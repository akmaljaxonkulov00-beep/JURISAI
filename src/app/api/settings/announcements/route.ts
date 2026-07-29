import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

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
      .select('announcement_banner, announcement_active, announcement_type')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[Announcements] Error:', error)
    }

    const announcements = []
    if (data && data.announcement_banner) {
      announcements.push({
        message: data.announcement_banner,
        type: data.announcement_type || 'info',
        active: data.announcement_active !== false,
      })
    }

    return NextResponse.json({ success: true, data: announcements })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { announcements } = body

    if (!announcements || !Array.isArray(announcements)) {
      return NextResponse.json(
        { success: false, error: 'Announcements array required' },
        { status: 400 }
      )
    }

    let supabase
    try {
      supabase = getSupabaseAdmin()
    } catch {
      return NextResponse.json({ success: false, error: 'Supabase not configured' })
    }

    const bannerMsg = announcements[0]?.message || ''
    const bannerType = announcements[0]?.type || 'info'
    const bannerActive = announcements[0]?.active !== false

    const { error } = await supabase.from('site_settings').upsert({
      id: 'global',
      announcement_banner: bannerMsg,
      announcement_type: bannerType,
      announcement_active: bannerActive,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: { count: 1 } })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
  }
}
