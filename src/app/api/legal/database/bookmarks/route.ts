import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/legal/database/bookmarks
 * Session foydalanuvchining xatcho'plari (faqat o'zi — server-side identity).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 503 }
      )
    }

    const { data, error } = await supabase
      .from('legal_bookmarks')
      .select('document_id, created_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      bookmarks: (data || []).map((b: { document_id: string }) => b.document_id),
    })
  } catch (error) {
    console.error('Legal bookmarks list error:', error)
    return NextResponse.json(
      { success: false, error: "Xatcho'plarni olishda xatolik" },
      { status: 500 }
    )
  }
}
