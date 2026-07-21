'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Crown, Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  limits: Record<string, any>;
  isActive: boolean;
  isPublic: boolean;
}

interface UserSubscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  plan: SubscriptionPlan;
}

export default function Billing() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    const mockPlans: SubscriptionPlan[] = [
      {
        id: '1', name: 'Bepul', slug: 'free',
        description: 'Boshlang\'ich uchun bepul reja',
        price: 0, currency: 'so\'m', billingCycle: 'monthly',
        features: ['5 ta IRAC tahlili', 'Asosiy qonunlar bazasi', 'Cheklangan AI yordami', 'Community forum'],
        limits: { iracAnalysis: 5, aiRequests: 10, lawSearch: 50 },
        isActive: true, isPublic: true
      },
      {
        id: '2', name: 'Pro', slug: 'pro',
        description: 'Professional foydalanuvchilar uchun',
        price: 100000, currency: 'so\'m', billingCycle: 'monthly',
        features: ['Cheksiz IRAC tahlili', 'To\'liq qonunlar bazasi', 'AI yordami 24/7', 'Hujjat generatsiyasi', 'Sud simulyatori', 'Priority support'],
        limits: { iracAnalysis: -1, aiRequests: 500, lawSearch: -1, documentGeneration: 50 },
        isActive: true, isPublic: true
      },
      {
        id: '3', name: 'Premium', slug: 'premium',
        description: 'Katta firmalar va advokatlar uchun',
        price: 250000, currency: 'so\'m', billingCycle: 'monthly',
        features: ['Barcha Pro xususiyatlari', 'Cheksiz AI so\'rovlari', 'Shaxsiy konsultatsiya', 'Team management', 'Custom integrations', 'VIP support', 'White label options'],
        limits: { iracAnalysis: -1, aiRequests: -1, lawSearch: -1, documentGeneration: -1, teamMembers: 10 },
        isActive: true, isPublic: true
      }
    ];
    setPlans(mockPlans);
  };

  const fetchCurrentSubscription = async () => {
    try {
      const mockSubscription: UserSubscription = {
        id: 'sub_123', status: 'ACTIVE',
        currentPeriodStart: '2024-01-01T00:00:00Z',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
        plan: {
          id: '2', name: 'Pro', slug: 'pro',
          description: 'Professional foydalanuvchilar uchun',
          price: 100000, currency: 'so\'m', billingCycle: 'monthly',
          features: ['Cheksiz IRAC tahlili', 'To\'liq qonunlar bazasi', 'AI yordami 24/7', 'Hujjat generatsiyasi', 'Sud simulyatori', 'Priority support'],
          limits: { iracAnalysis: -1, aiRequests: 500, lawSearch: -1, documentGeneration: 50 },
          isActive: true, isPublic: true
        }
      };
      setCurrentSubscription(mockSubscription);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page-custom flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-custom py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
            <ArrowLeft className="w-4 h-4" /> <span className="text-sm font-medium">Orqaga</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">To\'lovlar</h1>
        </div>

        {currentSubscription && (
          <Card className="card-default mb-8 rounded-2xl">
            <CardHeader className="border-b border-gray-100 dark:border-gray-700 pb-4">
              <CardTitle className="text-gray-800 dark:text-white">Joriy obuna</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{currentSubscription.plan.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={currentSubscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {currentSubscription.status === 'ACTIVE' ? 'Faol' : currentSubscription.status}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Qayta yangilanadi: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('uz-UZ')}
                      </span>
                    </div>
                  </div>
                </div>
                <Link href="/premium">
                  <Button variant="outline" className="flex items-center gap-2">
                    Rejani o'zgartirish <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.plan.id === plan.id;
            return (
              <Card key={plan.id} className={`card-default rounded-2xl relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="default" className="bg-blue-600">Joriy reja</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-center">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{plan.name}</h3>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                      {plan.price.toLocaleString('uz-UZ')}
                      <span className="text-lg text-gray-500 dark:text-gray-400 font-normal">/{plan.billingCycle === 'monthly' ? 'oy' : 'yil'}</span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
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
                      {isCurrentPlan ? 'Joriy reja' : plan.price > 0 ? 'To\'lov qilish' : 'Bepul reja'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
