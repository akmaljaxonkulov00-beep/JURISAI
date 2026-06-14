# Requirements Document

## Introduction

JurisAI is an AI-powered legal education platform operating in Uzbek language and based on Uzbekistan legislation. The Platform is built on Next.js 16.2.4 (App Router), React 19, TypeScript, TailwindCSS, Supabase, and Groq AI (`llama-3.3-70b-versatile`). The UI shell operates but critical backend functions—authentication, AI integration, database, payment system, subscription limits, Virtual Court, Legal Database—remain with mock data or incomplete integration. This specification defines all requirements to bring the Platform from 0% to 100% operational state.

---

## Glossary

- **Platform**: The JurisAI Next.js web application
- **Supabase**: Backend service providing authentication, database, and file storage
- **Groq_AI_Service**: AI service providing all AI functions via the `llama-3.3-70b-versatile` model
- **IRAC_Analyzer**: Legal analysis module using IRAC methodology (Issue, Rule, Application, Conclusion)
- **Auth_Provider**: React context in `src/app/providers.tsx` managing authentication state across the application
- **Route_Guard**: Next.js middleware in `middleware.ts` enforcing route protection
- **Subscription_Tier**: User subscription type with values `free`, `pro`, or `premium`
- **Usage_Record**: User AI usage entry stored in Supabase `usage_tracking` table
- **AI_Chat_Service**: AI assistant module conducting real-time legal conversations with users
- **Virtual_Court_Session**: Module enabling users to conduct virtual court proceedings with AI opponent and AI judge
- **Legal_Article_Database**: Module enabling search and viewing of Uzbekistan legislation articles
- **Payment_Review_Panel**: Admin panel for reviewing and approving payment submissions
- **Experience_Points**: User experience score stored in Supabase `users` table as integer value
- **Mock_Implementation**: Placeholder code using hardcoded fake data instead of real backend integration
- **Session_Token**: Supabase authentication JWT token with 1-hour default expiration
- **API_Response_Time**: Time from API request receipt to response transmission, measured in milliseconds
- **Monthly_Usage_Limit**: Maximum number of feature uses per calendar month for a given subscription tier
- **Payment_Receipt_Image**: User-uploaded image file in JPEG or PNG format representing payment proof

---

## Requirements

### Requirement 1: Supabase Authentication Integration

**User Story:** As a platform user, I want to authenticate using real credentials stored in Supabase, so that my session persists securely across browser sessions and my data is protected.

#### Acceptance Criteria

1. THE **Auth_Provider** SHALL replace all mock user arrays and localStorage-based authentication logic with Supabase `signInWithPassword`, `signUp`, and `signOut` methods
2. WHEN a user submits valid email and password credentials, THE **Auth_Provider** SHALL establish a Supabase session within 3000 milliseconds and load user data from the Supabase `users` table
3. WHEN a user submits valid registration data (name, email, password), THE **Auth_Provider** SHALL create an account via Supabase `auth.signUp()` and insert a corresponding record in the Supabase `users` table within 5000 milliseconds
4. WHEN a user initiates logout, THE **Auth_Provider** SHALL terminate the Supabase session and clear local authentication state within 1000 milliseconds
5. WHEN the application loads, THE **Auth_Provider** SHALL check for an active session via `supabase.auth.getSession()` and restore user data if a valid **Session_Token** exists
6. WHEN a Supabase session expires, THE **Auth_Provider** SHALL detect the change via `onAuthStateChange` listener and update authentication state to unauthenticated within 500 milliseconds
7. IF authentication fails due to invalid credentials, THEN THE **Auth_Provider** SHALL return an error message in Uzbek language containing the specific failure reason (invalid email, wrong password, network error)
8. THE **Platform** SHALL remove the mock `useAuth` hook from `src/services/auth.ts` and ensure all components import `useAuth` exclusively from `src/app/providers.tsx`
9. THE **Platform** SHALL delete the following redundant authentication files: `src/components/auth/CompleteAuthSystem.tsx`, `EnhancedAuthSystem.tsx`, `PerfectAuthSystem.tsx`, `WorkingAuthSystem.tsx`, `src/lib/supabase-mock.ts`, `src/lib/simple-auth.ts`, `src/lib/test-auth.ts`, `src/services/auth-real.ts`

---

### Requirement 2: Route Protection Middleware

