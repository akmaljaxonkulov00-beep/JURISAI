'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: ThemeMode
  resolvedTheme: 'light' | 'dark'
  dark: boolean
  setTheme: (theme: ThemeMode) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  dark: false,
  setTheme: () => {},
  toggle: () => {},
})

const COOKIE_KEY = 'juristiv-theme'
const STORAGE_KEY = 'juristiv-theme'

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    return stored
  }
  return 'system'
}

function resolveSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Apply theme class to document
  const applyTheme = useCallback((mode: ThemeMode) => {
    const resolved = mode === 'system' ? resolveSystemTheme() : mode
    setResolvedTheme(resolved)

    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (resolved === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      document.cookie = `${COOKIE_KEY}=${mode}; path=/; max-age=31536000; SameSite=Lax`
    }
  }, [])

  // Initial mount & sync from server if authenticated
  useEffect(() => {
    setMounted(true)
    const initial = getInitialTheme()
    setThemeState(initial)
    applyTheme(initial)

    // Sync from server preference if logged in
    async function syncServerTheme() {
      try {
        const res = await fetch('/api/user/preferences', { cache: 'no-cache' })
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data?.theme) {
            const serverTheme = json.data.theme as ThemeMode
            if (['light', 'dark', 'system'].includes(serverTheme)) {
              setThemeState(serverTheme)
              localStorage.setItem(STORAGE_KEY, serverTheme)
              applyTheme(serverTheme)
            }
          }
        }
      } catch {
        // Silently continue with local/cookie theme
      }
    }
    syncServerTheme()

    // Listen to system OS preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const currentStored = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system'
      if (currentStored === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [applyTheme])

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newTheme)
      }
      applyTheme(newTheme)

      // Persist to database asynchronously
      fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      }).catch(() => {})
    },
    [applyTheme]
  )

  const toggle = useCallback(() => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }, [resolvedTheme, setTheme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        dark: resolvedTheme === 'dark',
        setTheme,
        toggle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
