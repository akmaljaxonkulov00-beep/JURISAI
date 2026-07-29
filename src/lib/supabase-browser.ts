/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JURISAI — Supabase Browser Client (Singleton)
 *
 * This is the SINGLE browser-side Supabase client used throughout the app.
 * It uses localStorage for session persistence, which is critical for
 * Google OAuth to work (the code exchange happens in the browser).
 *
 * Import from this file:
 *   import { supabase } from '@/lib/supabase-browser'
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Missing configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  )
}

// Create a SINGLE browser client instance with localStorage persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? localStorage : undefined,
  },
})

export default supabase
