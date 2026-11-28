# P1.8 Remaining Risks

| ID | Severity | Area | Description | Mitigation |
|---|---|---|---|---|
| **R-1** | **P1** | `src/lib/court/multiplayer-db.ts` | `getCourtRoom()` falls back to `roomsMap` on 2.5s DB timeout and lacks row-level `version` optimistic locking under concurrent multi-instance writes. | Add conditional `version` update and return `503` on DB timeout in production. |
| **R-2** | **P1** | Payment Webhooks (`checkout`, `upgrade`) | No Click/Payme webhook or Stripe `/api/billing/webhook` route exists yet to transition `pending` consultation/Stripe payments automatically. (Manual admin approval `/api/payments/approve` works.) | Implement signature-verified Click/Payme & Stripe webhook handlers before enabling automated online checkout in production. |
| **R-3** | **P1** | Authenticated Browser E2E | Authenticated 6-feature click-throughs & 2-browser multiplayer sync could not run without staging Supabase test accounts (`2` live-DB tests in `unified-platform.test.ts` also require `RUN_LIVE_DB_TESTS=true`). | Run full Playwright E2E + `RUN_LIVE_DB_TESTS=true` against staging Supabase. |
| **R-4** | **P1** | `20261128_p1_subscription_rebalance.sql` | Migration not yet executed against Supabase `pricing_plans`. | Run migration on staging first, then production. |
| **R-5** | **P2** | `src/lib/legal-rag.ts` | `validateCitations()` verifies `Code + Article Number` in the 7,201-article corpus, not repeal/amendment currency. | Add repeal metadata on corpus updates. |
