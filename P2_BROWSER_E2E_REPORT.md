# P2 Browser E2E Report

Verified on local production build (`npx next start -p 3000` -> `http://localhost:3000`) using automated Chromium (`browser` subagent, verified against `BROWSER_HOST_FACTS`):

- **`/` (`1440x900`):** 0 console errors, 0 hydration errors, 0 `401 /api/payments`, `JURISTIV` branding verified, 0 horizontal overflow (`1430 <= 1440`).
- **`/pricing` (`1440x900`, `768x1024`, `390x844`, `360x800`):** 0 console errors (**React `#418` eliminated**), 0 horizontal overflow across all 4 viewports, Free `2/2/2` trials and Pro copy verified (`Shaxsiy maslahatchi`/`Ekspert konsultatsiyasi` removed), monthly/yearly toggle verified (`0 / 29 000 / 79 000 so'm`).
- **`/signin` (`390x844`):** 0 console errors, clean mobile login UI, 0 horizontal overflow (`380 <= 390`).
- **`/legal-database` (`1440x900`):** 0 console errors, 0 `401 /api/legal/database/bookmarks` requests.
- **Protected Route Redirects:** `/case-solver`, `/scenario-generator`, `/qonunlar` redirect cleanly to `/signin?redirectTo=...`.
- **Authenticated Feature Journeys & 2-Browser Multiplayer:** **BLOCKED** locally because creating test accounts in production Supabase is prohibited; scheduled for staging verification.
