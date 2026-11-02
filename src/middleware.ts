import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * MIDDLEWARE — Platform Route Protection
 *
 * Foydalanuvchi tizimga kirmasdan turib sayt ichkarisiga kira olmaydi.
 * Himoyalangan bo‘limlarga kirishga uringanda avtomatik /signin ga yo‘naltiriladi.
 */

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/virtual-court',
  '/professional-tools',
  '/case-solver',
  '/citizen',
  '/advocate',
  '/law-student',
  '/ratings',
  '/statistics',
  '/ai-chat',
  '/decision-tree',
  '/document-generator',
  '/settings',
  '/profile',
  '/community',
  '/billing',
  '/admin',
  '/payment-admin',
  '/amaliyot',
  '/qonunlar',
  '/questions',
  '/simulator',
  '/lawyer-dashboard',
  '/court-simulator',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Tekshirish kerak bo‘lgan ichki sahifalar
  const isProtected = PROTECTED_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (isProtected) {
    // 1. Juristiv maxsus cookie'si
    const hasJuristivAuth = request.cookies.get('juristiv_auth')?.value === '1'

    // 2. Supabase auth token cookie'lari
    const hasSupabaseAuth = request.cookies.getAll().some(
      cookie =>
        cookie.name.includes('-auth-token') ||
        cookie.name.startsWith('sb-') ||
        cookie.name === 'supabase-auth-token'
    )

    if (!hasJuristivAuth && !hasSupabaseAuth) {
      const url = request.nextUrl.clone()
      url.pathname = '/signin'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
