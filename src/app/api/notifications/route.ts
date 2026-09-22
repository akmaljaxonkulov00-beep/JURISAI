import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'

async function getSupabase() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

interface NotifItem {
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

/**
 * GET /api/notifications
 * Foydalanuvchi bildirishnomalari + to'lov holati sintezi.
 * Identity FAQAT tasdiqlangan session'dan olinadi.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const userId = auth.user.id
    const { searchParams } = new URL(request.url)
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '25'))

    const supabase = await getSupabase()
    if (!supabase) {
      return NextResponse.json({ success: true, data: [] })
    }

    const notifications: NotifItem[] = []
    const seenIds = new Set<string>()

    // 1. Read status for synthetic payment alerts
    const readStatusIds = new Set<string>()
    try {
      const { data: readStatus } = await supabase
        .from('notification_read_status')
        .select('notification_id')
        .eq('user_id', userId)
      if (readStatus) {
        readStatus.forEach((r: { notification_id: string }) => readStatusIds.add(r.notification_id))
      }
    } catch {}

    // 2. user_notifications table records
    try {
      const { data: dbNotifs, error: notifErr } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!notifErr && Array.isArray(dbNotifs)) {
        for (const n of dbNotifs) {
          if (!seenIds.has(n.id)) {
            seenIds.add(n.id)
            notifications.push({
              id: n.id,
              type: n.type || 'info',
              category: n.category || 'system',
              title: n.title || '',
              message: n.message || '',
              read: Boolean(n.read),
              action_url: n.action_url || '',
              action_text: n.action_text || '',
              created_at: n.created_at || new Date().toISOString(),
            })
          }
        }
      }
    } catch (e) {
      console.warn('user_notifications query warning:', e)
    }

    // 3. Synthetic payment requests notifications
    try {
      const { data: payments, error: payErr } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!payErr && Array.isArray(payments)) {
        for (const p of payments) {
          if (p.status === 'approved') {
            const nId = 'pay_' + p.id + '_approved'
            if (!seenIds.has(nId)) {
              seenIds.add(nId)
              notifications.push({
                id: nId,
                type: 'success',
                category: 'payment',
                title: "To'lov tasdiqlandi ✅",
                message: `"${p.plan}" tarifi faollashtirildi. ${Number(p.amount || 0).toLocaleString()} so'm to'lov muvaffaqiyatli tasdiqlandi.`,
                read: readStatusIds.has(nId),
                action_url: '/settings?tab=payments',
                action_text: "To'lovlarni ko'rish",
                created_at: p.updated_at || p.created_at || new Date().toISOString(),
              })
            }
          } else if (p.status === 'rejected') {
            const nId = 'pay_' + p.id + '_rejected'
            if (!seenIds.has(nId)) {
              seenIds.add(nId)
              notifications.push({
                id: nId,
                type: 'error',
                category: 'payment',
                title: "To'lov rad etildi ❌",
                message: `To'lov tekshiruvdan o'tmadi. Iltimos, yangi chek yuklang.`,
                read: readStatusIds.has(nId),
                action_url: '/premium',
                action_text: 'Qayta urinish',
                created_at: p.updated_at || p.created_at || new Date().toISOString(),
              })
            }
          }
        }
      }
    } catch (e) {
      console.warn('payment_requests query warning:', e)
    }

    // Sort by timestamp descending
    notifications.sort((a, b) => +new Date(b.created_at || 0) - +new Date(a.created_at || 0))

    return NextResponse.json({
      success: true,
      data: notifications.slice(0, limit),
      unreadCount: notifications.filter(n => !n.read).length,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Xatolik'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

/**
 * PUT /api/notifications
 * O'qilgan deb belgilash (bitta yoki barchasi).
 */
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
      // 1. Mark all real notifications as read in user_notifications
      await supabase.from('user_notifications').update({ read: true }).eq('user_id', userId)

      // 2. Mark all payment notifications as read
      try {
        const { data: payments } = await supabase
          .from('payment_requests')
          .select('id, status')
          .eq('user_id', userId)

        if (Array.isArray(payments)) {
          const rowsToUpsert = []
          for (const p of payments) {
            if (p.status === 'approved') {
              rowsToUpsert.push({ user_id: userId, notification_id: `pay_${p.id}_approved` })
            } else if (p.status === 'rejected') {
              rowsToUpsert.push({ user_id: userId, notification_id: `pay_${p.id}_rejected` })
            }
          }
          if (rowsToUpsert.length > 0) {
            await supabase
              .from('notification_read_status')
              .upsert(rowsToUpsert, { onConflict: 'user_id,notification_id' })
          }
        }
      } catch (e) {
        console.warn('markAll payment notifications status error:', e)
      }

      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })
    }

    // Synthetic notification (starts with pay_)
    if (typeof id === 'string' && id.startsWith('pay_')) {
      try {
        await supabase
          .from('notification_read_status')
          .upsert(
            { user_id: userId, notification_id: id },
            { onConflict: 'user_id,notification_id' }
          )
      } catch (e) {
        console.warn('notification_read_status upsert error:', e)
      }
      return NextResponse.json({ success: true })
    }

    // Database record in user_notifications
    const { error } = await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.warn('user_notifications update error:', error.message)
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Xatolik'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/notifications
 * Bildirishnomani o'chirish.
 */
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

    // Synthetic notification
    if (typeof id === 'string' && id.startsWith('pay_')) {
      try {
        await supabase
          .from('notification_read_status')
          .upsert(
            { user_id: userId, notification_id: id },
            { onConflict: 'user_id,notification_id' }
          )
      } catch {}
      return NextResponse.json({ success: true })
    }

    await supabase.from('user_notifications').delete().eq('id', id).eq('user_id', userId)

    return NextResponse.json({ success: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Xatolik'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
