import { NextRequest, NextResponse } from 'next/server'
import { resolveCourtUser } from '@/lib/court/multiplayer-auth'
import { createCourtRoom, listPublicCourtRooms } from '@/lib/court/multiplayer-db'
import type { CreateRoomInput } from '@/lib/court/multiplayer-types'

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
    const user = await resolveCourtUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Xona yaratish uchun tizimga kirish talab qilinadi' },
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
