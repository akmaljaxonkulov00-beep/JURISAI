'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getAuthHeaders } from '@/lib/api-auth-client'
import {
  ArrowLeft,
  CreditCard,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  QrCode,
} from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import CheckoutModal from '@/components/payment/checkout-modal'
import type { SiteSettings } from '@/lib/settings-sync'

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [amount, setAmount] = useState(0)
  const [planName, setPlanName] = useState('')
  const [checkImage, setCheckImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success'>('idle')
  const [adminSettings, setAdminSettings] = useState<Partial<SiteSettings> | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkStatus, setCheckStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    // Load admin settings (bank cards from admin panel) — with Supabase sync
    loadCardSettings()
  }, [])

  // ── Chek holatini real vaqtda kuzatish (Kutilmoqda/Tasdiqlangan/Rad etilgan) ──
  useEffect(() => {
    if (paymentStatus !== 'pending') return
    const user = JSON.parse(
      sessionStorage.getItem('juristiv_user') || sessionStorage.getItem('auth_user') || '{}'
    )
    if (!user?.id) return

    let cancelled = false
    const checkStatusNow = async () => {
      try {
        // Identity session'dan olinadi — userId param uzatilmaydi (IDOR himoyasi)
        const authHeaders = await getAuthHeaders()
        const res = await fetch('/api/payments', {
          cache: 'no-cache',
          headers: { ...authHeaders },
        })
        const result = await res.json()
        if (!result.success || cancelled) return
        const reqs = result.data?.payments || []
        if (reqs.length === 0) return
        const latest = reqs[0]
        if (latest.status === 'approved') {
          setCheckStatus('approved')
          // Lokaldagi foydalanuvchi sessiyasini premium qilamiz
          const stored =
            sessionStorage.getItem('juristiv_user') || sessionStorage.getItem('auth_user')
          if (stored) {
            try {
              const u = JSON.parse(stored)
              const updated = {
                ...u,
                subscription_plan: latest.plan || u.subscription_plan || 'standart',
                subscription_expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
              }
              sessionStorage.setItem('juristiv_user', JSON.stringify(updated))
              sessionStorage.setItem('auth_user', JSON.stringify(updated))
              localStorage.setItem('auth_user', JSON.stringify(updated))
            } catch {}
          }
        } else if (latest.status === 'rejected') {
          setCheckStatus('rejected')
        }
      } catch {}
    }

    checkStatusNow()
    const timer = setInterval(checkStatusNow, 15000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [paymentStatus])

  const loadCardSettings = async () => {
    // Use sync service — tries Supabase first, falls back to localStorage
    const { getPublicSettings } = await import('@/lib/settings-sync')
    const settings = await getPublicSettings()
    if (settings) {
      setAdminSettings(settings)
    }
  }

  // Get dynamic card info from admin settings
  const cardNumber = adminSettings?.paymentCardNumber || '8600 1234 5678 9012'
  const paymentDetails =
    adminSettings?.paymentDetails ||
    `Click: *123# ${amount.toLocaleString()} UZS / Payme: 8600 1234 5678 9012`

  useEffect(() => {
    const plan = searchParams.get('plan') || 'standart'
    const amt = parseInt(searchParams.get('amount') || '45000')

    if (amt === 0) {
      setPaymentStatus('success')
      setPlanName('Bepul')
      setAmount(0)
    } else {
      setAmount(amt)
      setPlanName(plan === 'standart' ? 'Standart' : 'Pro')
    }
  }, [searchParams])

  const plans = [
    {
      id: 'standart',
      name: 'Standart',
      price: 45000,
      features: [
        "200 ta AI chat so'rovi / oy",
        'Cheksiz IRAC tahlili',
        '50 ta hujjat generator / oy',
        '20 ta hujjat tahlili / oy',
        '20 ta qarorlar daraxti / oy',
        '100 ta ovozli yozuv (STT) / oy',
        '5 ta virtual sud sessiyasi / oy',
        '20 ta senariy generator / oy',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 140000,
      features: [
        "Cheksiz AI chat so'rovlari",
        'Cheksiz IRAC, hujjat, daraxt, senariy',
        'Cheksiz ovozli yozuv (STT)',
        'Cheksiz virtual sud sessiyalari',
        'Shaxsiy maslahatchi',
        'Ekspert konsultatsiyasi',
      ],
    },
  ]

  const handlePlanSelect = (planId: string, price: number) => {
    setPlanName(planId === 'standart' ? 'Standart' : 'Pro')
    setAmount(price)
    if (price > 0) {
      setShowCheckout(true)
    }
    router.replace(`/manual-payment?plan=${planId}&amount=${price}`)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) return
      if (file.size > 5 * 1024 * 1024) return
      setCheckImage(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmitPayment = async () => {
    if (!checkImage) return
    setIsSubmitting(true)

    try {
      const user = JSON.parse(
        sessionStorage.getItem('juristiv_user') || sessionStorage.getItem('auth_user') || '{}'
      )

      // Step 1: Upload image to Supabase Storage via API
      let receiptUrl = ''
      try {
        const formData = new FormData()
        formData.append('file', checkImage)
        formData.append('userId', user.id || 'unknown')

        const uploadAuthHeaders = await getAuthHeaders()
        const uploadRes = await fetch('/api/upload', {
          credentials: 'include',
          method: 'POST',
          headers: { ...uploadAuthHeaders },
          body: formData,
        })
        const uploadResult = await uploadRes.json()
        if (uploadResult.success && uploadResult.data?.url) {
          receiptUrl = uploadResult.data.url
        }
      } catch (e) {
        console.warn('[Payment] Supabase upload failed, using base64:', e)
      }

      // Step 2: base64 fallback
      if (!receiptUrl) {
        try {
          const reader = new FileReader()
          const imageBase64 = await new Promise<string>(resolve => {
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(checkImage)
          })
          receiptUrl = imageBase64
        } catch (e) {
          console.error('[Payment] base64 fallback failed:', e)
        }
      }

      // Step 3: Create payment record — save to localStorage for admin pickup AND try Supabase
      const paymentRecord = {
        id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        userId: user.id || 'unknown',
        userEmail: user.email || 'unknown',
        userName: user.name || 'Foydalanuvchi',
        plan: planName.toLowerCase(),
        amount,
        receiptImage: receiptUrl,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      }

      // Save to localStorage for immediate admin pickup
      try {
        const existing = JSON.parse(localStorage.getItem('payment_requests') || '[]')
        existing.push(paymentRecord)
        localStorage.setItem('payment_requests', JSON.stringify(existing))
      } catch {}

      // Also save as user's payment_history
      try {
        localStorage.setItem(
          'payment_history',
          JSON.stringify({
            status: 'pending',
            amount,
            plan: planName.toLowerCase(),
            date: new Date().toLocaleDateString('uz-UZ'),
            receiptImage: receiptUrl,
          })
        )
      } catch {}

      // Try Supabase log — pass same ID so admin can look it up
      try {
        const logAuthHeaders = await getAuthHeaders()
        await fetch('/api/log/payment', {
          credentials: 'include',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...logAuthHeaders },
          body: JSON.stringify({
            id: paymentRecord.id,
            userId: user.id || 'unknown',
            userEmail: user.email || 'unknown',
            userName: user.name || '',
            plan: planName.toLowerCase(),
            amount,
            receiptImage: receiptUrl,
          }),
        })
      } catch {}

      setPaymentStatus('pending')
    } catch (e) {
      console.error('[Payment] Error:', e)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (paymentStatus === 'success' && amount === 0) {
    return (
      <div className="min-h-screen bg-page-custom flex items-center justify-center p-4">
        <Card className="w-full max-w-md card-default rounded-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-gray-800 dark:text-white">
              Bepul reja faollashtirildi
            </CardTitle>
            <p className="text-gray-500 dark:text-gray-400 dark:text-zinc-500 mt-2">
              Bepul rejadan foydalanishni boshlashingiz mumkin
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Dashboardga o'tish
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (paymentStatus === 'pending') {
    return (
      <div className="min-h-screen bg-page-custom flex items-center justify-center p-4">
        <Card className="w-full max-w-lg card-default rounded-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-gray-800 dark:text-white">
              To'lov tekshiruvda
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {checkStatus === 'pending' && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">
                  Kutilmoqda — to'lovingiz moderator tomonidan tekshirilmoqda.
                </p>
                <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                  Odatda 1-24 soat ichida tasdiqlanadi. Holat avtomatik yangilanadi.
                </p>
              </div>
            )}
            {checkStatus === 'approved' && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <p className="text-green-700 dark:text-green-300 text-sm font-medium">
                  ✓ Tasdiqlandi — premium tarif faollashtirildi!
                </p>
              </div>
            )}
            {checkStatus === 'rejected' && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                  ✗ Rad etildi — chek tekshiruvdan o'tmadi.
                </p>
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                  Yangi chek yuklash uchun qaytaring: /premium
                </p>
              </div>
            )}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 dark:text-zinc-500">Tarif:</span>
                <span className="font-medium text-gray-800 dark:text-white">{planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 dark:text-zinc-500">Summa:</span>
                <span className="font-medium text-gray-800 dark:text-white">
                  {amount.toLocaleString()} UZS
                </span>
              </div>
            </div>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Chek"
                className="w-full max-w-xs mx-auto rounded-lg shadow-sm"
              />
            )}
            <Button
              onClick={() => router.push(checkStatus === 'approved' ? '/dashboard' : '/premium')}
              className="w-full"
            >
              {checkStatus === 'approved'
                ? "Dashboardga o'tish"
                : checkStatus === 'rejected'
                  ? 'Qayta urinish'
                  : 'Dashboardga qaytish'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page-custom mobile-safe-top p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/premium')}
            className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="text-sm font-medium">Orqaga</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">To'lov qilish</h1>
        </div>

        {/* Plan selector tabs */}
        <div className="flex gap-2 mb-8">
          {plans.map(p => (
            <button
              key={p.id}
              onClick={() => handlePlanSelect(p.id, p.price)}
              className={`flex-1 p-6 rounded-2xl text-center transition-all border-2 ${planName === p.name ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' : 'border-gray-200 dark:border-gray-700 card-default hover:border-blue-300'}`}
            >
              <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">{p.name}</h3>
              <p className="text-2xl font-bold text-blue-600">
                {p.price.toLocaleString()}{' '}
                <span className="text-sm font-normal text-gray-500 dark:text-zinc-500">UZS/oy</span>
              </p>
              <ul className="mt-3 space-y-1 text-left">
                {p.features.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 dark:text-zinc-500"
                  >
                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Info */}
          <Card className="card-default rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                <CreditCard className="w-5 h-5 text-blue-500" /> To'lov ma'lumotlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-3">
                  Tanlangan tarif: <strong>{planName}</strong>
                </h3>
                <div className="text-3xl font-bold text-blue-600">
                  {amount.toLocaleString()} UZS
                </div>
                <p className="text-blue-500 text-sm mt-1">oyiga</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-800 dark:text-white">To'lov usullari:</h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">Click / Payme</h4>
                  <p className="font-mono text-sm text-gray-600 dark:text-gray-400 dark:text-zinc-500">
                    {cardNumber}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                    Click: *123# {amount.toLocaleString()} UZS
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">Bank karta</h4>
                  <p className="font-mono text-sm text-gray-600 dark:text-gray-400 dark:text-zinc-500">
                    {cardNumber}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                    Humo, Uzcard, Visa
                  </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">QR kod</h4>
                  <div className="w-28 h-28 mx-auto bg-white dark:bg-gray-700 rounded-xl border dark:border-gray-600 flex items-center justify-center">
                    <QrCode className="w-14 h-14 text-gray-400 dark:text-zinc-500" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mt-2">
                    QR kodni skanerlang
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Check Upload */}
          <Card className="card-default rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                <Upload className="w-5 h-5 text-blue-500" /> Chek rasmini yuklash
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-300">Muhim</p>
                  <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">
                    To'lov qilgandan so'ng chek rasmini yuklang. Moderator tomonidan tekshirilgandan
                    so'ng tarif imkoniyatlari ochiladi (1-24 soat).
                  </p>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="check-upload"
                />
                <label
                  htmlFor="check-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <Upload className="w-10 h-10 text-gray-400 dark:text-zinc-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-zinc-500">
                    Chek rasmini yuklash uchun bosing
                  </span>
                  <span className="text-xs text-gray-400 dark:text-zinc-500">
                    PNG, JPG, WEBP (maks 5 MB)
                  </span>
                </label>
              </div>

              {previewUrl && (
                <div className="rounded-xl overflow-hidden border dark:border-gray-700">
                  <img src={previewUrl} alt="Chek preview" className="w-full" />
                </div>
              )}

              <Button
                onClick={handleSubmitPayment}
                disabled={!checkImage || isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {isSubmitting
                  ? 'Yuborilmoqda...'
                  : checkImage
                    ? "To'lovni tasdiqlash"
                    : 'Avval chek rasmini yuklang'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        plan={{ id: planName.toLowerCase(), name: planName, price: amount }}
        cardNumber={cardNumber}
        paymentDetails={paymentDetails}
        onSuccess={() => {
          setPaymentStatus('pending')
          setShowCheckout(false)
        }}
      />
    </div>
  )
}

export default function ManualPayment() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-page-custom flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  )
}
