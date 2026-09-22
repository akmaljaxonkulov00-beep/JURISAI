'use client'

import React from 'react'
import { User, Edit3, CreditCard, Bell, Monitor, Shield, Database } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

export type SettingsTabId =
  'profil' | 'personal' | 'payments' | 'notifications' | 'appearance' | 'security' | 'data'

interface SettingsSidebarProps {
  activeTab: SettingsTabId
  onSelectTab: (tab: SettingsTabId) => void
}

export default function SettingsSidebar({ activeTab, onSelectTab }: SettingsSidebarProps) {
  const { t } = useLanguage()

  const tabs: Array<{ id: SettingsTabId; label: string; icon: React.ElementType }> = [
    { id: 'profil', label: t('settingsTabProfile', 'Profil'), icon: User },
    { id: 'personal', label: t('settingsTabPersonal', "Shaxsiy ma'lumotlar"), icon: Edit3 },
    { id: 'payments', label: t('settingsTabPayments', "To'lovlar"), icon: CreditCard },
    { id: 'notifications', label: t('settingsTabNotifications', 'Bildirishnomalar'), icon: Bell },
    { id: 'appearance', label: t('settingsTabAppearance', "Ko'rinish"), icon: Monitor },
    { id: 'security', label: t('settingsTabSecurity', 'Xavfsizlik'), icon: Shield },
    { id: 'data', label: t('settingsTabData', "Ma'lumotlar"), icon: Database },
  ]

  return (
    <div className="w-full lg:w-64 flex-shrink-0">
      {/* Mobile Horizontal Scrollable Pills */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none no-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 border-gray-200/80 dark:border-zinc-700/80 hover:bg-gray-50 dark:hover:bg-zinc-700/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Desktop Vertical Menu */}
      <div className="hidden lg:block bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-2.5 shadow-sm space-y-1">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
          {t('settingsTitle', 'Sozlamalar')}
        </div>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold shadow-xs border border-blue-200/60 dark:border-blue-800/40'
                  : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100/70 dark:hover:bg-zinc-800/60 hover:text-gray-900 dark:hover:text-zinc-200'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-transform ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 scale-110'
                    : 'text-gray-400 dark:text-zinc-500'
                }`}
              />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
