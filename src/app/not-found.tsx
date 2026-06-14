'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl text-gray-900">Sahifa topilmadi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600">
            Kechirasiz, siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Quyidagi variantlarni sinib ko'ring:
            </p>
            <ul className="text-sm text-gray-500 space-y-1 text-left">
              <li>URL manzilni to'g'ri yozganingizni tekshiring</li>
              <li><Link href="/dashboard" className="text-blue-600 hover:text-blue-500">Dashboard</Link> ga qaytib ko'ring</li>
              <li><Link href="/" className="text-blue-600 hover:text-blue-500">Bosh sahifa</Link> ga o'ting</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild className="flex-1">
              <Link href="/dashboard">
                Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/">
                Bosh sahifa
              </Link>
            </Button>
          </div>
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-400">
              Agar muammo davam etsa, iltimos biz bilan bog'laning:
            </p>
            <div className="flex justify-center space-x-4 mt-2">
              <a
                href="mailto:support@jurisai.uz"
                className="text-xs text-blue-600 hover:text-blue-500"
              >
                support@jurisai.uz
              </a>
              <span className="text-xs text-gray-400">|</span>
              <a
                href="tel:+998901234567"
                className="text-xs text-blue-600 hover:text-blue-500"
              >
                +998 90 123 45 67
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