**User Story:** As a platform administrator, I want protected routes accessible only to authenticated users, so that unauthorized access is prevented.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access a protected route, THE **Route_Guard** SHALL redirect to `/signin` within 200 milliseconds
2. THE **Route_Guard** SHALL protect the following routes: `/dashboard`, `/irac`, `/ai-chat`, `/profile`, `/settings`, `/billing`, `/manual-payment`, `/court-simulator`, `/virtual-court`, `/decision-tree`, `/scenario-generator`, `/weakness-detector`, `/document-generator`, `/legal-database`, `/community`, `/achievements`, `/statistics`, `/my-courses`, `/admin`
3. WHEN an authenticated user navigates to `/signin` or `/signup`, THE **Route_Guard** SHALL redirect to `/dashboard` within 200 milliseconds
4. THE **Route_Guard** SHALL validate the Supabase **Session_Token** from the `Authorization` header or cookie
5. WHEN a user without `ADMIN` role attempts to access `/admin` route, THE **Route_Guard** SHALL return HTTP 403 status and redirect to `/dashboard`
6. WHEN a request targets `/api/*` routes and is not a CORS preflight request, THE **Route_Guard** SHALL add CORS headers but delegate authentication to individual API route handlers

---

### Requirement 3: Groq AI Service Integration

**User Story:** As a student, I want all AI features (IRAC analysis, document generator, weakness detector, scenario generator, court simulator, AI chat) to return real AI-generated responses, so that I can improve my legal knowledge with accurate assistance.

#### Acceptance Criteria

1. THE **Platform** SHALL use the `googleAIService` singleton from `src/lib/google-ai.ts` for all AI feature requests
2. WHEN a user requests IRAC analysis with case text input, THE **Groq_AI_Service** SHALL return a structured response in Uzbek containing Issue, Rule, Application, and Conclusion sections within 15000 milliseconds
3. WHEN a user requests document generation with document type and parameters, THE **Groq_AI_Service** SHALL generate a legal document draft compliant with Uzbekistan legislation in Uzbek language within 20000 milliseconds
4. WHEN a user requests argument weakness detection with legal argument text, THE **Groq_AI_Service** SHALL identify logical weaknesses and return improvement recommendations in Uzbek language within 10000 milliseconds
5. WHEN a user requests a legal scenario with topic and difficulty parameters, THE **Groq_AI_Service** SHALL generate a practical legal scenario based on Uzbekistan legislation in Uzbek language within 12000 milliseconds
6. WHEN a user sends a message in AI Chat, THE **AI_Chat_Service** SHALL invoke `googleAIService.generateLegalResponse()` with `legal-consultation` request type and return legal advice in Uzbek language within 8000 milliseconds
7. WHEN a user sends a message in AI Chat, THE **AI_Chat_Service** SHALL persist the conversation history to Supabase `ai_chat_messages` table with fields: `user_id`, `message_text`, `role` (user/assistant), `created_at`
8. WHEN a user opens AI Chat, THE **AI_Chat_Service** SHALL load the user's previous conversation history from Supabase `ai_chat_messages` table ordered by `created_at` ascending
9. IF a Groq API request fails with network error or timeout, THEN THE **Platform** SHALL display an error message in Uzbek language specifying the failure type (network, timeout, API limit exceeded)
10. THE **Platform** SHALL replace hardcoded mock responses in `src/app/ai-chat/page.tsx` with Groq API calls via `googleAIService`

---

### Requirement 4: Real User Data from Supabase

**User Story:** As a user, I want to see my real data on dashboard, profile, achievements, and statistics pages, so that my learning progress is accurately tracked and displayed.

#### Acceptance Criteria

1. WHEN a user opens the dashboard page, THE **Platform** SHALL load and display the user's **Experience_Points**, level, and completed tasks count from Supabase `users` and `user_analytics` tables within 2000 milliseconds
2. WHEN a user opens the profile page, THE **Platform** SHALL load and display real profile data (name, email, avatar_url, level, experience_points, subscription_plan) from Supabase `users` table within 1500 milliseconds
3. WHEN a user edits profile data and saves changes, THE **Platform** SHALL update the Supabase `users` table record and return success confirmation within 3000 milliseconds
4. WHEN a user completes an AI feature usage, THE **Platform** SHALL insert a **Usage_Record** in Supabase `usage_tracking` table with fields: `user_id`, `feature` (enum: irac, chat, document, scenario, court), `quantity` (integer >= 1), `created_at` (timestamp)
5. WHEN a user opens the statistics page, THE **Platform** SHALL load usage statistics from Supabase `usage_tracking` and `user_analytics` tables grouped by feature and time period (daily, weekly, monthly) within 2500 milliseconds
6. WHEN a user achieves a milestone (completes first IRAC analysis, reaches level 5, uses chat 10 times), THE **Platform** SHALL insert or update a record in Supabase `achievements` table with fields: `user_id`, `achievement_type`, `achieved_at`, `metadata` (JSON)
7. THE **Platform** SHALL replace all **Mock_Implementation** data on dashboard, profile, achievements, and statistics pages with real data fetched from Supabase tables

