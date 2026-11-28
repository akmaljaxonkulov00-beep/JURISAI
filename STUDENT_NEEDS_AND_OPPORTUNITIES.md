# JURISTIV — STUDENT NEEDS ANALYSIS & NEW FEATURE OPPORTUNITIES

**Target Market:** Uzbekistan Legal Education (University law students at TDYU/UWED/regional law faculties, academic lyceum law tracks, bar/judge exam candidates, and law teachers).

---

## 1. CORE STUDENT NEEDS ASSESSMENT

| Student Need | Severity | Frequency | Current Alternative in Uzbekistan | Juristiv's Current Coverage (VERIFIED) | Gap & Paid Value Driver |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Solving IRAC / Kazus assignments** | High | Weekly / Exam prep | Telegram groups, ChatGPT (hallucinates Uzbek articles), textbook collections | **Covered** (`/case-solver`), with RAG over 7,201 articles | Needs blind practice mode, citation validation, and rubric-linked study recommendations |
| **2. Finding verified, up-to-date Uzbek laws & Plenum rulings** | Critical | Daily | `lex.uz` (slow search, dense UI), Telegram bots | **Covered** (`/legal-database`, `/qonunlar`, `legal-rag.ts`) | Needs Plenum rulings (`Oliy Sud Plenumi`), article version diffs (2023 Constitution, 2023 Labor Code), and side-by-side commentary |
| **3. Preparing for university exams & magistracy/bar tests** | Critical | Monthly / Seasonal | Printed test books, unofficial Telegram quizzes | **Missing** | **Highest-willingness-to-pay gap** — adaptive Uzbek law MCQ + kazus exam simulator |
| **4. Drafting procedural & contractual documents** | High | Weekly (internships, clinics) | Copying outdated `.doc` files from seniors/forums | **Covered** (`/document-generator`) | Needs true `.docx` export, AI consistency review, and "Why this clause?" annotations |
| **5. Practicing courtroom advocacy & procedure** | High | Monthly / Moot courts | Offline moot courts (rare, hard to organize) | **Covered** (`/virtual-court` single & multiplayer) | Needs reliable audio/TURN, role-specific procedure (Civil vs Criminal), and Moot Court tournament mode |
| **6. Legal terminology (Uzbek / Russian / English)** | Medium | Daily | Paper dictionaries, Google Translate (inaccurate) | **Missing** | Crucial for UWED/TDYU bilingual students and comparative law |
| **7. Building a verifiable skill portfolio for internships/employers** | Medium | Semesterly | Paper certificates, CV | **Partial** (`achievements`, XP) | Needs verified skill transcript (IRAC avg score, Court sessions won, Documents drafted) |

---

## 2. TEN+ NEW HIGH-VALUE FEATURE OPPORTUNITIES

Ranked by **Real Educational Value × Feasibility × Differentiation × Willingness to Pay**.

