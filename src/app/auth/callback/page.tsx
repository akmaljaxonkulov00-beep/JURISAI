'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase-browser'

export default function AuthCallbackPage() {
  useEffect(() => {
    // PKCE flow: Supabase redirects to /auth/callback?code=xxx
    // The code is always in the query string for PKCE flow.
    // Hash fragments (#access_token=xxx / implicit flow) are handled
    // automatically by the Supabase client (detectSessionInUrl: true).
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (!code) {
      window.location.href = '/signin?error=Tasdiqlash%20kodi%20topilmadi'
      return
    }

    // Exchange the PKCE authorization code for a session.
    // This stores the session in localStorage via our custom storage adapter.
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          console.error('OAuth exchange error:', error)
          window.location.href = '/signin?error=' + encodeURIComponent(error.message)
        } else {
          // ✅ Session is now in localStorage — do a full page navigation to /dashboard
          // Full navigation ensures a clean JS context so the Supabase client
          // reads the stored session from localStorage correctly
          window.location.href = '/dashboard'
        }
      })
      .catch(err => {
        console.error('OAuth exchange exception:', err)
        window.location.href = '/signin?error=' + encodeURIComponent(err?.message || 'unknown')
      })
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Tizimga kirish...</p>
      </div>
    </div>
  )
}
