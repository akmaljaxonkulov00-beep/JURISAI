import { NextRequest, NextResponse } from 'next/server'
import { errorMessage, getServiceClient, requireUser } from '@/lib/community-server'

// POST /api/community/groups/join
// Maxfiy guruhga taklif kodi (invite_code) orqali qo'shilish.
// Identity faqat session'dan — body'dagi userId/userName ishonilmaydi.
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const code = String(body.code || '')
      .trim()
      .toUpperCase()

    if (!code) {
      return NextResponse.json({ success: false, error: 'Taklif kodini kiriting' }, { status: 400 })
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const userId = auth.user.id

    // 1) Kod bo'yicha guruhni topish
    const { data: group, error: gErr } = await supabase
      .from('community_groups')
      .select('*')
      .ilike('invite_code', code)
      .maybeSingle()

    if (gErr) throw gErr

    if (!group) {
      return NextResponse.json(
        {
          success: false,
          error: "Bunday taklif kodi topilmadi. Kodni tekshirib qayta urinib ko'ring.",
        },
        { status: 404 }
      )
    }

    if (!group.is_private) {
      return NextResponse.json(
        {
          success: false,
          error: "Bu guruh ommaviy — kod talab qilinmaydi, to'g'ridan-to'g'ri qo'shiling",
        },
        { status: 400 }
      )
    }

    // 2) A'zolikni saqlash (faqat session user)
    await supabase.from('community_group_members').upsert(
      {
        group_id: group.id,
        user_id: userId,
        role: 'member',
        joined_at: new Date().toISOString(),
      },
      { onConflict: 'group_id,user_id', ignoreDuplicates: true }
    )

    // 3) member_count ni oshirish (read-modify-write)
    const newCount = (group.member_count || 0) + 1
    const { data: updated, error: uErr } = await supabase
      .from('community_groups')
      .update({ member_count: newCount, updated_at: new Date().toISOString() })
      .eq('id', group.id)
      .select()
      .single()

    if (uErr) throw uErr

    return NextResponse.json({
      success: true,
      data: updated || group,
      message: `${group.name} guruhiga qo'shildingiz 🎉`,
    })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(err, "Guruhga qo'shilishda xatolik") },
      { status: 500 }
    )
  }
}
