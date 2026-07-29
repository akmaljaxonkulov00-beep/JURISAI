/**
 * Supabase client — singleton (re-export)
 *
 * ═══════════════════════════════════════════════════════════════════
 * IMPORTANT: This file exists because 40+ API route files and
 * components import from '@/lib/supabase' (without any suffix).
 * Rather than updating every file, this file re-exports the
 * singleton Supabase client from supabase-client.ts.
 *
 * All imports should eventually migrate to @/lib/supabase-client
 * for clarity, but this file maintains backward compatibility.
 * ═══════════════════════════════════════════════════════════════════
 */

export { supabase, supabaseClient, supabaseServer, supabaseClient as default } from './supabase-client'
