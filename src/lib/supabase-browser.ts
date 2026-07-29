/**
 * Supabase browser client — singleton
 *
 * This is the ONLY place a Supabase client is created for the browser.
 * All client-side code must import { supabase } from this file.
 *
 * Uses Supabase's default localStorage storage adapter.
 * NOTE: Do NOT add a custom storage adapter — it can interfere with
 * the PKCE code verifier serialization/deserialization during OAuth.
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
  },
})
