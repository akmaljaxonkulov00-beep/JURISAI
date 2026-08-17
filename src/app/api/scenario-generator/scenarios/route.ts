import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { supabase } from '@/lib/supabase'

/** Foydalanuvchining REAL saqlangan senariylari (mock yo'q) */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const scenario_type = searchParams.get('scenario_type')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50') || 50, 100)

    let query = supabase
      .from('scenarios')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (scenario_type) query = query.eq('scenario_type', scenario_type)

    const { data, error } = await query
    if (error) {
      // Jadval mavjud bo'lmasa — bo'sh (lekin valid) javob
      console.error('Scenarios get error:', error.message)
      return NextResponse.json({ scenarios: [], total: 0 })
    }

    const scenarios = (data || []).map(row => {
      const rowRec = row as Record<string, unknown>
      const rowData = rowRec.data && typeof rowRec.data === 'object' ? rowRec.data : {}
      const parsed = rowData as Record<string, unknown>
      return {
        ...parsed,
        id: rowRec.id,
        scenario_type: rowRec.scenario_type,
        difficulty_level: rowRec.difficulty_level,
        complexity: rowRec.complexity,
        title: rowRec.title,
        description: rowRec.description,
        created_at: rowRec.created_at,
        ai_generated: true,
        status: 'completed',
      }
    })

    return NextResponse.json({ scenarios, total: scenarios.length })
  } catch (error) {
    console.error('Scenarios get error:', error)
    return NextResponse.json({ error: 'Senariylarni olishda xatolik yuz berdi' }, { status: 500 })
  }
}

/** Yaratilgan senariyni foydalanuvchiga tegishli qilib saqlaydi */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const data = body.data && typeof body.data === 'object' ? body.data : {}
    const rec = data as Record<string, unknown>
    const title: string = String(rec.title || body.title || 'Senariy').slice(0, 200)
    const scenario_type: string = String(rec.scenario_type || body.scenario_type || 'civil').slice(
      0,
      40
    )
    const difficulty_level: string = String(
      rec.difficulty_level || body.difficulty_level || 'intermediate'
    ).slice(0, 40)
    const complexity: string = String(rec.complexity || body.complexity || 'standard').slice(0, 40)
    const description: string = String(rec.description || body.description || '').slice(0, 500)

    const { data: inserted, error } = await supabase
      .from('scenarios')
      .insert({
        user_id: auth.user.id,
        title,
        scenario_type,
        difficulty_level,
        complexity,
        description,
        data: rec,
      })
      .select()
      .single()

    if (error) {
      console.error('Scenario save error:', error.message)
      return NextResponse.json({ error: 'Senariyni saqlashda xatolik yuz berdi' }, { status: 500 })
    }

    const insertedRec = inserted as Record<string, unknown>
    return NextResponse.json({
      success: true,
      scenario: {
        ...rec,
        id: insertedRec.id,
        title: insertedRec.title,
        scenario_type: insertedRec.scenario_type,
        difficulty_level: insertedRec.difficulty_level,
        complexity: insertedRec.complexity,
        description: insertedRec.description,
        created_at: insertedRec.created_at,
      },
    })
  } catch (error) {
    console.error('Scenario save error:', error)
    return NextResponse.json({ error: 'Senariyni saqlashda xatolik yuz berdi' }, { status: 500 })
  }
}
