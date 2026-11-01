import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/db/platform-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const specialty = searchParams.get('specialty') || undefined
    const city = searchParams.get('city') || undefined
    const format = (searchParams.get('format') as 'online' | 'offline') || undefined
    const maxRate = searchParams.get('maxRate') ? Number(searchParams.get('maxRate')) : undefined
    const verifiedOnly = searchParams.get('verifiedOnly') !== 'false' // default true
    const search = searchParams.get('search') || undefined
    const matchCategory = searchParams.get('matchCategory') || undefined

    let advocates = await platformDb.getAdvocates({
      specialty,
      city,
      format,
      maxRate,
      verifiedOnly,
      search,
    })

    // AI / Smart Match: agar matchCategory kelsa, ushbu sohaga ixtisoslashgan advokatlar yuqoriga chiqariladi
    if (matchCategory) {
      advocates = [...advocates].sort((a, b) => {
        const aHas = a.specialties.some(s => s.toLowerCase().includes(matchCategory.toLowerCase()))
        const bHas = b.specialties.some(s => s.toLowerCase().includes(matchCategory.toLowerCase()))
        if (aHas && !bHas) return -1
        if (!aHas && bHas) return 1
        return b.rating - a.rating
      })
    }

    return NextResponse.json({
      success: true,
      data: advocates,
      total: advocates.length,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Advokatlar ro‘yxatini olishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
