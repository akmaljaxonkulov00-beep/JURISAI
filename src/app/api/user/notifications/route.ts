import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export interface NotificationPreferencesPayload {
  email_system: boolean
  email_course: boolean
  email_materials: boolean
  email_payments: boolean
  email_security: boolean
  inapp_ai_results: boolean
  inapp_case_results: boolean
  inapp_virtual_court: boolean
  inapp_system: boolean
  push_enabled: boolean
  marketing_emails: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferencesPayload = {
  email_system: true,
  email_course: true,
  email_materials: true,
  email_payments: true,
  email_security: true,
  inapp_ai_results: true,
  inapp_case_results: true,
  inapp_virtual_court: true,
  inapp_system: true,
  push_enabled: true,
  marketing_emails: false,
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const userId = auth.user.id
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.warn('notification_preferences query error:', error.message)
      return NextResponse.json({ success: true, data: DEFAULT_PREFERENCES })
    }

    return NextResponse.json({
      success: true,
      data: data || DEFAULT_PREFERENCES,
    })
  } catch (err) {
    console.error('Notification preferences GET error:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to load notification settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const userId = auth.user.id
    const body = (await request.json()) as Partial<NotificationPreferencesPayload>
    const supabase = getSupabaseAdmin()

    const updateData: Record<string, unknown> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    }

    const booleanKeys: (keyof NotificationPreferencesPayload)[] = [
      'email_system',
      'email_course',
      'email_materials',
      'email_payments',
      'email_security',
      'inapp_ai_results',
      'inapp_case_results',
      'inapp_virtual_court',
      'inapp_system',
      'push_enabled',
      'marketing_emails',
    ]

    for (const key of booleanKeys) {
      if (typeof body[key] === 'boolean') {
        updateData[key] = body[key]
      }
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(updateData, { onConflict: 'user_id' })
      .select('*')
      .single()

    if (error) {
      console.error('notification_preferences upsert error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data || updateData,
    })
  } catch (err) {
    console.error('Notification preferences PUT error:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to save notification settings' },
      { status: 500 }
    )
  }
}
