import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { VERIFIED_SCENARIO_TEMPLATES } from '@/lib/scenario-generator-engine'
import { ScenarioData } from '@/types/scenario-generator'

/**
 * GET /api/scenario-generator/templates
 * Returns fully interactive, verified 2026 legal practice simulation templates.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scenario_type = searchParams.get('scenario_type') || searchParams.get('domain')
    const difficulty_level = searchParams.get('difficulty_level') || searchParams.get('difficulty')

    let templates: ScenarioData[] = [...VERIFIED_SCENARIO_TEMPLATES]

    // Agar DB mavjud bo'lsa, DB dagi yangi qo'shilgan/faol shablonlarni ham tekshirish
    try {
      const sb = getSupabaseAdmin()
      let query = sb.from('scenario_templates').select('*')
      if (scenario_type && scenario_type !== 'all') {
        query = query.eq('scenario_type', scenario_type)
      }
      if (difficulty_level && difficulty_level !== 'all') {
        query = query.eq('difficulty_level', difficulty_level)
      }

      const { data, error } = await query

      if (!error && Array.isArray(data) && data.length > 0) {
        // DB dagi shablonlarni ScenarioData formatiga normallashtirish
        const dbTemplates: ScenarioData[] = []
        for (const row of data) {
          // Agar qatorda to'liq decision_points bo'lsa (yoki structure ichida bo'lsa)
          const struct = row.structure && typeof row.structure === 'object' ? row.structure : {}
          const candidateDecisionPoints = row.decision_points || struct.decision_points

          if (Array.isArray(candidateDecisionPoints) && candidateDecisionPoints.length > 0) {
            dbTemplates.push({
              id: row.id,
              title: row.title || row.name,
              legal_domain: (row.legal_domain || row.scenario_type || 'civil') as any,
              difficulty: (row.difficulty || row.difficulty_level || 'intermediate') as any,
              objective: (row.objective || struct.objective || 'court_practice') as any,
              user_role: (row.user_role || row.role || struct.user_role || 'advokat') as any,
              background: row.background || row.description || struct.background || '',
              facts: Array.isArray(row.facts) ? row.facts : Array.isArray(struct.facts) ? struct.facts : [],
              participants: Array.isArray(row.participants) ? row.participants : Array.isArray(struct.participants) ? struct.participants : [],
              evidence: Array.isArray(row.evidence) ? row.evidence : Array.isArray(struct.evidence) ? struct.evidence : [],
              timeline: Array.isArray(row.timeline) ? row.timeline : Array.isArray(struct.timeline) ? struct.timeline : [],
              legal_issues: Array.isArray(row.legal_issues) ? row.legal_issues : Array.isArray(struct.legal_issues) ? struct.legal_issues : [],
              decision_points: candidateDecisionPoints,
              learning_outcomes: Array.isArray(row.learning_outcomes) ? row.learning_outcomes : Array.isArray(row.learning_objectives) ? row.learning_objectives : [],
              sources: Array.isArray(row.sources) ? row.sources : [],
              validation: row.validation || { is_valid: true, checked_articles: [], legal_consistency_score: 100 },
            })
          } else {
            // Agar DB dagi eski qatorda decision_points bo'lmasa, uni VERIFIED_SCENARIO_TEMPLATES dagi mosiga bog'lash
            const matchedVerified = VERIFIED_SCENARIO_TEMPLATES.find(
              vt => vt.legal_domain === row.scenario_type || vt.title.toLowerCase().includes(String(row.name || '').toLowerCase())
            )
            if (matchedVerified) {
              dbTemplates.push({
                ...matchedVerified,
                id: row.id || matchedVerified.id,
                title: row.name || row.title || matchedVerified.title,
              })
            }
          }
        }

        if (dbTemplates.length > 0) {
          // Birlashgan ro'yxat (DB shablonlari va verified shablonlar id bo'yicha birlashtiriladi)
          const map = new Map<string, ScenarioData>()
          for (const vt of VERIFIED_SCENARIO_TEMPLATES) {
            map.set(vt.id, vt)
          }
          for (const dt of dbTemplates) {
            map.set(dt.id, dt)
          }
          templates = Array.from(map.values())
        }
      }
    } catch (dbErr) {
      console.warn('DB scenario templates fallback error:', dbErr)
    }

    // Filter bo'yicha saralash
    if (scenario_type && scenario_type !== 'all') {
      templates = templates.filter(t => t.legal_domain === scenario_type)
    }
    if (difficulty_level && difficulty_level !== 'all') {
      templates = templates.filter(t => t.difficulty === difficulty_level)
    }

    return NextResponse.json({
      success: true,
      templates: templates.map(t => ({
        ...t,
        name: t.title, // backward compatibility
      })),
      total: templates.length,
    })
  } catch (error) {
    console.error('Scenario templates GET error:', error)
    return NextResponse.json({
      success: true,
      templates: VERIFIED_SCENARIO_TEMPLATES.map(t => ({
        ...t,
        name: t.title,
      })),
      total: VERIFIED_SCENARIO_TEMPLATES.length,
    })
  }
}
