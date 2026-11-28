# P2 Remaining Risks

1. **P1 — Multiplayer Optimistic Locking (`src/lib/court/multiplayer-db.ts`):** Simultaneous multi-instance room writes do not yet use a row-level `version` CAS column. (DB-timeout stale cache fallback was hardened in P2.)
2. **P1 — Automated Payment Webhooks (`src/app/api/payments/checkout`, `src/app/api/billing/upgrade`):** Click/Payme and Stripe webhook handlers are not yet implemented; keep automated online checkout disabled until signature-verified webhooks are added. (Admin manual approval `/api/payments/approve` is verified.)
3. **P1 — Authenticated 6-Feature & 2-Browser Multiplayer E2E:** Blocked locally by lack of staging Supabase test accounts; must run on staging after applying `20261128_p1_subscription_rebalance.sql`.
4. **P2 — Localization Parity (`en`/`ru`):** Uzbek Latin is complete across P1 features; secondary `en`/`ru` translations for new P1 labels are partial.
5. **P2 — Legal Currency Metadata (`src/lib/legal-rag.ts`):** Corpus validation checks code/article existence (7,201 articles) rather than live repeal/amendment status.
