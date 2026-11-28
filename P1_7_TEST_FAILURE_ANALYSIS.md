# P1.7 Test Failure Analysis Report

**Final Full Run (`npx vitest run`):** `24 / 26` test files passed, `290 / 297` tests passed, `2` files failed (`7` tests total).

## 1. Resolved Baseline Failures (Fixed in P1.7)
1. **`tests/security/ai.test.ts` (23/23 now PASSING):**
   - *Cause 1 (Production Bug):* `src/app/api/ai/irac-analyze/route.ts:217` had an unterminated RegExp group `(?=(?:\n##+|...|$)` in `extractSection()`. Fixed by adding the missing closing `)`.
   - *Cause 2 (Test Expectation Drift):* `chat/route.ts` intentionally returns `503 Service Unavailable` when AI providers are unreachable; updated test expectation from `500` to `503`.
2. **`tests/documents/official-documents.test.ts` (6/6 now PASSING):**
   - *Cause:* Official template `doc-civil-debt-claim-001` renders `DA‘VO ARIZA`, `Fuqarolik kodeksining 324, 734-735 moddalariga`, and `FPKning 188, 189, 191-moddalariga`, whereas the older test asserted `DA’VO ARIZASI` and `732-moddasi`. Updated test to match the verified official template text.
3. **`tests/ai/gemini-legal.test.ts` (4/4 now PASSING):**
   - *Cause:* `UZBEK_LEGAL_SYSTEM_INSTRUCTION` in `src/lib/gemini.ts` abbreviated code names (`Jinoyat (JK)`) instead of full names (`Jinoyat kodeksi (JK)`). Expanded full code names in `src/lib/gemini.ts`.

## 2. Remaining Failures (`2` files, `7` tests)
1. **`tests/lib/ai-routes-rag.test.ts` (5 failed — Outdated Static Prompt/Model Assertions):**
   - *Cause:* Line 198 asserts `expect(payload.model).toBe('openai/gpt-oss-120b')`, whereas routes were updated in commit `8665b7a` to use `qwen/qwen3.8-27b` (`irac-analyze`, `irac-analyze-real`, `court-simulator`) and `llama-3.3-70b-versatile` (`document-generate`). Additionally, `ai/chat` uses Unicode apostrophe `o‘zbek` while line 201 checks ASCII `o'zbek`.
   - *Classification:* Outdated test assertions (not a production regression).
2. **`tests/security/unified-platform.test.ts` (2 failed — Live Supabase Timeouts):**
   - *Cause:* `Creates public legal question accessible in public feed` and `Private question must NEVER be exposed in public feed` make live network calls to Supabase without mocks and time out at 5000ms.
   - *Classification:* **BLOCKED** by external test-database infrastructure availability.
