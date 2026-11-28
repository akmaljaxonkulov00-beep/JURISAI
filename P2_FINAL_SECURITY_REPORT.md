# P2 Final Security Report

- **Authentication (`src/lib/server-auth.ts`, `src/middleware.ts`):** Demo tokens blocked when `NODE_ENV=production` or `ALLOW_DEMO_AUTH !== 'true'`; protected routes (`/case-solver`, `/decision-tree`, `/document-generator`, `/scenario-generator`, `/virtual-court`, `/qonunlar`) redirect unauthenticated users to `/signin`.
- **Authorization & IDOR (`tests/security/authz.test.ts` 20/20, `idor.test.ts` 29/29, `admin.test.ts` 24/24):** Server-derived identity only; ownership enforced on saved IRAC, documents, decision trees, and multiplayer rooms.
- **Multiplayer Hardening (`src/lib/court/multiplayer-db.ts`, `rooms/[codeOrId]/route.ts`, `action/route.ts`):**
  - `x-guest-id` spoofing rejected (`401`).
  - Private room reads by non-participants rejected (`403`).
  - Mutations on `completed`/`cancelled`/`expired` rooms rejected (`409`).
  - Production `getCourtRoom()` DB timeout now throws instead of returning stale `roomsMap` cache.
- **Scenario Engine (`src/lib/scenario-sanitizer.ts`):** Strips `is_optimal`, `xp`, `feedback`, `consequence`, and undiscovered evidence; HMAC-SHA256 `server_state_token` verified with `crypto.timingSafeEqual`.
- **Payments (`tests/security/payments.test.ts` 20/20, `p1-7-fixes.test.ts` 3/3):** Admin-only idempotent approval (`/api/payments/approve`); consultation checkout (`/api/payments/checkout`) creates `pending` transactions only.
- **Secrets:** No `.env.local` secrets committed; `.env.example` uses safe placeholders only.
