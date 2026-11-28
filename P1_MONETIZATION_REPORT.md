# P1-6 Report — Subscription Rebalancing & Honest Monetization

## 1. Objective
Rebalance Juristiv subscription tiers so Free-tier students can try all 5 core educational features (including limited Virtual Court, Decision Tree, and Document Analysis trials) while removing paused Marketplace claims (`Shaxsiy maslahatchi`, `Ekspert konsultatsiyasi`) from Pro plan copy, without modifying live subscriber entitlements.

## 2. Implemented Changes
- **[`supabase/migrations/20261128_p1_subscription_rebalance.sql`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/supabase/migrations/20261128_p1_subscription_rebalance.sql)** (New, non-destructive SQL migration — NOT applied to production)
  - Updates `pricing_plans` (`id = 'free'`) to grant `virtual_court: 2`, `decision_tree: 2`, `document_analysis: 2` and updates `features` copy.
  - Updates `pricing_plans` (`id = 'pro'`) `features` to remove paused Marketplace claims and highlight actual implemented capabilities.
- **[`src/lib/usage-limits.ts`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/src/lib/usage-limits.ts)**
  - Updated `DEFAULT_LIMITS.free` to `{ document_analysis: 2, virtual_court: 2, decision_tree: 2 }` while preserving `standart` and `pro` quotas.
- **[`src/lib/settings-sync.ts`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/src/lib/settings-sync.ts)** & **[`src/components/landing/PricingSection.tsx`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/src/components/landing/PricingSection.tsx)**
  - Synchronized fallback pricing plans and landing/pricing card copy with rebalanced Free trials and removed paused Marketplace claims from Pro.
- **[`tests/security/p1-subscription.test.ts`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/tests/security/p1-subscription.test.ts)**
  - Verified Free-tier trial quotas, Standart/Pro limits, and absence of paused Marketplace claims in pricing plans.

## 3. Acceptance Criteria Verification
| Criterion | Status | Evidence |
|---|---|---|
| Free tier grants limited trial access (`2/mo`) to Virtual Court, Decision Tree, Document Analysis | **VERIFIED** | `tests/security/p1-subscription.test.ts` (3/3 passed) |
| Standart and Pro quotas preserved; live subscriber records untouched | **VERIFIED** | `tests/security/p1-subscription.test.ts` + non-destructive migration SQL |
| Paused Marketplace claims removed from Pro pricing UI & fallback | **VERIFIED** | `tests/security/p1-subscription.test.ts` |
| Production DB `pricing_plans` updated | **NOT VERIFIED** (Not applied) | Migration saved at `supabase/migrations/20261128_p1_subscription_rebalance.sql` for controlled deployment |
