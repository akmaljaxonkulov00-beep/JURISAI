'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  Shield,
  HelpCircle,
} from 'lucide-react'

export default function AdminQuestionsManager() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/questions?search=${encodeURIComponent(search)}`)
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

  useEffect(() => {
    loadQuestions()
  }, [search])

  const handleCloseQuestion = async (id: string) => {
    if (!confirm('Ushbu savolni moderatsiya qilish va yopishni tasdiqlaysizmi?')) return
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      })
      const json = await res.json()
      if (json.success) loadQuestions()
    } catch {
      alert('Xatolik yuz berdi')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Savollar va Javoblar Moderatsiyasi
          </h2>
          <p className="text-xs text-secondary">
            Ommaviy savollarni ko‘rib chiqish, noo‘rin ma’lumotlarni cheklash va tartibga solish
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Savollar ichidan qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
          />
        </div>
      </div>

      <div className="card-default rounded-2xl border border-card-border overflow-hidden">
        <div className="p-4 border-b border-card-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Ommaviy savollar ro‘yxati ({questions.length})
          </h3>
          <span className="text-xs text-secondary">
            Faqat ommaviy savollar moderatsiya qilinadi. Maxfiy savollar qat’iyan himoyalangan.
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-secondary">Yuklanmoqda...</div>
        ) : questions.length === 0 ? (
          <div className="p-8 text-center text-xs text-secondary">Savollar mavjud emas</div>
        ) : (
          <div className="divide-y divide-card-border">
            {questions.map(q => (
              <div
                key={q.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-zinc-800/40"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {q.category}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        q.status === 'answered'
                          ? 'bg-emerald-50 text-emerald-700'
                          : q.status === 'closed'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {q.status}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Muallif: {q.citizen_name}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">{q.title}</h4>
                  <p className="text-xs text-secondary line-clamp-2">{q.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/questions/${q.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-card-border text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Ko‘rish
                  </a>
                  {q.status !== 'closed' && (
                    <button
                      onClick={() => handleCloseQuestion(q.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold"
                    >
                      Yopish
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
