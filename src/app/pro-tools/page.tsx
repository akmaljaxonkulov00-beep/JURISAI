'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getUserIdentityPayload } from '@/lib/client-user'
import {
  Wrench,
  Calculator,
  FileText,
  Search,
  Download,
  Upload,
  Clock,
  TrendingUp,
  Shield,
  Database,
  Settings,
  BookOpen,
  Target,
  Zap,
  X,
  FileCheck,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Scale,
  Heart,
  Home,
  Briefcase,
  FileSignature,
  UserCheck,
  Users,
  Landmark,
  FileSpreadsheet,
  HelpCircle,
  Percent,
  PiggyBank,
} from 'lucide-react'
import Link from 'next/link'
import { CODE_DISPLAY_NAMES } from '@/data/legal-codes'
import DocumentTemplates from '@/components/features/DocumentTemplates'

// ── Type ──────────────────────────────────────────────────────────────

type CalcResult = { result: string; details: string[] }

// ── Calculator Functions ──────────────────────────────────────────────

const BHM = 300000 // Base calculation unit in UZS

function calcStateFee(amount: number): CalcResult {
  let fee = 0
  if (amount <= 1000000) fee = amount * 0.05
  else if (amount <= 5000000) fee = 50000 + (amount - 1000000) * 0.04
  else if (amount <= 10000000) fee = 210000 + (amount - 5000000) * 0.03
  else if (amount <= 50000000) fee = 360000 + (amount - 10000000) * 0.02
  else fee = 1160000 + (amount - 50000000) * 0.01
  fee = Math.min(fee, amount * 0.15)
  return {
    result: `${Math.round(fee).toLocaleString()} UZS`,
    details: [
      `Da'vo summasi: ${amount.toLocaleString()} UZS`,
      `Boj stavkasi: ${fee > 0 ? ((fee / amount) * 100).toFixed(2) : '0'}%`,
      `Hisoblangan boj: ${Math.round(fee).toLocaleString()} UZS`,
    ],
  }
}

function calcPenya(amount: number, days: number, rate: number = 0.03): CalcResult {
  const daily = amount * (rate / 100)
  const total = daily * days
  return {
    result: `${Math.round(total).toLocaleString()} UZS`,
    details: [
      `Qarz miqdori: ${amount.toLocaleString()} UZS`,
      `Kechikish: ${days} kun`,
      `Kunlik stavka: ${rate}%`,
      `Kunlik penya: ${Math.round(daily).toLocaleString()} UZS`,
      `Jami penya: ${Math.round(total).toLocaleString()} UZS`,
    ],
  }
}

function calcAliment(income: number, children: number): CalcResult {
  const rates: Record<number, number> = { 1: 0.25, 2: 0.33, 3: 0.5 }
  const rate = Math.min(children, 3)
  const percent = rates[rate] || 0.5
  const monthly = income * percent
  const minA = BHM * 0.5
  const maxA = BHM * 5
  const final = Math.max(Math.min(monthly, maxA), minA)
  return {
    result: `${Math.round(final).toLocaleString()} UZS/oy`,
    details: [
      `Daromad: ${income.toLocaleString()} UZS`,
      `Farzandlar: ${children} ta`,
      `Ulush: ${(percent * 100).toFixed(0)}%`,
      `Min: ${minA.toLocaleString()} UZS/oy`,
      `Max: ${maxA.toLocaleString()} UZS/oy`,
    ],
  }
}

function calcPension(income: number, years: number): CalcResult {
  const base = BHM * 0.55
  const expBonus = Math.max(0, years - 10) * 0.01
  const incomePct = income * 0.4
  const total = Math.max(base + BHM * expBonus, Math.min(incomePct, BHM * 10))
  return {
    result: `${Math.round(total).toLocaleString()} UZS`,
    details: [
      `O'rtacha oylik: ${income.toLocaleString()} UZS`,
      `Ish staji: ${years} yil`,
      `Bazaviy: ${Math.round(base).toLocaleString()} UZS`,
      `Staj bonusi: ${Math.round(BHM * expBonus).toLocaleString()} UZS`,
    ],
  }
}

