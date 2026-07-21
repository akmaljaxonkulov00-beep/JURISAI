'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading, isAdmin } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      // Tizimga kirmagan → signin sahifasiga yo'naltirish
      router.replace('/signin');
    } else if (isAdmin) {
      // Admin bo'lsa → admin panelga yo'naltirish
      router.replace('/admin');
    } else {
      // Oddiy foydalanuvchi → dashboardga yo'naltirish
      router.replace('/dashboard');
    }
  }, [user, isLoading, isAdmin, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Yuklanmoqda...</p>
      </div>
    </div>
  );
}
