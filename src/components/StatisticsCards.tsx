'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Award, Flame, Trophy, Scale, Sparkles } from 'lucide-react'
import { getAuthHeaders } from '@/lib/api-auth-client'

interface StatCard {
  title: string
  value: string | number
  subtitle: string
  progress: number
  color: string
  icon: React.ReactNode
  trend?: string
}

interface StatisticsCardsProps {
  customStats?: any
}

export default function StatisticsCards({ customStats }: StatisticsCardsProps) {
  const [statsData, setStatsData] = useState<any>(customStats || null)
  const [loading, setLoading] = useState(!customStats)

  useEffect(() => {
    if (customStats) {
      setStatsData(customStats)
      setLoading(false)
      return
    }

    let isMounted = true
    async function fetchStats() {
      try {
        const headers = await getAuthHeaders()
        const res = await fetch('/api/user/stats?limit=6', {
          headers,
          cache: 'no-cache',
        })
        if (res.ok) {
          const data = await res.json()
          if (isMounted) setStatsData(data)
        }
      } catch (err) {
        console.warn('StatisticsCards load error:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchStats()
    return () => {
      isMounted = false
    }
  }, [customStats])

  const level = statsData?.level || 1
  const xp = statsData?.xp || 0
  const streak = statsData?.streak || 0
  const progressPercent = statsData?.progressPercent || 0
  const solvedCases = statsData?.totalSolvedCases || statsData?.totalIracCases || 0
  const achievementsCount = statsData?.achievements?.length || 0
  const weeklyXP = statsData?.weeklyXP || 0

  const stats: StatCard[] = [
    {
      title: 'Daraja',
      value: `${level}`,
      subtitle: statsData?.rank || 'Beginner',
      progress: progressPercent,
      color: 'blue',
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      trend: `${progressPercent}% keyingi darajaga`,
    },
    {
      title: 'Umumiy XP',
      value: xp.toLocaleString(),
      subtitle: `Haftalik: +${weeklyXP} XP`,
      progress: Math.min(100, Math.round((weeklyXP / (statsData?.weeklyGoalXp || 500)) * 100)),
      color: 'green',
      icon: <Sparkles className="w-5 h-5 text-emerald-600" />,
      trend: 'Haqiqiy faoliyat',
    },
    {
      title: 'Yechilgan Keyslar',
      value: `${solvedCases}`,
      subtitle: 'IRAC & Sud majlislari',
      progress: Math.min(100, solvedCases * 10),
      color: 'orange',
      icon: <Scale className="w-5 h-5 text-amber-600" />,
      trend: `${statsData?.completedTrialsCount || 0} ta sud`,
    },
    {
      title: 'Faol kunlar zanjiri',
      value: `${streak}`,
      subtitle: 'Ketma-ket faol kunlar',
      progress: Math.min(100, streak * 15),
      color: 'purple',
      icon: <Flame className="w-5 h-5 text-rose-500" />,
      trend: streak > 0 ? 'Davom eting!' : 'Bugun boshlang',
    },
    {
      title: 'Yutuqlar',
      value: `${achievementsCount}`,
      subtitle: 'Ochilgan nishonlar',
      progress: Math.min(100, achievementsCount * 20),
      color: 'pink',
      icon: <Trophy className="w-5 h-5 text-purple-600" />,
      trend: achievementsCount > 0 ? 'Muvaffaqiyat' : '0 ta nishon',
    },
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-600 dark:text-blue-400',
          progress: 'bg-blue-600 dark:bg-blue-500',
          trend: 'text-blue-600 dark:text-blue-400',
        }
      case 'green':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-900/30',
          text: 'text-emerald-600 dark:text-emerald-400',
          progress: 'bg-emerald-600 dark:bg-emerald-500',
          trend: 'text-emerald-600 dark:text-emerald-400',
        }
      case 'orange':
        return {
          bg: 'bg-amber-100 dark:bg-amber-900/30',
          text: 'text-amber-600 dark:text-amber-400',
          progress: 'bg-amber-600 dark:bg-amber-500',
          trend: 'text-amber-600 dark:text-amber-400',
        }
      case 'purple':
        return {
          bg: 'bg-rose-100 dark:bg-rose-900/30',
          text: 'text-rose-600 dark:text-rose-400',
          progress: 'bg-rose-600 dark:bg-rose-500',
          trend: 'text-rose-600 dark:text-rose-400',
        }
      case 'pink':
      default:
        return {
          bg: 'bg-purple-100 dark:bg-purple-900/30',
          text: 'text-purple-600 dark:text-purple-400',
          progress: 'bg-purple-600 dark:bg-purple-500',
          trend: 'text-purple-600 dark:text-purple-400',
        }
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => {
        const colors = getColorClasses(stat.color)
        return (
          <div
            key={index}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${colors.bg}`}>{stat.icon}</div>
              {stat.trend && (
                <span className={`text-[11px] font-semibold ${colors.trend}`}>{stat.trend}</span>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : stat.value}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">{stat.subtitle}</p>
            </div>

            <div className="mt-4">
              <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.progress} transition-all duration-500 rounded-full`}
                  style={{ width: `${loading ? 10 : Math.max(5, stat.progress)}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
