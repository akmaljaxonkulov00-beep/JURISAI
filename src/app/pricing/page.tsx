'use client'

import { useState, useEffect } from 'react'
import { PricingSection } from '@/components/landing'
import { useAuth } from '@/app/providers'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
  const { isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const showDashboardBack = mounted && isAuthenticated
  const backHref = showDashboardBack ? '/dashboard' : '/'
  const backLabel = showDashboardBack ? 'Dashboardga qaytish' : 'Bosh sahifaga qaytish'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-800/50 mobile-safe-top">
      {/* Navigation */}
      <div className="bg-white dark:bg-zinc-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href={backHref}
              className="flex items-center text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2 shrink-0" />
              {backLabel}
            </Link>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">Tariflar</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <PricingSection />
    </div>
  )
}
