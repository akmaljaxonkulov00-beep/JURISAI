import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface TemplateRow {
  id: string
  name: string
  scenario_type: string
  difficulty_level: string
  description: string
  structure?: unknown
  duration_minutes?: number | null
  participants_count?: number | null
  key_elements?: unknown
  learning_objectives?: unknown
  evaluation_criteria?: unknown
  materials_needed?: unknown
  created_at?: string | null
  updated_at?: string | null
  usage_count?: number | null
  rating?: number | string | null
}

/** Umumiy shablonlar — REAL scenario_templates jadvalidan (mock yo'q) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scenario_type = searchParams.get('scenario_type')
    const difficulty_level = searchParams.get('difficulty_level')

    let query = supabase
      .from('scenario_templates')
      .select('*')
      .order('created_at', { ascending: true })
    if (scenario_type) query = query.eq('scenario_type', scenario_type)
    if (difficulty_level) query = query.eq('difficulty_level', difficulty_level)

    const { data, error } = await query
    if (error) {
      console.error('Scenario templates get error:', error.message)
      return NextResponse.json({
        templates: [],
        total_templates: 0,
        filters: {
          scenario_type: scenario_type || null,
          difficulty_level: difficulty_level || null,
        },
        summary: {},
        last_updated: new Date().toISOString(),
      })
    }

    const rows = (data || []) as TemplateRow[]
    const templates = rows.map(t => ({
      id: t.id,
      name: t.name,
      scenario_type: t.scenario_type,
      difficulty_level: t.difficulty_level,
      description: t.description,
      structure: t.structure || {},
      duration_minutes: t.duration_minutes,
      participants_count: t.participants_count,
      key_elements: t.key_elements || [],
      learning_objectives: t.learning_objectives || [],
      evaluation_criteria: t.evaluation_criteria || [],
      materials_needed: t.materials_needed || [],
      created_at: t.created_at,
      updated_at: t.updated_at,
      usage_count: t.usage_count || 0,
      rating: Number(t.rating) || 0,
    }))

    const byType = (t: string) => templates.filter(x => x.scenario_type === t).length

    return NextResponse.json({
      templates,
      total_templates: templates.length,
      filters: { scenario_type: scenario_type || null, difficulty_level: difficulty_level || null },
      summary: {
        by_type: {
          civil: byType('civil'),
          criminal: byType('criminal'),
          family: byType('family'),
          labor: byType('labor'),
          property: byType('property'),
          other: templates.filter(
            x => !['civil', 'criminal', 'family', 'labor', 'property'].includes(x.scenario_type)
          ).length,
        },
        by_difficulty: {
          easy: templates.filter(x => x.difficulty_level === 'easy').length,
          medium: templates.filter(x => x.difficulty_level === 'medium').length,
          hard: templates.filter(x => x.difficulty_level === 'hard').length,
        },
        average_duration: templates.length
          ? Math.round(
              templates.reduce((s: number, x) => s + (x.duration_minutes || 0), 0) /
                templates.length
            )
          : 0,
        average_rating: templates.length
          ? Math.round(
              (templates.reduce((s: number, x) => s + (x.rating || 0), 0) / templates.length) * 10
            ) / 10
          : 0,
      },
      last_updated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Scenario templates get error:', error)
    return NextResponse.json(
      { error: 'Senariy shablonlarini olishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
