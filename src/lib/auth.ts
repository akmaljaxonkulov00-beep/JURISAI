// Auth configuration with Supabase
import { supabaseClient } from './supabase'
import { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: 'user' | 'admin' | 'super_admin'
  subscription?: {
    plan: 'free' | 'pro' | 'premium'
    status: 'active' | 'inactive' | 'cancelled'
    expiresAt?: string
  }
  createdAt: string
}

export interface AuthState {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  error: string | null
}

class AuthService {
  private static instance: AuthService
  private authState: AuthState = {
    user: null,
    session: null,
    loading: false,
    error: null
  }
  private listeners: Array<(state: AuthState) => void> = []

  private constructor() {
    // Initialize auth state from Supabase
    this.initializeAuth()
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  private async initializeAuth() {
    if (!supabaseClient) {
      console.warn('Supabase not configured')
      return
    }

    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        this.authState.error = error.message
      } else if (session) {
        await this.handleAuthChange(session)
      }

      // Listen for auth changes
      supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await this.handleAuthChange(session)
        } else if (event === 'SIGNED_OUT') {
          this.authState.user = null
          this.authState.session = null
          this.notifyListeners()
        }
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      this.authState.error = 'Failed to initialize authentication'
    }
  }

  private async handleAuthChange(session: Session) {
    this.authState.session = session
    this.authState.loading = true
    this.notifyListeners()

    try {
      // Get user profile from database
      const { data: profile, error } = await supabaseClient!
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error)
        this.authState.error = error.message
      } else if (profile) {
        // Get subscription info
        const { data: subscription } = await supabaseClient!
          .from('subscriptions')
          .select(`
            *,
            subscription_plans(*)
          `)
          .eq('user_id', session.user.id)
          .eq('status', 'ACTIVE')
          .single()

        this.authState.user = {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name || undefined,
          lastName: profile.last_name || undefined,
          role: profile.role || 'user',
          subscription: subscription ? {
            plan: subscription.subscription_plans.slug as any,
            status: 'active',
            expiresAt: subscription.current_period_end
          } : undefined,
          createdAt: profile.created_at
        }
      } else {
        // Create user profile if it doesn't exist
        await this.createUserProfile(session.user)
      }
    } catch (error) {
      console.error('Error handling auth change:', error)
      this.authState.error = 'Failed to process authentication'
    } finally {
      this.authState.loading = false
      this.notifyListeners()
    }
  }

  private async createUserProfile(user: User) {
    if (!supabaseClient) return

    try {
      const { error } = await supabaseClient
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          role: 'user',
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error creating user profile:', error)
        this.authState.error = error.message
      } else {
        this.authState.user = {
          id: user.id,
          email: user.email || '',
          role: 'user',
          createdAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Error creating user profile:', error)
      this.authState.error = 'Failed to create user profile'
    }
  }

  async signIn(email: string, password: string) {
    if (!supabaseClient) {
      throw new Error('Supabase not configured')
    }

    this.authState.loading = true
    this.authState.error = null
    this.notifyListeners()

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        this.authState.error = error.message
        throw error
      }

      return data
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    } finally {
      this.authState.loading = false
      this.notifyListeners()
    }
  }

  async signUp(email: string, password: string, firstName?: string, lastName?: string) {
    if (!supabaseClient) {
      throw new Error('Supabase not configured')
    }

    this.authState.loading = true
    this.authState.error = null
    this.notifyListeners()

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      })

      if (error) {
        this.authState.error = error.message
        throw error
      }

      return data
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    } finally {
      this.authState.loading = false
      this.notifyListeners()
    }
  }

  async signOut() {
    if (!supabaseClient) {
      throw new Error('Supabase not configured')
    }

    try {
      const { error } = await supabaseClient.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        this.authState.error = error.message
      }
    } catch (error) {
      console.error('Sign out error:', error)
      this.authState.error = 'Failed to sign out'
    }
  }

  async resetPassword(email: string) {
    if (!supabaseClient) {
      throw new Error('Supabase not configured')
    }

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email)
      
      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener)
    listener(this.authState)
    
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.authState))
  }

  getState(): AuthState {
    return { ...this.authState }
  }

  getCurrentUser(): AuthUser | null {
    return this.authState.user
  }

  isAdmin(): boolean {
    return this.authState.user?.role === 'admin' || this.authState.user?.role === 'super_admin'
  }

  hasSubscription(plan?: 'pro' | 'premium'): boolean {
    const subscription = this.authState.user?.subscription
    if (!subscription || subscription.status !== 'active') {
      return false
    }
    
    if (plan) {
      return subscription.plan === plan || subscription.plan === 'premium'
    }
    
    return subscription.plan !== 'free'
  }

  canAccessFeature(feature: string): boolean {
    const user = this.authState.user
    if (!user) return false

    // Admin can access everything
    if (this.isAdmin()) return true

    const subscription = user.subscription
    
    // Free plan features
    const freeFeatures = ['legal-database', 'basic-search', 'profile']
    if (freeFeatures.includes(feature)) return true

    // Pro plan features
    const proFeatures = ['ai-assistant', 'advanced-search', 'document-generator', 'irac-analyzer']
    if (subscription?.plan === 'pro' && proFeatures.includes(feature)) return true

    // Premium plan features
    const premiumFeatures = ['real-time-chat', 'virtual-court', 'professional-tools', 'api-access']
    if (subscription?.plan === 'premium' && premiumFeatures.includes(feature)) return true

    return false
  }
}

export const authService = AuthService.getInstance()
export default authService
