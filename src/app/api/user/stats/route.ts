import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { LEVEL_XP, XP_ACTION_VALUES } from '@/lib/xp-engine'

const WEEKLY_GOAL_XP = 500

function getRank(level: number): string {
  if (level >= 50) return 'Legal Master'
  if (level >= 40) return 'Senior Expert'
  if (level >= 30) return 'Expert'
  if (level >= 20) return 'Advanced Practitioner'
  if (level >= 15) return 'Practitioner'
  if (level >= 10) return 'Intermediate'
  if (level >= 5) return 'Junior'
  return 'Beginner'
}

function getActionTitle(action: string, metadataTitle?: string): string {
  if (metadataTitle) return metadataTitle
  const titles: Record<string, string> = {
    'ai-chat': 'AI huquqiy maslahat',
    ai_legal_chat: 'AI huquqiy maslahat',
    irac: 'IRAC tahlili',
    irac_analysis: 'IRAC tahlili',
    'case-solver': 'Kazus yechish',
    'document-generate': 'Hujjat generatsiyasi',
    document_analysis: 'Hujjat tahlili',
    'risk-assessment': 'Shartnoma riski tahlili',
    'court-practice': 'Sud amaliyoti tahlili',
    calculator: 'Yuridik kalkulyator',
    'law-search': 'Qonunlar bazasi qidiruv',
    'virtual-court': 'Virtual sud majlisi',
    'court-simulation': 'Virtual sud majlisi',
    'decision-tree': 'Qarorlar daraxti',
    'speech-stt': 'Ovozli yozuv',
    scenario: 'Senariy simulyatsiyasi',
    'scenario-evaluation': 'Senariy baholash',
  }
  return titles[action] || 'Huquqiy amaliyot'
}

