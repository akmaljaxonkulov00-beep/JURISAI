'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Admin payments redirect — the full payment management UI is part of
 * the main admin dashboard at /admin (To'lovlar tab).
 * This route prevents 404s for users who navigate directly to /admin/payments.
 */
export default function AdminPaymentsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="min-h-screen bg-page-custom flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500 dark:text-zinc-400">To'lovlar bo'limiga o'tish...</p>
      </div>
    </div>
  );
}
