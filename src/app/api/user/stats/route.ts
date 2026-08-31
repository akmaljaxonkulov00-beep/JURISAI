import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// ═══════════════════════════════════════════════════════════════════
// XP QOIDALARI — HAQIQIY LOGIC
// ═══════════════════════════════════════════════════════════════════
// usage_logs.action ga qarab XP beriladi:
const XP_VALUES: Record<string, number> = {
  'ai-chat': 5,
  ai_legal_chat: 5,
  irac: 15,
  irac_analysis: 15,
  'case-solver': 20,
  'document-generate': 10,
  document_analysis: 10,
  'law-search': 3,
  'virtual-court': 25,
  'court-simulation': 25,
  'decision-tree': 15,
  'speech-stt': 5,
  scenario: 10,
}
const LEVEL_XP = 200 // 200 XP per level
const WEEKLY_GOAL_XP = 500

function getXPForAction(action: string): number {
  return XP_VALUES[action] || 5
}

function getLevel(xp: number): number {
  return Math.floor(xp / LEVEL_XP) + 1
}

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

function getActionTitle(action: string): string {
  const titles: Record<string, string> = {
    'ai-chat': 'AI huquqiy maslahat',
    ai_legal_chat: 'AI huquqiy maslahat',
    irac: 'IRAC tahlili',
    irac_analysis: 'IRAC tahlili',
    'document-generate': 'Hujjat generatsiyasi',
    document_analysis: 'Hujjat tahlili',
    'law-search': 'Qonunlar bazasi qidirish',
    'case-solver': 'Kazus yechish',
    'virtual-court': 'Virtual sud',
    'court-simulation': 'Virtual sud',
    'decision-tree': 'Qarorlar daraxti',
    'speech-stt': 'Ovozli kiritish',
    scenario: 'Senariy yaratish',
  }
  return titles[action] || 'Faoliyat'
}

