'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/app/providers'
import { getRoleDashboardPath } from '@/lib/roles'
import { ArrowLeft, Home, Compass } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()
  const { user } = useAuth()
  const dashboardHref = getRoleDashboardPath(user?.role)

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(dashboardHref)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center px-4 py-12">
      <Card className="max-w-lg w-full border border-gray-200 dark:border-zinc-800 shadow-xl rounded-3xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-950/60 rounded-2xl flex items-center justify-center mb-4 border border-blue-200 dark:border-blue-900/50">
            <Compass className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            404 Xatolik
          </span>
          <CardTitle className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
            Sahifa topilmadi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-center">
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Kechirasiz, siz murojaat qilgan sahifa mavjud emas, nomi o‘zgargan yoki vaqtincha ko‘chirilgan.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Orqaga qaytish</span>
            </Button>

            <Button asChild className="flex-1 rounded-xl py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500">
              <Link href={dashboardHref} className="inline-flex items-center justify-center gap-2">
                <Home className="w-4 h-4" />
                <span>Bosh sahifa / Dashboard</span>
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Yordam kerak bo‘lsa:
            </p>
            <div className="flex justify-center items-center space-x-3 mt-1.5 text-xs">
              <a
                href="mailto:support@juristiv.uz"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                support@juristiv.uz
              </a>
              <span className="text-gray-300 dark:text-zinc-700">|</span>
              <Link href="/help" className="text-gray-500 hover:text-gray-900 dark:text-zinc-400">
                Yordam markazi
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
