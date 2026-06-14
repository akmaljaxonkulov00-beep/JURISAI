'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/services/auth';
import { api } from '@/services/api';
import { ArrowLeft, CreditCard, Upload, CheckCircle, Clock, AlertCircle, QrCode, Image } from 'lucide-react';

interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  popular?: boolean;
}

interface PaymentStatus {
  status: 'pending' | 'approved' | 'rejected';
  checkImage?: string;
  submittedAt?: string;
  processedAt?: string;
  message?: string;
}

export default function ManualPayment() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [checkImage, setCheckImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const paymentPlans: PaymentPlan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 49000,
      duration: '1 oy',
      features: [
        '50 ta IRAC tahlili',
        '10 ta hujjat generatori',
        'Asosiy kurslar',
        'Email support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 99000,
      duration: '1 oy',
      features: [
        'Cheksiz IRAC tahlili',
        'Cheksiz hujjat generatori',
        'Barcha kurslar',
        'Priority support',
        'AI yordamchi',
        'Virtual Court'
      ],
      popular: true
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: 499000,
      duration: 'Abadiy',
      features: [
        'Barcha Pro imkoniyatlari',
        'Yangi funksiyalar',
        'Personal manager',
        'Offline materiallar'
      ]
    }
  ];

  useEffect(() => {
    loadPaymentStatus();
  }, []);

  const loadPaymentStatus = async () => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const urlParams = new URLSearchParams(window.location.search);
      const planId = urlParams.get('plan');
      
      if (planId) {
        const plan = paymentPlans.find(p => p.id === planId);
        setSelectedPlan(plan || null);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading payment status:', error);
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: PaymentPlan) => {
    setSelectedPlan(plan);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Iltimos, faqat rasm faylini yuklang');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Rasm hajmi 5MB dan kichik bo\'lishi kerak');
        return;
      }

      setCheckImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedPlan || !checkImage) {
      alert('Iltimos, tarifni tanlang va chek rasmini yuklang');
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate file upload
      const formData = new FormData();
      formData.append('checkImage', checkImage);
      formData.append('planId', selectedPlan.id);
      formData.append('userId', user?.id || '1');

      setPaymentStatus({
        status: 'pending',
        checkImage: previewUrl,
        submittedAt: new Date().toISOString(),
        message: 'To\'lovingiz moderator tomonidan tekshirilmoqda. 1-24 soat ichida tasdiqlanadi.'
      });

    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('To\'lov yuborishda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">To\'lov Tekshiruvda</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">To\'lovingiz moderator tomonidan tekshirilmoqda</span>
              </div>
              <p className="text-yellow-700 text-sm">
                1-24 soat ichida tasdiqlanadi. Tasdiqlangandan so'ng tarif imkoniyatlari avtomatik ravishda ochiladi.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">To\'lov ma'lumotlari:</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tarif:</span>
                      <span className="font-medium">{selectedPlan?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Summa:</span>
                      <span className="font-medium">{selectedPlan?.price.toLocaleString()} UZS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Yuborilgan vaqt:</span>
                      <span className="font-medium">
                        {new Date(paymentStatus.submittedAt!).toLocaleString('uz-UZ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Yuklangan chek:</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {paymentStatus.checkImage && (
                    <img 
                      src={paymentStatus.checkImage} 
                      alt="Chek rasmi" 
                      className="w-full max-w-xs mx-auto rounded-lg shadow-sm"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1"
              >
                Dashboardga qaytish
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Statusni tekshirish
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/billing'}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Orqaga
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">To'lovni Amalga Oshirish</h1>
        </div>

        {!selectedPlan ? (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">To'lov tarifini tanlang</h2>
              <p className="text-gray-600">O'zingizga mos tarifni tanlang va to'lov qiling</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {paymentPlans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`relative cursor-pointer transition-all hover:shadow-lg ${
                    plan.popular ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                  }`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-500 text-white">Eng Ommabop</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold text-blue-600">
                      {plan.price.toLocaleString()} UZS
                    </div>
                    <div className="text-gray-600">{plan.duration}</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-6">
                      Tanlash
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  To'lov Ma'lumotlari
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-4">Tanlangan tarif:</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Tarif:</span>
                      <span className="font-medium text-blue-900">{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Summa:</span>
                      <span className="font-medium text-blue-900">{selectedPlan.price.toLocaleString()} UZS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Davomiyligi:</span>
                      <span className="font-medium text-blue-900">{selectedPlan.duration}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">To'lov usullari:</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Click yoki Payme</h4>
                    <div className="space-y-2">
                      <div className="bg-white rounded p-3 border">
                        <p className="font-mono text-sm mb-1">8600 1234 5678 9012</p>
                        <p className="text-xs text-gray-600">Click: *123#</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Bank karta</h4>
                    <div className="space-y-2">
                      <div className="bg-white rounded p-3 border">
                        <p className="font-mono text-sm mb-1">8600 1234 5678 9012</p>
                        <p className="text-xs text-gray-600">Humo, Uzcard, Visa</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">QR kod orqali</h4>
                    <div className="flex justify-center">
                      <div className="w-32 h-32 bg-white rounded-lg border flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-gray-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 text-center mt-2">
                      QR kodni skanerlang va to'lov qiling
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Chek Rasmini Yuklash
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Muhim</span>
                  </div>
                  <p className="text-yellow-700 text-sm">
                    To'lov qilgandan so'ng chek rasmini yuklang. Moderator tomonidan tekshirilgandan so'ng 
                    tarif imkoniyatlari ochiladi. Tekshiruv 1-24 soat davom etishi mumkin.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chek rasmini yuklang
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="check-upload"
                      />
                      <label 
                        htmlFor="check-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Rasmni tanlash yoki bu yerga tortib olish
                        </span>
                        <span className="text-xs text-gray-500">
                          PNG, JPG, GIF (max 5MB)
                        </span>
                      </label>
                    </div>
                  </div>

                  {previewUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Yuklangan rasm
                      </label>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <img 
                          src={previewUrl} 
                          alt="Chek rasmi" 
                          className="w-full rounded-lg shadow-sm"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setCheckImage(null);
                            setPreviewUrl('');
                          }}
                          className="mt-2 w-full"
                        >
                          Boshqa rasm yuklash
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedPlan(null)}
                    className="flex-1"
                  >
                    Boshqa tarif
                  </Button>
                  <Button 
                    onClick={handleSubmitPayment}
                    disabled={!checkImage || isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Yuborilmoqda...' : 'To\'lovni tasdiqlash'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
