'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Crown, Star, Check, ArrowRight, Sparkles, Shield, Zap, Headphones } from 'lucide-react';
import Link from 'next/link';

export default function Premium() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const plans = [
    {
      name: 'Pro',
      price: selectedPlan === 'monthly' ? '99,000' : '990,000',
      period: selectedPlan === 'monthly' ? 'oyiga' : 'yiliga',
      discount: selectedPlan === 'yearly' ? '2 oy bepul' : null,
      features: [
        'Cheksiz IRAC tahlili',
        'To\'liq qonunlar bazasi',
        'AI yordami 24/7',
        'Hujjat generatsiyasi',
        'Sud simulyatori',
        'Priority support',
        '500 AI so\'rovi',
        '50 hujjat generatsiyasi'
      ],
      badge: 'Eng mashhur',
      badgeColor: 'bg-blue-100 text-blue-800',
      popular: true
    },
    {
      name: 'Premium',
      price: selectedPlan === 'monthly' ? '199,000' : '1,990,000',
      period: selectedPlan === 'monthly' ? 'oyiga' : 'yiliga',
      discount: selectedPlan === 'yearly' ? '3 oy bepul' : null,
      features: [
        'Pro rejasining barcha imkoniyatlari',
        'Cheksiz AI so\'rovlari',
        'Cheksiz hujjat generatsiyasi',
        'Shaxsiy maslahatchi',
        'Vebinarlar va treninglar',
        'Ekspert konsultatsiyasi',
        'Tezkor support (15 daqiqa ichida)',
        'Huquqiy yangiliklar va o\'zgarishlar'
      ],
      badge: 'Eng yaxshi',
      badgeColor: 'bg-purple-100 text-purple-800',
      popular: false
    },
    {
      name: 'Enterprise',
      price: 'Keling bog\'lanamiz',
      period: 'Korporatsiyalar uchun',
      discount: null,
      features: [
        'Premium rejasining barcha imkoniyatlari',
        'Jamoa uchun litsenziya',
        'API integratsiyasi',
        'Shaxsiy dashboard',
        'O\'qituvchi uchun materiallar',
        'Sertifikatlar',
        'O\'lchovlar va analitika',
        '24/7 personal manager'
      ],
      badge: 'Korporativ',
      badgeColor: 'bg-green-100 text-green-800',
      popular: false
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

  const testimonials = [
    {
      name: 'Azizbek Karimov',
      role: 'Advokat',
      content: 'JurisAI Premium mening ishimga katta qulaylik keltirdi. AI yordamida hujjatlarni tez tayyorlayman.',
      rating: 5
    },
    {
      name: 'Dilora Nosirova',
      role: 'Huquqshunos talaba',
      content: 'IRAC tahlili va sud simulyatori orqali amaliy ko\'nikmalarim oshdi. Juda foydali platforma!',
      rating: 5
    },
    {
      name: 'Bobur Alimov',
      role: 'Yurist',
      content: 'AI yordamchi 24/7 ishlaydi. Kechasi ham masalalarni hal qilishim mumkin. Rahmat!',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="absolute inset-0 bg-black opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Crown className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6">
              JurisAI Premium ga o'ting
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Professional huquqchilar va talabalar uchun zamonaviy AI yordamchisi. 
              Vaqtingizni tejang, samaradorlikni oshiring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                Bepul sinab ko'rish
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                Demo ko'rish
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 rounded-full p-1 flex">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`px-6 py-2 rounded-full transition-all ${
                selectedPlan === 'monthly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600'
              }`}
            >
              Oylik
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`px-6 py-2 rounded-full transition-all ${
                selectedPlan === 'yearly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600'
              }`}
            >
              Yillik
              <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                20% chegirma
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${
                plan.popular
                  ? 'ring-2 ring-purple-500 shadow-2xl transform scale-105'
                  : 'shadow-lg'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-4 py-2">
                    <Star className="w-4 h-4 mr-1" />
                    Eng mashhur
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                <div className="mb-4">
                  <div className="text-4xl font-bold text-gray-900">
                    {plan.price}
                    <span className="text-lg text-gray-600 font-normal">/{plan.period}</span>
                  </div>
                  {plan.discount && (
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      {plan.discount}
                    </Badge>
                  )}
                </div>
                {plan.badge && (
                  <Badge className={plan.badgeColor}>{plan.badge}</Badge>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href={`/manual-payment?plan=${plan.name.toLowerCase()}`}>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                    size="lg"
                  >
                    {plan.name === 'Enterprise' ? 'Aloqaga chiqish' : 'Premiumga o\'tish'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Nega aynan JurisAI Premium?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center p-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Foydalanuvchilarimiz nima deydi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Huquqiy faoliyatingizni yangi bosqichga oshiring
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            14 kunlik bepul sinov muddati bilan boshlang. Hech qanday majburiyat yo'q.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
              Bepul sinovni boshlash
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
              Batafsil ma'lumot
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
