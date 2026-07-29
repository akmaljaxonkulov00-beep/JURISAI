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
 *   - PKCE flow:  ?code=xxx  (query parameter)
 *   - Implicit:   #access_token=xxx  (hash fragment, handled by Supabase automatically)
 *
 * Why this approach:
 *   The old /auth/callback route handler and page were unreliable because:
 *   1. Server-side route handler couldn't read query params correctly
 *   2. The /auth/callback page wasn't recognized as a Next.js route
 *   3. Supabase might redirect to the Site URL instead of a custom path
 *
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
    // Supabase redirects with ?code=xxx for PKCE flow
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (!code) {
      // No OAuth code — nothing to handle
      return
    }

    console.log('[OAuthHandler] Found auth code in URL, exchanging for session...')

    // Exchange the PKCE authorization code for a session
    // This stores the session in localStorage via our custom storage adapter
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          console.error('[OAuthHandler] Exchange error:', error)
          window.location.href = '/signin?error=' + encodeURIComponent(error.message)
        } else {
          console.log('[OAuthHandler] Session created successfully!')
          // Navigate to dashboard FIRST (full page navigation cleans up everything)
          // Then clean the URL as a safety measure
          window.history.replaceState({}, '', window.location.pathname)
          window.location.href = '/dashboard'
        }
      })
      .catch(err => {
        console.error('[OAuthHandler] Exchange exception:', err)
        window.location.href = '/signin?error=' + encodeURIComponent(err?.message || 'unknown')
      })
  }, [])

  // This component renders nothing — it's purely a side-effect handler
  return null
}
