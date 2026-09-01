'use client'

import { TrendingUp, Users, Clock, Award, Trophy } from 'lucide-react'

interface StatCard {
  title: string
  value: string
  subtitle: string
  progress: number
  color: string
  icon: React.ReactNode
  trend?: string
}

export default function StatisticsCards() {
  const stats: StatCard[] = [
    {
      title: 'Daraja',
      value: '12',
      subtitle: 'Daraja',
      progress: 75,
      color: 'blue',
      icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
      trend: '+2',
    },
    {
      title: 'Umumiy XP',
      value: '2450',
      subtitle: 'XP ballari',
      progress: 87,
      color: 'green',
      icon: <Users className="w-5 h-5 text-green-600" />,
      trend: '+12%',
    },
    {
      title: 'Holati',
      value: 'Faol',
      subtitle: 'Hozirgi holat',
      progress: 60,
      color: 'orange',
      icon: <Clock className="w-5 h-5 text-orange-600" />,
      trend: '42 kun',
    },
    {
      title: "O'qish zanjiri",
      value: '42',
      subtitle: 'Ketma-ket kunlar',
      progress: 40,
      color: 'purple',
      icon: <Award className="w-5 h-5 text-purple-600" />,
      trend: 'Rekord',
    },
    {
      title: 'Yutuqlar',
      value: '156',
      subtitle: 'Sertifikatlar',
      progress: 92,
      color: 'pink',
      icon: <Trophy className="w-5 h-5 text-pink-600" />,
      trend: 'Top 5%',
    },
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-600 dark:text-blue-400',
          progress: 'bg-blue-600 dark:bg-blue-500',
          trend: 'text-green-600 dark:text-green-400',
        }
      case 'green':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-600 dark:text-green-400',
          progress: 'bg-green-600 dark:bg-green-500',
          trend: 'text-green-600 dark:text-green-400',
        }
      case 'orange':
        return {
          bg: 'bg-orange-100 dark:bg-orange-900/30',
          text: 'text-orange-600 dark:text-orange-400',
          progress: 'bg-orange-600 dark:bg-orange-500',
          trend: 'text-orange-600 dark:text-orange-400',
        }
      case 'purple':
        return {
          bg: 'bg-purple-100 dark:bg-purple-900/30',
          text: 'text-purple-600 dark:text-purple-400',
          progress: 'bg-purple-600 dark:bg-purple-500',
          trend: 'text-purple-600 dark:text-purple-400',
        }
      case 'pink':
        return {
          bg: 'bg-pink-100 dark:bg-pink-900/30',
          text: 'text-pink-600 dark:text-pink-400',
          progress: 'bg-pink-600 dark:bg-pink-500',
          trend: 'text-pink-600 dark:text-pink-400',
        }
      default:
        return {
          bg: 'bg-gray-100 dark:bg-zinc-800/30',
          text: 'text-gray-600 dark:text-zinc-400',
          progress: 'bg-gray-600',
          trend: 'text-gray-600 dark:text-zinc-400',
        }
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {stats.map((stat, index) => {
        const colors = getColorClasses(stat.color)

        return (
          <div
            key={index}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-zinc-800 min-w-0 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}
              >
                {stat.icon}
              </div>
              {stat.trend && (
                <span
                  className={`text-[10px] sm:text-xs font-medium ${colors.trend} whitespace-nowrap ml-1`}
                >
                  {stat.trend}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-zinc-200 mb-0.5 truncate">
                {stat.value}
              </h3>
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-zinc-400 truncate">
                {stat.subtitle}
              </p>
            </div>

            <div className="mt-2 sm:mt-3 bg-gray-200 dark:bg-zinc-700 rounded-full h-1 sm:h-1.5 overflow-hidden">
              <div
                className={`${colors.progress} h-full rounded-full transition-all duration-300`}
                style={{ width: `${stat.progress}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
