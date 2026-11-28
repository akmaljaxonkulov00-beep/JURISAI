# JURISTIV — FIVE CORE FEATURES: DETAILED PRODUCT & TECHNICAL AUDIT

**Classification Key:**
- **VERIFIED**: Directly confirmed through source code, database migrations, or live UI inspection.
- **PARTIALLY VERIFIED**: Some evidence exists, but runtime behavior with live authenticated AI/DB calls could not be executed in a production-safe test without an authenticated test account.
- **NOT VERIFIED**: Insufficient access or evidence (e.g., live Supabase production row counts, live Groq/Gemini API latency in prod).
- **RECOMMENDATION**: Proposed product, educational, or architectural improvement.

---

## 1. FEATURE 1 — KAZUS YECHISH (IRAC)
**Live Route:** `https://www.juristiv.uz/case-solver` (with `/irac` redirecting to `/case-solver`)  
**Primary Files:** `src/app/case-solver/page.tsx` (2,160 lines), `src/app/api/ai/irac-analyze/route.ts`, `src/app/api/ai/irac-evaluate/route.ts`, `src/app/api/irac/cases/route.ts`, `src/app/api/irac/history/route.ts`, `src/app/api/case-solver/save-analysis/route.ts`

### A. Implementation & User Journey (VERIFIED)
- **Authentication Gate**: `src/middleware.ts` redirects unauthenticated visitors from `/case-solver` to `/signin?redirectTo=%2Fcase-solver`.
- **Two Modes**:
  1. `ai_solves` (**AI Kazus Yechishi**): Student selects a pre-seeded case (`irac_cases` table or `SEED_IRAC_CASES` fallback) or writes a custom case (`O'zim yozaman`, min 30 chars, max 25,000 chars). Calls `POST /api/ai/irac-analyze`.
  2. `user_solves` (**Kazus Baholash**): Student fills out 4 structured textareas (`ISSUE` [20 pts], `RULE` [25 pts], `APPLICATION` [30 pts], `CONCLUSION` [25 pts]) and submits to `POST /api/ai/irac-evaluate`.
- **Persistence & Gamification**: Results save to `irac_analyses` via `POST /api/case-solver/save-analysis` and award 10–20 XP via `awardUserXP()` in `src/lib/xp-engine.ts`. Progress and category stats are fetched from `GET /api/irac/history`.
- **Export**: `handleExportIracReport` exports a `.txt` file (`IRAC_Tahlil_<timestamp>.txt`), **not** a formatted PDF (despite the `Download` icon).

