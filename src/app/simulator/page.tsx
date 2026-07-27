'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SimulatorRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/virtual-court');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-slate-600 dark:text-zinc-400">Virtual Sud Simulyatoriga yo'naltirilmoqda...</p>
      </div>
    </div>
  );
}
