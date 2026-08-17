import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient, getUserProfile, requireAdmin, requireUser } from '@/lib/community-server'

// GET — maslahat/mentorlik so'rovlari ro'yxati (FAQAT ADMIN)
export async function GET(request: NextRequest) {
  try {
    const adm = await requireAdmin(request)
    if (!adm.ok) return adm.response

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: true, data: [] })
    }

    let query = supabase.from('community_consultations').select('*')
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)

    if (error) throw error
    return NextResponse.json({ success: true, data: data || [] })
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "So'rovlarni yuklashda xatolik",
      },
      { status: 500 }
    )
  }
}

// POST — maslahat/mentorlik so'rovi yuborish (session identity)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { expertId, expertName, type, message } = body

    if (!expertId || !message) {
      return NextResponse.json(
        { success: false, error: 'Ekspert va xabar kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    const userId = auth.user.id
    const profile = await getUserProfile(supabase, userId)

    const { data, error } = await supabase
      .from('community_consultations')
      .insert({
        expert_id: expertId,
        expert_name: expertName || '',
        user_id: userId,
        user_name: profile?.full_name || '',
        user_email: profile?.email || '',
        type: type === 'mentorship' ? 'mentorship' : 'consultation',
        message: message.slice(0, 2000),
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data, source: 'supabase' })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "So'rov yuborishda xatolik" },
      { status: 500 }
    )
  }
}

// PUT — statusni yangilash (FAQAT ADMIN: pending → answered/closed + javob)
export async function PUT(request: NextRequest) {
  try {
    const adm = await requireAdmin(request)
    if (!adm.ok) return adm.response

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'id kiritilishi shart' }, { status: 400 })
    }

    const supabase = await getServiceClient()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase sozlanmagan' }, { status: 500 })
    }

    // Joriy yozuvni o'qib, holat tarixini yangilaymiz
    interface ConsultationRow {
      status?: string
      status_history?: unknown[]
      user_id?: string
      user_name?: string
      user_email?: string
      expert_name?: string
      message?: string
    }
    let currentStatus = 'pending'
    let history: unknown[] = []
    let hasExtended = true
    let consultationUser: ConsultationRow = {} // notification uchun
    try {
      const { data: cur, error: curErr } = await supabase
        .from('community_consultations')
        .select('status, status_history, user_id, user_name, user_email, expert_name, message')
        .eq('id', id)
        .single()
      if (curErr) {
        hasExtended = false
        // Eski sxema — faqat statusni o'qib ko'ramiz
        const { data: cur2 } = await supabase
          .from('community_consultations')
          .select('status, user_id, user_name, user_email, expert_name, message')
          .eq('id', id)
          .single()
        if (cur2?.status) currentStatus = cur2.status
        if (cur2) consultationUser = cur2
      } else {
        if (cur?.status) currentStatus = cur.status
        if (Array.isArray(cur?.status_history)) history = cur.status_history
        consultationUser = cur || {}
      }
    } catch {
      hasExtended = false
    }

    const updatePayload: Record<string, unknown> = {}

    if (body.status) {
      updatePayload.status = body.status
    }

    // Kengaytirilgan maydonlar — faqat ustunlar mavjud bo'lsa
    if (hasExtended) {
      if (typeof body.adminReply === 'string' && body.adminReply.trim()) {
        updatePayload.admin_reply = body.adminReply.trim()
        updatePayload.reply_at = new Date().toISOString()
      }
      if (typeof body.assignedExpertId === 'string') {
        updatePayload.assigned_expert_id = body.assignedExpertId
      }
      // Holat tarixi — { status, at, by } obyektlar ro'yxati
      if (body.status || body.adminReply) {
        history = [
          ...history,
          {
            status: body.status || currentStatus,
            at: new Date().toISOString(),
            by: adm.user.id,
          },
        ]
        updatePayload.status_history = history.slice(-50)
      }
    }

    const { data, error } = await supabase
      .from('community_consultations')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // ── Bildirishnoma: admin javob yozganda foydalanuvchiga xabar ──
    if (typeof body.adminReply === 'string' && body.adminReply.trim()) {
      const targetUserId = consultationUser?.user_id || ''
      if (targetUserId) {
        const expertName = consultationUser?.expert_name || 'Ekspert'
        const replyPreview = body.adminReply.trim().slice(0, 180)
        try {
          await supabase.from('user_notifications').insert({
            user_id: targetUserId,
            type: 'success',
            category: 'community',
            title: 'Ekspert javobi keldi ✅',
            message: `${expertName} sizning maslahat so'rovingizga javob berdi:\n\n"${replyPreview}"${body.adminReply.trim().length > 180 ? '…' : ''}`,
            action_url: '/community',
            action_text: "Javobni ko'rish",
          })
        } catch {
          // bildirishnoma yozilmasa so'rovning o'zi ishlayveradi
        }
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Yangilashda xatolik' },
      { status: 500 }
    )
  }
}
