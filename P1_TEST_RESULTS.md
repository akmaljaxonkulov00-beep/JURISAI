# P1 Test & Build Results Report

## 1. TypeScript & Production Build
- **`npx tsc --noEmit`**: **PASSED** — `0` errors.
- **`npx next build`**: **PASSED** — Compiled successfully (`Next.js 16.3.4 (Turbopack)`), `202/202` static pages generated.

## 2. Targeted P1 Test Suites (`6/6 files, 21/21 tests passed`)
Command:
```bash
npx vitest run tests/irac/p1-irac.test.ts tests/decision-tree/p1-decision-tree.test.ts tests/documents/p1-document-generator.test.ts tests/scenario/p1-scenario-engine.test.ts tests/court/p1-virtual-court.test.ts tests/security/p1-subscription.test.ts
```
Results:
1. `tests/irac/p1-irac.test.ts`: **2/2 passed** (2373ms) — `irac-evaluate` `hintsUsed`/`examMode`/rubric fields & `%PDF-` export.
2. `tests/decision-tree/p1-decision-tree.test.ts`: **2/2 passed** (9ms) — 5-node If/Then/Else validation & contradiction/dead-end detection.
3. `tests/documents/p1-document-generator.test.ts`: **5/5 passed** (1276ms) — OOXML `.docx` ZIP `PK` header + `word/document.xml`, educational sample `.docx`, auth & validation on `/api/ai/document-analysis` and `/api/official-documents/[id]/fill`.
4. `tests/scenario/p1-scenario-engine.test.ts`: **4/4 passed** (188ms) — answer-key stripping, HMAC tamper rejection, server-side step evaluation + hidden evidence reveal, sanitized templates API.
5. `tests/court/p1-virtual-court.test.ts`: **5/5 passed** (721ms) — criminal/civil/administrative role adaptation, procedural validation for `DAVOGAR`/`ARIZACHI`, invalid role rejection.
6. `tests/security/p1-subscription.test.ts`: **3/3 passed** (5ms) — Free trial quotas (`virtual_court: 2`, `decision_tree: 2`, `document_analysis: 2`), Standart/Pro quota preservation, removal of paused Marketplace claims.

## 3. Full Repository Vitest Run (`npx vitest run`)
- **Total:** `25` test files (`20 passed`, `5 failed`), `294` tests (`283 passed`, `11 failed`).
- **All P0 security/court/document suites & all 6 P1 suites passed.**
- **Pre-existing / Unrelated Failures (5 files, 11 tests — not caused by P1 changes and not masked):**
  1. `tests/security/ai.test.ts` (2 failed): `irac-analyze` regex `extractSection` error + `chat` network error expecting `500` vs `503`.
  2. `tests/security/unified-platform.test.ts` (2 failed): 5000ms timeouts on live Supabase public/private legal questions integration tests.
  3. `tests/lib/ai-routes-rag.test.ts` (5 failed): static prompt-string assertions on `ai/chat`, `irac-analyze-real`, `irac-analyze`, `document-generate`, `court-simulator`.
  4. `tests/documents/official-documents.test.ts` (1 failed): expects `'DA’VO ARIZASI'` while template renders `'DA‘VO ARIZA'`.
  5. `tests/ai/gemini-legal.test.ts` (1 failed): system directive string assertion on Uzbekistan legal sources.
