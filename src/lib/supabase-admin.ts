import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || serviceRoleKey
  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || anonKey
  if (!url || !key) {
    throw new Error('Supabase environment variables not configured')
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  })
}
