import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { SEED_IRAC_CASES } from '@/lib/cases/seed-cases'

function normalizeCategory(cat: string): string {
  const c = cat.toLowerCase().replace(/['`’]/g, '')
  if (c === 'mamuriy' || c === 'administrative') return 'mamuriy'
  if (c === 'iqtisodiy' || c === 'tijorat' || c === 'commercial' || c === 'economic')
    return 'iqtisodiy'
  if (c === 'jinoyat' || c === 'criminal') return 'jinoyat'
  if (c === 'fuqarolik' || c === 'civil') return 'fuqarolik'
  if (c === 'mehnat' || c === 'labor') return 'mehnat'
  if (c === 'oila' || c === 'family') return 'oila'
  if (c === 'konstitutsiyaviy' || c === 'constitutional') return 'konstitutsiyaviy'
  return c
}

/**
 * GET /api/irac/cases
 * Tasodifiy kazus olish — har safar turlicha
 * ?category=jinoyat&difficulty=medium — filter bilan
 */
export async function GET(req: NextRequest) {
  const sb = getSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const difficulty = searchParams.get('difficulty')

  try {
    let query = sb.from('irac_cases').select('*').eq('is_active', true)

    if (category && category !== 'all') {
      const normCat = normalizeCategory(category)
      query = query.or(`category.ilike.%${normCat}%,category.ilike.%${category}%`)
    }
    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty)
    }

    const { data, error } = await query

    let resultCases = data || []

    // If DB has no cases or table is empty, use SEED_IRAC_CASES
    if (error || resultCases.length === 0) {
      let filtered = SEED_IRAC_CASES
      if (category && category !== 'all') {
        const normCat = normalizeCategory(category)
        filtered = filtered.filter(c => normalizeCategory(c.category) === normCat)
      }
      if (difficulty && difficulty !== 'all') {
        filtered = filtered.filter(c => c.difficulty.toLowerCase() === difficulty.toLowerCase())
      }
      resultCases = filtered.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty,
        law_references: c.law_references,
        is_active: true,
      }))
    }

    if (resultCases.length === 0) {
      return NextResponse.json({ cases: [], message: 'Kazuslar topilmadi' })
    }

    // Tasodifiy tanlash — Fisher-Yates shuffle
    const shuffled = [...resultCases].sort(() => Math.random() - 0.5)

    return NextResponse.json({
      cases: shuffled,
      total: resultCases.length,
    })
  } catch {
    // Fallback on catch
    let filtered = SEED_IRAC_CASES
    if (category && category !== 'all') {
      filtered = filtered.filter(c => c.category.toLowerCase() === category.toLowerCase())
    }
    if (difficulty && difficulty !== 'all') {
      filtered = filtered.filter(c => c.difficulty.toLowerCase() === difficulty.toLowerCase())
    }
    return NextResponse.json({
      cases: [...filtered].sort(() => Math.random() - 0.5),
      total: filtered.length,
    })
  }
}

/**
 * POST /api/irac/cases
 * Admin tomonidan yangi kazus qo'shish
 * Authenticated admin session tekshiriladi
 */
export async function POST(req: NextRequest) {
  const sb = getSupabaseAdmin()

  // Auth tekshirish
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser(token)

  if (authError || !user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin tekshirish
  const { data: userData } = await sb
    .from('registered_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || !['ADMIN', 'SUPER_ADMIN'].includes(userData.role?.toUpperCase())) {
    return NextResponse.json({ error: 'Forbidden — admin required' }, { status: 403 })
  }

  const body = await req.json()
  const { title, description, category, difficulty, law_references } = body

  if (!title || !description) {
    return NextResponse.json({ error: 'title va description majburiy' }, { status: 400 })
  }

  const { data, error } = await sb
    .from('irac_cases')
    .insert({
      title,
      description,
      category: category || 'general',
      difficulty: difficulty || 'medium',
      law_references: law_references || [],
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, case: data })
}
