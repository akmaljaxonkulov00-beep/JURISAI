# 🏛️ JurisAI - O'zbekiston Yuridik AI Platformasi

> AI-powered yuridik ta'lim va amaliyot platformasi O'zbekiston huquq tizimi uchun

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-success)]()
[![AI Powered](https://img.shields.io/badge/AI-Groq%20Llama%203.1-blue)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()

## 📋 MUNDARIJA

1. [Umumiy Ma'lumot](#umumiy-malumot)
2. [Asosiy Xususiyatlar](#asosiy-xususiyatlar)
3. [O'rnatish](#ornatish)
4. [Ishlatish](#ishlatish)
5. [AI Funksiyalar](#ai-funksiyalar)
6. [Test Qilish](#test-qilish)
7. [Deployment](#deployment)

---

## 🎯 UMUMIY MA'LUMOT

JurisAI - bu O'zbekiston huquq tizimi uchun mo'ljallangan AI-powered yuridik ta'lim va amaliyot platformasi. Platforma talabalar, advokatlar va huquq mutaxassislari uchun quyidagi xizmatlarni taqdim etadi:

### Texnologiyalar:

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **AI:** Groq API (llama-3.1-8b-instant)
- **Storage:** localStorage
- **Auth:** Supabase Auth (ixtiyoriy)

---

## ✨ ASOSIY XUSUSIYATLAR

### 🤖 AI Xizmatlari

#### 1. IRAC Case Solver
- Professional IRAC tahlil
- Issue, Rule, Application, Conclusion format
- localStorage history
- O'zbek tilida natija

#### 2. Document Generator  
- 6 ta template (Shartnoma, Ariza, Da'vo, Shikoyat, Bayonnoma, Ishonchnoma)
- AI-powered generation
- Professional format
- Tarix saqlash

#### 3. Weakness Detector
- Argumentlarni tahlil qilish
- Zaif va kuchli tomonlarni aniqlash
- Professional tavsiyalar

#### 4. Scenario Generator
- Yuridik stsenariylar yaratish
- Har xil qiyinlik darajalari
- Real holatlar asosida

#### 5. Court Simulator
- Virtual sud majlislari
- Turli rollar (Da'vogar, Javobgar, Sudya)
- Real-time AI sud javobi
- Statistika va tarix

#### 6. Legal Database
- 5 ta kategoriya (Fuqarolik, Jinoyat, Oila, Mehnat, Ma'muriy)
- AI-powered qidiruv
- Xatcho'plar
- O'zbekiston qonunlari

#### 7. Decision Tree Engine
- AI-powered qaror daraxtlari
- Risk assessment
- Path tracking

#### 8. Notification System
- Real-time bildirishnomalar
- Sozlamalar
- Email/Push support

#### 9. User Profile
- Profil boshqaruvi
- Avatar upload
- Statistika

#### 10. Manual Payment
- To'lov so'rovlari
- Tracking system
- Tarix

---

## 🚀 O'RNATISH

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Git

### 1. Repository ni klonlash

```bash
git clone https://github.com/your-username/jurisai.git
cd jurisai
```

### 2. Dependencies o'rnatish

```bash
npm install
```

### 3. Environment Variables

`.env.local` faylini yarating:

```env
# Groq AI
GROQ_API_KEY=gsk_your_api_key_here
NEXT_PUBLIC_GROQ_API_KEY=gsk_your_api_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Development Server

```bash
npm run dev
```

Brauzerda oching: `http://localhost:3000`

---

## 💻 ISHLATISH

### IRAC Tahlil

1. `/irac` sahifasiga o'ting
2. Ish ma'lumotlarini kiriting (kamida 50 belgi)
3. "Tahlil qilish" tugmasini bosing
4. AI tahlilni ko'ring
5. Natijani saqlang

### Hujjat Yaratish

1. `/document-generator` sahifasiga o'ting
2. Hujjat turini tanlang
3. Ma'lumotlarni kiriting
4. "Hujjat yaratish" tugmasini bosing
5. AI-generated hujjatni ko'ring

### Sud Simulyatsiyasi

1. `/court-simulator` sahifasiga o'ting
2. Case ni tanlang
3. Rolni belgilang
4. Simulyatsiyani boshlang
5. Argumentlaringizni kiriting
6. AI javobini oling

### Qonunlar Bazasi

1. `/legal-database` sahifasiga o'ting
2. Qidiruv so'zini kiriting
3. Natijalarni ko'ring
4. Xatcho'pga qo'shing

---

## 🤖 AI FUNKSIYALAR

### 1. analyzeIRAC()

```typescript
import { aiClient } from '@/lib/ai-client';

const result = await aiClient.analyzeIRAC(
  'Shartnoma nizosi: Ali va Vali...'
);
```

### 2. generateDocument()

```typescript
const result = await aiClient.generateDocument(
  'shartnoma',
  'Tomonlar: Ali va Vali...'
);
```

### 3. detectWeaknesses()

```typescript
const result = await aiClient.detectWeaknesses(
  'Mening argumentim...'
);
```

### 4. generateScenario()

```typescript
const result = await aiClient.generateScenario(
  'Mehnat shartnomasi',
  'medium'
);
```

### 5. simulateCourt()

```typescript
const result = await aiClient.simulateCourt(
  'O\'g\'irlik holati. Rolim: Himoyachi.'
);
```

### 6. chatMessage()

```typescript
const result = await aiClient.chatMessage(
  'Shartnoma qanday tuziladi?',
  'O\'zbekiston huquq tizimi'
);
```

---

## 🧪 TEST QILISH

### AI Functions Test

```bash
# DIQQAT: SSL sertifikat muammosi bo'lsa
npm run test:groq:unsafe

# Yoki to'g'ridan-to'g'ri:
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
node test-groq-api.js
```

**⚠️ Muhim:** `NODE_TLS_REJECT_UNAUTHORIZED='0'` faqat lokal test uchun! Production'da ishlatmang!

Natija:
```
=== TEST 1: IRAC TAHLIL ===
✓ IRAC tahlil muvaffaqiyatli
Token: 450

Jami testlar: 6
O'tdi: 6
Foiz: 100.0%
✓ Barcha testlar muvaffaqiyatli o'tdi! 🎉
```

### Manual Testing

1. Development serverni ishga tushiring
2. Har bir sahifani test qiling
3. localStorage'ni tekshiring (DevTools)
4. Network requestlarni monitoring qiling

---

## 🌐 DEPLOYMENT

### Vercel Deployment

```bash
# 1. Vercel CLI o'rnatish
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

### Environment Variables

Dashboard → Settings → Environment Variables:
- `GROQ_API_KEY`
- `NEXT_PUBLIC_GROQ_API_KEY`

---

## 📊 LOCALSTORAGE KEYS

1. `court_sim_stats` - Sud statistikasi
2. `court_sim_history` - Sud tarixi  
3. `legal_bookmarks` - Qonun xatcho'plari
4. `decision_trees` - Qaror daraxtlari
5. `irac_history` - IRAC tarix
6. `weakness_history` - Zaiflik tarix
7. `scenario_history` - Stsenariy tarix
8. `user_notifications` - Bildirishnomalar
9. `notification_settings` - Sozlamalar
10. `user_profile` - Profil
11. `payment_requests` - To'lov so'rovlari

---

## 🏗️ ARXITEKTURA

```
src/
├── app/                    # Next.js pages
│   ├── api/               # API routes
│   │   ├── ai/chat/
│   │   ├── court-simulator/
│   │   ├── legal-database/
│   │   └── decision-tree/
│   └── ...
├── components/
│   ├── features/         # Main components
│   └── ui/              # UI components
├── lib/
│   └── ai-client.ts     # AI API client
├── data/
│   ├── document-templates.json
│   └── legal-database.json
└── services/
    ├── api.ts
    └── auth.ts
```

---

## 🔐 XAVFSIZLIK

- API keylar environment variables'da
- HTTPS majburiy (production)
- Rate limiting
- Input validation
- XSS protection

---

## 🤝 HISSA QO'SHISH

1. Repository'ni fork qiling
2. Feature branch yarating
3. O'zgarishlarni commit qiling
4. Pull Request oching

---

## 📝 LITSENZIYA

MIT License - [LICENSE](LICENSE) faylini ko'ring

---

## 👥 MUALLIF

**JurisAI Team**

- Website: https://jurisai.uz
- Email: support@jurisai.uz
- Telegram: @jurisai_support

---

## 🙏 MINNATDORCHILIK

- [Groq](https://groq.com) - AI infrastructure
- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - Styling

---

## ⚡ TEZKOR BOSHLASH

```bash
# 1. Clone
git clone https://github.com/your-username/jurisai.git

# 2. Install
cd jurisai && npm install

# 3. Configure
cp .env.example .env.local
# .env.local faylida GROQ_API_KEY ni o'zgartiring

# 4. Run
npm run dev

# 5. Test
node test-all-ai-functions.js

# 6. Open
# http://localhost:3000
```

**Tayyor! Platformadan foydalanishni boshlang! 🎉**

---

**Version:** 4.0.0  
**Last Updated:** 2024-06-14  
**Status:** ✅ Production Ready  
**Demo Data:** 0% (100% Real AI)
