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

    // Check for PKCE authorization code in query string
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (!code) {
      // No OAuth code — nothing to handle
      return
    }

    console.log('[OAuthHandler] Found auth code in URL, exchanging for session...')

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
              window.location.href = '/signin?error=' + encodeURIComponent(error.message)
            }
          })
        } else {
          console.log('[OAuthHandler] Session created successfully!')
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
            window.location.href = '/signin?error=' + encodeURIComponent(err?.message || 'unknown')
          }
        })
      })
  }, [])

  // This component renders nothing — it's purely a side-effect handler
  return null
}
