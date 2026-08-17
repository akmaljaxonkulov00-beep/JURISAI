import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, requireAdmin, requireUser } from '@/lib/community-server'

// Vebinarlar. GET — hamma ko'radi; POST/PUT/DELETE — FAQAT admin;
// PATCH (ishtirokchi soni) — faqat tizimga kirgan foydalanuvchi.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: true, data: [] })
    }

    let query = supabase.from('community_webinars').select('*')

    if (id) {
      query = query.eq('id', id)
    }
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    query = query.eq('is_active', true).order('date', { ascending: true }).limit(50)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Vebinarlarni yuklashda xatolik',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const adm = await requireAdmin(request)
    if (!adm.ok) return adm.response

    const body = await request.json()
    const {
      title,
      description,
      host,
      host_title,
      category,
      date,
      duration_minutes,
      max_participants,
    } = body

    if (!title || !date) {
      return NextResponse.json(
        { success: false, error: 'Vebinar nomi va sanasi kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const { data, error } = await supabase
      .from('community_webinars')
      .insert({
        title,
        description: description || '',
        host: host || '',
        host_title: host_title || '',
        category: category || 'Umumiy',
        date,
        duration_minutes: duration_minutes || 60,
        max_participants: max_participants || 500,
        participants_count: 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Vebinar yaratishda xatolik' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adm = await requireAdmin(request)
    if (!adm.ok) return adm.response

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Vebinar ID si kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const { data, error } = await supabase
      .from('community_webinars')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Vebinarni yangilashda xatolik',
      },
      { status: 500 }
    )
  }
}

// PATCH — participants_count ni nisbiy o'zgartirish (delta: +1 / -1) — faqat kirgan user
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { id, delta } = body

    if (!id || typeof delta !== 'number') {
      return NextResponse.json(
        { success: false, error: 'id va delta kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const { data: current, error: curErr } = await supabase
      .from('community_webinars')
      .select('participants_count, max_participants')
      .eq('id', id)
      .single()

    if (curErr) throw curErr

    const max = current?.max_participants || 9999
    const newCount = Math.min(max, Math.max(0, (current?.participants_count || 0) + delta))

    const { data, error } = await supabase
      .from('community_webinars')
      .update({ participants_count: newCount, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Ishtirokchilar sonini yangilashda xatolik',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adm = await requireAdmin(request)
    if (!adm.ok) return adm.response

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Vebinar ID si kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const { error } = await supabase.from('community_webinars').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Vebinarni o'chirishda xatolik",
      },
      { status: 500 }
    )
  }
}
