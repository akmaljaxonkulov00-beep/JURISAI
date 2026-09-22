'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react'
import {
  Language,
  TranslationKey,
  defaultLanguage,
  languages,
  t as translateHelper,
} from '@/lib/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey | string, fallback?: string) => string
  availableLanguages: typeof languages
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'juristiv-language'
const COOKIE_KEY = 'juristiv-language'

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return defaultLanguage

  // 1. Check localStorage
  const saved = localStorage.getItem(STORAGE_KEY) as Language | null
  if (saved && languages[saved]) return saved

  // 2. Check Cookie
  const cookieMatch = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${COOKIE_KEY}=`))
    ?.split('=')[1] as Language | undefined

  if (cookieMatch && languages[cookieMatch]) return cookieMatch

  // 3. Check browser navigator language
  const navLang = navigator.language?.split('-')[0] as Language
  if (navLang && languages[navLang]) return navLang

  return defaultLanguage
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  const applyLanguage = useCallback((lang: Language) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang)
      document.cookie = `${COOKIE_KEY}=${lang}; path=/; max-age=31536000; SameSite=Lax`
    }
  }, [])

  useEffect(() => {
    const initial = getInitialLanguage()
    setLanguageState(initial)
    applyLanguage(initial)

    // Sync from server preference if logged in
    async function syncServerLanguage() {
      try {
        const res = await fetch('/api/user/preferences', { cache: 'no-cache' })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data?.language) {
            const serverLang = json.data.language as Language
            if (languages[serverLang]) {
              setLanguageState(serverLang)
              localStorage.setItem(STORAGE_KEY, serverLang)
              applyLanguage(serverLang)
            }
          }
        }
      } catch {
        // Silently continue
      }
    }
    syncServerLanguage()
  }, [applyLanguage])

  const setLanguage = useCallback(
    (newLang: Language) => {
      if (languages[newLang]) {
        setLanguageState(newLang)
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, newLang)
        }
        applyLanguage(newLang)

        // Persist to DB asynchronously
        fetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: newLang }),
        }).catch(() => {})
      }
    },
    [applyLanguage]
  )

  const t = useCallback(
    (key: TranslationKey | string, fallback?: string): string => {
      return translateHelper(language, key, fallback)
    },
    [language]
  )

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    availableLanguages: languages,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
