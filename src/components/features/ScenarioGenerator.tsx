'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  BookOpen,
  History,
  Scale,
  Award,
  Shield,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Layers,
  FileText,
  UserCheck,
  Check,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  Target,
  GraduationCap,
  Loader2,
} from 'lucide-react'
import {
  ScenarioData,
  ScenarioDomain,
  ScenarioDifficulty,
  ScenarioRole,
  ScenarioObjective,
  UserActionLog,
  ScenarioEvaluation,
  ScenarioSession,
} from '@/types/scenario-generator'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/app/providers'
import { VERIFIED_SCENARIO_TEMPLATES } from '@/lib/scenario-generator-engine'

export default function ScenarioGenerator() {
  const { t } = useLanguage()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<'create' | 'simulation' | 'templates' | 'history'>(
    'create'
  )

  // Builder Form State
  const [domain, setDomain] = useState<ScenarioDomain>('civil')
  const [difficulty, setDifficulty] = useState<ScenarioDifficulty>('intermediate')
  const [role, setRole] = useState<ScenarioRole>('advokat')
  const [objective, setObjective] = useState<ScenarioObjective>('court_practice')
  const [topic, setTopic] = useState('')
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [additionalReqs, setAdditionalReqs] = useState('')

  // Generation & Active Simulation State
  const [isGenerating, setIsGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [currentScenario, setCurrentScenario] = useState<ScenarioData | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [actionLogs, setActionLogs] = useState<UserActionLog[]>([])
  const [evaluation, setEvaluation] = useState<ScenarioEvaluation | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  // History & Templates State
  const [templates, setTemplates] = useState<ScenarioData[]>([])
  const [sessions, setSessions] = useState<ScenarioSession[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyTotal, setHistoryTotal] = useState(0)

  useEffect(() => {
    loadTemplates()
    if (user) {
      loadHistory()
    }
  }, [user])

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/scenario-generator/templates')
      if (res.ok) {
        const data = await res.json()
        if (data.templates && data.templates.length > 0) {
          setTemplates(data.templates)
          return
        }
      }
    } catch {
      // fallback to built-in
    }
    setTemplates(VERIFIED_SCENARIO_TEMPLATES)
  }

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/scenario-generator/sessions?limit=20')
      if (res.ok) {
        const data = await res.json()
        if (data.sessions) {
          setSessions(data.sessions)
          setHistoryTotal(data.total || data.sessions.length)
        }
      }
    } catch (err) {
      console.error('History load error:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const toggleFocusArea = (area: string) => {
    if (focusAreas.includes(area)) {
      setFocusAreas(focusAreas.filter(a => a !== area))
    } else {
      setFocusAreas([...focusAreas, area])
    }
  }

  // Handle Scenario Generation
  const handleGenerateScenario = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setGenError(null)

    try {
      const res = await fetch('/api/scenario-generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          difficulty,
          role,
          objective,
          topic: topic.trim() || '2026-yilgi amaliy huquqiy nizo',
          focus_areas: focusAreas,
          additional_requirements: additionalReqs,
        }),
      })

      const data = await res.json()

      if (res.ok && data.scenario) {
        startSimulation(data.scenario)
      } else {
        setGenError(data.error || 'Senariy yaratishda xatolik yuz berdi. Qayta urinib ko‘ring.')
      }
    } catch {
      setGenError('Server bilan bog‘lanishda xatolik yuz berdi')
    } finally {
      setIsGenerating(false)
    }
  }

  // Start Simulation with a chosen scenario
  const startSimulation = (scenario: ScenarioData) => {
    setCurrentScenario(scenario)
    setCurrentStep(1)
    setActionLogs([])
    setEvaluation(null)
    setActiveTab('simulation')
  }

  // Handle user decision action step
  const handleSelectOption = async (optionId: string) => {
    if (!currentScenario) return

    try {
      const res = await fetch('/api/scenario-generator/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: currentScenario,
          current_step: currentStep,
          chosen_option_id: optionId,
        }),
      })

      const data = await res.json()

      if (res.ok && data.action_log) {
        const updatedLogs = [...actionLogs, data.action_log]
        setActionLogs(updatedLogs)

        if (data.is_completed) {
          finishSimulation(updatedLogs)
        } else {
          setCurrentStep(data.next_step)
        }
      }
    } catch (err) {
      console.error('Step execution error:', err)
    }
  }

  // Finish simulation and compute evaluation
  const finishSimulation = async (finalLogs: UserActionLog[]) => {
    if (!currentScenario) return
    setIsEvaluating(true)

    try {
      const res = await fetch('/api/scenario-generator/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: currentScenario,
          action_logs: finalLogs,
        }),
      })

      const data = await res.json()
      if (res.ok && data.evaluation) {
        setEvaluation(data.evaluation)
        loadHistory()
      }
    } catch (err) {
      console.error('Simulation evaluation error:', err)
    } finally {
      setIsEvaluating(false)
    }
  }

  const currentDecisionPoint = currentScenario?.decision_points?.find(
    dp => dp.step_number === currentStep
  )

  return (
    <div className="space-y-6">
      {/* Navigation Tabs Header */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-2.5 shadow-xs flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Yaratish</span>
          </button>

          <button
            onClick={() => currentScenario && setActiveTab('simulation')}
            disabled={!currentScenario}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'simulation'
                ? 'bg-blue-600 text-white shadow-xs'
                : currentScenario
                  ? 'text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer'
                  : 'text-gray-300 dark:text-zinc-600 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Simulyatsiya</span>
            {currentScenario && !evaluation && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Shablonlar ({templates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Tarix ({sessions.length})</span>
          </button>
        </div>

        <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200/50">
          <Scale className="w-3.5 h-3.5" /> 2026 Qonunchilik
        </span>
      </div>

      {/* ── 1. BUILDER TAB ── */}
      {activeTab === 'create' && (
        <form onSubmit={handleGenerateScenario} className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>Interaktiv Huquqiy Senariy Konstruktori</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                O‘zbekiston Respublikasining 2026-yilgi amaldagi qonunchiligi asosida real keys
                simulyatsiyasini yarating.
              </p>
            </div>

            {genError && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-300 text-xs">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
                <span>{genError}</span>
              </div>
            )}

            {/* Grid 1: Domain, Difficulty, Role, Objective */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
                  Huquq Sohasi
                </label>
                <select
                  value={domain}
                  onChange={e => setDomain(e.target.value as ScenarioDomain)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="civil">Fuqarolik huquqi</option>
                  <option value="contract">Shartnomaviy munosabatlar</option>
                  <option value="labor">Mehnat huquqi</option>
                  <option value="criminal">Jinoyat huquqi</option>
                  <option value="administrative">Ma’muriy huquq</option>
                  <option value="business">Tadbirkorlik va iqtisod</option>
                  <option value="family">Oila huquqi</option>
                  <option value="inheritance">Meros huquqi</option>
                  <option value="property">Mulk huquqi</option>
                  <option value="land">Yer va shaharsozlik</option>
                  <option value="ip">Intellektual mulk</option>
                  <option value="tax">Soliq huquqi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
                  Qiyinlik Darajasi
                </label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as ScenarioDifficulty)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="beginner">Boshlang‘ich (Talaba)</option>
                  <option value="intermediate">O‘rta (Yurist)</option>
                  <option value="advanced">Murakkab (Advokat)</option>
                  <option value="expert">Ekspert (Sudya darajasi)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
                  Sizning Rolingiz
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as ScenarioRole)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="advokat">Advokat</option>
                  <option value="yurist">Korxona Yuristi</option>
                  <option value="himoyachi">Himoyachi</option>
                  <option value="prokuror">Prokuror</option>
                  <option value="sudya">Sudya</option>
                  <option value="tergovchi">Tergovchi</option>
                  <option value="mediator">Mediator</option>
                  <option value="davogar_vakili">Da’vogar vakili</option>
                  <option value="javobgar_vakili">Javobgar vakili</option>
                  <option value="talaba">Yuridik talaba</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
                  Asosiy Maqsad
                </label>
                <select
                  value={objective}
                  onChange={e => setObjective(e.target.value as ScenarioObjective)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="court_practice">Sud amaliyoti va strategiya</option>
                  <option value="irac">IRAC tahlil usuli</option>
                  <option value="negotiation">Muzokara va tinch yo‘l</option>
                  <option value="investigation">Tergov va dalil to‘plash</option>
                  <option value="legal_consulting">Huquqiy maslahat berish</option>
                  <option value="document_drafting">Protsessual hujjat tayyorlash</option>
                  <option value="evidence_evaluation">Dalillarni baholash</option>
                </select>
              </div>
            </div>

            {/* Topic Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
                Keys Mavzusi yoki Real Vaziyat
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Masalan: Yetkazib berish shartnomasi bo‘yicha to‘lov kechikishi, mehnat shartnomasini noqonuniy bekor qilish..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
              />
            </div>

            {/* Focus Areas Chips */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-2">
                Diqqat Markazlari (Ko‘nikmalar)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Shartnoma bandlari',
                  'To‘lov muddati',
                  'Penya & Foizlar',
                  'Yozma dalillar',
                  'Guvohlar ko‘rsatmasi',
                  'Qonuniy moddalar (2026)',
                  'Protsessual xatolar',
                  'Yetkazilgan zarar',
                  'Sababiy bog‘liqlik',
                  'Da’vo muddati',
                ].map(item => {
                  const isSelected = focusAreas.includes(item)
                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={() => toggleFocusArea(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Additional Requirements */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400 mb-1.5">
                Qo‘shimcha Shartlar yoki Maxsus Talablar (Ixtiyoriy)
              </label>
              <textarea
                value={additionalReqs}
                onChange={e => setAdditionalReqs(e.target.value)}
                rows={2}
                placeholder="Keysda qanday kutilmagan holat yoki dalil ziddiyati bo‘lishini xohlaysiz?..."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end">
              <button
                type="submit"
                disabled={isGenerating}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>2026 Qonunlari bo‘yicha senariy tuzilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Senariyni Yaratish & Simulyatsiyani Boshlash</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── 2. SIMULATION TAB ── */}
      {activeTab === 'simulation' && currentScenario && (
        <div className="space-y-6">
          {/* Header & Meta */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  {currentScenario.legal_domain}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                  Rol: {currentScenario.user_role}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>
                  Bosqich {currentStep} / {currentScenario.decision_points?.length || 1}
                </span>
              </div>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
              {currentScenario.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 leading-relaxed">
              {currentScenario.background}
            </p>
          </div>

          {/* Evaluation Modal / Screen if completed */}
          {evaluation ? (
            <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 animate-in zoom-in-95 duration-300">
              <div className="text-center max-w-md mx-auto space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <Award className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Simulyatsiya Muvaffaqiyatli Yakunlandi!
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Sizning yuridik tahlilingiz va qabul qilgan qarorlaringiz O‘zbekiston amaldagi
                  qonunchiligi asosida baholandi.
                </p>
              </div>

              {/* Scores Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-zinc-800/60 p-4 rounded-2xl text-center border border-gray-100 dark:border-zinc-800">
                  <span className="text-xs font-semibold text-gray-400 uppercase">Umumiy Ball</span>
                  <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {evaluation.total_score} <span className="text-sm text-gray-400">/ 100</span>
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-zinc-800/60 p-4 rounded-2xl text-center border border-gray-100 dark:border-zinc-800">
                  <span className="text-xs font-semibold text-gray-400 uppercase">
                    Qarorlar Sifati
                  </span>
                  <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {evaluation.decision_quality_score}%
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-zinc-800/60 p-4 rounded-2xl text-center border border-gray-100 dark:border-zinc-800">
                  <span className="text-xs font-semibold text-gray-400 uppercase">
                    Yuridik Tahlil
                  </span>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {evaluation.legal_analysis_score}%
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-zinc-800/60 p-4 rounded-2xl text-center border border-gray-100 dark:border-zinc-800">
                  <span className="text-xs font-semibold text-gray-400 uppercase">Berilgan XP</span>
                  <p className="text-3xl font-black text-amber-500 mt-1">
                    +{evaluation.xp_awarded} XP
                  </p>
                </div>
              </div>

              {/* Recommendations & Mistakes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                  <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Tavsiyalar
                  </h3>
                  <ul className="space-y-1.5 text-xs text-gray-700 dark:text-zinc-300">
                    {evaluation.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/40">
                  <h3 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> E’tibor qaratish lozim
                  </h3>
                  <ul className="space-y-1.5 text-xs text-gray-700 dark:text-zinc-300">
                    {evaluation.mistakes.length > 0 ? (
                      evaluation.mistakes.map((mis, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-500">•</span>
                          <span>{mis}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-emerald-600 font-medium">
                        Hech qanday jiddiy xato aniqlanmadi!
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => startSimulation(currentScenario)}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-semibold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Qayta urinish</span>
                </button>

                <button
                  onClick={() => setActiveTab('create')}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Yangi senariy yaratish</span>
                </button>
              </div>
            </div>
          ) : (
            /* Active Step Simulation UI */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Dossier & Evidence (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Facts & Participants */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-xs space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>Tomonlar & Ishtirokchilar</span>
                    </h3>
                    <div className="space-y-2">
                      {currentScenario.participants?.map(p => (
                        <div
                          key={p.id}
                          className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl text-xs"
                        >
                          <div className="flex items-center justify-between font-bold text-gray-900 dark:text-white mb-0.5">
                            <span>{p.name}</span>
                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                              {p.role}
                            </span>
                          </div>
                          <p className="text-gray-500 dark:text-zinc-400">{p.interests}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Evidence Vault */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>Dalillar Portfeli</span>
                    </h3>
                    <div className="space-y-2">
                      {currentScenario.evidence?.map(ev => (
                        <div
                          key={ev.id}
                          className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-xl text-xs border border-gray-100 dark:border-zinc-800"
                        >
                          <div className="flex items-center justify-between font-semibold text-gray-900 dark:text-white mb-0.5">
                            <span>{ev.title}</span>
                            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                              {ev.reliability}
                            </span>
                          </div>
                          <p className="text-gray-500 dark:text-zinc-400">{ev.description}</p>
                          {ev.legal_basis && (
                            <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mt-1 block">
                              Asos: {ev.legal_basis}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Decision Point Interactive Area (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                {currentDecisionPoint ? (
                  <div className="bg-white dark:bg-zinc-900 border border-blue-200/80 dark:border-blue-900/50 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
                    <div>
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                        {currentDecisionPoint.stage_title}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug">
                        {currentDecisionPoint.prompt}
                      </h3>
                    </div>

                    {/* Options list */}
                    <div className="space-y-3">
                      {currentDecisionPoint.options?.map(option => (
                        <div
                          key={option.id}
                          onClick={() => handleSelectOption(option.id)}
                          className="p-4 bg-gray-50 dark:bg-zinc-800/70 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-gray-200/80 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-600 rounded-2xl cursor-pointer transition-all duration-200 group shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {option.label}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                                {option.description}
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex-shrink-0">
                              +{option.xp} XP
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Previous Action Logs Summary */}
                    {actionLogs.length > 0 && (
                      <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase">
                          Avvalgi qarorlar tarixi:
                        </span>
                        {actionLogs.map((log, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-gray-50 dark:bg-zinc-800/40 rounded-xl text-xs flex items-center justify-between"
                          >
                            <span className="font-medium text-gray-800 dark:text-zinc-200">
                              {log.step_number}-bosqich: {log.action_title}
                            </span>
                            <span
                              className={`text-[11px] font-bold ${
                                log.is_optimal ? 'text-emerald-600' : 'text-amber-600'
                              }`}
                            >
                              +{log.xp_earned} XP
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Natijalar hisoblanmoqda...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3. TEMPLATES TAB ── */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(tmpl => (
              <div
                key={tmpl.id}
                className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                      {tmpl.legal_domain}
                    </span>
                    <span className="text-xs font-semibold text-gray-400">
                      Qiyinlik: {tmpl.difficulty}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                    {tmpl.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-3 mb-4">
                    {tmpl.background}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5" /> 2026 Tasdiqlangan
                  </span>
                  <button
                    onClick={() => startSimulation(tmpl)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Boshlash</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. HISTORY TAB ── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {loadingHistory ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Tarix yuklanmoqda...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200/80 dark:border-zinc-800">
              <History className="w-10 h-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                Hali yakunlangan simulyatsiyalar yo‘q
              </h3>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 mb-4">
                Yangi senariy yaratib yoki shablonlardan birini tanlab amaliyotni boshlang.
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Senariy Yaratish
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(sess => (
                <div
                  key={sess.id}
                  className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        {sess.scenario_data?.legal_domain || 'Huquqiy'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(sess.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      {sess.scenario_data?.title || 'Yuridik Simulyatsiya'}
                    </h4>
                  </div>

                  <div className="flex items-center gap-4">
                    {sess.score != null && (
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block uppercase">Natija</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {sess.score}/100 (+{sess.xp_awarded || 0} XP)
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => startSimulation(sess.scenario_data)}
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-all"
                    >
                      Qayta ko‘rish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
