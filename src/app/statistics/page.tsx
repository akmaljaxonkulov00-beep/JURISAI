'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'
import { getAuthHeaders } from '@/lib/api-auth-client'
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  Target,
  Award,
  BarChart3,
  Zap,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Flame,
  Star,
  ChevronRight,
} from 'lucide-react'

// ── Types ──
interface PracticeStat {
  key: string
  label: string
  icon: string
  count: number
  xp: number
}

interface ActivityItem {
  id: string
  action: string
  title: string
  icon: string
  xp: number
  timestamp: string
}

interface IRACResult {
  id: string
  title: string
  status: string
  score: number
  timestamp: string
}

interface Achievement {
  id: string
  title: string
  type: string
  rarity: string
  unlockedAt: string
}

interface StatsData {
  xp: number
  level: number
  xpInCurrentLevel: number
  xpToNextLevel: number
  progressPercent: number
  weeklyXP: number
  weeklyGoalXp: number
  weeklyProgress: number
  rank: string
  levelXp: number
  activeDays: number
  streak: number
  totalActions: number
  totalIracCases: number
  completedIracCases: number
  xpByAction: Record<string, number>
  countByAction: Record<string, number>
  practiceStats: PracticeStat[]
  recentActivity: ActivityItem[]
  recentIRAC: IRACResult[]
  achievements: Achievement[]
  dailyActivity: Record<string, number>
  userName: string
  memberSince: string
  subscriptionPlan: string
}

// ── XP SOURCE DEFINITIONS (real logic) ──
const XP_SOURCES = [
  {
    action: 'ai-chat',
    label: 'AI huquqiy maslahat',
    xp: 5,
    description: "Har bir AI chat so'rovi",
  },
  { action: 'irac', label: 'IRAC tahlili', xp: 15, description: 'IRAC tahlili yaratish' },
  { action: 'case-solver', label: 'Kazus yechish', xp: 20, description: "Kazusni to'liq yechish" },
  {
    action: 'document-generate',
    label: 'Hujjat generatsiya',
    xp: 10,
    description: 'Hujjat yaratish',
  },
  { action: 'virtual-court', label: 'Virtual sud', xp: 25, description: 'Sud simulyatsiyasi' },
  { action: 'decision-tree', label: 'Qarorlar daraxti', xp: 15, description: 'Daraxt yaratish' },
  { action: 'scenario', label: 'Senariy', xp: 10, description: 'Senariy yaratish' },
  { action: 'law-search', label: 'Qonunlar bazasi', xp: 3, description: 'Qidiruv amalga oshirish' },
  {
    action: 'speech-stt',
    label: 'Ovozli kiritish',
    xp: 5,
    description: 'Ovozni matnga aylantirish',
  },
]

// ── XP QOIDALARI INFO ──
const XP_RULES = [
  { label: 'Har bir AI chat', xp: 5, condition: "So'rov muvaffaqiyatli javob olganda" },
  { label: 'IRAC tahlili', xp: 15, condition: "Tahlil to'liq yaratilganda" },
  { label: 'Kazus yechish', xp: 20, condition: 'Kazus yakunlanganda' },
  { label: 'Virtual sud', xp: 25, condition: 'Sud simulyatsiyasi tugaganda' },
  { label: 'Qarorlar daraxti', xp: 15, condition: 'Daraxt yaratilganda' },
  { label: 'Hujjat generatsiya', xp: 10, condition: 'Hujjat yaratilganda' },
  { label: 'Senariy', xp: 10, condition: 'Senariy yaratilganda' },
  { label: 'Qonunlar bazasi', xp: 3, condition: 'Qidiruv amalga oshirilganda' },
]

