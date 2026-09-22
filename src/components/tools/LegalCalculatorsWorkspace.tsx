'use client'

import React, { useState } from 'react'
import {
  Calculator,
  Scale,
  DollarSign,
  Calendar,
  Percent,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  ExternalLink,
  Copy,
  Save,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react'
import {
  calculateStateFee,
  calculatePenaltyAndDamages,
  calculateInterest327,
  calculateBhm,
  calculateDeadlines,
} from '@/lib/calculators-engine'
import {
  CourtType,
  ClaimPropertyType,
  CourtInstance,
  StateFeeResult,
  PenaltyResult,
  Interest327Result,
  BhmResult,
  DeadlineResult,
} from '@/types/professional-tools'
import {
  CURRENT_BHM_VALUE,
  CURRENT_CBU_MAIN_RATE,
  OFFICIAL_LEGAL_SOURCES,
} from '@/lib/official-sources-registry'

export default function LegalCalculatorsWorkspace() {
  const [activeTab, setActiveTab] = useState<
    'state_fee' | 'penalty' | 'interest327' | 'bhm' | 'deadline'
  >('state_fee')

  // 1. Davlat Boji Form State
  const [courtType, setCourtType] = useState<CourtType>('civil')
  const [claimType, setClaimType] = useState<ClaimPropertyType>('property')
  const [claimAmount, setClaimAmount] = useState<string>('50000000')
  const [instance, setInstance] = useState<CourtInstance>('first_instance')
  const [isExempted, setIsExempted] = useState<boolean>(false)

  // 2. Penya Form State
  const [penaltyContractAmount, setPenaltyContractAmount] = useState<string>('30000000')
  const [penaltyDaysLate, setPenaltyDaysLate] = useState<string>('45')
  const [penaltyDailyRate, setPenaltyDailyRate] = useState<string>('0.5')
  const [include327, setInclude327] = useState<boolean>(true)

  // 3. FK 327 Form State
  const [debt327Amount, setDebt327Amount] = useState<string>('20000000')
  const [debt327Days, setDebt327Days] = useState<string>('90')

  // 4. BHM Form State
  const [bhmMultiplier, setBhmMultiplier] = useState<string>('5')

  // 5. Muddat Form State
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [disputeCategory, setDisputeCategory] = useState<
    | 'civil_general'
    | 'labor_reinstatement'
    | 'labor_other'
    | 'contract_breach'
    | 'appeal_civil'
    | 'appeal_economic'
  >('civil_general')

  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Live Calculations
  const stateFeeResult: StateFeeResult = React.useMemo(() => {
    const num = parseFloat(claimAmount.replace(/[^\d]/g, '')) || 0
    return calculateStateFee({
      courtType,
      claimType,
      claimAmount: num,
      instance,
      isExempted,
    })
  }, [courtType, claimType, claimAmount, instance, isExempted])

  const penaltyResult: PenaltyResult = React.useMemo(() => {
    const amount = parseFloat(penaltyContractAmount.replace(/[^\d]/g, '')) || 0
    const days = parseInt(penaltyDaysLate, 10) || 0
    const rate = parseFloat(penaltyDailyRate) || 0.5
    return calculatePenaltyAndDamages({
      contractAmount: amount,
      daysLate: days,
      dailyRatePercent: rate,
      includeInterest327: include327,
    })
  }, [penaltyContractAmount, penaltyDaysLate, penaltyDailyRate, include327])

  const interest327Result: Interest327Result = React.useMemo(() => {
    const debt = parseFloat(debt327Amount.replace(/[^\d]/g, '')) || 0
    const days = parseInt(debt327Days, 10) || 0
    return calculateInterest327({
      debtAmount: debt,
      daysCount: days,
    })
  }, [debt327Amount, debt327Days])

  const bhmResult: BhmResult = React.useMemo(() => {
    const mult = parseFloat(bhmMultiplier) || 1
    return calculateBhm({ multiplier: mult })
  }, [bhmMultiplier])

  const deadlineResult: DeadlineResult = React.useMemo(() => {
    return calculateDeadlines({
      startDate,
      disputeCategory,
    })
  }, [startDate, disputeCategory])

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl overflow-x-auto">
        {[
          { id: 'state_fee', label: 'Davlat Boji', icon: Scale },
          { id: 'penalty', label: 'Penya & Zarar (Qonun 670-I)', icon: Percent },
          { id: 'interest327', label: 'FK 327 Foizlari (MB Stavka)', icon: DollarSign },
          { id: 'bhm', label: 'BHM Hisoblagich', icon: Calculator },
          { id: 'deadline', label: 'Da‘vo & Protsessual Muddatlar', icon: Calendar },
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 1. DAVLAT BOJI KALKULYATORI */}
      {activeTab === 'state_fee' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600" /> Davlat Boji Parametrlari
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                O‘RQ-600 Qonun
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Sud turi
              </label>
              <select
                value={courtType}
                onChange={e => setCourtType(e.target.value as CourtType)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
              >
                <option value="civil">Fuqarolik ishlari bo‘yicha sud</option>
                <option value="economic">Iqtisodiy sud</option>
                <option value="administrative">Ma‘muriy sud</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Da‘vo xarakteri / turi
              </label>
              <select
                value={claimType}
                onChange={e => setClaimType(e.target.value as ClaimPropertyType)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
              >
                <option value="property">Mulkiy xarakterdagi da‘vo</option>
                <option value="non_property">Nomulkiy xarakterdagi da‘vo</option>
                {courtType === 'civil' && (
                  <>
                    <option value="divorce">Nikohni bekor qilish</option>
                    <option value="divorce_repeated">Takroriy nikohni bekor qilish</option>
                    <option value="inheritance">Meros mulkini taqsimlash</option>
                  </>
                )}
              </select>
            </div>

            {claimType === 'property' || claimType === 'inheritance' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Da‘vo bahosi (so‘mda)
                </label>
                <input
                  type="text"
                  value={claimAmount}
                  onChange={e => setClaimAmount(e.target.value)}
                  placeholder="50000000"
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-blue-600 dark:text-blue-400"
                />
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Sud instansiyasi
              </label>
              <select
                value={instance}
                onChange={e => setInstance(e.target.value as CourtInstance)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
              >
                <option value="first_instance">Birinchi instansiya sudi (100%)</option>
                <option value="appeal">Apellyatsiya shikoyati (50%)</option>
                <option value="cassation">Kassatsiya shikoyati (50%)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isExempted}
                onChange={e => setIsExempted(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-xs text-slate-700 dark:text-zinc-300 font-medium">
                Da‘vogar davlat bojidan ozod qilingan (Qonun 8-10-moddalari)
              </span>
            </label>
          </div>

          {/* Results & Legal Basis */}
          <div className="lg:col-span-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/40">
                <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide block mb-1">
                  To‘lanishi lozim bo‘lgan Davlat Boji:
                </span>
                <div className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-400">
                  {stateFeeResult.totalFee.toLocaleString('uz-UZ')} so‘m
                </div>
                <div className="mt-2 text-[11px] text-blue-900/80 dark:text-blue-200/80">
                  Amaldagi BHM: <strong>{CURRENT_BHM_VALUE.toLocaleString()} so‘m</strong> (PF-108)
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide">
                  Hisoblash Asosi va Qonun Moddalari
                </h4>
                {stateFeeResult.breakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-zinc-200">
                      <span>{item.name}</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {item.calculatedAmount.toLocaleString()} so‘m
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {item.rateDescription}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-blue-600 dark:text-blue-400">
                      <span className="font-semibold">{item.legalGround}</span>
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-0.5 hover:underline"
                      >
                        Lex.uz <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <button
                onClick={() =>
                  handleCopy(
                    `Davlat boji: ${stateFeeResult.totalFee.toLocaleString()} so'm. Asos: ${stateFeeResult.legalBases.join(', ')}`
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Nusxalandi!' : 'Natijani nusxalash'}
              </button>
              <a
                href={OFFICIAL_LEGAL_SOURCES.STATE_FEE_LAW.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" /> Rasmiy Qonun matni (Lex.uz)
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. PENYA VA ZARAR KALKULYATORI */}
      {activeTab === 'penalty' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <Percent className="w-4 h-4 text-indigo-600" /> Penya va Jarima Parametrlari
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                670-I Qonun
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Kechiktirilgan asosiy shartnoma summasi (so‘mda)
              </label>
              <input
                type="text"
                value={penaltyContractAmount}
                onChange={e => setPenaltyContractAmount(e.target.value)}
                placeholder="30000000"
                className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Kechikkan kunlar soni
                </label>
                <input
                  type="number"
                  value={penaltyDaysLate}
                  onChange={e => setPenaltyDaysLate(e.target.value)}
                  placeholder="45"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Kunlik penya stavkasi (%)
                </label>
                <input
                  type="text"
                  value={penaltyDailyRate}
                  onChange={e => setPenaltyDailyRate(e.target.value)}
                  placeholder="0.5"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={include327}
                onChange={e => setInclude327(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="text-xs text-slate-700 dark:text-zinc-300 font-medium">
                FK 327-moddasi bo‘yicha Markaziy Bank stavkasida foizni ham qo‘shish (13.5% yillik)
              </span>
            </label>
          </div>

          <div className="lg:col-span-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/40">
                <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wide block mb-1">
                  Jami Undiriladigan Talab:
                </span>
                <div className="text-2xl sm:text-3xl font-black text-indigo-700 dark:text-indigo-400">
                  {penaltyResult.totalClaim.toLocaleString('uz-UZ')} so‘m
                </div>
                {penaltyResult.isCapped && (
                  <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Qonuniy 50% cheklov qo‘llanildi (Qonun 670-I, 25-modda)
                  </div>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-zinc-400">Shartnomaviy Penya:</span>
                  <span className="font-bold text-slate-800 dark:text-zinc-100">
                    {penaltyResult.penaltyAmount.toLocaleString()} so‘m
                  </span>
                </div>

                {penaltyResult.interest327Amount ? (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 flex items-center justify-between">
                    <span className="text-slate-600 dark:text-zinc-400">
                      FK 327-modda (MB 13.5% stavkasi):
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {penaltyResult.interest327Amount.toLocaleString()} so‘m
                    </span>
                  </div>
                ) : null}

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">Formula:</span>
                  <p className="text-[11px] text-slate-700 dark:text-zinc-300 font-mono">
                    {penaltyResult.calculationFormula}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <button
                onClick={() =>
                  handleCopy(
                    `Penya va zarar: ${penaltyResult.totalClaim.toLocaleString()} so'm. Formula: ${penaltyResult.calculationFormula}`
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Nusxalandi!' : 'Natijani nusxalash'}
              </button>
              <a
                href={OFFICIAL_LEGAL_SOURCES.CONTRACT_LAW_670.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" /> Qonun 670-I (Lex.uz)
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 3. FK 327-MODDASI FOIZ KALKULYATORI */}
      {activeTab === 'interest327' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> FK 327-modda: Pul Mablag‘laridan
              Foydalanganlik Foizlari
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Boshqa shaxslarning pul mablag‘larini noqonuniy ushlab qolganlik, to‘lashdan bo‘yin
              tovlaganlik yoki kechiktirganlik uchun Markaziy bank stavkasi bo‘yicha foizlar
              hisoblanadi.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Qarz / Majburiyat summasi (so‘mda)
              </label>
              <input
                type="text"
                value={debt327Amount}
                onChange={e => setDebt327Amount(e.target.value)}
                placeholder="20000000"
                className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Foydalanilgan / Kechiktirilgan kunlar soni
              </label>
              <input
                type="number"
                value={debt327Days}
                onChange={e => setDebt327Days(e.target.value)}
                placeholder="90"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
              />
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-xs text-emerald-900 dark:text-emerald-200">
              Markaziy bankning amaldagi asosiy stavkasi:{' '}
              <strong>{CURRENT_CBU_MAIN_RATE}% yillik</strong>.
            </div>
          </div>

          <div className="lg:col-span-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide block mb-1">
                  Hisoblangan Foizlar Summasi:
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
                  {interest327Result.interestAmount.toLocaleString('uz-UZ')} so‘m
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 space-y-1 text-xs">
                <span className="text-[10px] font-bold text-slate-500 block">
                  Hisoblash formulasi:
                </span>
                <p className="text-[11px] text-slate-700 dark:text-zinc-300 font-mono">
                  {interest327Result.calculationFormula}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <button
                onClick={() =>
                  handleCopy(
                    `FK 327-moddasi foizlari: ${interest327Result.interestAmount.toLocaleString()} so'm. Formula: ${interest327Result.calculationFormula}`
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Nusxalandi!' : 'Natijani nusxalash'}
              </button>
              <a
                href={OFFICIAL_LEGAL_SOURCES.CBU_MAIN_RATE.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" /> Markaziy Bank stavkasi (cbu.uz)
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 4. BHM KALKULYATORI */}
      {activeTab === 'bhm' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" /> BHM (Bazaviy Hisoblash Miqdori)
              Kalkulyatori
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                BHM karraligi (baravari)
              </label>
              <input
                type="number"
                value={bhmMultiplier}
                onChange={e => setBhmMultiplier(e.target.value)}
                placeholder="5"
                className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 text-xs space-y-1 text-slate-600 dark:text-zinc-400">
              <p>
                1 BHM = <strong>{CURRENT_BHM_VALUE.toLocaleString()} so‘m</strong>
              </p>
              <p>Amal qilish sanasi: 2024-yil 1-sentabrdan boshlab</p>
              <p>Asos: Prezidentning PF-108-son Farmoni</p>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/40">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide block mb-1">
                Jami Hisoblangan Miqdor ({bhmMultiplier} baravari):
              </span>
              <div className="text-3xl font-black text-blue-700 dark:text-blue-400">
                {bhmResult.totalAmount.toLocaleString('uz-UZ')} so‘m
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <button
                onClick={() =>
                  handleCopy(
                    `${bhmMultiplier} BHM = ${bhmResult.totalAmount.toLocaleString()} so'm`
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-zinc-300"
              >
                <Copy className="w-3.5 h-3.5" /> Nusxalash
              </button>
              <a
                href={OFFICIAL_LEGAL_SOURCES.BHM_DECREE.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" /> PF-108 Farmoni (Lex.uz)
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 5. DA'VO VA PROTSESSUAL MUDDATLAR */}
      {activeTab === 'deadline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600" /> Da‘vo va Protsessual Muddatlar
              Parametrlari
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Nizo yoki holat yuz bergan boshlang‘ich sana
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Nizo yoki shikoyat toifasi
              </label>
              <select
                value={disputeCategory}
                onChange={e => setDisputeCategory(e.target.value as typeof disputeCategory)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
              >
                <option value="civil_general">Umumiy fuqarolik da‘vosi (3 yil — FK 150)</option>
                <option value="labor_reinstatement">
                  Mehnat: Ishga tiklash nizosi (1 oy — MK 560)
                </option>
                <option value="labor_other">Mehnat: Boshqa nizolar (6 oy — MK 560)</option>
                <option value="contract_breach">Shartnoma buzilishi bo‘yicha talab (3 yil)</option>
                <option value="appeal_civil">
                  Fuqarolik sudi Apellyatsiya shikoyati (1 oy — FPK 385)
                </option>
                <option value="appeal_economic">
                  Iqtisodiy sud Apellyatsiya shikoyati (1 oy — IPK 259)
                </option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200/80 dark:border-zinc-800 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div
                className={`p-5 rounded-2xl border ${
                  deadlineResult.isExpired
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 text-rose-900 dark:text-rose-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-900 dark:text-emerald-200'
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wide block mb-1">
                  Oxirgi Murojaat Sanasi:
                </span>
                <div className="text-2xl sm:text-3xl font-black">{deadlineResult.deadlineDate}</div>
                <div className="mt-2 text-xs font-semibold">
                  {deadlineResult.isExpired ? (
                    <span className="text-rose-600 dark:text-rose-400">
                      ⚠️ Muddat o‘tib ketgan! (Tiklash arizasi talab etiladi)
                    </span>
                  ) : (
                    <span>
                      Qolgan vaqt: <strong>{deadlineResult.daysRemaining} kun</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <h4 className="font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide text-[10px]">
                  Protsessual Qadamlar & Asoslar:
                </h4>
                {deadlineResult.legalBases.map((b, idx) => (
                  <p
                    key={idx}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/60 font-medium"
                  >
                    • {b}
                  </p>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <button
                onClick={() =>
                  handleCopy(
                    `Oxirgi muddat: ${deadlineResult.deadlineDate}. Asos: ${deadlineResult.legalBases.join(', ')}`
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-zinc-300"
              >
                <Copy className="w-3.5 h-3.5" /> Nusxalash
              </button>
              <a
                href={OFFICIAL_LEGAL_SOURCES.CIVIL_CODE.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" /> Fuqarolik Kodeksi (Lex.uz)
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
