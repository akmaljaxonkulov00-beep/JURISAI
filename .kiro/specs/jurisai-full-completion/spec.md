# JurisAI — To'liq Ishlab Chiqish Reja

**Feature ID:** `jurisai-full-completion`  
**Created:** 2026-06-13  
**Status:** In Planning  
**Priority:** High  
**Owner:** Development Team

---

## Overview

JurisAI platformasini 0-dan 100% ishlaydigan holatga olib kelish uchun yaratilgan spec. Hozirda platforma UI/shell ishlaydi, lekin barcha kritik backend funksiyalari (auth, AI, database, to'lov, obuna) mock yoki to'liq qo'shilmagan. Bu spec barcha muammolarni bartaraf etib, production-ready platforma yaratadi.

---

## Current State

### ✅ Mavjud Qismlar
- Prisma Schema — professional darajada, index + enum bilan
- Next.js 16.2.4 + React 19.2.4 (app router)
- UI/UX dizayn — glassmorphism, O'zbek tili interfeysi
- Supabase + Groq + OpenAI API sozlamalari (.env)
- Komponentlar kutubxonasi — UI elements to'liq
- Sahifalar shell — 40+ route bor, lekin ichida mock data

### ❌ Muammo Qismlari
- Auth — `password123` bilan mock localStorage
- AI xizmatlar — stub/simulated responses (real API call yo'q)
- Python FastAPI backend — barcha routers comment'da, ishlayotgan xizmat yo'q
- Duplicate fayllar: `page.tsx`, `page-old.tsx`, `page-real.tsx`
- 3 ta parallel database qatlami: Prisma + Supabase + SQLAlchemy
- Middleware hech narsa himoya qilmaydi

---

## Goals

1. **Real Supabase Authentication** — barcha mock auth o'chiriladi
2. **Live Groq AI Integration** — barcha AI funksiyalar real ishlaydi
3. **Real Database Operations** — Supabase'dan haqiqiy ma'lumotlar
4. **Manual Payment System** — AI + Admin to'lov tasdigi
5. **Subscription Enforcement** — server-side obuna cheklashlari
6. **Virtual Court** — real AI raqib va AI sudya
7. **Legal Database** — O'zbekiston qonunchiligi qidirish
8. **Code Cleanup** — barcha takroriy va ishlatilmagan fayllar o'chiriladi

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │   AI Chat    │  │ Virtual Court│      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
│                  ┌────────▼────────┐                       │
│                  │  API Routes     │                       │
│                  │  /api/ai/*      │                       │
│                  │  /api/auth/*    │                       │
│                  └────────┬────────┘                       │
└───────────────────────────┼─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌──────▼──────┐
│  Supabase      │  │  Groq AI       │  │  Storage    │
│  - Auth        │  │  llama-3.3-70b │  │  - Payment  │
│  - Database    │  │  - IRAC        │  │    Receipts │
│  - Users       │  │  - Chat        │  │             │
│  - Payments    │  │  - Court Sim   │  │             │
│  - Legal Docs  │  │  - Documents   │  │             │
└────────────────┘  └────────────────┘  └─────────────┘
```

---

## Implementation Phases

### Phase 1: Authentication & Middleware (2-3 kun)
- Supabase Auth integration
- Route protection middleware
- Mock auth o'chirish
- Session management

### Phase 2: AI Integration (3-4 kun)
- Groq AI barcha funksiyalar
- IRAC, Chat, Document, Court, Weakness, Scenario
- Usage tracking
- Error handling

### Phase 3: Database Operations (2-3 kun)
- Dashboard real data
- Profile CRUD
- Statistics va achievements
- Analytics tracking

### Phase 4: Payment System (2-3 kun)
- File upload to Supabase Storage
- AI receipt verification
- Admin approval panel
- Subscription activation

### Phase 5: Subscription Gating (1-2 kun)
- Server-side limit checks
- Feature gating logic
- Usage tracking integration

### Phase 6: Virtual Court (2-3 kun)
- AI opponent logic
- AI judge scoring
- Session persistence
- History tracking

### Phase 7: Legal Database (2-3 kun)
- Seed O'zbekiston laws
- Full-text search
- AI-powered semantic search
- Category filtering

### Phase 8: Code Cleanup (1-2 kun)
- O'chirish: mock files, duplicates, unused imports
- TypeScript build check
- ESLint cleanup

### Phase 9: Testing & Debugging (2-3 kun)
- End-to-end testing
- Bug fixes
- Performance optimization

**Total:** 17-26 kun

---

## Success Criteria

- ✅ Hech qanday mock autentifikatsiya qolmaydi
- ✅ Barcha AI funksiyalar real javob qaytaradi
- ✅ Dashboard real ma'lumotlarni ko'rsatadi
- ✅ To'lov tizimi ishlaydi (AI + Admin)
- ✅ Obuna cheklashlari server tomonida qo'llaniladi
- ✅ Virtual Sud real AI bilan interaktiv
- ✅ Legal Database O'zbekiston qonunchiligini qidiradi
- ✅ Barcha takroriy fayllar o'chirilgan
- ✅ TypeScript build xatosiz o'tadi

---

## Risks

1. **Groq API Limiti** — Monitoring va fallback strategiyasi
2. **Migration Xatolari** — Backup va rollback plani
3. **AI To'lov Xatosi** — Admin final approval
4. **Import Sinishi** — Test qilish va Git branch'da ishlash

---

## Related Documents

- [Requirements](./requirements.md) — To'liq talablar hujjati
- [Design](./design.md) — Arxitektura va komponent dizayni (keyingi qadam)
- [Tasks](./tasks.md) — Bajarilishi kerak bo'lgan vazifalar ro'yxati (keyingi qadam)

---

**Next Step:** Design Document yaratish — komponent strukturasi, API contract'lar, ma'lumotlar oqimi va UI/UX mockup'lar aniqlanadi.
