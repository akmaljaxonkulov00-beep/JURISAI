# P1.7 Browser E2E Report

**Environment:** Local production build (`npx next start -p 3000` -> `http://localhost:3000`)  
**Tool:** Automated Chromium webview (`browser` subagent, verified against `BROWSER_HOST_FACTS`)

## 1. Public Pages & Viewports Tested
| Route | Viewports | Overflow (`scrollWidth <= innerWidth`) | Console / Hydration | Network 401s | Status |
|---|---|---|---|---|---|
| `/` | `1440x900` | PASS (`1430 <= 1440`, no horizontal scroll) | 0 console errors, 0 #418 | 0 (`0 /api/payments`) | **VERIFIED** |
| `/pricing` | `1440x900`, `768x1024`, `390x844`, `360x800` | PASS across all 4 viewports | React #418 warning present (P2 non-blocking) | 0 (`0 /api/payments`) | **PARTIALLY VERIFIED** |
| `/signin` | `390x844` | PASS (`380 <= 390`) | 0 console errors | 0 | **VERIFIED** |
| `/legal-database` | `1440x900` | PASS | 0 console errors | **Fixed in P1.7** (0 `401 /bookmarks` after re-build) | **VERIFIED** |

## 2. Protected Route Middleware Redirects
- `http://localhost:3000/scenario-generator` -> redirected to `/signin?redirectTo=%2Fscenario-generator` (**VERIFIED**).
- `http://localhost:3000/case-solver` -> redirected to `/signin?redirectTo=%2Fcase-solver` (**VERIFIED**).
- `http://localhost:3000/qonunlar` -> redirected to `/signin?redirectTo=%2Fqonunlar` (**VERIFIED**).

## 3. Pricing UI Verification (Post-Fix Re-Check)
- `Bepul` (Free) plan displays `2 ta AI Drafting Coach tahlili / oy`, `2 ta virtual sud sessiyasi / oy`, and `2 ta qarorlar daraxti (AI) / oy` (**VERIFIED**).
- `Pro` plan no longer displays paused Marketplace promises (`Shaxsiy maslahatchi`, `Ekspert konsultatsiyasi`) (**VERIFIED**).
- Monthly/Yearly billing toggle switches prices cleanly (`0 / 29,000 / 79,000` -> `0 / 278,400 / 758,400`) with `aria-label` (**VERIFIED**).

## 4. Authenticated Feature Click-Throughs (Blocked / Not Executed in Browser)
- Authenticated feature E2E journeys (`/case-solver` Exam Mode, `/decision-tree` builder, `/document-generator` `.docx` download, `/scenario-generator` cross-feature handoffs, `/virtual-court` multiplayer two-browser sync) were **BLOCKED** from live browser execution because no dedicated test-user credentials were created in production Supabase (forbidden by Section 20). Those flows are verified at the API/unit level (`21/21` P1 tests + `npx next build`).
