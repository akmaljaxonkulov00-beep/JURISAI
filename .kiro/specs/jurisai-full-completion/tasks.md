# Implementation Plan: JurisAI To'liq Implementatsiya

## Overview

Bu loyihada 36 ta task mavjud, ular 9 ta fazaga bo'lingan:
- Phase 1: Authentication & Middleware (3 tasks)
- Phase 2: AI Integration (7 tasks)
- Phase 3: Database Operations (5 tasks)
- Phase 4: Payment System (5 tasks)
- Phase 5: Subscription Gating (2 tasks)
- Phase 6: Virtual Court (3 tasks)
- Phase 7: Legal Database (3 tasks)
- Phase 8: Code Cleanup (5 tasks)
- Phase 9: Testing & Debugging (6 tasks)

**Total Estimated Time:** 81-95 soat (10-12 ish kuni)

---

## Tasks

- [ ] 1. Supabase Auth Integration — `src/app/providers.tsx` faylidagi mock autentifikatsiya mantiqini to'liq Supabase Auth bilan almashtirish. Steps: Mock foydalanuvchilar massivi va localStorage mantiqini o'chirish, signIn/signUp/signOut funksiyalarini Supabase metodlari bilan almashtirish, onAuthStateChange listener qo'shish, sahifa yuklanishida getSession() orqali sessiyani tiklash. Priority: High, Estimated: 4-6 soat.

- [ ] 2. Middleware Route Protection — `middleware.ts` faylida himoyalangan route'larga kirish cheklovini qo'shish. Steps: Supabase sessiyasini cookie yoki headerdan o'qish, protected routes ro'yxatini aniqlash, autentifikatsiya qilinmagan foydalanuvchilarni /signin ga yo'naltirish, admin route'lari uchun rol tekshiruvini qo'shish, CORS headerlarini API route'lar uchun qo'shish. Priority: High, Estimated: 2-3 soat.

- [ ] 3. Mock Auth Fayllarni O'chirish — Barcha mock va takroriy autentifikatsiya fayllarini o'chirish. Files: CompleteAuthSystem.tsx, EnhancedAuthSystem.tsx, PerfectAuthSystem.tsx, WorkingAuthSystem.tsx, AuthProvider.tsx, supabase-mock.ts, simple-auth.ts, test-auth.ts, auth.ts, supabase-client.ts, auth-real.ts. Priority: Medium, Estimated: 1 soat.


- [ ] 4. IRAC Tahlil API Route — `/api/ai/irac/route.ts` faylini yaratish va Groq AI bilan integratsiya qilish. Steps: Request body'dan caseText ni olish, auth va subscription limit tekshiruvini qo'shish (Free: 5/month), googleAIService.analyzeIRAC chaqirish, natijani qaytarish va usage_tracking ga yozuv qo'shish. Priority: High, Estimated: 3 soat.

- [ ] 5. AI Chat API Route va Ma'lumotlar Bazasi — `/api/ai/chat/route.ts` yaratish va suhbat tarixini Supabase'da saqlash. Steps: Request body'dan message va conversationId ni olish, auth va subscription limit tekshiruvini qo'shish (Free: 10 messages/month), conversationId mavjud bo'lsa oldingi suhbatni yuklash, googleAIService.generateLegalResponse chaqirish, xabar va AI javobini ai_chat_messages jadvalida saqlash. Priority: High, Estimated: 4 soat.

- [ ] 6. Hujjat Generatori API Route — `/api/ai/document-generator/route.ts` yaratish (Pro/Premium only). Steps: Request body'dan docType va params ni olish, auth va Pro/Premium subscription tekshiruvini qo'shish, googleAIService.generateDocument chaqirish, natijani qaytarish va usage'ni saqlash. Priority: Medium, Estimated: 2 soat.

- [ ] 7. Zaiflik Detektori API Route — `/api/ai/weakness-detector/route.ts` yaratish (Pro/Premium only). Steps: Request body'dan argument ni olish, auth va Pro/Premium subscription tekshiruvini qo'shish, googleAIService.detectWeaknesses chaqirish, natijani qaytarish va usage'ni saqlash. Priority: Medium, Estimated: 2 soat.

- [ ] 8. Stsenariy Generatori API Route — `/api/ai/scenario-generator/route.ts` yaratish (Pro/Premium only). Steps: Request body'dan topic va difficulty ni olish, auth va Pro/Premium subscription tekshiruvini qo'shish, googleAIService.generateScenario chaqirish, natijani qaytarish va usage'ni saqlash. Priority: Medium, Estimated: 2 soat.