function calcCompensation(type: string, amount: number, income: number): CalcResult {
  const multMap: Record<string, number> = { Moddiy: 1.0, Axloqiy: 0.5, Moral: 0.3 }
  const mult = multMap[type] || 1.0
  const total = (amount || 0) * mult + (income || 0) * 30
  return {
    result: `${Math.round(total).toLocaleString()} UZS`,
    details: [
      `Zarar turi: ${type}`,
      `Asosiy: ${Math.round((amount || 0) * mult).toLocaleString()} UZS`,
      `Yo'qotilgan daromad: ${Math.round((income || 0) * 30).toLocaleString()} UZS`,
    ],
  }
}

function calcDeadline(date: string, type: string): CalcResult {
  const daysMap: Record<string, number> = {
    "Da'vo berish": 30,
    Apellyatsiya: 20,
    Kassatsiya: 30,
    Nazorat: 365,
    'Sud qarori': 10,
    'Ijro muddati': 365,
    'Meros olish': 180,
    Shartnoma: 30,
  }
  const d = daysMap[type] || 30
  const end = new Date(date)
  end.setDate(end.getDate() + d)
  const rem = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000))
  return {
    result: end.toLocaleDateString('uz-UZ'),
    details: [
      `Boshlang'ich: ${new Date(date).toLocaleDateString('uz-UZ')}`,
      `Muddat: ${d} kun`,
      `Oxirgi kun: ${end.toLocaleDateString('uz-UZ')}`,
      `Qolgan: ${rem} kun (${Math.ceil(rem / 30)} oy)`,
    ],
  }
}

// ── Code Display Names ────────────────────────────────────────────────

const CODE_FILTERS = [
  { id: '', label: 'Barchasi' },
  { id: 'constitution', label: CODE_DISPLAY_NAMES['constitution'] || 'Konstitutsiya' },
  { id: 'criminal_code', label: CODE_DISPLAY_NAMES['criminal_code'] || 'Jinoyat Kodeksi' },
  { id: 'civil_code', label: CODE_DISPLAY_NAMES['civil_code'] || 'Fuqarolik Kodeksi' },
  { id: 'labor_code', label: CODE_DISPLAY_NAMES['labor_code'] || 'Mehnat Kodeksi' },
  { id: 'family_code', label: CODE_DISPLAY_NAMES['family_code'] || 'Oila Kodeksi' },
  { id: 'land_code', label: CODE_DISPLAY_NAMES['land_code'] || 'Yer Kodeksi' },
  { id: 'tax_code', label: CODE_DISPLAY_NAMES['tax_code'] || 'Soliq Kodeksi' },
]

// ═══════════════════════════════════════════════════════════════════════
//  Import REAL document templates — the TEMPLATE_GROUPS below are
//  no longer used. See DocumentTemplates.tsx component instead.
// ═══════════════════════════════════════════════════════════════════════

// ── Tool Definitions ──────────────────────────────────────────────────

type Tab = 'calc' | 'doc' | 'search' | 'templates' | 'cases' | 'deadline'

