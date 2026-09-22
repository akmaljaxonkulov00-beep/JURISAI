import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { VERIFIED_SCENARIO_TEMPLATES } from '@/lib/scenario-generator-engine'

/**
 * GET /api/scenario-generator/templates
 * Returns verified 2026 legal practice simulation templates from database or fallback.
 */
export async function GET(request: NextRequest) {
  const sb = getSupabaseAdmin()

  try {
    const { searchParams } = new URL(request.url)
    const scenario_type = searchParams.get('scenario_type') || searchParams.get('domain')
    const difficulty_level = searchParams.get('difficulty_level') || searchParams.get('difficulty')

    let query = sb.from('scenario_templates').select('*')
    if (scenario_type && scenario_type !== 'all') {
      query = query.eq('scenario_type', scenario_type)
    }
    if (difficulty_level && difficulty_level !== 'all') {
      query = query.eq('difficulty_level', difficulty_level)
    }

    const { data, error } = await query

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        success: true,
        templates: VERIFIED_SCENARIO_TEMPLATES.map(t => ({
          ...t,
          name: t.title,
        })),
      })
    }

    const normalized = data.map((t: any) => ({
      ...t,
      title: t.title || t.name,
      name: t.name || t.title,
    }))

    return NextResponse.json({
      success: true,
      templates: normalized,
    })
  } catch (error) {
    console.error('Scenario templates GET error:', error)
    return NextResponse.json({
      success: true,
      templates: VERIFIED_SCENARIO_TEMPLATES.map(t => ({
        ...t,
        name: t.title,
      })),
    })
  }
}