- [ ] 9. Sud Simulyatori API Route — `/api/ai/court-simulator/route.ts` yaratish va Virtual Sud funksiyasi. Steps: Request body'dan sessionId, userInput, context ni olish, auth va Pro/Premium subscription tekshiruvini qo'shish, googleAIService.simulateCourt chaqirish, AI raqib javobi va skoring'ni qaytarish, transcript'ni court_sessions jadvalida yangilash. Priority: High, Estimated: 4 soat.

- [ ] 10. AI Chat Sahifasini Haqiqiy API bilan Bog'lash — `src/app/ai-chat/page.tsx` dagi mock javoblarni real API chaqiruvlari bilan almashtirish. Steps: Mock javoblar mantiqini o'chirish, fetch('/api/ai/chat') orqali real AI chaqiruvini qo'shish, loading va error holatlarini qo'shish, suhbat tarixini Supabase'dan yuklash funksiyasini qo'shish. Priority: High, Estimated: 2 soat.


- [ ] 11. Dashboard Real Data Integration — `src/app/dashboard/page.tsx` dagi mock ma'lumotlarni Supabase'dan kelgan haqiqiy ma'lumotlar bilan almashtirish. Steps: Mock ma'lumotlar massivlarini o'chirish, foydalanuvchi ma'lumotlarini users jadvalidan yuklash, statistika ma'lumotlarini user_analytics jadvalidan yuklash, oxirgi faoliyatlarni usage_tracking jadvalidan yuklash, loading va error holatlarini qo'shish. Priority: High, Estimated: 3 soat.

- [ ] 12. Profil CRUD Operatsiyalari — `src/app/profile/page.tsx` da profil ma'lumotlarini o'qish va yangilash. Steps: Profil ma'lumotlarini users jadvalidan yuklash, tahrirlash formasini qo'shish, formani yuborishda Supabase'ni yangilash, success va error xabarlarini qo'shish. Priority: Medium, Estimated: 2-3 soat.

- [ ] 13. Statistika Sahifasi Real Data — `src/app/statistics/page.tsx` da statistika ma'lumotlarini real qilish. Steps: Mock ma'lumotlarni o'chirish, statistika ma'lumotlarini usage_tracking va user_analytics jadvallaridan yuklash, Chart.js yoki Recharts bilan grafik ko'rsatish. Priority: Medium, Estimated: 2 soat.

- [ ] 14. Yutuqlar Tizimi — `src/app/achievements/page.tsx` da yutuqlarni real qilish. Steps: Mock yutuqlarni o'chirish, yutuqlarni achievements jadvalidan yuklash, qozonilgan va qozonilmagan yutuqlarni farqlash. Priority: Low, Estimated: 2 soat.

- [ ] 15. Usage Tracking Helper Funksiya — `src/lib/usage-tracker.ts` faylida reusable usage tracking funksiyasi yaratish. Steps: trackUsage(userId, feature, quantity) funksiyasini yozish, checkSubscriptionLimit(userId, feature) funksiyasini yozish, barcha AI API route'larda ishlatish. Priority: High, Estimated: 1 soat.

- [ ] 16. To'lov Cheki Upload API — `/api/payment/upload/route.ts` yaratish. Steps: Request body'dan image va plan ni olish, auth tekshiruvini qo'shish, rasmni Supabase Storage payment-checks bucketiga yuklash, payments jadvalida yozuv yaratish status='pending' bilan, AI verification'ni trigger qilish. Priority: High, Estimated: 3 soat.

- [ ] 17. AI To'lov Verification — `/api/payment/verify/route.ts` yaratish. Steps: Request body'dan paymentId ni olish, payments jadvalidan to'lov ma'lumotlarini yuklash, googleAIService.verifyPaymentReceipt chaqirish, AI natijasini payments jadvalida saqlash (AI status, reason, confidence). Priority: High, Estimated: 4 soat.


- [ ] 18. Admin To'lov Paneli — `src/app/admin/payments/page.tsx` yaratish. Steps: payments jadvalidan barcha pending va needs_review to'lovlarni yuklash, har bir to'lov uchun rasm, AI tavsiyasi, foydalanuvchi ma'lumotlari ko'rsatilsin, "Tasdiqlash" va "Rad etish" tugmalarini qo'shish, /api/payment/approve yoki /api/payment/reject chaqirish. Priority: High, Estimated: 4 soat.

- [ ] 19. To'lov Tasdiqlash API — `/api/payment/approve/route.ts` yaratish. Steps: Request body'dan paymentId va adminNotes ni olish, admin auth tekshiruvini qo'shish, payments jadvalini status='approved' ga yangilash, foydalanuvchining subscription_plan ni yangilash. Priority: High, Estimated: 2 soat.

