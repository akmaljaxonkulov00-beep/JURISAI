'use client'

import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import WeaknessDetector from '@/components/features/WeaknessDetector'
import AppSidebar from '@/components/layout/AppSidebar'

export default function WeaknessDetectorPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 mobile-safe-top">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar — yagona navigatsiya */}
        <AppSidebar>
          <div className="space-y-1">
            <button
              onClick={() => router.push('/professional-tools')}
              className="flex items-center gap-2 px-3 py-2 w-full text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Asboblar</span>
            </button>
          </div>
        </AppSidebar>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <WeaknessDetector />
        </div>
      </div>
    </div>
  )
}
