'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Crown,
  Star,
  Check,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Headphones,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { getPricingPlans, type PricingPlan } from '@/lib/settings-sync'
import { usePricingRealtime } from '@/hooks/usePricingRealtime'

// Har bir funksiya bo'yicha tarif limitlari (Premium matritsasi uchun)
const FEATURE_MATRIX: { key: string; label: string }[] = [
  { key: 'ai_chat', label: "AI chat (huquqiy so'rov)" },
  { key: 'irac', label: 'IRAC tahlil' },
  { key: 'document_generate', label: 'Hujjat generator' },
  { key: 'document_analysis', label: 'Hujjat tahlili' },
  { key: 'virtual_court', label: 'Virtual sud' },
  { key: 'decision_tree', label: 'Qarorlar daraxti (AI)' },
  { key: 'speech_stt', label: 'Ovozli yozuv (STT)' },
  { key: 'scenario', label: 'Senariy generator' },
]

// Default limitlar (pricing_plans.limits bo'lmasa ishlatiladi)
const DEFAULT_MATRIX_LIMITS: Record<string, Record<string, number>> = {
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
    irac: -1,
    document_generate: 50,
    document_analysis: 20,
    virtual_court: 5,
    decision_tree: 20,
    speech_stt: 100,
    scenario: 20,
  },
  pro: {
    ai_chat: -1,
    irac: -1,
    document_generate: -1,
    document_analysis: -1,
    virtual_court: -1,
    decision_tree: -1,
    speech_stt: -1,
    scenario: -1,
  },
}

const fmtLimit = (n: number) => (n === -1 ? 'Cheksiz' : `${n} ta/oy`)

