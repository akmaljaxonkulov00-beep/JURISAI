'use client'

import { ReactNode, createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ThemeProvider } from '@/context/ThemeContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { authService } from '@/services/supabase-auth'
import type { AuthUser } from '@/services/supabase-auth'
import { isAdminRole } from '@/lib/roles'

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: boolean
  hasActiveSubscription: boolean
  getSubscriptionPlan: string
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (userData: {
    name: string
    email: string
    password: string
  }) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>
  setUser: (user: AuthUser | null) => void
  refreshUser: () => Promise<AuthUser | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user
  const isAdmin = isAdminRole(user?.role)
  const hasActiveSubscription = user?.subscription_expires_at
    ? new Date(user.subscription_expires_at) > new Date()
    : false
  const getSubscriptionPlan = user?.subscription_plan || 'free'

  useEffect(() => {
    // 1) Tezkor dastlabki tiklash (sessionStorage / localStorage keshidan)
    try {
      const cached = authService.getCurrentUser()
      if (cached) {
        setUser(cached)
        setIsLoading(false)
        if (typeof document !== 'undefined') {
          document.cookie = `juristiv_auth=1; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
        }
      }
    } catch {}

    // 2) Supabase auth state o'zgarishlarini kuzatish
    const unsubscribe = authService.onAuthChange(authUser => {
      setUser(authUser)
      setIsLoading(false)
      if (typeof document !== 'undefined') {
        if (authUser) {
          document.cookie = `juristiv_auth=1; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
        } else {
          document.cookie = 'juristiv_auth=; path=/; max-age=0; SameSite=Lax'
        }
      }
    })

    // 3) Timeout xavfsizlik chorasi — ulanish sekin bo'lsa ham foydalanuvchini bloklab qo'ymaslik
    const fallbackTimeout = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => {
      unsubscribe()
      clearTimeout(fallbackTimeout)
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await authService.signIn(email, password)
      if (result.success && result.data) {
        setUser(result.data)
        return { success: true }
      }
      return { success: false, error: result.error || 'Login xatosi' }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) || 'Login xatosi' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: { name: string; email: string; password: string }) => {
    setIsLoading(true)
    try {
      const result = await authService.signUp(userData.email, userData.password, userData.name)
      if (result.success) {
        if (result.needsEmailConfirmation) {
          // Session yaratilmagan — fake-login qilmaymiz
          return { success: true, needsEmailConfirmation: true }
        }
        if (result.data) {
          setUser(result.data)
        }
        return { success: true }
      }
      return { success: false, error: result.error || "Ro'yxatdan o'tish xatosi" }
    } catch {
      return { success: false, error: "Ro'yxatdan o'tish xatosi" }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    await authService.signOut()
    setUser(null)
  }

  const updateProfile = async (updates: Partial<AuthUser>) => {
    setIsLoading(true)
    try {
      if (!user) {
        return { success: false, error: 'Foydalanuvchi tizimga kirmagan' }
      }

      const result = await authService.updateProfile(updates)
      if (result.success) {
        // Update local state
        const updatedUser = { ...user, ...updates }
        setUser(updatedUser)
      }
      return result
    } catch (error) {
      return { success: false, error: 'Profilni yangilash xatosi' }
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const { getAuthHeaders } = await import('@/lib/api-auth-client')
      const headers = await getAuthHeaders()
      if (!headers.Authorization) return null

      const res = await fetch('/api/auth/user-role', { headers, cache: 'no-cache' })
      if (!res.ok) return null
      const json = await res.json()
      if (json.success && json.data) {
        const d = json.data
        let updated: AuthUser | null = null
        setUser(prev => {
          if (!prev) return null
          const effectiveRole = d.role
            ? d.role.toUpperCase() === 'ADMIN'
              ? 'ADMIN'
              : 'USER'
            : prev.role
          updated = {
            ...prev,
            role: effectiveRole,
            subscription_plan: d.subscription_plan || prev.subscription_plan || 'free',
            subscription_expires_at:
              d.subscription_expires_at !== undefined
                ? d.subscription_expires_at
                : prev.subscription_expires_at,
            name: d.name || prev.name,
          }
          try {
            sessionStorage.setItem('juristiv_user', JSON.stringify(updated))
            sessionStorage.setItem('auth_user', JSON.stringify(updated))
          } catch {}
          return updated
        })
        return updated || (d as AuthUser)
      }
      return null
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    // Run soft background refresh
    refreshUser()

    const handleSyncEvent = () => {
      refreshUser()
    }

    window.addEventListener('juristiv_subscription_updated', handleSyncEvent)
    window.addEventListener('focus', handleSyncEvent)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleSyncEvent()
    }
    window.addEventListener('visibilitychange', handleVisibility)

    // Periodic soft background refresh every 20 seconds
    const timer = setInterval(handleSyncEvent, 20_000)

    return () => {
      window.removeEventListener('juristiv_subscription_updated', handleSyncEvent)
      window.removeEventListener('focus', handleSyncEvent)
      window.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(timer)
    }
  }, [isAuthenticated, refreshUser])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    hasActiveSubscription,
    getSubscriptionPlan,
    login,
    register,
    logout,
    updateProfile,
    setUser,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface ProvidersProps {
  children: ReactNode
}

import { ToastProvider } from '@/components/ui/Toast'
import { PaymentNotificationListener } from '@/components/payment/PaymentNotificationListener'
import { getErrorMessage } from '@/lib/errors'

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            {children}
            <PaymentNotificationListener />
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
