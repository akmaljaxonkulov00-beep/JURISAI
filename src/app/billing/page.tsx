'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { uzbekTranslations } from '@/lib/uzbek';

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
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      console.log('Fetching billing plans...');
      
      // Mock data for testing
      const mockPlans: SubscriptionPlan[] = [
        {
          id: '1',
          name: 'Bepul',
          slug: 'free',
          description: 'Boshlang\'ich uchun bepul reja',
          price: 0,
          currency: 'so\'m',
          billingCycle: 'monthly',
          features: [
            '5 ta IRAC tahlili',
            'Asosiy qonunlar bazasi',
            'Cheklangan AI yordami',
            'Community forum'
          ],
          limits: {
            iracAnalysis: 5,
            aiRequests: 10,
            lawSearch: 50
          },
          isActive: true,
          isPublic: true
        },
        {
          id: '2',
          name: 'Pro',
          slug: 'pro',
          description: 'Professional foydalanuvchilar uchun',
          price: 100000,
          currency: 'so\'m',
          billingCycle: 'monthly',
          features: [
            'Cheksiz IRAC tahlili',
            'To\'liq qonunlar bazasi',
            'AI yordami 24/7',
            'Hujjat generatsiyasi',
            'Sud simulyatori',
            'Priority support'
          ],
          limits: {
            iracAnalysis: -1,
            aiRequests: 500,
            lawSearch: -1,
            documentGeneration: 50
          },
          isActive: true,
          isPublic: true
        },
        {
          id: '3',
          name: 'Premium',
          slug: 'premium',
          description: 'Katta firmalar va advokatlar uchun',
          price: 250000,
          currency: 'so\'m',
          billingCycle: 'monthly',
          features: [
            'Barcha Pro xususiyatlari',
            'Cheksiz AI so\'rovlari',
            'Shaxsiy konsultatsiya',
            'Team management',
            'Custom integrations',
            'VIP support',
            'White label options'
          ],
          limits: {
            iracAnalysis: -1,
            aiRequests: -1,
            lawSearch: -1,
            documentGeneration: -1,
            teamMembers: 10
          },
          isActive: true,
          isPublic: true
        }
      ];
      
      setPlans(mockPlans);
      console.log('Mock billing plans loaded successfully');
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      console.log('Fetching current subscription...');
      
      // Mock current subscription
      const mockSubscription: UserSubscription = {
        id: 'sub_123',
        status: 'ACTIVE',
        currentPeriodStart: '2024-01-01T00:00:00Z',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
        plan: {
          id: '2',
          name: 'Pro',
          slug: 'pro',
          description: 'Professional foydalanuvchilar uchun',
          price: 100000,
          currency: 'so\'m',
          billingCycle: 'monthly',
          features: [
            'Cheksiz IRAC tahlili',
            'To\'liq qonunlar bazasi',
            'AI yordami 24/7',
            'Hujjat generatsiyasi',
            'Sud simulyatori',
            'Priority support'
          ],
          limits: {
            iracAnalysis: -1,
            aiRequests: 500,
            lawSearch: -1,
            documentGeneration: 50
          },
          isActive: true,
          isPublic: true
        }
      };
      
      setCurrentSubscription(mockSubscription);
      console.log('Mock current subscription loaded successfully');
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    try {
      console.log('Upgrading to plan:', planId);
      
      // Mock upgrade process - in real app, this would call Stripe API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Show success message
      alert(`Muvaffaqiyatli yangilandi! To'lov sahifasiga yo'naltirilmoqda...`);
      
      // In real app, redirect to Stripe checkout
      // window.location.href = checkoutUrl;
      
      // For now, just update the subscription
      const selectedPlan = plans.find(p => p.id === planId);
      if (selectedPlan) {
        const mockSubscription: UserSubscription = {
          id: 'sub_' + Date.now(),
          status: 'ACTIVE',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          plan: selectedPlan
        };
        setCurrentSubscription(mockSubscription);
      }
      
      console.log('Mock upgrade completed successfully');
    } catch (error) {
      alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Rostdan ham obunani bekor qilmoqchimisiz?')) {
      return;
    }

    try {
      console.log('Cancelling subscription...');
      
      // Mock cancellation process
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Update to free plan
      const freePlan = plans.find(p => p.slug === 'free');
      if (freePlan) {
        const mockSubscription: UserSubscription = {
          id: 'sub_free',
          status: 'ACTIVE',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          plan: freePlan
        };
        setCurrentSubscription(mockSubscription);
      }
      
      alert('Obuna muvaffaqiyatli bekor qilindi');
      console.log('Mock cancellation completed successfully');
    } catch (error) {
      alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            O'zingizga mos rejangni tanlang
          </h1>
          <p className="text-xl text-gray-600">
            Huquqiy ta'lim yo'lingiz uchun mukammal rejangni tanlang
          </p>
        </div>

        {currentSubscription && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Joriy obuna</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{currentSubscription.plan.name}</h3>
                  <p className="text-gray-600">
                    Holat: <Badge variant={currentSubscription.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {currentSubscription.status === 'ACTIVE' ? 'Faol' : currentSubscription.status}
                    </Badge>
                  </p>
                  <p className="text-sm text-gray-500">
                    Qayta yangilanadi: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                {currentSubscription.plan.slug !== 'free' && (
                  <Button variant="destructive" onClick={handleCancel}>
                    Obunani bekor qilish
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.plan.id === plan.id;
            const isUpgrade = currentSubscription && plan.price > currentSubscription.plan.price;

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  isCurrentPlan ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
                    <Badge variant="default">Joriy reja</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-center">
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="text-4xl font-bold text-blue-600 mt-2">
                      {plan.price.toLocaleString('uz-UZ')} {plan.currency}
                      <span className="text-lg text-gray-500">/{plan.billingCycle === 'monthly' ? 'oyiga' : 'yiliga'}</span>
                    </p>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? 'outline' : 'default'}
                    disabled={isCurrentPlan}
                    onClick={() => router.push(`/manual-payment?plan=${plan.id}`)}
                  >
                    {isCurrentPlan ? 'Joriy reja' : 'To\'lov qilish'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
