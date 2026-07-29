'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams?.get('code');
    if (!code) {
      router.replace('/signin?oauth_error=no_code');
      return;
    }

    // Exchange the code in the browser where localStorage is available
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error('OAuth exchange error:', error);
        router.replace(`/signin?oauth_error=${encodeURIComponent(error.message)}`);
      } else {
        router.replace('/signin?oauth=success');
      }
    }).catch((err) => {
      console.error('OAuth exchange exception:', err);
      router.replace(`/signin?oauth_error=${encodeURIComponent(err?.message || 'unknown')}`);
    });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Tizimga kirish...</p>
      </div>
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
