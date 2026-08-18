'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppSidebar from '@/components/layout/AppSidebar'
import {
  ArrowLeft,
  Target,
  Scale,
  FileText,
  Award,
  Send,
  Loader2,
  BookMarked,
  Sparkles,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react'

interface IracResult {
  issue: string
  rule: string
  application: string
  conclusion: string
  sources: Array<{ title: string; article: string; url: string }>
  confidence: number
}

interface IracSection {
  id: 'issue' | 'rule' | 'application' | 'conclusion'
  title: string
  icon: React.ReactNode
  color: string
}

const SECTIONS: IracSection[] = [
  {
    id: 'issue',
    title: 'Muammo (Issue)',
    icon: <Target className="w-5 h-5" />,
    color: 'blue',
  },
  {
    id: 'rule',
    title: 'Qoida (Rule)',
    icon: <Scale className="w-5 h-5" />,
    color: 'purple',
  },
  {
    id: 'application',
    title: "Qo'llash (Application)",
    icon: <FileText className="w-5 h-5" />,
    color: 'green',
  },
  {
    id: 'conclusion',
    title: 'Xulosa (Conclusion)',
    icon: <Award className="w-5 h-5" />,
    color: 'orange',
  },
]

const COLOR_STYLES: Record<string, { header: string; icon: string }> = {
  blue: {
    header: 'border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    header: 'border-purple-200 dark:border-purple-900 bg-purple-50/60 dark:bg-purple-950/30',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  green: {
    header: 'border-green-200 dark:border-green-900 bg-green-50/60 dark:bg-green-950/30',
    icon: 'text-green-600 dark:text-green-400',
  },
  orange: {
    header: 'border-orange-200 dark:border-orange-900 bg-orange-50/60 dark:bg-orange-950/30',
    icon: 'text-orange-600 dark:text-orange-400',
  },
}

export default function CaseSolver() {
  const [kazusText, setKazusText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IracResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const analyze = async () => {
    const text = kazusText.trim()
    if (text.length < 50) {
      setError('Kazus juda qisqa. Iltimos, holatni batafsilroq tasvirlang (kamida 50 belgi).')
      return
    }
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/ai/irac-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseText: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429 && data.error === 'limit_reached') {
          setError(data.message || "AI limiti tugadi. Keyinroq urinib ko'ring.")
        } else if (res.status === 401) {
          setError('Tizimga kirishingiz kerak. Iltimos, avval login qiling.')
        } else {
          setError(data.error || "Tahlil qilishda xatolik yuz berdi. Qayta urinib ko'ring.")
        }
        return
      }
      setResult({
        issue: data.issue || '',
        rule: data.rule || '',
        application: data.application || '',
        conclusion: data.conclusion || '',
        sources: Array.isArray(data.sources) ? data.sources : [],
        confidence: typeof data.confidence === 'number' ? data.confidence : 0,
      })
    } catch {
      setError("Server bilan aloqa yo'qoldi. Internet aloqangizni tekshirib, qayta urinib ko'ring.")
    } finally {
      setLoading(false)
    }
  }

  const saveAnalysis = async () => {
    if (!result) return
    try {
      const res = await fetch('/api/case-solver/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_title: 'Kazus tahlili',
          case_category: 'general',
          case_difficulty: "o'rta",
          irac_analysis: {
            issue: result.issue,
            rule: result.rule,
            application: result.application,
            conclusion: result.conclusion,
          },
          total_score: result.confidence,
          completed_at: new Date().toISOString(),
        }),
      })
      if (res.ok) {
        setSaved(true)
      }
    } catch {
      // saqlash xatosi javobni buzmasin
    }
  }

  const reset = () => {
    setKazusText('')
    setResult(null)
    setError(null)
    setSaved(false)
  }

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 mobile-safe-top">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar — yagona navigatsiya (desktop) */}
        <AppSidebar>
          <div className="space-y-1">
            <button
              onClick={() => {
                if (window.history.length > 1) router.back()
                else router.push('/dashboard')
              }}
              className="flex items-center gap-3 px-3 py-2 w-full text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Orqaga</span>
            </button>
            <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <Scale className="w-5 h-5" />
              <span className="font-medium">Kazus Yechish</span>
            </div>
          </div>
        </AppSidebar>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white dark:bg-zinc-900 px-4 sm:px-8 py-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">
                  Kazus Yechish (IRAC)
                </h1>
                <p className="text-sm text-gray-600 dark:text-zinc-300">
                  Kazusingizni yozing — AI tegishli qonun moddalari bilan tahlil qilib beradi
                </p>
              </div>
              {result && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  Ishonchlilik: {result.confidence}%
                </span>
              )}
            </div>
          </header>

          {/* Main Content Area */}
          <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
            {!result ? (
              /* ── Kazus kiritish ── */
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-1">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100">
                    Kazusingizni yozing
                  </h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
                  Huquqiy holatingizni yoki kazusni tasvirlang. AI uni IRAC metodikasi bilan tahlil
                  qiladi va qonunlar bazasidagi tegishli moddalarni ko'rsatadi.
                </p>

                <textarea
                  value={kazusText}
                  onChange={e => {
                    setKazusText(e.target.value)
                    if (error) setError(null)
                  }}
                  placeholder={`Misol:\n2024-yil 15-mart kuni A.A. Karimov "Mega Market" do'konidan 10 million so'm naqd pulni olib qochib ketdi. U 2 kundan keyin qo'lga olindi va aybini tan oldi...`}
                  className="w-full h-48 sm:h-56 p-4 border border-gray-200 dark:border-zinc-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200"
                />

                <div className="flex items-center justify-between mt-2 mb-4">
                  <span className="text-xs text-gray-400 dark:text-zinc-500">
                    {kazusText.trim().length} belgi · kamida 50 belgi
                  </span>
                  <span className="text-xs text-gray-400 dark:text-zinc-500">
                    Nimani tasvirlash kerak: kim, qachon, qayerda, nima bo'lgan, tomonlar
                  </span>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                <button
                  onClick={analyze}
                  disabled={loading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Tahlil qilinmoqda...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Kazusni tahlil qilish
                    </>
                  )}
                </button>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {SECTIONS.map(s => (
                    <div
                      key={s.id}
                      className={`border rounded-xl p-3 ${COLOR_STYLES[s.color].header}`}
                    >
                      <div className={`flex items-center gap-2 mb-1 ${COLOR_STYLES[s.color].icon}`}>
                        {s.icon}
                        <span className="font-medium text-sm">{s.title.split(' (')[0]}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        {s.id === 'issue' && 'Asosiy huquqiy masala'}
                        {s.id === 'rule' && 'Tegishli qonun moddalari'}
                        {s.id === 'application' && "Qonunni faktlarga bog'lash"}
                        {s.id === 'conclusion' && 'Yakuniy pozitsiya'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ── AI tahlil natijasi ── */
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    AI tahlili tayyor
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={reset}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Yangi kazus
                    </button>
                    <button
                      onClick={saveAnalysis}
                      disabled={saved}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60"
                    >
                      <BookMarked className="w-4 h-4" />
                      {saved ? 'Saqlandi ✓' : 'Saqlash'}
                    </button>
                  </div>
                </div>

                {/* IRAC bo'limlari */}
                <div className="grid grid-cols-1 gap-4">
                  {SECTIONS.map(s => {
                    const content = result[s.id]
                    if (!content) return null
                    return (
                      <div
                        key={s.id}
                        className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-sm border ${COLOR_STYLES[s.color].header.split(' ').slice(0, 2).join(' ')}`}
                      >
                        <div
                          className={`flex items-center gap-2 mb-3 ${COLOR_STYLES[s.color].icon}`}
                        >
                          {s.icon}
                          <h3 className="font-semibold text-gray-800 dark:text-zinc-100">
                            {s.title}
                          </h3>
                        </div>
                        <p className="text-sm sm:text-base text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {content}
                        </p>
                      </div>
                    )
                  })}
                </div>

                {/* Manbalar */}
                {result.sources.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-blue-200 dark:border-blue-900">
                    <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                      <BookMarked className="w-5 h-5" />
                      <h3 className="font-semibold">Tegishli qonun manbalari</h3>
                    </div>
                    <ul className="space-y-2">
                      {result.sources.map((src, i) => (
                        <li key={i} className="text-sm text-gray-700 dark:text-zinc-300">
                          <span className="font-medium">{src.title}</span>
                          {src.article && (
                            <span className="ml-2 text-blue-600 dark:text-blue-400">
                              {src.article}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-2">
                      * Moddalar qonunlar bazasidagi haqiqiy matnlar asosida keltiriladi.
                    </p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