### B. Educational Value Analysis
- **Strengths (VERIFIED)**:
  - The dual-mode design (`ai_solves` vs `user_solves`) is pedagogically sound: `user_solves` forces active recall and structured IRAC writing before revealing the model answer.
  - `irac-evaluate/route.ts` uses an explicit, transparent 100-point rubric (`Issue: 0–20`, `Rule: 0–25`, `Application: 0–30`, `Conclusion: 0–25`) with Uzbek legal criteria (e.g., *subyekt, obyekt, subyektiv va obyektiv tomonlar, sababiy bog'lanish*).
- **Critical Gaps (VERIFIED)**:
  1. **AI Solves Mode Encourages Passive Copying**: The default selected mode is `ai_solves` (`useState<Mode>('ai_solves')` in `case-solver/page.tsx:221`). Students immediately see a button to let AI solve the case for them without attempting it first.
  2. **No Practice/Blind Mode or Exam Simulation**: No timed exam mode, no "hide hints/law_references" toggle (the case card exposes `law_references` right before the student writes their `Rule`!), and no step-by-step scaffolding for beginners.
  3. **No Targeted Learning Loop**: `weaknesses` and `suggestions` are generated as static strings per submission, but there is no personal error tracker (e.g., "You missed *subsumpsiya* in 3 of your last 5 Criminal Law cases") and no link to relevant articles in `/qonunlar` or `/legal-database`.
  4. **Monolithic UI (`2,160` lines)**: `src/app/case-solver/page.tsx` combines home, library, solver, evaluation, results, history, and admin CRUD in a single client component.

### C. Legal Accuracy & AI Reliability
- **RAG Grounding (VERIFIED)**: Both `irac-analyze` and `irac-evaluate` call `groundPrompt()` / `retrieveLegalArticles()` from `src/lib/legal-rag.ts`, injecting up to 6–8 real articles from `src/data/full-legal-codes.json` (7,201+ articles) or Supabase `articles`.
- **Missing Citation Validation (VERIFIED — CRITICAL GAP)**: Unlike `document-generate/route.ts`, **neither `irac-analyze` nor `irac-evaluate` calls `validateCitations()`** from `src/lib/legal-rag.ts`. If Gemini/Groq hallucinates an article number (e.g., `JK 999-modda`), it is returned directly to the student without warning.
- **No Ambiguity / Missing-Facts Prompting (VERIFIED)**: The IRAC prompt asks for a single definitive conclusion and does not instruct the AI to identify missing facts, distinguish facts from assumptions, or present counterarguments.
- **Save-Analysis Overwrites AI Feedback with Heuristic Feedback (VERIFIED — BUG)**: In `case-solver/page.tsx:595`, after `evaluateWithAI` receives rich AI feedback (`data.feedback`, `data.strengths`, `data.weaknesses`), `persistResult(finalScore, userAnswers)` calls `POST /api/case-solver/save-analysis`, which **ignores the AI feedback** and runs deterministic regex heuristics (`buildFeedback`, `buildStrengths`, `buildWeaknesses` checking for keywords like `modda|kodeks` and `chunki|sabab`) and saves *those* to `irac_analyses`!

### D. Recommendations for Feature 1
1. **P0**: Wire `validateCitations()` into `irac-analyze` and `irac-evaluate` and display verified LexUZ badges vs. unverified warnings.
2. **P0**: Fix `save-analysis/route.ts` to persist the actual AI-generated `feedback`, `strengths`, `weaknesses`, and `sectionScores` rather than overwriting them with regex heuristics.
3. **P1**: Make `user_solves` ("O'zim yechaman") the primary recommended flow, hide `law_references` until after submission ("Imtihon/Mashq rejimi"), and add a "Kuchli/Zaif tomonlar tahlili" error-tracking dashboard across attempts.
4. **P1**: Upgrade export from `.txt` to formatted PDF using `src/lib/pdf-generator.ts` (already used in Decision Tree and Document Generator).

---

## 2. FEATURE 2 — QARORLAR DARAXTI (DECISION TREE)
**Live Route:** `https://www.juristiv.uz/decision-tree`  
**Primary Files:** `src/app/decision-tree/page.tsx` (1,086 lines), `src/components/decision-tree/*` (`GuidedDecisionFlow.tsx`, `DecisionTreeGraph.tsx`, `NewCaseModal.tsx`, `NodeDetailPanel.tsx`, `BranchComparisonModal.tsx`, `EvidencePanel.tsx`), `src/lib/decision-tree-engine.ts`, `src/app/api/decision-tree/*` (`analyze/route.ts`, `generate/route.ts`, `trees/route.ts`, `nodes/route.ts`)

### A. Implementation & User Journey (VERIFIED)
- **Two Modes**:
  1. `guided` (default): `GuidedDecisionFlow.tsx` presents pre-authored interactive Q&A trees (`GUIDED_SCENARIOS` in `src/lib/decision-tree/guided-scenarios-data.ts`), updating a win-probability meter (`currentProbability`) step-by-step and culminating in a verdict card with PDF export.
  2. `visual`: Interactive node-and-edge graph (`DecisionTreeGraph.tsx`) powered by `layoutTree()` in `src/lib/decision-tree-engine.ts`. Students can click "Yangi ish yaratish" (`NewCaseModal`), enter 10 legal parameters (`case_type`, `user_role`, `objectives`, `known_facts`, `evidence_docs`, `opposing_party`, `deadlines`, etc.), and call `POST /api/decision-tree/analyze` to generate a full tree + `CaseAnalysis`.
- **Simulation & Comparison**: Students can toggle evidence availability (`EvidencePanel`), highlight a path (`activePathIds`), view cost/duration/probability metrics (`calculatePathSimulation`), compare branches (`BranchComparisonModal`), and export PDF (`PdfExportHelper.ts`).
- **Persistence**: `GET/POST /api/decision-tree/trees` stores trees in Supabase `decision_trees` table (with a self-healing column-stripping retry loop and JSONB `metadata` fallback to survive schema drift).

### B. Educational Value & Functional Gaps (VERIFIED)
- **Strengths**: Clear visual modeling of legal strategy (strategies -> outcomes, probabilities, costs in UZS, durations, required evidence). Distinct from IRAC in `visual` mode.
- **Critical Gaps**:
  1. **Students Cannot Build or Edit Their Own Trees**: Despite having `NodeDetailPanel.tsx` and `DecisionTreeGraph.tsx`, there is **no interactive node/branch editor** in the UI for students to add a node, delete a node, connect branches, or write their own If/Then legal conditions. The tree is 100% AI-generated (or static `GUIDED_SCENARIOS`).
  2. **No Contradiction Detection or Missing-Condition Validation**: `decision-tree-engine.ts` computes layout and path metrics, but has no logic to detect contradictory legal conditions, mutually exclusive outcomes, or missing procedural prerequisites (e.g., filing a claim without checking statute of limitations).
  3. **Guided Mode Looks Like a Consumer Legal Quiz, Not a Student Modeling Tool**: `GuidedDecisionFlow.tsx` says *"Murakkab qonunlarni o'rganish shart emas!"* ("No need to learn complex laws!") — great for citizens, counterproductive for law students who *must* learn the rules behind each branch.
  4. **Duplicate/Unused API Routes**: Both `/api/decision-tree/analyze` and `/api/decision-tree/generate` exist with different JSON schemas (`DecisionNode` vs `AiNode`), and `/api/decision-tree/nodes` reads `supabase` (anon client) instead of `getSupabaseAdmin()`.
  5. **No Collaboration or Project Sharing**: No shareable read-only link or teacher-assigned tree template workflow.

### C. Recommendations for Feature 2
1. **P1**: Add an interactive **Student Tree Builder Mode** (Add Decision Node / Add Condition / Add Outcome / Connect Branch / Attach LexUZ Article) so students actively construct If/Then legal logic instead of only consuming AI trees.
2. **P1**: Add **Condition & Contradiction Validator** in `decision-tree-engine.ts` (flagging missing procedural preconditions like *da'vo muddati*, *sudlovga tegishlilik*, or probabilities summing inconsistently).
3. **P2**: Reframe `GuidedDecisionFlow` for students by showing the exact legal rule triggered at every Q&A fork, and deprecate the redundant `/api/decision-tree/generate` endpoint.

---

## 3. FEATURE 3 — HUJJATLAR KONSTRUKTORI (DOCUMENT GENERATOR)
**Live Route:** `https://www.juristiv.uz/document-generator`  
**Primary Files:** `src/app/document-generator/page.tsx`, `src/components/documents/OfficialDocumentsCatalog.tsx`, `src/components/documents/OfficialDocumentFillerModal.tsx`, `src/components/features/DocumentGenerator.tsx`, `src/lib/documents/official-documents-data.ts` (1,333 lines), `src/app/api/official-documents/*`, `src/app/api/ai/document-generate/route.ts`, `src/app/api/ai/document-analysis/route.ts`, `src/app/api/documents/route.ts`

### A. Implementation & User Journey (VERIFIED)
- **Two Sub-Modes (`viewMode`)**:
  1. `official` (**Rasmiy blanklar kutubxonasi**): Catalog of verified templates (`OFFICIAL_DOCUMENTS_REGISTRY` in `official-documents-data.ts` + `official_legal_documents` DB table) across 10 categories (`civil`, `family`, `labor`, `contracts`, `inheritance`, `administrative`, `criminal`, `notarial`, `procedural`, `other`). Users can download a blank `.doc` (HTML-wrapped Word format) or open `OfficialDocumentFillerModal` to fill structured fields, validate required fields via `POST /api/official-documents/[id]/fill`, and get a SHA-256 checksum.
  2. `custom` (**Maxsus generator**): `DocumentGenerator.tsx` loads templates from `/api/templates` or `src/data/document-templates.json` and performs **local placeholder substitution** (`generateLocalDocument()`, no AI call) with save to `/api/documents` and PDF export.
- **Separate AI Endpoints**: `/api/ai/document-generate` (with `groundPrompt` + `validateCitations`) and `/api/ai/document-analysis` exist on the backend.

### B. Legal Authenticity & Educational Audit (VERIFIED)
- **Strong Authenticity Guardrails**: `official-documents-data.ts` explicitly enforces *"AI hujjatlarni noldan to'qib chiqarmaydi"* and attaches `officialSourceName` (`Oliy Sud`, `LexUZ`, `my.sud.uz`, `Adliya vazirligi`), `officialSourceUrl`, `versionNumber`, `effectiveDate`, `legalBasis`, and `sha256Checksum`.
- **Critical Gaps**:
  1. **Fake `.doc` Export & Missing Real `.docx` Generation**: Despite `docx` (`^9.7.1`) and `docxtemplater` (`^3.68.6`) being installed in `package.json`, `OfficialDocumentsCatalog.tsx:59-67` exports an **HTML string disguised as `.doc`** (`type: 'application/msword'`), which triggers format warnings in Microsoft Word.
  2. **Missing Educational Layer**: The filler modal collects data and outputs text, but does **not**:
     - Explain *why* each section is legally required (e.g., FPK 189-modda requisites).
     - Provide a "Drafting Review / Learning Mode" comparing strong vs. weak legal arguments or common mistakes.
     - Wire `/api/ai/document-analysis` into the post-fill workflow to check logical consistency of the student's factual narrative inside the document.
  3. **Auth Bug in `/api/official-documents/[id]/fill/route.ts` (VERIFIED)**: Lines 52-55 call `supabaseServer.auth.getUser()` without passing the request's Bearer token or cookies! On the server, `supabaseServer` has no user session, so `user` is always `null` and **filled official documents are never saved to `user_filled_documents`**.
  4. **Disconnection Between UI and AI**: `DocumentGenerator.tsx` ("Maxsus generator") does simple `{field}` string replacement and never calls `/api/ai/document-generate` or `/api/ai/document-analysis`.

### C. Recommendations for Feature 3
1. **P0**: Fix `src/app/api/official-documents/[id]/fill/route.ts` to use `requireUser(request)` so filled documents actually persist to `user_filled_documents`.
2. **P1**: Implement true `.docx` export using the already-installed `docx` package, and clearly label educational practice templates vs. official court forms.
3. **P1**: Add an **AI Legal Drafting Coach** step after filling (powered by `/api/ai/document-analysis`) that checks factual consistency, missing procedural attachments (e.g., *davlat boji kvitansiyasi*), and argument strength.

---

## 4. FEATURE 4 — VIRTUAL SUD (VIRTUAL COURT)
**Live Route:** `https://www.juristiv.uz/virtual-court` (plus `/virtual-court/multiplayer`, `/virtual-court/room/[roomId]`, `/virtual-court/completed`)  
**Primary Files:** `src/app/virtual-court/page.tsx` (1,880 lines), `src/app/api/court-simulator/route.ts` (800 lines), `src/lib/court/stage-machine.ts` (638 lines), `src/lib/court/scoring-engine.ts` (347 lines), `src/lib/court/ai-engine.ts` (353 lines), `src/lib/court/multiplayer-db.ts` (2,448 lines), `src/hooks/useMultiplayerCourt.ts` (1,010 lines), `src/app/api/court/multiplayer/*`

### A. Single-Player & Procedural Realism (VERIFIED)
- **Strengths**:
  - `stage-machine.ts` models an authentic 8-stage Uzbek trial (`open_hearing` -> `rights_and_petitions` -> `judicial_investigation` -> `evidence_and_examination` -> `judicial_pleadings` -> `final_word` -> `deliberation_and_verdict` -> `verdict_review`) referencing real JPK/FPK articles (`JPK 405-470`, `JPK 95-modda`).
  - `scoring-engine.ts` has role-specific weighting (`SUDYA`, `PROKUROR`, `ADVOKAT`), zero-participation detection, and an AI rubric (`evaluateCourtSessionWithAi`).
  - Supports voice input via Web Speech API (`SpeechRecognition`) and transcript export.
- **Gaps**:
  - Single-player roles are restricted to `['ADVOKAT', 'PROKUROR', 'SUDYA']` (`court-simulator/route.ts:162`). Even in civil/labor cases, the criminal-law label `PROKUROR` is used rather than `DA'VOGAR` / `JAVOBGAR` (though `multiplayer-types.ts` adds `GUVOH`, `AYBLANUVCHI`, `EKSPERT`, `KOTIB`, `KUZATUVCHI`).
  - `virtual-court/page.tsx` exports `.txt` instead of PDF for the *Sud Bayonnomasi*.

### B. Multiplayer Architecture & Security Audit (VERIFIED — CRITICAL FINDINGS)
- **State Synchronization**:
  - Uses `globalThis.__juristivRooms` (`Map`) in `multiplayer-db.ts` as primary memory store, backed by Supabase `court_multiplayer_rooms` (and fallback `court_sessions` JSONB).
  - **Serverless Split-Brain Risk**: In serverless/edge deployments (Netlify/Vercel), `globalThis.__juristivRooms` is isolated per container/lambda. Two players hitting different instances will read/write divergent in-memory room states unless Supabase is always treated as the single source of truth.
- **Guest Identity Spoofing Vulnerability (VERIFIED — P0 SECURITY)**:
  - In `src/app/api/court/multiplayer/rooms/route.ts` (lines 34-42) and `.../action/route.ts` (lines 45-52), if `requireUser` fails, the API trusts raw `x-guest-id` and `x-guest-name` HTTP headers. Any attacker can pass `x-guest-id: <judgeUserId>` and issue verdicts, kick players, or advance stages.
- **WebRTC Reliability Risk (VERIFIED)**:
  - `useMultiplayerCourt.ts` (lines 26-30) configures only STUN servers (`stun.l.google.com`, `twilio`) with **no TURN relay server**. University Wi-Fi and mobile carrier NATs frequently block P2P STUN, causing silent audio/video failure.
- **Cleanup**: `/api/court/multiplayer/cleanup/route.ts` exists for cron cleanup of abandoned/expired rooms.

### C. Recommendations for Feature 4
1. **P0**: Remove `x-guest-id` header trust for privileged actions (`start`, `assign_role`, `advance_stage`, `issueVerdict`, `kickParticipant`); require signed session tokens or server-issued signed guest tokens.
2. **P0**: Eliminate `globalThis.__juristivRooms` as authoritative state in production; read/write directly to Supabase `court_multiplayer_rooms` + Realtime Postgres Changes.
3. **P1**: Adapt roles dynamically by procedure type (Civil/Economic: *Da'vogar, Javobgar, Sudya*; Criminal: *Prokuror, Advokat, Sudya, Sudlanuvchi, Guvoh*).
4. **P1**: Add a TURN server configuration option for WebRTC and graceful text-first fallback when media fails.

---

## 5. FEATURE 5 — SENARIY GENERATOR (SCENARIO GENERATOR)
**Live Route:** `https://www.juristiv.uz/scenario-generator`  
**Primary Files:** `src/app/scenario-generator/page.tsx`, `src/components/features/ScenarioGenerator.tsx` (1,287 lines), `src/lib/scenario-generator-engine.ts` (1,257 lines), `src/app/api/scenario-generator/*` (`generate/route.ts`, `step/route.ts`, `evaluate/route.ts`, `sessions/route.ts`, `templates/route.ts`, `scenarios/route.ts`)

### A. Implementation & Live UX Findings (VERIFIED)
- **Missing Auth Protection**: `/scenario-generator` is **omitted from `PROTECTED_PREFIXES` in `src/middleware.ts`**, making it publicly accessible without login (unlike the other 4 features), while showing a fake `Lv.1 / 0 Total XP` guest sidebar.
- **Live UI Bugs Observed**:
  - `Shablonlar (10)` displays **5 templates duplicated twice** (confirmed in `templates/route.ts` where DB `scenario_templates` rows without `decision_points` fall back and map onto `VERIFIED_SCENARIO_TEMPLATES`).
  - Floating `?` button overlaps the primary CTA button on desktop and cards on mobile.
  - English tags leak into UI (`Total XP`, `civil`, `labor`, `family`, `criminal`, `property`, `beginner`, `intermediate`, `advanced`).
- **Interactive Simulation**: Generates a scenario with `facts`, `participants`, `evidence`, `timeline`, `legal_issues`, and 2–3 `decision_points`. Student chooses an option per step (`/api/scenario-generator/step`), receives immediate XP/feedback, and gets a final `ScenarioEvaluation` (`/api/scenario-generator/evaluate`).

### B. Core Overlap & Strategic Assessment (VERIFIED)
- **High Overlap with Kazus Yechish & Decision Tree**:
  - `ScenarioGenerator` currently acts as a **multiple-choice legal quiz** (2–3 decision points with pre-baked `is_optimal: true/false` options).
  - Its `background + facts + legal_issues` duplicates **Kazus Yechish**.
  - Its `decision_points + consequences` duplicates **Qarorlar Daraxti (Guided Mode)**.
  - Its `participants + evidence + roles` duplicates **Virtual Sud**.
  - Meanwhile, `step/route.ts` does **not** dynamically evolve facts or introduce unexpected twists based on student actions—it just looks up the static option `chosenOption` from the JSON already sent to the client (meaning a student can inspect the network response from `/generate` and see `is_optimal: true` and `xp: 30` before answering!).
- **Recommended Architectural Role (RECOMMENDATION)**:
  - **Transform Scenario Generator from a standalone quiz tab into Juristiv's unified "Case & Scenario Engine"** that:
    1. Generates dynamic, evolving multi-stage legal simulations (with hidden/surprise facts revealed *only* server-side at step transitions, not leaked in the initial JSON).
    2. Includes **"Send to Kazus Yechish (IRAC)"**, **"Model in Qarorlar Daraxti"**, and **"Launch in Virtual Sud"** one-click export buttons so teachers and students can use generated scenarios across the entire platform.
