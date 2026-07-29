'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Compass,
  Zap,
  Bot,
  Award,
} from 'lucide-react'

const STORAGE_KEY = 'jurisai_onboarding_completed'

interface Step {
  icon: React.ReactNode
  title: string
  description: string
  highlight: string
  tip: string
}

const steps: Step[] = [
  {
    icon: <Sparkles className="w-8 h-8 text-blue-500" />,
    title: 'JURISAI ga xush kelibsiz!',
    description:
      "Bu platforma O'zbekiston qonunchiligi asosida huquqiy bilimlaringizni rivojlantirish, real keyslarni yechish va AI yordamida professional hujjatlar tayyorlash uchun yaratilgan.",
    highlight: 'Statistika paneli',
    tip: "Yuqori qismdagi ko'rsatkichlar sizning umumiy faoliyatingizni aks ettiradi.",
  },
  {
    icon: <Compass className="w-8 h-8 text-emerald-500" />,
    title: 'Navigatsiya menyusi',
    description:
      "Chap tomondagi sidebar orqali barcha bo'limlarga tezkor kirishingiz mumkin: Amaliyot (IRAC, Qarorlar Daraxti, Simulyator), Resurslar (Qonunlar bazasi, Asboblar), va Shaxsiy sozlamalar.",
    highlight: 'Yon panel',
    tip: "Bo'limlar mantiqiy guruhlangan — kerakli funksiyani topish oson.",
  },
  {
    icon: <Zap className="w-8 h-8 text-orange-500" />,
    title: 'Tezkor amallar',
    description:
      'IRAC Huquqiy Tahlil orqali real sud ishlarini tahlil qiling, Qonunlar bazasida barcha kodekslarni qidiring, Sud Simulyatorida virtual sud jarayonida qatnashing.',
    highlight: 'Tezkor amallar kartochkalari',
    tip: "Uchta asosiy yo'nalish — tahlil, qidiruv, simulyatsiya.",
  },
  {
    icon: <Bot className="w-8 h-8 text-purple-500" />,
    title: 'AI Yordamchi',
    description:
      "Har qanday sahifada pastki-o'ng burchakdagi AI Yordamchi orqali huquqiy savollaringizni bering, hujjatlar yarating va qonun moddalarini so'rang. AI O'zbekiston qonunchiligi asosida javob beradi.",
    highlight: 'AI Chat tugmasi',
    tip: 'Yordamchi 24/7 ishlaydi — istalgan vaqtda murojaat qiling.',
  },
  {
    icon: <Award className="w-8 h-8 text-amber-500" />,
    title: 'Yutuqlar va Premium',
    description:
      "Har bir bajarilgan ish uchun XP va darajalar to'plang, yangi yutuqlarni oching. Premium tarifga o'tish orqali cheksiz AI so'rovlari, barcha kodekslar va ekspert maslahatiga ega bo'ling.",
    highlight: 'Premium tariflar',
    tip: "Standart 45,000 UZS/oy yoki Pro 140,000 UZS/yil — o'zingizga mosini tanlang.",
  },
]

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    try {
      const completed = localStorage.getItem(STORAGE_KEY)
      if (completed) return
    } catch {
      // localStorage unavailable — always show tour
    }
    // Delay showing the tour so the dashboard loads first
    const timer = setTimeout(() => setIsOpen(true), 1200)
    return () => clearTimeout(timer)
  }, [])

  const handleComplete = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {}
    setIsAnimating(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsAnimating(false)
    }, 300)
  }, [])

  const handleSkip = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {}
    setIsAnimating(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsAnimating(false)
    }, 300)
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }, [currentStep, handleComplete])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [])

  const goToStep = useCallback((index: number) => {
    setCurrentStep(index)
  }, [])

  if (!isOpen) return null

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleSkip}
      />

      {/* Tour Card */}
      <div
        className={`fixed z-[101] inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-[520px] transition-all duration-300 ${
          isAnimating ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800/60 dark:border-zinc-700/60 overflow-hidden">
          {/* Top gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500" />

          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-all z-10"
          >
            <X size={16} />
          </button>

          <div className="p-6 md:p-8">
            {/* Step indicator + icon */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-800/50 flex items-center justify-center shadow-sm border border-gray-200 dark:border-zinc-800/50 dark:border-zinc-700/50">
                {step.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
                    {currentStep + 1} / {steps.length}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
                    {step.highlight}
                  </span>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h2>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-zinc-300 leading-relaxed mb-4">
              {step.description}
            </p>

            {/* Tip box */}
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 mb-6">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  💡 <strong>Maslahat:</strong> {step.tip}
                </p>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToStep(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? 'w-8 bg-gradient-to-r from-blue-500 to-emerald-500'
                      : 'w-2 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600'
                  }`}
                />
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {!isFirstStep && (
                  <button
                    onClick={handlePrev}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-1.5"
                  >
                    <ChevronLeft size={16} />
                    Orqaga
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSkip}
                  className="px-3 py-2 text-xs font-medium text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                >
                  Skip
                </button>

                <button
                  onClick={handleNext}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-1.5 active:scale-[0.98]"
                >
                  {isLastStep ? (
                    <>
                      <Check size={16} />
                      Tushunarli
                    </>
                  ) : (
                    <>
                      Keyingi
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
