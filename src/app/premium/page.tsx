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

export default function Premium() {
  const [plans, setPlans] = useState<PricingPlan[]>([
    {
      id: 'free',
      name: 'Bepul',
      price: 0,
      features: ['5 ta IRAC tahlili', 'Asosiy qonunlar bazasi', "10 ta AI so'rovi"],
      caseLimit: 5,
    },
    {
      id: 'standart',
      name: 'Standart',
      price: 45000,
      features: ['Cheksiz IRAC tahlili', "To'liq qonunlar bazasi", 'AI yordami 24/7', '50 hujjat'],
      caseLimit: 50,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 140000,
      features: [
        "Cheksiz AI so'rovlari",
        'Cheksiz hujjat',
        'Shaxsiy maslahatchi',
        'Ekspert konsultatsiyasi',
      ],
      caseLimit: -1,
    },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPricingPlans()
  }, [])

  const loadPricingPlans = async () => {
    try {
      const fetched = await getPricingPlans()
      if (fetched && fetched.length > 0) {
        setPlans(fetched)
      }
    } catch (err) {
      console.warn('[Premium] Failed to load pricing plans:', err)
    } finally {
      setLoading(false)
    }
  }

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
              JurisAI Premium ga o'ting
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
                      className={`w-full ${isPopular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 dark:bg-gray-600 hover:bg-gray-700 dark:hover:bg-gray-50 dark:bg-zinc-800/500'}`}
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
        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">
            Nega aynan JurisAI Premium?
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
