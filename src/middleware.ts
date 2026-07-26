import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * MIDDLEWARE — Route Protection
 *
 * Protects authenticated routes by checking for the 'jurisai_auth' cookie.
 * The cookie is set by firebase-auth.ts saveUserToLocal() during login.
 *
 * PUBLIC routes (no auth required):
 *   /signin, /signup, /login, /register
 *   /forgot-password, /terms, /privacy, /pricing
 *   /landing, /_next/*, /api/*, favicon, static files
 *
 * PROTECTED routes (requires auth cookie):
 *   /dashboard, /admin, /profile, /settings, /premium
 *   /case-solver, /decision-tree, /court-simulator
 *   /community, /statistics, /document-generator
 *   /professional-tools, /qonunlar, /manual-payment
 *   /billing, /help, /tasks, /irac, /simulator
 */

const PUBLIC_ROUTES = [
  '/signin',
  '/signup',
  '/login',
  '/register',
  '/forgot-password',
  '/terms',
  '/privacy',
  '/pricing',
  '/landing',
  '/create-admin',
  '/setup-supabase',
  '/test-auth',
  '/debug-auth',
  '/voice-test',
  '/demo-lawyer',
  '/lawyer-login',
  '/lawyer-register',
  '/missing-features',
  '/weakness-detector',
  '/scenario-generator',
];

const PROTECTED_ROUTES = [
  '/dashboard',
  '/admin',
  '/profile',
  '/settings',
  '/premium',
  '/case-solver',
  '/decision-tree',
  '/court-simulator',
  '/community',
  '/statistics',
  '/document-generator',
  '/professional-tools',
  '/qonunlar',
  '/manual-payment',
  '/billing',
  '/help',
  '/tasks',
  '/irac',
  '/simulator',
  '/payment-admin',
  '/pro-tools',
  '/lawyer-dashboard',
  '/legal-database',
  '/legal-database-new',
  '/ai-assistant',
  '/virtual-court',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Always allow public routes and static files
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }
  
  // Allow root path (client handles auth redirect)
  if (pathname === '/') {
    return NextResponse.next();
  }
  
  // Check if this is a protected route
  const isProtected = PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  if (isProtected) {
    // Check for auth cookie
    const authCookie = request.cookies.get('jurisai_auth');
    
    if (!authCookie) {
      // No auth cookie — redirect to signin
      const signinUrl = new URL('/signin', request.url);
      signinUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(signinUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