const TOOLS: { id: Tab; n: string; icon: React.ReactNode; d: string; c: string; cat: string }[] = [
  {
    id: 'calc',
    n: 'Huquqiy kalkulyator',
    icon: <Calculator className="w-6 h-6" />,
    d: 'Jarima, boj, aliment va pensiya hisoblash',
    c: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    cat: 'Hisob-kitob',
  },
  {
    id: 'doc',
    n: 'Hujjat tahlili',
    icon: <FileText className="w-6 h-6" />,
    d: 'Hujjatlarni AI tahlili',
    c: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    cat: 'Tahlil',
  },
  {
    id: 'search',
    n: 'Qonun qidiruvi',
    icon: <Search className="w-6 h-6" />,
    d: 'Qonunlarda tezkor qidiruv',
    c: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    cat: 'Qidiruv',
  },
  {
    id: 'templates',
    n: 'Namunalar',
    icon: <Download className="w-6 h-6" />,
    d: '30+ hujjat namunalari',
    c: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
    cat: 'Yaratish',
  },
  {
    id: 'cases',
    n: 'Case kuzatuv',
    icon: <Clock className="w-6 h-6" />,
    d: 'Case holatini kuzatish',
    c: 'bg-red-100 dark:bg-red-900/30 text-red-600',
    cat: 'Kuzatuv',
  },
  {
    id: 'deadline',
    n: 'Muddat hisoblash',
    icon: <Target className="w-6 h-6" />,
    d: 'Sud va hujjat muddatlari',
    c: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
    cat: 'Eslatma',
  },
]

// ── Component ─────────────────────────────────────────────────────────