function getActionIcon(action: string): string {
  const icons: Record<string, string> = {
    'ai-chat': '💬',
    irac: '⚖️',
    irac_analysis: '⚖️',
    'case-solver': '🔍',
    'document-generate': '📄',
    document_analysis: '🛡️',
    'risk-assessment': '🛡️',
    'court-practice': '📈',
    calculator: '🧮',
    'law-search': '📚',
    'virtual-court': '🏛️',
    'court-simulation': '🏛️',
    'decision-tree': '🌳',
    'speech-stt': '🎤',
    scenario: '🎭',
    'scenario-evaluation': '🎭',
  }
  return icons[action] || '📝'
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const daysParam = searchParams.get('days')
    const days = daysParam ? parseInt(daysParam, 10) : 9999
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '6', 10)))
    const supabase = getSupabaseAdmin()

    // 1. Fetch user data from registered_users (by ID, then by Email, or auto-provision)
    let { data: userData } = await supabase
      .from('registered_users')
      .select('id, name, full_name, email, created_at, subscription_plan, xp, level')
      .eq('id', auth.user.id)
      .maybeSingle()

    if (!userData && auth.user.email) {
      const { data: byEmail } = await supabase
        .from('registered_users')
        .select('id, name, full_name, email, created_at, subscription_plan, xp, level')
        .eq('email', auth.user.email.toLowerCase().trim())
        .maybeSingle()
      if (byEmail) {
        userData = byEmail
      }
    }

    if (!userData) {
      // Auto-provision initial record for authenticated user
      const initialUser = {
        id: auth.user.id,
        email: auth.user.email || '',
        name: auth.user.email?.split('@')[0] || 'Foydalanuvchi',
        full_name: auth.user.email?.split('@')[0] || 'Foydalanuvchi',
        xp: 0,
        level: 1,
        role: 'USER',
        subscription_plan: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      try {
        const { data: created } = await supabase
          .from('registered_users')
          .insert(initialUser)
          .select('id, name, full_name, email, created_at, subscription_plan, xp, level')
          .single()
        userData = created || initialUser
      } catch {
        userData = initialUser
      }
    }

    // 2. Fetch usage logs for user
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data: usageData } = await supabase
      .from('usage_logs')
      .select('id, action, tokens, metadata, created_at')
      .eq('user_id', auth.user.id)
      .gte('created_at', sinceDate)
      .order('created_at', { ascending: false })
      .limit(300)

    // 3. Fetch completed IRAC cases / analyses
    const { data: iracAnalyses } = await supabase
      .from('irac_analyses')
      .select('id, case_title, total_score, grade, completed_at, created_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    // 4. Fetch achievements
    const { data: achData } = await supabase
      .from('achievements')
      .select('id, title, achievement_type, rarity, unlocked_at')
      .eq('user_id', auth.user.id)
      .order('unlocked_at', { ascending: false })
      .limit(50)

    const usageLogs = usageData || []
    const analyses = iracAnalyses || []
    const achievements = achData || []

    // ── XP & Counts Breakdown ──
    const xpByAction: Record<string, number> = {}
    const countByAction: Record<string, number> = {}
    let logsTotalXP = 0

    for (const log of usageLogs) {
      const action = String(log.action || '')
      const xp = Number(log.metadata?.xp_awarded ?? log.tokens ?? XP_ACTION_VALUES[action] ?? 5)
      xpByAction[action] = (xpByAction[action] || 0) + xp
      countByAction[action] = (countByAction[action] || 0) + 1
      logsTotalXP += xp
    }

    // Database registered_users XP is the primary source of truth
    const userDbXp = Number(userData.xp || 0)
    const totalXP = Math.max(userDbXp, logsTotalXP)
    const level = Number(userData.level || Math.floor(totalXP / LEVEL_XP) + 1)
    const xpInCurrentLevel = totalXP % LEVEL_XP
    const xpToNextLevel = LEVEL_XP - xpInCurrentLevel
    const progressPercent = Math.round((xpInCurrentLevel / LEVEL_XP) * 100)

    // ── Haftalik XP (Start of this week in Tashkent time UTC+5) ──
    const now = new Date()
    const tashkentOffsetMs = 5 * 60 * 60 * 1000
    const localNow = new Date(now.getTime() + tashkentOffsetMs)
    const dayOfWeek = localNow.getUTCDay() // 0 = Sunday, 1 = Monday
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const mondayStartUtc = new Date(
      Date.UTC(
        localNow.getUTCFullYear(),
        localNow.getUTCMonth(),
        localNow.getUTCDate() - daysSinceMonday
      ) - tashkentOffsetMs
    )

    const weeklyXP = usageLogs
      .filter(l => new Date(l.created_at || '') >= mondayStartUtc)
      .reduce(
        (sum, l) =>
          sum +
          Number(
            l.metadata?.xp_awarded ?? l.tokens ?? XP_ACTION_VALUES[String(l.action || '')] ?? 5
          ),
        0
      )
    const weeklyProgress = Math.min(Math.round((weeklyXP / WEEKLY_GOAL_XP) * 100), 100)

    // ── Kunlik faollik xaritasi (oxirgi 30 kun) ──
    const dailyActivity: Record<string, number> = {}
    for (const log of usageLogs) {
      const day = String(log.created_at || '').split('T')[0]
      if (day) dailyActivity[day] = (dailyActivity[day] || 0) + 1
    }
    const activeDays = Object.keys(dailyActivity).length

    // ── Streak (Ketma-ket faol kunlar) ──
    let streak = 0
    const todayStr = now.toISOString().split('T')[0]
    for (let i = 0; i < 365; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      if (dailyActivity[key]) {
        streak++
      } else if (i > 0 && key !== todayStr) {
        break
      }
    }

    // ── Amaliyot bo‘yicha statistika ──
    const practiceStats = [
      {
        key: 'case-solver',
        label: 'Kazus Yechish',
        icon: '🔍',
        count: (countByAction['case-solver'] || 0) + (countByAction['irac_analysis'] || 0),
        xp: (xpByAction['case-solver'] || 0) + (xpByAction['irac_analysis'] || 0),
      },
      {
        key: 'virtual-court',
        label: 'Virtual Sud',
        icon: '🏛️',
        count: (countByAction['virtual-court'] || 0) + (countByAction['court-simulation'] || 0),
        xp: (xpByAction['virtual-court'] || 0) + (xpByAction['court-simulation'] || 0),
      },
      {
        key: 'decision-tree',
        label: 'Qarorlar Daraxti',
        icon: '🌳',
        count: countByAction['decision-tree'] || 0,
        xp: xpByAction['decision-tree'] || 0,
      },
      {
        key: 'scenario',
        label: 'Senariy Generator',
        icon: '🎭',
        count: (countByAction['scenario'] || 0) + (countByAction['scenario-evaluation'] || 0),
        xp: (xpByAction['scenario'] || 0) + (xpByAction['scenario-evaluation'] || 0),
      },
      {
        key: 'document-generate',
        label: 'Hujjatlar & Risk',
        icon: '📄',
        count:
          (countByAction['document-generate'] || 0) +
          (countByAction['risk-assessment'] || 0) +
          (countByAction['document_analysis'] || 0),
        xp:
          (xpByAction['document-generate'] || 0) +
          (xpByAction['risk-assessment'] || 0) +
          (xpByAction['document_analysis'] || 0),
      },
      {
        key: 'calculator',
        label: 'Yuridik Asboblar',
        icon: '🧮',
        count:
          (countByAction['calculator'] || 0) +
          (countByAction['court-practice'] || 0) +
          (countByAction['legal_tools'] || 0),
        xp:
          (xpByAction['calculator'] || 0) +
          (xpByAction['court-practice'] || 0) +
          (xpByAction['legal_tools'] || 0),
      },
      {
        key: 'ai-chat',
        label: 'AI Maslahat',
        icon: '💬',
        count: (countByAction['ai-chat'] || 0) + (countByAction['ai_legal_chat'] || 0),
        xp: (xpByAction['ai-chat'] || 0) + (xpByAction['ai_legal_chat'] || 0),
      },
      {
        key: 'law-search',
        label: 'Qonunlar Bazasi',
        icon: '📚',
        count: countByAction['law-search'] || 0,
        xp: xpByAction['law-search'] || 0,
      },
    ].filter(p => p.count > 0)

    // ── Faoliyat tarixi ──
    const formatActivityItem = (log: any) => {
      const action = String(log.action || '')
      const meta = log.metadata || {}
      return {
        id: String(log.id || ''),
        action,
        title: getActionTitle(action, meta.title),
        icon: getActionIcon(action),
        xp: Number(meta.xp_awarded ?? log.tokens ?? XP_ACTION_VALUES[action] ?? 5),
        description: meta.description || meta.summary || '',
        timestamp: String(log.created_at || ''),
      }
    }

    const recentActivity = usageLogs.slice(0, limit).map(formatActivityItem)
    const allActivity = usageLogs.slice(0, 100).map(formatActivityItem)

    // ── IRAC natijalari ──
    const recentIRAC = analyses.slice(0, 10).map(c => ({
      id: String(c.id || ''),
      title: String(c.case_title || 'IRAC Kazus'),
      status: 'COMPLETED',
      score: Number(c.total_score || 0),
      timestamp: String(c.completed_at || c.created_at || ''),
    }))

    // ── Yutuqlar ──
    const achievementList = achievements.map(a => ({
      id: String(a.id || ''),
      title: String(a.title || ''),
      type: String(a.achievement_type || ''),
      rarity: String(a.rarity || 'common').toLowerCase(),
      unlockedAt: String(a.unlocked_at || ''),
    }))

    return NextResponse.json({
      xp: totalXP,
      level,
      xpInCurrentLevel,
      xpToNextLevel,
      progressPercent,
      weeklyXP,
      weeklyGoalXp: WEEKLY_GOAL_XP,
      weeklyProgress,
      rank: getRank(level),
      levelXp: LEVEL_XP,

      activeDays,
      streak,
      totalActions: usageLogs.length,
      totalIracCases: analyses.length,
      completedIracCases: analyses.length,

      xpByAction,
      countByAction,
      practiceStats,

      recentActivity,
      allActivity,
      recentIRAC,
      achievements: achievementList,
      dailyActivity,

      userName: userData.full_name || userData.name || userData.email?.split('@')[0] || '',
      memberSince: userData.created_at || '',
      subscriptionPlan: userData.subscription_plan || 'free',
    })
  } catch (error) {
    console.error('User stats API error:', error)
    return NextResponse.json({ error: 'Ichki server xatosi' }, { status: 500 })
  }
}
