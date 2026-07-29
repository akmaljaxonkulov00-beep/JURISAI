/**
 * Supabase browser client — singleton
 *
 * This file is the ONLY place the Supabase client is created for the browser.
 * It uses localStorage for session persistence, which is critical for OAuth.
 *
 * NOTE: The environment variables MUST be set in .env.local (for local dev)
 * and in Vercel dashboard (for production). They are:
 *   NEXT_PUBLIC_SUPABASE_URL  = https://blayqzykzlmrjuvhzvsk.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// In development, warn if env vars are missing
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn(
      '[Supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. ' +
        'Auth features will not work.'
    )
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key: string) => {
        if (typeof window === 'undefined') return null
        const val = localStorage.getItem(key)
        return val
      },
      setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return
        localStorage.setItem(key, value)
      },
      removeItem: (key: string) => {
        if (typeof window === 'undefined') return
        localStorage.removeItem(key)
      },
    },
  },
})
