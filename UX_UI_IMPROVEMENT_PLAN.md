# JURISTIV — UX/UI & USER JOURNEY IMPROVEMENT PLAN

**Evidence Base:** Live browser inspection of `https://www.juristiv.uz/` across 8 routes (desktop 1440px/1280px & mobile 390px) + source code review of `src/app/` and `src/components/`.

---

## 1. CROSS-SITE CRITICAL UX/UI ISSUES (VERIFIED)

| Issue | Where Observed | Impact on Students | Specific Fix |
| :--- | :--- | :--- | :--- |
| **1. Literal backslash escaping bug (`to \'g \'ri`)** | `/pricing` hero H2 (`Siz uchun to \'g \'ri tarif`) | Looks amateurish and untrustworthy on the primary payment conversion page | Fix string literal escaping in the PricingSection component and enforce consistent Uzbek Latin (`to‘g‘ri`). |
| **2. Brand identity drift (`JURISTIV` vs `JURISAI`)** | Homepage hero mockup (`jurisai.uz/virtual-court/live-trial`), footer copyright (`© 2026 JURISAI`), TXT exports (`JuristAI`) | Confuses users about the official brand name | Standardize all UI copy, mockups, footers, and exports to **JURISTIV** (`juristiv.uz`). |
| **3. Hard auth wall with zero feature preview** | `/case-solver`, `/decision-tree`, `/document-generator`, `/virtual-court`, `/dashboard` | Visitors clicking a feature link land on a generic `/signin` screen with no context | Add a contextual preview banner on `/signin?redirectTo=...` explaining the requested feature, or offer a 1-case interactive sandbox preview before login. |
| **4. `/scenario-generator` bypasses auth wall & shows fake user** | `/scenario-generator` (publicly accessible; sidebar shows `Foydalanuvchi / Lv.1 / 0 Total XP`) | Inconsistent product boundary; guests see a misleading mock profile and hit 401 when generating | Either add `/scenario-generator` to `PROTECTED_PREFIXES` in `src/middleware.ts` or show a clean guest banner with "Kirish" CTA. |
| **5. `/pricing` hidden from homepage navigation** | `/` header and footer | Students cannot find pricing without guessing `/pricing` | Add `Tariflar` (`/pricing`) to the homepage top navbar and footer. |
| **6. Unauthenticated `401 /api/payments` on public pages** | `/`, `/pricing`, `/signin` (via `PaymentNotificationListener` in `providers.tsx`) | Pollutes network/console logs and wastes server invocations on every guest page load | Guard `usePaymentNotifications()` / `useSettingsSync()` so `/api/payments` is only polled when `isAuthenticated === true`. |
| **7. React Hydration Mismatch (`#418`) & static `<title>`** | All inspected public routes (`<title>` always `Bosh Sahifa | JURISTIV`) | Hurts SEO, browser tab usability, and causes UI flashes (e.g., social links flash on `/`) | Add route-specific `metadata` / `document.title` and resolve SSR/client state mismatch in social links / theme hydration. |
| **8. Mixed Uzbek Latin apostrophes & English leaks** | `/` (`bog'lanish` vs `Bog‘lanish`), `/scenario-generator` (`Total XP`, `civil`, `beginner`), `/pricing` (`Fair Use`) | Reduces perceived polish and clarity for Uzbek students | Normalize all UI strings to proper Uzbek Latin (`o‘`, `g‘`, `’`) and translate all enum badges (`civil` -> `Fuqarolik`, `beginner` -> `Boshlang‘ich`, `Total XP` -> `Jami XP`). |

---

## 2. FEATURE-BY-FEATURE UX/UI IMPROVEMENTS

### A. Kazus Yechish (`/case-solver`)
- **Current Friction (VERIFIED):**
  - Opens with `AI Kazus Yechishi` selected by default (`mode === 'ai_solves'`), encouraging passive consumption.
  - Case card displays `law_references` before the student attempts to solve, spoiling the `Rule` step.
  - 2,160-line single-page component has dense vertical scrolling across modes, filters, and results.
- **Redesign Recommendations:**
  1. Default to **"O'zim yechaman (Mashq rejimi)"** with a clear 4-step progress indicator (`1. Issue -> 2. Rule -> 3. Application -> 4. Conclusion`).
  2. Hide `law_references` behind an optional **"Maslahat (Hint)"** toggle during practice mode.
  3. After evaluation, show a **side-by-side diff view**: Student's Answer vs. Ideal AI Answer per IRAC section, with exact LexUZ article links.
  4. Replace `.txt` download with a clean, branded PDF export.

