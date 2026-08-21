'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if OAuth code is in the URL — OAuthHandler will process it
    // Don't redirect away while OAuth is in progress!
    if (typeof window !== 'undefined') {
      const hasOAuthCode = new URLSearchParams(window.location.search).has('code')
      if (hasOAuthCode) return // OAuthHandler will handle this
    }

    // ALWAYS redirect to signin page
    // Users MUST actively log in each time — no auto-login even with existing session
    router.replace('/signin')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 dark:text-zinc-500">Yuklanmoqda...</p>
      </div>
    </div>
  )
}
