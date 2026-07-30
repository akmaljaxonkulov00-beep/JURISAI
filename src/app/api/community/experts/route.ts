import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const specialization = searchParams.get('specialization')

    let query = supabase.from('community_experts').select('*')

    if (id) {
      query = query.eq('id', id)
    }
    if (specialization && specialization !== 'all') {
      query = query.ilike('specialization', `%${specialization}%`)
    }

    query = query.eq('is_active', true).order('reputation', { ascending: false }).limit(50)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Ekspertlarni yuklashda xatolik' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, title, specialization, bio } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Ekspert nomi kiritilishi shart' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('community_experts')
      .insert({
        name,
        title: title || '',
        specialization: specialization || '',
        bio: bio || '',
        is_verified: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Ekspert yaratishda xatolik' },
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
        { success: false, error: 'Ekspert ID si kiritilishi shart' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('community_experts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Ekspertni yangilashda xatolik' },
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
        { success: false, error: 'Ekspert ID si kiritilishi shart' },
        { status: 400 }
      )
    }

    const { error } = await supabase.from('community_experts').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Ekspertni o'chirishda xatolik" },
      { status: 500 }
    )
  }
}
