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
    const memberId = searchParams.get('memberId') || ''

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json({ success: true, data: [] })
    }

    // 1) Ommaviy guruhlar — hamma ko'radi
    let query = supabase.from('community_groups').select('*').eq('is_private', false)

    if (id) {
      query = query.eq('id', id)
    }
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: publicGroups, error: pubErr } = await query.order('member_count', { ascending: false }).limit(50)
    if (pubErr) throw pubErr

    let groups = [...(publicGroups || [])]

    // 2) Maxfiy guruhlar — faqat a'zo bo'lganlar ko'radi
    if (memberId) {
      try {
        const { data: memberships } = await supabase
          .from('community_group_members')
          .select('group_id')
          .eq('user_id', memberId)

        const ids = (memberships || []).map((m: any) => m.group_id).filter(Boolean)
        if (ids.length > 0) {
          const { data: privateGroups } = await supabase
            .from('community_groups')
            .select('*')
            .in('id', ids)
            .eq('is_private', true)
            .order('member_count', { ascending: false })
            .limit(50)
          groups = [...groups, ...(privateGroups || [])]
        }
      } catch {
        /* a'zolik so'rovi xatosi — faqat ommaviy guruhlar qaytadi */
      }
    }

    // 3) Birlashtirilgan ro'yxat (duplikat yo'q)
    const seen = new Set<string>()
    groups = groups
      .filter(g => {
        if (seen.has(g.id)) return false
        seen.add(g.id)
        return true
      })
      .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))

    return NextResponse.json({ success: true, data: groups })
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
    const { name, description, icon, category, is_private } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Guruh nomi kiritilishi shart' },
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
      .from('community_groups')
      .insert({
        name,
        description: description || '',
        icon: icon || '👥',
        category: category || 'Umumiy',
        is_private: !!is_private,
        member_count: 0,
        post_count: 0,
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

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase sozlanmagan' },
        { status: 500 }
      )
    }

    // member_count — mutlaq qiymat o'rniga nisbiy o'zgartirish (increment/decrement)
    let updatePayload: Record<string, any> = { ...updates, updated_at: new Date().toISOString() }
    if (typeof updates.member_count !== 'undefined') {
      delete updatePayload.member_count
    }
    // invite_code ni to'g'ridan-to'g'ri yozishga yo'l qo'yma (faqat trigger/admin generatsiya qiladi)
    if (typeof updatePayload.invite_code !== 'undefined') {
      delete updatePayload.invite_code
    }
    // Kodni qayta yaratish: invite_code = NULL qilinsa, DB trigger avtomatik yangi kod generatsiya qiladi
    if (updates.regenerate_code === true) {
      delete updatePayload.regenerate_code
      updatePayload.invite_code = null
    }

    const { data, error } = await supabase
      .from('community_groups')
      .update(updatePayload)
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

// PATCH — member_count ni nisbiy o'zgartirish (delta: +1 / -1)
// PostgREST arifmetik update qilmaydi, shuning uchun joriy qiymatni o'qib,
// yangi qiymatni yozamiz.
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, delta, userId } = body

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

    // 1) A'zolikni DB'da saqlash (userId berilgan bo'lsa)
    if (userId) {
      if (delta > 0) {
        await supabase
          .from('community_group_members')
          .upsert(
            { group_id: id, user_id: userId, role: 'member', joined_at: new Date().toISOString() },
            { onConflict: 'group_id,user_id', ignoreDuplicates: true }
          )
      } else {
        await supabase.from('community_group_members').delete().eq('group_id', id).eq('user_id', userId)
      }
    }

    // 2) member_count ni nisbiy yangilash
    const { data: current, error: curErr } = await supabase
      .from('community_groups')
      .select('member_count')
      .eq('id', id)
      .single()

    if (curErr) throw curErr

    const newCount = Math.max(0, (current?.member_count || 0) + delta)

    const { data, error } = await supabase
      .from('community_groups')
      .update({ member_count: newCount, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "A'zolar sonini yangilashda xatolik" },
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

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase sozlanmagan' },
        { status: 500 }
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