---

### Requirement 5: AI-Assisted Manual Payment Verification

**User Story:** As a user, I want to upload payment receipt images and receive fast AI-assisted verification, so that subscription activation is streamlined.

#### Acceptance Criteria

1. WHEN a user uploads a **Payment_Receipt_Image** (JPEG or PNG, max 5MB), THE **Platform** SHALL store the image in Supabase Storage `payment-checks` bucket and record the file URL in Supabase `payments` table within 5000 milliseconds
2. WHEN a payment receipt image is uploaded, THE **Groq_AI_Service** SHALL analyze the image and validate: payment amount matches subscription price (within 5% tolerance), image is readable (confidence score >= 0.7), no fraud indicators detected
3. WHEN Groq AI analysis completes, THE **Platform** SHALL store the analysis result in Supabase `payments` table with fields: `ai_recommendation` (enum: approved, rejected, needs_review), `ai_confidence` (float 0.0-1.0), `ai_analysis_text` (string), `analyzed_at` (timestamp)
4. WHEN an admin opens the payment review panel, THE **Payment_Review_Panel** SHALL display all pending payments with AI recommendation, confidence score, and analysis text, sorted by `created_at` descending
5. WHEN an admin approves a payment, THE **Platform** SHALL update the user's `subscription_plan` field in Supabase `users` table to the purchased tier (`pro` or `premium`) and set `subscription_expires_at` to 30 days from approval date
6. WHEN an admin approves or rejects a payment, THE **Platform** SHALL update the Supabase `payments` record with fields: `status` (enum: approved, rejected), `reviewed_at` (timestamp), `reviewed_by` (admin user_id), `admin_notes` (string)
7. IF the AI cannot analyze the payment receipt (corrupted image, unsupported format, API error), THEN THE **Platform** SHALL set `ai_recommendation` to `needs_review` and `ai_analysis_text` to the specific error reason in Uzbek language

---

### Requirement 6: Subscription-Based Feature Access Control

**User Story:** As a platform administrator, I want subscription tier limits enforced server-side, so that users cannot access unauthorized features or exceed usage limits.

#### Acceptance Criteria

1. WHILE a user's `subscription_plan` field equals `free`, THE **Platform** SHALL enforce a **Monthly_Usage_Limit** of 5 IRAC analyses and 10 AI Chat messages per calendar month
2. WHILE a user's `subscription_plan` field equals `pro`, THE **Platform** SHALL allow unlimited IRAC analyses and AI Chat messages and grant access to Document Generator and Court Simulator features
3. WHILE a user's `subscription_plan` field equals `premium`, THE **Platform** SHALL allow unlimited access to all features without usage restrictions
4. WHEN a `free` tier user reaches their **Monthly_Usage_Limit** for a feature, THE **Platform** SHALL return HTTP 403 status from the API endpoint and display an upgrade prompt in Uzbek language directing to `/billing`
5. THE **Platform** SHALL enforce subscription tier checks in API routes (`/api/ai/*`, `/api/ai-chat/*`) by querying current month's usage count from Supabase `usage_tracking` table and comparing against tier limits
6. WHEN a `free` tier user attempts to access Document Generator, Court Simulator, or Virtual Court pages, THE **Platform** SHALL display a feature-locked overlay with upgrade prompt in Uzbek language instead of the feature interface

---

### Requirement 7: Virtual Court with AI Opponent

**User Story:** As a law student, I want to practice virtual court proceedings with an AI opponent and AI judge, so that I can improve my real courtroom readiness.

#### Acceptance Criteria

