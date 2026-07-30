'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase-browser'

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
    console.log('[OAuthHandler] Supabase localStorage keys:', sbKeys)

    // ── Debug: check for Supabase auth token ──
    const sbAuthToken = localStorage.getItem('sb-blayqzykzlmrjuvhzvsk-auth-token')
    console.log('[OAuthHandler] sb-auth-token exists:', !!sbAuthToken)

    // Check for PKCE authorization code in query string
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    console.log('[OAuthHandler] URL:', window.location.href)
    console.log('[OAuthHandler] code param:', code)

    if (!code) {
      // No OAuth code — nothing to handle
      return
    }

    console.log('[OAuthHandler] Found auth code in URL, exchanging for session...')

    // ── Debug: check for PKCE code verifier in localStorage ──
    // Supabase stores the verifier under: sb-<project_ref>-pkce-code-verifier-<...>
    const pkceKeys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes('pkce')) {
        pkceKeys.push(key)
      }
    }
    console.log('[OAuthHandler] PKCE verifier keys:', pkceKeys)

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
              window.location.href = '/dashboard'
            } else {
              console.error('[OAuthHandler] No session found after exchange failure')
              window.location.href = '/signin?error=' + encodeURIComponent(error.message)
            }
          })
        } else {
          console.log('[OAuthHandler] Session created successfully!')
          // Verify session was stored
          supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('[OAuthHandler] Post-exchange session exists:', !!session?.user)
          })
          // Clean URL before navigating
          window.history.replaceState({}, '', window.location.pathname)
          window.location.href = '/dashboard'
        }
      })
      .catch(err => {
        console.error('[OAuthHandler] Exchange exception:', err)
        // Fallback: try getSession()
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            console.log('[OAuthHandler] Session found via getSession fallback!')
            window.location.href = '/dashboard'
          } else {
            console.error('[OAuthHandler] No session found after exchange exception')
            window.location.href = '/signin?error=' + encodeURIComponent(err?.message || 'unknown')
          }
        })
      })
  }, [])

  // This component renders nothing — it's purely a side-effect handler
  return null
}