### 1. Adaptive Law Exam & Bar Prep Simulator (*Imtihon Tayyorgarlik Tizimi*)
- **Target users:** 1st–4th year law students, Magistracy/TDYU applicants, Advocate license candidates.
- **Problem:** Students have no reliable, up-to-date Uzbek exam prep platform mapped to 2026 codes; they rely on outdated PDFs with wrong answer keys.
- **Proposed solution:** Subject-by-subject timed mock exams (MCQ + mini-kazus) grounded in `full-legal-codes.json`, with spaced repetition for missed articles.
- **Core functionality:** Timed 50-question mocks, subject filters (Constitutional, Civil, Criminal, Labor, Administrative), instant article-linked explanations, mistake bank (*Xatolar daftari*).
- **Educational value:** Directly improves exam pass rates and forces mastery of exact code provisions.
- **Technical complexity:** Low–Medium (reuses `full-legal-codes.json` + `irac_analyses` DB pattern).
- **Development priority:** **P1 (Rank #1)**
- **Free or paid:** Free: 1 mock/week; Standart/Pro: Unlimited + Mistake Bank + Analytics.
- **Why different from existing features:** Tests breadth and speed across the curriculum, unlike deep single-case IRAC.
- **Integration:** Failed exam questions auto-recommend a Kazus Yechish exercise on that exact article.

### 2. Personal Error Tracker & Adaptive Learning Path (*Shaxsiy Xatolar Tahlili va O'quv Yo'li*)
- **Target users:** Regular students using IRAC, Virtual Court, and Scenario Generator.
- **Problem:** Students get a score (e.g., 68/100) and generic text, but don't know *which legal skill or code* is consistently dragging them down.
- **Proposed solution:** Aggregate weaknesses across `irac_analyses`, `court_sessions`, and `scenario_sessions` into a skill radar (Issue Spotting, Rule Citation, Subsumption, Procedure, Evidence) with targeted micro-drills.
- **Technical complexity:** Low–Medium (SQL aggregation + prompt context).
- **Development priority:** **P1 (Rank #2)**
- **Free or paid:** Standart / Pro.
- **Integration:** Unifies all 5 existing features into one retention loop.

### 3. Oliy Sud Plenum Rulings & Judicial Practice Analyzer (*Sud Amaliyoti va Plenum Sharhlari*)
- **Target users:** Upper-year law students, legal clinic interns, advocates.
- **Problem:** Knowing a Code article is insufficient without knowing how the Supreme Court interprets it (e.g., *Plenum №24* on contract penalties).
- **Proposed solution:** Curated, searchable database of Oliy Sud Plenum decisions linked directly to Code articles, plus AI comparison of how courts apply a norm in practice.
- **Technical complexity:** Medium (content curation + RAG index extension; `api/tools/court-practice` already exists as a stub/tool).
- **Development priority:** **P1 (Rank #3)**
- **Free or paid:** Standart / Pro.
- **Integration:** Surfaces inside IRAC `Rule` suggestions, Decision Tree nodes, and Virtual Court AI Judge rulings.

### 4. University & Teacher LMS Portal (*O'qituvchi va Universitet Boshqaruv Paneli — B2B*)
- **Target users:** Law professors, academic lyceum teachers, university deans (TDYU, UWED, regional universities).
- **Problem:** Professors spend hours manually grading 100+ student IRAC essays and cannot organize scalable virtual moot courts.
- **Proposed solution:** Teacher workspace to assign a specific Kazus or Virtual Court scenario to a student group, view AI-pre-graded rubrics, override/approve grades, and export class reports.
- **Technical complexity:** Medium (`organizations` and `organization_members` tables already exist in `prisma/schema.prisma`!).
- **Development priority:** **P1 (Rank #4)**
- **Free or paid:** B2B Institutional License.
- **Integration:** Connects directly to Kazus Yechish, Virtual Court Multiplayer, and Hujjatlar Konstruktori.

### 5. Document Drafting Coach & Mistake Lab (*Hujjat Tahrirlash va Xatolarni Topish Laboratoriyasi*)
- **Target users:** 2nd–4th year students, legal clinic trainees.
- **Problem:** Filling a form teaches data entry, not *legal drafting*. Students need to spot fatal procedural errors in claims and contracts.
- **Proposed solution:** Interactive "Spot the Flaw" exercises (e.g., a *Da'vo arizasi* missing jurisdiction or state fee calculation) + side-by-side comparison of weak vs. strong legal phrasing.
- **Technical complexity:** Low–Medium.
- **Development priority:** **P2 (Rank #5)**
- **Free or paid:** Standart / Pro.
- **Integration:** Embedded directly as a "O'quv rejimi" tab inside `/document-generator`.

### 6. Moot Court Tournament & Competition Mode (*Talabalar Sud Musobaqalari*)
- **Target users:** Student debate/moot teams, law faculties.
- **Problem:** Preparing for Jessup, Vis Moot, or national Uzbek moot competitions lacks structured sparring partners and scoring.
- **Proposed solution:** Scheduled bracket/match rooms on top of Virtual Court Multiplayer with spectator mode, strict chess-clock timers, and downloadable scorecards.
- **Technical complexity:** Medium (extends `multiplayer-db.ts`).
- **Development priority:** **P2 (Rank #6)**
- **Free or paid:** Pro + University B2B.
- **Integration:** Built on `/virtual-court/multiplayer`.

### 7. Multilingual Legal Terminology & Comparative Law Trainer (*Yuridik Terminologiya: O'zbek / Rus / Ingliz*)
- **Target users:** Academic lyceum students, bilingual university students, international law students.
- **Problem:** Uzbek legal terms (e.g., *subsumpsiya, da'vo muddati, ashyoviy dalil, shartnoma majburiyati*) often confuse students transitioning from school or studying international law.
- **Proposed solution:** Interactive glossary + contextual flashcards + Uzbek-Russian-English legal term mapping integrated as hover tooltips across all modules.
- **Technical complexity:** Low.
- **Development priority:** **P2 (Rank #7)**
- **Free or paid:** Free (core) / Standart (flashcards & quizzes).
- **Integration:** Hover definitions inside IRAC, Virtual Court, and Legal Database.

### 8. Legislation Change Tracker & "Old vs. New Code" Diff Viewer (*Qonunchilik O'zgarishlari Monitori*)
- **Target users:** Students, teachers, graduates preparing for exams.
- **Problem:** Uzbekistan passed a new Constitution (2023) and new Labor Code (2023), plus frequent amendments; students accidentally study outdated article numbers.
- **Proposed solution:** Curated changelog feed highlighting recent amendments to major codes with "Old Rule vs. New Rule" comparison cards.
- **Technical complexity:** Medium (requires editorial curation or LexUZ sync).
- **Development priority:** **P2 (Rank #8)**
- **Free or paid:** Free summary / Pro alerts.
- **Integration:** Displays "Updated in 2025/2026" badges inside `legal-rag.ts` citations and `/qonunlar`.

### 9. Peer Study Rooms & Collaborative Case Analysis (*Hamkorlikda Kazus Yechish*)
- **Target users:** Study groups, dormitory/classmates.
- **Problem:** Law students naturally study in groups before seminars, currently using messy Telegram voice chats.
- **Proposed solution:** Shared workspace link where 2–4 students co-edit an IRAC analysis or Decision Tree and compare their answers against AI evaluation.
- **Technical complexity:** Medium–High (Supabase Realtime).
- **Development priority:** **P3 (Rank #9)**
- **Free or paid:** Standart / Pro.
- **Integration:** Extends `decision_trees` and `irac_cases`.

### 10. Verified Legal Portfolio & Internship Readiness Certificate (*Yuridik Mahorat Portfeli*)
- **Target users:** Graduating students applying to law firms, notary offices, or state internships.
- **Problem:** Employers have no way to verify whether a student can actually write an IRAC memo or argue a case.
- **Proposed solution:** Publicly verifiable profile URL (`/portfolio/[id]`) showcasing completed Virtual Court trials, IRAC accuracy score, and drafted documents (with QR verification).
- **Technical complexity:** Low–Medium.
- **Development priority:** **P3 (Rank #10)**
- **Free or paid:** Pro.
- **Integration:** Reads from `irac_analyses`, `court_sessions`, `user_filled_documents`, and `xp-engine.ts`.
