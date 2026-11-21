'use client'

import React, { useState } from 'react'
import {
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  GitBranch,
  Download,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  GUIDED_SCENARIOS,
  GuidedScenario,
  GuidedQuestion,
  GuidedTerminalResult,
} from '@/lib/decision-tree/guided-scenarios-data'
import { generateLegalPdf, downloadPdfBlob } from '@/lib/pdf-generator'
import Link from 'next/link'

interface Props {
  onSwitchToVisual?: (scenarioId?: string) => void
  onOpenDocumentGenerator?: (docId: string) => void
}

export default function GuidedDecisionFlow({
  onSwitchToVisual,
  onOpenDocumentGenerator,
}: Props) {
  const [selectedScenario, setSelectedScenario] = useState<GuidedScenario | null>(null)
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [currentProbability, setCurrentProbability] = useState<number>(50)
  const [terminalResult, setTerminalResult] = useState<GuidedTerminalResult | null>(null)
  const [showExplanation, setShowExplanation] = useState<boolean>(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Start a scenario
  const handleSelectScenario = (scenario: GuidedScenario) => {
    setSelectedScenario(scenario)
    setCurrentQuestionId(scenario.initialQuestionId)
    setHistory([])
    setCurrentProbability(50)
    setTerminalResult(null)
    setShowExplanation(true)
  }

  // Answer a question
  const handleSelectOption = (
    nextQuestionId: string | null,
    terminalResultId?: string,
    probabilityChange: number = 0
  ) => {
    if (!selectedScenario || !currentQuestionId) return

    // Update probability
    setCurrentProbability((prev) => Math.min(100, Math.max(0, prev + probabilityChange)))

    // Save history for back navigation
    setHistory((prev) => [...prev, currentQuestionId])

    if (terminalResultId && selectedScenario.results[terminalResultId]) {
      setTerminalResult(selectedScenario.results[terminalResultId])
      setCurrentQuestionId(null)
    } else if (nextQuestionId && selectedScenario.questions[nextQuestionId]) {
      setCurrentQuestionId(nextQuestionId)
    }
  }

  // Go back one step
  const handleBack = () => {
    if (history.length === 0 || !selectedScenario) return

    const previousId = history[history.length - 1]
    setHistory((prev) => prev.slice(0, -1))
    setCurrentQuestionId(previousId)
    setTerminalResult(null)
  }

  // Reset
  const handleReset = () => {
    setSelectedScenario(null)
    setCurrentQuestionId(null)
    setHistory([])
    setCurrentProbability(50)
    setTerminalResult(null)
  }

  // Export PDF report
  const handleDownloadReport = async () => {
    if (!terminalResult || !selectedScenario) return
    setDownloadingPdf(true)
    try {
      const content = `YURIDIK QARORLAR DARAXTI — EKSPERT XULOSASI\n\n` +
        `Ish toifasi: ${selectedScenario.categoryNameUz}\n` +
        `Holat: ${selectedScenario.title}\n` +
        `Yutish ehtimoli: ${terminalResult.winProbability}% (${terminalResult.probabilityLevel.toUpperCase()})\n\n` +
        `XULOSA:\n${terminalResult.summary}\n\n` +
        `ZARUR DALILLAR RO‘YXATI:\n${terminalResult.requiredEvidence.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\n` +
        `XAVF-XATARLAR:\n${terminalResult.risks.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n` +
        `TAVSIYA ETILGAN PROTSESSUAL QADAMLAR:\n${terminalResult.recommendedSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n` +
        `QONUN MODDALARI (LexUZ):\n${terminalResult.applicableLaws.map((l) => `• ${l.code} ${l.article}: ${l.title} (${l.url})`).join('\n')}`

      const blob = await generateLegalPdf({
        title: `Yuridik Xulosa - ${selectedScenario.title}`,
        subtitle: 'Juristiv Qarorlar Daraxti',
        content,
        date: new Date().toLocaleDateString('uz-UZ'),
        author: 'AI Yuridik Tahlil Tizimi',
        legalBasis: terminalResult.applicableLaws.map((l) => `${l.code} ${l.article}`).join(', '),
      })
      downloadPdfBlob(blob, `Qarorlar_Daraxti_Xulosasi.pdf`)
    } catch (e) {
      console.error(e)
      alert('PDF yaratishda xatolik yuz berdi')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const currentQuestion: GuidedQuestion | null =
    selectedScenario && currentQuestionId ? selectedScenario.questions[currentQuestionId] : null

  return (
    <div className="space-y-6">
      {/* If no scenario is selected, show category cards */}
      {!selectedScenario ? (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 rounded-2xl text-white border border-indigo-800/40 shadow-xl">
            <div className="max-w-2xl space-y-3">
              <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-400 text-xs">
                ✨ Intellektual Yo‘l Ko‘rsatuvchi
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Qarorlar Daraxti — Qanday Foydalaniladi?
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Murakkab qonunlarni o‘rganish shart emas! O‘zingizga tegishli vaziyatni tanlang va bir nechta oddiy savollarga javob bering. Tizim avtomatik ravishda sudda yutish ehtimolini hisoblaydi, kerakli dalillar ro‘yxatini tuzadi va tayyor harakatlar rejasini taqdim etadi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {GUIDED_SCENARIOS.map((scenario) => (
              <div
                key={scenario.id}
                onClick={() => handleSelectScenario(scenario)}
                className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {scenario.icon}
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {scenario.categoryNameUz}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mt-0.5">
                      {scenario.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {scenario.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Tahlilni boshlash</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : terminalResult ? (
        /* Terminal Result View */
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedScenario.icon}</span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedScenario.title}
                </h3>
                <p className="text-xs text-slate-500">{selectedScenario.categoryNameUz}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="rounded-xl text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Boshqa ishni tahlil qilish
            </Button>
          </div>

          {/* Verdict Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
              <div>
                <Badge
                  variant="outline"
                  className={`text-xs px-3 py-1 mb-2 font-semibold ${
                    terminalResult.probabilityLevel === 'high'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300'
                      : terminalResult.probabilityLevel === 'medium'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-300'
                  }`}
                >
                  {terminalResult.probabilityLevel === 'high'
                    ? 'YUTISH EHTIMOLI YUQORI'
                    : terminalResult.probabilityLevel === 'medium'
                    ? 'EHTIMOL O‘RTACHA'
                    : 'EHTIMOL PAST / XAVF MAVJUD'}
                </Badge>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {terminalResult.title}
                </h2>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    Hisoblangan Ehtimol
                  </div>
                  <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                    {terminalResult.winProbability}%
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              <span className="font-bold text-indigo-700 dark:text-indigo-300">Yuridik Xulosa: </span>
              {terminalResult.summary}
            </div>

            {/* Evidence Checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Zarur Dalillar va Hujjatlar To‘plami
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {terminalResult.requiredEvidence.map((ev, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 flex items-start gap-2"
                  >
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 flex items-center justify-center shrink-0 text-[10px]">
                      ✓
                    </span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Steps */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-indigo-500" />
                Tavsiya Etilgan Qadamlar (Algoritm)
              </h4>
              <div className="space-y-2">
                {terminalResult.recommendedSteps.map((step, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Applicable Laws */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tegishli Qonun Normalari (Lex.uz)
              </h4>
              <div className="flex flex-wrap gap-2">
                {terminalResult.applicableLaws.map((law, i) => (
                  <a
                    key={i}
                    href={law.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
                  >
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {law.code} {law.article}:
                    </span>
                    <span>{law.title}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 ml-1" />
                  </a>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadReport}
                  disabled={downloadingPdf}
                  className="rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadingPdf ? 'Yuklanmoqda...' : 'Xulosani PDF yuklab olish'}</span>
                </Button>

                {onSwitchToVisual && (
                  <Button
                    variant="outline"
                    onClick={() => onSwitchToVisual(selectedScenario.id)}
                    className="rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <GitBranch className="w-4 h-4" />
                    <span>Grafik Daraxtda ko‘rish</span>
                  </Button>
                )}
              </div>

              {terminalResult.matchingDocumentId && (
                <Link
                  href={`/document-generator`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span>Hujjatlar konstruktorida ariza tayyorlash →</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : currentQuestion ? (
        /* Question Card */
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
          {/* Top Breadcrumb & Back */}
          <div className="flex items-center justify-between">
            <button
              onClick={history.length > 0 ? handleBack : handleReset}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{history.length > 0 ? 'Oldingi savolga qaytish' : 'Ssenariyni o‘zgartirish'}</span>
            </button>

            <span className="text-xs font-semibold text-slate-400">
              Bosqich: {history.length + 1}-qadam
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            {/* Question Text */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {selectedScenario.categoryNameUz} · {selectedScenario.title}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Explanation & Legal Basis Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
              <div
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center justify-between cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                  <Info className="w-4 h-4" />
                  <span>Nega bu savol muhim? (Huquqiy tushuntirish)</span>
                </div>
                {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>

              {showExplanation && (
                <div className="space-y-2 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>{currentQuestion.explanation}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500">Qonuniy asos:</span>
                    <a
                      href={currentQuestion.legalBasis.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      {currentQuestion.legalBasis.code} {currentQuestion.legalBasis.article} (
                      {currentQuestion.legalBasis.title}) <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Options List */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mos keluvchi javobni tanlang:
              </div>

              {currentQuestion.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() =>
                    handleSelectOption(
                      option.nextQuestionId,
                      option.terminalResultId,
                      option.winProbabilityChange
                    )
                  }
                  className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 hover:bg-indigo-50/40 dark:hover:bg-slate-800/80 transition-all flex items-center justify-between group shadow-sm hover:shadow"
                >
                  <div className="space-y-1 pr-4">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {option.label}
                    </div>
                    {option.hint && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">{option.hint}</div>
                    )}
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
