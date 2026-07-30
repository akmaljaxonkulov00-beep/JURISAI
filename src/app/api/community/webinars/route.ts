import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')

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