export default function Statistics() {
  const router = useRouter()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('month')
  const [activeView, setActiveView] = useState<'overview' | 'xp' | 'activity'>('overview')
  const [showXpInfo, setShowXpInfo] = useState(false)

  // Cache stats for each time filter to avoid refetching
  const statsCacheRef = useRef<Record<string, StatsData>>({})

  const loadStats = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = timeFilter
      if (!forceRefresh && statsCacheRef.current[cacheKey]) {
        setStats(statsCacheRef.current[cacheKey])
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const days = timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 9999
        const authHeaders = await getAuthHeaders()
        const res = await fetch(`/api/user/stats?days=${days}`, {
          headers: authHeaders,
          cache: 'no-cache',
        })
        if (!res.ok) throw new Error('Failed to load stats')
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setStats(data)
        statsCacheRef.current[cacheKey] = data
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Xatolik')
      } finally {
        setLoading(false)
      }
    },
    [timeFilter]
  )

  useEffect(() => {
    loadStats()
  }, [loadStats])

  // Realtime refresh
  useEffect(() => {
    const refresh = () => loadStats()
    window.addEventListener('stats-updated', refresh)
    return () => window.removeEventListener('stats-updated', refresh)
  }, [loadStats])

  const formatDate = (ts: string) => {
    if (!ts) return ''
    return new Date(ts).toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatShortDate = (ts: string) => {
    if (!ts) return ''
    return new Date(ts).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
            <div className="flex-1">
              <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-40 animate-pulse" />
              <div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded w-60 mt-2 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800 animate-pulse"
              >
                <div className="w-12 h-12 bg-gray-200 dark:bg-zinc-700 rounded-lg mb-4" />
                <div className="h-7 bg-gray-200 dark:bg-zinc-700 rounded w-20 mb-2" />
                <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-24" />
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 animate-pulse">
            <div className="h-5 bg-gray-200 dark:bg-zinc-700 rounded w-32 mb-4" />
            <div className="h-40 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            Xatolik yuz berdi
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">{error}</p>
          <button
            onClick={() => loadStats(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" /> Qayta urinish
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-zinc-800"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-zinc-300" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-zinc-100">
                Statistika
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
                Faoliyatingiz va natijalaringiz
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Time filter */}
            <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5">
              {[
                { value: 'week' as const, label: 'Hafta' },
                { value: 'month' as const, label: 'Oy' },
                { value: 'all' as const, label: 'Barchasi' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setTimeFilter(f.value)}
                  className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors ${timeFilter === f.value ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm font-medium' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            {
              id: 'overview' as const,
              label: 'Umumiy',
              icon: <BarChart3 className="w-3.5 h-3.5" />,
            },
            { id: 'xp' as const, label: 'Ballar tizimi', icon: <Zap className="w-3.5 h-3.5" /> },
            {
              id: 'activity' as const,
              label: 'Faoliyat tarixi',
              icon: <Clock className="w-3.5 h-3.5" />,
            },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${activeView === v.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700'}`}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        {/* ═══ OVERVIEW ═══ */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Level & Progress */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
                      {stats.level}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{stats.rank}</h2>
                      <p className="text-blue-100 text-sm">Daraja {stats.level}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-blue-100 mb-1">
                      <span>
                        {stats.xpInCurrentLevel} / {stats.levelXp} XP
                      </span>
                      <span>Keyingi darajaga {stats.xpToNextLevel} XP</span>
                    </div>
                    <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${stats.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{stats.xp.toLocaleString()}</div>
                  <div className="text-blue-100 text-sm">Umumiy XP</div>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  {stats.weeklyXP > 0 && (
                    <span className="text-[10px] text-green-600 font-medium">Faol</span>
                  )}
                </div>
                <div className="text-2xl font-bold text-gray-800 dark:text-zinc-100">
                  {stats.weeklyXP}
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Haftalik XP</p>
                <div className="mt-2 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${stats.weeklyProgress}%` }}
                  />
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800 dark:text-zinc-100">
                  {stats.completedIracCases}
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Yakunlangan ishlar</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800 dark:text-zinc-100">
                  {stats.streak}
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Ketma-ket kun</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-800 dark:text-zinc-100">
                  {stats.activeDays}
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Faol kunlar</p>
              </div>
            </div>

            {/* Practice stats */}
            {stats.practiceStats.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
                  Amaliyot statistikasi
                </h3>
                <div className="space-y-3">
                  {stats.practiceStats.map(p => (
                    <div
                      key={p.key}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                    >
                      <span className="text-xl">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800 dark:text-white">
                            {p.label}
                          </span>
                          <span className="text-xs text-blue-600 font-medium">+{p.xp} XP</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                          {p.count} marta ishlatilgan
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {stats.practiceStats.length === 0 && stats.totalActions === 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-gray-100 dark:border-zinc-800 text-center">
                <BookOpen className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-600 dark:text-zinc-300 mb-1">
                  Hali faoliyat yo'q
                </h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500">
                  Amaliyot boshlanganda statistika shu yerda ko'rinadi
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══ XP SYSTEM ═══ */}
        {activeView === 'xp' && (
          <div className="space-y-6">
            {/* XP Progress */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
                Daraja tizimi
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                  {stats.level}
                </div>
                <div className="flex-1">
                  <div className="text-lg font-bold text-gray-800 dark:text-white">
                    {stats.rank}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400">
                    {stats.xp} / {stats.level * stats.levelXp} XP umumiy
                  </div>
                  <div className="mt-2 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      style={{ width: `${stats.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* How XP works */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                  XP qanday olinadi
                </h3>
                <button
                  onClick={() => setShowXpInfo(!showXpInfo)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {showXpInfo ? 'Yashirish' : 'Batafsil'}
                </button>
              </div>
              <div className="space-y-2">
                {XP_RULES.map((rule, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 dark:text-white">
                        {rule.label}
                      </div>
                      {showXpInfo && (
                        <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                          {rule.condition}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-bold text-blue-600 ml-3">+{rule.xp}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* What user actually earned */}
            {Object.keys(stats.xpByAction).length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
                  Siz qayerdan XP oldingiz
                </h3>
                <div className="space-y-2">
                  {Object.entries(stats.xpByAction)
                    .sort((a, b) => b[1] - a[1])
                    .map(([action, xp]) => (
                      <div
                        key={action}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                      >
                        <span className="text-sm text-gray-800 dark:text-white">
                          {XP_SOURCES.find(s => s.action === action)?.label || action}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-zinc-400">
                            {stats.countByAction[action] || 0} marta
                          </span>
                          <span className="text-sm font-bold text-blue-600">+{xp}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {stats.achievements.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
                  Yutuqlar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stats.achievements.map(a => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                    >
                      <Award className="w-5 h-5 text-yellow-500" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
                          {a.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-zinc-400">
                          {formatShortDate(a.unlockedAt)}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${a.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-700' : a.rarity === 'epic' ? 'bg-purple-100 text-purple-700' : a.rarity === 'rare' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {a.rarity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ ACTIVITY ═══ */}
        {activeView === 'activity' && (
          <div className="space-y-6">
            {/* Recent activity */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
                Oxirgi faoliyat
              </h3>
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 dark:text-zinc-500">Faoliyat yo'q</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recentActivity.map(a => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <span className="text-lg">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
                          {a.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-zinc-400">
                          {formatDate(a.timestamp)}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-blue-600 whitespace-nowrap">
                        +{a.xp} XP
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* IRAC results */}
            {stats.recentIRAC.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
                  IRAC natijalari
                </h3>
                <div className="space-y-2">
                  {stats.recentIRAC.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                    >
                      <span className="text-lg">⚖️</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
                          {c.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-zinc-400">
                          {formatShortDate(c.timestamp)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-bold ${c.status === 'COMPLETED' ? 'text-green-600' : 'text-gray-500'}`}
                        >
                          {c.score > 0 ? `${c.score}%` : c.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Heatmap */}
            {Object.keys(stats.dailyActivity).length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
                  Faollik xaritasi (oxirgi 30 kun)
                </h3>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const d = new Date()
                    d.setDate(d.getDate() - (29 - i))
                    const key = d.toISOString().split('T')[0]
                    const count = stats.dailyActivity[key] || 0
                    const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : 3
                    const colors = [
                      'bg-gray-100 dark:bg-zinc-800',
                      'bg-green-200 dark:bg-green-900/40',
                      'bg-green-400 dark:bg-green-700/50',
                      'bg-green-600 dark:bg-green-500/60',
                    ]
                    return (
                      <div
                        key={i}
                        className={`w-full aspect-square rounded-sm ${colors[level]}`}
                        title={`${key}: ${count} ta`}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
