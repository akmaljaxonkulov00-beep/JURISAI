import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/db/platform-db'
import { requireUser } from '@/lib/server-auth'
import { sanitizeInput } from '@/lib/api-security'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined
    const mineOnly = searchParams.get('mine') === 'true'

    if (mineOnly) {
      const auth = await requireUser(request)
      if (!auth.ok) return auth.response
      const questions = await platformDb.getQuestions({
        citizenId: auth.user.id,
        category,
        status,
        search,
      })
      return NextResponse.json({ success: true, data: questions })
    }

    // Public questions feed — only questions marked public
    const questions = await platformDb.getQuestions({
      visibility: 'public',
      category,
      status,
      search,
    })

    // Mask name if anonymous
    const sanitizedList = questions.map(q => ({
      ...q,
      citizen_name: q.is_anonymous ? 'Anonim fuqaro' : q.citizen_name,
    }))

    return NextResponse.json({ success: true, data: sanitizedList })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Savollarni yuklashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const {
      title,
      description,
      category,
      ai_category_confidence,
      urgency,
      visibility,
      is_anonymous,
      attachments,
    } = body

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Sarlavha va savol matni kiritilishi shart' },
        { status: 400 }
      )
    }

    const cleanTitle = sanitizeInput(title)
    const cleanDesc = sanitizeInput(description)

    const question = await platformDb.createQuestion({
      citizen_id: auth.user.id,
      citizen_name: auth.user.email ? auth.user.email.split('@')[0] : 'Fuqaro',
      title: cleanTitle,
      description: cleanDesc,
      category: category || 'Umumiy huquq',
      ai_category_confidence: ai_category_confidence || 0.9,
      urgency: urgency === 'high' || urgency === 'low' ? urgency : 'medium',
      visibility: visibility === 'private' ? 'private' : 'public',
      is_anonymous: Boolean(is_anonymous),
      status: 'open',
      attachments: attachments || [],
    })

    return NextResponse.json({ success: true, data: question }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Savol yaratishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
