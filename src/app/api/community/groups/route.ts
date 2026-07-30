import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')

    let query = supabase.from('community_groups').select('*')

    if (id) {
      query = query.eq('id', id)
    }
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    query = query.order('member_count', { ascending: false }).limit(50)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Guruhlarni yuklashda xatolik' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, icon, category } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Guruh nomi kiritilishi shart' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('community_groups')
      .insert({
        name,
        description: description || '',
        icon: icon || '👥',
        category: category || 'Umumiy',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Guruh yaratishda xatolik' },
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
        { success: false, error: 'Guruh ID si kiritilishi shart' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('community_groups')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Guruhni yangilashda xatolik' },
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
        { success: false, error: 'Guruh ID si kiritilishi shart' },
        { status: 400 }
      )
    }

    const { error } = await supabase.from('community_groups').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Guruhni o'chirishda xatolik" },
      { status: 500 }
    )
  }
}
