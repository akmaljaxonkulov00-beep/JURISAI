import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/db/platform-db'
import { requireUser } from '@/lib/server-auth'
import { sanitizeInput } from '@/lib/api-security'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const advocateId = searchParams.get('advocateId') || undefined
    const reviews = await platformDb.getReviews(advocateId)
    return NextResponse.json({ success: true, data: reviews })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Taqrizlarni olishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { advocateId, consultationId, rating, comment } = body

    if (!advocateId || !consultationId || !rating || !comment?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Advokat, konsultatsiya ID, baho (1-5) va sharh kiritilishi shart',
        },
        { status: 400 }
      )
    }

    const numRating = Number(rating)
    if (numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { success: false, error: 'Baho 1 dan 5 gacha bo‘lishi kerak' },
        { status: 400 }
      )
    }

    // Konsultatsiya haqiqatan tugallanganligini va fuqaroniki ekanligini tekshiramiz
    const appointments = await platformDb.getAppointments({ citizenId: auth.user.id })
    const app = appointments.find(a => a.id === consultationId)

    if (!app) {
      return NextResponse.json(
        {
          success: false,
          error: 'Taqriz qoldirish uchun haqiqiy o‘tkazilgan konsultatsiya mavjud bo‘lishi shart.',
        },
        { status: 403 }
      )
    }

    const citizenName = auth.user.email ? auth.user.email.split('@')[0] : 'Fuqaro'

    const review = await platformDb.createReview({
      advocate_id: advocateId,
      citizen_id: auth.user.id,
      citizen_name: citizenName,
      consultation_id: consultationId,
      rating: numRating,
      comment: sanitizeInput(comment),
      status: 'published',
    })

    return NextResponse.json({ success: true, data: review }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Taqriz qoldirishda xatolik yuz berdi' },
      { status: 400 }
    )
  }
}