1. WHEN a user starts a Virtual Court session with case parameters (case type, user role, difficulty), THE **Groq_AI_Service** SHALL establish court context with roles (judge, plaintiff, defense) and case facts within 5000 milliseconds
2. WHEN a user submits an objection, evidence, statement, or question during the session, THE **Groq_AI_Service** SHALL generate AI opponent and AI judge responses based on Uzbekistan legislation and court procedures within 10000 milliseconds
3. WHEN a user submits a legal argument, THE **Groq_AI_Service** SHALL evaluate the argument's legal merit on a 0-100 scale based on legal reasoning quality, evidence support, and procedural correctness, and update the session score
4. WHEN a Virtual Court session ends, THE **Platform** SHALL persist the complete session transcript to Supabase `court_sessions` table with fields: `user_id`, `case_type`, `user_role`, `transcript` (JSON array), `final_score` (integer 0-100), `duration_seconds` (integer), `created_at`
5. THE **Platform** SHALL replace the random scoring logic in `src/app/virtual-court/page.tsx` with AI-evaluated scoring from **Groq_AI_Service**
6. WHEN a user opens the Virtual Court page, THE **Platform** SHALL load and display the user's previous court session history from Supabase `court_sessions` table ordered by `created_at` descending, limited to 10 most recent sessions

---

### Requirement 8: Legal Article Database

**User Story:** As a student, I want to search and read Uzbekistan legislation articles, so that I can improve my legal knowledge from authoritative sources.

#### Acceptance Criteria

1. THE **Legal_Article_Database** SHALL contain at minimum 100 articles from the following sources stored in Supabase `legal_documents` table: Civil Code of Uzbekistan, Criminal Code, Labor Code, Constitution of the Republic of Uzbekistan
2. WHEN a user enters a search query (minimum 3 characters), THE **Legal_Article_Database** SHALL perform full-text search on Supabase `legal_documents` table and return matching articles within 1500 milliseconds
3. WHEN a user selects an article from search results, THE **Legal_Article_Database** SHALL display the complete article with fields: article number, code name, section name, full text, last_updated date
4. WHEN a user enters a natural language query (e.g., "mehnat shartnomasini buzish"), THE **Groq_AI_Service** SHALL analyze the query and extract relevant keywords for searching Supabase `legal_documents` table within 3000 milliseconds
5. THE **Legal_Article_Database** SHALL provide category filters (civil, criminal, labor, constitutional) that limit search results to documents matching the selected `category` field value
6. IF no matching documents are found in `legal_documents` table for a search query, THEN THE **Legal_Article_Database** SHALL display a "No results found" message in Uzbek language with suggestions to try different keywords

---

### Requirement 9: Codebase Cleanup

**User Story:** As a developer, I want only actively used files in the project codebase, so that code maintenance is simplified and confusion is reduced.

#### Acceptance Criteria

1. THE **Platform** SHALL delete the following redundant authentication files: `src/components/auth/CompleteAuthSystem.tsx`, `src/components/auth/EnhancedAuthSystem.tsx`, `src/components/auth/PerfectAuthSystem.tsx`, `src/components/auth/WorkingAuthSystem.tsx`, `src/components/auth/AuthProvider.tsx`, `src/lib/supabase-mock.ts`, `src/lib/simple-auth.ts`, `src/lib/test-auth.ts`, `src/lib/auth.ts`, `src/lib/supabase-client.ts`, `src/services/auth-real.ts`, `src/services/api_fixed.ts`
2. THE **Platform** SHALL delete the following redundant page files: `src/app/ai-chat/page-old.tsx`, `src/app/ai-chat/page-real.tsx`
3. THE **Platform** SHALL delete the following backup configuration files: `next.config_backup.js`, `middleware_backup.ts`
4. THE **Platform** SHALL delete the following test and debug page directories: `src/app/debug-auth/`, `src/app/test-auth/`, `src/app/test-i18n/`, `src/app/test-quiz/`, `src/app/missing-features/`, `src/app/setup-supabase/`
5. THE **Platform** SHALL delete the unused `backend/` directory (Python FastAPI) since all AI functions are implemented via Next.js API routes
6. WHEN cleanup is executed, THE **Platform** SHALL verify that none of the deleted files are referenced in active import statements or runtime code by running a codebase-wide search for each deleted file path

---

### Requirement 10: API Route Integrity and Robustness

**User Story:** As a platform user, I want all AI API requests to work reliably and failed requests to not crash the system, so that I have a stable user experience.

#### Acceptance Criteria

