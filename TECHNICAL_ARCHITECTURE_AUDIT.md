# JURISTIV — TECHNICAL ARCHITECTURE, AI, DATABASE & SECURITY AUDIT

**Scope:** Full-stack inspection of `src/`, `prisma/`, `supabase/migrations/`, `backend/`, and live network behavior.

---

## 1. ACTUAL SYSTEM ARCHITECTURE (VERIFIED)

| Layer | Actual Implementation | Notes / Discrepancies |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js `16.3.4` (App Router), React `19.2.4`, TypeScript `5`, Tailwind CSS `3.4.19` | `next.config.ts` has **`typescript: { ignoreBuildErrors: true }`** — type errors are silently ignored during builds! |
| **Backend API** | Next.js App Router Route Handlers (`src/app/api/**/*`) | **Dead/Legacy Code:** A separate Python FastAPI app exists in `backend/` (`main.py` has routers commented out at line 30) and is **never called** by `src/` (`Select-String` found 0 references to `8000` or `FASTAPI`). |
| **Database & Auth** | Supabase (PostgreSQL + Supabase Auth + Supabase Realtime) via `@supabase/supabase-js` (`src/lib/supabase-admin.ts`, `supabase-browser.ts`) | `prisma/schema.prisma` exists (modeling `User`, `Organization`, `IracCase`, etc.) but **Next.js API routes query Supabase directly** (`registered_users`, `irac_cases`, `irac_analyses`, `decision_trees`, `court_sessions`, `court_multiplayer_rooms`, `usage_logs`, `pricing_plans`). |
| **AI Providers** | **Primary:** Google Gemini (`src/lib/gemini.ts` -> `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3-flash-preview`)<br>**Fallback:** Groq (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, `llama-3.3-70b-versatile`) | `src/lib/ai-client.ts` includes a 24h MD5-hashed `ai_response_cache` table in Supabase, though several feature routes (`irac-analyze`, `irac-evaluate`, `decision-tree/analyze`, `scenario-generator/generate`) call `callGemini()` + Groq `fetch()` directly, bypassing `AIClient` cache! |
| **Legal RAG** | `src/lib/legal-rag.ts` (1,041 lines) | Reads `src/data/full-legal-codes.json` (7,201+ Uzbek code articles) in-memory with Levenshtein fuzzy matching, Uzbek apostrophe normalization, and root stemming; falls back to Supabase `articles` table. |

---

## 2. CRITICAL SECURITY FINDINGS (VERIFIED)

| Severity | Finding | File & Line | Risk |
| :--- | :--- | :--- | :--- |
| **P0 — CRITICAL** | **Hardcoded Demo Token Auth Bypass in Production** | `src/lib/server-auth.ts:104-114` | `verifyUser(token)` accepts `demo-token-citizen`, `demo-token-law-student`, and `demo-token-advocate` **without checking `NODE_ENV`**. Any unauthenticated attacker can send `Authorization: Bearer demo-token-law-student` to any `requireUser()` endpoint (including AI endpoints, `save-analysis`, `decision-tree`, etc.) and consume AI quota or impersonate demo accounts. |
| **P0 — CRITICAL** | **Guest Header Spoofing in Multiplayer Court** | `src/app/api/court/multiplayer/rooms/route.ts:34-42`, `.../action/route.ts:45-52` | When `requireUser` fails, the API trusts raw `x-guest-id` and `x-guest-name` headers. An attacker can pass another participant's or Judge's `userId` in `x-guest-id` to issue verdicts, advance stages, or kick users. |
| **P1 — HIGH** | **Missing Auth Middleware on `/scenario-generator`** | `src/middleware.ts:11-36` | `/scenario-generator` is omitted from `PROTECTED_PREFIXES`, exposing the app shell to unauthenticated users while other 4 modules redirect to `/signin`. |
| **P1 — HIGH** | **Serverless Auth Bug in Official Document Fill** | `src/app/api/official-documents/[id]/fill/route.ts:52-55` | Uses `supabaseServer.auth.getUser()` without request cookies/headers; `user` is always `null`, preventing persistence to `user_filled_documents`. |
| **P1 — HIGH** | **Disabled TypeScript Build Checks & Dev TLS Bypass** | `next.config.ts:3-10` | `ignoreBuildErrors: true` hides runtime type mismatches; `NODE_TLS_REJECT_UNAUTHORIZED = "0"` in dev (and `gemini.ts:77` conditional). |

