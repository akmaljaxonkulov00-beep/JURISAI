import { NextRequest, NextResponse } from 'next/server'
import { resolveCourtUser } from '@/lib/court/multiplayer-auth'
import { getUserCompletedTrials } from '@/lib/court/multiplayer-db'

// GET /api/court/multiplayer/history: Foydalanuvchining yakunlangan sud ishlari ro'yxati
export async function GET(request: NextRequest) {
  try {
    const user = await resolveCourtUser(request)
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
