# P1.8 Staging Readiness Checklist

- [x] `npx tsc --noEmit` — **0 errors**
- [x] `npx next build` — **202/202 static pages generated**
- [x] `npx vitest run` — **26/26 test files passed (295 passed, 2 skipped/blocked on live DB, 0 failed)**
- [x] React hydration error `#418` on `/pricing` — **Fixed & verified in Chromium (0 console errors)**
- [x] Public routes (`/`, `/pricing`, `/signin`, `/legal-database`) — **0 `401` polling, 0 horizontal overflow**
- [x] Security regression (`403` private multiplayer room, `409` completed room, `pending` checkout, `irac-analyze` regex fix) — **Verified**
- [ ] Apply `supabase/migrations/20261128_p1_subscription_rebalance.sql` on staging Supabase
- [ ] Configure `ALLOW_DEMO_AUTH` unset/false, `SCENARIO_HMAC_SECRET`, and optional `NEXT_PUBLIC_TURN_*` in staging
- [ ] Execute authenticated 6-feature Playwright E2E + 2-browser multiplayer sync on staging
- [ ] Implement/configure Click/Payme & Stripe webhooks if automated online payments are enabled
