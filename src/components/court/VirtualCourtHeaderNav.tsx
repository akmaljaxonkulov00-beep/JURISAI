'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Gavel,
  Users,
  Award,
  Clock,
  Sparkles,
  ArrowLeft,
  Home,
} from 'lucide-react'
import { useAuth } from '@/app/providers'
import { getRoleDashboardPath } from '@/lib/roles'

interface VirtualCourtHeaderNavProps {
  activeTab?: 'new' | 'multiplayer' | 'completed' | 'my-courts'
}

export default function VirtualCourtHeaderNav({ activeTab }: VirtualCourtHeaderNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const currentTabParam = searchParams.get('tab')

  // Determine active tab if not explicitly passed
  let currentActive = activeTab
  if (!currentActive) {
    if (pathname.includes('/virtual-court/multiplayer')) {
      currentActive = 'multiplayer'
    } else if (pathname.includes('/virtual-court/completed')) {
      currentActive = 'completed'
    } else if (currentTabParam === 'my-courts') {
      currentActive = 'my-courts'
    } else {
      currentActive = 'new'
    }
  }

  const roleDashboard = getRoleDashboardPath(user?.role)

  const tabs = [
    {
      id: 'new',
      label: 'Yangi sud jarayoni',
      href: '/virtual-court',
      icon: Gavel,
      badge: 'AI Sudya',
    },
    {
      id: 'multiplayer',
      label: 'Multiplayer Sud',
      href: '/virtual-court/multiplayer',
      icon: Users,
      badge: 'Jonli',
    },
    {
      id: 'completed',
      label: 'Yakunlangan ishlar',
      href: '/virtual-court/completed',
      icon: Award,
      badge: null,
    },
    {
      id: 'my-courts',
      label: 'Mening sudlarim',
      href: '/virtual-court?tab=my-courts',
      icon: Clock,
      badge: null,
    },
  ]

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200/80 dark:border-zinc-800 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar with back and title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={roleDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-xs font-semibold transition-colors"
              title="Bosh sahifaga qaytish"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Orqaga</span>
            </Link>

            <Link
              href={roleDashboard}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white text-xs font-medium transition-colors"
              title="Dashboard"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>

            <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700 hidden sm:block" />

            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <Gavel className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                Virtual Sud Majlisi
              </h1>
              <p className="text-xs text-gray-500 dark:text-zinc-400 hidden sm:block">
                O‘zbekiston protsessual qonunchiligi asosidagi interaktiv simulyatsiya va ko‘p foydalanuvchili sud zali
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              FPK / JPK 2026
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar pt-1 pb-3 -mb-px">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = currentActive === tab.id
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400 dark:text-zinc-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
