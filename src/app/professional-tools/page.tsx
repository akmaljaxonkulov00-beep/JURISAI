'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calculator,
  FileText,
  Shield,
  TrendingUp,
  Search,
  History,
  Sparkles,
  BookOpen,
  Scale,
  Clock,
  Compass,
  GraduationCap,
} from 'lucide-react'
import FeatureInstructions from '@/components/ui/FeatureInstructions'
import LegalCalculatorsWorkspace from '@/components/tools/LegalCalculatorsWorkspace'
import DocumentConstructorWorkspace from '@/components/tools/DocumentConstructorWorkspace'
import RiskAssessmentWorkspace from '@/components/tools/RiskAssessmentWorkspace'
import CourtPracticeWorkspace from '@/components/tools/CourtPracticeWorkspace'
import LegalResearchWorkspace from '@/components/tools/LegalResearchWorkspace'
import DeadlinesWorkspace from '@/components/tools/DeadlinesWorkspace'
import ToolsHistoryDrawer from '@/components/tools/ToolsHistoryDrawer'

const INSTRUCTIONS = [
  {
    title: 'Kerakli vositani tanlang',
    description:
      'Kalkulyatorlar, hujjatlar konstruktori, risk skaneri, sud amaliyoti, huquqiy tadqiqot yoki muddatlar vositasini tanlang.',
    icon: '🧰',
  },
  {
    title: 'Parametrlarni kiriting',
    description:
      'Barcha hisob-kitoblar va tahlillar O‘zbekiston Respublikasining 2026-yilgi amaldagi rasmiy qonunchiligiga asoslanadi.',
    icon: '⚙️',
  },
  {
    title: 'Natijalarni oling va yuklab oling',
    description: 'Nusxalang, PDF yoki DOCX formatida eksport qiling va tarixda saqlang.',
    icon: '📄',
  },
]

const TIPS = [
  'Davlat boji kalkulyatori O‘RQ-600-son Qonunning barcha ilovalarini to‘liq hisoblaydi',
  'Shartnomani tekshirib, undagi xavfli bandlar va ziddiyatlarni oldindan aniqlang',
  'Sud amaliyoti tahlilida Oliy Sud Plenum qarorlariga rasmiy havolalar keltiriladi',
]

export default function ProfessionalToolsPage() {
  const router = useRouter()
  const [activeTool, setActiveTool] = useState<
    'calculator' | 'document' | 'risk' | 'court' | 'research' | 'deadlines'
  >('calculator')
  const [taskSearch, setTaskSearch] = useState('')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Smart search filter: maps user query to appropriate tool
  const handleTaskSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = taskSearch.toLowerCase()
    if (
      q.includes('boj') ||
      q.includes('penya') ||
      q.includes('hisob') ||
      q.includes('bhm') ||
      q.includes('foiz') ||
      q.includes('zarar') ||
      q.includes('jarima')
    ) {
      setActiveTool('calculator')
    } else if (
      q.includes('shartnoma') ||
      q.includes('hujjat') ||
      q.includes('ariza') ||
      q.includes('shablon')
    ) {
      setActiveTool('document')
    } else if (
      q.includes('risk') ||
      q.includes('xavf') ||
      q.includes('tekshir') ||
      q.includes('audit')
    ) {
      setActiveTool('risk')
    } else if (
      q.includes('sud') ||
      q.includes('plenum') ||
      q.includes('qaror') ||
      q.includes('pretsedent')
    ) {
      setActiveTool('court')
    } else if (
      q.includes('tadqiqot') ||
      q.includes('qonun') ||
      q.includes('lex') ||
      q.includes('manba')
    ) {
      setActiveTool('research')
    } else if (q.includes('muddat') || q.includes('sana') || q.includes('kun')) {
      setActiveTool('deadlines')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col select-none">
      <FeatureInstructions featureName="Asboblar" steps={INSTRUCTIONS} tips={TIPS} />

      {/* Top Header */}
      <header className="h-16 px-4 sm:px-6 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            title="Bosh sahifaga qaytish"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                Asboblar
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                  2026 Amalda • Lex.uz
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Rasmiy qonunchilik va Oliy Sud amaliyotiga asoslangan LegalTech vositalar markazi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/scenario-generator')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition-colors"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Senariy Generator</span>
          </button>

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
          >
            <History className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Tarix</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Search & Tool Switcher Bar */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
          <form onSubmit={handleTaskSearch} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={taskSearch}
              onChange={e => setTaskSearch(e.target.value)}
              placeholder="Qaysi huquqiy vazifani bajarmoqchisiz? (masalan: davlat bojini hisoblash, da'vo arizasi yaratish, shartnoma riskini tahlil qilish, muddatlar)..."
              className="w-full pl-11 pr-24 py-3 text-xs sm:text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Topish
            </button>
          </form>

          {/* 6 Tool Navigation Cards + Direct links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              {
                id: 'calculator',
                title: 'Kalkulyatorlar',
                desc: 'Davlat boji, penya, FK 327 foizlari, zarar, jarima va BHM',
                icon: Calculator,
                badge: 'O‘RQ-600 / FK',
              },
              {
                id: 'document',
                title: 'Hujjatlar',
                desc: 'Rasmiy da‘vo, ariza, mehnat va shartnoma shablonlari',
                icon: FileText,
                badge: 'Rasmiy Shablonlar',
              },
              {
                id: 'risk',
                title: 'Risk Assessment',
                desc: 'Shartnomalardagi huquqiy xavflar va noaniqliklar auditi',
                icon: Shield,
                badge: 'Audit & Compliance',
              },
              {
                id: 'court',
                title: 'Sud Amaliyoti',
                desc: 'Oliy Sud Plenum qarorlari va pretsedentlar bazasi',
                icon: TrendingUp,
                badge: 'Plenum Qarorlari',
              },
              {
                id: 'research',
                title: 'Huquqiy Tadqiqot',
                desc: 'LexUZ va Oliy Sudning tasdiqlangan rasmiy manbalari',
                icon: BookOpen,
                badge: 'Lex.uz Tasdiqlangan',
              },
              {
                id: 'deadlines',
                title: 'Muddatlar',
                desc: 'Protsessual, apellyatsiya va umumiy da‘vo muddatlari',
                icon: Clock,
                badge: 'FPK / IPK / MK',
              },
            ].map(card => {
              const Icon = card.icon
              const isSelected = activeTool === card.id
              return (
                <div
                  key={card.id}
                  onClick={() => setActiveTool(card.id as typeof activeTool)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500 dark:border-blue-600 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                      {card.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-xs text-slate-800 dark:text-zinc-100 mb-0.5">
                      {card.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-snug">
                      {card.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Tool Workspace */}
        <div className="animate-in fade-in duration-200">
          {activeTool === 'calculator' && <LegalCalculatorsWorkspace />}
          {activeTool === 'document' && <DocumentConstructorWorkspace />}
          {activeTool === 'risk' && <RiskAssessmentWorkspace />}
          {activeTool === 'court' && <CourtPracticeWorkspace />}
          {activeTool === 'research' && <LegalResearchWorkspace />}
          {activeTool === 'deadlines' && <DeadlinesWorkspace />}
        </div>
      </main>

      {/* Unified Tool History Drawer */}
      <ToolsHistoryDrawer isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  )
}
