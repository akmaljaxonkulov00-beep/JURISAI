'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Crown, Star, Check, ArrowRight, Sparkles, Shield, Zap, Headphones } from 'lucide-react';
import Link from 'next/link';

export default function Premium() {
  const plans = [
    {
      name: 'Bepul',
      price: '0 UZS',
      period: 'bepul',
      discount: null,
      features: [
        '5 ta IRAC tahlili',
        'Asosiy qonunlar bazasi',
        '10 ta AI so\'rovi',
        'Community forum'
      ],
      badge: null,
      popular: false,
      amount: 0
    },
    {
      name: 'Standart',
      price: '45,000 UZS',
      period: 'oyiga',
      discount: null,
      features: [
        'Cheksiz IRAC tahlili',
        "To'liq qonunlar bazasi",
        'AI yordami 24/7',
        'Hujjat generatsiyasi (50 ta)',
        'Sud simulyatori',
        'Priority support'
      ],
      badge: 'Eng mashhur',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      popular: true,
      amount: 45000
    },
    {
      name: 'Pro',
      price: '140,000 UZS',
      period: 'oyiga',
      discount: '20% tejam',
      features: [
        'Standart rejasining barcha imkoniyatlari',
        'Cheksiz AI so\'rovlari',
        'Cheksiz hujjat generatsiyasi',
        'Shaxsiy maslahatchi',
        'Huquqiy yangiliklar va o\'zgarishlar',
        'Tezkor support (15 daqiqa ichida)',
        'Ekspert konsultatsiyasi',
        'Vebinarlar va treninglar'
      ],
      badge: 'Eng yaxshi',
      badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      popular: false,
      amount: 140000
    }
  ];

  const benefits = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI texnologiyasi',
      description: 'Zamonaviy sun\'iy intellekt huquqiy masalalaringizni tez va aniq hal qiladi'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Xavfsizlik',
      description: 'Ma\'lumotlaringiz to\'liq xavfsiz va maxfiy saqlanadi'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Tezlik',
      description: 'Sekundlar ichida javob oling va vaqtingizni tejang'
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: 'Qo\'llab-quvvatlash',
      description: 'Kun davomida yordam beradigan mutaxassislar jamoasi'
    }
  ];

  return (
    <div className="min-h-screen bg-page-custom">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="absolute inset-0 bg-black opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Crown className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6">JurisAI Premium ga o'ting</h1>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Professional huquqchilar va talabalar uchun zamonaviy AI yordamchisi. 
              Vaqtingizni tejang, samaradorlikni oshiring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/manual-payment?plan=bepul&amount=0">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card key={index} className={`card-default relative ${plan.popular ? 'ring-2 ring-blue-500 shadow-2xl transform scale-105' : 'shadow-lg'}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <Badge className="bg-blue-600 text-white px-4 py-2 shadow-lg">
                    <Star className="w-4 h-4 mr-1" />
                    Eng mashhur
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">{plan.name}</CardTitle>
                <div className="mb-4">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                    {plan.period !== 'bepul' && <span className="text-lg text-gray-500 dark:text-gray-400 font-normal">/{plan.period}</span>}
                  </div>
                  {plan.discount && (
                    <Badge className="mt-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">{plan.discount}</Badge>
                  )}
                </div>
                {plan.badge && <Badge className={plan.badgeColor}>{plan.badge}</Badge>}
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
                <Link href={`/manual-payment?plan=${plan.name.toLowerCase()}&amount=${plan.amount}`}>
                  <Button className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 dark:bg-gray-600 hover:bg-gray-700 dark:hover:bg-gray-500'}`} size="lg">
                    {plan.amount === 0 ? 'Bepul boshlash' : `${plan.price} to'lash`}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">Nega aynan JurisAI Premium?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="card-default text-center p-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">{benefit.icon}</div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-500 dark:text-gray-400">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Huquqiy faoliyatingizni yangi bosqichga oshiring</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">14 kunlik bepul sinov muddati bilan boshlang. Hech qanday majburiyat yo'q.</p>
          <Link href="/manual-payment?plan=standart&amount=45000">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Standart rejani tanlash
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
