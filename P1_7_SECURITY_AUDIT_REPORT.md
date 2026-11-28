# P1.7 Security Audit Report

**Date:** 2026-11-28  
**Scope:** P0 security regression + P1 & payment security audit across `src/lib/server-auth.ts`, `src/lib/court/*`, `src/lib/scenario-sanitizer.ts`, `src/app/api/*`, and `src/middleware.ts`.

## 1. Authentication & Authorization (`server-auth.ts` & `middleware.ts`)
- **Production Demo-Token Rejection:** **VERIFIED** (`src/lib/server-auth.ts` restricts demo tokens strictly to `NODE_ENV !== 'production' && ALLOW_DEMO_AUTH === 'true'`).
- **Protected Route Middleware:** **VERIFIED** in real browser E2E — unauthenticated requests to `/case-solver`, `/scenario-generator`, and `/qonunlar` redirected to `/signin?redirectTo=...`.
- **Client Identity Headers:** **VERIFIED** — `x-guest-id` and body `userId`/`email` are ignored; `requireUser()` and `resolveCourtUser()` derive identity exclusively from verified Supabase JWTs.

## 2. Multiplayer Room Access & Lifecycle (`multiplayer-db.ts` & `/api/court/multiplayer/*`)
- **Private Room Read Gap Fixed (P1.7):** `GET /api/court/multiplayer/rooms/[codeOrId]` previously lacked a membership/publicity check. Added `403 Forbidden` when `!room.isPublic && room.hostId !== user.id && !isParticipant` (**VERIFIED** by `tests/security/p1-7-fixes.test.ts`).
- **Completed Room Mutation Guard Fixed (P1.7):** `POST /api/court/multiplayer/rooms/[codeOrId]/action` now rejects mutating actions (other than `leave`) on `completed` / `cancelled` / `expired` rooms with `409 Conflict` (**VERIFIED** by `tests/security/p1-7-fixes.test.ts`).
- **Remaining Limitation:** `getCourtRoom()` still has a 2.5s `Promise.race` fallback to `roomsMap` on DB timeout, and `persistRoomToDb()` performs upserts without row-level `version` optimistic locking under simultaneous multi-instance writes (**PARTIALLY VERIFIED**).

## 3. Payment & Subscription Security
- **Consultation Checkout Auto-Paid Vulnerability Fixed (P1.7):** `POST /api/payments/checkout` previously created transactions with `status: 'completed'` and updated appointments to `payment_status: 'paid', status: 'confirmed'` immediately on checkout initiation. Fixed to `status: 'pending'` and `payment_status: 'pending'` (**VERIFIED** by `tests/security/p1-7-fixes.test.ts`).
- **Subscription Approval:** `/api/payments/approve` enforces `requireAdmin` and an idempotent `pending -> approved` state machine (**VERIFIED** by `tests/security/payments.test.ts`).
- **Scenario Answer-Key Protection:** `sanitizeScenarioForClient()` strips `is_optimal`, `xp`, `feedback`, `consequence`, and undiscovered evidence; `server_state_token` is signed with HMAC-SHA256 and verified with `crypto.timingSafeEqual` (**VERIFIED** by `tests/scenario/p1-scenario-engine.test.ts`).

## 4. Secrets & Client Exposure
- Service-role credentials (`SUPABASE_SERVICE_ROLE_KEY`) and AI keys (`GEMINI_API_KEY`, `GROQ_API_KEY`) are server-only (`src/lib/supabase-admin.ts` and API routes).
- Public env vars (`NEXT_PUBLIC_TURN_URL`, `NEXT_PUBLIC_TURN_USERNAME`, `NEXT_PUBLIC_TURN_CREDENTIAL`) are optional; if TURN credentials are used in production, prefer short-lived/ephemeral TURN tokens.
