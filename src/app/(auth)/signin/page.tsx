'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { supabaseClient, authHelpers } from '@/lib/supabase-client'

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

    console.log('=== LOGIN DEBUG ===')
    console.log('Email:', data.email)
    console.log('Password length:', data.password.length)

    try {
      console.log('Calling authHelpers.signIn...')
      const result: any = await authHelpers.signIn(data.email, data.password)
      
      console.log('Auth result:', result)

      if (result?.success) {
        console.log('Login successful!')
        console.log('User data:', result?.data)
        
        // Save email if remember me is checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', data.email)
          console.log('Email saved to localStorage')
        } else {
          localStorage.removeItem('rememberedEmail')
          console.log('Email removed from localStorage')
        }
        
        // Save auth data to localStorage for sidebar and AuthProvider
        if (result?.data?.user || result?.data) {
          const userData: any = result?.data?.user || result?.data
          // Save to 'auth_user' for sidebar
          localStorage.setItem('auth_user', JSON.stringify(userData))
          localStorage.setItem('auth_token', userData?.id || 'authenticated')
          // Save to 'jurisai_user' for AuthProvider in providers.tsx
          localStorage.setItem('jurisai_user', JSON.stringify({
            id: userData.id || userData.sub,
            email: userData.email,
            name: userData.name || userData.user_metadata?.name || userData.email?.split('@')[0],
            role: userData.role || userData.user_metadata?.role || 'USER',
            subscription_plan: userData.subscription_plan || 'free'
          }))
          console.log('Auth data saved to localStorage for both auth systems')
        }
        
        // Get redirect URL from search params or default to dashboard
        const redirectTo = searchParams.get('redirectTo') || '/dashboard'
        console.log('Redirecting to:', redirectTo)
        
        // Redirect immediately after successful login
        router.push(redirectTo)
      } else {
        console.error('Login failed:', result?.error)
        setError(result?.error?.message || 'Login xatosi yuz berdi')
      }
    } catch (err) {
      console.error('Login error:', err)
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
      const result = await (authHelpers as any).resetPassword(email)
      if (result?.success) {
        setSuccess('Parolni tiklash bo\'yicha email yuborildi!')
      } else {
        setError(result?.error?.message || 'Parolni tiklashda xatolik yuz berdi')
      }
    } catch (err) {
      setError('Noma\'lum xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle social login with Supabase
  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      if (provider === 'Google') {
        const { error } = await supabaseClient.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/auth/callback'
          }
        })
        if (error) throw error
      } else {
        setError(`${provider} orqali login hozircha mavjud emas`)
      }
    } catch (err: any) {
      console.error('Social login error:', err)
      setError(err.message || 'Ijtimoiy tarmoq orqali kirishda xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Xush kelibsiz
        </h2>
        <p className="text-gray-600">
          JURISAI platformasiga kirish uchun login va parolingizni kiriting
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-700 text-sm font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Sign In Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email manzili
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="name@example.com"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Parol
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.password ? 'border-red-500' : 'border-gray-300'
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
            <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
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
            <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
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
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
        <p className="text-gray-600">
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
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Yoki</span>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSocialLogin('Google')}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133l1.414 1.414c2.395-2.395 3.52-5.893 3.52-9.413 0-.574-.05-1.14-.147-1.693l-8.84.179z"/>
              <path d="M5.84 14.09c-.22-.66-.353-1.36-.353-2.09s.133-1.43.353-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12.48 3v.005c3.305 0 5.64 1.86 6.56 4.41l2.62-2.62C19.56 2.11 16.27 0 12.48 0c-3.18 0-5.99 1.52-7.77 3.87l2.85 2.22c.92-1.86 2.48-3.09 4.92-3.09z"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin('GitHub')}
            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729 1.089-.745 1.089.745.094 1.089.745 1.089.745.892 1.651 2.328 1.234 2.328 1.234.645 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </div>
      </div>

      {/* Security Info */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          <Link href="/privacy" className="hover:text-gray-700">Maxfiylik siyosati</Link> • <Link href="/terms" className="hover:text-gray-700">Foydalanish shartlari</Link>
        </p>
      </div>
    </div>
  )
}