- [ ] 20. Manual Payment Sahifasi UI — `src/app/manual-payment/page.tsx` da foydalanuvchi uchun to'lov cheki yuklash interfeysi. Steps: Obuna reja tanlash formasini qo'shish, rasm yuklash inputini qo'shish (drag & drop support), upload tugmasini qo'shish va /api/payment/upload chaqirish, success/error xabarlarini qo'shish. Priority: Medium, Estimated: 2 soat.

- [ ] 21. Subscription Limits Tekshiruvi — Barcha AI API route'larida obuna rejasi va limitlarni tekshirish. Steps: src/lib/subscription-guard.ts faylini yaratish, checkFeatureAccess(userId, feature) funksiyasini yozish, Free, Pro, Premium rejalari uchun limit mantiqini qo'shish, barcha AI API route'larda ishlatish. Priority: High, Estimated: 2 soat.

- [ ] 22. Frontend Feature Gating — Frontend'da premium feature'lar uchun obuna cheklovini ko'rsatish. Steps: src/components/SubscriptionGate.tsx komponenti yaratish, foydalanuvchining obuna rejasini tekshirish, agar obuna mos kelmasa "Upgrade" xabarini ko'rsatish, Hujjat Generatori, Sud Simulyatori, Virtual Sud sahifalarida ishlatish. Priority: Medium, Estimated: 2 soat.

- [ ] 23. Court Session Yaratish — `src/app/virtual-court/page.tsx` da yangi sud seansi yaratish. Steps: Yangi session yaratish formasini qo'shish (case type, user role, case facts), /api/court/create-session API route yaratish, yangi yozuvni court_sessions jadvalida yaratish. Priority: High, Estimated: 2 soat.

- [ ] 24. Real AI Opponent Integratsiyasi — Virtual Sud sahifasida real AI raqib mantiqini qo'shish. Steps: Mock AI raqib mantiqini o'chirish, foydalanuvchi argumentini /api/ai/court-simulator ga yuborish, AI javobini ko'rsatish va transcript'ni yangilash, skoring'ni real AI baholari bilan almashtirish. Priority: High, Estimated: 3 soat.


- [ ] 25. Court Session Tarixi — Foydalanuvchining oldingi sud seanslarini ko'rsatish. Steps: court_sessions jadvalidan foydalanuvchining seanslarini yuklash, seanslar ro'yxatini ko'rsatish, seans tanlanganda transcript'ni yuklab ko'rsatish. Priority: Medium, Estimated: 1-2 soat.

- [ ] 26. O'zbekiston Qonunchiligi Seed Script — O'zbekiston qonunchiligi maqolalarini legal_documents jadvaliga yuklash. Steps: scripts/seed-legal-docs.ts faylini yaratish, Fuqarolik Kodeksi, Jinoyat Kodeksi, Mehnat Kodeksi, Konstitutsiya'dan asosiy maqolalarni yig'ish, har bir maqola uchun code_name, article_number, article_title, content, category, effective_date, Supabase legal_documents jadvaliga yuklash. Priority: High, Estimated: 4-6 soat.

- [ ] 27. Legal Database Qidiruv UI — `src/app/legal-database/page.tsx` da qidiruv interfeysi va natijalar. Steps: Mock ma'lumotlarni o'chirish, qidiruv inputini qo'shish, kategoriya filtrini qo'shish (civil, criminal, labor, constitutional), /api/legal/search API route yaratish va Supabase full-text search qo'shish, natijalarni ko'rsatish. Priority: High, Estimated: 3 soat.

- [ ] 28. AI Semantik Qidiruv — Tabiiy til so'rovlarini AI orqali kalit so'zlarga aylantirish. Steps: /api/legal/semantic-search/route.ts faylini yaratish, request body'dan naturalQuery ni olish, AI'dan kalit so'zlar ajratishni so'rash, ajratilgan so'zlar bilan Supabase'da qidiruv qilish, natijalarni qaytarish. Priority: Medium, Estimated: 2 soat.

- [ ] 29. Takroriy Sahifa Fayllarni O'chirish — Takroriy sahifa fayllarini o'chirish. Files: src/app/ai-chat/page-old.tsx, src/app/ai-chat/page-real.tsx. Priority: Medium, Estimated: 30 daqiqa.

- [ ] 30. Test va Debug Sahifalarni O'chirish — Test va debug sahifalarini o'chirish. Folders: src/app/debug-auth/, src/app/test-auth/, src/app/test-i18n/, src/app/test-quiz/, src/app/missing-features/, src/app/setup-supabase/. Priority: Low, Estimated: 30 daqiqa.

