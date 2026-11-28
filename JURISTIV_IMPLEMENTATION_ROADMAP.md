# JURISTIV — PRIORITIZED IMPLEMENTATION ROADMAP

**Classification:** All items below are **RECOMMENDATION** based on **VERIFIED** codebase and live-site findings.  
**Effort Scale:** S (1–2 days), M (3–5 days), L (1–2 weeks), XL (2–4 weeks).

---

## P0 — CRITICAL (Security, Legal Accuracy, Data Integrity, Broken Live UX)

| ID | Recommendation | Current Situation & Problem | Proposed Solution | Impact (Edu / Biz) | Complexity & Effort | Dependencies | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P0-1** | **Remove Demo Token Auth Bypass** | `server-auth.ts:104-114` accepts `demo-token-*` in production without `NODE_ENV` check | Restrict demo tokens strictly to `NODE_ENV !== 'production' && DEMO_AUTH_ENABLED === 'true'` | Critical security & AI cost protection | Low / **S** (0.5d) | None | `curl` with `Bearer demo-token-law-student` returns `401` in production build |
| **P0-2** | **Fix Multiplayer Header Spoofing & Split-Brain State** | `rooms/route.ts` & `action/route.ts` trust `x-guest-id` header; `multiplayer-db.ts` uses in-memory `Map` | Require signed session/guest JWT for all room actions; use Supabase `court_multiplayer_rooms` as single source of truth | Prevents room hijacking & state desync | Medium / **M** (3d) | Supabase migration check | Unauthenticated `x-guest-id` spoofing rejected with `401/403`; room state persists across server restarts |
| **P0-3** | **Wire `validateCitations()` Into All AI Learning Endpoints** | Only `document-generate` references `validateCitations()`; IRAC, Decision Tree, Scenario, and Court do not | Run `validateCitations()` on all AI responses in `irac-analyze`, `irac-evaluate`, `decision-tree/analyze`, `scenario-generator/generate`, and `court/ai-engine` | Prevents students learning hallucinated article numbers | Low / **S** (2d) | `legal-rag.ts` | Any non-existent `Code + Article` triggers a visible warning badge and is logged |
| **P0-4** | **Fix `save-analysis` Feedback Overwrite Bug** | `case-solver/page.tsx:595` saves score, but `save-analysis/route.ts` overwrites AI feedback with regex heuristics | Accept and store AI `feedback`, `strengths`, `weaknesses`, and `sectionScores` in `irac_analyses` | Preserves real educational feedback in student history | Low / **S** (1d) | `irac_analyses` schema | History view shows exact AI rubric breakdown and strengths/weaknesses |
| **P0-5** | **Fix `/official-documents/[id]/fill` Auth Persistence** | `fill/route.ts:52-55` calls `supabaseServer.auth.getUser()` without request cookies/token | Use `requireUser(request)` and `getSupabaseAdmin()` to save to `user_filled_documents` | Fixes broken document history for official forms | Low / **S** (0.5d) | None | Filled official documents appear in user's saved documents table |
| **P0-6** | **Fix Live UX Bugs (`/pricing`, `/scenario-generator`, `providers.tsx`)** | `/pricing` shows `to \'g \'ri` & broken 1280px grid; `/scenario-generator` unprotected, duplicate templates, `?` overlap; `401 /api/payments` on public pages | Fix escaping, fix `lg:grid-cols-3`, add `/scenario-generator` to `middleware.ts`, deduplicate templates, guard `usePaymentNotifications()` on `isAuthenticated`, fix `JURISAI` -> `JURISTIV` | Immediate trust & conversion lift | Low / **M** (3d) | None | Zero `401` on public pages; `/pricing` 3-col aligned; `/scenario-generator` shows 5 unique localized templates |

---

## P1 — HIGH PRIORITY (Core Student Value, Differentiation & Monetization)