### B. Qarorlar Daraxti (`/decision-tree`)
- **Current Friction (VERIFIED):**
  - Default `guided` mode says *"Murakkab qonunlarni o'rganish shart emas!"*, positioning it as a citizen self-help quiz rather than a law student tool.
  - `visual` mode only lets students inspect AI-generated trees; no direct node creation/editing on the canvas.
- **Redesign Recommendations:**
  1. Make **"Vizual Strategiya Quruvchi"** the primary student view, with a split-pane: Left = Interactive Tree Canvas, Right = Node Inspector & LexUZ Legal Basis.
  2. Add a **"+ Shoxcha qo'shish (If/Then)"** button directly on each node so students can build/modify branches themselves.
  3. Keep `Guided` mode labeled clearly as **"Tezkor Diagnostika (Namuna)"** and show the underlying legal rule at every question step.

### C. Hujjatlar Konstruktori (`/document-generator`)
- **Current Friction (VERIFIED):**
  - Two top tabs (`Rasmiy blanklar kutubxonasi` vs `Maxsus generator`) have overlapping purposes; "Maxsus generator" uses local string replacement without AI, while "Rasmiy blanklar" downloads `.doc` HTML hacks.
  - Filler modal is purely transactional (fill form -> download) with zero educational explanation of *why* clauses exist.
- **Redesign Recommendations:**
  1. Add a **Document Anatomy Preview** before the form: show a visual outline of the document (Header, Parties, Legal Basis, Claims, Attachments) with hover explanations of required FPK/IPK rules.
  2. Replace `.doc` HTML download with genuine `.docx` and `.pdf` export buttons.
  3. Add a **"AI Tekshiruvi (Consistency Check)"** button after filling, flagging missing attachments (e.g., *davlat boji*) or weak factual claims.

### D. Virtual Sud (`/virtual-court`)
- **Current Friction (VERIFIED):**
  - Setup screen mixes single-player scenario selection with multiplayer links; `PROKUROR` / `ADVOKAT` / `SUDYA` roles are shown even when inappropriate for civil/labor disputes.
  - In multiplayer rooms, WebRTC audio/video has no fallback guidance if corporate/university Wi-Fi blocks STUN.
- **Redesign Recommendations:**
  1. Separate entry clearly into **"Yakka Mashq (AI Sud)"** and **"Jamoaviy Sud Zali (Multiplayer)"** cards at the top.
  2. Show an interactive **8-Stage Trial Stepper** at the top of the courtroom with a clear "Hozirgi navbat" (Current Turn) indicator and stage-specific quick action buttons (*Iltimosnoma*, *E'tiroz*, *Dalil taqdim etish*).
  3. Add a prominent **"Mikrofon/Video ishlamasa — Matn rejimida davom eting"** fallback banner in multiplayer.

### E. Senariy Generator (`/scenario-generator`)
- **Current Friction (VERIFIED on live site):**
  - Floating `?` help button overlaps the primary `"Senariyni Yaratish & Simulyatsiyani Boshlash"` button on desktop and cards on mobile.
  - `Shablonlar (10)` shows the same 5 templates twice.
  - Tab labels wrap (`Shablonlar\n(10)`), and mobile 390px shows horizontal scrollbars on both tabs and category filters.
  - Left sidebar is ~70% blank white space below `<- Asboblar`.
- **Redesign Recommendations:**
  1. Fix floating `?` button `z-index`/positioning (move into page header as a clean `"Qo'llanma"` button).
  2. Deduplicate `Shablonlar` so only unique verified templates appear, localize all domain/difficulty chips, and add `whitespace-nowrap` / clean wrapping on mobile.
  3. Add **"Kazus Yechishga o'tkazish"** and **"Virtual Sudda o'ynash"** action buttons on every generated scenario.

### F. Pricing Page (`/pricing`)
- **Current Friction (VERIFIED on live site):**
  - Broken 3-column grid at 1280px (`Pro` card wraps onto row 2 alone).
  - `Dashboardga qaytish` back link sends guests to `/signin`.
  - `Oylik / Yillik` toggle lacks an accessible `aria-label`.
- **Redesign Recommendations:**
  1. Fix CSS grid (`grid-cols-1 lg:grid-cols-3`) so all 3 plans align in one balanced row at `>=1024px`.
  2. Show `"Bosh sahifaga qaytish"` (`/`) when unauthenticated, and explain `"Fair Use"` in plain Uzbek (e.g., *"Oyiga 500 tagacha IRAC, 2000 ta AI chat"*).
