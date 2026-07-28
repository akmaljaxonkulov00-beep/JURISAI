import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
