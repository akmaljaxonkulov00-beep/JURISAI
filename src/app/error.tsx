'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl text-gray-900">Xatolik yuz berdi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600">
            Kechirasiz, ilovada kutmagan xatolik yuz berdi. Biz ushbu muammoni hal qilish ustida ishlamoqdamiz.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-3 text-left">
            <p className="text-sm font-medium text-gray-700 mb-1">Xatolik tafsilotlari:</p>
            <p className="text-xs text-gray-600 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500 mt-1">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Quyidagi variantlarni sinab ko'ring:
            </p>
            <ul className="text-sm text-gray-500 space-y-1 text-left">
              <li>Sahifani yangilab ko'ring</li>
              <li>Brauzerni qayta ishga tushiring</li>
              <li><Link href="/dashboard" className="text-blue-600 hover:text-blue-500">Dashboard</Link> ga qaytib ko'ring</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={reset} className="flex-1">
              Qayta urinish
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/dashboard">
                Dashboard
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
            <p className="text-xs text-gray-400 mt-2">
              Xatolik ID raqamini yuborish sizga tezroq yordam berishimizga yordam beradi.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import Link from 'next/link';
