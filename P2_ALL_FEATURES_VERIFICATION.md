# P2 All Features Verification Matrix

| Feature | Classification | Key Files | Verification Evidence |
|---|---|---|---|
| **Kazus Yechish (IRAC & Exam Mode)** | **PARTIALLY VERIFIED** | `src/app/case-solver/page.tsx`, `src/app/api/ai/irac-analyze/route.ts`, `irac-evaluate/route.ts` | `tests/irac/p1-irac.test.ts` (2/2), `tests/security/ai.test.ts` (23/23); auth browser click-through pending staging accounts |
| **Qarorlar Daraxti (Decision Tree)** | **PARTIALLY VERIFIED** | `src/lib/decision-tree-engine.ts`, `src/app/decision-tree/page.tsx`, `NodeDetailPanel.tsx` | `tests/decision-tree/p1-decision-tree.test.ts` + `guided-scenarios.test.ts` (8/8); auth browser UI pending staging |
| **Hujjatlar Konstruktori (DOCX & AI Coach)** | **PARTIALLY VERIFIED** | `src/lib/docx-generator.ts`, `OfficialDocumentFillerModal.tsx`, `DocumentGenerator.tsx` | `tests/documents/p1-document-generator.test.ts` (5/5), `official-documents.test.ts` (6/6); browser download pending staging |
| **Senariy Generatori (Cross-Feature)** | **PARTIALLY VERIFIED** | `src/lib/scenario-sanitizer.ts`, `step/route.ts`, `ScenarioGenerator.tsx` | `tests/scenario/p1-scenario-engine.test.ts` (4/4); browser transfers pending staging |
| **Virtual Sud (Role-Adaptive & Multiplayer)** | **PARTIALLY VERIFIED** | `src/lib/court/court-types.ts`, `multiplayer-db.ts`, `useMultiplayerCourt.ts`, `virtual-court/page.tsx` | `tests/court/p1-virtual-court.test.ts` (5/5), `multiplayer-api.test.ts`, `p1-7-fixes.test.ts` (3/3); 2-browser sync pending staging |
| **Subscriptions & Monetization** | **PARTIALLY VERIFIED** | `src/lib/usage-limits.ts`, `PricingSection.tsx`, `supabase/migrations/20261128_p1_subscription_rebalance.sql` | `tests/security/p1-subscription.test.ts` (3/3), `payments.test.ts` (20/20), Browser E2E `/pricing`; DB migration pending staging |
