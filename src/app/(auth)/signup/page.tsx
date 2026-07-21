'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { firebaseAuth } from '@/services/firebase-auth'

// Form validation schema
const signUpSchema = z.object({
  name: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak'),
  email: z.string().email('Email formati noto\'g\'ri').min(1, 'Email majburiy'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  confirmPassword: z.string().min(1, 'Parolni tasdiqlang'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Parollar mos kelmadi',
  path: ['confirmPassword'],
})

type SignUpForm = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await firebaseAuth.signUp(data.email, data.password, data.name)

      if (result.success) {
        setSuccess('Ro\'yxatdan muvaffaqiyatli o\'tdingiz!')
        
        // Redirect to dashboard immediately
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } else {
        setError(result.error || 'Ro\'yxatdan o\'tish xatosi yuz berdi')
      }
    } catch (err) {
      setError('Noma\'lum xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Ro'yxatdan o'tish
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          JURISAI platformasiga qo'shilish uchun ma'lumotlaringizni kiriting
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-700 dark:text-green-300 text-sm font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Sign Up Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            To'liq ism
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register('name')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
              errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="John Doe"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email manzili
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
              errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="name@example.com"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Parol
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
              errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="••••••••"
            disabled={isLoading}
          />
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
          )}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Parol kamida 6 ta belgidan iborat bo'lishi kerak
          </p>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Parolni tasdiqlang
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="••••••••"
            disabled={isLoading}
          />
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start">
          <input
            id="terms"
            type="checkbox"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
            required
          />
          <label htmlFor="terms" className="ml-3 text-sm text-gray-600 dark:text-gray-400">
            Men{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Foydalanish shartlari
            </a>{' '}
            va{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Maxfiylik siyosati
            </a>{' '}
            ni o'qib chiqdim va roziman
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-blue-500/25"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Ro'yxatdan o'tilmoqda...
            </>
          ) : (
            'Ro\'yxatdan o\'tish'
          )}
        </button>
      </form>

      {/* Sign In Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Hisobingiz bormi?{' '}
          <Link 
            href="/signin" 
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Tizimga kirish
          </Link>
        </p>
      </div>

      {/* Benefits */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Ro'yxatdan o'tib nima olasiz:</p>
        <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
          <li className="flex items-center">
            <svg className="w-3 h-3 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            AI yordamida hujjatlar tayyorlash
          </li>
          <li className="flex items-center">
            <svg className="w-3 h-3 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Huquqiy masalalarni tahlil qilish
          </li>
          <li className="flex items-center">
            <svg className="w-3 h-3 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Virtual sud simulyatsiyasi
          </li>
          <li className="flex items-center">
            <svg className="w-3 h-3 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            24/7 professional yordam
          </li>
        </ul>
      </div>
    </div>
  )
}
