import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

/**
 * GET /api/notifications
 * Foydalanuvchi bildirishnomalari + to'lov holati (payment_requests dan sintez).
 * Identity FAQAT tasdiqlangan session'dan — query parametrdagi userId ishonilmaydi.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const userId = auth.user.id
    const { searchParams } = new URL(request.url)
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json({ success: true, data: [] })
    }

    interface Notif {
      id: string
      type: string
      category: string
      title: string
      message: string
      read: boolean
      action_url?: string
      action_text?: string
      created_at?: string
      [key: string]: unknown
    }
    const notifications: Notif[] = []

    // 1) user_notifications jadvalidan
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (!error && data) notifications.push(...data)
    } catch {}

    // 2) To'lov holati (payment_requests) — eng so'nggi holat bo'yicha sintez
    try {
      const { data: payments, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)
      if (!error && payments) {
        for (const p of payments) {
          if (p.status === 'approved') {
            notifications.push({
              id: 'pay_' + p.id + '_approved',
              type: 'success',
              category: 'payment',
              title: "To'lov tasdiqlandi ✅",
              message: `"${p.plan}" tarifi faollashtirildi. ${Number(p.amount || 0).toLocaleString()} so'm to'lov muvaffaqiyatli tasdiqlandi.`,
              read: false,
              action_url: '/dashboard',
              action_text: 'Dashboardga o\u02BBtish',
              created_at: p.updated_at || p.created_at,
            })
          } else if (p.status === 'rejected') {
            notifications.push({
              id: 'pay_' + p.id + '_rejected',
              type: 'error',
              category: 'payment',
              title: "To'lov rad etildi ❌",
              message: `To'lov tekshiruvdan o'tmadi. Iltimos, yangi chek yuklang.`,
              read: false,
              action_url: '/premium',
              action_text: 'Qayta urinish',
              created_at: p.updated_at || p.created_at,
            })
          }
        }
      }
    } catch {}

    // Sana bo'yicha saralash
    notifications.sort((a, b) => +new Date(b.created_at || 0) - +new Date(a.created_at || 0))

    return NextResponse.json({
      success: true,
      data: notifications.slice(0, limit),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Xatolik'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// PUT — o'qilgan deb belgilash { id, markAll } — faqat session userning o'z bildirishnomalari
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const userId = auth.user.id

    const body = await request.json()
    const { id, markAll } = body

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    if (markAll) {
      await supabase.from('user_notifications').update({ read: true }).eq('user_id', userId)
      return NextResponse.json({ success: true })
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })
    }
    // Faqat o'z bildirishnomasi — user_id sharti bilan
    await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId)
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Xatolik'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE — o'chirish { id } — faqat session userning o'z bildirishnomasi
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const userId = auth.user.id

    const body = await request.json()
    const { id } = body

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })
    }
    await supabase.from('user_notifications').delete().eq('id', id).eq('user_id', userId)
    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Xatolik'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
