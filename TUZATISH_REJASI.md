# Barcha Sahifalarni Tuzatish Rejasi

## 📋 UMUMIY HOLAT

**Tekshirildi:** 47+ sahifa
**To'liq ishlaydi:** 5 sahifa (10%)
**Demo data bor:** 10+ sahifa  
**O'rta/kam muhim:** 32+ sahifa

---

## ✅ TO'LIQ ISHLAYDI (Demo datasiz)

1. ✅ `/irac` - IRACCaseSolver.tsx - Real AI IRAC tahlil
2. ✅ `/weakness-detector` - WeaknessDetector.tsx - Real AI zaiflik aniqlash
3. ✅ `/scenario-generator` - ScenarioGenerator.tsx - Real AI stsenariy
4. ✅ `/ai-chat` - Real AI chat + API route
5. ✅ `/document-generator` - DocumentGenerator.tsx - Real AI (templates hali mock)

---

## ❌ DEMO DATA BOR (Tuzatish kerak)

### MUHIM SAHIFALAR:

#### 1. **CourtSimulator** (court-simulator/page.tsx) ❌
**Holat:** To'liq mock data
**Kerak:** Real AI sud simulyatsiyasi
**Qiyinlik:** 🔴 Juda qiyin (100+ qator mock code)
**Vaqt:** 2-3 soat

#### 2. **LegalDatabase** (legal-database-new/page.tsx) ❌  
**Holat:** Mock categories, documents, bookmarks
**Kerak:** Supabase database yoki static JSON
**Qiyinlik:** 🟡 O'rta (ma'lumotlar bazasi kerak)
**Vaqt:** 1-2 soat

#### 3. **DecisionTreeEngine** (decision-tree/page.tsx) ❌
**Holat:** Mock decision trees
**Kerak:** Real AI decision tree generator
**Qiyinlik:** 🔴 Qiyin (AI tree logic kerak)
**Vaqt:** 2-3 soat

#### 4. **NotificationSystem** (notifications komponent) ❌
**Holat:** Mock notifications
**Kerak:** Real backend (Supabase)
**Qiyinlik:** 🟡 O'rta
**Vaqt:** 1 soat

#### 5. **UserProfileManagement** (profile/page.tsx) ❌
**Holat:** Mock user data
**Kerak:** Supabase auth integration
**Qiyinlik:** 🟢 Oson (Supabase ready)
**Vaqt:** 30 min

#### 6. **ManualPaymentProcessing** (manual-payment/page.tsx) ❌
**Holat:** Mock payment history
**Kerak:** Real payment gateway
**Qiyinlik:** 🔴 Qiyin (Click/Payme kerak)
**Vaqt:** 3-4 soat

---

## 🎯 TAVSIYA ETILGAN TUZATISH TARTIBI

### BOSQICH 1 (Tezkor - 1 kun): ✅ BAJARILDI
- [x] IRACCaseSolver - Real AI
- [x] WeaknessDetector - Real AI
- [x] ScenarioGenerator - Real AI
- [x] DocumentGenerator - Real AI
- [x] AI Chat - Real AI + API

### BOSQICH 2 (Muhim - 1 kun):
- [ ] **UserProfileManagement** - Supabase auth (30 min)
- [ ] **LegalDatabase** - Static JSON ma'lumotlar (1 soat)
- [ ] **DocumentGenerator templates** - Real templates DB (1 soat)
- [ ] **NotificationSystem** - Supabase notifications (1 soat)

### BOSQICH 3 (Murakkab - 2-3 kun):
- [ ] **CourtSimulator** - To'liq AI integratsiya (3 soat)
- [ ] **DecisionTreeEngine** - AI decision tree (3 soat)
- [ ] **Dashboard stats** - Real user statistics (2 soat)

### BOSQICH 4 (Katta loyiha - 1 hafta):
- [ ] **ManualPaymentProcessing** - Click/Payme gateway (4 soat)
- [ ] **Billing system** - To'lov tarixi va invoice (3 soat)
- [ ] **Statistics sahifalari** - Real analytics (3 soat)

---

## 💡 ODDIY YECHIMLAR

### 1. LegalDatabase uchun:
```typescript
// Static JSON file yarating: src/data/legal-articles.json
{
  "categories": [...],
  "articles": [...],
  "popularDocuments": [...]
}

// Komponentda:
import legalData from '@/data/legal-articles.json'
```

### 2. UserProfile uchun:
```typescript
// Supabase auth allaqachon bor:
import { useAuth } from '@/services/auth'
const { user } = useAuth() // Real user data
```

### 3. Notifications uchun:
```typescript
// Supabase real-time:
supabase
  .from('notifications')
  .on('INSERT', payload => {
    // Real-time notification
  })
```

---

## 📊 PROGRESS TRACKER

| Sahifa | Holat | Progress | Vaqt |
|--------|-------|----------|------|
| IRAC | ✅ Tayyor | 100% | ✅ |
| Weakness | ✅ Tayyor | 100% | ✅ |
| Scenario | ✅ Tayyor | 100% | ✅ |
| AI Chat | ✅ Tayyor | 100% | ✅ |
| Document Gen | 🟡 90% | 90% | ✅ |
| Court Sim | ❌ Mock | 10% | - |
| Legal DB | ❌ Mock | 20% | - |
| Decision Tree | ❌ Mock | 10% | - |
| Profile | ❌ Mock | 30% | - |
| Notifications | ❌ Mock | 20% | - |
| Payment | ❌ Mock | 10% | - |

**Umumiy Progress: ~45%**

---

## 🚀 KEYINGI QADAMLAR

1. **HOZIR:** Bosqich 2 ni boshlash (oddiy sahifalar)
2. **BUGUN:** UserProfile + LegalDatabase tuzatish
3. **ERTAGA:** CourtSimulator + DecisionTree
4. **HAFTA:** Payment gateway integratsiya

**Men qaysi sahifani tuzatishni boshlashimni xohlaysiz?**
