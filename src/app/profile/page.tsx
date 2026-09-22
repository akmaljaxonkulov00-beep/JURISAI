'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function ProfileRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/settings?tab=profil')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Sozlamalar sahifasiga yo‘naltirilmoqda...
        </p>
      </div>
    </div>
  )
}