export default function ProTools() {
  const [tab, setTab] = useState<Tab>('calc')
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null)
  const [calcLoading, setCalcLoading] = useState(false)

  // Document analyzer
  const [file, setFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Legal search
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<
    Array<{
      code_id?: string
      article_number?: string
      title?: string
      content?: string
      code_name?: string
    }>
  >([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchRun, setSearchRun] = useState(false)
  const [codeFilter, setCodeFilter] = useState('')
  const [searchError, setSearchError] = useState('')

  // Calculator forms
  const [calcType, setCalcType] = useState<'fee' | 'penya' | 'aliment' | 'pension' | 'comp'>('fee')
  const [feeAmount, setFeeAmount] = useState(5000000)
  const [penyaAmount, setPenyaAmount] = useState(10000000)
  const [penyaDays, setPenyaDays] = useState(30)
  const [penyaRate, setPenyaRate] = useState(0.03)
  const [alimentIncome, setAlimentIncome] = useState(3000000)
  const [alimentChildren, setAlimentChildren] = useState(2)
  const [pensionIncome, setPensionIncome] = useState(3000000)
  const [pensionYears, setPensionYears] = useState(15)
  const [compType, setCompType] = useState('Moddiy')
  const [compAmount, setCompAmount] = useState(1000000)
  const [compIncome, setCompIncome] = useState(50000)

  // Deadline
  const [dlForm, setDlForm] = useState({ date: '', type: '' })
  const [dlResult, setDlResult] = useState<CalcResult | null>(null)
  const [dlLoading, setDlLoading] = useState(false)

  const doCalc = (fn: () => void) => {
    setCalcLoading(true)
    setTimeout(() => {
      fn()
      setCalcLoading(false)
    }, 100)
  }

  // ── Search via Supabase API ─────────────────────────────────────────

  const doSearch = useCallback(async () => {
    if (!query.trim()) return
    setSearchLoading(true)
    setSearchRun(true)
    setSearchError('')
    try {
      const params = new URLSearchParams({ q: query.trim() })
      if (codeFilter) params.set('code_id', codeFilter)
      params.set('limit', '20')
      const res = await fetch(`/api/legal/articles/search?${params}`)
      if (!res.ok) throw new Error('API xatosi')
      const data = await res.json()
      if (data.success) {
        setSearchResults(data.articles || [])
      } else {
        setSearchError(data.error || 'Qidirishda xatolik')
        setSearchResults([])
      }
    } catch {
      setSearchError("Serverga ulanishda xatolik. Iltimos qayta urinib ko'ring.")
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [query, codeFilter])

  // ── Document Analysis ───────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setAnalysisLoading(true)
    setAnalysis(null)
    try {
      const text = await f.text()
      const response = await fetch('/api/ai/document-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: text,
          documentType: f.name.split('.').pop() || 'unknown',
          ...getUserIdentityPayload(),
        }),
      })
      if (response.ok) {
        const result = await response.json()
        setAnalysis(result.analysis || 'Tahlil natijasi olinmadi.')
      } else {
        const wordCount = text.split(/\s+/).length
        setAnalysis(
          `📄 Hujjat tahlili:\n` +
            `  • Tur: ${f.name.split('.').pop()?.toUpperCase() || 'Nomaʼlum'}\n` +
            `  • Hajm: ${f.size > 1024 ? (f.size / 1024).toFixed(1) + ' KB' : f.size + ' B'}\n` +
            `  • So'zlar soni: ${wordCount.toLocaleString()}\n\n` +
            `Tavsiyalar:\n` +
            `  • Huquqiy jihatdan tekshirish tavsiya etiladi\n` +
            `  • Muhim shartlarni belgilang\n` +
            `  • Nizolarni hal qilish tartibini kiriting`
        )
      }
    } catch {
      setAnalysis('❌ Hujjat tahlilida xatolik yuz berdi.')
    } finally {
      setAnalysisLoading(false)
    }
  }

  // ── Calc Results ────────────────────────────────────────────────────

  const calcResultBlock = calcResult ? (
    <div className="p-5 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-900 dark:text-white">Natija:</h3>
        <button
          onClick={() => setCalcResult(null)}
          className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{calcResult.result}</p>
      <div className="mt-2 space-y-0.5">
        {calcResult.details.map((d, i) => (
          <p key={i} className="text-xs text-gray-600 dark:text-zinc-400">
            {d}
          </p>
        ))}
      </div>
    </div>
  ) : null

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 mobile-safe-top">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm mr-4">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Professional Asboblar</h1>
              <p className="text-white/90">Huquqshunoslar uchun maxsus asboblar to'plami</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tool Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {TOOLS.map(t => (
            <div
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`bg-white dark:bg-zinc-900 rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg border border-gray-200 dark:border-zinc-800 ${tab === t.id ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${t.c}`}>{t.icon}</div>
                <Badge variant="outline">{t.cat}</Badge>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t.n}</h3>
              <p className="text-gray-500 dark:text-zinc-400 text-sm">{t.d}</p>
            </div>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-200 dark:border-zinc-800">
          <div className="border-b border-gray-200 dark:border-zinc-800 mb-6 overflow-x-auto">
            <nav className="flex space-x-6 min-w-max">
              {TOOLS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                    tab === t.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
                  }`}
                >
                  {t.n}
                </button>
              ))}
            </nav>
          </div>

          {/* ════════════════ CALCULATOR ════════════════ */}
          {tab === 'calc' && (
            <div className="space-y-6">
              {calcResultBlock}

              {/* Calculator type selector */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'fee', label: 'Davlat boji', icon: <DollarSign className="w-4 h-4" /> },
                  { id: 'penya', label: 'Penya', icon: <Percent className="w-4 h-4" /> },
                  { id: 'aliment', label: 'Aliment', icon: <Heart className="w-4 h-4" /> },
                  { id: 'pension', label: 'Pensiya', icon: <PiggyBank className="w-4 h-4" /> },
                  { id: 'comp', label: 'Tovon', icon: <Shield className="w-4 h-4" /> },
                ].map(ct => (
                  <button
                    key={ct.id}
                    onClick={() => {
                      setCalcType(ct.id as Parameters<typeof setCalcType>[0])
                      setCalcResult(null)
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                      calcType === ct.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {ct.icon} {ct.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Davlat Boji */}
                {calcType === 'fee' && (
                  <Card className="col-span-1 md:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">
                        Davlat boji hisoblash
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-zinc-400 mb-1">
                          Da'vo summasi (so'm)
                        </label>
                        <input
                          type="number"
                          value={feeAmount}
                          onChange={e => setFeeAmount(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <Button
                        onClick={() => doCalc(() => setCalcResult(calcStateFee(feeAmount)))}
                        disabled={calcLoading || feeAmount <= 0}
                        className="w-full"
                      >
                        {calcLoading ? 'Hisoblanmoqda...' : 'Hisoblash'}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Penya */}
                {calcType === 'penya' && (
                  <Card className="col-span-1 md:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">
                        Penya hisoblash
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-zinc-400 mb-1">
                          Qarz miqdori (so'm)
                        </label>
                        <input
                          type="number"
                          value={penyaAmount}
                          onChange={e => setPenyaAmount(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-zinc-400 mb-1">
                          Kechikish (kun)
                        </label>
                        <input
                          type="number"
                          value={penyaDays}
                          onChange={e => setPenyaDays(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-zinc-400 mb-1">
                          Kunlik stavka (%)
                        </label>
                        <input
                          type="number"
                          value={penyaRate}
                          onChange={e => setPenyaRate(Number(e.target.value))}
                          step="0.01"
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Button
                          onClick={() =>
                            doCalc(() =>
                              setCalcResult(calcPenya(penyaAmount, penyaDays, penyaRate))
                            )
                          }
                          disabled={calcLoading || penyaAmount <= 0}
                          className="w-full"
                        >
                          {calcLoading ? 'Hisoblanmoqda...' : 'Hisoblash'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Aliment */}
                {calcType === 'aliment' && (
                  <Card className="col-span-1 md:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">
                        Aliment hisoblash
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-zinc-400 mb-1">
                          Oylik daromad (so'm)
                        </label>
                        <input
                          type="number"
                          value={alimentIncome}
                          onChange={e => setAlimentIncome(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-zinc-400 mb-1">
                          Farzandlar soni
                        </label>
                        <select
                          value={alimentChildren}
                          onChange={e => setAlimentChildren(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                        >
                          {[1, 2, 3, 4, 5].map(n => (
                            <option key={n} value={n}>
                              {n} ta
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <Button
                          onClick={() =>
                            doCalc(() => setCalcResult(calcAliment(alimentIncome, alimentChildren)))
                          }
                          disabled={calcLoading || alimentIncome <= 0}
                          className="w-full"
                        >
                          {calcLoading ? 'Hisoblanmoqda...' : 'Hisoblash'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pensiya */}
                {calcType === 'pension' && (
                  <Card className="col-span-1 md:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">
                        Pensiya hisoblash
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-zinc-400 mb-1">
                          O'rtacha oylik (so'm)
                        </label>
                        <input
                          type="number"
                          value={pensionIncome}
                          onChange={e => setPensionIncome(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-zinc-400 mb-1">
                          Ish staji (yil)
                        </label>
                        <input
                          type="number"
                          value={pensionYears}
                          onChange={e => setPensionYears(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button
                          onClick={() =>
                            doCalc(() => setCalcResult(calcPension(pensionIncome, pensionYears)))
                          }
                          disabled={calcLoading || pensionIncome <= 0}
                          className="w-full"
                        >
                          {calcLoading ? 'Hisoblanmoqda...' : 'Hisoblash'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tovon */}
                {calcType === 'comp' && (
                  <Card className="col-span-1 md:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-white">
                        Tovon hisoblash
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-zinc-400 mb-1">
                          Zarar turi
                        </label>
                        <select
                          value={compType}
                          onChange={e => setCompType(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                        >
                          <option value="Moddiy">Moddiy</option>
                          <option value="Axloqiy">Axloqiy</option>
                          <option value="Moral">Moral</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-zinc-400 mb-1">
                          Zarar miqdori (so'm)
                        </label>
                        <input
                          type="number"
                          value={compAmount}
                          onChange={e => setCompAmount(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-zinc-400 mb-1">
                          Kunlik daromad (so'm)
                        </label>
                        <input
                          type="number"
                          value={compIncome}
                          onChange={e => setCompIncome(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Button
                          onClick={() =>
                            doCalc(() =>
                              setCalcResult(calcCompensation(compType, compAmount, compIncome))
                            )
                          }
                          disabled={calcLoading}
                          className="w-full"
                        >
                          {calcLoading ? 'Hisoblanmoqda...' : 'Hisoblash'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* ════════════════ DOCUMENT ANALYZER ════════════════ */}
          {tab === 'doc' && (
            <div className="space-y-6">
              <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">
                    Hujjatni AI tahlili
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Hujjatni yuklang (PDF, DOC, TXT) — AI xatolarni topadi va tavsiyalar beradi
                  </p>
                </CardHeader>
                <CardContent>
                  <div
                    onClick={() => inputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Upload className="w-12 h-12 text-gray-400 dark:text-zinc-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-zinc-400 mb-2">
                      {file ? file.name : 'Hujjatni yuklash uchun bosing'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mb-4">
                      PDF, DOC, DOCX, TXT (10 MB gacha)
                    </p>
                    <Button
                      variant={file ? 'default' : 'outline'}
                      onClick={() => inputRef.current?.click()}
                    >
                      {file ? 'Boshqa fayl' : 'Fayl tanlash'}
                    </Button>
                  </div>
                  {analysisLoading && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl text-center text-sm text-gray-500 dark:text-zinc-400">
                      AI tahlil qilmoqda...
                    </div>
                  )}
                  {analysis && !analysisLoading && (
                    <div className="mt-6 p-5 bg-gray-50 dark:bg-zinc-800/50 rounded-xl whitespace-pre-wrap text-sm text-gray-800 dark:text-zinc-200 leading-relaxed">
                      {analysis}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ════════════════ LEGAL SEARCH ════════════════ */}
          {tab === 'search' && (
            <div className="space-y-6">
              <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
                      <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && doSearch()}
                        placeholder="Qonun, modda yoki kalit so'z..."
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <Button
                      onClick={doSearch}
                      disabled={!query.trim() || searchLoading}
                      className="flex items-center gap-2"
                    >
                      {searchLoading ? (
                        'Qidirilmoqda...'
                      ) : (
                        <>
                          <Search className="w-4 h-4" /> Qidirish
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Code filter */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {CODE_FILTERS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => {
                          setCodeFilter(f.id)
                          setSearchRun(false)
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          codeFilter === f.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {searchRun && (
                <div className="space-y-3">
                  {searchLoading ? (
                    <div className="text-center py-8 text-gray-500 dark:text-zinc-400">
                      Supabase'dan qidirilmoqda...
                    </div>
                  ) : searchError ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-orange-400" />
                      <p className="text-gray-500 dark:text-zinc-400">{searchError}</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">
                        {searchResults.length} ta natija (Supabase)
                      </p>
                      {searchResults.map(
                        (
                          item: {
                            code_id?: string
                            article_number?: string
                            title?: string
                            content?: string
                            code_name?: string
                          },
                          i: number
                        ) => (
                          <Link
                            key={i}
                            href={`/qonunlar?code_id=${item.code_id}&article=${item.article_number}`}
                            className="block bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-sm"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-[10px]">
                                {CODE_DISPLAY_NAMES[item.code_id || ''] ||
                                  item.code_name ||
                                  item.code_id ||
                                  ''}
                              </Badge>
                              <span className="font-medium text-sm text-gray-900 dark:text-white">
                                {item.article_number}-modda
                              </span>
                            </div>
                            {item.title && (
                              <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                                {item.title}
                              </p>
                            )}
                            <div
                              className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-3"
                              dangerouslySetInnerHTML={{ __html: item.content || '' }}
                            />
                          </Link>
                        )
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Search className="w-10 h-10 mx-auto mb-2 opacity-40 text-gray-400" />
                      <p className="text-gray-500 dark:text-zinc-400">
                        Hech qanday natija topilmadi
                      </p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                        Boshqa kalit so'z bilan urinib ko'ring
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════════════════ TEMPLATES — REAL DOCUMENTS ════════════════ */}
          {tab === 'templates' && <DocumentTemplates />}

          {/* ════════════════ CASE TRACKER ════════════════ */}
          {tab === 'cases' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Case kuzatuv tizimi
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Hozircha case lar mavjud emas. Yangi case qo'shish uchun IRAC huquqiy tahlil
                  sahifasidan foydalaning.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Jarayonda',
                    value: 0,
                    color: 'text-blue-600 dark:text-blue-400',
                    icon: <Clock className="w-5 h-5" />,
                  },
                  {
                    label: 'Tugatilgan',
                    value: 0,
                    color: 'text-green-600 dark:text-green-400',
                    icon: <CheckCircle className="w-5 h-5" />,
                  },
                  {
                    label: 'Yangi',
                    value: 0,
                    color: 'text-orange-600 dark:text-orange-400',
                    icon: <FileText className="w-5 h-5" />,
                  },
                ].map(s => (
                  <div
                    key={s.label}
                    className="p-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl text-center"
                  >
                    <div className={`flex justify-center mb-2 ${s.color}`}>{s.icon}</div>
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════ DEADLINE ════════════════ */}
          {tab === 'deadline' && (
            <div className="space-y-6">
              {dlResult && (
                <div className="p-5 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Natija:</h3>
                  <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    Oxirgi kun: {dlResult.result}
                  </p>
                  <div className="mt-2 space-y-0.5">
                    {dlResult.details.map((d, i) => (
                      <p key={i} className="text-xs text-gray-600 dark:text-zinc-400">
                        {d}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Calendar className="w-5 h-5 text-yellow-500" /> Muddat hisoblash
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-zinc-400 mb-1">
                      Boshlanish sanasi
                    </label>
                    <input
                      type="date"
                      value={dlForm.date}
                      onChange={e => setDlForm({ ...dlForm, date: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-zinc-400 mb-1">
                      Muddat turi
                    </label>
                    <select
                      value={dlForm.type}
                      onChange={e => setDlForm({ ...dlForm, type: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                    >
                      <option value="">Tanlang</option>
                      <option value="Da'vo berish">Da'vo berish muddati (30 kun)</option>
                      <option value="Apellyatsiya">Apellyatsiya (20 kun)</option>
                      <option value="Kassatsiya">Kassatsiya (30 kun)</option>
                      <option value="Nazorat">Nazorat (1 yil)</option>
                      <option value="Sud qarori">Sud qarori (10 kun)</option>
                      <option value="Ijro muddati">Ijro muddati (1 yil)</option>
                      <option value="Meros olish">Meros olish (6 oy)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      onClick={() => {
                        setDlLoading(true)
                        setTimeout(() => {
                          setDlResult(calcDeadline(dlForm.date, dlForm.type))
                          setDlLoading(false)
                        }, 100)
                      }}
                      disabled={dlLoading || !dlForm.date || !dlForm.type}
                      className="w-full"
                    >
                      {dlLoading ? 'Hisoblanmoqda...' : 'Hisoblash'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Resources */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Qo'shimcha resurslar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                href: '/qonunlar',
                icon: <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
                title: 'Qonunlar bazasi',
                desc: "To'liq qonunlar",
              },
              {
                href: '/help',
                icon: <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />,
                title: "Qo'llanmalar",
                desc: "Yo'riqnoma",
              },
              {
                href: '/profile',
                icon: <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
                title: 'Sozlamalar',
                desc: 'Profil',
              },
              {
                href: '/dashboard',
                icon: <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
                title: 'Bosh sahifa',
                desc: 'Dashboard',
              },
            ].map((r, i) => (
              <Link key={i} href={r.href}>
                <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl hover:shadow-lg transition-all cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg mr-3">
                        {r.icon}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {r.title}
                      </h3>
                    </div>
                    <p className="text-gray-500 dark:text-zinc-400 text-xs mb-4">{r.desc}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      Ochish
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