1. THE **Platform** SHALL implement the following AI API routes with complete handlers: `/api/ai/irac`, `/api/ai/document-generator`, `/api/ai/weakness-detector`, `/api/ai/scenario-generator`, `/api/ai/court-simulator`, `/api/ai-chat`
2. WHEN any AI API route receives a request, THE **Platform** SHALL validate the Supabase **Session_Token** from the Authorization header and return HTTP 401 with Uzbek error message for unauthenticated requests
3. WHEN any AI API route receives an authenticated request, THE **Platform** SHALL verify the user's **Subscription_Tier** and **Monthly_Usage_Limit** and return HTTP 403 with upgrade prompt for exceeded limits
4. IF the **Groq_AI_Service** fails to respond or times out (>30000 milliseconds), THEN THE **Platform** SHALL return HTTP 503 status with an Uzbek error message specifying "AI service temporarily unavailable"
5. WHEN an AI API route successfully returns a response, THE **Platform** SHALL record the usage in Supabase `usage_tracking` table within 1000 milliseconds of response transmission
6. THE **Platform** SHALL use the `googleAIService` singleton from `src/lib/google-ai.ts` in all AI API routes and SHALL NOT instantiate separate Groq clients per route


---

## Goals

### Primary Goals

1. **Real Authentication**: To'liq Supabase Auth integratsiyasi — hech qanday mock yoki `localStorage` autentifikatsiyasi qolmasligi.
2. **Live AI Integration**: Barcha AI funksiyalar (IRAC, Chat, Hujjat, Sud Simulyatori, Zaiflik Detektori, Stsenariy Generatori) Groq `llama-3.3-70b-versatile` orqali real vaqtda ishlashi.
3. **Real Database**: Barcha sahifalarda Supabase'dan kelgan haqiqiy ma'lumotlar ko'rsatilishi — dashboard, profil, statistika, yutuqlar, to'lovlar.
4. **Manual Payment System**: AI yordamida to'lov cheki tekshiruvi va admin paneli orqali to'lovni tasdiqlash tizimi.
5. **Subscription Enforcement**: Server tomonida obuna rejasi cheklashlarini qo'llash — `free`, `pro`, `premium` rejalari turlicha limitlarga ega.
6. **Virtual Court**: Real AI raqib va AI sudya bilan interaktiv sud simulyatori.
7. **Legal Database**: O'zbekiston qonunchiligi asosida qidiriluvchi huquqiy ma'lumotlar bazasi.
8. **Code Cleanup**: Barcha mock, takroriy va ishlatilmagan fayllarni o'chirish.

### Secondary Goals

1. **Performance**: Barcha API routelar 3 soniya ichida javob berishi.
2. **User Experience**: Barcha xato holatlarida O'zbek tilida aniq, foydali xabarlar ko'rsatilishi.
3. **Security**: Barcha himoyalangan route'lar va API endpointlar to'g'ri autentifikatsiya va avtorizatsiya bilan himoyalangan.
4. **Scalability**: Ma'lumotlar bazasi strukturasi va API route'lar minglab foydalanuvchilarni qo'llab-quvvatlashga tayyor.

---

## Success Metrics

1. **Authentication Success Rate**: 99% foydalanuvchilar tizimga kirish va chiqishni muvaffaqiyatli bajarishi.
2. **AI Response Time**: Barcha AI so'rovlarga o'rtacha 5 soniya ichida javob qaytarilishi.
3. **Zero Mock Data**: Kod bazasida hech qanday mock ma'lumotlar yoki stub funksiyalar qolmasligi.
4. **Payment Processing**: AI + Admin to'lov tasdigi 24 soat ichida yakunlanishi.
5. **Subscription Enforcement**: `free` reja foydalanuvchilari premium xususiyatlarga kirishga harakat qilganda 100% bloklanishi.
6. **Code Quality**: Takroriy fayllar 0 taga tushirilishi, barcha API route'lar error handling bilan himoyalangan.
7. **User Engagement**: Virtual Sud va AI Chat funksiyalari foydalanuvchilar tomonidan hech qanday xato xabarsiz ishlatilishi.

---

## Risks and Mitigations

### Risk 1: Groq API Limiti yoki Ishlamay Qolishi
**Probability:** Medium  
**Impact:** High  
**Mitigation:**
- Groq API rate limitlarini monitoring qilish
- Fallback strategiyasi: agar Groq ishlamasa, foydalanuvchiga "Hozirda xizmat mavjud emas, keyinroq urinib ko'ring" xabari ko'rsatish
- Queueing tizimi: agar limit oshsa, so'rovlarni navbatga qo'yish

### Risk 2: Supabase Database Migration Xatolari
**Probability:** Low  
**Impact:** High  
**Mitigation:**
- Migration'larni test muhitida sinab ko'rish
- Ma'lumotlar bazasini migration'dan oldin backup qilish
- Migration'lar uchun rollback plani tayyorlash

