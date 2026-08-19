'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { isAdminRole } from '@/lib/roles'
import { syncSessionCookies, clearSessionCookies } from '@/lib/session-cookies'

/**
 * Universal OAuth callback handler.
 *
 * Mounted in the root layout, this component runs on EVERY page.
 * It checks the URL for OAuth authorization codes and exchanges them
 * for Supabase sessions, BEFORE any page-level code can redirect.
 *
 * Handles:
 *   - PKCE flow: ?code=xxx (query parameter)
 *     Calls supabase.auth.exchangeCodeForSession(code) which
 *     looks up the stored PKCE code verifier from localStorage.
 *
 * Why this approach instead of a dedicated /auth/callback page:
 *   The dedicated page was not reliably serving as a Next.js route.
 *   By handling OAuth on EVERY page, we catch the callback regardless
 *   of what URL Supabase redirects to.
 */
export default function OAuthHandler() {
  const handled = useRef(false)

  useEffect(() => {
    // Prevent double-execution (React StrictMode in dev)
    if (handled.current) return
    handled.current = true

    // SKIP on /auth/callback — that dedicated page handles its own exchange.
    // If OAuthHandler ALSO processes the code, it will try exchangeCodeForSession
    // AFTER the callback page already did it, causing a 'bad_oauth_state' error
    // because the authorization code can only be used ONCE.
    if (typeof window !== 'undefined' && window.location.pathname === '/auth/callback') {
      console.log('[OAuthHandler] On /auth/callback — page handles its own exchange, skipping')
      return
    }

    // ── Debug: log all localStorage keys for Supabase auth ──
    const sbKeys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        (key.startsWith('sb-') ||
          key.includes('supabase') ||
          key.includes('pkce') ||
          key.includes('oauth'))
      ) {
        sbKeys.push(key)
      }
    }
    // Check for PKCE authorization code in query string
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (!code) {
      // No OAuth code — nothing to handle
      return
    }

    // Exchange the PKCE authorization code for a session.
    // This relies on the PKCE code verifier that was stored in
    // localStorage by signInWithOAuth() on the sign-in page.
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          console.error('[OAuthHandler] Exchange error:', error.message, error)
          // Fallback: try getSession() in case the session was already created
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
              console.log('[OAuthHandler] Session found via getSession fallback!')
              redirectAfterOAuth(session.user)
            } else {
              console.error('[OAuthHandler] No session found after exchange failure')
              window.location.href = '/signin?error=' + encodeURIComponent(error.message)
            }
          })
        } else {
          console.log('[OAuthHandler] Session created successfully!')
          // Verify session was stored, then resolve role and redirect
          supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('[OAuthHandler] Post-exchange session exists:', !!session?.user)
            if (session?.user) {
              // Clean URL before navigating
              window.history.replaceState({}, '', window.location.pathname)
              redirectAfterOAuth(session.user)
            } else {
              window.location.href = '/signin'
            }
          })
        }
      })
      .catch(err => {
        console.error('[OAuthHandler] Exchange exception:', err)
        // Fallback: try getSession()
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            console.log('[OAuthHandler] Session found via getSession fallback!')
            // Rol DB'dan aniqlanib, role asosida redirect — admin /dashboard ga tushmaydi
            redirectAfterOAuth(session.user)
          } else {
            console.error('[OAuthHandler] No session found after exchange exception')
            window.location.href = '/signin?error=' + encodeURIComponent(err?.message || 'unknown')
          }
        })
      })
  }, [])

  /**
   * OAuth sessiyasi yaratilgandan so'ng foydalanuvchi rolini aniqlab
   * yo'naltiradi: Admin → /admin, oddiy foydalanuvchi → /dashboard.
   * Rol Supabase registered_users dan olinadi (user_metadata emas).
   */
  function redirectAfterOAuth(sbUser: {
    id: string
    email?: string | null
    phone?: string | null
    user_metadata?: Record<string, unknown>
    app_metadata?: { provider?: string; providers?: string[]; [key: string]: unknown }
  }) {
    import('@/services/supabase-auth')
      .then(async ({ finalizeUserSession }) => {
        try {
          // Rol DB'dan aniqlanmaguncha redirect qilinmaydi —
          // admin Google orqali kirsa ham /admin ga boradi.
          const savedUser = await finalizeUserSession(sbUser)
          // Cookie'ni ham o'rnatamiz — middleware /admin himoyasi uchun
          document.cookie = `jurisai_auth=1; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
          syncSessionCookies().catch(() => {})

          // OAuth duplicate mavjud email/parol akkaunt bilan birlashtirildi —
          // qayta kirish kerak (endi identity bog'langan)
          if (savedUser.accountMerged) {
            supabase.auth.signOut().then(() => {
              clearSessionCookies()
              window.location.href = '/signin?linked=1'
            })
            return
          }

          window.location.href = isAdminRole(savedUser.role) ? '/admin' : '/dashboard'
        } catch {
          // Rol aniqlanmagan bo'lsa ham session bor — dashboardga kira oladi
          window.location.href = '/dashboard'
        }
      })
      .catch(() => {
        window.location.href = '/dashboard'
      })
  }

  // This component renders nothing — it's purely a side-effect handler
  return null
}