- [ ] 31. Python Backend Papkasini O'chirish — Ishlatilmayotgan Python FastAPI backend papkasini o'chirish. Folder: backend/. Priority: Low, Estimated: 10 daqiqa.

- [ ] 32. Zaxira Konfiguratsiya Fayllarni O'chirish — Zaxira konfiguratsiya fayllarini o'chirish. Files: next.config_backup.js, middleware_backup.ts. Priority: Low, Estimated: 10 daqiqa.


- [ ] 33. Ishlatilmagan Service Fayllarni O'chirish — Ishlatilmagan service fayllarini o'chirish. Files: src/services/api_fixed.ts, src/services/auth.ts (agar mock bo'lsa). Priority: Low, Estimated: 20 daqiqa.

- [ ] 34. Auth Flow Testing — Autentifikatsiya oqimini to'liq test qilish. Test cases: Yangi foydalanuvchi ro'yxatdan o'tishi, mavjud foydalanuvchi tizimga kirishi, noto'g'ri parol bilan xatolik, sessiyaning sahifa yangilanishida tiklanishi, tizimdan chiqish va sessiya tugatilishi, middleware himoyasi, admin rolini tekshirish. Priority: High, Estimated: 2 soat.

- [ ] 35. AI Integration Testing — Barcha AI funksiyalarini test qilish. Test cases: IRAC tahlil real javob qaytaradi, AI Chat suhbat tarixini saqlaydi, Hujjat Generatori hujjat yaratadi, Zaiflik Detektori zaifliklarni topadi, Stsenariy Generatori stsenariy yaratadi, Virtual Sud AI raqib bilan ishlaydi, subscription limitleri to'g'ri ishlaydi. Priority: High, Estimated: 3 soat.

- [ ] 36. Payment System Testing — To'lov tizimini test qilish. Test cases: Foydalanuvchi to'lov cheki yuklaydi, AI to'lovni tekshiradi, admin panelda to'lovni ko'radi, admin to'lovni tasdiqlaydi, foydalanuvchi obunasi faollashadi, admin to'lovni rad etadi. Priority: High, Estimated: 2 soat.

---

## Notes

- Tasks 1-3 (Phase 1) barcha keyingi qismlar uchun asosdir — bu tasklar birinchi navbatda bajarilishi kerak
- Tasks 4-10 (Phase 2) AI integratsiya — asosiy funksionallik
- Tasks 11-15 (Phase 3) va 16-20 (Phase 4) parallel bajarilishi mumkin
- Tasks 21-22 (Phase 5) auth va AI tayyor bo'lgandan keyin
- Tasks 23-25 (Phase 6) va 26-28 (Phase 7) parallel bajarilishi mumkin
- Tasks 29-33 (Phase 8) oxirida tozalash
- Tasks 34-36 (Phase 9) hamma narsa tayyor bo'lgandan keyin test qilish

**Build va TypeScript tekshiruvi** har bir fazadan keyin bajarilishi tavsiya etiladi.

---

## Task Dependency Graph

```json
{
  "waves": [
    {
      "name": "Wave 1: Foundation",
      "tasks": [1, 2, 3],
      "description": "Auth va middleware asosi"
    },
    {
      "name": "Wave 2: Core AI",
      "tasks": [4, 5, 15],
      "description": "IRAC, Chat API va usage tracking",
      "dependsOn": [1, 2]
    },
    {
      "name": "Wave 3: AI Features",
      "tasks": [6, 7, 8, 9, 10],
      "description": "Qolgan AI feature'lar",
      "dependsOn": [15]
    },
    {
      "name": "Wave 4: Data & Payment",
      "tasks": [11, 12, 13, 14, 16, 17, 18, 19, 20],
      "description": "Database operations va payment system",
      "dependsOn": [2]
    },
    {
      "name": "Wave 5: Subscription & Court",
      "tasks": [21, 22, 23, 24, 25],
      "description": "Subscription gating va Virtual Court",
      "dependsOn": [9, 15]
    },
    {
      "name": "Wave 6: Legal DB",
      "tasks": [26, 27, 28],
      "description": "Legal database seeding va qidiruv"
    },
    {
      "name": "Wave 7: Cleanup",
      "tasks": [29, 30, 31, 32, 33],
      "description": "Code cleanup",
      "dependsOn": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28]
    },
    {
      "name": "Wave 8: Testing",
      "tasks": [34, 35, 36],
      "description": "End-to-end testing",
      "dependsOn": [29, 30, 31, 32, 33]
    }
  ]
}
```

**Critical Path:** Wave 1 → Wave 2 → Wave 3 → Wave 8  
**Estimated Critical Path Time:** ~20 soat
