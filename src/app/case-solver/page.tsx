'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getAuthHeaders } from '@/lib/api-auth-client'
import { useRouter } from 'next/navigation'
import { useLimitModal } from '@/hooks/useLimitModal'
import LimitExceededModal from '@/components/ai/LimitExceededModal'
import AppSidebar from '@/components/layout/AppSidebar'
import FeatureInstructions from '@/components/ui/FeatureInstructions'
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
  Plus,
  Trash2,
  Search,
  Library,
  History,
  TrendingUp,
  X,
  Lightbulb,
  Check,
  AlertTriangle,
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
  score?: number
  feedback?: string
  strengths?: string[]
  weaknesses?: string[]
  suggestions?: string[]
  sectionScores?: { issue?: number; rule?: number; application?: number; conclusion?: number }
}

interface IracCase {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  law_references: string[]
  is_active: boolean
  key_questions?: string[]
}

interface IracSection {
  id: 'issue' | 'rule' | 'application' | 'conclusion'
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  placeholder: string
  maxScore: number
}

interface HistoryItem {
  id: string
  case_title: string
  case_category: string
  case_difficulty: string
  total_score: number
  grade: string
  feedback: string
  strengths: string[]
  weaknesses: string[]
  completed_at: string
}

interface HistoryData {
  history: HistoryItem[]
  categories: Record<string, { total: number; solved: number; avgScore: number }>
  solvedTitles: string[]
  overall: { solved: number; avgScore: number }
}

type Mode = 'ai_solves' | 'user_solves'
type Screen = 'home' | 'library' | 'results'

