# P1.8 Payment Lifecycle Report

## 1. Manual Subscription Flow (`/api/billing/payment` -> `/api/payments/approve`) — VERIFIED
1. Authenticated user submits payment receipt (`pending`).
2. Only `requireAdmin` can call `POST /api/payments/approve` (`src/app/api/payments/approve/route.ts`).
3. `approvePayment()` enforces an idempotent `pending -> approved` state machine and resolves plan price/limits server-side from `pricing_plans`.
4. Verified by `tests/security/payments.test.ts` (**20/20 passed**).

## 2. Consultation Checkout Flow (`/api/payments/checkout`) — HARDENED IN P1.7, WEBHOOK MISSING
- Fixed `POST /api/payments/checkout` so transactions start as `status: 'pending'` and appointments remain `payment_status: 'pending'` (**VERIFIED** by `tests/security/p1-7-fixes.test.ts`).
- **Gap Identified (External Configuration Required):** No Click/Payme provider webhook callback route (with HMAC/merchant signature verification) exists yet to transition consultation `pending` transactions to `completed`/`paid` automatically.

## 3. Stripe Upgrade & Cancellation (`/api/billing/upgrade`, `/api/billing/cancel`) — PARTIALLY VERIFIED
- `POST /api/billing/upgrade` creates a Stripe Checkout session using server-side `subscription_plans` price (`requireUser` via Bearer token).
- `POST /api/billing/cancel` cancels the active Stripe subscription and updates `subscriptions.status = 'CANCELED'`.
- **Gap Identified:** No `/api/billing/webhook` route exists for asynchronous Stripe `checkout.session.completed` / `invoice.payment_failed` / `customer.subscription.deleted` events.
