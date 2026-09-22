import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/scenario-generator/sessions
 * Returns user's saved/completed scenario simulation sessions with pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)
    const status = searchParams.get('status')

    let query = supabase
      .from('scenario_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, count, error } = await query

    if (error) {
      console.warn('Scenario sessions fetch error:', error.message)
      return NextResponse.json({
        success: true,
        sessions: [],
        total: 0,
        limit,
        offset,
      })
    }

    return NextResponse.json({
      success: true,
      sessions: data || [],
      total: count || (data ? data.length : 0),
      limit,
      offset,
    })
  } catch (error) {
    console.error('Scenario sessions GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Sessiyalarni yuklashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
