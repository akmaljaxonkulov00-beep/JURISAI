import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    // Yagona autentifikatsiya manbai — requireUser (server-side JWT tekshirish)
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const supabase = getSupabaseAdmin()

    // Get user from database (registered_users — yagona manba)
    const { data: userData, error: userError } = await supabase
      .from('registered_users')
      .select('id, email, name, role, subscription_plan, blocked, created_at')
      .eq('id', auth.user.id)
      .maybeSingle()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Get usage logs for XP + recent activity (usage_logs — yagona manba)
    const { data: usageData, error: usageError } = await supabase
      .from('usage_logs')
      .select('id, user_id, email, action, tokens, created_at')
      .eq('user_id', userData.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (usageError) {
      console.error('Usage error:', usageError)
    }

    // Achievements va irac_cases jadvallari mavjud bo'lmasa — bo'sh qaytaramiz (real 0,
    // to'qima emas). Faqat mavjud bo'lsa o'qiymiz.
    const achievementsData: Array<Record<string, unknown>> = []
    const iracData: Array<Record<string, unknown>> = []
    try {
      const [achRes, iracRes] = await Promise.all([
        supabase
          .from('achievements')
          .select('*')
          .eq('user_id', userData.id)
          .order('unlocked_at', { ascending: false })
          .limit(10),
        supabase
          .from('irac_cases')
          .select('id, title, status, total_score, created_at')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ])
      if (!achRes.error)
        achievementsData.push(...((achRes.data as Array<Record<string, unknown>>) || []))
      if (!iracRes.error) iracData.push(...((iracRes.data as Array<Record<string, unknown>>) || []))
    } catch {
      // Jadvallar yo'q bo'lsa — bo'sh
    }

    // ── Real XP: har bir AI so'rov 5 XP (usage_logs asosida) ──
    const totalXP = (usageData || []).reduce((sum: number) => sum + 5, 0)
    const level = Math.floor(totalXP / 200) + 1 // 200 XP per level
    const completedCases = iracData.filter(item => item.status === 'COMPLETED').length || 0
    const totalCases = iracData.length || 0

    // Haftalik taraqqiyot (real — oxirgi 7 kun)
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const weeklyXP =
      (usageData || [])
        .filter(u => new Date(String(u.created_at || '')) >= weekStart)
        .reduce((sum: number) => sum + 5, 0) || 0
    const weeklyProgress = Math.min(Math.round((weeklyXP / 500) * 100), 100) // 500 XP weekly goal

    // Process achievements
    const achievements = achievementsData.map(achievement => ({
      id: String(achievement.id || ''),
      title: String(achievement.title || ''),
      description: String(achievement.description || ''),
      icon: getAchievementIcon(String(achievement.achievement_type || '')),
      unlockedAt: String(achievement.unlocked_at || ''),
      rarity: String(achievement.rarity || '').toLowerCase(),
    }))

    // Process recent activity (usage_logs.action asosida — real)
    const recentActivity = (usageData || []).slice(0, 20).map(usage => ({
      id: String(usage.id || ''),
      type: String(usage.action || 'activity').replace('-', '_'),
      title: getActivityTitle(String(usage.action || ''), String(usage.action || '')),
      description: getActivityDescription(String(usage.action || ''), String(usage.action || '')),
      timestamp: String(usage.created_at || ''),
      xp: getActivityXP(String(usage.action || '')),
    }))

    const rank = getRankByLevel(level)

    const userStats = {
      xp: totalXP,
      level,
      completedCases,
      totalCases,
      weeklyProgress,
      rank,
      achievements,
      recentActivity,
    }

    return NextResponse.json(userStats)
  } catch (error) {
    console.error('User stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getAchievementIcon(type: string): string {
  const icons: { [key: string]: string } = {
    first_case: '◎',
    irac_master: '═',
    quick_thinker: '⚡',
    legal_scholar: '◇',
    ai_expert: '⚙',
    case_solver: '☆',
    research_master: '▣▣',
    perfect_score: '💯',
  }
  return icons[type] || '★'
}

function getActivityTitle(feature: string, action: string): string {
  const titles: { [key: string]: string } = {
    ai_chat: 'AI Legal Chat',
    ai_legal_chat: 'AI Legal Chat',
    irac: 'IRAC Analysis',
    irac_analysis: 'IRAC Analysis',
    document_generate: 'Document Generation',
    document_generation: 'Document Generation',
    document_analysis: 'Document Analysis',
    law_search: 'Legal Research',
    case_solver: 'Case Solving',
    virtual_court: 'Virtual Court',
    court_simulation: 'Court Simulation',
    decision_tree: 'Decision Tree',
    speech_stt: 'Voice Input',
    scenario: 'Scenario Generation',
  }
  return titles[feature || action] || 'Activity'
}

function getActivityDescription(feature: string, action: string): string {
  const descriptions: { [key: string]: string } = {
    ai_chat: 'Completed AI legal consultation',
    ai_legal_chat: 'Completed AI legal consultation',
    irac: 'Analyzed legal case using IRAC method',
    irac_analysis: 'Analyzed legal case using IRAC method',
    document_generate: 'Generated legal document',
    document_generation: 'Generated legal document',
    document_analysis: 'Analyzed legal document',
    law_search: 'Searched legal database',
    case_solver: 'Solved legal case',
    virtual_court: 'Participated in court simulation',
    court_simulation: 'Participated in court simulation',
    decision_tree: 'Generated decision tree',
    speech_stt: 'Used voice input',
    scenario: 'Generated legal scenario',
  }
  return descriptions[feature || action] || `Completed ${action || 'activity'}`
}

function getActivityXP(feature: string): number {
  const xpValues: { [key: string]: number } = {
    ai_chat: 5,
    ai_legal_chat: 5,
    irac: 15,
    irac_analysis: 15,
    document_generate: 10,
    document_generation: 10,
    document_analysis: 10,
    law_search: 3,
    case_solver: 20,
    virtual_court: 25,
    court_simulation: 25,
    decision_tree: 15,
    speech_stt: 5,
    scenario: 10,
  }
  return xpValues[feature || ''] || 5
}

function getRankByLevel(level: number): string {
  if (level >= 50) return 'Legal Master'
  if (level >= 40) return 'Senior Expert'
  if (level >= 30) return 'Expert'
  if (level >= 20) return 'Advanced Practitioner'
  if (level >= 15) return 'Practitioner'
  if (level >= 10) return 'Intermediate'
  if (level >= 5) return 'Junior'
  return 'Beginner'
}
