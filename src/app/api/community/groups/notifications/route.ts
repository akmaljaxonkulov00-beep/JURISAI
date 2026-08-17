import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, requireUser } from '@/lib/community-server'

// Guruh bildirishnomalari. Identity faqat session'dan — userId ishonilmaydi.

// GET /api/community/groups/notifications — foydalanuvchining O'Z bildirishnomalari
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const userId = auth.user.id

    const supabase = await getServiceClient()
    if (!supabase) return NextResponse.json({ success: true, data: [] })

    const { data, error } = await supabase
      .from('community_group_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Bildirishnomalarni yuklashda xatolik',
      },
      { status: 500 }
    )
  }
}

// PATCH — o'qilgan deb belgilash. Body: { id } yoki { all: true } — faqat O'Z bildirishnomalari
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const userId = auth.user.id

    const body = await request.json()
    const { id, all } = body

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    if (all) {
      const { data, error } = await supabase
        .from('community_group_notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
        .select()
      if (error) throw error
      return NextResponse.json({ success: true, data: data || [] })
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'id kiritilishi shart' }, { status: 400 })
    }

    // Boshqa foydalanuvchining bildirishnomasi mos kelmasa — xato emas, no-op
    const { data, error } = await supabase
      .from('community_group_notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Bildirishnomani yangilashda xatolik',
      },
      { status: 500 }
    )
  }
}

// DELETE — bildirishnomani o'chirish (faqat O'Z bildirishnomasi). ?id=...
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const userId = auth.user.id

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'id kiritilishi shart' }, { status: 400 })
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const { error } = await supabase
      .from('community_group_notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Bildirishnomani o'chirishda xatolik",
      },
      { status: 500 }
    )
  }
}
