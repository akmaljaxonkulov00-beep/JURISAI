import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { ScenarioData, UserActionLog } from '@/types/scenario-generator'
import { evaluateScenarioPerformance } from '@/lib/scenario-generator-engine'
import { awardUserXP } from '@/lib/xp-engine'

/**
 * POST /api/scenario-generator/evaluate
 * Generates final simulation score, awards gamified XP, and saves completed session.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => ({}))
    const { scenario, action_logs = [], session_id } = body as {
      scenario: ScenarioData
      action_logs: UserActionLog[]
      session_id?: string
    }

    if (!scenario) {
      return NextResponse.json({ error: 'Senariy maʼlumotlari talab qilinadi' }, { status: 400 })
    }

    let evaluation = evaluateScenarioPerformance(scenario, action_logs)

    // AI orqali chuqurlashtirilgan xolis tahlil (Gemini / Groq)
    if (process.env.NODE_ENV !== 'test' && (process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY)) {
      try {
        const aiPrompt = `Sen O'zbekiston Respublikasi yuridik amaliyoti va advokatura bo'yicha ekspert-baholovchisisan.
Quyidagi yuridik keys simulyatsiyasida foydalanuvchining bajargan harakatlarini chuqur, xolis va haqqoniy bahola (demo yoki soxta ball berma).

SENARIY:
- Nomi: "${scenario.title}"
- Soha: ${scenario.legal_domain} (${scenario.difficulty})
- Faktlar: ${scenario.facts?.join('; ')}
- Qonuniy asoslar: ${scenario.sources?.map(s => `${s.title} (${s.article})`).join(', ')}

FOYDALANUVCHINING BOSQICHMA-BOSQICH QARORLARI:
${action_logs.map(l => `${l.step_number}-bosqich: "${l.action_title}" (${l.action_type}). Oqibat: ${l.consequence}. Fikr: ${l.feedback}`).join('\n')}

QAT'IY BAHOLASH RUBRIKASI:
1. total_score (0-100): Qarorlarning qonuniyligi, taktika va dalillar bilan ishlashning umumiy yuridik sifati.
2. decision_quality_score (0-100): Tanlangan variantlarning O'zbekiston qonunchiligiga muvofiqligi.
3. legal_analysis_score (0-100): Tegishli moddalarga tayanish darajasi.
4. evidence_usage_score (0-100): Dalillar bazasidan to'g'ri foydalanish.
5. strategy_score (0-100): Sudgacha yoki sud jarayonidagi umumiy strategiya.
6. mistakes: Haqiqiy yuridik xatolar ro'yxati (har bir xatoda O'zbekiston qonunchiligi nuqtai nazaridan nima xato bo'lgani aniq ko'rsatilsin).
7. missed_opportunities: Foydalanuvchi foydalanmagan huquqiy imkoniyatlar yoki moddalar.
8. recommendations: Amaliyotni yaxshilash uchun 2-3 ta aniq amaliy tavsiya.

Javobni FAQAT toza JSON formatida ber:
{
  "total_score": 85,
  "decision_quality_score": 88,
  "legal_analysis_score": 82,
  "evidence_usage_score": 80,
  "strategy_score": 85,
  "mistakes": ["Xato 1..."],
  "missed_opportunities": ["Qo'ldan boy berilgan imkoniyat 1..."],
  "recommendations": ["Tavsiya 1...", "Tavsiya 2..."]
}`

        let aiRaw = ''
        if (process.env.GEMINI_API_KEY) {
          const { callGemini } = await import('@/lib/gemini')
          aiRaw = await callGemini(aiPrompt, { temperature: 0.15, maxTokens: 2000, responseJson: true })
        } else if (process.env.GROQ_API_KEY) {
          const { aiClient } = await import('@/lib/ai-client')
          const groqRes = await aiClient.chat({ prompt: aiPrompt, temperature: 0.15, maxTokens: 2000 })
          aiRaw = groqRes.text
        }

        if (aiRaw) {
          let clean = aiRaw.trim()
          if (clean.startsWith('```json')) clean = clean.slice(7)
          else if (clean.startsWith('```')) clean = clean.slice(3)
          if (clean.endsWith('```')) clean = clean.slice(0, -3)
          clean = clean.trim()

          const aiEval = JSON.parse(clean)
          if (aiEval && typeof aiEval.total_score === 'number') {
            evaluation = {
              total_score: Math.min(100, Math.max(10, Math.round(aiEval.total_score))),
              xp_awarded: Math.round(Math.min(100, Math.max(10, Math.round(aiEval.total_score))) * 1.5 + (evaluation.xp_awarded || 0)),
              decision_quality_score: Math.min(100, Math.max(0, Math.round(aiEval.decision_quality_score || evaluation.decision_quality_score))),
              legal_analysis_score: Math.min(100, Math.max(0, Math.round(aiEval.legal_analysis_score || evaluation.legal_analysis_score))),
              evidence_usage_score: Math.min(100, Math.max(0, Math.round(aiEval.evidence_usage_score || evaluation.evidence_usage_score))),
              strategy_score: Math.min(100, Math.max(0, Math.round(aiEval.strategy_score || evaluation.strategy_score))),
              mistakes: Array.isArray(aiEval.mistakes) && aiEval.mistakes.length > 0 ? aiEval.mistakes : evaluation.mistakes,
              missed_opportunities: Array.isArray(aiEval.missed_opportunities) && aiEval.missed_opportunities.length > 0 ? aiEval.missed_opportunities : evaluation.missed_opportunities,
              recommendations: Array.isArray(aiEval.recommendations) && aiEval.recommendations.length > 0 ? aiEval.recommendations : evaluation.recommendations,
              completed_at: new Date().toISOString(),
            }
          }
        }
      } catch (evalErr) {
        console.warn('AI scenario evaluation error, falling back to base:', evalErr)
      }
    }

    const supabase = getSupabaseAdmin()

    // 1. Save / Update session in Supabase database
    let activeSessionId = session_id || `session_${Date.now()}`

    try {
      const completedSessionData = {
        template_id: scenario.id,
        scenario_data: scenario,
        current_step: action_logs.length,
        total_steps: scenario.decision_points?.length || action_logs.length,
        user_actions: action_logs,
        score: evaluation.total_score,
        xp_awarded: evaluation.xp_awarded,
        evaluation,
        status: 'completed',
        updated_at: new Date().toISOString(),
      }

      // Agar session_id bo'lsa — scenarios jadvalida update qilish
      let updated = false
      if (session_id) {
        const { error: updErr } = await supabase
          .from('scenarios')
          .update({
            title: scenario.title,
            scenario_type: scenario.legal_domain || 'civil',
            difficulty_level: scenario.difficulty || 'intermediate',
            description: (scenario.background || '').slice(0, 500),
            data: completedSessionData,
          })
          .eq('id', session_id)
          .eq('user_id', auth.user.id)

        if (!updErr) {
          updated = true
        }
      }

      // Agar update bo'lmagan bo'lsa (yoki yangi bo'lsa) — insert qilish
      if (!updated) {
        const { data: inserted, error: insErr } = await supabase
          .from('scenarios')
          .insert({
            user_id: auth.user.id,
            title: scenario.title,
            scenario_type: scenario.legal_domain || 'civil',
            difficulty_level: scenario.difficulty || 'intermediate',
            complexity: 'standard',
            description: (scenario.background || '').slice(0, 500),
            data: completedSessionData,
          })
          .select('id')
          .single()

        if (!insErr && inserted?.id) {
          activeSessionId = inserted.id
        }
      }

      // Shuningdek, scenario_sessions jadvali mavjud bo'lsa, unga ham urinish
      try {
        await supabase.from('scenario_sessions').insert({
          user_id: auth.user.id,
          template_id: scenario.id,
          scenario_data: scenario,
          current_step: action_logs.length,
          total_steps: scenario.decision_points?.length || action_logs.length,
          user_actions: action_logs,
          score: evaluation.total_score,
          xp_awarded: evaluation.xp_awarded,
          evaluation,
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      } catch {
        // scenario_sessions bo'lmasa scenarios ga yozilgani yetarli
      }
    } catch (dbErr) {
      console.warn('Scenario session save error:', dbErr)
    }

    // 2. Award XP with idempotency key
    const xpAmount = Math.max(10, evaluation.xp_awarded || 15)
    let xpResult = {
      xpEarned: xpAmount,
      totalXp: xpAmount,
      level: 1,
      unlockedAchievements: [],
    }

    try {
      const awarded = await awardUserXP({
        userId: auth.user.id,
        userEmail: auth.user.email,
        action: 'scenario',
        xp: xpAmount,
        title: `Senariy yakunlandi: ${scenario.title}`,
        description: `${scenario.legal_domain} sohasidagi yuridik senariy (${evaluation.total_score} ball)`,
        idempotencyKey: `scenario_eval_${activeSessionId}_${scenario.id}`,
        metadata: {
          scenario_id: scenario.id,
          session_id: activeSessionId,
          score: evaluation.total_score,
          domain: scenario.legal_domain,
        },
      })
      if (awarded) {
        xpResult = awarded as any
      }
    } catch (xpErr) {
      console.warn('Award XP error (ignored to not fail evaluation):', xpErr)
    }

    return NextResponse.json({
      success: true,
      evaluation,
      session_id: activeSessionId,
      xpEarned: xpResult.xpEarned,
      totalXp: xpResult.totalXp,
      level: xpResult.level,
      unlockedAchievements: xpResult.unlockedAchievements,
    })
  } catch (error) {
    console.error('Scenario evaluation API error:', error)
    return NextResponse.json({ error: 'Senariyni baholashda xatolik yuz berdi' }, { status: 500 })
  }
}
