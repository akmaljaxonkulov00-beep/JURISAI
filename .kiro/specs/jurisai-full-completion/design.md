# Design Document — JurisAI To'liq Implementatsiya

**Feature:** jurisai-full-completion  
**Version:** 1.0  
**Last Updated:** 2026-06-13

---

## Overview

Bu design document JurisAI platformasini 0-dan 100% ishlaydigan holatga olib kelish uchun yaratilgan. Hujjat system arxitekturasi, komponentlar strukturasi, ma'lumotlar modellari, API contract'lar va error handling strategiyalarini o'z ichiga oladi.

## Architecture

### System Arxitekturasi

### High-Level Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                            │
│  Next.js 16.2.4 + React 19 + TypeScript + TailwindCSS        │
└───────────────────────────┬───────────────────────────────────┘
                            │
                    HTTPS / REST API
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                   NEXT.JS API ROUTES                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ /api/auth/*  │  │  /api/ai/*   │  │/api/payment/*│        │
│  │ - signin     │  │ - irac       │  │ - upload     │        │
│  │ - signup     │  │ - chat       │  │ - verify     │        │
│  │ - signout    │  │ - document   │  │ - approve    │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
└─────────┼──────────────────┼──────────────────┼───────────────┘
          │                  │                  │
     ┌────▼────┐      ┌──────▼──────┐    ┌──────▼──────┐
     │Supabase │      │  Groq AI    │    │  Supabase   │
     │  Auth   │      │ llama-3.3   │    │  Storage    │
     └────┬────┘      └─────────────┘    └─────────────┘
          │
┌─────────▼────────────────────────────────────────────────────┐
│                    SUPABASE POSTGRESQL                        │
│  - users                    - achievements                    │
│  - usage_tracking           - court_sessions                  │
│  - payments                 - legal_documents                 │
│  - ai_chat_messages         - user_analytics                  │
└───────────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### Component Structure

### 1. Authentication Layer

#### AuthContext Provider (`src/app/providers.tsx`)

```typescript
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Implementation details:
// - Supabase `signInWithPassword`
// - Supabase `signUp` + insert to users table
// - `onAuthStateChange` listener
// - Session persistence with cookies
// - Automatic session refresh
```

#### Middleware (`middleware.ts`)

```typescript
// Protected routes
const protectedRoutes = [
  '/dashboard',
  '/irac',
  '/ai-chat',
  '/profile',
  '/settings',
  '/billing',
  '/manual-payment',
  '/court-simulator',
  '/virtual-court',
  '/decision-tree',
  '/scenario-generator',
  '/weakness-detector',
  '/document-generator',
  '/legal-database',
  '/community',
  '/achievements',
  '/statistics',
  '/my-courses'
];

const adminRoutes = ['/admin'];

// Logic:
// 1. Check Supabase session from cookie or Authorization header
// 2. If no session and route is protected → redirect to /signin
// 3. If session exists and route is /signin or /signup → redirect to /dashboard
// 4. If route is /admin and user role is not ADMIN → redirect to /dashboard
// 5. Add CORS headers for API routes
```

---

### 2. AI Integration Layer

#### AI Service Singleton (`src/lib/google-ai.ts`)

```typescript
class GoogleAIService {
  private groqClient: Groq;
  
  // Core method
  async generateLegalResponse(
    prompt: string,
    requestType: 'irac' | 'legal-consultation' | 'document' | 'weakness' | 'scenario' | 'court',
    conversationHistory?: Message[]
  ): Promise<string>
  
  // Specialized methods
  async analyzeIRAC(caseText: string): Promise<IracAnalysis>
  async generateDocument(docType: string, params: any): Promise<string>
  async detectWeaknesses(argument: string): Promise<Weakness[]>
  async generateScenario(topic: string): Promise<Scenario>
  async simulateCourt(context: CourtContext, userInput: string): Promise<CourtResponse>
  async verifyPaymentReceipt(imageUrl: string, subscriptionPlan: string): Promise<PaymentVerification>
}

// Payment verification prompt template:
const PAYMENT_VERIFICATION_PROMPT = `
O'zbekiston to'lov chekini tahlil qiling:
- To'lov summasi: {expectedAmount} so'm
- Obuna turi: {subscriptionPlan}
- Quyidagi tasvirni tekshiring va quyidagi formatda javob bering:

{
  "status": "approved" | "rejected" | "needs_review",
  "reason": "Sababi O'zbek tilida",
  "confidence": 0-100,
  "detected_amount": "Aniqlangan summa",
  "issues": ["Muammolar ro'yxati agar mavjud bo'lsa"]
}
`;
```

#### API Routes

**`/api/ai/irac/route.ts`**
```typescript
POST /api/ai/irac
Body: { caseText: string }
Auth: Required
Limits: Free=5/month, Pro/Premium=unlimited
Response: { analysis: IracAnalysis, usage: number }
```

**`/api/ai/chat/route.ts`**
```typescript
POST /api/ai/chat
Body: { message: string, conversationId?: string }
Auth: Required
Limits: Free=10 messages/month, Pro/Premium=unlimited
Response: { reply: string, conversationId: string }
// Saves to ai_chat_messages table
```

**`/api/ai/document-generator/route.ts`**
```typescript
POST /api/ai/document-generator
Body: { docType: string, params: object }
Auth: Required
Limits: Pro/Premium only
Response: { document: string }
```

**`/api/ai/weakness-detector/route.ts`**
```typescript
POST /api/ai/weakness-detector
Body: { argument: string }
Auth: Required
Limits: Pro/Premium only
Response: { weaknesses: Weakness[] }
```

**`/api/ai/scenario-generator/route.ts`**
```typescript
POST /api/ai/scenario-generator
Body: { topic: string, difficulty: string }
Auth: Required
Limits: Pro/Premium only
Response: { scenario: Scenario }
```

**`/api/ai/court-simulator/route.ts`**
```typescript
POST /api/ai/court-simulator
Body: { sessionId: string, userInput: string, context: CourtContext }
Auth: Required
Limits: Pro/Premium only
Response: { aiResponse: string, score: number, feedback: string }
// Saves to court_sessions table
```

---

## Data Models

### Database Schema & Operations

#### Users Table Operations

```typescript
// Dashboard data fetch
async function getDashboardData(userId: string) {
  const user = await supabase
    .from('users')
    .select('xp, level, subscription_plan, email, full_name')
    .eq('id', userId)
    .single();
    
  const analytics = await supabase
    .from('user_analytics')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  const recentUsage = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
    
  return { user, analytics, recentUsage };
}
```

#### Usage Tracking

```typescript
async function trackUsage(userId: string, feature: string, quantity: number = 1) {
  await supabase
    .from('usage_tracking')
    .insert({
      user_id: userId,
      feature: feature,
      quantity: quantity,
      created_at: new Date().toISOString()
    });
}

// Called after every AI API request
```

#### Subscription Limits Check

```typescript
async function checkSubscriptionLimit(
  userId: string, 
  feature: string
): Promise<{ allowed: boolean; remaining: number }> {
  const user = await supabase
    .from('users')
    .select('subscription_plan')
    .eq('id', userId)
    .single();
    
  if (user.subscription_plan === 'premium') {
    return { allowed: true, remaining: -1 }; // unlimited
  }
  
  if (user.subscription_plan === 'pro') {
    // Pro limits: IRAC + Chat unlimited, other features unlimited
    return { allowed: true, remaining: -1 };
  }
  
  // Free plan
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const usage = await supabase
    .from('usage_tracking')
    .select('quantity')
    .eq('user_id', userId)
    .eq('feature', feature)
    .gte('created_at', startOfMonth.toISOString());
    
  const totalUsed = usage.data?.reduce((sum, u) => sum + u.quantity, 0) || 0;
  
  const limits = {
    'irac': 5,
    'ai-chat': 10,
    // other features blocked for free
  };
  
  const limit = limits[feature] || 0;
  const allowed = totalUsed < limit;
  const remaining = Math.max(0, limit - totalUsed);
  
  return { allowed, remaining };
}
```

---

### 4. Payment System Design

#### Upload Flow

```typescript
// Client: /manual-payment
1. User selects subscription plan (pro/premium)
2. User uploads payment receipt image
3. POST /api/payment/upload { image: File, plan: string }
4. Server uploads to Supabase Storage 'payment-checks' bucket
5. Server creates payment record in 'payments' table with status='pending'
6. Server triggers AI verification
```

#### AI Verification

```typescript
// /api/payment/verify
POST /api/payment/verify
Body: { paymentId: string }
Auth: Required (Admin or System)

async function verifyPayment(paymentId: string) {
  const payment = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();
    
  const imageUrl = payment.receipt_image_url;
  const plan = payment.subscription_plan;
  
  const aiResult = await googleAIService.verifyPaymentReceipt(imageUrl, plan);
  
  await supabase
    .from('payments')
    .update({
      ai_verification_status: aiResult.status,
      ai_verification_reason: aiResult.reason,
      ai_confidence: aiResult.confidence,
      detected_amount: aiResult.detected_amount
    })
    .eq('id', paymentId);
    
  return aiResult;
}
```

#### Admin Panel

```typescript
// /admin/payments
async function getPaymentsForReview() {
  return await supabase
    .from('payments')
    .select(`
      *,
      users (full_name, email)
    `)
    .in('status', ['pending', 'needs_review'])
    .order('created_at', { ascending: false });
}

async function approvePayment(paymentId: string, adminId: string, notes: string) {
  const payment = await supabase
    .from('payments')
    .select('user_id, subscription_plan')
    .eq('id', paymentId)
    .single();
    
  // Update payment status
  await supabase
    .from('payments')
    .update({
      status: 'approved',
      admin_notes: notes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId
    })
    .eq('id', paymentId);
    
  // Update user subscription
  await supabase
    .from('users')
    .update({
      subscription_plan: payment.subscription_plan,
      subscription_start_date: new Date().toISOString()
    })
    .eq('id', payment.user_id);
}
```

---

### 5. Virtual Court Design

#### Court Session Structure

```typescript
interface CourtSession {
  id: string;
  user_id: string;
  case_type: string; // 'civil' | 'criminal'
  user_role: 'plaintiff' | 'defendant';
  case_facts: string;
  transcript: CourtMessage[];
  user_score: number;
  opponent_score: number;
  status: 'active' | 'completed';
  created_at: string;
  completed_at?: string;
}

interface CourtMessage {
  role: 'user' | 'opponent' | 'judge';
  message: string;
  action_type: 'argument' | 'objection' | 'evidence' | 'question' | 'ruling';
  timestamp: string;
}
```

#### Court Simulator Logic

```typescript
// /virtual-court/page.tsx
async function handleUserAction(action: CourtMessage) {
  // 1. Save user message to session
  const updatedTranscript = [...session.transcript, action];
  
  // 2. Call AI for opponent response
  const aiResponse = await fetch('/api/ai/court-simulator', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: session.id,
      userInput: action.message,
      context: {
        case_facts: session.case_facts,
        user_role: session.user_role,
        transcript: updatedTranscript
      }
    })
  });
  
  const { aiResponse: opponentMessage, score, feedback } = await aiResponse.json();
  
  // 3. Update session with AI response
  updatedTranscript.push({
    role: 'opponent',
    message: opponentMessage,
    action_type: 'argument',
    timestamp: new Date().toISOString()
  });
  
  // 4. Update scores
  await supabase
    .from('court_sessions')
    .update({
      transcript: updatedTranscript,
      user_score: session.user_score + score
    })
    .eq('id', session.id);
}
```

---

### 6. Legal Database Design

#### Database Seeding

```typescript
// scripts/seed-legal-docs.ts
const legalDocuments = [
  {
    code_name: 'O\'zbekiston Fuqarolik Kodeksi',
    article_number: '1',
    article_title: 'Fuqarolik qonunchiligining amal qilish sohasi',
    content: '...',
    category: 'civil',
    effective_date: '1997-01-01'
  },
  // ... 100+ articles from major codes
];

await supabase.from('legal_documents').insert(legalDocuments);
```

#### Search Implementation

```typescript
// /legal-database/page.tsx
async function searchLegalDocs(query: string, category?: string) {
  let dbQuery = supabase
    .from('legal_documents')
    .select('*')
    .textSearch('content', query, {
      type: 'websearch',
      config: 'simple'
    });
    
  if (category) {
    dbQuery = dbQuery.eq('category', category);
  }
  
  const results = await dbQuery.limit(20);
  return results;
}

// AI-powered semantic search
async function semanticSearch(naturalQuery: string) {
  // 1. Ask AI to extract keywords
  const keywords = await googleAIService.generateLegalResponse(
    `Quyidagi so'rovdan huquqiy qidiruv uchun kalit so'zlar ajratib ber: "${naturalQuery}"`,
    'legal-consultation'
  );
  
  // 2. Search with extracted keywords
  return await searchLegalDocs(keywords);
}
```

---

## Data Flow Diagrams

### Authentication Flow

```
User → Login Form → POST /api/auth/signin
                         ↓
              Supabase.auth.signInWithPassword
                         ↓
                 Success? → Set Cookie
                         ↓
              Fetch user from 'users' table
                         ↓
               Update AuthContext state
                         ↓
              Redirect to /dashboard
```

### AI Chat Flow

```
User types message → AI Chat Component
                         ↓
              POST /api/ai/chat {message, conversationId}
                         ↓
            Check auth + subscription limits
                         ↓
        Save message to ai_chat_messages table
                         ↓
      googleAIService.generateLegalResponse(...)
                         ↓
        Save AI reply to ai_chat_messages table
                         ↓
           Track usage in usage_tracking
                         ↓
              Return reply to client
                         ↓
          Update UI with AI response
```

### Payment Approval Flow

```
User uploads receipt → POST /api/payment/upload
                              ↓
                  Upload to Supabase Storage
                              ↓
           Create record in 'payments' table
                              ↓
              Trigger AI verification
                              ↓
      AI analyzes image → returns status + confidence
                              ↓
          Update payment with AI result
                              ↓
        Admin opens /admin/payments panel
                              ↓
       Reviews AI recommendation + image
                              ↓
      Approves or Rejects payment
                              ↓
    If approved → Update user.subscription_plan
                              ↓
         Send confirmation (future: email)
```

---

## File Cleanup Strategy

### Files to Delete

```
src/components/auth/
  ├─ CompleteAuthSystem.tsx          ❌ DELETE
  ├─ EnhancedAuthSystem.tsx          ❌ DELETE
  ├─ PerfectAuthSystem.tsx           ❌ DELETE
  ├─ WorkingAuthSystem.tsx           ❌ DELETE
  └─ AuthProvider.tsx                ❌ DELETE

src/lib/
  ├─ supabase-mock.ts                ❌ DELETE
  ├─ simple-auth.ts                  ❌ DELETE
  ├─ test-auth.ts                    ❌ DELETE
  ├─ auth.ts                         ❌ DELETE
  └─ supabase-client.ts              ❌ DELETE

src/services/
  ├─ auth-real.ts                    ❌ DELETE
  └─ api_fixed.ts                    ❌ DELETE

src/app/
  ├─ ai-chat/page-old.tsx            ❌ DELETE
  ├─ ai-chat/page-real.tsx           ❌ DELETE
  ├─ debug-auth/                     ❌ DELETE (entire folder)
  ├─ test-auth/                      ❌ DELETE (entire folder)
  ├─ test-i18n/                      ❌ DELETE (entire folder)
  ├─ test-quiz/                      ❌ DELETE (entire folder)
  ├─ missing-features/               ❌ DELETE (entire folder)
  └─ setup-supabase/                 ❌ DELETE (entire folder)

Root files:
  ├─ next.config_backup.js           ❌ DELETE
  ├─ middleware_backup.ts            ❌ DELETE
  └─ backend/                        ❌ DELETE (entire Python FastAPI folder)
```

### Files to Keep & Update

```
src/app/providers.tsx                ✅ UPDATE (real Supabase Auth)
src/lib/google-ai.ts                 ✅ KEEP (already good)
src/lib/supabase.ts                  ✅ KEEP (Supabase client)
middleware.ts                        ✅ UPDATE (add route protection)
```

---

## API Contract Summary

| Endpoint | Method | Auth | Body | Response | Limits |
|----------|--------|------|------|----------|--------|
| `/api/auth/signin` | POST | No | `{email, password}` | `{user, session}` | - |
| `/api/auth/signup` | POST | No | `{email, password, fullName}` | `{user}` | - |
| `/api/ai/irac` | POST | Yes | `{caseText}` | `{analysis}` | Free: 5/mo |
| `/api/ai/chat` | POST | Yes | `{message, conversationId?}` | `{reply}` | Free: 10/mo |
| `/api/ai/document-generator` | POST | Yes | `{docType, params}` | `{document}` | Pro+ only |
| `/api/ai/weakness-detector` | POST | Yes | `{argument}` | `{weaknesses[]}` | Pro+ only |
| `/api/ai/scenario-generator` | POST | Yes | `{topic, difficulty}` | `{scenario}` | Pro+ only |
| `/api/ai/court-simulator` | POST | Yes | `{sessionId, userInput, context}` | `{aiResponse, score}` | Pro+ only |
| `/api/payment/upload` | POST | Yes | `{image: File, plan}` | `{paymentId}` | - |
| `/api/payment/verify` | POST | Admin | `{paymentId}` | `{status, reason}` | - |
| `/api/payment/approve` | POST | Admin | `{paymentId, notes}` | `{success}` | - |

---

## UI/UX Considerations

1. **Loading States**: Barcha AI so'rovlarda skeleton loader yoki progress indicator
2. **Error Messages**: O'zbek tilida aniq, foydali xatolar
3. **Subscription Prompts**: Limit oshganda obunani yangilashga havola
4. **Real-time Updates**: AI Chat'da typing indicator
5. **Responsive Design**: Barcha sahifalar mobile-friendly
6. **Accessibility**: ARIA labels, keyboard navigation

---

## Security Measures

1. **Row Level Security (RLS)**: Supabase jadvallarida foydalanuvchi o'z ma'lumotlarini ko'rishi
2. **API Rate Limiting**: Har bir endpoint uchun rate limit (future)
3. **Input Validation**: Barcha API route'larda Zod schema validation
4. **XSS Protection**: React automatic escaping + DOMPurify for user content
5. **CSRF Protection**: Next.js built-in CSRF tokens

---

## Testing Strategy

1. **Unit Tests**: Kritik funksiyalar (auth helpers, AI service methods)
2. **Integration Tests**: API routes bilan ma'lumotlar bazasi operatsiyalari
3. **E2E Tests**: Asosiy user flow'lar (Playwright yoki Cypress)
4. **Manual Testing**: Har bir sahifa va feature qo'lda tekshiriladi

---

## Error Handling

### API Error Responses

Barcha API route'lar standart error response formatidan foydalanadi:

```typescript
interface ErrorResponse {
  error: string;
  message: string;
  code: number;
}

// Example responses:
// 401 Unauthorized
{ error: 'Unauthorized', message: 'Tizimga kirishingiz kerak', code: 401 }

// 403 Forbidden (limit oshganda)
{ error: 'Limit exceeded', message: 'Oylik limitingiz tugadi. Obunani yangilang.', code: 403 }

// 500 Internal Server Error
{ error: 'Server error', message: 'Serverda xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring.', code: 500 }
```

### Error Categories

1. **Auth Errors:** Supabase auth xatolari — foydalanuvchiga O'zbek tilida aniq xabar
2. **AI Errors:** Groq API timeout yoki rate limit — fallback xabari bilan
3. **Database Errors:** Supabase connection yoki query xatolari — retry mechanism
4. **Validation Errors:** Request body validation failures — Zod error messages

---

## Correctness Properties

### Property 1: Session Consistency
Har bir protected route faqat faol Supabase sessiya bilan ochiladi. Agar sessiya mavjud bo'lmasa yoki muddati tugagan bo'lsa, middleware foydalanuvchini `/signin` sahifasiga yo'naltiradi.

### Property 2: Role-Based Access Control
Admin route'lari (`/admin/*`) faqat `role = 'ADMIN'` bo'lgan foydalanuvchilar tomonidan ochiladi. Boshqa rollar uchun HTTP 403 qaytariladi va `/dashboard` ga yo'naltiriladi.

### Property 3: Subscription Limit Enforcement
Free foydalanuvchilar uchun AI feature'lar oylik limitlar bilan cheklanadi:
- IRAC: 5 ta/oy
- AI Chat: 10 ta xabar/oy
- Boshqa feature'lar bloklangan

Server-side `checkSubscriptionLimit()` funksiyasi har bir AI API so'rovida limit tekshiradi.

### Property 4: Usage Tracking Atomicity
Har bir muvaffaqiyatli AI API so'rov `usage_tracking` jadvalida qayd etiladi. Agar tracking xatolikka uchrasa, butun tranzaktsiya rollback qilinadi.

### Property 5: Payment Status State Machine
To'lov statuslari quyidagi holatlar bilan cheklanadi:
- `pending` → AI verification → `approved` | `rejected` | `needs_review`
- `needs_review` → Admin review → `approved` | `rejected`
- `approved` → foydalanuvchi obunasi faollashadi
- Boshqa transition'lar taqiqlangan

### Property 6: Data Integrity
Barcha Supabase jadvallarida foreign key constraint'lar va NOT NULL constraint'lar mavjud:
- `usage_tracking.user_id` → `users.id` (ON DELETE CASCADE)
- `payments.user_id` → `users.id` (ON DELETE CASCADE)
- `users.email` → UNIQUE, NOT NULL
- `users.subscription_plan` → ENUM check constraint

---

## Authentication Invariants

1. **Session Consistency:** Har bir protected route faqat faol sessiya bilan ochiladi
2. **Role Enforcement:** Admin route'lari faqat ADMIN roliga ega foydalanuvchilar tomonidan ochiladi
3. **Session Refresh:** Sessiya muddati tugashi avtomatik ravishda login sahifasiga yo'naltiradi

### Subscription Invariants

1. **Limit Enforcement:** Free foydalanuvchilar limitdan oshmasligini ta'minlash
2. **Feature Gating:** Pro/Premium-only feature'lar free foydalanuvchilarga ko'rsatilmaydi
3. **Usage Tracking:** Har bir AI so'rov usage_tracking jadvaliga yoziladi

### Payment Invariants

1. **Payment Status Consistency:** To'lov statuslari faqat admin tomonidan yoki AI verification orqali o'zgaradi
2. **Subscription Activation:** Faqat tasdiqlangan to'lovlar obunani faollashtiradi
3. **Audit Trail:** Barcha to'lov o'zgarishlari timestamp va admin ID bilan saqlanadi

### Data Integrity

1. **Foreign Key Constraints:** Barcha Supabase jadvallarida foreign key constraint'lar mavjud
2. **Non-null Critical Fields:** email, full_name, subscription_plan null bo'lmasligi ta'minlanadi
3. **Unique Constraints:** email va phone_number unique bo'lishi kerak

---

## Next Steps

1. ✅ Requirements Document (DONE)
2. ✅ Design Document (DONE)
3. ⏳ Tasks Document — bajarilishi kerak bo'lgan aniq vazifalar ro'yxati
4. ⏳ Implementation — har bir task bo'yicha kod yozish

**Status:** Ready for Tasks Creation
