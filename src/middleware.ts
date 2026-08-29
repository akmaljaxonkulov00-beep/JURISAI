import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * MIDDLEWARE — Route Protection
 *
 * Auth holati asosan client-side (Supabase localStorage/sessionStorage)
 * da saqlanadi, lekin login/OAuth tugagach `juristiv_auth` cookie'si ham
 * yoziladi (/auth/callback + login route'lar).
 *
 * Himoyalangan routlar (/admin, /payment-admin):
 *   - cookie yo'q → /signin ga qayta yo'naltirish (server-side gate)
 *   - cookie bor → o'tkaziladi; haqiqiy admin tekshiruvi admin sahifasi
 *     ichida database roli (isAdminRole) asosida bajariladi.
 *
 * OAuth callback (/auth/callback) bloklanmaydi — Google qaytganida
 * session hali yaratilayotgan bo'lishi mumkin.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin routlar — tizimga kirmagan foydalanuvchi uchun darhol /signin
  if (pathname.startsWith('/admin') || pathname.startsWith('/payment-admin')) {
    const hasAuthCookie = request.cookies.get('juristiv_auth')?.value === '1'
    if (!hasAuthCookie) {
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
