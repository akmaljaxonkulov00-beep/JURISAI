'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoLawyerRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.push('/signin')
  }, [router])

  return null
}
