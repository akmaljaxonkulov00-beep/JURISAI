import { NextRequest, NextResponse } from 'next/server'

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

// GET — maslahat/mentorlik so'rovlari (admin uchun ro'yxat)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))

    const supabase = await getSupabase()
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
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "So'rovlarni yuklashda xatolik" },
      { status: 500 }
    )
  }
}

// POST — maslahat/mentorlik so'rovi yuborish
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { expertId, expertName, userId, userName, userEmail, type, message } = body

    if (!expertId || !message) {
      return NextResponse.json(
        { success: false, error: 'Ekspert va xabar kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getSupabase()
    if (supabase) {
      const { data, error } = await supabase
        .from('community_consultations')
        .insert({
          expert_id: expertId,
          expert_name: expertName || '',
          user_id: userId || '',
          user_name: userName || '',
          user_email: userEmail || '',
          type: type === 'mentorship' ? 'mentorship' : 'consultation',
          message: message.slice(0, 2000),
          status: 'pending',
        })
        .select()
        .single()

      if (!error && data) {
        return NextResponse.json({ success: true, data, source: 'supabase' })
      }
    }

    return NextResponse.json({ success: false, error: 'Saqlashda xatolik' }, { status: 500 })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "So'rov yuborishda xatolik" },
      { status: 500 }
    )
  }
}

// PUT — statusni yangilash (admin: pending → answered/closed)
// Qo'shimcha: admin javobi, ekspertga ulash, holat tarixi
// Body: { id, status?, adminReply?, assignedExpertId?, actor? }
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

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

    // Joriy yozuvni o'qib, holat tarixini yangilaymiz
    // (status_history ustuni migratsiyagacha mavjud bo'lmasa ham ishlaydi)
    let currentStatus = 'pending'
    let history: any[] = []
    let hasExtended = true
    let consultationUser: Record<string, any> = {} // notification uchun
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

    const updatePayload: Record<string, any> = {}

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
            by: body.actor || 'admin',
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
      const userId = consultationUser?.user_id || ''
      if (userId) {
        const expertName = consultationUser?.expert_name || 'Ekspert'
        const replyPreview = body.adminReply.trim().slice(0, 180)
        const userName = consultationUser?.user_name || consultationUser?.user_email || 'Foydalanuvchi'
        try {
          await supabase.from('user_notifications').insert({
            user_id: userId,
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
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Yangilashda xatolik' },
      { status: 500 }
    )
  }
}
