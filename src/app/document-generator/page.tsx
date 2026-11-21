'use client'

import React, { useState } from 'react'
import AppSidebar from '@/components/layout/AppSidebar'
import OfficialDocumentsCatalog from '@/components/documents/OfficialDocumentsCatalog'
import DocumentGenerator from '@/components/features/DocumentGenerator'
import { Sparkles, FileText, BookOpen } from 'lucide-react'

export default function DocumentGeneratorPage() {
  const [viewMode, setViewMode] = useState<'official' | 'custom'>('official')

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Top navigation switch */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Hujjatlar Konstruktori
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                O‘zbekiston Respublikasining rasmiy blanklari va yuridik hujjatlar tizimi
              </p>
            </div>

            <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setViewMode('official')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'official'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Rasmiy blanklar kutubxonasi</span>
              </button>
              <button
                onClick={() => setViewMode('custom')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'custom'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Maxsus generator</span>
              </button>
            </div>
          </div>

          {viewMode === 'official' ? (
            <OfficialDocumentsCatalog />
          ) : (
            <DocumentGenerator />
          )}
        </div>
      </main>
    </div>
  )
}