function getActionIcon(action: string): string {
  const icons: Record<string, string> = {
    'ai-chat': '💬',
    irac: '⚖️',
    'document-generate': '📄',
    'law-search': '📚',
    'case-solver': '🔍',
    'virtual-court': '🏛️',
    'decision-tree': '🌳',
    'speech-stt': '🎤',
    scenario: '🎭',
  }
  return icons[action] || '📝'
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '9999')
    const supabase = getSupabaseAdmin()

    // 1. User data
    const { data: userData } = await supabase
      .from('registered_users')
      .select('id, name, created_at, subscription_plan')
      .eq('id', auth.user.id)
      .maybeSingle()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Usage logs — asosiy data manbai
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data: usageData } = await supabase
      .from('usage_logs')
      .select('id, action, tokens, created_at')
      .eq('user_id', auth.user.id)
      .gte('created_at', sinceDate)
      .order('created_at', { ascending: false })
      .limit(200)

    // 3. IRAC cases
    const { data: iracData } = await supabase
      .from('irac_cases')
      .select('id, title, status, total_score, created_at')
      .eq('user_id', auth.user.id)
      .gte('created_at', sinceDate)
      .order('created_at', { ascending: false })
      .limit(100)

    // 4. Achievements
    const { data: achData } = await supabase
      .from('achievements')
      .select('id, title, achievement_type, rarity, unlocked_at')
      .eq('user_id', auth.user.id)
      .order('unlocked_at', { ascending: false })
      .limit(50)

    // ── XP hisoblash ──
    const usageLogs = usageData || []
    const iracCases = iracData || []
    const achievements = achData || []

    // Har bir action uchun XP
    const xpByAction: Record<string, number> = {}
    const countByAction: Record<string, number> = {}
    let totalXP = 0

    for (const log of usageLogs) {
      const action = String(log.action || '')
      const xp = getXPForAction(action)
      xpByAction[action] = (xpByAction[action] || 0) + xp
      countByAction[action] = (countByAction[action] || 0) + 1
      totalXP += xp
    }

    // IRAC uchun qo'shimcha XP
    const completedIRAC = iracCases.filter(c => c.status === 'COMPLETED').length
    totalXP += completedIRAC * 15

    const level = getLevel(totalXP)
    const xpInCurrentLevel = totalXP % LEVEL_XP
    const xpToNextLevel = LEVEL_XP - xpInCurrentLevel
    const progressPercent = Math.round((xpInCurrentLevel / LEVEL_XP) * 100)

    // Haftalik XP
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const weeklyXP = usageLogs
      .filter(l => new Date(l.created_at || '') >= weekAgo)
      .reduce((sum, l) => sum + getXPForAction(String(l.action || '')), 0)
    const weeklyProgress = Math.min(Math.round((weeklyXP / WEEKLY_GOAL_XP) * 100), 100)

    // Kunlik faollik (oxirgi 30 kun)
    const dailyActivity: Record<string, number> = {}
    for (const log of usageLogs) {
      const day = String(log.created_at || '').split('T')[0]
      dailyActivity[day] = (dailyActivity[day] || 0) + 1
    }
    const activeDays = Object.keys(dailyActivity).length

    // Streak — ketma-ket faol kunlar
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      if (dailyActivity[key]) streak++
      else if (i > 0) break
    }

    // Amaliyot bo'yicha statistika
    const practiceStats = [
      {
        key: 'case-solver',
        label: 'Kazus Yechish',
        icon: '🔍',
        count: countByAction['case-solver'] || 0,
        xp: xpByAction['case-solver'] || 0,
      },
      {
        key: 'irac',
        label: 'IRAC Tahlili',
        icon: '⚖️',
        count: (countByAction['irac'] || 0) + completedIRAC,
        xp: (xpByAction['irac'] || 0) + completedIRAC * 15,
      },
      {
        key: 'virtual-court',
        label: 'Virtual Sud',
        icon: '🏛️',
        count: countByAction['virtual-court'] || countByAction['court-simulation'] || 0,
        xp: xpByAction['virtual-court'] || xpByAction['court-simulation'] || 0,
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
        count: countByAction['scenario'] || 0,
        xp: xpByAction['scenario'] || 0,
      },
      {
        key: 'ai-chat',
        label: 'AI Maslahat',
        icon: '💬',
        count: (countByAction['ai-chat'] || 0) + (countByAction['ai_legal_chat'] || 0),
        xp: (xpByAction['ai-chat'] || 0) + (xpByAction['ai_legal_chat'] || 0),
      },
      {
        key: 'document-generate',
        label: 'Hujjat',
        icon: '📄',
        count:
          (countByAction['document-generate'] || 0) + (countByAction['document_analysis'] || 0),
        xp: (xpByAction['document-generate'] || 0) + (xpByAction['document_analysis'] || 0),
      },
      {
        key: 'law-search',
        label: 'Qonunlar Bazasi',
        icon: '📚',
        count: countByAction['law-search'] || 0,
        xp: xpByAction['law-search'] || 0,
      },
    ].filter(p => p.count > 0)

    // Faoliyat tarixi
    const recentActivity = usageLogs.slice(0, 30).map(log => ({
      id: String(log.id || ''),
      action: String(log.action || ''),
      title: getActionTitle(String(log.action || '')),
      icon: getActionIcon(String(log.action || '')),
      xp: getXPForAction(String(log.action || '')),
      timestamp: String(log.created_at || ''),
    }))

    // Oxirgi IRAC natijalari
    const recentIRAC = iracCases.slice(0, 10).map(c => ({
      id: String(c.id || ''),
      title: String(c.title || ''),
      status: String(c.status || ''),
      score: Number(c.total_score || 0),
      timestamp: String(c.created_at || ''),
    }))

    // Yutuqlar
    const achievementList = achievements.map(a => ({
      id: String(a.id || ''),
      title: String(a.title || ''),
      type: String(a.achievement_type || ''),
      rarity: String(a.rarity || 'common').toLowerCase(),
      unlockedAt: String(a.unlocked_at || ''),
    }))

    return NextResponse.json({
      // Asosiy ko'rsatkichlar
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

      // Faollik
      activeDays,
      streak,
      totalActions: usageLogs.length,
      totalIracCases: iracCases.length,
      completedIracCases: completedIRAC,

      // XP breakdown
      xpByAction,
      countByAction,

      // Practice stats
      practiceStats,

      // Activity history
      recentActivity,
      recentIRAC,
      achievements: achievementList,

      // Daily activity (heatmap)
      dailyActivity,

      // User info
      userName: userData.name || '',
      memberSince: userData.created_at || '',
      subscriptionPlan: userData.subscription_plan || 'free',
    })
  } catch (error) {
    console.error('User stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
