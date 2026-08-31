'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAuthHeaders } from '@/lib/api-auth-client'
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
  Brain,
  PenTool,
  Shuffle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase-browser'

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

interface IracResult {
  issue: string
  rule: string
  application: string
  conclusion: string
  sources: Array<{ title: string; article: string; url: string }>
  confidence: number
}

interface IracCase {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  law_references: string[]
  is_active: boolean
}

interface IracSection {
  id: 'issue' | 'rule' | 'application' | 'conclusion'
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  placeholder: string
}

type Mode = 'ai_solves' | 'user_solves'

const SECTIONS: IracSection[] = [
  {
    id: 'issue',
    title: 'Muammo (Issue)',
    subtitle: 'Asosiy huquqiy masalani aniqlang',
    icon: <Target className="w-5 h-5" />,
    color: 'blue',
    placeholder:
      "Masalan: Sudlanuvchi o'g'irlikda ayblanmoqda. Asosiy masala — JK 169-modda qo'llanilishi to'g'rimi?",
  },
  {
    id: 'rule',
    title: 'Qoida (Rule)',
    subtitle: "Tegishli qonun moddalarini ko'rsating",
    icon: <Scale className="w-5 h-5" />,
    color: 'purple',
    placeholder: "Masalan: JK 169-modda — O'g'irlik. Bazaviy hisoblash miqdorining ...",
  },
  {
    id: 'application',
    title: "Qo'llash (Application)",
    subtitle: "Qonunni faktlarga bog'lang",
    icon: <FileText className="w-5 h-5" />,
    color: 'green',
    placeholder:
      "Masalan: Sudlanuvchi supermarketdan 450 000 so'mlik tovarni yashirin ravishda o'g'irlagan...",
  },
  {
    id: 'conclusion',
    title: 'Xulosa (Conclusion)',
    subtitle: 'Yakuniy huquqiy pozitsiyangizni bildiring',
    icon: <Award className="w-5 h-5" />,
    color: 'orange',
    placeholder:
      'Masalan: JK 169-modda 2-qism asosida sudlanuvchiga jazo tayinlash tavsiya etiladi...',
  },
]

const COLOR_STYLES: Record<string, { header: string; border: string; text: string; bg: string }> = {
  blue: {
    header: 'border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  purple: {
    header: 'border-purple-200 dark:border-purple-900 bg-purple-50/60 dark:bg-purple-950/30',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
  },
  green: {
    header: 'border-green-200 dark:border-green-900 bg-green-50/60 dark:bg-green-950/30',
    border: 'border-green-300 dark:border-green-700',
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30',
  },
  orange: {
    header: 'border-orange-200 dark:border-orange-900 bg-orange-50/60 dark:bg-orange-950/30',
    border: 'border-orange-300 dark:border-orange-700',
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
  },
}

const CATEGORIES = [
  { value: 'all', label: 'Barchasi' },
  { value: 'jinoyat', label: 'Jinoyat' },
  { value: 'fuqarolik', label: 'Fuqarolik' },
  { value: 'mehnat', label: 'Mehnat' },
  { value: 'oila', label: 'Oila' },
  { value: 'mamuriy', label: "Ma'muriy" },
  { value: 'tijorat', label: 'Tijorat' },
]

