# P2 Payment & Subscription Report

- **Subscription Tiers (`free`, `standart`, `pro`):** Rebalanced so Free users receive `2` monthly trials of `virtual_court`, `decision_tree`, and `document_analysis` (`src/lib/usage-limits.ts`, `src/app/api/settings/pricing/route.ts`, `src/components/landing/PricingSection.tsx`).
- **Honest Marketing Copy:** Removed unimplemented Marketplace claims (`Shaxsiy maslahatchi`, `Ekspert konsultatsiyasi`) from Pro plan copy in code, fallback plans, and migration SQL.
- **Payment Lifecycle Security:**
  - Manual subscription approval (`POST /api/payments/approve`) requires `requireAdmin` and uses an idempotent `pending -> approved` state machine (`tests/security/payments.test.ts` 20/20).
  - Consultation checkout (`POST /api/payments/checkout`) creates `pending` transactions and `pending` appointments (`tests/security/p1-7-fixes.test.ts` 3/3).
  - **Missing External Webhooks:** Click/Payme and Stripe webhook handlers (`/api/billing/webhook`) are not yet implemented; automated online payment confirmation must remain disabled until signature-verified webhooks are added.
