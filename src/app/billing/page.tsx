'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Crown, Check, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import FeatureInstructions from '@/components/ui/FeatureInstructions'

interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  description: string
  price: number
  currency: string
  billingCycle: string
  features: string[]
  limits: Record<string, unknown>
  isActive: boolean
  isPublic: boolean
}

interface UserSubscription {
  id: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  plan: SubscriptionPlan
}

export default function Billing() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
    fetchCurrentSubscription()
  }, [])

  // Tariflar — Supabase pricing_plans jadvalidan (real ma'lumot)
  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/billing/plans', { cache: 'no-cache' })
      const result = await res.json()
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setPlans(result.data)
      }
    } catch (e) {
      console.error('[Billing] Plans load error:', e)
    }
  }

  // Joriy obuna — registered_users dan (subscription_plan + expires_at)
  const fetchCurrentSubscription = async () => {
    try {
      const identity = await import('@/lib/client-user').then(m => m.getUserIdentityPayload())
      const userId = identity.userId
      if (!userId) {
        setLoading(false)
        return
      }
      const { supabase } = await import('@/lib/supabase-client')
      const { data, error } = await supabase
        .from('registered_users')
        .select('subscription_plan, subscription_expires_at')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error

      const planId = data?.subscription_plan || 'free'
      const expiresAt = data?.subscription_expires_at
      const isActive = !expiresAt || new Date(expiresAt).getTime() > Date.now()
      if (planId && planId !== 'free') {
        setCurrentSubscription({
          id: 'sub_' + planId,
          status: isActive ? 'ACTIVE' : 'EXPIRED',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: expiresAt || new Date().toISOString(),
          plan: {
            id: planId,
            name: planId === 'standart' ? 'Standart' : 'Pro',
            slug: planId,
            description: '',
            price: 0,
            currency: "so'm",
            billingCycle: 'monthly',
            features: [],
            limits: {},
            isActive: true,
            isPublic: true,
          },
        })
      }
    } catch (e) {
      console.error('[Billing] Subscription load error:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-page-custom flex items-center justify-center">
        <FeatureInstructions
          featureName="Tolov"
          steps={[
            {
              title: 'Joriy tarifingizni tekshiring',
              description:
                'Sizning hozirgi tarifingiz, muddati va limitlaringiz haqida malumot oling.',
              icon: '📋',
            },
            {
              title: 'Tarifni yangilang',
              description: 'Yangi tarifga otish uchun Premium sahifasiga oting.',
              icon: '⬆️',
            },
            {
              title: 'Tolovni amalga oshiring',
              description: 'Karta orqali yoki naqd pul orqali tolovni amalga oshiring.',
              icon: '💳',
            },
          ]}
          tips={[
            "Tolov muvaffaqiyatli amalga oshirilgandan so'ng tarif avtomatik yangilanadi",
            "Qo'shimcha savollaringiz bo'lsa, qo'llab-quvvatlash xizmatiga murojaat qiling",
          ]}
        />

        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 dark:text-zinc-500">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page-custom mobile-safe-top py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 mb-6 md:mb-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="text-sm font-medium">Orqaga</span>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
            {t('billingTitle')}
          </h1>
        </div>

        {currentSubscription && (
          <Card className="card-default mb-8 rounded-2xl">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
              <CardTitle className="text-gray-800 dark:text-white">
                {t('billingCurrentPlan')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {currentSubscription.plan.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={currentSubscription.status === 'ACTIVE' ? 'default' : 'secondary'}
                      >
                        {currentSubscription.status === 'ACTIVE'
                          ? t('activeStatus')
                          : currentSubscription.status}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-zinc-500">
                        {t('renewsOn')}:{' '}
                        {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('uz-UZ')}
                      </span>
                    </div>
                  </div>
                </div>
                <Link href="/premium">
                  <Button variant="outline" className="flex items-center gap-2">
                    {t('billingUpgrade')} <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {plans.map(plan => {
            const isCurrentPlan = currentSubscription?.plan.id === plan.id
            return (
              <Card
                key={plan.id}
                className={`card-default rounded-2xl relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="default" className="bg-blue-600">
                      {t('billingCurrentPlan')}
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-center">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                      {plan.name}
                    </h3>
                    {(plan as any).discountPercent > 0 ? (
                      <div className="mt-2">
                        <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                          {Math.round(
                            plan.price * (1 - ((plan as any).discountPercent || 0) / 100)
                          ).toLocaleString('uz-UZ')}
                          <span className="text-lg text-gray-500 dark:text-gray-400 font-normal">
                            /{plan.billingCycle === 'monthly' ? 'oy' : 'yil'}
                          </span>
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <span className="text-sm text-gray-400 line-through">
                            {plan.price.toLocaleString('uz-UZ')} so'm
                          </span>
                          <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                            -{(plan as any).discountPercent}%
                          </span>
                        </div>
                        {(plan as any).discountLabel && (
                          <p className="text-xs text-orange-500 font-medium mt-1">
                            🏷️ {(plan as any).discountLabel}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                        {plan.price.toLocaleString('uz-UZ')}
                        <span className="text-lg text-gray-500 dark:text-gray-400 font-normal">
                          /{plan.billingCycle === 'monthly' ? 'oy' : 'yil'}
                        </span>
                      </p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-zinc-500 mt-1">
                      {plan.description}
                    </p>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.price > 0 ? `/manual-payment?plan=${plan.id}` : '#'}>
                    <Button
                      className="w-full"
                      variant={isCurrentPlan ? 'outline' : 'default'}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan
                        ? t('billingCurrentPlan')
                        : plan.price > 0
                          ? t('billingSubmitCheck')
                          : t('premiumFree') + ' ' + t('billingPlan')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
