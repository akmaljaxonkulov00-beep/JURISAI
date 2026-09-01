'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowUpRight, Clock, Zap, CheckCircle } from 'lucide-react'
import type { FeatureUsage, PeriodType } from '@/hooks/useUsageLimits'
import type { UsageResult } from '@/lib/usage-limits'

interface LimitExceededModalProps {
  open: boolean
  onClose: () => void
  feature: string
  featureLabel: string
  usage?: FeatureUsage
  result?: UsageResult
  onUpgrade?: () => void
}

const PLAN_NAMES: Record<string, string> = { free: 'Bepul', standart: 'Standart', pro: 'Pro' }

const PLAN_LIMITS: Record<string, Record<string, number | string>> = {
  free: {
    ai_chat: 10,
    irac: 3,
    document_generate: 3,
    document_analysis: 2,
    virtual_court: 2,
    decision_tree: 2,
    speech_stt: 5,
    scenario: 3,
  },
  standart: {
    ai_chat: 200,
    irac: 'Cheksiz',
    document_generate: 50,
    document_analysis: 20,
    virtual_court: 5,
    decision_tree: 20,
    speech_stt: 100,
    scenario: 20,
  },
  pro: {
    ai_chat: 'Cheksiz',
    irac: 'Cheksiz',
    document_generate: 'Cheksiz',
    document_analysis: 'Cheksiz',
    virtual_court: 'Cheksiz',
    decision_tree: 'Cheksiz',
    speech_stt: 'Cheksiz',
    scenario: 'Cheksiz',
  },
}

function formatPeriodEnd(periodEnd: string, periodType: PeriodType): string {
  const d = new Date(periodEnd)
  const now = new Date()
  if (periodType === 'daily') {
    return d.getDate() === now.getDate() + 1 ? 'Ertaga' : d.toLocaleDateString('uz-UZ')
  }
  if (periodType === 'weekly') {
    const days = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba']
    return days[(d.getDay() + 6) % 7]
  }
  const months = [
    'yanvar',
    'fevral',
    'mart',
    'aprel',
    'may',
    'iyun',
    'iyul',
    'avgust',
    'sentabr',
    'oktabr',
    'noyabr',
    'dekabr',
  ]
  return `${d.getDate()}-${months[d.getMonth()]}`
}

function formatLimit(val: number | string): string {
  if (typeof val === 'string') return val
  if (val === -1 || val >= 9999) return 'Cheksiz'
  return String(val)
}

export default function LimitExceededModal({
  open,
  onClose,
  feature,
  featureLabel,
  usage,
  result,
  onUpgrade,
}: LimitExceededModalProps) {
  const currentPlan = usage?.periodEnd ? 'free' : result?.plan || 'free'
  const periodType = usage?.periodType || result?.periodType || 'monthly'
  const periodEnd = usage?.periodEnd || result?.periodEnd || ''
  const used = usage?.used ?? result?.used ?? 0
  const limit = usage?.limit ?? result?.limit ?? 0

  const higherPlans = Object.entries(PLAN_LIMITS)
    .filter(([plan]) => plan !== currentPlan)
    .map(([plan, limits]) => ({
      plan,
      name: PLAN_NAMES[plan] || plan,
      limit: limits[feature] ?? 'Cheksiz',
      isHigher: plan === 'pro' || (plan === 'standart' && currentPlan === 'free'),
    }))
    .filter(p => p.isHigher)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header gradient */}
            <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400" />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="p-6">
              {/* Icon + Title */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0">
                  <Zap size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Limit tugadi
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
                    {featureLabel} uchun {PLAN_NAMES[currentPlan] || 'Bepul'} tarifidagi limit
                    ishlatildi
                  </p>
                </div>
              </div>

              {/* Usage stats */}
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-zinc-400">Ishlatilgan</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {used} / {limit}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-red-400 rounded-full"
                    style={{ width: '100%' }}
                  />
                </div>
                {periodEnd && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-zinc-500">
                    <Clock size={12} />
                    <span>Yangilanish: {formatPeriodEnd(periodEnd, periodType)}</span>
                  </div>
                )}
              </div>

              {/* Higher plans comparison */}
              {higherPlans.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                    Yuqori tariflar bilan solishtirish
                  </p>
                  <div className="space-y-2">
                    {higherPlans.map(p => (
                      <div
                        key={p.plan}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle size={14} className="text-green-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                            {p.name}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatLimit(p.limit)} /{' '}
                          {periodType === 'daily'
                            ? 'kun'
                            : periodType === 'weekly'
                              ? 'hafta'
                              : 'oy'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upgrade CTA */}
              <button
                onClick={onUpgrade}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                  boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                }}
              >
                Tarifni yangilash
                <ArrowUpRight size={16} />
              </button>

              <p className="text-center text-xs text-gray-400 dark:text-zinc-500 mt-3">
                {periodType === 'daily'
                  ? 'Limit ertaga'
                  : periodType === 'weekly'
                    ? 'Limit keyingi hafta'
                    : 'Limit keyingi oy'}{' '}
                avtomatik yangilanadi
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
