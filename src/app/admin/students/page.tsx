'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminStudentsPage() {
  const router = useRouter()

  useEffect(() => {
    // Umumiy talabalar alohida bo'lim talab qilinmaydi — asosiy boshqaruvga yo'naltiriladi
    router.replace('/admin')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
      <div className="text-center p-6 text-sm text-slate-500">
        Boshqaruv paneliga yo‘naltirilmoqda...
      </div>
    </div>
  )
}
