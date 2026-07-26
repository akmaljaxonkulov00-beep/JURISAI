import { getSupabaseClient } from './supabase-admin';

export const supabase = getSupabaseClient();
export const supabaseClient = supabase;
export default supabase;

// Server-side client — uses service role for admin operations
// Falls back to anonymous client for API routes
export const supabaseServer = supabase;

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const authHelpers = {
  signIn: async (...args: any[]) => null,
  signOut: async (...args: any[]) => null,
  signUp: async (...args: any[]) => null,
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },
  getUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
};