### Risk 3: AI To'lov Tekshiruvi Noto'g'ri Ishlashi
**Probability:** Medium  
**Impact:** Medium  
**Mitigation:**
- Barcha to'lovlar admin tomonidan ham ko'rib chiqilishi
- AI faqat tavsiya beradi, yakuniy qaror admin qo'lida
- Shubhali to'lovlar avtomatik `needs_review` holatiga o'tkazilishi

### Risk 4: Keraksiz Fayllarni O'chirish Vaqtida Import'lar Sinishi
**Probability:** Medium  
**Impact:** Medium  
**Mitigation:**
- Fayllarni o'chirishdan oldin barcha import referanslarini qidirish
- TypeScript va ESLint orqali build qilish va xatolarni tekshirish
- Git branch'da ishlash, asosiy branch'ga merge qilishdan oldin to'liq test qilish

### Risk 5: Middleware Performance Overhead
**Probability:** Low  
**Impact:** Low  
**Mitigation:**
- Middleware faqat zarur route'larni tekshiradi
- Supabase sessiya tekshiruvi cache qilinadi
- Performance monitoring o'rnatiladi

---

## Dependencies

1. **Supabase Account**: Ma'lumotlar bazasi, autentifikatsiya va storage uchun faol Supabase loyihasi kerak.
2. **Groq API Key**: `llama-3.3-70b-versatile` modeliga kirish uchun Groq API kalit kerak.
3. **Next.js 16.2.4**: Mavjud loyiha Next.js 16.2.4 versiyasida, App Router bilan ishlaydi.
4. **Prisma Schema**: Mavjud Prisma schema Supabase bilan sinxronlashgan bo'lishi kerak.
5. **O'zbekiston Qonunchilik Matnlari**: Huquqiy ma'lumotlar bazasi uchun kamida 4 ta asosiy kodeksning matni kerak.

---

## Out of Scope (Kelajakda Qo'shiladi)

1. **Advokat Profillari**: Foydalanuvchilar huquqiy maslahatchi va advokatlarni topish funksiyasi — kelajakda qo'shiladi.
2. **Payme/Click Integratsiyasi**: Avtomatik to'lov gateway'lari — hozirda manual to'lov yetarli.
3. **Mobile App**: Hozircha faqat web platforma.
4. **Real-time Notifications**: Push bildirishnomalar — keyinchalik qo'shiladi.
5. **Multi-language Support**: Hozircha faqat O'zbek tili, rus va ingliz tillari kelajakda qo'shiladi.
6. **Video Call Integration**: Advokat bilan video maslahat funksiyasi — kelajakda.
7. **AI Voice Assistant**: Ovozli interfeys — kelajakda.

---

## Timeline Estimation

| Bosqich | Vaqt | Tavsif |
|---------|------|--------|
| **1. Auth va Middleware** | 2-3 kun | Supabase Auth, Middleware, Route Protection |
| **2. AI Integratsiya** | 3-4 kun | Barcha AI funksiyalar Groq bilan bog'lash |
| **3. Database CRUD** | 2-3 kun | Dashboard, profil, statistika, yutuqlar |
| **4. To'lov Tizimi** | 2-3 kun | AI to'lov tekshiruvi + Admin panel |
| **5. Obuna Cheklashlari** | 1-2 kun | Server-side subscription gating |
| **6. Virtual Sud** | 2-3 kun | Real AI raqib va AI sudya |
| **7. Legal Database** | 2-3 kun | O'zbekiston qonunchiligi qidirish tizimi |
| **8. Code Cleanup** | 1-2 kun | Takroriy fayllarni o'chirish va refactoring |
| **9. Testing va Debugging** | 2-3 kun | End-to-end testlar, xatolarni tuzatish |
| **JAMI** | **17-26 kun** | To'liq production-ready platforma |

---

## Approval and Sign-off

Bu talablar hujjati JurisAI platformasini 0-dan 100% ishlaydigan holatga olib kelish uchun zarur bo'lgan barcha talablarni o'z ichiga oladi. Hujjat tasdiqlangach, design va tasks bosqichlariga o'tish mumkin.

**Status:** ✅ Ready for Design Phase  
**Next Step:** Design Document yaratish — arxitektura, komponent strukturasi, API contract'lar, ma'lumotlar oqimi va UI/UX mockup'lar.

