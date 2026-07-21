'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { firebaseAuth } from '@/services/firebase-auth'

// Form validation schema
const signInSchema = z.object({
  email: z.string().email('Email formati noto\'g\'ri').min(1, 'Email majburiy'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
})

type SignInForm = z.infer<typeof signInSchema>

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await firebaseAuth.signIn(data.email, data.password)

      if (result.success) {
        // Save email if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', data.email)
        } else {
          localStorage.removeItem('rememberedEmail')
        }
        
        // Get redirect URL from search params or default to dashboard
        const redirectTo = searchParams.get('redirectTo') || '/dashboard'
        router.push(redirectTo)
      } else {
        setError(result.error || 'Login xatosi yuz berdi')
      }
    } catch (err) {
      setError('Noma\'lum xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.')
    } finally {
      setIsLoading(false)
    }
  }

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail')
    if (rememberedEmail) {
      setValue('email', rememberedEmail)
      setRememberMe(true)
    }
  }, [setValue])

  // Handle forgot password
  const handleForgotPassword = async () => {
    const email = watch('email')
    if (!email) {
      setError('Avval email manzilingizni kiriting')
      return
    }

    setIsLoading(true)
    try {
      const result = await firebaseAuth.resetPassword(email)
      if (result.success) {
        setSuccess('Parolni tiklash bo\'yicha email yuborildi!')
      } else {
        setError(result.error || 'Parolni tiklashda xatolik yuz berdi')
      }
    } catch (err) {
      setError('Noma\'lum xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Google login with Firebase
  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await firebaseAuth.signInWithGoogle()
      if (result.success) {
        router.push('/dashboard')
      } else {
        setError(result.error || 'Google orqali kirishda xatolik yuz berdi')
      }
    } catch (err: any) {
      setError(err.message || 'Google orqali kirishda xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Xush kelibsiz
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          JURISAI platformasiga kirish uchun login va parolingizni kiriting
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

      {/* Sign In Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={isLoading}
            >
              {showPassword ? (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29-3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isLoading}
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              Meni eslab qol
            </label>
          </div>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            disabled={isLoading}
          >
            Parolni unutdingizmi?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-blue-500/25"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Yuklanmoqda...
            </>
          ) : (
            'Tizimga kirish'
          )}
        </button>
      </form>

      {/* Sign Up Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Hisobingiz yo'qmi?{' '}
          <Link 
            href="/signup" 
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Ro'yxatdan o'ting
          </Link>
        </p>
      </div>

      {/* Social Login */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Yoki</span>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:shadow-md"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google orqali kirish
          </button>
        </div>
      </div>

      {/* Security Info */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-500">
          <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300">Maxfiylik siyosati</Link> • <Link href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">Foydalanish shartlari</Link>
        </p>
      </div>
    </div>
  )
}
