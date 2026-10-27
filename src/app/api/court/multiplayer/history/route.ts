import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getUserCompletedTrials } from '@/lib/court/multiplayer-db'

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

// GET /api/court/multiplayer/history: Foydalanuvchining yakunlangan sud ishlari ro'yxati
export async function GET(request: NextRequest) {
  try {
    const user = await resolveUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Yakunlangan ishlarni ko‘rish uchun tizimga kirish lozim.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const role = (searchParams.get('role') as any) || undefined
    const search = searchParams.get('search') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const result = await getUserCompletedTrials(user.id, {
      category,
      role,
      search,
      page: isNaN(page) || page < 1 ? 1 : page,
      limit: isNaN(limit) || limit < 1 || limit > 50 ? 10 : limit,
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (err: any) {
    console.error('GET /api/court/multiplayer/history error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Tarixni yuklab bo‘lmadi.' },
      { status: 500 }
    )
  }
}
