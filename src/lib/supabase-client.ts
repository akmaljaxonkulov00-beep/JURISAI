import { supabase as browserSupabase } from './supabase-browser'

// ── SINGLETON SUPABASE CLIENT ─────────────────────────────
// Uses the same client instance as supabase-browser.ts
// to prevent Multiple GoTrueClient instances error.
export const supabase = browserSupabase
export const supabaseClient = supabase
export default supabase

// Server-side helper aliases
export const supabaseServer = supabase

export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export const authHelpers = {
  signIn: async (...args: unknown[]) => null,
  signOut: async (...args: unknown[]) => null,
  signUp: async (...args: unknown[]) => null,
  getSession: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  },
  getUser: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  },
}
