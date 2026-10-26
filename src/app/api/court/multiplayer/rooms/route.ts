import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createCourtRoom, listPublicCourtRooms } from '@/lib/court/multiplayer-db'
import type { CreateRoomInput } from '@/lib/court/multiplayer-types'

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

  // Guest fallback for dual-browser simulation & guests
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

// GET: Ochiq zallar ro‘yxati (List public rooms)
export async function GET() {
  try {
    const rooms = await listPublicCourtRooms()
    return NextResponse.json({ success: true, rooms })
  } catch (err: any) {
    console.error('GET /api/court/multiplayer/rooms error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Xonalarni yuklab bo‘lmadi' },
      { status: 500 }
    )
  }
}

// POST: Yangi sud zali yaratish (Create courtroom)
export async function POST(request: NextRequest) {
  try {
    const user = await resolveUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Xona yaratish uchun tizimga kirish yoki ism ko‘rsatish lozim' },
        { status: 401 }
      )
    }

    const body = (await request.json()) as CreateRoomInput
    if (!body.title || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Sud zali nomi kiritilishi shart' },
        { status: 400 }
      )
    }

    const room = await createCourtRoom(user, body)
    return NextResponse.json({ success: true, room })
  } catch (err: any) {
    console.error('POST /api/court/multiplayer/rooms error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Xona yaratishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
