'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing...')

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const error = params.get('error')
      const errorDescription = params.get('error_description')

      // If Supabase already redirected here with an error from Google
      if (error) {
        console.error('[AuthCallback] OAuth error:', error, errorDescription)
        router.replace(
          '/signin?error=' + encodeURIComponent(errorDescription || 'OAuth login failed')
        )
        return
      }

      if (!code) {
        // No code — maybe already have session
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) {
          router.replace('/dashboard')
          return
        }
        router.replace('/signin')
        return
      }

      setStatus("Ro'yxatdan o'tkazilmoqda...")

      try {
        // Exchange the authorization code for a session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error('[AuthCallback] Exchange error:', exchangeError)
          router.replace('/signin?error=' + encodeURIComponent(exchangeError.message))
          return
        }

        // Verify the session was created
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          console.log('[AuthCallback] Session created successfully for:', session.user.email)

          // Save user to localStorage for the AuthProvider
          const userData = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            role: session.user.user_metadata?.role || 'USER',
          }
          sessionStorage.setItem('jurisai_user', JSON.stringify(userData))
          sessionStorage.setItem('auth_user', JSON.stringify(userData))
          document.cookie = `jurisai_auth=1; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`

          // Redirect to dashboard
          router.replace('/dashboard')
        } else {
          console.error('[AuthCallback] No session after exchange')
          router.replace('/signin?error=' + encodeURIComponent('Session creation failed'))
        }
      } catch (err: any) {
        console.error('[AuthCallback] Exception:', err)
        router.replace('/signin?error=' + encodeURIComponent(err?.message || 'Unknown error'))
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/70 text-sm">{status}</p>
      </div>
    </div>
  )
}
