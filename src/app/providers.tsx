'use client'

import { ReactNode, createContext, useContext, useState, useEffect } from 'react'
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
    // Subscribe to Firebase auth state changes
    const unsubscribe = authService.onAuthChange(authUser => {
      setUser(authUser)
      setIsLoading(false)
    })

    return unsubscribe
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
