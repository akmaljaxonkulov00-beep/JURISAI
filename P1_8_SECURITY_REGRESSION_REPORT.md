# P1.8 Security Regression Report

All P0 and P1 security controls were re-verified after the final P1.8 edits:

- **Authentication (`server-auth.ts`):** `NODE_ENV=production` rejects demo tokens even if `ALLOW_DEMO_AUTH=true`; client-supplied identity headers are never trusted (**VERIFIED** via `tests/security/p0-fixes.test.ts`, `authz.test.ts` 20/20, `idor.test.ts` 29/29, `admin.test.ts` 24/24).
- **Multiplayer Authorization:**
  - `x-guest-id` spoofing rejected (`401`).
  - Private room reads by non-participants rejected (`403`, added in P1.7).
  - Mutating actions on `completed`/`cancelled`/`expired` rooms rejected (`409`, added in P1.7).
  - Verified by `tests/security/p1-7-fixes.test.ts` (**3/3**), `tests/api/multiplayer-api.test.ts`, and `tests/court/multiplayer-court.test.ts`.
- **Legal Citation Validation:** `validateCitations()` active across IRAC, Decision Tree, Scenario Generator, Document Generator, and Virtual Court (`tests/lib/legal-rag.test.ts`, `tests/lib/ai-routes-rag.test.ts` 16/16).
- **Scenario Security:** `is_optimal`, `xp`, `feedback`, `consequence`, and undiscovered evidence stripped from client responses; HMAC-SHA256 `server_state_token` verified with `crypto.timingSafeEqual` (`tests/scenario/p1-scenario-engine.test.ts` 4/4).
- **Payment Security:** Admin-only idempotent approval (`tests/security/payments.test.ts` 20/20); consultation checkout creates `pending` transactions (`tests/security/p1-7-fixes.test.ts`).
