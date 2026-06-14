'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function CoursesPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to my-courses
    router.replace('/my-courses')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Kurslar sahifasiga o'tilmoqda...</p>
      </div>
    </div>
  )
}
