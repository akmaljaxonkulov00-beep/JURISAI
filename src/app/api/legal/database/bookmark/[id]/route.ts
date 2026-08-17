import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { trackUsage } from '@/lib/usage-tracking'

/** Auth: faqat haqiqiy session foydalanuvchi o'z bookmarklarini boshqaradi. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Document ID talab qilinadi' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    }

    const { data, error } = await supabase
      .from('legal_bookmarks')
      .insert({
        document_id: id,
        user_id: auth.user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Legal bookmark add error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await trackUsage('legal_bookmark_add', { document_id: id })

    return NextResponse.json({
      success: true,
      bookmark_id: data.id,
      document_id: id,
      message: "Hujjat bookmarklarga muvaffaqiyatli qo'shildi",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Legal bookmark add error:', error)
    return NextResponse.json({ error: "Bookmark qo'shishda xatolik yuz berdi" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Document ID talab qilinadi' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    }

    const { error } = await supabase
      .from('legal_bookmarks')
      .delete()
      .eq('document_id', id)
      .eq('user_id', auth.user.id)

    if (error) {
      console.error('Legal bookmark remove error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await trackUsage('legal_bookmark_remove', { document_id: id })

    return NextResponse.json({
      success: true,
      document_id: id,
      message: 'Hujjat bookmarklardan muvaffaqiyatli olib tashlandi',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Legal bookmark remove error:', error)
    return NextResponse.json(
      { error: 'Bookmarkni olib tashlashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
