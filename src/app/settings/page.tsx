'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { useLanguage } from '@/context/LanguageContext'
import SettingsSidebar, { SettingsTabId } from '@/components/settings/SettingsSidebar'
import ProfileOverviewTab from '@/components/settings/ProfileOverviewTab'
import PersonalInfoTab from '@/components/settings/PersonalInfoTab'
import PaymentsTab from '@/components/settings/PaymentsTab'
import NotificationPreferencesTab from '@/components/settings/NotificationPreferencesTab'
import AppearanceTab from '@/components/settings/AppearanceTab'
import SecurityTab from '@/components/settings/SecurityTab'
import DataManagementTab from '@/components/settings/DataManagementTab'

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading } = useAuth()
  const { t } = useLanguage()

  const tabParam = (searchParams.get('tab') as SettingsTabId) || 'profil'
  const [activeTab, setActiveTab] = useState<SettingsTabId>(
    ['profil', 'personal', 'payments', 'notifications', 'appearance', 'security', 'data'].includes(
      tabParam
    )
      ? tabParam
      : 'profil'
  )

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      if (
        [
          'profil',
          'personal',
          'payments',
          'notifications',
          'appearance',
          'security',
          'data',
        ].includes(tabParam)
      ) {
        setActiveTab(tabParam)
      }
    }
  }, [tabParam])

  const handleSelectTab = (tab: SettingsTabId) => {
    setActiveTab(tab)
    router.replace(`/settings?tab=${tab}`, { scroll: false })
  }

  // Auth Guard
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t('loading', 'Yuklanmoqda...')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/70 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb / Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all border border-gray-200/60 dark:border-zinc-800"
              title={t('settingsBack', 'Orqaga')}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {t('settingsTitle', 'Sozlamalar Markazi')}
              </h1>
              <p className="text-xs text-gray-400 dark:text-zinc-500 hidden sm:block">
                JURISTIV LegalTech Platform • User Preferences & Security
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <SettingsSidebar activeTab={activeTab} onSelectTab={handleSelectTab} />

          {/* Content Pane */}
          <div className="flex-1 min-w-0">
            {activeTab === 'profil' && (
              <ProfileOverviewTab onGoToPersonal={() => handleSelectTab('personal')} />
            )}
            {activeTab === 'personal' && <PersonalInfoTab />}
            {activeTab === 'payments' && <PaymentsTab />}
            {activeTab === 'notifications' && <NotificationPreferencesTab />}
            {activeTab === 'appearance' && <AppearanceTab />}
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'data' && <DataManagementTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin text-center" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  )
}
