import { NextRequest, NextResponse } from 'next/server'
import { resolveCourtUser } from '@/lib/court/multiplayer-auth'
import { joinCourtRoom } from '@/lib/court/multiplayer-db'
import type { MultiplayerRole } from '@/lib/court/multiplayer-types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ codeOrId: string }> }
) {
  try {
    const { codeOrId } = await params
    const user = await resolveCourtUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Xonaga qo‘shilish uchun tizimga kirish talab qilinadi' },
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
