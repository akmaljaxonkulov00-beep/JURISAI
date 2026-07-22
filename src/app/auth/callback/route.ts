import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase client with session persistence disabled (auto-logout on close)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
)

// Super admin email — auto-elevate on login
const SUPER_ADMIN_EMAIL = 'akmaljaxonkulov00@gmail.com';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data?.user) {
        // Auto-elevate super admin
        if (data.user.email === SUPER_ADMIN_EMAIL) {
          await supabase
            .from('users')
            .update({ role: 'ADMIN' })
            .eq('id', data.user.id);
        }
        
        // Successful authentication, redirect to dashboard
        return NextResponse.redirect(`${origin}${next}`)
      } else {
        // Handle error
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(error?.message || 'Authentication failed')}`)
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
