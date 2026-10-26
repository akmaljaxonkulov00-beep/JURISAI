import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { joinCourtRoom } from '@/lib/court/multiplayer-db'
import type { MultiplayerRole } from '@/lib/court/multiplayer-types'

async function resolveUser(request: NextRequest): Promise<{ id: string; name: string } | null> {
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
      }
    } catch {
      return {
        id: auth.user.id,
        name: auth.user.email.split('@')[0] || 'Foydalanuvchi',
      }
    }
  }

  const guestId = request.headers.get('x-guest-id')
  const guestName = request.headers.get('x-guest-name')
  if (guestId && guestId.trim().length > 3) {
    return {
      id: guestId.trim(),
      name: decodeURIComponent(guestName || 'Ishtirokchi').trim(),
    }
  }

  return null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ codeOrId: string }> }
) {
  try {
    const { codeOrId } = await params
    const user = await resolveUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Xonaga qo‘shilish uchun ism yoki hisob talab qilinadi' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const requestedRole = body.role as MultiplayerRole | undefined

    const result = await joinCourtRoom(codeOrId, user, requestedRole)
    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    console.error('POST /api/court/multiplayer/rooms/[codeOrId]/join error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Xonaga qo‘shilib bo‘lmadi' },
      { status: 400 }
    )
  }
}