export default function Premium() {
  const [plans, setPlans] = useState<PricingPlan[]>([
    {
      id: 'free',
      name: 'Bepul',
      price: 0,
      features: [
        "To'liq qonunlar bazasi — cheksiz",
        "10 ta AI chat so'rovi / oy",
        '3 ta IRAC tahlili / oy',
        '3 ta hujjat generator / oy',
        '5 ta ovozli yozuv (STT) / oy',
        '3 ta senariy generator / oy',
        'Asboblar, jamiyat, statistika — cheksiz',
      ],
      caseLimit: 5,
    },
    {
      id: 'standart',
      name: 'Standart',
      price: 45000,
      features: [
        "200 ta AI chat so'rovi / oy",
        'Cheksiz IRAC tahlili',
        '50 ta hujjat generator / oy',
        '20 ta hujjat tahlili / oy',
        '20 ta qarorlar daraxti / oy',
        '100 ta ovozli yozuv (STT) / oy',
        '5 ta virtual sud sessiyasi / oy',
        '20 ta senariy generator / oy',
      ],
      caseLimit: 50,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 140000,
      features: [
        "Cheksiz AI chat so'rovlari",
        'Cheksiz IRAC, hujjat, daraxt, senariy',
        'Cheksiz ovozli yozuv (STT)',
        'Cheksiz virtual sud sessiyalari',
        'Shaxsiy maslahatchi',
        'Ekspert konsultatsiyasi',
      ],
      caseLimit: -1,
    },
  ])
  const [loading, setLoading] = useState(true)
  const [matrixLimits, setMatrixLimits] =
    useState<Record<string, Record<string, number>>>(DEFAULT_MATRIX_LIMITS)

  useEffect(() => {
    loadPricingPlans()
  }, [])

  const loadPricingPlans = async () => {
    try {
      const fetched = await getPricingPlans()
      if (fetched && fetched.length > 0) {
        // Narx bo'yicha tartiblash: Bepul → Standart → Pro
        const sorted = [...fetched].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
        setPlans(sorted)
      }
    } catch (err) {
      console.warn('[Premium] Failed to load pricing plans:', err)
    } finally {
      setLoading(false)
    }

    // Tarif limitlarini (pricing_plans.limits) yuklash
    try {
      const res = await fetch('/api/settings/pricing', { cache: 'no-cache' })
      const result = await res.json()
      if (result.success && Array.isArray(result.data)) {
        const limits: Record<string, Record<string, number>> = {}
        for (const p of result.data) {
          if (p.id && p.limits && typeof p.limits === 'object') {
            limits[p.id] = { ...(DEFAULT_MATRIX_LIMITS[p.id] || {}), ...p.limits }
          } else if (p.id) {
            limits[p.id] = DEFAULT_MATRIX_LIMITS[p.id] || {}
          }
        }
        if (Object.keys(limits).length > 0) setMatrixLimits(limits)
      }
    } catch {}
  }

  // Admin narx/limit o'zgartirsa — realtime yangilanadi
  usePricingRealtime(loadPricingPlans)

  const benefits = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI texnologiyasi',
      description: "Zamonaviy sun'iy intellekt huquqiy masalalaringizni tez va aniq hal qiladi",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Xavfsizlik',
      description: "Ma'lumotlaringiz to'liq xavfsiz va maxfiy saqlanadi",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Tezlik',
      description: 'Sekundlar ichida javob oling va vaqtingizni tejang',
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: "Qo'llab-quvvatlash",
      description: 'Kun davomida yordam beradigan mutaxassislar jamoasi',
    },
  ]

  return (
    <div className="min-h-screen bg-page-custom mobile-safe-top">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="absolute inset-0 bg-black opacity-10" />{' '}
        <div className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Crown className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold mb-4 sm:mb-6">
              Juristiv Premium ga o'ting
            </h1>
            <p className="text-base sm:text-xl text-white/90 mb-6 sm:mb-8 max-w-3xl mx-auto">
              Professional huquqchilar va talabalar uchun zamonaviy AI yordamchisi. Vaqtingizni
              tejang, samaradorlikni oshiring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/manual-payment?plan=bepul&amount=0">
                <Button
                  size="lg"
                  className="bg-white dark:bg-zinc-900 text-blue-600 hover:bg-gray-100 dark:bg-zinc-800/30"
                >
                  Bepul sinab ko'rish
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
          {plans.map((plan, index) => {
            const priceFormatted = plan.price.toLocaleString() + ' UZS'
            const isPopular = index === 1 // Standart is popular
            const isFree = plan.price === 0
            return (
              <Card
                key={index}
                className={`card-default relative ${isPopular ? 'ring-2 ring-blue-500 shadow-2xl transform scale-105' : 'shadow-lg'}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-blue-600 text-white px-4 py-2 shadow-lg">
                      <Star className="w-4 h-4 mr-1" />
                      Eng mashhur
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
                    {plan.name}
                  </CardTitle>
                  <div className="mb-4">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">
                      {isFree ? '0 UZS' : priceFormatted}
                      {!isFree && (
                        <span className="text-lg text-gray-500 dark:text-zinc-400 font-normal">
                          /oyiga
                        </span>
                      )}
                    </div>
                    {plan.caseLimit === -1 && (
                      <Badge className="mt-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        Cheksiz
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/manual-payment?plan=${plan.id}&amount=${plan.price}`}>
                    <Button
                      className={`w-full ${isPopular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 dark:bg-zinc-800 hover:bg-gray-700 dark:hover:bg-zinc-700'}`}
                      size="lg"
                    >
                      {isFree ? 'Bepul boshlash' : `${priceFormatted} to'lash`}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
        {/* ── TO'LIQ FUNKSIYA MATRITSASI ── */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-4">
            Tariflarni solishtiring
          </h2>
          <p className="text-center text-gray-500 dark:text-zinc-400 mb-8">
            Har bir tarifda qaysi funksiyalar ochiq va qanday limitlar bor — barchasi aniq
          </p>

          <div className="card-default rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800/60 border-b border-gray-100 dark:border-zinc-700">
                    <th className="text-left px-4 sm:px-6 py-4 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider min-w-[200px]">
                      Funksiya
                    </th>
                    {plans.map((plan, i) => (
                      <th
                        key={plan.id}
                        className={`px-3 sm:px-5 py-4 text-center text-sm font-bold ${
                          i === 1
                            ? 'text-blue-600 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-900/10'
                            : 'text-gray-800 dark:text-white'
                        }`}
                      >
                        {plan.name}
                        <span className="block text-[10px] font-normal text-gray-400 dark:text-zinc-500 mt-0.5">
                          {plan.price === 0 ? "0 so'm" : `${plan.price.toLocaleString()} so\'m/oy`}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Asosiy (cheksiz) funksiyalar */}
                  <tr className="border-b border-gray-50 dark:border-zinc-800">
                    <td className="px-4 sm:px-6 py-3 font-medium text-gray-700 dark:text-zinc-300">
                      Qonunlar bazasi (8 kodeks, 4000+ modda)
                    </td>
                    <td className="px-3 py-3 text-center text-green-600 dark:text-green-400">
                      ✅ To\'liq
                    </td>
                    <td className="px-3 py-3 text-center text-green-600 dark:text-green-400 bg-blue-50/60 dark:bg-blue-900/10">
                      ✅ To\'liq
                    </td>
                    <td className="px-3 py-3 text-center text-green-600 dark:text-green-400">
                      ✅ To\'liq
                    </td>
                  </tr>
                  <tr className="border-b border-gray-50 dark:border-zinc-800">
                    <td className="px-4 sm:px-6 py-3 font-medium text-gray-700 dark:text-zinc-300">
                      Qidiruv (kodekslar bo\'yicha)
                    </td>
                    <td className="px-3 py-3 text-center text-green-600 dark:text-green-400">
                      100/kun
                    </td>
                    <td className="px-3 py-3 text-center text-green-600 dark:text-green-400 bg-blue-50/60 dark:bg-blue-900/10">
                      Cheksiz
                    </td>
                    <td className="px-3 py-3 text-center text-green-600 dark:text-green-400">
                      Cheksiz
                    </td>
                  </tr>
                  <tr className="border-b border-gray-50 dark:border-zinc-800">
                    <td className="px-4 sm:px-6 py-3 font-medium text-gray-700 dark:text-zinc-300">
                      Asboblar (kalkulyatorlar, jazo hisoblash)
                    </td>
                    <td className="px-3 py-3 text-center text-green-600 dark:text-green-400">
                      ✅ To\'liq
                    </td>
                    <td className="px-3 py-3 text-center text-green-600 dark:text-green-400 bg-blue-50/60 dark:bg-blue-900/10">
                      ✅ To\'liq
                    </td>
                    <td className="px-3 py-3 text-center text-green-600 dark:text-green-400">
                      ✅ To\'liq
                    </td>
                  </tr>
                  <tr className="border-b border-gray-50 dark:border-zinc-800">
                    <td className="px-4 sm:px-6 py-3 font-medium text-gray-700 dark:text-zinc-300">
                      Jamiyat (guruhlar, lenta, ekspertlar)
                    </td>
                    <td className="px-3 py-3 text-center text-green-600 dark:text-green-400">
                      ✅ To\'liq
                    </td>
                    <td className="px-3 py-3 text-center text-green-600 dark:text-green-400 bg-blue-50/60 dark:bg-blue-900/10">
                      ✅ To\'liq
                    </td>
                    <td className="px-3 py-3 text-center text-green-600 dark:text-green-400">
                      ✅ To\'liq
                    </td>
                  </tr>

                  {/* AI funksiyalar — limitlar */}
                  {FEATURE_MATRIX.map(f => (
                    <tr
                      key={f.key}
                      className="border-b border-gray-50 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3 font-medium text-gray-700 dark:text-zinc-300">
                        {f.label}
                      </td>
                      {plans.map((plan, i) => (
                        <td
                          key={plan.id}
                          className={`px-3 py-3 text-center ${
                            i === 1 ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          {(matrixLimits[plan.id]?.[f.key] ?? 0) === -1 ? (
                            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                              <Check className="w-3.5 h-3.5" /> Cheksiz
                            </span>
                          ) : (
                            <span
                              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                (matrixLimits[plan.id]?.[f.key] ?? 0) > 0
                                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                              }`}
                            >
                              {fmtLimit(matrixLimits[plan.id]?.[f.key] ?? 0)}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Premium xususiyatlari */}
                  <tr className="border-b border-gray-50 dark:border-zinc-800">
                    <td className="px-4 sm:px-6 py-3 font-medium text-gray-700 dark:text-zinc-300">
                      PDF eksport (hujjatlar)
                    </td>
                    <td className="px-3 py-3 text-center text-red-500 dark:text-red-400 text-xs">
                      ❌ Faqat preview
                    </td>
                    <td className="px-3 py-3 text-center text-green-600 dark:text-green-400 bg-blue-50/60 dark:bg-blue-900/10">
                      ✅
                    </td>
                    <td className="px-3 py-3 text-center text-green-600 dark:text-green-400">✅</td>
                  </tr>
                  <tr>
                    <td className="px-4 sm:px-6 py-3 font-medium text-gray-700 dark:text-zinc-300">
                      Shaxsiy maslahatchi / ekspert
                    </td>
                    <td className="px-3 py-3 text-center text-red-500 dark:text-red-400 text-xs">
                      ❌
                    </td>
                    <td className="px-3 py-3 text-center text-red-500 dark:text-red-400 text-xs bg-blue-50/60 dark:bg-blue-900/10">
                      ❌
                    </td>
                    <td className="px-3 py-3 text-center text-green-600 dark:text-green-400">✅</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">
            Nega aynan Juristiv Premium?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="card-default text-center p-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 dark:text-zinc-500">
                  {benefit.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
        {/* CTA Section */}{' '}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">
            Huquqiy faoliyatingizni yangi bosqichga oshiring
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            14 kunlik bepul sinov muddati bilan boshlang. Hech qanday majburiyat yo'q.
          </p>
          <Link href="/manual-payment?plan=standart&amount=45000">
            <Button
              size="lg"
              className="bg-white dark:bg-zinc-900 text-blue-600 hover:bg-gray-100 dark:bg-zinc-800/30"
            >
              Standart rejani tanlash
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
