'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import { getAuthHeaders } from '@/lib/api-auth-client'
import {
  FileText,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react'

export default function CitizenQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true)
        const headers = await getAuthHeaders()
        const res = await fetch(
          `/api/questions?mine=true&status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`,
          {
            headers,
            credentials: 'include',
          }
        )
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
    fetchQuestions()
  }, [statusFilter, searchQuery])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PlatformRoleNav currentRole="citizen" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Mening yuridik savollarim
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Siz bergan barcha savollar va ularga kelib tushgan javoblar tarixi
            </p>
          </div>

          <Link
            href="/citizen/ask"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-md shadow-blue-600/30"
          >
            <Plus className="w-4 h-4" />
            Yangi savol berish
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Savollar ichidan qidirish..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-gray-500 whitespace-nowrap">Holati:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Barchasi</option>
              <option value="open">Ochiq</option>
              <option value="answered">Javob berilgan</option>
              <option value="closed">Yopilgan</option>
            </select>
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
            Yuklanmoqda...
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 space-y-3">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Hech qanday savol topilmadi
            </p>
            <Link
              href="/citizen/ask"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500"
            >
              <Plus className="w-4 h-4" /> Savol berish
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map(q => (
              <Link
                key={q.id}
                href={`/citizen/questions/${q.id}`}
                className="block bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-sm transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {q.category}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          q.status === 'answered'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {q.status === 'answered' ? 'Javob berilgan' : 'Kutilmoqda'}
                      </span>
                      {q.visibility === 'private' ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Maxfiy
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Ommaviy
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(q.created_at).toLocaleDateString('uz-UZ')}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {q.title}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {q.description}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {q.answers_count || 0} ta javob
                    </span>
                    <span className="text-xs font-medium text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1 sm:mt-2">
                      Batafsil <ArrowRight className="w-3.5 h-3.5" />
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
