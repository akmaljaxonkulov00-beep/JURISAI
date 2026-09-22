import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/tools/history
 * Foydalanuvchining barcha asboblar bo'yicha saqlangan tarixini qaytaradi.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const tool_type = searchParams.get('tool_type')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100)

    let query = supabase
      .from('tool_history')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (tool_type && tool_type !== 'all') {
      query = query.eq('tool_type', tool_type)
    }

    const { data, error } = await query

    if (error) {
      console.error('Tool history fetch error:', error.message)
      return NextResponse.json({ success: true, history: [] })
    }

    return NextResponse.json({
      success: true,
      history: data || [],
    })
  } catch (error) {
    console.error('Tool history GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Tarixni yuklashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tools/history
 * Tarix yozuvini o'chirish.
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID talab qilinadi' }, { status: 400 })
    }

    const { error } = await supabase
      .from('tool_history')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.user.id)

    if (error) {
      console.error('Tool history delete error:', error.message)
      return NextResponse.json(
        { success: false, error: 'O‘chirishda xatolik yuz berdi' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Yozuv o‘chirildi' })
  } catch (error) {
    console.error('Tool history DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Serverda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
