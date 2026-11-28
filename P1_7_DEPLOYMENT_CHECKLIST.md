# P1.7 Deployment Checklist (Staging / Controlled Production)

1. **Environment Variables:**
   - Ensure `ALLOW_DEMO_AUTH` is **unset** or `'false'` in production (`NODE_ENV=production`).
   - Set `SCENARIO_HMAC_SECRET` (or confirm `SUPABASE_SERVICE_ROLE_KEY` is configured server-side).
   - Optionally configure `NEXT_PUBLIC_TURN_URL`, `NEXT_PUBLIC_TURN_USERNAME`, `NEXT_PUBLIC_TURN_CREDENTIAL` if WebRTC TURN relay is desired (Text-Mode Fallback works without TURN).
   - Confirm `GEMINI_API_KEY` and `GROQ_API_KEY` are valid and server-only.
2. **Database Migrations:**
   - Apply [`supabase/migrations/20261128_p1_subscription_rebalance.sql`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/supabase/migrations/20261128_p1_subscription_rebalance.sql) on staging first, verify `pricing_plans` (`free` limits `2/2/2`, `pro` features updated), then apply on production.
3. **Staging Smoke & Authenticated E2E:**
   - Verify login/signup, Free trial limits (`virtual_court`, `decision_tree`, `document_analysis`), IRAC Exam Mode + PDF export, `.docx` download opening in Word/LibreOffice, Scenario handoffs (`juristiv_transfer_*`), and 2-client multiplayer room lifecycle.
4. **Build & Rollback Readiness:**
   - Confirmed clean `npx tsc --noEmit` (0 errors) and `npx next build` (202/202 pages).
   - Keep previous production deployment tag ready for instant rollback.
