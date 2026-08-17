/**
 * ═══════════════════════════════════════════════════════════════════════════
 * JURISAI — Unified Authentication Service
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file is the SINGLE entry point for all authentication needs.
 * It re-exports everything from the primary Supabase-based auth service.
 *
 * All other auth systems (auth-real.ts, old auth.ts) have been consolidated
 * into this single file. Import from @/services/auth everywhere:
 *
 *   import { useAuth } from '@/services/auth';
 *   import { firebaseAuth } from '@/services/auth';
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Re-export everything from supabase-auth (the primary auth implementation)
export {
  firebaseAuth,
  signIn,
  signUp,
  signInWithGoogle,
  handleRedirectResult,
  signOut,
  resetPassword,
  updateProfile,
  getCurrentUser,
  isAuthenticated,
  onAuthChange,
  ensureSuperAdmin,
  setAdminEmail,
  getAdminEmail,
  makeCurrentUserAdmin,
  logUsage,
} from './supabase-auth'

// Re-export types
export type { AuthUser } from './supabase-auth'

// Re-export the React useAuth hook from the app's context provider
// This is what most components use for reactive auth state
export { useAuth } from '@/app/providers'
