'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

function OAuthCallbackContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams?.get('code')
    if (!code) {
      window.location.href = '/signin?error=Tasdiqlash%20kodi%20topilmadi'
      return
    }

    // Exchange the code in the browser where localStorage is available
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          console.error('OAuth exchange error:', error)
          window.location.href = '/signin?error=' + encodeURIComponent(error.message)
        } else {
          // ✅ Success — session is now in localStorage
          // Set the jurisai_auth cookie so middleware allows access to /dashboard
          // Full page navigation to dashboard — this ensures a clean
          // JavaScript context so the Supabase client reads the
          // session from localStorage correctly
          document.cookie = 'jurisai_auth=1; path=/; max-age=86400; SameSite=Lax'
          window.location.href = '/dashboard'
        }
      })
      .catch(err => {
        console.error('OAuth exchange exception:', err)
        window.location.href = '/signin?error=' + encodeURIComponent(err?.message || 'unknown')
      })
  }, [searchParams])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Tizimga kirish...</p>
      </div>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  )
}