const DIFFICULTIES = [
  { value: 'all', label: 'Barchasi' },
  { value: 'easy', label: "Boshlang'ich" },
  { value: 'medium', label: "O'rta" },
  { value: 'hard', label: 'Murakkab' },
]

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function CaseSolver() {
  const router = useRouter()

  // ── Mode ──
  const [mode, setMode] = useState<Mode>('ai_solves')

  // ── AI yechishi uchun ──
  const [cases, setCases] = useState<IracCase[]>([])
  const [currentCase, setCurrentCase] = useState<IracCase | null>(null)
  const [category, setCategory] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [loadingCases, setLoadingCases] = useState(false)

  // ── AI tahlil natijasi ──
  const [result, setResult] = useState<IracResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // ── Foydalanuvchi yechishi uchun ──
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({
    issue: '',
    rule: '',
    application: '',
    conclusion: '',
  })
  const [evaluation, setEvaluation] = useState<IracResult | null>(null)
  const [evalLoading, setEvalLoading] = useState(false)

  // ── Admin kazus qo'shish ──
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddCase, setShowAddCase] = useState(false)
  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    category: 'jinoyat',
    difficulty: 'medium',
    law_references: '',
  })
  const [addCaseLoading, setAddCaseLoading] = useState(false)

  // ── Admin: barcha kazuslarni ko'rish ──
  const [allCases, setAllCases] = useState<IracCase[]>([])
  const [showAllCases, setShowAllCases] = useState(false)

  // ── Foydalanuvchi o'zi kazus yozishi uchun (Mode 1: AI yechishi) ──
  const [useCustomCase, setUseCustomCase] = useState(false)
  const [customCaseText, setCustomCaseText] = useState('')

  /* ── Admin aniqlash — server-side API orqali ── */
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.user?.id) return
        const headers: Record<string, string> = {}
        if (session.access_token) headers.Authorization = `Bearer ${session.access_token}`
        const res = await fetch('/api/auth/user-role?userId=' + session.user.id, { headers })
        const result = await res.json()
        if (
          result.success &&
          result.data?.role &&
          ['ADMIN', 'SUPER_ADMIN'].includes(result.data.role.toUpperCase())
        ) {
          setIsAdmin(true)
        }
      } catch {}
    }
    checkAdmin()
  }, [])

  /* ── Kazuslarni yuklash ── */
  const loadCases = useCallback(async () => {
    setLoadingCases(true)
    try {
      let url = '/api/irac/cases?'
      if (category !== 'all') url += `category=${category}&`
      if (difficulty !== 'all') url += `difficulty=${difficulty}&`
      const res = await fetch(url)
      const data = await res.json()
      if (data.cases && Array.isArray(data.cases)) {
        setCases(data.cases)
      }
    } catch {
      setCases([])
    } finally {
      setLoadingCases(false)
    }
  }, [category, difficulty])

  useEffect(() => {
    loadCases()
  }, [loadCases])

  /* ── Tasodifiy kazus tanlash ── */
  const pickRandomCase = () => {
    if (cases.length === 0) {
      setError('Kazuslar topilmadi. Boshqa kategoriya yoki qiyinlik darajasini tanlang.')
      return
    }
    const randomIndex = Math.floor(Math.random() * cases.length)
    setCurrentCase(cases[randomIndex])
    setResult(null)
    setError(null)
    setSaved(false)
  }

  /* ── AI tahlil (AI yechishi rejimi) ── */
  const analyzeWithAI = async () => {
    const caseText = useCustomCase
      ? customCaseText.trim()
      : currentCase
        ? `${currentCase.title}\n\n${currentCase.description}`
        : ''
    if (!caseText) {
      setError('Kazus matnini kiriting yoki tayyor kazus tanlang.')
      return
    }
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      const text = caseText
      const res = await fetch('/api/ai/irac-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ caseText: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429 && data.error === 'limit_reached') {
          setError(data.message || "AI limiti tugadi. Keyinroq urinib ko'ring.")
        } else if (res.status === 401) {
          setError('Tizimga kirishingiz kerak.')
        } else {
          setError(data.error || 'Tahlil qilishda xatolik yuz berdi.')
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
      setError("Server bilan aloqa yo'qoldi.")
    } finally {
      setLoading(false)
    }
  }

  /* ── AI baholash (foydalanuvchi yechishi rejimi) ── */
  const evaluateWithAI = async () => {
    if (!currentCase) return
    const allEmpty = Object.values(userAnswers).every(v => v.trim().length === 0)
    if (allEmpty) {
      setError("Kamida bitta bo'limni to'ldiring.")
      return
    }
    setEvalLoading(true)
    setError(null)
    try {
      const prompt = `Siz O'zbekiston Respublikasi huquq tizimini yaxshi biladigan tajribali huquqshunossiz.

Kazus: ${currentCase.title}
${currentCase.description}

Tegishli qonunlar: ${currentCase.law_references?.join(', ') || 'aniqlanmagan'}

Foydalanuvchi quyidagi IRAC analizini yozdi:

MUAMMO (Issue):
${userAnswers.issue || 'yozilmagan'}

QOIDA (Rule):
${userAnswers.rule || 'yozilmagan'}

QO'LLASH (Application):
${userAnswers.application || 'yozilmagan'}

XULOSA (Conclusion):
${userAnswers.conclusion || 'yozilmagan'}

Bu analizni baholang. Har bir bo'lim uchun:
1. To'g'ri javobni yozing (foydalanuvchi noto'g'ri yoki kam yozgan bo'lsa)
2. Foydalanuvchining javobini baholang

JSON formatda javob bering:
{
  "issue": "To'g'ri muammo aniqlanishi...",
  "rule": "To'g'ri qonun moddalari...",
  "application": "To'g'ri qo'llash...",
  "conclusion": "To'g'ri xulosa...",
  "sources": [{"title": "Kodeks nomi", "article": "modda raqami"}],
  "confidence": 85,
  "feedback": "Umumiy baholash..."
}

FAQAT O'ZBEK LOTIN ALIFBOSIDA yozing. Kirill harflari ishlatilmaydi.`

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          message: prompt,
          systemBase:
            "Siz O'zbekiston huquq tizimi bo'yicha AI yordamchisiz. Faqat lotin o'zbek tilida javob bering.",
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Baholashda xatolik.')
        return
      }

      // JSON ajratish
      const text = data.response || data.message || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          setEvaluation({
            issue: parsed.issue || '',
            rule: parsed.rule || '',
            application: parsed.application || '',
            conclusion: parsed.conclusion || '',
            sources: Array.isArray(parsed.sources) ? parsed.sources : [],
            confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
          })
        } catch {
          // JSON parse xatosi — matnni to'g'ridan-to'g'ri ko'rsatish
          setEvaluation({
            issue: text.substring(0, 500),
            rule: '',
            application: '',
            conclusion: '',
            sources: [],
            confidence: 50,
          })
        }
      } else {
        setEvaluation({
          issue: text.substring(0, 500),
          rule: '',
          application: '',
          conclusion: '',
          sources: [],
          confidence: 50,
        })
      }
    } catch {
      setError('Baholashda xatolik yuz berdi.')
    } finally {
      setEvalLoading(false)
    }
  }

  /* ── Saqlash ── */
  const saveAnalysis = async () => {
    if (!result || !currentCase) return
    try {
      const res = await fetch('/api/case-solver/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          case_title: currentCase.title,
          case_category: currentCase.category,
          case_difficulty: currentCase.difficulty,
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
      if (res.ok) setSaved(true)
    } catch {}
  }

  /* ── Admin: yangi kazus qo'shish ── */
  const addCase = async () => {
    if (!newCase.title || !newCase.description) return
    setAddCaseLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const res = await fetch('/api/irac/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          ...newCase,
          law_references: newCase.law_references
            ? newCase.law_references.split(',').map(s => s.trim())
            : [],
        }),
      })
      if (res.ok) {
        setNewCase({
          title: '',
          description: '',
          category: 'jinoyat',
          difficulty: 'medium',
          law_references: '',
        })
        setShowAddCase(false)
        loadCases()
      } else {
        const data = await res.json()
        setError(data.error || "Qo'shishda xatolik.")
      }
    } catch {
      setError("Qo'shishda xatolik yuz berdi.")
    } finally {
      setAddCaseLoading(false)
    }
  }

  /* ── Admin: barcha kazuslarni olish ── */
  const loadAllCases = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/irac-cases', {
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
      })
      const data = await res.json()
      if (data.cases) setAllCases(data.cases)
    } catch {}
  }

  /* ── Admin: kazusni o'chirish ── */
  const deleteCase = async (id: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      await fetch(`/api/admin/irac-cases?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
      })
      loadAllCases()
      loadCases()
    } catch {}
  }

  /* ── Reset ── */
  const reset = () => {
    setCurrentCase(null)
    setResult(null)
    setEvaluation(null)
    setError(null)
    setSaved(false)
    setUseCustomCase(false)
    setCustomCaseText('')
    setUserAnswers({ issue: '', rule: '', application: '', conclusion: '' })
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 mobile-safe-top">
      <div className="flex flex-col md:flex-row">
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

        <div className="flex-1">
          {/* Header */}
          <header className="bg-white dark:bg-zinc-900 px-4 sm:px-8 py-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">
                  Kazus Yechish (IRAC)
                </h1>
                <p className="text-sm text-gray-600 dark:text-zinc-300">
                  Huquqiy kazusni AI bilan yeching yoki o'zingiz yechib AI baholasin
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowAddCase(!showAddCase)
                    if (!showAllCases) loadAllCases()
                    setShowAllCases(!showAllCases)
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Kazus qo'shish
                </button>
              )}
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
            {/* ═══════════════ ADMIN: KAZUSLAR RO'YXATI ═══════════════ */}
            {isAdmin && showAllCases && (
              <div className="mb-6 bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-purple-200 dark:border-purple-900">
                <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-purple-600" />
                  Barcha kazuslar ({allCases.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {allCases.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-800 dark:text-zinc-200 truncate">
                          {c.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                          {c.category} · {c.difficulty} · {c.is_active ? '✅ Faol' : '❌ Nofaol'}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteCase(c.id)}
                        className="ml-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══════════════ ADMIN: YANGI KAZUS QO'SHISH ═══════════════ */}
            {isAdmin && showAddCase && (
              <div className="mb-6 bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm border border-purple-200 dark:border-purple-900">
                <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-600" />
                  Yangi kazus qo'shish
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                      Kazus nomi
                    </label>
                    <input
                      type="text"
                      value={newCase.title}
                      onChange={e => setNewCase({ ...newCase, title: e.target.value })}
                      className="w-full p-3 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 text-sm"
                      placeholder="Masalan: O'g'irlik ishi"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                      Kazus tavsifi
                    </label>
                    <textarea
                      value={newCase.description}
                      onChange={e => setNewCase({ ...newCase, description: e.target.value })}
                      className="w-full h-32 p-3 border border-gray-200 dark:border-zinc-700 rounded-xl resize-none bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 text-sm"
                      placeholder="Holatni batafsil tasvirlang..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                      Kategoriya
                    </label>
                    <select
                      value={newCase.category}
                      onChange={e => setNewCase({ ...newCase, category: e.target.value })}
                      className="w-full p-3 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 text-sm"
                    >
                      {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                      Qiyinlik
                    </label>
                    <select
                      value={newCase.difficulty}
                      onChange={e => setNewCase({ ...newCase, difficulty: e.target.value })}
                      className="w-full p-3 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 text-sm"
                    >
                      {DIFFICULTIES.filter(d => d.value !== 'all').map(d => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                      Tegishli qonun moddalari (vergul bilan ajrating)
                    </label>
                    <input
                      type="text"
                      value={newCase.law_references}
                      onChange={e => setNewCase({ ...newCase, law_references: e.target.value })}
                      className="w-full p-3 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 text-sm"
                      placeholder="JK 169-modda, JK 47-modda"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={addCase}
                    disabled={addCaseLoading || !newCase.title || !newCase.description}
                    className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    {addCaseLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Qo'shish
                  </button>
                  <button
                    onClick={() => setShowAddCase(false)}
                    className="px-6 py-2.5 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════ MODE SELECTOR ═══════════════ */}
            {!currentCase && !result && !evaluation && (
              <div className="mb-6">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    Rejimni tanlang
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setMode('ai_solves')}
                      className={`p-6 rounded-2xl border-2 text-left transition-all ${
                        mode === 'ai_solves'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-gray-200 dark:border-zinc-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`p-2 rounded-xl ${mode === 'ai_solves' ? 'bg-blue-600 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}
                        >
                          <Brain className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 dark:text-zinc-100">
                            AI Kazus Yechishi
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">
                            AI kazusni IRAC bo'yicha tahlil qiladi
                          </p>
                        </div>
                      </div>
                      <ul className="text-xs text-gray-600 dark:text-zinc-400 space-y-1 ml-11">
                        <li>• Tasodifiy kazus tanlash</li>
                        <li>• AI to'liq IRAC tahlili beradi</li>
                        <li>• Tegishli qonun moddalari ko'rsatiladi</li>
                        <li>• Saqlash va eksport qilish</li>
                      </ul>
                    </button>

                    <button
                      onClick={() => setMode('user_solves')}
                      className={`p-6 rounded-2xl border-2 text-left transition-all ${
                        mode === 'user_solves'
                          ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                          : 'border-gray-200 dark:border-zinc-700 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`p-2 rounded-xl ${mode === 'user_solves' ? 'bg-green-600 text-white' : 'bg-green-100 dark:bg-green-900/30 text-green-600'}`}
                        >
                          <PenTool className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 dark:text-zinc-100">
                            Kazus Baholash
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">
                            Siz yeching, AI baholasin
                          </p>
                        </div>
                      </div>
                      <ul className="text-xs text-gray-600 dark:text-zinc-400 space-y-1 ml-11">
                        <li>• Kazusni o'qing</li>
                        <li>• O'zingiz IRAC yozing</li>
                        <li>• AI baholab beradi</li>
                        <li>• To'g'ri javobni ko'ring</li>
                      </ul>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════ KAZUS TANLASH ═══════════════ */}
            {!currentCase && !result && !evaluation && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm">
                {/* Mode 1: AI yechishi — o'zim kazus yozish yoki tayyor tanlash */}
                {mode === 'ai_solves' && (
                  <div className="mb-4">
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setUseCustomCase(false)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          !useCustomCase
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <BookMarked className="w-4 h-4" />
                        Tayyor kazuslar
                      </button>
                      <button
                        onClick={() => setUseCustomCase(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          useCustomCase
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <PenTool className="w-4 h-4" />
                        O'zim yozaman
                      </button>
                    </div>

                    {useCustomCase && (
                      <div>
                        <textarea
                          value={customCaseText}
                          onChange={e => setCustomCaseText(e.target.value)}
                          placeholder="Huquqiy kazus matnini kiriting...\n\nMasalan: Sudlanuvchi A. shaxs B. ni aldab, uning 500 000 so'mini o'g'irlagan. B. shaxs A. ga ishonch bildirgan, chunki ular oldin tanish edi. A. bu mablag'ni shaxsiy ehtiyojlari uchun sarflab yuborgan..."
                          className="w-full h-40 p-4 border border-gray-200 dark:border-zinc-700 rounded-xl resize-none bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xs text-gray-500 dark:text-zinc-400">
                            {customCaseText.length > 0
                              ? `${customCaseText.length} belgi`
                              : 'Kamida 50 belgi kiriting'}
                          </span>
                          <button
                            onClick={analyzeWithAI}
                            disabled={loading || customCaseText.trim().length < 50}
                            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 font-medium text-sm"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                AI tahlil qilmoqda...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                AI bilan tahlil qilish
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!useCustomCase && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100">
                        Kazus tanlang
                      </h2>
                      <button
                        onClick={pickRandomCase}
                        disabled={loadingCases || cases.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                      >
                        <Shuffle className="w-4 h-4" />
                        Tasodifiy kazus
                      </button>
                    </div>

                    {/* Filtrlar */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 text-sm"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={difficulty}
                        onChange={e => setDifficulty(e.target.value)}
                        className="px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 text-sm"
                      >
                        {DIFFICULTIES.map(d => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Kazuslar ro'yxati */}
                    {loadingCases ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      </div>
                    ) : cases.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 dark:text-zinc-400">
                        <p className="text-lg mb-2">Kazuslar topilmadi</p>
                        <p className="text-sm">
                          {isAdmin
                            ? '"Kazus qo\'shish" tugmasi orqali yangi kazus qo\'shing.'
                            : "Admin kazuslar qo'shishini kuting."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {cases.map(c => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setCurrentCase(c)
                              setResult(null)
                              setEvaluation(null)
                              setUserAnswers({
                                issue: '',
                                rule: '',
                                application: '',
                                conclusion: '',
                              })
                            }}
                            className="p-4 text-left border border-gray-200 dark:border-zinc-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-medium text-gray-800 dark:text-zinc-200 text-sm">
                                {c.title}
                              </h3>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  c.difficulty === 'easy'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : c.difficulty === 'hard'
                                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}
                              >
                                {c.difficulty === 'easy'
                                  ? "Boshlang'ich"
                                  : c.difficulty === 'hard'
                                    ? 'Murakkab'
                                    : "O'rta"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 mb-2">
                              {c.description}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {c.law_references?.slice(0, 3).map((ref, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded"
                                >
                                  {ref}
                                </span>
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ═══════════════ KAZUS KO'RSATISH ═══════════════ */}
            {(currentCase || (useCustomCase && customCaseText.trim())) &&
              !result &&
              !evaluation && (
                <div className="space-y-4">
                  {/* Kazus matni */}
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100">
                          {currentCase ? currentCase.title : 'Sizning kazusingiz'}
                        </h2>
                        {currentCase && (
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                currentCase.difficulty === 'easy'
                                  ? 'bg-green-100 text-green-700'
                                  : currentCase.difficulty === 'hard'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {currentCase.difficulty === 'easy'
                                ? "Boshlang'ich"
                                : currentCase.difficulty === 'hard'
                                  ? 'Murakkab'
                                  : "O'rta"}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-full">
                              {currentCase.category}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={reset}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Qayta
                      </button>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-xl">
                      <p className="text-sm sm:text-base text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {currentCase ? currentCase.description : customCaseText}
                      </p>
                    </div>
                    {currentCase?.law_references && currentCase.law_references.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500 dark:text-zinc-400">Tegishli:</span>
                        {currentCase.law_references.map((ref, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full"
                          >
                            {ref}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ═══════════════ AI YECHISHI REJIMI ═══════════════ */}
                  {mode === 'ai_solves' && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <Brain className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-gray-800 dark:text-zinc-100">
                          AI IRAC tahlili
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
                        AI kazusni o''qib, IRAC metodikasi bo''yicha to''liq tahlil beradi.
                      </p>
                      {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                      )}
                      <button
                        onClick={analyzeWithAI}
                        disabled={loading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 font-medium"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            AI tahlil qilmoqda...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            AI bilan tahlil qilish
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* ═══════════════ FOYDALANUVCHI YECHISHI REJIMI ═══════════════ */}
                  {mode === 'user_solves' && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <PenTool className="w-5 h-5 text-green-600" />
                        <h3 className="font-bold text-gray-800 dark:text-zinc-100">
                          IRAC analizini yozing
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-zinc-400 mb-6">
                        Kazusni o''qing va o''zingiz IRAC bo''yicha javob yozing. AI baholab beradi.
                      </p>

                      <div className="space-y-4">
                        {SECTIONS.map(s => {
                          const styles = COLOR_STYLES[s.color]
                          return (
                            <div key={s.id} className={`border rounded-xl ${styles.header}`}>
                              <div className={`flex items-center gap-2 px-4 py-3 ${styles.text}`}>
                                {s.icon}
                                <div>
                                  <span className="font-semibold text-sm">{s.title}</span>
                                  <p className="text-xs opacity-70">{s.subtitle}</p>
                                </div>
                              </div>
                              <div className="px-4 pb-4">
                                <textarea
                                  value={userAnswers[s.id]}
                                  onChange={e =>
                                    setUserAnswers({ ...userAnswers, [s.id]: e.target.value })
                                  }
                                  placeholder={s.placeholder}
                                  className="w-full h-28 p-3 border border-gray-200 dark:border-zinc-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200"
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {error && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                      )}

                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={evaluateWithAI}
                          disabled={evalLoading}
                          className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 font-medium"
                        >
                          {evalLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              AI baholamoqda...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5" />
                              AI baholasin
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* ═══════════════ AI TAHLIL NATIJASI (AI yechishi) ═══════════════ */}
            {result && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    AI tahlili tayyor
                    <span className="text-sm font-normal text-gray-500 dark:text-zinc-400">
                      — Ishonchlilik: {result.confidence}%
                    </span>
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

                {SECTIONS.map(s => {
                  const content = result[s.id]
                  if (!content) return null
                  const styles = COLOR_STYLES[s.color]
                  return (
                    <div
                      key={s.id}
                      className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-sm border ${styles.border}`}
                    >
                      <div className={`flex items-center gap-2 mb-3 ${styles.text}`}>
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
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════ AI BAHO NATIJASI (Foydalanuvchi yechishi) ═══════════════ */}
            {evaluation && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    AI bahosi tayyor
                    <span className="text-sm font-normal text-gray-500 dark:text-zinc-400">
                      — Baholash: {evaluation.confidence}%
                    </span>
                  </h2>
                  <button
                    onClick={reset}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Yangi kazus
                  </button>
                </div>

                {/* Foydalanuvchi javoblari vs AI bahosi */}
                {SECTIONS.map(s => {
                  const userAnswer = userAnswers[s.id]
                  const aiAnswer = evaluation[s.id]
                  if (!userAnswer && !aiAnswer) return null
                  const styles = COLOR_STYLES[s.color]
                  return (
                    <div key={s.id} className="space-y-2">
                      <div
                        className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-sm border ${styles.border}`}
                      >
                        <div className={`flex items-center gap-2 mb-3 ${styles.text}`}>
                          {s.icon}
                          <h3 className="font-semibold text-gray-800 dark:text-zinc-100">
                            {s.title}
                          </h3>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-500 rounded-full">
                            Sizning javobingiz
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {userAnswer || 'Yozilmagan'}
                        </p>
                      </div>
                      {aiAnswer && (
                        <div
                          className={`bg-green-50 dark:bg-green-950/20 rounded-2xl p-4 sm:p-5 shadow-sm border border-green-200 dark:border-green-900`}
                        >
                          <div className="flex items-center gap-2 mb-3 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-5 h-5" />
                            <h3 className="font-semibold text-sm">AI to'g'ri javob</h3>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {aiAnswer}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}

                {evaluation.sources.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-blue-200 dark:border-blue-900">
                    <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                      <BookMarked className="w-5 h-5" />
                      <h3 className="font-semibold">Tegishli qonun manbalari</h3>
                    </div>
                    <ul className="space-y-2">
                      {evaluation.sources.map((src, i) => (
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
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════ IRAC TUSHUNTIRMASI ═══════════════ */}
            {!currentCase && !result && !evaluation && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
                {SECTIONS.map(s => {
                  const styles = COLOR_STYLES[s.color]
                  return (
                    <div key={s.id} className={`border rounded-xl p-3 ${styles.header}`}>
                      <div className={`flex items-center gap-2 mb-1 ${styles.text}`}>
                        {s.icon}
                        <span className="font-medium text-sm">{s.title.split(' (')[0]}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{s.subtitle}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
