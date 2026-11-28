import { NextRequest, NextResponse } from 'next/server'
import { resolveCourtUser } from '@/lib/court/multiplayer-auth'
import { getUserCompletedTrialDetail } from '@/lib/court/multiplayer-db'

// GET /api/court/multiplayer/history/[codeOrId]: Yakunlangan sud ishining to'liq dosyesi
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codeOrId: string }> }
) {
  try {
    const user = await resolveCourtUser(request)
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