const SECTIONS: IracSection[] = [
  {
    id: 'issue',
    title: 'ISSUE',
    subtitle: 'Huquqiy muammo nimada?',
    icon: <Target className="w-5 h-5" />,
    color: 'blue',
    maxScore: 20,
    placeholder:
      "Masalan: Sudlanuvchi o'g'irlikda ayblanmoqda. Asosiy masala — JK 169-modda qo'llanilishi to'g'rimi?",
  },
  {
    id: 'rule',
    title: 'RULE',
    subtitle: "Qaysi huquq normalari qo'llaniladi?",
    icon: <Scale className="w-5 h-5" />,
    color: 'purple',
    maxScore: 25,
    placeholder: "Masalan: JK 169-modda — O'g'irlik. Bazaviy hisoblash miqdorining ...",
  },
  {
    id: 'application',
    title: 'APPLICATION',
    subtitle: "Normalarni vaziyatga qanday qo'llaysiz?",
    icon: <FileText className="w-5 h-5" />,
    color: 'green',
    maxScore: 30,
    placeholder:
      "Masalan: Sudlanuvchi supermarketdan 450 000 so'mlik tovarni yashirin ravishda o'g'irlagan...",
  },
  {
    id: 'conclusion',
    title: 'CONCLUSION',
    subtitle: 'Yakuniy xulosangiz:',
    icon: <Award className="w-5 h-5" />,
    color: 'orange',
    maxScore: 25,
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
  { value: 'jinoyat', label: 'Jinoyat huquqi' },
  { value: 'fuqarolik', label: 'Fuqarolik huquqi' },
  { value: 'mehnat', label: 'Mehnat huquqi' },
  { value: 'oila', label: 'Oila huquqi' },
  { value: 'mamuriy', label: "Ma'muriy huquq" },
  { value: 'iqtisodiy', label: 'Tadbirkorlik / Iqtisodiy huquq' },
  { value: 'konstitutsiyaviy', label: 'Konstitutsiyaviy huquq' },
]

const DIFFICULTIES = [
  { value: 'all', label: 'Barchasi' },
  { value: 'easy', label: "Boshlang'ich" },
  { value: 'medium', label: "O'rta" },
  { value: 'hard', label: 'Murakkab' },
]

function categoryLabel(value: string): string {
  return CATEGORIES.find(c => c.value === value)?.label || value
}

function difficultyLabel(value: string): string {
  return DIFFICULTIES.find(d => d.value === value)?.label || value || "O'rta"
}

function difficultyColor(value: string): string {
  if (value === 'easy')
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  if (value === 'hard') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
}

const SECTION_MAX: Record<string, number> = {
  issue: 20,
  rule: 25,
  application: 30,
  conclusion: 25,
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function CaseSolver() {
  const router = useRouter()

  // ── Mode / screen ──
  const [mode, setMode] = useState<Mode>('ai_solves')
  const [screen, setScreen] = useState<Screen>('home')

  // ── Kazuslar ──
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
  const { modalProps, checkLimitError } = useLimitModal()

  // ── Foydalanuvchi yechishi ──
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({
    issue: '',
    rule: '',
    application: '',
    conclusion: '',
  })
  const [evaluation, setEvaluation] = useState<IracResult | null>(null)
  const [evalLoading, setEvalLoading] = useState(false)

  // ── History / progress (real DB) ──
  const [historyData, setHistoryData] = useState<HistoryData | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  // ── Admin ──
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
  const [allCases, setAllCases] = useState<IracCase[]>([])
  const [showAllCases, setShowAllCases] = useState(false)

  // ── Kutubxona filterlari ──
  const [libSearch, setLibSearch] = useState('')
  const [libCategory, setLibCategory] = useState('all')
  const [libDifficulty, setLibDifficulty] = useState('all')
  const [libStatus, setLibStatus] = useState<'all' | 'solved' | 'unsolved'>('all')

  // ── Tasodifiy kazus tarixi: session + localStorage ──
  const seenCaseIdsRef = useRef<Set<string>>(new Set())

  const persistSeenCaseIds = useCallback(() => {
    try {
      localStorage.setItem('kazus_seen_ids', JSON.stringify([...seenCaseIdsRef.current]))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('kazus_seen_ids')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          seenCaseIdsRef.current = new Set(parsed.map(String))
        }
      }
    } catch {}
  }, [])

  // ── Foydalanuvchi o'zi kazus yozishi ──
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

  /* ── History/progress (DB) yuklash ── */
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/irac/history', {
        cache: 'no-cache',
        credentials: 'include',
        headers: { ...(await getAuthHeaders()) },
      })
      const data = await res.json()
      if (data.success && data.history) {
        setHistoryData({
          history: data.history,
          categories: data.categories || {},
          solvedTitles: Array.isArray(data.solvedTitles) ? data.solvedTitles : [],
          overall: data.overall || { solved: 0, avgScore: 0 },
        })
      }
    } catch {
      // offline — history bo'lmasa ham sahifa ishlayveradi
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  /* ── Filterlangan pool ── */
  const getFilteredPool = useCallback(() => {
    let pool = cases
    if (category !== 'all') pool = pool.filter(c => c.category === category)
    if (difficulty !== 'all') pool = pool.filter(c => c.difficulty === difficulty)
    return pool
  }, [cases, category, difficulty])

  /* ── Bugungi kazus — deterministik (kun bo'yi bir xil) ── */
  const dailyCase = useMemo(() => {
    const pool = getFilteredPool()
    if (pool.length === 0) return null
    const dayIndex = Math.floor(Date.now() / 86400000)
    return pool[dayIndex % pool.length]
  }, [getFilteredPool])

  /* ── Tasodifiy kazus (history + localStorage hisobga olinadi) ── */
  const pickRandomCase = () => {
    const pool = getFilteredPool()
    if (pool.length === 0) {
      setError('Kazuslar topilmadi. Boshqa huquq sohasini yoki darajani tanlang.')
      return
    }

    const solvedTitles = new Set((historyData?.solvedTitles || []).map(t => t.toLowerCase()))
    const unseen = pool.filter(c => {
      if (seenCaseIdsRef.current.has(c.id)) return false
      if (solvedTitles.has(c.title.toLowerCase())) return false
      return true
    })
    const finalPool = unseen.length > 0 ? unseen : pool
    if (unseen.length === 0) seenCaseIdsRef.current.clear()

    const picked = finalPool[Math.floor(Math.random() * finalPool.length)]
    seenCaseIdsRef.current.add(picked.id)
    persistSeenCaseIds()
    startCase(picked)
  }

  /* ── Kazusni yechish rejimiga o'tish ── */
  const startCase = (c: IracCase) => {
    seenCaseIdsRef.current.add(c.id)
    persistSeenCaseIds()
    setCurrentCase(c)
    setResult(null)
    setEvaluation(null)
    setError(null)
    setSaved(false)
    setUserAnswers({ issue: '', rule: '', application: '', conclusion: '' })
    setScreen('home')
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
      const res = await fetch('/api/ai/irac-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ caseText }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429 && data.error === 'limit_reached') {
          checkLimitError(data)
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

  /* ── Natijani DB'ga saqlash (progress statistikasi uchun) ── */
  const persistResult = useCallback(
    async (score: number, analysis: Record<string, string>) => {
      if (!currentCase) return
      try {
        const res = await fetch('/api/case-solver/save-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
          body: JSON.stringify({
            case_title: currentCase.title,
            case_category: currentCase.category,
            case_difficulty: currentCase.difficulty,
            irac_analysis: {
              issue: analysis.issue || '',
              rule: analysis.rule || '',
              application: analysis.application || '',
              conclusion: analysis.conclusion || '',
            },
            total_score: Math.min(100, Math.max(0, Math.round(score))),
            completed_at: new Date().toISOString(),
          }),
        })
        if (res.ok) {
          setSaved(true)
          loadHistory() // progress yangilanadi
        }
      } catch {}
    },
    [currentCase, loadHistory]
  )

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
2. Bo'limlar bo'yicha ball bering: Issue maksimal 20 ball, Rule maksimal 25 ball, Application maksimal 30 ball, Conclusion maksimal 25 ball.

JSON formatda javob bering:
{
  "issue": "To'g'ri muammo aniqlanishi...",
  "rule": "To'g'ri qonun moddalari...",
  "application": "To'g'ri qo'llash...",
  "conclusion": "To'g'ri xulosa...",
  "sources": [{"title": "Kodeks nomi", "article": "modda raqami"}],
  "confidence": 85,
  "score": 72,
  "sectionScores": {"issue": 18, "rule": 20, "application": 25, "conclusion": 19},
  "feedback": "Foydalanuvchi javobining umumiy bahosi — kuchli va zaif tomonlarini qisqacha tavsiflang",
  "strengths": ["Kuchli tomon 1", "Kuchli tomon 2"],
  "weaknesses": ["Zaif tomon 1", "Zaif tomon 2"],
  "suggestions": ["Takomillashtirish uchun maslahat 1", "Maslahat 2"]
}

score 0-100 oralig'ida butun son bo'lsin. sectionScores summasi score ga teng bo'lsin.
strength/weakness/suggestion har biri 2-4 ta bo'lsin.
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
        if (res.status === 429 && data.error === 'limit_reached') {
          checkLimitError(data)
        } else {
          setError(data.error || 'Baholashda xatolik.')
        }
        return
      }

      // JSON ajratish
      const text = data.response || data.message || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      let evaluationResult: IracResult | null = null
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          evaluationResult = {
            issue: parsed.issue || '',
            rule: parsed.rule || '',
            application: parsed.application || '',
            conclusion: parsed.conclusion || '',
            sources: Array.isArray(parsed.sources) ? parsed.sources : [],
            confidence:
              typeof parsed.confidence === 'number'
                ? parsed.confidence
                : typeof parsed.score === 'number'
                  ? parsed.score
                  : 0,
            score: typeof parsed.score === 'number' ? parsed.score : undefined,
            sectionScores:
              parsed.sectionScores && typeof parsed.sectionScores === 'object'
                ? {
                    issue: parsed.sectionScores.issue,
                    rule: parsed.sectionScores.rule,
                    application: parsed.sectionScores.application,
                    conclusion: parsed.sectionScores.conclusion,
                  }
                : undefined,
            feedback: parsed.feedback ? String(parsed.feedback) : undefined,
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : undefined,
            weaknesses: Array.isArray(parsed.weaknesses)
              ? parsed.weaknesses.map(String)
              : undefined,
            suggestions: Array.isArray(parsed.suggestions)
              ? parsed.suggestions.map(String)
              : undefined,
          }
        } catch {
          evaluationResult = {
            issue: text.substring(0, 500),
            rule: '',
            application: '',
            conclusion: '',
            sources: [],
            confidence: 50,
          }
        }
      } else {
        evaluationResult = {
          issue: text.substring(0, 500),
          rule: '',
          application: '',
          conclusion: '',
          sources: [],
          confidence: 50,
        }
      }

      setEvaluation(evaluationResult)
      const finalScore = evaluationResult.score ?? evaluationResult.confidence
      persistResult(finalScore, userAnswers)
    } catch {
      setError('Baholashda xatolik yuz berdi.')
    } finally {
      setEvalLoading(false)
    }
  }

  /* ── Saqlash (AI rejimi) ── */
  const saveAnalysis = async () => {
    if (!result || !currentCase) return
    await persistResult(result.confidence, {
      issue: result.issue,
      rule: result.rule,
      application: result.application,
      conclusion: result.conclusion,
    })
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

  /* ── Admin: barcha kazuslar ── */
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
    setScreen('home')
  }

  /* ── Kutubxona ro'yxati (filterlangan) ── */
  const libraryCases = useMemo(() => {
    const solvedTitles = new Set((historyData?.solvedTitles || []).map(t => t.toLowerCase()))
    let list = cases
    if (libCategory !== 'all') list = list.filter(c => c.category === libCategory)
    if (libDifficulty !== 'all') list = list.filter(c => c.difficulty === libDifficulty)
    if (libSearch.trim()) {
      const q = libSearch.trim().toLowerCase()
      list = list.filter(
        c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      )
    }
    if (libStatus !== 'all') {
      const solved = libStatus === 'solved'
      list = list.filter(c => solvedTitles.has(c.title.toLowerCase()) === solved)
    }
    return list
  }, [cases, libCategory, libDifficulty, libSearch, libStatus, historyData])

  const catStats = (value: string) => {
    if (historyData && historyData.categories[value]) {
      return historyData.categories[value]
    }
    return { total: 0, solved: 0, avgScore: 0 }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════ */

  const chip = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer whitespace-nowrap ${
      active
        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
        : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
    }`

  /* ── HOME: rejim tanlash + huquq sohasi + daraja + random ── */
  const renderHome = () => (
    <div className="space-y-8">
      {/* ═══ REJIMNI TANLANG ═══ */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
          Rejimni tanlang
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMode('ai_solves')}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${
              mode === 'ai_solves'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                : 'border-gray-200 dark:border-zinc-700 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-2 rounded-xl ${
                  mode === 'ai_solves'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                }`}
              >
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-zinc-100">AI Kazus Yechishi</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
              AI kazusni o'zi IRAC bo'yicha to'liq tahlil qiladi va tegishli qonun moddalarini
              ko'rsatadi.
            </p>
          </button>

          <button
            onClick={() => setMode('user_solves')}
            className={`p-5 rounded-2xl border-2 text-left transition-all ${
              mode === 'user_solves'
                ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                : 'border-gray-200 dark:border-zinc-700 hover:border-green-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-2 rounded-xl ${
                  mode === 'user_solves'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-600'
                }`}
              >
                <PenTool className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-zinc-100">Kazus Baholash</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
              Siz kazusni IRAC bo'yicha yechasiz, AI javobingizni ball bilan baholaydi.
            </p>
          </button>
        </div>
      </section>

      {/* ═══ KAZUS TURI (faqat AI rejimida) ═══ */}
      {mode === 'ai_solves' && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
            Kazus turi
          </h2>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setUseCustomCase(false)} className={chip(!useCustomCase)}>
              <BookMarked className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Tayyor kazuslar
            </button>
            <button onClick={() => setUseCustomCase(true)} className={chip(useCustomCase)}>
              <PenTool className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              O'zim yozaman
            </button>
          </div>
        </section>
      )}

      {/* ═══ O'ZIM YOZAMAN — darhol textarea, katalog yo'q ═══ */}
      {useCustomCase ? (
        <section className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-1">
            O'z kazusingizni yozing
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
            Huquqiy vaziyatni yozing — AI uni IRAC bo'yicha tahlil qiladi.
          </p>
          <textarea
            value={customCaseText}
            onChange={e => setCustomCaseText(e.target.value)}
            placeholder="Huquqiy kazus matnini kiriting...&#10;&#10;Masalan: Sudlanuvchi A. shaxs B. ni aldab, uning 500 000 so'mini o'g'irlagan..."
            className="w-full h-44 p-4 border border-gray-200 dark:border-zinc-700 rounded-xl resize-none bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              {customCaseText.length > 0
                ? `${customCaseText.length} belgi`
                : 'Kamida 50 belgi kiriting'}
            </span>
            <button
              onClick={analyzeWithAI}
              disabled={loading || customCaseText.trim().length < 50}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 font-medium text-sm w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI tahlil qilmoqda...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  AI orqali tahlil qilish
                </>
              )}
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* ═══ HUQUQ SOHASI ═══ */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
              Huquq sohasini tanlang
            </h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={chip(category === c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </section>

          {/* ═══ DARAJA ═══ */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
              Darajani tanlang
            </h2>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={chip(difficulty === d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </section>

          {/* ═══ ASOSIY CTA: TASODIFIY KAZUS ═══ */}
          <section>
            <button
              onClick={pickRandomCase}
              disabled={loadingCases || getFilteredPool().length === 0}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-bold text-white transition-all duration-300 hover:shadow-xl disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                boxShadow: '0 8px 25px rgba(37,99,235,0.35)',
              }}
            >
              <Shuffle className="w-5 h-5" />
              {loadingCases ? 'Kazuslar yuklanmoqda...' : 'Tasodifiy kazus'}
            </button>
            <p className="text-center text-xs text-gray-400 dark:text-zinc-500 mt-2">
              Oldin yechilgan kazuslar qayta berilmaydi
            </p>
          </section>

          {/* ═══ BUGUNGI TAVSIYA (1 ta kazus) ═══ */}
          {dailyCase && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                  Bugungi kazus
                </h2>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                    {categoryLabel(dailyCase.category)}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${difficultyColor(dailyCase.difficulty)}`}
                  >
                    {difficultyLabel(dailyCase.difficulty)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-2">
                  {dailyCase.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed line-clamp-3 mb-4">
                  {dailyCase.description}
                </p>
                <button
                  onClick={() => startCase(dailyCase)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  Kazusni boshlash
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </section>
          )}

          {/* ═══ PROGRESS (real DB) ═══ */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Natijalaringiz
            </h2>
            {historyLoading ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Statistikalar yuklanmoqda...
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800">
                {category !== 'all' ? (
                  (() => {
                    const s = catStats(category)
                    return (
                      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                        <div>
                          <p className="text-2xl font-bold text-gray-800 dark:text-zinc-100">
                            {s.total}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">
                            ta kazus · {categoryLabel(category)}
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{s.solved}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">tasi yechilgan</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            {s.solved > 0 ? s.avgScore : '—'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">o'rtacha ball</p>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                    <div>
                      <p className="text-2xl font-bold text-gray-800 dark:text-zinc-100">
                        {historyData?.overall.solved ?? 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">ta kazus yechilgan</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {historyData?.overall.solved ? historyData.overall.avgScore : '—'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">o'rtacha ball</p>
                    </div>
                    <button
                      onClick={() => setScreen('results')}
                      className="ml-auto flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <History className="w-4 h-4" />
                      Natijalarim
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ═══ KUTUBXONAGA O'TISH ═══ */}
          <section className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setScreen('library')}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
            >
              <Library className="w-4 h-4" />
              Kazuslar kutubxonasi
            </button>
            <button
              onClick={() => setScreen('results')}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
            >
              <History className="w-4 h-4" />
              Natijalarim
            </button>
          </section>
        </>
      )}

      {/* ═══ INSTRUKSIYA ═══ */}
      <FeatureInstructions
        featureName="Kazus Yechish"
        steps={[
          {
            title: 'Rejimni tanlang',
            description:
              "AI yechishi (AI tahlil beradi) yoki Kazus Baholash (o'zingiz yechasiz, AI baholaydi).",
            icon: '⚖️',
          },
          {
            title: 'Huquq sohasi va darajani tanlang',
            description:
              "Jinoyat, fuqarolik, mehnat, oila va boshqa yo'nalishlar — o'z darajangizga mos qiyinlikni tanlang.",
            icon: '📋',
          },
          {
            title: 'IRAC usulida tahlil qiling',
            description:
              "Issue (masala), Rule (qoida), Application (qo'llash), Conclusion (xulosa) bo'limlarini to'ldiring.",
            icon: '🧠',
          },
          {
            title: "Natijani o'rganing",
            description:
              "AI baho, bo'limlar bo'yicha ballar, kuchli/zaif tomonlar va tegishli qonun moddalarini ko'ring.",
            icon: '📊',
          },
        ]}
        tips={[
          'IRAC — huquqiy tahlilning xalqaro usuli',
          'Issue: qaysi huquqiy muammo bor?',
          "Rule: qaysi qonun/modda qo'llaniladi?",
          "Application: qonun ana shu holatga qanday qo'llaniladi?",
          'Conclusion: yakuniy huquqiy xulosa',
        ]}
      />
    </div>
  )

  /* ── LIBRARY: kazuslar kutubxonasi (alohida ekran) ── */
  const renderLibrary = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
            <Library className="w-5 h-5 text-blue-600" />
            Kazuslar kutubxonasi
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Barcha kazuslar — qidiring, filtrlang va yechishni boshlang
          </p>
        </div>
        <button
          onClick={() => setScreen('home')}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Orqaga
        </button>
      </div>

      {/* Filterlar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-zinc-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={libSearch}
            onChange={e => setLibSearch(e.target.value)}
            placeholder="Kazus qidirish..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-sm text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={libCategory}
            onChange={e => setLibCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-sm text-gray-800 dark:text-zinc-200"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={libDifficulty}
            onChange={e => setLibDifficulty(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-sm text-gray-800 dark:text-zinc-200"
          >
            {DIFFICULTIES.map(d => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <select
            value={libStatus}
            onChange={e => setLibStatus(e.target.value as typeof libStatus)}
            className="px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 text-sm text-gray-800 dark:text-zinc-200"
          >
            <option value="all">Barchasi</option>
            <option value="unsolved">Yechilmagan</option>
            <option value="solved">Yechilgan</option>
          </select>
        </div>
      </div>

      {/* Ro'yxat — compact qatorlar (card grid emas) */}
      {loadingCases ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : libraryCases.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-zinc-400">
          <Library className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-zinc-700" />
          <p className="text-base font-medium">Kazuslar topilmadi</p>
          <p className="text-sm mt-1">Filtrni o'zgartiring yoki boshqa soha tanlang</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800 overflow-hidden">
          {libraryCases.map(c => {
            const solved = (historyData?.solvedTitles || []).some(
              t => t.toLowerCase() === c.title.toLowerCase()
            )
            return (
              <div key={c.id} className="p-4 sm:p-5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full">
                      {categoryLabel(c.category)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor(c.difficulty)}`}
                    >
                      {difficultyLabel(c.difficulty)}
                    </span>
                    {solved && (
                      <span className="text-xs px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Yechilgan
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-zinc-100 text-sm mb-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2">
                    {c.description}
                  </p>
                </div>
                <button
                  onClick={() => startCase(c)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-xs font-semibold"
                >
                  Yechish
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  /* ── RESULTS: natijalarim (real DB) ── */
  const renderResults = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Natijalarim
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Yechilgan kazuslar va o'rtacha ballar — real statistikalar
          </p>
        </div>
        <button
          onClick={() => setScreen('home')}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Orqaga
        </button>
      </div>

      {/* Yo'nalishlar bo'yicha progress */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-4">
          Yo'nalishlar bo'yicha progress
        </h3>
        {historyLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Yuklanmoqda...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CATEGORIES.filter(c => c.value !== 'all').map(c => {
              const s = catStats(c.value)
              return (
                <div
                  key={c.value}
                  className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30 p-3"
                >
                  <p className="text-xs font-medium text-gray-600 dark:text-zinc-400 truncate">
                    {c.label}
                  </p>
                  <div className="flex items-baseline justify-between mt-1.5">
                    <span className="text-lg font-bold text-gray-800 dark:text-zinc-100">
                      {s.solved}
                      <span className="text-xs font-normal text-gray-400">/{s.total || '?'}</span>
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {s.solved > 0 ? s.avgScore : '—'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                      style={{
                        width: `${s.total > 0 ? Math.min(100, (s.solved / s.total) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tarix */}
      {historyData && historyData.history.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
          <Award className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-zinc-700" />
          <p className="text-base font-medium">Hali natijalar yo'q</p>
          <p className="text-sm mt-1">Birinchi kazusni yeching — natijangiz shu yerda saqlanadi</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800 overflow-hidden">
          {(historyData?.history || []).map(h => (
            <div key={h.id} className="p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full">
                    {categoryLabel(h.case_category)}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor(h.case_difficulty)}`}
                  >
                    {difficultyLabel(h.case_difficulty)}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-full">
                    {new Date(h.completed_at).toLocaleDateString('uz-UZ')}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-zinc-100 text-sm">
                  {h.case_title}
                </h3>
                {h.feedback && (
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2">
                    {h.feedback}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <div
                  className={`text-xl font-bold ${
                    h.total_score >= 70
                      ? 'text-green-600'
                      : h.total_score >= 40
                        ? 'text-amber-500'
                        : 'text-red-500'
                  }`}
                >
                  {h.total_score}
                  <span className="text-xs font-normal text-gray-400">/100</span>
                </div>
                <div className="text-[10px] text-gray-400">{h.grade}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  /* ── SOLVING: kazus + IRAC input / AI tahlil ── */
  const renderSolving = () => (
    <div className="space-y-6">
      <button
        onClick={reset}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kazuslarga qaytish
      </button>

      {/* KAZUS */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full font-medium">
            {categoryLabel(currentCase!.category)}
          </span>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${difficultyColor(currentCase!.difficulty)}`}
          >
            {difficultyLabel(currentCase!.difficulty)}
          </span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-zinc-100 mb-3">
          {currentCase!.title}
        </h2>
        <div className="p-4 bg-gray-50 dark:bg-zinc-800/60 rounded-xl">
          <p className="text-sm sm:text-base text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {currentCase!.description}
          </p>
        </div>
        {currentCase!.law_references && currentCase!.law_references.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 dark:text-zinc-400">Tegishli:</span>
            {currentCase!.law_references.map((ref, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full"
              >
                {ref}
              </span>
            ))}
          </div>
        )}

        {/* SAVOL */}
        <div className="mt-5 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Savol</p>
          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            {currentCase!.key_questions && currentCase!.key_questions.length > 0
              ? currentCase!.key_questions.join(' ')
              : "Ushbu vaziyatga huquqiy baho bering. Qaysi qonun normalari qo'llaniladi va qanday qaror qabul qilinishi kerak?"}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* AI REJIMI */}
      {mode === 'ai_solves' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-800 dark:text-zinc-100">AI IRAC tahlili</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
            AI kazusni o'qib, IRAC metodikasi bo'yicha to'liq tahlil beradi.
          </p>
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

      {/* USER REJIMI */}
      {mode === 'user_solves' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
          <h3 className="font-bold text-gray-800 dark:text-zinc-100 mb-1">Sizning tahlilingiz</h3>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mb-5">
            IRAC bo'yicha javobingizni yozing — AI ball bilan baholaydi.
          </p>

          <div className="space-y-4">
            {SECTIONS.map(s => {
              const styles = COLOR_STYLES[s.color]
              return (
                <div key={s.id} className={`border rounded-xl ${styles.header}`}>
                  <div className={`flex items-center justify-between px-4 py-3 ${styles.text}`}>
                    <div className="flex items-center gap-2">
                      {s.icon}
                      <div>
                        <span className="font-bold text-sm">{s.title}</span>
                        <p className="text-xs opacity-70">{s.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium opacity-60">{s.maxScore} ball</span>
                  </div>
                  <div className="px-4 pb-4">
                    <textarea
                      value={userAnswers[s.id]}
                      onChange={e => setUserAnswers({ ...userAnswers, [s.id]: e.target.value })}
                      placeholder={s.placeholder}
                      className="w-full h-28 p-3 border border-gray-200 dark:border-zinc-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={evaluateWithAI}
            disabled={evalLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 font-medium mt-5"
          >
            {evalLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI baholamoqda...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Javobni tekshirish
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )

  /* ── RESULT: AI rejimi natijasi ── */
  const renderAiResult = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          AI tahlili tayyor
          <span className="text-sm font-normal text-gray-500 dark:text-zinc-400">
            — Ishonchlilik: {result!.confidence}%
          </span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={pickRandomCase}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            Keyingi kazus
          </button>
          <button
            onClick={() => setScreen('results')}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <History className="w-4 h-4" />
            Natijalarim
          </button>
        </div>
      </div>

      {SECTIONS.map(s => {
        const content = result![s.id]
        if (!content) return null
        const styles = COLOR_STYLES[s.color]
        return (
          <div
            key={s.id}
            className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-sm border ${styles.border}`}
          >
            <div className={`flex items-center gap-2 mb-3 ${styles.text}`}>
              {s.icon}
              <h3 className="font-semibold text-gray-800 dark:text-zinc-100">{s.title}</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          </div>
        )
      })}

      {result!.sources.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-blue-200 dark:border-blue-900">
          <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
            <BookMarked className="w-5 h-5" />
            <h3 className="font-semibold">Tegishli qonun manbalari</h3>
          </div>
          <ul className="space-y-2">
            {result!.sources.map((src, i) => (
              <li key={i} className="text-sm text-gray-700 dark:text-zinc-300">
                <span className="font-medium">{src.title}</span>
                {src.article && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">{src.article}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={saveAnalysis}
          disabled={saved}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60"
        >
          <BookMarked className="w-4 h-4" />
          {saved ? 'Saqlandi ✓' : 'Saqlash'}
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Bosh sahifa
        </button>
      </div>
    </div>
  )

  /* ── RESULT: baholash natijasi ── */
  const renderEvaluation = () => {
    const score = evaluation!.score ?? evaluation!.confidence
    const sectionScores = evaluation!.sectionScores
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Natija
          </h2>
          <div className="flex gap-2">
            <button
              onClick={pickRandomCase}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              Keyingi kazus
            </button>
            <button
              onClick={() => setScreen('results')}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <History className="w-4 h-4" />
              Natijalarim
            </button>
          </div>
        </div>

        {/* Umumiy ball */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-amber-200 dark:border-amber-900">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Award className="w-5 h-5" />
              <h3 className="font-semibold">Umumiy ball</h3>
            </div>
            <div className="text-4xl font-bold text-gray-800 dark:text-zinc-100">
              {score}
              <span className="text-base font-medium text-gray-400 ml-1">/ 100</span>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-6">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, Math.max(0, score))}%`,
                background:
                  score >= 70
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : score >= 40
                      ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                      : 'linear-gradient(90deg, #ef4444, #dc2626)',
              }}
            />
          </div>

          {/* Bo'limlar bo'yicha ballar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SECTIONS.map(s => {
              const val = sectionScores?.[s.id]
              const max = SECTION_MAX[s.id]
              const pct = val != null ? (val / max) * 100 : null
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30 p-3"
                >
                  <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400">
                    {s.title}
                  </p>
                  <p className="text-lg font-bold text-gray-800 dark:text-zinc-100 mt-0.5">
                    {val ?? '—'}
                    <span className="text-xs font-normal text-gray-400">/{max}</span>
                  </p>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct ?? 0}%`,
                        background:
                          pct == null
                            ? '#d1d5db'
                            : pct >= 70
                              ? '#22c55e'
                              : pct >= 40
                                ? '#f59e0b'
                                : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Kuchli tomonlar */}
        {evaluation!.strengths && evaluation!.strengths.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-2 mb-3 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-semibold">To'g'ri bajarganlaringiz</h3>
            </div>
            <ul className="space-y-2">
              {evaluation!.strengths.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-zinc-300"
                >
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Xatolar */}
        {evaluation!.weaknesses && evaluation!.weaknesses.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-red-200 dark:border-red-900">
            <div className="flex items-center gap-2 mb-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold">Xatolar</h3>
            </div>
            <ul className="space-y-2">
              {evaluation!.weaknesses.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-gray-700 dark:text-zinc-300"
                >
                  <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Takomillashtirish */}
        {(evaluation!.feedback ||
          (evaluation!.suggestions && evaluation!.suggestions.length > 0)) && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-blue-200 dark:border-blue-900">
            <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
              <Lightbulb className="w-5 h-5" />
              <h3 className="font-semibold">Takomillashtirish kerak bo'lgan joylar</h3>
            </div>
            {evaluation!.feedback && (
              <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed mb-3">
                {evaluation!.feedback}
              </p>
            )}
            {evaluation!.suggestions && evaluation!.suggestions.length > 0 && (
              <ul className="space-y-2">
                {evaluation!.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-zinc-300"
                  >
                    <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Qonun manbalari */}
        {evaluation!.sources.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-blue-200 dark:border-blue-900">
            <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
              <BookMarked className="w-5 h-5" />
              <h3 className="font-semibold">Tegishli qonun moddalari</h3>
            </div>
            <ul className="space-y-2">
              {evaluation!.sources.map((src, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-zinc-300">
                  <span className="font-medium">{src.title}</span>
                  {src.article && (
                    <span className="ml-2 text-blue-600 dark:text-blue-400">{src.article}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* To'g'ri javob */}
        {SECTIONS.some(s => evaluation![s.id]) && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200 dark:border-zinc-700">
            <h3 className="font-semibold text-gray-800 dark:text-zinc-100 mb-4">To'g'ri javob</h3>
            <div className="space-y-3">
              {SECTIONS.map(s => {
                if (!evaluation![s.id]) return null
                const styles = COLOR_STYLES[s.color]
                return (
                  <div key={s.id} className={`border rounded-xl ${styles.header} p-3`}>
                    <div className={`flex items-center gap-2 mb-1 ${styles.text}`}>
                      {s.icon}
                      <span className="font-semibold text-sm">{s.title}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {evaluation![s.id]}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 mobile-safe-top">
      <LimitExceededModal {...modalProps} onUpgrade={() => router.push('/premium')} />
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

        <div className="flex-1 min-w-0">
          {/* Header */}
          <header className="bg-white dark:bg-zinc-900 px-4 sm:px-8 py-5 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">
                  Kazus Yechish
                </h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                  Huquqiy vaziyatlarni tahlil qiling va IRAC asosida o'z javobingizni ishlab
                  chiqing.
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

          <main className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
            {/* ADMIN: yechilayotgan kazus bo'lmaganda boshqaruv */}
            {isAdmin && showAllCases && !currentCase && !result && !evaluation && (
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
                          {categoryLabel(c.category)} · {difficultyLabel(c.difficulty)} ·{' '}
                          {c.is_active ? '✅ Faol' : '❌ Nofaol'}
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

            {/* ADMIN: yangi kazus qo'shish */}
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

            {/* ═══ EKRANLAR ═══ */}
            {!currentCase && !result && !evaluation && screen === 'library' && renderLibrary()}
            {!currentCase && !result && !evaluation && screen === 'results' && renderResults()}
            {!currentCase && !result && !evaluation && screen === 'home' && renderHome()}

            {currentCase && !result && !evaluation && renderSolving()}

            {result && renderAiResult()}
            {evaluation && renderEvaluation()}
          </main>
        </div>
      </div>
    </div>
  )
}
