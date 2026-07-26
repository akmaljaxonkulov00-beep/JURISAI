import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware — route-level protection.
 *
 * This middleware works alongside client-side auth protection (page.tsx redirects).
 * Server-side: allows all requests through. Client-side auth protection in
 * page.tsx handles redirecting unauthenticated users to /signin.
 *
 * NOTE: Firebase Auth uses sessionStorage which is NOT accessible from Edge
 * Middleware. Full auth protection is implemented client-side via:
 *   - page.tsx: redirects to /signin when no user session found
 *   - firebaseAuth.signOut(): nuclear clear + hard redirect to /login
 *   - sessionStorage: auto-clears on browser/tab close
 *
 * This middleware is kept for future enhancement (e.g. rate limiting, header
 * security, maintenance mode).
 */

export function middleware(_request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: _request.headers,
    },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
