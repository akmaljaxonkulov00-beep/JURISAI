'use client'

import React, { useState } from 'react'
import SiteLogo from '@/components/SiteLogo'
import { Search, Bell, Globe, User, LogOut, Settings, Crown, ChevronDown } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/app/providers'
import { Language } from '@/lib/i18n'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  title?: string
  subtitle?: string
  showSearch?: boolean
  showNotifications?: boolean
}

export default function Header({
  title = 'Juristiv',
  subtitle = 'LegalTech Platform',
  showSearch = true,
  showNotifications = true,
}: HeaderProps) {
  const { language, setLanguage, t, availableLanguages } = useLanguage()
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()

  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const displayName =
    user?.name || user?.email?.split('@')[0] || t('profileRoleUser', 'Foydalanuvchi')
  const isPro = user?.subscription_plan === 'pro'

  const langFlags: Record<Language, string> = {
    uz: '🇺🇿',
    en: '🇬🇧',
    ru: '🇷🇺',
  }

  return (
    <header className="bg-white dark:bg-zinc-900 px-4 sm:px-6 lg:px-8 py-3.5 border-b border-gray-100 dark:border-zinc-800 relative z-30">
      <div className="flex items-center justify-between gap-4">
        {/* Logo + Title */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <SiteLogo size="md" />
          <div className="hidden sm:block">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {title}
            </h1>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{subtitle}</p>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 w-4 h-4" />
              <input
                type="text"
                placeholder={t('searchPlaceholder', 'Qidirish...')}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-zinc-800/80 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {/* Notifications */}
          {showNotifications && (
            <Link
              href="/settings?tab=notifications"
              className="p-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors relative"
              title={t('settingsTabNotifications', 'Bildirishnomalar')}
            >
              <Bell className="w-5 h-5" />
            </Link>
          )}

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setLangMenuOpen(!langMenuOpen)
                setUserMenuOpen(false)
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-800/80 hover:bg-gray-100 dark:hover:bg-zinc-700/80 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 transition-colors"
            >
              <span>{langFlags[language] || '🌐'}</span>
              <span className="uppercase">{language}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {langMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-36 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 py-1.5 z-50 animate-fade-in"
                onClick={() => setLangMenuOpen(false)}
              >
                {(['uz', 'en', 'ru'] as Language[]).map(l => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left transition-colors ${
                      language === l
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span>{langFlags[l]}</span>
                    <span>{availableLanguages[l]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Menu */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen)
                  setLangMenuOpen(false)
                }}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-gray-50 dark:bg-zinc-800/80 hover:bg-gray-100 dark:hover:bg-zinc-700/80 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 transition-colors"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={displayName}
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline-block text-xs font-semibold text-gray-800 dark:text-zinc-200 max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400 hidden sm:inline" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 py-2 z-50 animate-fade-in"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800 mb-1">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {displayName}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 truncate">
                      {user?.email}
                    </p>
                  </div>

                  <Link
                    href="/settings?tab=profil"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{t('settingsTabProfile', 'Profil')}</span>
                  </Link>

                  <Link
                    href="/settings"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span>{t('navSettings', 'Sozlamalar')}</span>
                  </Link>

                  <Link
                    href="/premium"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                  >
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span>{t('navPremium', 'Premium')}</span>
                  </Link>

                  <div className="border-t border-gray-100 dark:border-zinc-800 my-1" />

                  <button
                    onClick={async () => {
                      await logout()
                      router.push('/signin')
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>{t('navLogout', 'Chiqish')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/signin"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-xs"
            >
              {t('signIn', 'Kirish')}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
