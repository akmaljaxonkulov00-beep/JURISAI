import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getUserCompletedTrialDetail } from '@/lib/court/multiplayer-db'

async function resolveUser(
  request: NextRequest
): Promise<{ id: string; name: string; email: string } | null> {
  const auth = await requireUser(request)
  if (auth.ok) {
    try {
      const admin = getSupabaseAdmin()
      const { data } = await admin
        .from('registered_users')
        .select('full_name, email')
        .eq('id', auth.user.id)
        .maybeSingle()
      return {
        id: auth.user.id,
        name: data?.full_name || auth.user.email.split('@')[0] || 'Foydalanuvchi',
        email: auth.user.email,
      }
    } catch {
      return {
        id: auth.user.id,
        name: auth.user.email.split('@')[0] || 'Foydalanuvchi',
        email: auth.user.email,
      }
    }
  }

  // Guest fallback
  const guestId = request.headers.get('x-guest-id')
  const guestName = request.headers.get('x-guest-name')
  if (guestId && guestId.trim().length > 3) {
    return {
      id: guestId.trim(),
      name: decodeURIComponent(guestName || 'Mehmon ishtirokchi').trim(),
      email: 'guest@juristiv.uz',
    }
  }

  return null
}

// GET /api/court/multiplayer/history/[codeOrId]: Yakunlangan sud ishining to'liq dosyesi
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codeOrId: string }> }
) {
  try {
    const user = await resolveUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Dosyeni ko‘rish uchun tizimga kirish lozim.' },
        { status: 401 }
      )
    }

    const { codeOrId } = await params
    if (!codeOrId) {
      return NextResponse.json(
        { success: false, error: 'Xona kodi ko‘rsatilmagan.' },
        { status: 400 }
      )
    }

    const detail = await getUserCompletedTrialDetail(codeOrId, user.id)

    return NextResponse.json({
      success: true,
      data: detail,
    })
  } catch (err: any) {
    console.error('GET /api/court/multiplayer/history/[codeOrId] error:', err)
    const status = err.message?.includes('vakolati yo‘q')
      ? 403
      : err.message?.includes('topilmadi')
      ? 404
      : 500

    return NextResponse.json(
      { success: false, error: err.message || 'Dosyeni yuklab bo‘lmadi.' },
      { status }
    )
  }
}
