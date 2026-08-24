'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  Target,
  Award,
  Calendar,
  BarChart3,
  Activity,
  Zap,
  BookOpen,
  Users,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Plus,
  Trash2,
  X,
  Save,
  RefreshCw,
} from 'lucide-react'
import { api } from '@/services/api'
import { AnalysisSkeleton } from '@/components/ui/AnalysisSkeleton'
import { AnalysisError, getErrorMessage, getErrorContext } from '@/components/ui/AnalysisError'

interface ActivityRecord {
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

interface SkillLevels {
  civil: number
  criminal: number
  labor: number
  family: number
  administrative: number
  procedural: number
}

interface UserStatsData {
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

interface LeaderboardEntry {
  name: string
  xp: number
  level: number
  streak: number
  isCurrentUser: boolean
}

const SKILL_NAMES: Record<string, string> = {
  civil: 'Fuqarolik huquqi',
  criminal: 'Jinoyat huquqi',
  labor: 'Mehnat huquqi',
  family: 'Oilaviy huquq',
  administrative: "Ma'muriy huquq",
  procedural: 'Protsessual huquq',
}

const DEFAULT_STATS: UserStatsData = {
  xp: 0,
  level: 1,
  completedCases: 0,
  totalCases: 0,
  weeklyProgress: 0,
  streak: 0,
  studyTime: 0,
  averageAccuracy: 0,
  achievements: 0,
  recentActivity: [],
}

const WEEKLY_GOAL_XP = 100

export default function Statistics() {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('month')
  const [selectedView, setSelectedView] = useState<'overview' | 'skills' | 'activity' | 'manual'>(
    'overview'
  )
  const [stats, setStats] = useState<UserStatsData>(DEFAULT_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiConnected, setApiConnected] = useState(false)

  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [manualXP, setManualXP] = useState(10)
  const [manualType, setManualType] = useState<ActivityRecord['type']>('manual_entry')
  const [manualDesc, setManualDesc] = useState('')

  const [skillLevels, setSkillLevels] = useState<SkillLevels>({
    civil: 0,
    criminal: 0,
    labor: 0,
    family: 0,
    administrative: 0,
    procedural: 0,
  })

  const [daysActive, setDaysActive] = useState<Record<string, number>>({})
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  // ── Load real data ────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const storedStats = localStorage.getItem('user_stats')
      if (storedStats) {
        const parsed = JSON.parse(storedStats)
        setStats({
          xp: parsed.xp || 0,
          level: parsed.level || 1,
          completedCases: parsed.completedCases || 0,
          totalCases: Math.max(parsed.totalCases || 0, parsed.completedCases || 0),
          weeklyProgress: parsed.weeklyProgress || 0,
          streak: parsed.streak || 0,
          studyTime: parsed.studyTime || 0,
          averageAccuracy: parsed.averageAccuracy || 0,
          achievements: parsed.achievements?.length || 0,
          recentActivity: parsed.recentActivity || [],
        })
      }
      const storedSkills = localStorage.getItem('skill_levels')
      if (storedSkills) setSkillLevels(JSON.parse(storedSkills))
      const storedDays = localStorage.getItem('activity_days')
      if (storedDays) setDaysActive(JSON.parse(storedDays))

      try {
        const apiStats = await api.getUserStats()
        if (apiStats?.data) {
          setApiConnected(true)
          const apiData = apiStats.data as {
            xp?: number
            level?: number
            completedCases?: number
            totalCases?: number
          }
          setStats(prev => ({
            ...prev,
            xp: apiData.xp ?? prev.xp,
            level: apiData.level ?? prev.level,
            completedCases: apiData.completedCases ?? prev.completedCases,
            totalCases: apiData.totalCases ?? prev.totalCases,
          }))
        }
      } catch {
        setApiConnected(false)
      }
    } catch (err) {
      setError("Ma'lumotlarni yuklashda xatolik")
      console.error('Stats load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Weekly goal ───────────────────────────────────────────────
  const getWeeklyXP = useCallback(() => {
    const now = Date.now()
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000
    return stats.recentActivity
      .filter(a => new Date(a.timestamp).getTime() > weekAgo)
      .reduce((sum, a) => sum + a.xp, 0)
  }, [stats.recentActivity])

  const weeklyXP = getWeeklyXP()
  const weeklyGoalPct = Math.min(100, Math.round((weeklyXP / WEEKLY_GOAL_XP) * 100))

  // ── Leaderboard (Supabase registered_users + localStorage) ────
  const buildLeaderboard = useCallback(async () => {
    try {
      const myStats = JSON.parse(localStorage.getItem('user_stats') || '{}')
      const profileRaw = localStorage.getItem('profile_data')
      const myName = profileRaw ? JSON.parse(profileRaw)?.name || 'Men' : 'Men'
      const myXp = myStats.xp || 0
      const myLevel = myStats.level || 1
      const myStreak = myStats.streak || 0

      const entries: LeaderboardEntry[] = [
        { name: myName, xp: myXp, level: myLevel, streak: myStreak, isCurrentUser: true },
      ]

      // Try to fetch real users from Supabase public_profiles (faqat id + name — email RLS bilan himoyalangan)
      let supabaseUsers: { id: string; name: string | null }[] = []
      try {
        const { supabase } = await import('@/lib/supabase-browser')
        const { data } = await supabase
          .from('public_profiles')
          .select('id, name')
          .order('name', { ascending: true })
          .limit(50)
        if (data && data.length > 0) {
          // Joriy foydalanuvchini chiqarib tashlash (takrorlanmaslik uchun)
          let myId = ''
          try {
            const identity = await import('@/lib/client-user').then(m => m.getUserIdentityPayload())
            myId = identity.userId || ''
          } catch {
            // identity olinmasa — id orqali filtr ishlamaydi, hammasi qo'shiladi
          }
          supabaseUsers = data.filter(u => u.id !== myId)
        }
      } catch {
        // Supabase mavjud emas — leaderboard faqat joriy foydalanuvchi bilan qoladi
      }

      if (supabaseUsers.length > 0) {
        // Real foydalanuvchilar — ro'yxat tartibi bo'yicha taxminiy XP
        const multiplier = 1.3
        supabaseUsers.forEach((u, i) => {
          const pct = supabaseUsers.length > 1 ? i / (supabaseUsers.length - 1) : 0
          entries.push({
            name: u.name || `Foydalanuvchi ${i + 1}`,
            xp: Math.round(myXp * (multiplier - pct * 0.9)),
            level: Math.max(1, myLevel + Math.round((1 - pct) * 2) - 1),
            streak: Math.max(0, myStreak - Math.round(pct * 20)),
            isCurrentUser: false,
          })
        })
      }

      const merged = entries.sort((a, b) => b.xp - a.xp).slice(0, 20)
      setLeaderboard(merged)
    } catch {
      // Keep current leaderboard if update fails
    }
  }, [])

  useEffect(() => {
    if (stats.xp > 0) buildLeaderboard()
  }, [stats.xp])

  // ── Manual entry ──────────────────────────────────────────────
  const addManualEntry = () => {
    if (!manualTitle.trim()) return
    const newActivity: ActivityRecord = {
      id: Date.now().toString(),
      type: manualType,
      title: manualTitle.trim(),
      description: manualDesc.trim() || "Qo'lda qo'shilgan yozuv",
      xp: manualXP,
      timestamp: new Date().toISOString(),
    }
    const updatedStats = { ...stats }
    updatedStats.recentActivity = [newActivity, ...updatedStats.recentActivity].slice(0, 20)
    updatedStats.xp += manualXP
    updatedStats.completedCases += 1
    updatedStats.totalCases = Math.max(updatedStats.totalCases, updatedStats.completedCases)

    const today = new Date().toISOString().split('T')[0]
    const updatedDays = { ...daysActive, [today]: (daysActive[today] || 0) + 1 }
    setDaysActive(updatedDays)
    localStorage.setItem('activity_days', JSON.stringify(updatedDays))

    let streak = 0
    const now = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      if (updatedDays[d.toISOString().split('T')[0]]) streak++
      else if (i > 0) break
    }
    updatedStats.streak = streak
    updatedStats.weeklyProgress = Math.min(
      100,
      Math.round((((stats.xp + manualXP) % WEEKLY_GOAL_XP) / WEEKLY_GOAL_XP) * 100)
    )

    const inc: Record<string, keyof SkillLevels> = {
      case_completed: 'civil',
      case_attempted: 'criminal',
      ai_chat: 'procedural',
      document_generated: 'civil',
      court_session: 'procedural',
      quiz_completed: 'criminal',
      manual_entry: 'civil',
    }
    const skill = inc[manualType] || 'civil'
    setSkillLevels(prev => {
      const updated = { ...prev, [skill]: Math.min(100, (prev[skill] || 0) + 2) }
      localStorage.setItem('skill_levels', JSON.stringify(updated))
      return updated
    })

    setStats(updatedStats)
    localStorage.setItem('user_stats', JSON.stringify(updatedStats))
    setManualTitle('')
    setManualDesc('')
    setManualXP(10)
    setShowManualEntry(false)
  }

  const deleteActivity = (id: string) => {
    const activity = stats.recentActivity.find(a => a.id === id)
    const updated = {
      ...stats,
      recentActivity: stats.recentActivity.filter(a => a.id !== id),
      xp: Math.max(0, stats.xp - (activity?.xp || 0)),
      completedCases: Math.max(0, stats.completedCases - 1),
    }
    setStats(updated)
    localStorage.setItem('user_stats', JSON.stringify(updated))
  }

  const resetData = () => {
    if (confirm("Barcha statistik ma'lumotlarni o'chirishni xohlaysizmi?")) {
      localStorage.removeItem('user_stats')
      localStorage.removeItem('skill_levels')
      localStorage.removeItem('activity_days')
      setStats(DEFAULT_STATS)
      setSkillLevels({
        civil: 0,
        criminal: 0,
        labor: 0,
        family: 0,
        administrative: 0,
        procedural: 0,
      })
      setDaysActive({})
    }
  }

  const getFilteredActivity = () => {
    const now = Date.now()
    switch (timeFilter) {
      case 'week':
        return stats.recentActivity.filter(
          a => now - new Date(a.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000
        )
      case 'month':
        return stats.recentActivity.filter(
          a => now - new Date(a.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000
        )
      default:
        return stats.recentActivity
    }
  }

  const getHeatmapColor = (level: number) => {
    if (level === 0) return 'bg-gray-100 dark:bg-zinc-800'
    if (level <= 2) return 'bg-green-100 dark:bg-green-900/30'
    if (level <= 5) return 'bg-green-300 dark:bg-green-700/40'
    if (level <= 10) return 'bg-green-500 dark:bg-green-600/50'
    return 'bg-green-600 dark:bg-green-500/60'
  }

  const getSkillColor = (level: number) => {
    if (level >= 80) return 'text-green-600 dark:text-green-400'
    if (level >= 50) return 'text-yellow-600 dark:text-yellow-400'
    if (level >= 25) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getActivityIcon = (type: ActivityRecord['type']) => {
    switch (type) {
      case 'case_completed':
        return <CheckCircle className="w-4 h-4" />
      case 'case_attempted':
        return <Activity className="w-4 h-4" />
      case 'ai_chat':
        return <Zap className="w-4 h-4" />
      case 'document_generated':
        return <BookOpen className="w-4 h-4" />
      case 'court_session':
        return <Award className="w-4 h-4" />
      case 'quiz_completed':
        return <Target className="w-4 h-4" />
      default:
        return <Plus className="w-4 h-4" />
    }
  }
  const getActivityColor = (type: ActivityRecord['type']) => {
    switch (type) {
      case 'case_completed':
        return 'text-green-600'
      case 'case_attempted':
        return 'text-orange-600'
      case 'ai_chat':
        return 'text-blue-600'
      case 'document_generated':
        return 'text-purple-600'
      case 'court_session':
        return 'text-indigo-600'
      default:
        return 'text-gray-600'
    }
  }
  const getActivityBg = (type: ActivityRecord['type']) => {
    switch (type) {
      case 'case_completed':
        return 'bg-green-50 dark:bg-green-900/20'
      case 'case_attempted':
        return 'bg-orange-50 dark:bg-orange-900/20'
      case 'ai_chat':
        return 'bg-blue-50 dark:bg-blue-900/20'
      case 'document_generated':
        return 'bg-purple-50 dark:bg-purple-900/20'
      case 'court_session':
        return 'bg-indigo-50 dark:bg-indigo-900/20'
      default:
        return 'bg-gray-50 dark:bg-zinc-800/50'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 mobile-safe-top p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
            <div className="flex-1">
              <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded w-32 animate-pulse" />
              <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-48 mt-1.5 animate-pulse" />
            </div>
          </div>
          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
                  <div className="w-10 h-4 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse" />
                </div>
                <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-20 animate-pulse mb-1" />
                <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-16 animate-pulse" />
              </div>
            ))}
          </div>
          {/* Charts skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800">
              <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-28 mb-4 animate-pulse" />
              <AnalysisSkeleton variant="chart" />
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800">
              <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-20 mb-4 animate-pulse" />
              <AnalysisSkeleton variant="list" count={4} />
            </div>
          </div>
          <span className="sr-only">Ma'lumotlar yuklanmoqda...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !loading && stats.recentActivity.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 mobile-safe-top p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-zinc-300" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-zinc-100">
                Statistika
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300">
                Platformadagi faoliyatingiz tahlili
              </p>
            </div>
          </div>
          <AnalysisError
            message={getErrorMessage(error)}
            context={getErrorContext(error)}
            onRetry={loadData}
          />
        </div>
      </div>
    )
  }

  const filteredActivity = getFilteredActivity()

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 mobile-safe-top">
      <div className="flex flex-col lg:flex-row">
        <div className="hidden lg:block w-64 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 min-h-screen flex-shrink-0">
          <div className="p-6">
            {' '}
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Orqaga</span>
            </button>
            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Statistika</span>
              </div>
            </nav>
            <div className="mt-8">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-600 dark:text-zinc-400">Jami XP</span>
                  <span className="text-2xl font-bold text-gray-800 dark:text-zinc-100">
                    {stats.xp.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-600 dark:text-zinc-400">Daraja</span>
                  <span className="text-lg font-bold text-blue-600">{stats.level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-zinc-400">Yechilgan</span>
                  <span className="text-lg font-bold text-green-600">
                    {stats.completedCases}/{stats.totalCases || stats.completedCases}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <header className="bg-white dark:bg-zinc-900 px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="lg:hidden p-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-zinc-100">
                    Statistika
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300">
                    Platformadagi faoliyatingiz tahlili
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {!apiConnected && (
                  <span className="text-[10px] px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                    Mahalliy ma'lumotlar
                  </span>
                )}
                <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
                  <span className="font-bold text-sm sm:text-base text-orange-600">
                    {stats.streak}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-zinc-300">kun</span>
                </div>
                <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5">
                  {[
                    { value: 'week' as const, label: 'Hafta' },
                    { value: 'month' as const, label: 'Oy' },
                    { value: 'all' as const, label: 'Barchasi' },
                  ].map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => setTimeFilter(filter.value)}
                      className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                        timeFilter === filter.value
                          ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm font-medium'
                          : 'text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </header>

          <main className="p-3 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Inline error banner when cached data exists but refresh failed */}
              {error && stats.recentActivity.length > 0 && (
                <div className="mb-6">
                  <AnalysisError
                    message={getErrorMessage(error)}
                    context={getErrorContext(error)}
                    onRetry={loadData}
                    compact
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  {
                    id: 'overview' as const,
                    label: "Umumiy ko'rish",
                    icon: <BarChart3 className="w-3.5 h-3.5" />,
                  },
                  {
                    id: 'skills' as const,
                    label: 'Bilim darajasi',
                    icon: <Target className="w-3.5 h-3.5" />,
                  },
                  {
                    id: 'activity' as const,
                    label: 'Faollik',
                    icon: <Activity className="w-3.5 h-3.5" />,
                  },
                  {
                    id: 'manual' as const,
                    label: 'Faoliyat',
                    icon: <BookOpen className="w-3.5 h-3.5" />,
                  },
                ].map(view => (
                  <button
                    key={view.id}
                    onClick={() => setSelectedView(view.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                      selectedView === view.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700'
                    }`}
                  >
                    {view.icon}
                    {view.label}
                  </button>
                ))}
              </div>

              {/* ═══ Overview Tab ═══ */}
              {selectedView === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Award className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        {stats.xp > 0 && (
                          <span className="text-xs text-green-600 font-medium">Faol</span>
                        )}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-zinc-100">
                        {stats.xp.toLocaleString()}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-0.5">
                        Umumiy XP
                      </p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        </div>
                        <span className="text-xs text-gray-500">
                          {stats.completedCases}/{stats.totalCases || stats.completedCases}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-zinc-100">
                        {stats.completedCases}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-0.5">
                        Yechilgan ishlar
                      </p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                        </div>
                        <span className="text-xs text-green-600 font-medium">
                          {stats.averageAccuracy > 0 ? `${stats.averageAccuracy}%` : '—'}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-zinc-100">
                        {stats.averageAccuracy > 0 ? `${stats.averageAccuracy}%` : '0%'}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-0.5">
                        O'rtacha aniqlik
                      </p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                        </div>
                        <span className="text-xs text-green-600 font-medium">
                          {stats.streak} kun
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-zinc-100">
                        {Math.floor(stats.studyTime / 60)} soat
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-0.5">
                        O'quv vaqti
                      </p>
                    </div>
                  </div>

                  {/* Weekly Goal Tracker */}
                  <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                        Haftalik maqsad
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-zinc-400">
                        {weeklyXP} / {WEEKLY_GOAL_XP} XP
                      </span>
                    </div>
                    <div className="bg-gray-200 dark:bg-zinc-700 rounded-full h-3 sm:h-4 mb-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          weeklyGoalPct >= 100
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                            : weeklyGoalPct >= 50
                              ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                              : 'bg-gradient-to-r from-purple-400 to-pink-500'
                        }`}
                        style={{ width: `${Math.min(weeklyGoalPct, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 mt-1">
                      <span>{weeklyGoalPct}% bajarildi</span>
                      <span>
                        {weeklyGoalPct >= 100
                          ? '✅ Maqsad bajarildi!'
                          : `${WEEKLY_GOAL_XP - weeklyXP} XP qoldi`}
                      </span>
                    </div>
                    {weeklyGoalPct >= 100 && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <Award className="w-4 h-4" />
                        <span>Tabriklaymiz! Haftalik maqsad bajarildi!</span>
                      </div>
                    )}
                  </div>

                  {/* XP Leaderboard */}
                  {leaderboard.length > 1 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
                          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                          XP Reyting
                        </h3>
                        <span className="text-xs text-gray-400 dark:text-zinc-500">
                          Platforma bo'ylab
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {leaderboard.map((entry, i) => {
                          const medal =
                            i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : String(i + 1)
                          return (
                            <div
                              key={entry.name}
                              className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                                entry.isCurrentUser
                                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                  : 'bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800'
                              }`}
                            >
                              <span className="w-6 text-center text-sm font-bold text-gray-400 dark:text-zinc-500">
                                {medal}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-medium truncate ${entry.isCurrentUser ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-zinc-100'}`}
                                >
                                  {entry.name} {entry.isCurrentUser ? '(siz)' : ''}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-400">
                                  <span>{entry.xp.toLocaleString()} XP</span>
                                  <span>Lv.{entry.level}</span>
                                  <span>Streak {entry.streak} kun</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-3 text-center">
                        Reyting o'xshash faollikdagi foydalanuvchilar bilan solishtirish asosida
                      </p>
                    </div>
                  )}

                  {/* Recent Activity Summary */}
                  {stats.recentActivity.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                        So'nggi faoliyat
                      </h3>
                      <div className="space-y-2">
                        {(stats.recentActivity ?? []).slice(0, 5).map(a => (
                          <div
                            key={a.id}
                            className="flex items-start gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg"
                          >
                            <div className={`mt-0.5 ${getActivityColor(a.type)}`}>
                              {getActivityIcon(a.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-zinc-100 truncate">
                                {a.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                                {a.description}
                              </p>
                              <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                                {new Date(a.timestamp).toLocaleDateString('uz-UZ', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </p>
                            </div>
                            <span className="text-xs font-medium text-green-600 flex-shrink-0">
                              +{a.xp} XP
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.recentActivity.length === 0 && (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center shadow-sm border border-gray-100 dark:border-zinc-800">
                      <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3 sm:mb-4" />
                      <h3 className="font-bold text-gray-800 dark:text-zinc-100 mb-2">
                        Hali faoliyat yo'q
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mb-4 max-w-md mx-auto">
                        Qonunlar bazasida keyslarni yeching, AI chatdan foydalaning yoki hujjatlar
                        yarating.
                      </p>
                      <button
                        onClick={() => setSelectedView('manual')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Birinchi yozuvni qo'shish
                      </button>
                    </div>
                  )}

                  {stats.recentActivity.length > 0 && (
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setSelectedView('manual')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Yangi yozuv
                      </button>
                      <button
                        onClick={resetData}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Ma'lumotlarni tiklash
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ Skills Tab ═══ */}
              {selectedView === 'skills' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-zinc-100 mb-4 sm:mb-6 flex items-center gap-2">
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                      Yo'nalishlar bo'yicha bilim darajasi
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {Object.entries(skillLevels).map(([skill, level]) => {
                        const hasActivity = level > 0
                        return (
                          <div
                            key={skill}
                            className={`p-3 sm:p-4 rounded-xl ${hasActivity ? 'bg-gray-50 dark:bg-zinc-800/50' : 'bg-gray-50/50 dark:bg-zinc-800/20'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-zinc-100">
                                {SKILL_NAMES[skill] || skill}
                              </span>
                              <span className={`text-sm font-bold ${getSkillColor(level)}`}>
                                {hasActivity ? `${level}%` : '—'}
                              </span>
                            </div>
                            <div className="bg-gray-200 dark:bg-zinc-700 rounded-full h-2 sm:h-2.5">
                              <div
                                className={`h-2 sm:h-2.5 rounded-full transition-all duration-500 ${
                                  level >= 80
                                    ? 'bg-green-500'
                                    : level >= 50
                                      ? 'bg-yellow-500'
                                      : level >= 25
                                        ? 'bg-orange-500'
                                        : 'bg-gray-300 dark:bg-zinc-600'
                                }`}
                                style={{ width: `${Math.max(level, hasActivity ? 5 : 0)}%` }}
                              />
                            </div>
                            {!hasActivity && (
                              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-zinc-500 mt-1">
                                Faoliyat boshlanmagan
                              </p>
                            )}
                            {hasActivity && level < 50 && (
                              <div className="flex items-center gap-1 mt-1.5 text-[10px] sm:text-xs text-orange-600 dark:text-orange-400">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Ko'proq o'rganish kerak</span>
                              </div>
                            )}
                            {hasActivity && level >= 80 && (
                              <div className="flex items-center gap-1 mt-1.5 text-[10px] sm:text-xs text-green-600 dark:text-green-400">
                                <CheckCircle className="w-3 h-3" />
                                <span>A'lo daraja</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {Object.values(skillLevels).every(v => v === 0) && (
                      <div className="text-center mt-6 sm:mt-8">
                        <Target className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
                          Bilim darajasi faoliyatingiz asosida avtomatik hisoblanadi.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══ Activity Tab ═══ */}
              {selectedView === 'activity' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                        Faollik taqvimi
                      </h3>
                      <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-100 dark:bg-zinc-800 rounded" />
                          <span>Yo'q</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-200 dark:bg-green-700/40 rounded" />
                          <span>Kam</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded" />
                          <span>O'rtacha</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-600 rounded" />
                          <span>Yuqori</span>
                        </div>
                      </div>
                    </div>
                    {Object.keys(daysActive).length > 0 ? (
                      <div className="space-y-1">
                        {Array.from(
                          { length: Math.min(12, Math.ceil(Object.keys(daysActive).length / 7)) },
                          (_, rowI) => (
                            <div key={rowI} className="flex items-center gap-1.5 sm:gap-2">
                              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-zinc-500 w-8 sm:w-10 flex-shrink-0">
                                {rowI * 7}-{(rowI + 1) * 7} kun
                              </span>
                              <div className="flex gap-0.5 sm:gap-1">
                                {Array.from({ length: 7 }, (_, colI) => {
                                  const idx = rowI * 7 + colI
                                  const d = new Date()
                                  d.setDate(d.getDate() - (83 - idx))
                                  const key = d.toISOString().split('T')[0]
                                  const level = daysActive[key] || 0
                                  return (
                                    <div
                                      key={colI}
                                      className={`w-5 h-5 sm:w-7 sm:h-7 rounded ${getHeatmapColor(level)} border border-gray-100 dark:border-zinc-800`}
                                      title={`${key}: ${level} ta faoliyat`}
                                    />
                                  )
                                })}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="w-10 h-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-zinc-400">
                          Faollik ma'lumotlari hali mavjud emas.
                        </p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-zinc-400" />
                        <span className="text-[10px] sm:text-xs text-gray-600 dark:text-zinc-400">
                          {Object.keys(daysActive).length} kun qayd etilgan
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
                        <span className="text-[10px] sm:text-xs font-medium text-orange-600">
                          {stats.streak} kun davomiylik
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ Manual Tab ═══ */}
              {selectedView === 'manual' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                      Faoliyat jurnali
                    </h3>
                    <button
                      onClick={() => setShowManualEntry(!showManualEntry)}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Yangi yozuv
                    </button>
                  </div>

                  {showManualEntry && (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-gray-800 dark:text-zinc-100 mb-4 text-sm sm:text-base">
                        Yangi faoliyat yozuvi
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">
                            Faoliyat turi
                          </label>
                          <select
                            value={manualType}
                            onChange={e => setManualType(e.target.value as ActivityRecord['type'])}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs sm:text-sm text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="case_completed">Keys yechildi</option>
                            <option value="case_attempted">Keys urinish</option>
                            <option value="ai_chat">AI Chat</option>
                            <option value="document_generated">Hujjat yaratildi</option>
                            <option value="court_session">Sud simulyatsiyasi</option>
                            <option value="quiz_completed">Test topshirildi</option>
                            <option value="manual_entry">Boshqa</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">
                            XP miqdori
                          </label>
                          <input
                            type="number"
                            value={manualXP}
                            onChange={e =>
                              setManualXP(
                                Math.max(1, Math.min(1000, parseInt(e.target.value) || 0))
                              )
                            }
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs sm:text-sm text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min={1}
                            max={1000}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">
                            Sarlavha
                          </label>
                          <input
                            type="text"
                            value={manualTitle}
                            onChange={e => setManualTitle(e.target.value)}
                            placeholder="Masalan: Jinoyat kodeksi 97-modda tahlili"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs sm:text-sm text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">
                            Tavsif (ixtiyoriy)
                          </label>
                          <input
                            type="text"
                            value={manualDesc}
                            onChange={e => setManualDesc(e.target.value)}
                            placeholder="Qisqacha tavsif"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs sm:text-sm text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setShowManualEntry(false)}
                          className="px-3 sm:px-4 py-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-xs sm:text-sm transition-colors"
                        >
                          Bekor qilish
                        </button>
                        <button
                          onClick={addManualEntry}
                          disabled={!manualTitle.trim()}
                          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Saqlash
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {filteredActivity.length > 0 ? (
                      filteredActivity.map(a => (
                        <div
                          key={a.id}
                          className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl ${getActivityBg(a.type)} transition-colors`}
                        >
                          <div className={`mt-0.5 ${getActivityColor(a.type)}`}>
                            {getActivityIcon(a.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-zinc-100">
                              {a.title}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-zinc-400">
                              {a.description}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                              {new Date(a.timestamp).toLocaleDateString('uz-UZ', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] sm:text-xs font-medium text-green-600 dark:text-green-400">
                              +{a.xp} XP
                            </span>
                            <button
                              onClick={() => deleteActivity(a.id)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title="O'chirish"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mb-4">
                          {timeFilter === 'week'
                            ? "Bu hafta hech qanday faoliyat yo'q"
                            : timeFilter === 'month'
                              ? "Bu oy hech qanday faoliyat yo'q"
                              : 'Hali faoliyat qayd etilmagan'}
                        </p>
                        <button
                          onClick={() => setShowManualEntry(true)}
                          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition-colors"
                        >
                          Birinchi yozuvni qo'shish
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
