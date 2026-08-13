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
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'id va status kiritilishi shart' },
        { status: 400 }
      )
    }

    const supabase = await getSupabase()
    if (supabase) {
      const { data, error } = await supabase
        .from('community_consultations')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (!error && data) {
        return NextResponse.json({ success: true, data })
      }
    }

    return NextResponse.json({ success: false, error: 'Yangilashda xatolik' }, { status: 500 })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Yangilashda xatolik' },
      { status: 500 }
    )
  }
}
