'use client'

import React, { useState } from 'react'
import { Sun, Moon, Laptop, Globe, Clock, CheckCircle2, Sparkles } from 'lucide-react'
import { useTheme, ThemeMode } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import { Language } from '@/lib/i18n'

export default function AppearanceTab() {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null)
  const [timezone, setTimezone] = useState('Asia/Tashkent')

  const triggerFeedback = (msg: string) => {
    setSavedFeedback(msg)
    setTimeout(() => setSavedFeedback(null), 2500)
  }

  const handleThemeSelect = (mode: ThemeMode) => {
    setTheme(mode)
    triggerFeedback(t('savedSuccessfully', 'O‘zgarishlar muvaffaqiyatli saqlandi!'))
  }

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang)
    triggerFeedback(t('savedSuccessfully', 'O‘zgarishlar muvaffaqiyatli saqlandi!'))
  }

  const handleTimezoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tz = e.target.value
    setTimezone(tz)
    try {
      await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: tz }),
      })
      triggerFeedback(t('savedSuccessfully', 'O‘zgarishlar muvaffaqiyatli saqlandi!'))
    } catch {}
  }

  const themeOptions: Array<{
    id: ThemeMode
    title: string
    desc: string
    icon: React.ElementType
    color: string
  }> = [
    {
      id: 'light',
      title: t('themeLight', 'Yorug‘'),
      desc: t('themeLightDesc', 'Kunduzgi yorug‘ dizayn'),
      icon: Sun,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40',
    },
    {
      id: 'dark',
      title: t('themeDark', 'Qorong‘i'),
      desc: t('themeDarkDesc', 'Tungi qulay qorong‘i dizayn'),
      icon: Moon,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      id: 'system',
      title: t('themeSystem', 'Tizim'),
      desc: t('themeSystemDesc', 'Qurilmangiz tizim rejimiga moslashadi'),
      icon: Laptop,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40',
    },
  ]

  const languageOptions: Array<{
    id: Language
    name: string
    nativeName: string
    flag: string
  }> = [
    { id: 'uz', name: 'O‘zbekcha', nativeName: "O'zbek tili (Lotin)", flag: '🇺🇿' },
    { id: 'en', name: 'English', nativeName: 'English (US / UK)', flag: '🇬🇧' },
    { id: 'ru', name: 'Русский', nativeName: 'Русский язык', flag: '🇷🇺' },
  ]

  const timezones = [
    { value: 'Asia/Tashkent', label: 'Toshkent (UTC+05:00)' },
    { value: 'Asia/Dubai', label: 'Dubay (UTC+04:00)' },
    { value: 'Europe/Moscow', label: 'Moskva (UTC+03:00)' },
    { value: 'Europe/London', label: 'London (UTC+00:00)' },
    { value: 'America/New_York', label: 'Nyu-York (UTC-05:00)' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {t('appearanceTitle', "Ko'rinish va Til sozlamalari")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {t(
              'appearanceSubtitle',
              'Platformaning tashqi ko‘rinishi va tilini o‘zingizga moslang'
            )}
          </p>
        </div>
        {savedFeedback && (
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {savedFeedback}
          </span>
        )}
      </div>

      {/* 1. Theme Selection Cards */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1">
            {t('themeSectionTitle', 'Mavzu (Theme)')}
          </h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            {t('themeSectionDesc', 'Sizga qulay bo‘lgan ranglar rejimini tanlang')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themeOptions.map(opt => {
            const Icon = opt.icon
            const isSelected = theme === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleThemeSelect(opt.id)}
                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-600/20 shadow-xs'
                    : 'border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-gray-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${opt.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                      ✓
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                    {opt.title}
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{opt.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Language Selection Cards */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>{t('languageSectionTitle', 'Til (Language)')}</span>
          </h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            {t('languageSectionDesc', 'Butun platforma interfeysi tanlangan tilda ishlaydi')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {languageOptions.map(lang => {
            const isSelected = language === lang.id
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => handleLanguageSelect(lang.id)}
                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-600/20 shadow-xs'
                    : 'border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-gray-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{lang.flag}</span>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                      ✓
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                    {lang.name}
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{lang.nativeName}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Timezone Selector */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>{t('timezoneSectionTitle', 'Vaqt mintaqasi (Timezone)')}</span>
          </h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500">
            {t('timezoneSectionDesc', 'Hisobotlar va hodisalar uchun mahalliy vaqt')}
          </p>
        </div>

        <div className="max-w-md">
          <select
            value={timezone}
            onChange={handleTimezoneChange}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            {timezones.map(tz => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
