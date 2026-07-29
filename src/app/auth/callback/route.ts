import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * This route handles the Google OAuth callback.
 *
 * Supabase redirects here after Google login with ?code=...
 * We redirect to a client-side page that exchanges the code
 * in the browser where localStorage is available.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/signin?error=Tasdiqlash kodi topilmadi`)
  }

  // Redirect to client-side handler so it can use localStorage
  return NextResponse.redirect(
    `${origin}/auth/oauth-callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
  )
}
