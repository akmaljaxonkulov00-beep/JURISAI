'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import SiteLogo from '@/components/SiteLogo'
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Shield,
  Eye,
  Plus,
  Scale,
} from 'lucide-react'

export default function PublicQuestionsFeedPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadQuestions() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (categoryFilter !== 'all') params.set('category', categoryFilter)
        if (searchQuery) params.set('search', searchQuery)

        const res = await fetch(`/api/questions?${params.toString()}`)
        const json = await res.json()
        if (json.success && json.data) {
          setQuestions(json.data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadQuestions()
  }, [categoryFilter, searchQuery])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0B1528] text-white border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <SiteLogo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/citizen/ask"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Savol berish
            </Link>
            <Link
              href="/signin"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
            >
              Kirish
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-2">
          <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            Ochiq Huquqiy Ma’lumotlar Tasmisi
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Fuqarolarning Ommaviy Yuridik Savollari
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
            O‘zbekiston fuqarolari tomonidan berilgan ommaviy savollar, huquqshunos talabalar
            va professional advokatlar tomonidan tekshirilgan qonuniy javoblar to‘plami.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Savollar va mavzular bo‘yicha qidirish..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-gray-500 whitespace-nowrap">Soha:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium"
            >
              <option value="all">Barcha sohalar</option>
              <option value="Fuqarolik huquqi">Fuqarolik huquqi</option>
              <option value="Mehnat huquqi">Mehnat huquqi</option>
              <option value="Oilaviy huquq">Oilaviy huquq</option>
              <option value="Meros huquqi">Meros huquqi</option>
              <option value="Iste’molchilar huquqlari">Iste’molchilar huquqlari</option>
              <option value="Uy-joy huquqi">Uy-joy huquqi</option>
            </select>
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border">
            Yuklanmoqda...
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed space-y-2">
            <HelpCircle className="w-10 h-10 text-gray-400 mx-auto" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Savollar topilmadi
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map(q => (
              <Link
                key={q.id}
                href={`/questions/${q.id}`}
                className="block bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-400 shadow-sm transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {q.category}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(q.created_at).toLocaleDateString('uz-UZ')}
                      </span>
                      <span className="text-xs text-gray-400">• {q.citizen_name}</span>
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {q.title}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {q.description}
                    </p>
                  </div>

                  <div className="flex items-center sm:flex-col items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0">
                    <span className="text-xs font-bold px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {q.answers_count || 0} ta javob
                    </span>
                    <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1 sm:mt-2">
                      Javoblarni o‘qish <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
