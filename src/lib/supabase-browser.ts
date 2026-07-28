import { createClient } from '@supabase/supabase-js';

// ── Hardcoded fallback URLs ─────────────────────────────────
// These ensure the app works on production even if Vercel env vars are stale.
// Vercel production env vars currently have yvacggsotzlsjwaduxyk.supabase.co
// which does NOT resolve. These fallbacks use the correct, active project.
const FALLBACK_URL = 'https://blayqzykzlmrjuvhzvsk.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsYXlxenlremxtcmp1dmh6dnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MzAzNzAsImV4cCI6MjEwMDMwNjM3MH0._4WASFfKkRenHpScrQM6vS2zPTZmyDfMCNr5GmAgOkw';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY;

function createBrowserClient() {
  if (!supabaseUrl || !anonKey) {
    // Return a no-op client stub so the app doesn't crash during SSR/build
    return {
      channel: () => ({ on: () => ({ subscribe: () => {} }), removeChannel: () => {} }),
      removeChannel: () => {},
      from: () => ({
        select: () => ({ data: null, error: new Error('Supabase not configured') }),
      }),
    } as any;
  }
  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}

export const supabase = createBrowserClient();
