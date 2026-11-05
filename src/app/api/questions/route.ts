import { NextRequest, NextResponse } from 'next/server'
import { platformDb } from '@/lib/db/platform-db'
import { requireUser } from '@/lib/server-auth'
import { sanitizeInput } from '@/lib/api-security'
import { deductCitizenQuestion, getCitizenUsage } from '@/lib/citizen-service'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

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

      // Har bir savol uchun javob muallifi ma'lumotlarini biriktirish
      const admin = getSupabaseAdmin()
      const enhancedQuestions = await Promise.all(
        questions.map(async q => {
          try {
            const { data: answers } = await admin
              .from('legal_answers')
              .select('*')
              .eq('question_id', q.id)
              .order('created_at', { ascending: false })

            return {
              ...q,
              answers: answers || [],
              latest_answer: answers?.[0] || null,
            }
          } catch {
            return q
          }
        })
      )

      return NextResponse.json({ success: true, data: enhancedQuestions })
    }

    // Public questions feed — faqat public bo'lgan savollar
    const questions = await platformDb.getQuestions({
      visibility: 'public',
      category,
      status,
      search,
    })

    // Anonim bo'lsa ismni yashirish
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

    // 1. Citizen savol berish limiti va kreditlarini tekshirish
    const deductResult = await deductCitizenQuestion(auth.user.id)
    if (!deductResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: deductResult.error,
          code: 'LIMIT_EXCEEDED',
        },
        { status: 402 } // Payment Required
      )
    }

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

    return NextResponse.json(
      {
        success: true,
        data: question,
        usage: {
          usedPaidCredit: deductResult.usedPaidCredit,
          remaining: deductResult.remaining,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Savol yaratishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
