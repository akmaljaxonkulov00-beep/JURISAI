/**
 * Client-side auth headers for API calls.
 * Returns { Authorization: 'Bearer <token>' } from the active Supabase session.
 * Use in every frontend fetch() that targets a server API route.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    if (typeof window === 'undefined') return {}
    const { supabase } = await import('@/lib/supabase-browser')
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` }
    }
  } catch {
    /* session o'qib bo'lmadi */
  }
  return {}
}

/**
 * Convenience: authenticated fetch wrapper.
 * Merges auth headers into the provided RequestInit.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const authHeaders = await getAuthHeaders()
  return fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
      ...authHeaders,
    },
  })
}
