'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Tizimga kirish...');

  useEffect(() => {
    const code = searchParams?.get('code');
    const next = searchParams?.get('next') ?? '/dashboard';

    if (!code) {
      setStatus('error');
      setMessage('Tasdiqlash kodi topilmadi');
      setTimeout(() => router.replace('/signin'), 2000);
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error || !data?.session) {
          console.error('OAuth code exchange failed:', error);
          setStatus('error');
          setMessage(error?.message || 'Sessiya yaratilmadi');
          setTimeout(() => router.replace(`/signin?error=${encodeURIComponent(error?.message || '')}`), 2000);
          return;
        }

        setStatus('success');
        setMessage('Muvaffaqiyatli kirish!');

        setTimeout(() => {
          const email = data.session.user?.email?.toLowerCase().trim();
          if (email === 'akmaljaxonkulov00@gmail.com') {
            router.replace('/admin');
          } else {
            router.replace(next);
          }
        }, 500);
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage(err?.message || 'Kutilmagan xatolik');
        setTimeout(() => router.replace('/signin'), 2000);
      }
    })();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
      {status === 'loading' && (
        <>
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">{message}</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-emerald-400 text-sm font-medium">{message}</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <p className="text-red-400 text-sm">{message}</p>
          <p className="text-zinc-500 text-xs">Sign in sahifasiga o&apos;tkazilmoqda...</p>
        </>
      )}
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
