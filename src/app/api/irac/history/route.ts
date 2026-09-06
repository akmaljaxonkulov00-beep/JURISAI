import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/irac/history
 * Joriy foydalanuvchining kazus natijalari tarixi + real progress statistikasi.
 * Barcha qiymatlar DB'dan (irac_analyses + irac_cases) — fake yoki hardcoded YO'Q.
 */
export async function GET(request: NextRequest) {
  const auth = await requireUser(request)
  if (!auth.ok) return auth.response

  try {
    const admin = getSupabaseAdmin()

    // 1. Foydalanuvchining yechilgan kazuslari
    const { data: analyses, error: analysesError } = await admin
      .from('irac_analyses')
      .select(
        'id, case_title, case_category, case_difficulty, total_score, grade, feedback, strengths, weaknesses, completed_at'
      )
      .eq('user_id', auth.user.id)
      .order('completed_at', { ascending: false })
      .limit(200)

    if (analysesError) {
      return NextResponse.json({ success: false, error: analysesError.message }, { status: 500 })
    }

    // 2. Har bir yo'nalishdagi jami kazuslar soni (aktiv)
    const { data: caseCounts } = await admin
      .from('irac_cases')
      .select('category', { count: 'exact', head: false })
      .eq('is_active', true)

    const totalByCategory: Record<string, number> = {}
    if (Array.isArray(caseCounts)) {
      caseCounts.forEach(row => {
        const cat = String((row as { category?: string }).category || 'general')
        totalByCategory[cat] = (totalByCategory[cat] || 0) + 1
      })
    }

    // 3. Har bir yo'nalish bo'yicha yechilganlar + o'rtacha ball
    const solvedByCategory: Record<string, number> = {}
    const scoreSumByCategory: Record<string, number> = {}
    const history = (analyses || []).map((a: Record<string, unknown>) => {
      const cat = String(a.case_category || 'general')
      solvedByCategory[cat] = (solvedByCategory[cat] || 0) + 1
      const score = Number(a.total_score) || 0
      scoreSumByCategory[cat] = (scoreSumByCategory[cat] || 0) + score
      return {
        id: String(a.id),
        case_title: String(a.case_title || ''),
        case_category: cat,
        case_difficulty: String(a.case_difficulty || ''),
        total_score: score,
        grade: String(a.grade || ''),
        feedback: String(a.feedback || ''),
        strengths: Array.isArray(a.strengths) ? a.strengths.map(String) : [],
        weaknesses: Array.isArray(a.weaknesses) ? a.weaknesses.map(String) : [],
        completed_at: String(a.completed_at || ''),
      }
    })

    // Yechilgan kazus sarlavhalari — random tanlashda qayta berilmasligi uchun
    const solvedTitles = new Set(history.map(h => h.case_title.trim().toLowerCase()))

    // 4. Yo'nalishlar bo'yicha progress statistikasi
    const categories: Record<string, { total: number; solved: number; avgScore: number }> = {}
    const allCategoryKeys = new Set([
      ...Object.keys(totalByCategory),
      ...Object.keys(solvedByCategory),
    ])
    allCategoryKeys.forEach(cat => {
      const solved = solvedByCategory[cat] || 0
      const total = totalByCategory[cat] || 0
      const avgScore = solved > 0 ? Math.round((scoreSumByCategory[cat] || 0) / solved) : 0
      categories[cat] = { total, solved, avgScore }
    })

    return NextResponse.json({
      success: true,
      history,
      categories,
      solvedTitles: [...solvedTitles],
      overall: {
        solved: history.length,
        avgScore: history.length
          ? Math.round(history.reduce((s, h) => s + h.total_score, 0) / history.length)
          : 0,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load history'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
