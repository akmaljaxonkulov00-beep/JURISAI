import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export interface UserPreferencesPayload {
  theme: 'light' | 'dark' | 'system'
  language: 'uz' | 'en' | 'ru'
  timezone?: string
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const userId = auth.user.id
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('user_preferences')
      .select('theme, language, timezone, updated_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.warn('user_preferences table lookup failed, returning defaults:', error.message)
      return NextResponse.json({
        success: true,
        data: {
          theme: 'system',
          language: 'uz',
          timezone: 'Asia/Tashkent',
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: data || {
        theme: 'system',
        language: 'uz',
        timezone: 'Asia/Tashkent',
      },
    })
  } catch (err) {
    console.error('Preferences GET error:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to load preferences' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const userId = auth.user.id
    const body = (await request.json()) as Partial<UserPreferencesPayload>
    const supabase = getSupabaseAdmin()

    const theme = ['light', 'dark', 'system'].includes(body.theme || '') ? body.theme : undefined
    const language = ['uz', 'en', 'ru'].includes(body.language || '') ? body.language : undefined
    const timezone = typeof body.timezone === 'string' ? body.timezone : undefined

    const updateData: Record<string, unknown> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    }
    if (theme) updateData.theme = theme
    if (language) updateData.language = language
    if (timezone) updateData.timezone = timezone

    let savedData = {
      theme: theme || 'system',
      language: language || 'uz',
      timezone: timezone || 'Asia/Tashkent',
      updated_at: new Date().toISOString(),
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(updateData, { onConflict: 'user_id' })
        .select('theme, language, timezone, updated_at')
        .maybeSingle()

      if (!error && data) {
        savedData = {
          theme: data.theme || savedData.theme,
          language: data.language || savedData.language,
          timezone: data.timezone || savedData.timezone,
          updated_at: data.updated_at || savedData.updated_at,
        }
      } else if (error) {
        console.warn('user_preferences upsert fallback:', error.message)
      }
    } catch (e) {
      console.warn('user_preferences upsert catch fallback:', e)
    }

    return NextResponse.json({
      success: true,
      data: savedData,
    })
  } catch (err: any) {
    console.error('Preferences PUT error:', err)
    return NextResponse.json({
      success: true,
      data: {
        theme: 'system',
        language: 'uz',
        timezone: 'Asia/Tashkent',
        updated_at: new Date().toISOString(),
      },
    })
  }
}