| ID | Recommendation | Current Situation & Problem | Proposed Solution | Impact (Edu / Biz) | Complexity & Effort | Dependencies | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P1-1** | **IRAC Student-First Practice & Exam Mode** | `case-solver` defaults to `ai_solves` and leaks `law_references` before solving | Default to `user_solves`, hide `law_references` behind Hint toggle, add timed Exam Mode & side-by-side Answer Diff + PDF export | High retention & real reasoning skill growth | Medium / **M** (4d) | P0-3, P0-4 | Students complete IRAC blind; post-submit shows side-by-side comparison & PDF |
| **P1-2** | **Interactive Decision Tree Builder & Contradiction Check** | Students cannot add/edit nodes or conditions in `DecisionTreeGraph`; only AI generates trees | Add node/branch CRUD in `DecisionTreeGraph`, If/Then condition editor, and missing-prerequisite validator | Differentiates Decision Tree from IRAC | Medium / **L** (7d) | `decision-tree-engine.ts` | Student can build a 5-node If/Then tree from scratch, validate logic, and save to DB |
| **P1-3** | **True `.docx` Export & AI Drafting Coach in Document Generator** | Official catalog exports HTML-as-`.doc`; "Maxsus generator" has no AI consistency check | Use installed `docx` library for real `.docx` generation; wire `/api/ai/document-analysis` as post-fill consistency check; add section-level legal explanations | Eliminates Word warnings; teaches legal drafting | Medium / **M** (5d) | P0-5 | Downloaded `.docx` opens cleanly in MS Word/LibreOffice; AI flags missing attachments |
| **P1-4** | **Unify Scenario Generator as Cross-Feature Engine** | Overlaps with IRAC/Tree/Court; leaks `is_optimal` in JSON response | Strip `is_optimal`/`xp` from client payload until `/step` call; add "Solve in IRAC", "Model in Tree", and "Launch in Virtual Court" export buttons | Eliminates module confusion; creates unified workflow | Medium / **M** (5d) | None | Generated scenario can be launched in IRAC or Virtual Court in 1 click |
| **P1-5** | **Role-Adaptive Virtual Court + TURN Fallback** | Single-player forces `PROKUROR`/`ADVOKAT` on civil cases; WebRTC lacks TURN server | Map roles dynamically by `procedure_type`; add TURN config + text-mode fallback banner; export `Sud Bayonnomasi` as PDF | Makes Virtual Court usable on university Wi-Fi | Medium / **M** (5d) | P0-2 | Civil case shows *Da'vogar/Javobgar*; WebRTC fallback tested |
| **P1-6** | **Rebalance Free/Standart/Pro Tiers** | Free blocks Virtual Court & Decision Tree (`0`); Pro promises paused Marketplace features | Grant 2 free Virtual Courts & 2 Trees on Free; align Pro copy with real features; tighten Pro STT/Chat Fair Use | Increases Free->Paid conversion & protects margins | Low / **S** (2d) | Admin pricing sync | New limits active in `pricing_plans` & `usage-limits.ts` |

---

## P2 — MEDIUM PRIORITY (Retention, Daily Habit & B2B Foundation)

| ID | Recommendation | Proposed Solution | Effort | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **P2-1** | **Adaptive Law Exam & Bar Prep Simulator** | Timed MCQ + mini-kazus mocks over `full-legal-codes.json` with Mistake Bank | **L** (10d) | Students can take 20/50-question timed mocks by code and review missed articles |
| **P2-2** | **Personal Error Tracker & Skill Radar** | Aggregate `irac_analyses` + `court_sessions` scores by skill & legal domain | **M** (4d) | Dashboard displays weakest legal domains and recommends 1-click practice |
| **P2-3** | **Centralize AI Gateway (`AIClient`) & `ai_response_cache`** | Route `irac-*`, `decision-tree/*`, and `scenario-generator/*` through one shared `AIClient` | **M** (3d) | Reduces code duplication (~400 lines) and cuts repeat AI token costs |
| **P2-4** | **Codebase Cleanup & TypeScript Strictness** | Remove dead `backend/` or archive it; remove duplicate `/decision-tree/generate`; fix TS errors and disable `ignoreBuildErrors` | **M** (5d) | `npm run type-check` passes with 0 errors |
| **P2-5** | **Oliy Sud Plenum & Terminology Hover Tooltips** | Link Supreme Court Plenum rulings to RAG articles and add Uzbek/Ru/En legal term popovers | **L** (7d) | Plenum rulings appear alongside Code articles in IRAC & Legal DB |

---

## P3 — FUTURE OPPORTUNITIES (B2B Scale & Ecosystem)

| ID | Recommendation | Proposed Solution | Effort | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **P3-1** | **Juristiv Campus (University & Teacher LMS)** | Leverage `Organization` schema for teacher-assigned kazus/court cohorts & grading overrides | **XL** (3w) | Professor creates class, assigns 1 IRAC + 1 Court session, exports CSV grades |
| **P3-2** | **Moot Court Tournament Mode** | Bracketed multiplayer rooms with spectator mode & chess-clock timers | **L** (2w) | 4+ teams compete in structured rounds with downloadable scorecards |
| **P3-3** | **Verified Legal Skill Portfolio (`/portfolio/[id]`)** | Public QR-verified transcript of IRAC scores, court wins, and drafted docs | **M** (5d) | Shareable public URL with verified stats |