---

## 3. AI ARCHITECTURE & LEGAL RELIABILITY AUDIT

### What Works Well (VERIFIED)
- **Local + DB Hybrid Legal RAG (`legal-rag.ts`)**: Sub-5ms in-memory search across 7,201+ Uzbek articles with apostrophe-resilient matching (`o'g'irlik` / `o‘g‘irlik` / `ogirlik`) and Uzbek suffix stemming.
- **Uzbek Latin Enforcement (`ensureUzbekLatin`)**: Post-processes AI outputs to prevent Cyrillic leakage.
- **Provider Fallback**: Every AI route tries Gemini first (low/zero cost) and falls back to Groq models on failure/429.

### Critical AI & Legal Reliability Gaps (VERIFIED)
1. **Citation Validation Not Wired Into Learning Modules**:
   `validateCitations()` and `appendCitationNote()` in `src/lib/legal-rag.ts` (lines 918–1041) verify whether cited `Code + Article` pairs actually exist in `full-legal-codes.json` / `articles`. However, **`Select-String` confirms `validateCitations` is NOT called in `irac-analyze`, `irac-evaluate`, `decision-tree/analyze`, `decision-tree/generate`, `scenario-generator/generate`, or `court/ai-engine`!** (Only `document-generate` references it).
2. **No Cache Reuse Across Main Features**:
   `AIClient.chat()` (`src/lib/ai-client.ts`) implements `ai_response_cache`, but `irac-analyze`, `irac-evaluate`, `decision-tree/analyze`, and `scenario-generator/generate` re-implement their own `callGemini` + Groq `fetch` loops, duplicating ~100 lines of boilerplate per route and skipping `ai_response_cache`.
3. **Static Code/Article Freshness Risk**:
   `full-legal-codes.json` is a static JSON file bundled with the app. There is no automated sync with `lex.uz` and no `effective_date` / `version` check displayed on RAG-retrieved articles (unlike `official-sources-registry.ts`, which tracks BHM and key codes manually).
4. **Irrelevant Prompt Leakage of Answers**:
   In `scenario-generator/generate/route.ts`, the full `decision_points` JSON including `is_optimal: true` and `xp: 30` is sent to the browser, allowing students to inspect answers in DevTools before playing.

---

## 4. DATABASE & BACKEND FINDINGS (VERIFIED)

1. **Schema Drift & Defensive Workarounds**:
   - `src/app/api/decision-tree/trees/route.ts` (lines 200–238) contains a 15-iteration `while` loop that catches Supabase `"Could not find the '...' column"` errors, strips columns, and retries—storing everything inside `tree.metadata` JSONB as a safety net. This indicates past production schema drift between migrations and code.
   - `src/lib/court/multiplayer-db.ts` (lines 125–145) dual-writes to `court_multiplayer_rooms` AND `court_sessions` JSONB fallback, while also keeping `globalThis.__juristivRooms` in-memory `Map` (causing split-brain risk in serverless).
2. **Duplicate / Legacy Codebases**:
   - `backend/` (FastAPI + Python services) is completely unused by the frontend.
   - `src/app/api/decision-tree/generate/route.ts` duplicates `analyze/route.ts` with an incompatible node schema (`AiNode` vs `DecisionNode`).
   - `src/app/api/ai/irac-analyze-real/route.ts` exists alongside `irac-analyze/route.ts`.
3. **Positive Patterns**:
   - `src/lib/usage-limits.ts` cleanly enforces per-user overrides > `pricing_plans.limits` > `DEFAULT_LIMITS` + `FAIR_USE_LIMITS` in Tashkent timezone (`UTC+5`).
   - `src/lib/xp-engine.ts` enforces idempotency keys (`[key:...]`) to prevent duplicate XP farming.
