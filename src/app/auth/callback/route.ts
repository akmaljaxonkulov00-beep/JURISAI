import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Successful authentication, redirect to dashboard
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        // Handle error
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(error.message)}`)
      }
    } catch (err) {
      console.error('Auth callback exception:', err)
      return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent('Authentication failed')}`)
    }
  } else {
    // No code parameter, redirect to signin
    return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent('No authorization code provided')}`)
  }
}
