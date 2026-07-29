'use client'

import { useState, useRef } from 'react'
import { X, Upload, Check, AlertCircle, Loader2, Shield, CreditCard } from 'lucide-react'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  plan?: { id: string; name: string; price: number }
  cardNumber?: string
  paymentDetails?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function CheckoutModal({
  isOpen,
  onClose,
  plan,
  cardNumber = '8600 1234 5678 9012',
  paymentDetails = 'Click: *123# 45000 UZS / Payme: 8600 1234 5678 9012',
  onSuccess,
  onError,
}: CheckoutModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  if (!isOpen || !plan) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setErrorMsg('Faqat rasm fayllari qabul qilinadi')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg('Rasm hajmi 10MB dan oshmasligi kerak')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setErrorMsg('')
    setStatus('idle')
  }

  const handleSubmit = async () => {
    if (!file) {
      setErrorMsg("Iltimos, to'lov chekini yuklang")
      return
    }
    setIsSubmitting(true)
    setStatus('uploading')
    setErrorMsg('')

    try {
      // Upload to Supabase Storage
      const formData = new FormData()
      formData.append('file', file)
      formData.append('plan', plan.id)
      formData.append('amount', String(plan.price))

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      let receiptUrl = preview || ''

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json()
        receiptUrl = uploadData.url || receiptUrl
      }

      // Log payment request
      await fetch('/api/log/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.id,
          amount: plan.price,
          receiptImage: receiptUrl,
          payment_method: 'manual',
        }),
      })

      // Save to localStorage as fallback
      const existing = JSON.parse(localStorage.getItem('payment_requests') || '[]')
      existing.push({
        id: Date.now().toString(),
        plan: plan.id,
        amount: plan.price,
        receiptImage: receiptUrl,
        status: 'pending',
        createdAt: new Date().toISOString(),
        userEmail: JSON.parse(sessionStorage.getItem('jurisai_user') || '{}').email || 'unknown',
        userName:
          JSON.parse(sessionStorage.getItem('jurisai_user') || '{}').name || 'Foydalanuvchi',
      })
      localStorage.setItem('payment_requests', JSON.stringify(existing))

      setStatus('success')
      onSuccess?.()
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Yuklashda xatolik yuz berdi')
      onError?.(err.message || 'Yuklashda xatolik')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800/60 dark:border-zinc-700/60 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:text-zinc-400 transition-all z-10"
        >
          <X size={16} />
        </button>

        <div className="p-6">
          {/* Plan info */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {plan.name} tarifiga o'tish
              </h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                {plan.price.toLocaleString()} UZS / {plan.id === 'pro' ? 'yil' : 'oy'}
              </p>
            </div>
          </div>

          {/* Payment details */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                To'lov ma'lumotlari
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Karta raqami:</p>
            <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">
              {cardNumber}
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">{paymentDetails}</p>
          </div>

          {/* Status messages */}
          {status === 'success' && (
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2 mb-4">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-700 dark:text-green-300">
                To'lov chekingiz yuborildi! Admin tasdiqlashni kutmoqda.
              </span>
            </div>
          )}

          {errorMsg && status === 'error' && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-300">{errorMsg}</span>
            </div>
          )}

          {/* File upload */}
          {status !== 'success' && (
            <>
              <div
                onClick={() => fileRef.current?.click()}
                className="relative border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Chek rasmi"
                    className="max-h-40 mx-auto rounded-lg object-contain"
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">
                      To'lov chekini yuklang
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                      Rasm (PNG, JPG) — maksimal 10MB
                    </p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !file}
                className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white text-sm font-medium shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Yuklanmoqda...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Yuborish
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
