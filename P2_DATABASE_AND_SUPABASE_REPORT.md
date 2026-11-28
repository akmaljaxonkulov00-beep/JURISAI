# P2 Database & Supabase Report

- **Schema & Ownership:** `irac_analyses`, `user_filled_documents`, `generated_documents`, `decision_trees`, `court_sessions`, `court_multiplayer_rooms`, `pricing_plans`, and `user_subscriptions` enforce user ownership via server-side `requireUser()` / `resolveCourtUser()` and Supabase RLS.
- **Migration Prepared (Non-Destructive):** [`supabase/migrations/20261128_p1_subscription_rebalance.sql`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/supabase/migrations/20261128_p1_subscription_rebalance.sql) updates `pricing_plans` (`free` trial quotas `2/2/2` and `pro` features) without touching `user_subscriptions` or `payment_requests`. Not executed on production.
- **Multiplayer DB Timeout Hardening:** `getCourtRoom()` in `src/lib/court/multiplayer-db.ts` now throws an explicit timeout error in `production` if the 2.5s DB lookup times out instead of returning stale `roomsMap`.
- **Remaining DB Concurrency Note:** Row-level `version` optimistic locking for simultaneous multi-instance room writes remains a documented P1/P2 enhancement (`P2_REMAINING_RISKS.md`).
