'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { DollarSign, CreditCard, Smartphone, Building, CheckCircle, Clock, AlertCircle, Download, Upload, FileText, Shield, User, Mail, Phone, Calendar, X } from 'lucide-react';

interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: string;
  features: string[];
  popular?: boolean;
}

interface PaymentRequest {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentMethod: 'manual' | 'bank-transfer' | 'cash' | 'other';
  userInfo: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
  createdAt: string;
  updatedAt: string;
  notes?: string;
  receipt?: string;
  trackingNumber: string;
}

export default function ManualPaymentProcessing() {
  const [activeTab, setActiveTab] = useState<'plans' | 'request' | 'history' | 'instructions'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
    paymentMethod: 'manual' as const
  });

  const paymentPlans: PaymentPlan[] = [
    {
      id: 'free',
      name: 'Bepul',
      price: 0,
      currency: 'so\'m',
      duration: 'Cheksiz',
      features: [
        '5 ta IRAC tahlili',
        'Asosiy qonunlar bazasi',
        'Cheklangan AI yordami',
        'Community forum'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 100000,
      currency: 'so\'m',
      duration: 'Oylik',
      popular: true,
      features: [
        'Cheksiz IRAC tahlili',
        'To\'liq qonunlar bazasi',
        'AI yordami 24/7',
        'Hujjat generatsiyasi',
        'Sud simulyatori',
        'Priority support'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 250000,
      currency: 'so\'m',
      duration: 'Oylik',
      features: [
        'Pro rejaning barcha imkoniyatlari',
        'Shaxsiy konsultatsiya',
        'Advanced analitika',
        'Custom qonun shablonlari',
        'VIP support',
        'Webinarlar va treninglar'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 1000000,
      currency: 'so\'m',
      duration: 'Oylik',
      features: [
        'Premium rejaning barcha imkoniyatlari',
        'Team management',
        'API access',
        'Custom integratsiya',
        'On-premise deployment',
        'Dedicated support'
      ]
    }
  ];

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    try {
      // Load from localStorage
      const stored = localStorage.getItem('payment_requests');
      if (stored) {
        const parsedRequests = JSON.parse(stored);
        setPaymentRequests(parsedRequests);
      } else {
        setPaymentRequests([]);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
      setPaymentRequests([]);
    }
  };

  const handlePaymentRequest = async () => {
    if (!selectedPlan || !formData.name || !formData.email || !formData.phone) {
      alert('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    try {
      setLoading(true);
      
      // Generate tracking number
      const trackingNumber = `TRK${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      // Create payment request
      const newRequest: PaymentRequest = {
        id: Date.now().toString(),
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: selectedPlan.price,
        currency: selectedPlan.currency,
        status: 'pending',
        paymentMethod: formData.paymentMethod,
        userInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company || undefined
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: formData.notes,
        trackingNumber
      };

      // Add to history and save to localStorage
      const updatedRequests = [newRequest, ...paymentRequests];
      setPaymentRequests(updatedRequests);
      localStorage.setItem('payment_requests', JSON.stringify(updatedRequests));
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        notes: '',
        paymentMethod: 'manual'
      });
      setShowPaymentForm(false);
      setSelectedPlan(null);
      
      console.log('Payment request created:', newRequest);
      
      // Show success message
      alert(`To'lov so'rovi yaratildi!\n\nTracking raqami: ${trackingNumber}\n\nTo\'lov ma'lumotlari:\n${selectedPlan.name} - ${selectedPlan.price} ${selectedPlan.currency}\n\nIltimos, tracking raqamini saqlang.`);
      
      // Switch to history tab
      setActiveTab('history');
    } catch (error) {
      console.error('Error creating payment request:', error);
      alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return null;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank-transfer': return <Building className="w-4 h-4" />;
      case 'cash': return <DollarSign className="w-4 h-4" />;
      case 'manual': return <FileText className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const downloadReceipt = (receipt: string) => {
    // Mock receipt download
    const receiptData = {
      receipt: receipt,
      date: new Date().toISOString(),
      amount: '100000 so\'m',
      plan: 'Pro',
      status: 'completed'
    };
    
    const dataStr = JSON.stringify(receiptData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `receipt-${receipt}.json`);
    linkElement.click();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manual To\'lov Tizimi</h1>
        <p className="text-gray-600">To\'lovlarni qo'lda boshqarish</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'plans' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Rejalar</span>
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'request' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>So\'rov</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'history' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Tarix</span>
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'instructions' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Yo'riqnoma</span>
          </button>
        </div>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paymentPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Eng mashhur</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <div className="text-3xl font-bold">
                    {plan.price === 0 ? 'Bepul' : `${plan.price.toLocaleString()} ${plan.currency}`}
                  </div>
                  <p className="text-gray-600">{plan.duration}</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => {
                    setSelectedPlan(plan);
                    setShowPaymentForm(true);
                    setActiveTab('request');
                  }}
                >
                  {plan.price === 0 ? 'Bepuldan boshlash' : `${plan.price.toLocaleString()} so\'m`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Request Tab */}
      {activeTab === 'request' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>To\'lov So'rovi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedPlan && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{selectedPlan.name}</h4>
                        <p className="text-gray-600">{selectedPlan.duration}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedPlan.price.toLocaleString()} {selectedPlan.currency}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="To'liq ismingiz"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+998 90 123 45 67"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kompaniya (ixtiyoriy)</label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Kompaniya nomi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To\'lov usuli</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="manual">Qo'lda to'lash</option>
                      <option value="bank-transfer">Bank transfer</option>
                      <option value="cash">Naqd pul</option>
                      <option value="other">Boshqa usul</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Izoh (ixtiyoriy)</label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Qo'shimcha izohlar..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={handlePaymentRequest}
                    disabled={loading || !selectedPlan}
                    className="flex-1"
                  >
                    {loading ? 'Yuborilmoqda...' : 'So\'rov yuborish'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPlan(null);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        company: '',
                        notes: '',
                        paymentMethod: 'manual'
                      });
                    }}
                  >
                    Bekor qilish
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>To\'lov Ma'lumotlari</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Bank hisob raqamlari:</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Bank:</strong> O'zbekiston Respublikasi Markaziy Banki
                      </div>
                      <div>
                        <strong>Hisoq raqami:</strong> 12345678901234567890
                      </div>
                      <div>
                        <strong>INN:</strong> 123456789
                      </div>
                      <div>
                        <strong>MFO:</strong> 01001
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">To'lov uchun talablar:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• To'lov izohida tracking raqamini ko'rsating</li>
                      <li>• To'lov qilinganidan so'ng screenshot yuboring</li>
                      <li>• To'lov 1-3 ish kuni ichi tasdiqlanadi</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Qo'llab-quvvatlash</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">+998 90 123 45 67</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">support@jurisai.uz</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Dushanba-Juma, 9:00-18:00</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {paymentRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">To'lov tarixi yo'q</p>
              </CardContent>
            </Card>
          ) : (
            paymentRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-semibold text-lg">{request.planName}</h3>
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{request.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Miqdor:</p>
                          <p className="font-semibold">{request.amount.toLocaleString()} {request.currency}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">To\'lov usuli:</p>
                          <p className="font-semibold flex items-center space-x-1">
                            {getPaymentMethodIcon(request.paymentMethod)}
                            <span>{request.paymentMethod}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Tracking raqami:</p>
                          <p className="font-semibold">{request.trackingNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Yuborilgan sana:</p>
                          <p className="font-semibold">{new Date(request.createdAt).toLocaleDateString('uz-UZ')}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-gray-600 text-sm mb-1">Foydalanuvchi ma'lumotlari:</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span><strong>Ism:</strong> {request.userInfo.name}</span>
                          <span><strong>Email:</strong> {request.userInfo.email}</span>
                          <span><strong>Telefon:</strong> {request.userInfo.phone}</span>
                          {request.userInfo.company && (
                            <span><strong>Kompaniya:</strong> {request.userInfo.company}</span>
                          )}
                        </div>
                      </div>
                      
                      {request.notes && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-gray-600 text-sm mb-1">Izoh:</p>
                          <p className="text-sm">{request.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {request.receipt && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => request.receipt && downloadReceipt(request.receipt)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Instructions Tab */}
      {activeTab === 'instructions' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>To'lov Yo'riqnomasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">1. Rejani tanlang</h3>
                  <p className="text-gray-600">O'zingizga mos keladigan rejalardan birini tanlang. Har bir reja turlicha imkoniyatlarni o'z ichiga oladi.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">2. To'lov so'rovini yuboring</h3>
                  <p className="text-gray-600">Shaxsiy ma'lumotlaringizni to'ldiring va to'lov usulini tanlang. So'rov yuborilgandan so'ng tracking raqami beriladi.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">3. To'lovni amalga oshiring</h3>
                  <p className="text-gray-600">Ko'rsatilgan bank hisob raqamiga to'lovni amalga oshiring. To'lov izohida tracking raqamini ko'rsating.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">4. To'lovni tasdiqlang</h3>
                  <p className="text-gray-600">To'lov qilinganidan so'ng screenshot yoki chek rasmini support@jurisai.uz ga yuboring.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">5. Hisobingiz faollashadi</h3>
                  <p className="text-gray-600">To'lov tasdiqlangandan so'ng 1-3 ish kuni ichida hisobingiz faollashtiriladi va sizga email yuboriladi.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>To'lov Usullari</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center space-x-2">
                    <Building className="w-5 h-5" />
                    <span>Bank Transfer</span>
                  </h4>
                  <p className="text-gray-600 text-sm mb-2">Bevosita bank hisob raqamiga pul o'tkazish</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Tezkor va xavfsiz</li>
                    <li>• Katta miqdordagi to'lovlar uchun</li>
                    <li>• Bank komissiyasi qo'llanilishi mumkin</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Naqd Pul</span>
                  </h4>
                  <p className="text-gray-600 text-sm mb-2">Ofisimizda naqd pul bilan to'lov</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Shaxsan to'lov</li>
                    <li>• Qo'lda chek olish</li>
                    <li>• Operativ yordam</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Savol va Javoblar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">To'lov qancha vaqtda tasdiqlanadi?</h4>
                  <p className="text-gray-600 text-sm">Odatda 1-3 ish kuni ichida, lekin ba'zan 5 ish kungacha cho'zilishi mumkin.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">To'lov qaytarish mumkinmi?</h4>
                  <p className="text-gray-600 text-sm">Xizmat ko'rsatilmagan taqdirda 14 kun ichida to'lovni qaytarish mumkin.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Qo'shimcha yordam kerak bo'lsa?</h4>
                  <p className="text-gray-600 text-sm">Support jamoasiga +998 90 123 45 67 raqami yoki support@jurisai.uz emaili orqali murojaat qiling.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
