# P1-4 Report — Cross-Feature Scenario Engine

## 1. Objective
Eliminate client-side answer-key exposure in Senariy Generator (`/scenario-generator`), enforce server-side step evaluation with dynamic evidence/twists, and connect scenarios seamlessly to **Kazus Yechish**, **Qarorlar Daraxti**, and **Virtual Sud**.

## 2. Implemented Changes
- **[`src/lib/scenario-sanitizer.ts`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/src/lib/scenario-sanitizer.ts)** (New)
  - Implemented `sanitizeScenarioForClient()` to strip `is_optimal`, `xp`, `feedback`, `consequence`, and undiscovered (`discovered === false`) evidence before sending scenarios to the browser.
  - Implemented HMAC-SHA256 `createScenarioStateToken()` and `verifyScenarioStateToken()` using `crypto.timingSafeEqual`.
- **[`src/types/scenario-generator.ts`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/src/types/scenario-generator.ts)**
  - Made `ScenarioOption` scoring fields optional for sanitized client payloads and added `server_state_token?: string` to `ScenarioData`.
- **[`src/app/api/scenario-generator/generate/route.ts`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/src/app/api/scenario-generator/generate/route.ts)** & **[`src/app/api/scenario-generator/templates/route.ts`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/src/app/api/scenario-generator/templates/route.ts)**
  - Applied `sanitizeScenarioForClient()` to all returned generated scenarios and templates.
- **[`src/app/api/scenario-generator/step/route.ts`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/src/app/api/scenario-generator/step/route.ts)**
  - Evaluates `chosen_option_id` strictly against HMAC-verified `server_state_token` or `VERIFIED_SCENARIO_TEMPLATES`.
  - Returns `revealed_evidence` (flipping `discovered: true`) and `dynamic_twist` for subsequent steps.
- **[`src/components/features/ScenarioGenerator.tsx`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/src/components/features/ScenarioGenerator.tsx)**
  - Merges `revealed_evidence` and renders `dynamicTwist` banners during simulation.
  - Added 3 cross-feature transfer buttons (`Kazus Yechishda tahlil`, `Qarorlar Daraxtida tuzish`, `Virtual Sudda ko‘rish`) using `sessionStorage` handoff keys.
- **[`tests/scenario/p1-scenario-engine.test.ts`](file:///g:/%D0%9C%D0%BE%D0%B9%20%D0%B4%D0%B8%D1%81%D0%BA/JURISAI/tests/scenario/p1-scenario-engine.test.ts)**
  - Verified answer-key stripping, HMAC tamper rejection, server-side step evaluation + hidden evidence reveal, and sanitized templates API.

## 3. Acceptance Criteria Verification
| Criterion | Status | Evidence |
|---|---|---|
| No `is_optimal`, `xp`, `feedback`, or hidden evidence sent to client | **VERIFIED** | `tests/scenario/p1-scenario-engine.test.ts` (4/4 passed) |
| Server-side step evaluation & HMAC tamper protection | **VERIFIED** | `tests/scenario/p1-scenario-engine.test.ts` |
| Dynamic evidence reveal & procedural twist per step | **VERIFIED** | `tests/scenario/p1-scenario-engine.test.ts` |
| Cross-feature transfer buttons (`Kazus`, `Daraxt`, `Sud`) | **PARTIALLY VERIFIED** | Implemented in `ScenarioGenerator.tsx` + target pages; browser click-through not executed |
