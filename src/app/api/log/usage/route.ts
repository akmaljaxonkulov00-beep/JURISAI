import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/server-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { name, tokens, action, metadata } = body

    // Identity session'dan — client yuborgan userId/email ishonilmaydi
    const userId = auth.user.id
    const email = auth.user.email

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    let supabase
    try {
      supabase = getSupabaseAdmin()
    } catch {
      // Supabase not configured - silently skip logging
      return NextResponse.json({ success: true, note: 'Supabase not configured' })
    }

    const { error } = await supabase.from('usage_logs').insert({
      user_id: userId || email,
      email,
      name: name || '',
      tokens: tokens || 1,
      action: action || 'unknown',
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Usage log insert error:', error)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Logging failed'
    console.error('Usage logging API error:', e)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
