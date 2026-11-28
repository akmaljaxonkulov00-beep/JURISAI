# P1.7 Database & API Audit Report

## 1. Database Schema & Migrations
- **Official Documents (`user_filled_documents` & `generated_documents`):** P0-5 schema alignment (`document_id`, `filled_data`, `document_data`, `generated_content`) and `persistenceWarning` surface remain intact (**VERIFIED**).
- **IRAC Persistence (`irac_analyses`):** `save-analysis/route.ts` stores `feedback`, `strengths`, `weaknesses`, `suggestions`, and `section_scores` without regex overwrite (**VERIFIED**).
- **P1-6 Subscription Migration (`supabase/migrations/20261128_p1_subscription_rebalance.sql`):**
  - Non-destructive `UPDATE pricing_plans` for `free` (`virtual_court: 2`, `decision_tree: 2`, `document_analysis: 2`) and `pro` (removes paused Marketplace copy).
  - Preserves `user_subscriptions` and `payment_requests` untouched; idempotent on re-run.
  - **Status:** **NOT EXECUTED** against production (per Section 20). Must be applied during controlled staging/production release.

## 2. API Security & Validation Audit
- **Authentication:** All protected APIs use `requireUser(request)` / `requireAdmin(request)` / `resolveCourtUser(request)`.
- **Input Validation:**
  - `/api/ai/document-analysis` rejects `< 50` char or `> 30,000` char payloads (`400`).
  - `/api/court-simulator` validates roles against `ALL_COURT_ROLES` (`400` on invalid roles).
  - `/api/scenario-generator/step` validates `chosen_option_id` against HMAC-signed `server_state_token` or `VERIFIED_SCENARIO_TEMPLATES`.
  - `/api/court/multiplayer/rooms/[codeOrId]` enforces `403` on unauthorized private room reads (fixed in P1.7).
  - `/api/court/multiplayer/rooms/[codeOrId]/action` enforces `409` on completed/cancelled/expired rooms (fixed in P1.7).
  - `/api/payments/checkout` creates `pending` transaction and leaves appointment `pending` until provider webhook (fixed in P1.7).
- **Error Handling:** Fixed `SyntaxError: Unterminated group` in `src/app/api/ai/irac-analyze/route.ts:217` regex fallback.
