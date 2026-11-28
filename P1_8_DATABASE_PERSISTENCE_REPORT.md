# P1.8 Database Persistence Report

| Store / Table | Persistence & Schema | Ownership / RLS | Status |
|---|---|---|---|
| `irac_analyses` (`save-analysis`) | Preserves AI `feedback`, `strengths`, `weaknesses`, `suggestions`, `section_scores` | `requireUser()` + `user_id` check | **VERIFIED** (API/unit) |
| `user_filled_documents` & `generated_documents` | Schema aligned (`document_id`, `filled_data`, `document_data`, `generated_content`); `persistenceWarning` surfaced | `requireUser()` + `user_id` check | **VERIFIED** (API/unit) |
| `decision_trees` | Save/update/delete endpoints authenticated | `requireUser()` + `user_id` check | **PARTIALLY VERIFIED** (live staging DB roundtrip pending) |
| `court_multiplayer_rooms` / `court_sessions` | DB-first `getCourtRoom()` with 2.5s timeout; `403` private & `409` completed guards | `resolveCourtUser()` + host/participant checks | **PARTIALLY VERIFIED** (optimistic locking pending) |
| `pricing_plans` (`20261128_p1_subscription_rebalance.sql`) | Non-destructive `free` (`2/2/2`) & `pro` copy migration ready | Admin-only / migration SQL | **NOT EXECUTED** (by design, pending staging) |
| `platformDb` (`questions` / `answers`) | Live-DB integration tests gated behind `RUN_LIVE_DB_TESTS=true` | Supabase RLS | **BLOCKED** (no staging test DB) |
