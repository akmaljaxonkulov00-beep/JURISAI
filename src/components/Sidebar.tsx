'use client'

import React from 'react'
import Link from 'next/link'
import {
  Home as HomeIcon,
  Scale,
  GitBranch,
  Building2,
  Clapperboard,
  BookOpen,
  Wrench,
  Users,
  BarChart3,
  Settings,
  Crown,
  HelpCircle,
  Shield,
  LogOut,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/app/providers'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  currentPage?: string
}

export default function Sidebar({ currentPage = 'home' }: SidebarProps) {
  const { t } = useLanguage()
  const { user, isAdmin, logout } = useAuth()
  const pathname = usePathname()

  const navSections = [
    {
      title: t('groupPractice', 'Amaliyot'),
      items: [
        {
          id: 'case-solver',
          label: t('navCaseSolver', 'Kazus Yechish (IRAC)'),
          icon: Scale,
          href: '/case-solver',
        },
        {
          id: 'decision-tree',
          label: t('navDecisionTree', 'Qarorlar Daraxti'),
          icon: GitBranch,
          href: '/decision-tree',
        },
        {
          id: 'virtual-court',
          label: t('navVirtualCourt', 'Virtual Sud'),
          icon: Building2,
          href: '/virtual-court',
        },
        {
          id: 'scenario-generator',
          label: t('navScenarioGen', 'Senariy Generator'),
          icon: Clapperboard,
          href: '/scenario-generator',
        },
      ],
    },
    {
      title: t('groupResources', 'Resurslar'),
      items: [
        {
          id: 'legal-database',
          label: t('navLegalDatabase', 'Qonunlar bazasi'),
          icon: BookOpen,
          href: '/legal-database',
        },
        {
          id: 'professional-tools',
          label: t('navTools', 'Asboblar / Pro vositalar'),
          icon: Wrench,
          href: '/professional-tools',
        },
        { id: 'community', label: t('navCommunity', 'Jamiyat'), icon: Users, href: '/community' },
        {
          id: 'statistics',
          label: t('navStatistics', 'Statistika'),
          icon: BarChart3,
          href: '/statistics',
        },
      ],
    },
    {
      title: t('groupPersonal', 'Shaxsiy'),
      items: [
        {
          id: 'settings',
          label: t('navSettings', 'Sozlamalar'),
          icon: Settings,
          href: '/settings',
        },
        { id: 'premium', label: t('navPremium', 'Premium'), icon: Crown, href: '/premium' },
        { id: 'help', label: t('navHelp', 'Yordam'), icon: HelpCircle, href: '/help' },
        ...(isAdmin
          ? [
              {
                id: 'admin',
                label: t('navAdminPanel', 'Admin Panel'),
                icon: Shield,
                href: '/admin',
              },
            ]
          : []),
      ],
    },
  ]

  const isItemActive = (href: string) => {
    if (href === '/dashboard' || href === '/') return pathname === '/' || pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 min-h-screen flex-shrink-0 p-4 justify-between">
      <div className="space-y-6">
        {/* Navigation Groups */}
        {navSections.map(sec => (
          <div key={sec.title} className="space-y-1">
            <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">
              {sec.title}
            </h4>
            <div className="space-y-0.5">
              {sec.items.map(item => {
                const Icon = item.icon
                const active = isItemActive(item.href)
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-zinc-500'}`}
                    />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-2">
        <Link
          href="/premium"
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
        >
          <Crown className="w-4 h-4" />
          <span>{t('upgradeToPro', 'Premiumga o‘tish')}</span>
        </Link>

        <button
          onClick={async () => {
            await logout()
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('navLogout', 'Chiqish')}</span>
        </button>
      </div>
    </aside>
  )
}
