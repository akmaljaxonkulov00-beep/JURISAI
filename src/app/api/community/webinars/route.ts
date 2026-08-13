import { NextRequest, NextResponse } from 'next/server'

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')

    const supabase = await getSupabase()
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
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Vebinarlarni yuklashda xatolik' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase sozlanmagan' },
        { status: 500 }
      )
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
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Vebinar yaratishda xatolik' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Vebinar ID si kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase sozlanmagan' },
        { status: 500 }
      )
    }

    const { data, error } = await supabase
      .from('community_webinars')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Vebinarni yangilashda xatolik' },
      { status: 500 }
    )
  }
}

// PATCH — participants_count ni nisbiy o'zgartirish (delta: +1 / -1)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, delta } = body

    if (!id || typeof delta !== 'number') {
      return NextResponse.json(
        { success: false, error: 'id va delta kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase sozlanmagan' },
        { status: 500 }
      )
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
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Ishtirokchilar sonini yangilashda xatolik" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Vebinar ID si kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase sozlanmagan' },
        { status: 500 }
      )
    }

    const { error } = await supabase.from('community_webinars').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Vebinarni o'chirishda xatolik" },
      { status: 500 }
    )
  }
}
