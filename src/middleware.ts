import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * MIDDLEWARE — Minimal
 *
 * Auth is handled by client-side providers.tsx + firebase-auth.ts
 * (Supabase onAuthStateChange reads from localStorage).
 * Middleware just passes through — no cookie/server-side auth check.
 *
 * This avoids redirect loops with Google OAuth where the session
 * is stored in client-side localStorage but the middleware can't
 * read it.
 */

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
