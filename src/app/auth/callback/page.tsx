'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-browser'
import { finalizeUserSession } from '@/services/supabase-auth'
import { isAdminRole } from '@/lib/roles'
import { syncSessionCookies, clearSessionCookies } from '@/lib/session-cookies'
import { getErrorMessage } from '@/lib/errors'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing...')
  const handled = useRef(false)

  useEffect(() => {
    // React StrictMode ikki marta ishga tushirmasligi uchun
    if (handled.current) return
    handled.current = true

    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const error = params.get('error')
      const errorDescription = params.get('error_description')

      // Supabase/Google xatosi kelgan bo'lsa
      if (error) {
        console.error('[AuthCallback] OAuth error:', error, errorDescription)
        router.replace(
          '/signin?error=' + encodeURIComponent(errorDescription || 'OAuth login failed')
        )
        return
      }

      /**
       * MUHIM: supabase-js `detectSessionInUrl: true` bilan URL'dagi PKCE
       * `?code=` ni O'ZI avtomatik exchange qiladi va URL'dan o'chiradi.
       * Shuning uchun bu yerda `code` parametri bo'lmasa ham session
       * allaqachon mavjud bo'lishi mumkin. Bunday holatda HAM rolni
       * DB'dan aniqlab, role asosida redirect qilamiz — adminni hech
       * qachon /dashboard ga yubormaymiz.
       */
      const completeSession = async (sbUser: {
        id: string
        email?: string | null
        phone?: string | null
        user_metadata?: Record<string, unknown>
        app_metadata?: { provider?: string; providers?: string[]; [key: string]: unknown }
      }) => {
        setStatus('Rol aniqlanmoqda...')
        try {
          // Rol Supabase registered_users dan aniqlanadi (user_metadata emas).
          // admin/super_admin → /admin, qolgani → /dashboard
          const savedUser = await finalizeUserSession(sbUser)
          document.cookie = `juristiv_auth=1; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
          syncSessionCookies().catch(() => {})

          // OAuth duplicate mavjud email/parol akkaunt bilan birlashtirildi —
          // eski session user o'chirilgan, qayta kirish kerak (endi identity
          // bog'langan: Google yoki email/parol bilan kirsangiz yagona profil)
          if (savedUser.accountMerged) {
            await supabase.auth.signOut().catch(() => {})
            clearSessionCookies()
            router.replace('/signin?linked=1')
            return
          }

          router.replace(isAdminRole(savedUser.role) ? '/admin' : '/dashboard')
        } catch (err) {
          console.error('[AuthCallback] finalizeUserSession error:', err)
          // Rol aniqlanmagan bo'lsa ham cookie'ni o'rnatamiz — dashboardga kiradi
          document.cookie = `juristiv_auth=1; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`
          syncSessionCookies().catch(() => {})
          router.replace('/dashboard')
        }
      }

      // 1) Avval session borligini tekshiramiz — supabase-js code'ni o'zi
      //    exchange qilib bo'lgan bo'lishi mumkin (URL tozalangan).
      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession()

      if (existingSession?.user) {
        console.log('[AuthCallback] Session already exists for:', existingSession.user.email)
        await completeSession(existingSession.user)
        return
      }

      // 2) Code yo'q va session ham yo'q — login sahifasiga
      if (!code) {
        router.replace('/signin')
        return
      }

      // 3) Code bor — PKCE exchange qilamiz
      setStatus("Ro'yxatdan o'tkazilmoqda...")

      try {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error('[AuthCallback] Exchange error:', exchangeError)
          // Code allaqachon iste'mol qilingan bo'lishi mumkin — sessionni
          // qayta tekshiramiz (supabase-js o'zi exchange qilgan holat).
          const {
            data: { session: retrySession },
          } = await supabase.auth.getSession()
          if (retrySession?.user) {
            await completeSession(retrySession.user)
            return
          }
          router.replace('/signin?error=' + encodeURIComponent(exchangeError.message))
          return
        }

        // Session yaratilganini tekshiramiz
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          console.log('[AuthCallback] Session created successfully for:', session.user.email)
          await completeSession(session.user)
        } else {
          console.error('[AuthCallback] No session after exchange')
          router.replace('/signin?error=' + encodeURIComponent('Session creation failed'))
        }
      } catch (err) {
        console.error('[AuthCallback] Exception:', err)
        // Exception holatida ham session bo'lishi mumkin — tekshiramiz
        const {
          data: { session: catchSession },
        } = await supabase.auth.getSession()
        if (catchSession?.user) {
          await completeSession(catchSession.user)
        } else {
          router.replace(
            '/signin?error=' + encodeURIComponent(getErrorMessage(err) || 'Unknown error')
          )
        }
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
