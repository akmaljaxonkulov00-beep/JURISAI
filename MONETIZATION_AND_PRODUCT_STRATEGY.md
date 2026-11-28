# JURISTIV — MONETIZATION, UNIT ECONOMICS & B2B STRATEGY

**Evidence Base:** `supabase/migrations/20261006_force_new_pricing.sql`, `src/app/api/billing/plans/route.ts`, `src/lib/usage-limits.ts`, `src/app/api/admin/cost-monitoring/route.ts`, and live `/pricing` page.

---

## 1. CURRENT PRICING & LIMITS AUDIT (VERIFIED)

| Tier | Monthly Price | Annual Price (20% off) | Included Limits (per month) | Audit Assessment |
| :--- | :--- | :--- | :--- | :--- |
| **Bepul (Free)** | `0 so'm` | `0 so'm` | Legal DB: Unlimited<br>AI Chat: 30<br>IRAC: 10<br>Doc Gen: 10<br>STT: 10<br>Scenario: 5<br>**Doc Analysis: 0**<br>**Decision Tree: 0**<br>**Virtual Court: 0** | **Over-restricted on flagship differentiators.** Blocking Virtual Court (0) and Decision Tree (0) completely on Free prevents students from ever experiencing Juristiv's #1 differentiator before paying. Meanwhile, 10 Doc Gens and 10 IRACs on Free is generous enough that casual users may never upgrade. |
| **Standart** | `29,000 so'm` (~$2.30) | `278,400 so'm` | AI Chat: 300<br>IRAC: 50<br>Doc Gen: 50<br>Doc Analysis: 30<br>Decision Tree: 30<br>STT: 100<br>Virtual Court: 15<br>Scenario: 30 | **Strong student price point** (roughly 2–3 lunches in Tashkent). However, lacks *outcomes-focused* premium features (Exam Prep, Error Tracker, DOCX export) — it only sells higher counters. |
| **Pro** | `79,000 so'm` (~$6.20) | `758,400 so'm` | "Fair Use" (`ai_chat: 2000`, `irac: 500`, `doc_gen: 300`, `doc_analysis: 300`, `decision_tree: 300`, `stt: 500`, `scenario: 200`)<br>Virtual Court: 50<br>"Shaxsiy maslahatchi" & "Ekspert konsultatsiyasi" | **Misaligned value & unverified promises.** Lists *"Shaxsiy maslahatchi"* and *"Ekspert konsultatsiyasi"*, yet `/citizen`, `/advocate`, `/law-student` marketplace routes are **paused in `src/middleware.ts:42-59`**! Also `"Fair Use"` is in English without transparent numbers on `/pricing`. |

---

## 2. AI COST SUSTAINABILITY ANALYSIS (VERIFIED)

From `src/app/api/admin/cost-monitoring/route.ts` (Groq fallback cost estimates; Gemini Flash-Lite/Flash primary tier is even cheaper or free-tier):
- `ai_chat`: ~$0.0005 / call
- `irac`: ~$0.0015 / call
- `document_generate`: ~$0.0021 / call
- `document_analysis`: ~$0.0019 / call
- `decision_tree`: ~$0.0016 / call
- `virtual_court`: ~$0.0060 / session
- `speech_stt`: ~$0.0030 / call
- `scenario`: ~$0.0012 / call

**Worst-Case Monthly AI Cost vs. Revenue:**
- **Standart User (29,000 UZS ≈ $2.30)** hitting 100% of every limit: ~$0.73/month -> **~68% gross margin even at 100% utilization** (and >90% margin at typical 20–30% utilization, especially with Gemini primary).
- **Pro User (79,000 UZS ≈ $6.20)** hitting 100% of `FAIR_USE_LIMITS` (2,000 chats + 500 IRAC + 300 doc gen + 300 doc analysis + 300 trees + 500 STT + 200 scenarios + 50 courts): ~$5.93/month -> **dangerously thin margin (~4%)** if a power user or shared account maxes out STT + Virtual Court + IRAC on Groq!

---

## 3. RECOMMENDED MONETIZATION RESTRUCTURING

### Principle: Never paywall discovery; paywall mastery, scale, and career tools.

1. **Free Tier ("Talaba Start" — 0 so'm):**
   - **Give 2–3 free Virtual Court sessions and 2–3 free Decision Trees/month** so every student experiences the "aha!" moment.
   - Keep Legal Database unlimited; cap IRAC at 5/mo, AI Chat at 20/mo, Doc Gen at 3/mo.
2. **Standart Tier ("Talaba Plus" — 29,000 so'm/oy):**
   - Target: Everyday university coursework & exam prep.
   - Includes: 50 IRAC Evaluations, 15 Virtual Court sessions, 30 Decision Trees, **Adaptive Exam Prep (unlimited)**, **Personal Error Tracker**, and **true `.docx` / PDF exports**.
3. **Pro Tier ("Karyera & Musobaqa" — 69,000–79,000 so'm/oy):**
   - Remove unfulfilled promises (*"Shaxsiy maslahatchi"* if advocate marketplace is paused) and replace with real delivered value:
     - **Multiplayer Virtual Court Host** (host private rooms for study groups/moot teams).
     - **AI Document Consistency Checker** (`/api/ai/document-analysis`).
     - **Oliy Sud Plenum & Judicial Practice Deep Search**.
     - **Verified Portfolio & Skill Certificate** (with QR verification for internships).
   - Tighten `FAIR_USE_LIMITS` on high-cost items (`speech_stt`: 250/mo, `ai_chat`: 1,000/mo, `irac`: 250/mo) and route simple tasks to Gemini Flash-Lite + `ai_response_cache` to protect >75% gross margin.

---

## 4. B2B INSTITUTIONAL MODEL (UNIVERSITIES & LYCEUMS)

`prisma/schema.prisma` already includes `Organization` and `OrganizationMember` tables, giving Juristiv a head start for B2B:
- **Target Institutions:** TDYU (Tashkent State University of Law), UWED (JIDU), Karakalpak/Samarkand/Termez law faculties, Ministry of Justice academic lyceums, and Legal Clinics.
- **B2B Offer ("Juristiv Campus"):**
  - **Pricing:** 15,000–20,000 UZS/student/month (billed per semester/academic year to the university or via subsidized student cohorts), minimum 100 seats.
  - **Teacher Features:** Bulk assignment of Kazus Yechish & Virtual Court scenarios, AI-assisted rubric grading queue, cohort analytics (which articles 60% of a class fails), and institutional Moot Court tournaments.
