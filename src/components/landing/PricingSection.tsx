import React, { useState } from 'react';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface PricingPlan {
  id: string;
  name: string;
  price: number | null;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  cta: string;
  ctaVariant: 'default' | 'outline';
  icon?: React.ReactNode;
}

interface PricingSectionProps {
  className?: string;
}

const PricingSection: React.FC<PricingSectionProps> = ({ className }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Boshlang\'ich',
      price: 0,
      period: 'oyiga',
      description: 'Boshlang\'ich huquqshunoslar uchun bepul variant',
      features: [
        '5 ta IRAC tahlili',
        'Asosiy AI yordamchisi',
        'Huquqiy ma\'lumotlar bazasi (cheklangan)',
        'Virtual sud (1 ta sessiya)',
        'Hujjat generatori (2 ta shakl)',
        'Email yordami'
      ],
      cta: 'Bepul boshlang',
      ctaVariant: 'outline',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: 'student',
      name: 'Talaba',
      price: billingCycle === 'monthly' ? 49000 : 490000,
      period: billingCycle === 'monthly' ? 'oyiga' : 'yiliga',
      description: 'Talabalar uchun to\'liq funktsional variant',
      features: [
        'Cheksiz IRAC tahlili',
        'To\'liq AI yordamchisi',
        'To\'liq huquqiy ma\'lumotlar bazasi',
        'Virtual sud (cheksiz sessiya)',
        'Hujjat generatori (barcha shakllar)',
        'Qaror daraxti',
        'Weakness detector',
        'Senariy generatori',
        'Priority email yordami',
        'Mobile ilova'
      ],
      popular: true,
      cta: 'Tanlang',
      ctaVariant: 'default',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: 'professional',
      name: 'Professional',
      price: billingCycle === 'monthly' ? 149000 : 1490000,
      period: billingCycle === 'monthly' ? 'oyiga' : 'yiliga',
      description: 'Professional huquqshunoslar va advokatlar uchun',
      features: [
        'Barcha Talaba funksiyalari',
        'Advanced AI tahlili',
        'Custom shablonlar',
        'Team collaboration (5 ta foydalanuvchi)',
        'API access',
        'Custom integrations',
        'Priority support (24/7)',
        'Advanced analytics',
        'White label option',
        'Custom training sessions'
      ],
      cta: 'Tanlang',
      ctaVariant: 'outline',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: null,
      period: 'custom',
      description: 'Katta korporatsiyalar va davlat organlari uchun',
      features: [
        'Barcha Professional funksiyalari',
        'Cheksiz foydalanuvchilar',
        'Dedicated server',
        'On-premise deployment',
        'Custom development',
        'SLA guarantee',
        'Dedicated support team',
        'Compliance tools',
        'Advanced security',
        'Custom training programs'
      ],
      cta: 'Aloqaga chiqing',
      ctaVariant: 'outline',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ];

  const getYearlyDiscount = (monthlyPrice: number) => {
    const yearlyPrice = monthlyPrice * 12;
    return Math.round(yearlyPrice * 0.8); // 20% discount
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return 'Custom';
    return `${price.toLocaleString('uz-UZ')} so'm`;
  };

  return (
    <section className={cn('py-20 bg-gray-50', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Siz uchun <span className="text-emerald-600">to\'g\'ri tarif</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Har bir huquqshunos uchun mos variant - talabadan professionalgacha
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className={cn(
              'text-sm font-medium',
              billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'
            )}>
              Oylik
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
            <span className={cn(
              'text-sm font-medium',
              billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'
            )}>
              Yillik
              <Badge className="ml-2 bg-emerald-100 text-emerald-800 text-xs">
                20% chegirma
              </Badge>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                'relative hover:shadow-xl transition-all duration-300',
                plan.popular && 'border-2 border-emerald-500 shadow-lg scale-105'
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-emerald-500 text-white px-4 py-1">
                    Eng ommabop
                  </Badge>
                </div>
              )}

              <CardContent className="p-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center',
                      plan.popular ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
                    )}>
                      {plan.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                  
                  {/* Price */}
                  <div className="mb-4">
                    {plan.price !== null ? (
                      <div>
                        <span className="text-3xl font-bold text-gray-900">
                          {formatPrice(plan.price)}
                        </span>
                        <span className="text-gray-500 ml-1">/{plan.period}</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-gray-900">Custom</div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button
                  variant={plan.ctaVariant}
                  className={cn(
                    'w-full',
                    plan.popular && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  )}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Barcha tariflarda nima bor?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-medium text-gray-900">14 kun bepul sinov</h4>
                  <p className="text-sm text-gray-600">Hech qanday majburiyatsiz</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-medium text-gray-900">Istalgan vaqtda bekor qilish</h4>
                  <p className="text-sm text-gray-600">Hech qanday jarima</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-medium text-gray-900">24/7 texnik yordam</h4>
                  <p className="text-sm text-gray-600">Barcha tariflarda</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { PricingSection };
