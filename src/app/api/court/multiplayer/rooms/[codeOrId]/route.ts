import { NextRequest, NextResponse } from 'next/server'
import { getCourtRoom } from '@/lib/court/multiplayer-db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codeOrId: string }> }
) {
  try {
    const { codeOrId } = await params
    if (!codeOrId) {
      return NextResponse.json(
        { success: false, error: 'Xona kodi ko‘rsatilmadi' },
        { status: 400 }
      )
    }

    const room = await getCourtRoom(codeOrId)
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Sud zali topilmadi yoki yopilgan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, room })
  } catch (err: any) {
    console.error('GET /api/court/multiplayer/rooms/[codeOrId] error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Xatoli yuz berdi' },
      { status: 500 }
    )
  }
}
