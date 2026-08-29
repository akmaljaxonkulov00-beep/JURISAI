import { supabase } from './supabase-client'

export interface ActivityRecord {
  id: string
  type:
    | 'case_completed'
    | 'case_attempted'
    | 'ai_chat'
    | 'document_generated'
    | 'court_session'
    | 'quiz_completed'
    | 'manual_entry'
  title: string
  description: string
  xp: number
  timestamp: string
}

export interface UserStatsData {
  xp: number
  level: number
  completedCases: number
  totalCases: number
  weeklyProgress: number
  streak: number
  studyTime: number
  averageAccuracy: number
  achievements: number
  recentActivity: ActivityRecord[]
}

const LEVEL_XP = 100 // 100 XP per level

export function trackUserActivity(
  type: ActivityRecord['type'],
  title: string,
  description: string,
  xpEarned: number = 10
) {
  if (typeof window === 'undefined') return

  try {
    // 1. Update user_stats
    const storedStats = localStorage.getItem('user_stats')
    let stats: UserStatsData = storedStats
      ? JSON.parse(storedStats)
      : {
          xp: 0,
          level: 1,
          completedCases: 0,
          totalCases: 0,
          weeklyProgress: 0,
          streak: 1,
          studyTime: 0,
          averageAccuracy: 85,
          achievements: 0,
          recentActivity: [],
        }

    const newRecord: ActivityRecord = {
      id: Date.now().toString(),
      type,
      title,
      description,
      xp: xpEarned,
      timestamp: new Date().toISOString(),
    }

    if (!stats.recentActivity) stats.recentActivity = []
    stats.recentActivity.unshift(newRecord)
    if (stats.recentActivity.length > 30) {
      stats.recentActivity = stats.recentActivity.slice(0, 30)
    }

    stats.xp = (stats.xp || 0) + xpEarned
    stats.level = Math.floor(stats.xp / LEVEL_XP) + 1

    if (type === 'case_completed') {
      stats.completedCases = (stats.completedCases || 0) + 1
      stats.totalCases = (stats.totalCases || 0) + 1
    } else if (type === 'case_attempted') {
      stats.totalCases = (stats.totalCases || 0) + 1
    }

    // Update study time (add 5 minutes per action)
    stats.studyTime = (stats.studyTime || 0) + 5

    localStorage.setItem('user_stats', JSON.stringify(stats))

    // 2. Update activity_days (heatmap calendar)
    const todayKey = new Date().toISOString().split('T')[0]
    const storedDays = localStorage.getItem('activity_days')
    const daysActive = storedDays ? JSON.parse(storedDays) : {}
    daysActive[todayKey] = (daysActive[todayKey] || 0) + 1
    localStorage.setItem('activity_days', JSON.stringify(daysActive))

    // 3. Update skill levels based on type
    const storedSkills = localStorage.getItem('skill_levels')
    const skillLevels = storedSkills
      ? JSON.parse(storedSkills)
      : { civil: 10, criminal: 10, labor: 10, family: 10, administrative: 10, procedural: 10 }

    if (type === 'case_completed') {
      skillLevels.procedural = Math.min(100, (skillLevels.procedural || 10) + 5)
    } else if (type === 'ai_chat') {
      skillLevels.civil = Math.min(100, (skillLevels.civil || 10) + 2)
    } else if (type === 'document_generated') {
      skillLevels.administrative = Math.min(100, (skillLevels.administrative || 10) + 4)
    } else if (type === 'court_session') {
      skillLevels.criminal = Math.min(100, (skillLevels.criminal || 10) + 6)
    }
    localStorage.setItem('skill_levels', JSON.stringify(skillLevels))

    // 5. Notify listeners (statistics page) so stats update in real time
    window.dispatchEvent(new CustomEvent('stats-updated', { detail: newRecord }))

    // 4. Try syncing to registered_users if logged in
    try {
      const storedUser = localStorage.getItem('auth_user')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        if (user.id) {
          supabase
            .from('registered_users')
            .update({
              xp: stats.xp,
              level: stats.level,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .then(() => {})
        }
      }
    } catch {}
  } catch (err) {
    console.error('Error tracking activity:', err)
  }
}
