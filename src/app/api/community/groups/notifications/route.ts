import { NextRequest, NextResponse } from 'next/server'

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

// GET /api/community/groups/notifications?userId=... — foydalanuvchining guruh bildirishnomalari
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) return NextResponse.json({ success: true, data: [] })

    const supabase = await getSupabase()
    if (!supabase) return NextResponse.json({ success: true, data: [] })

    const { data, error } = await supabase
      .from('community_group_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Bildirishnomalarni yuklashda xatolik" },
      { status: 500 }
    )
  }
}

// PATCH — o'qilgan deb belgilash. Body: { id } yoki { all: true, userId }
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, all, userId } = body

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    if (all && userId) {
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
      return NextResponse.json(
        { success: false, error: 'id kiritilishi shart' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('community_group_notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Bildirishnomani yangilashda xatolik" },
      { status: 500 }
    )
  }
}

// DELETE — bildirishnomani o'chirish. ?id=...
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const { error } = await supabase
      .from('community_group_notifications')
      .delete()
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Bildirishnomani o'chirishda xatolik" },
      { status: 500 }
    )
  }
}
