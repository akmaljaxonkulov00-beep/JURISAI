const mockQuery = () => ({ data: [], error: null, select: mockQuery, eq: mockQuery, single: mockQuery, insert: mockQuery, update: mockQuery, delete: mockQuery, order: mockQuery, limit: mockQuery, range: mockQuery });
export const supabase = { from: () => mockQuery(), auth: { getUser: async () => ({ data: { user: null }, error: null }), signIn: async () => ({ data: null, error: null }), signUp: async () => ({ data: null, error: null }), signOut: async () => ({}) } } as any;
export const supabaseClient = supabase;
export default supabase;
