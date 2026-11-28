# P1-5 Report — Role-Adaptive Virtual Court

## 1. Objective
Make Virtual Sud (`/virtual-court` and multiplayer) **procedure-adaptive** across criminal, civil/economic/labor/family, and administrative cases, upgrade transcript export to formatted PDF, add env-configured WebRTC TURN support + Text-Mode Fallback, and accept transferred scenarios.

## 2. Implemented Changes
- **[`src/lib/court/court-types.ts`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/src/lib/court/court-types.ts)**
  - Expanded `CourtRole` and `ALL_COURT_ROLES` to include `ADVOKAT`, `PROKUROR`, `SUDYA`, `DAVOGAR`, `JAVOBGAR`, `VAKIL`, `ARIZACHI`, and `JAVOBGAR_ORGAN`.
  - Added `getRolesForCategory(category)` returning procedure-specific roles for criminal, civil/economic/labor/family, and administrative proceedings.
- **[`src/lib/court/stage-machine.ts`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/src/lib/court/stage-machine.ts)**
  - Updated `validateProceduralAction()` to grant adversarial speaking rights to `DAVOGAR`, `JAVOBGAR`, `VAKIL`, `ARIZACHI`, and `JAVOBGAR_ORGAN` on trial/negotiation stages.
- **[`src/app/api/court-simulator/route.ts`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/src/app/api/court-simulator/route.ts)**
  - Updated `start` role validation to use `ALL_COURT_ROLES`.
- **[`src/app/virtual-court/page.tsx`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/src/app/virtual-court/page.tsx)**
  - Replaced hardcoded 3-role selector with dynamic `getRolesForCategory(...)`.
  - Added `juristiv_transfer_court` `sessionStorage` listener to pre-filter category/search from Scenario Generator.
  - Upgraded `Sud Bayonnomasi` export to formatted PDF via `generateLegalPdf()` / `downloadPdfBlob()`, clearly labeled `O'quv simulyatsiya bayonnomasi (haqiqiy sud hujjati emas)`.
- **[`src/hooks/useMultiplayerCourt.ts`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/src/hooks/useMultiplayerCourt.ts)** & **[`src/app/virtual-court/multiplayer/[codeOrId]/page.tsx`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/src/app/virtual-court/multiplayer/%5BcodeOrId%5D/page.tsx)**
  - Added optional TURN server configuration (`NEXT_PUBLIC_TURN_URL`, `NEXT_PUBLIC_TURN_USERNAME`, `NEXT_PUBLIC_TURN_CREDENTIAL`) to `ICE_SERVERS`.
  - Added a visible `Matnli rejim (Text-Mode Fallback)` banner when WebRTC media/connection errors occur.
- **[`tests/court/p1-virtual-court.test.ts`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/tests/court/p1-virtual-court.test.ts)**
  - Verified role mapping per procedure category, procedural validation for `DAVOGAR`/`ARIZACHI`, and invalid-role rejection.

## 3. Acceptance Criteria Verification
| Criterion | Status | Evidence |
|---|---|---|
| Dynamic role adaptation by procedure category | **VERIFIED** | `tests/court/p1-virtual-court.test.ts` (5/5 passed) |
| Invalid role rejection on `/api/court-simulator` | **VERIFIED** | `tests/court/p1-virtual-court.test.ts` |
| Formatted PDF Sud Bayonnomasi & educational simulation disclaimer | **VERIFIED** (code), **PARTIALLY VERIFIED** (browser download) | `src/app/virtual-court/page.tsx` + `generateLegalPdf()` |
| WebRTC TURN env config & Text-Mode Fallback banner | **PARTIALLY VERIFIED** | Implemented in `useMultiplayerCourt.ts` & `[codeOrId]/page.tsx`; live multi-peer NAT traversal not tested |
