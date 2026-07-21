'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, CreditCard, Upload, CheckCircle, Clock, AlertCircle, QrCode } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [amount, setAmount] = useState(0);
  const [planName, setPlanName] = useState('');
  const [checkImage, setCheckImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success'>('idle');

  useEffect(() => {
    const plan = searchParams.get('plan') || 'standart';
    const amt = parseInt(searchParams.get('amount') || '45000');
    
    if (amt === 0) {
      setPaymentStatus('success');
      setPlanName('Bepul');
      setAmount(0);
    } else {
      setAmount(amt);
      setPlanName(plan === 'standart' ? 'Standart' : 'Pro');
    }
  }, [searchParams]);

  const plans = [
    { id: 'standart', name: 'Standart', price: 45000, features: ['Cheksiz IRAC tahlili', "To'liq qonunlar bazasi", 'AI yordami 24/7', '50 hujjat generatsiyasi'] },
    { id: 'pro', name: 'Pro', price: 140000, features: ['Cheksiz AI so\'rovlari', 'Cheksiz hujjat generatsiyasi', 'Shaxsiy maslahatchi', 'Ekspert konsultatsiyasi'] },
  ];

  const handlePlanSelect = (planId: string, price: number) => {
    setPlanName(planId === 'standart' ? 'Standart' : 'Pro');
    setAmount(price);
    router.replace(`/manual-payment?plan=${planId}&amount=${price}`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) return;
      setCheckImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmitPayment = async () => {
    if (!checkImage) return;
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setPaymentStatus('pending');
    setIsSubmitting(false);
  };

  if (paymentStatus === 'success' && amount === 0) {
    return (
      <div className="min-h-screen bg-page-custom flex items-center justify-center p-4">
        <Card className="w-full max-w-md card-default rounded-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-gray-800 dark:text-white">Bepul reja faollashtirildi</CardTitle>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Bepul rejadan foydalanishni boshlashingiz mumkin</p>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/dashboard')} className="w-full">Dashboardga o'tish</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'pending') {
    return (
      <div className="min-h-screen bg-page-custom flex items-center justify-center p-4">
        <Card className="w-full max-w-lg card-default rounded-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-gray-800 dark:text-white">To'lov tekshiruvda</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <p className="text-yellow-800 dark:text-yellow-300 text-sm">To'lovingiz moderator tomonidan tekshirilmoqda. 1-24 soat ichida tasdiqlanadi.</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-left space-y-2">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Tarif:</span><span className="font-medium text-gray-800 dark:text-white">{planName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Summa:</span><span className="font-medium text-gray-800 dark:text-white">{amount.toLocaleString()} UZS</span></div>
            </div>
            {previewUrl && <img src={previewUrl} alt="Chek" className="w-full max-w-xs mx-auto rounded-lg shadow-sm" />}
            <Button onClick={() => router.push('/dashboard')} className="w-full">Dashboardga qaytish</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-custom p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push('/premium')} className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
            <ArrowLeft className="w-4 h-4" /> <span className="text-sm font-medium">Orqaga</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">To'lov qilish</h1>
        </div>

        {/* Plan selector tabs */}
        <div className="flex gap-2 mb-8">
          {plans.map(p => (
            <button key={p.id} onClick={() => handlePlanSelect(p.id, p.price)}
              className={`flex-1 p-6 rounded-2xl text-center transition-all border-2 ${planName === p.name ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' : 'border-gray-200 dark:border-gray-700 card-default hover:border-blue-300'}`}>
              <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">{p.name}</h3>
              <p className="text-2xl font-bold text-blue-600">{p.price.toLocaleString()} <span className="text-sm font-normal text-gray-500">UZS/oy</span></p>
              <ul className="mt-3 space-y-1 text-left">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"><CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" /> {f}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Info */}
          <Card className="card-default rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white"><CreditCard className="w-5 h-5 text-blue-500" /> To'lov ma'lumotlari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-3">Tanlangan tarif: <strong>{planName}</strong></h3>
                <div className="text-3xl font-bold text-blue-600">{amount.toLocaleString()} UZS</div>
                <p className="text-blue-500 text-sm mt-1">oyiga</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-800 dark:text-white">To'lov usullari:</h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">Click / Payme</h4>
                  <p className="font-mono text-sm text-gray-600 dark:text-gray-400">8600 1234 5678 9012</p>
                  <p className="text-xs text-gray-500 mt-1">Click: *123# {amount.toLocaleString()} UZS</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">Bank karta</h4>
                  <p className="font-mono text-sm text-gray-600 dark:text-gray-400">8600 1234 5678 9012</p>
                  <p className="text-xs text-gray-500 mt-1">Humo, Uzcard, Visa</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">QR kod</h4>
                  <div className="w-28 h-28 mx-auto bg-white dark:bg-gray-700 rounded-xl border dark:border-gray-600 flex items-center justify-center">
                    <QrCode className="w-14 h-14 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">QR kodni skanerlang</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Check Upload */}
          <Card className="card-default rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white"><Upload className="w-5 h-5 text-blue-500" /> Chek rasmini yuklash</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-300">Muhim</p>
                  <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">To'lov qilgandan so'ng chek rasmini yuklang. Moderator tomonidan tekshirilgandan so'ng tarif imkoniyatlari ochiladi (1-24 soat).</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="check-upload" />
                <label htmlFor="check-upload" className="cursor-pointer flex flex-col items-center gap-3">
                  <Upload className="w-10 h-10 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Chek rasmini yuklash uchun bosing</span>
                  <span className="text-xs text-gray-400">PNG, JPG, WEBP (maks 5 MB)</span>
                </label>
              </div>

              {previewUrl && (
                <div className="rounded-xl overflow-hidden border dark:border-gray-700">
                  <img src={previewUrl} alt="Chek preview" className="w-full" />
                </div>
              )}

              <Button onClick={handleSubmitPayment} disabled={!checkImage || isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                {isSubmitting ? 'Yuborilmoqda...' : checkImage ? "To'lovni tasdiqlash" : "Avval chek rasmini yuklang"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ManualPayment() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-page-custom flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <PaymentContent />
    </Suspense>
  );
}
