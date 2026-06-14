# ⚡ JURISAI - TEZKOR BOSHLASH

> 5 daqiqada loyihani ishga tushiring!

## 🚀 BOSHLASH

### 1. Repository ni klonlash

```bash
git clone https://github.com/your-username/jurisai.git
cd jurisai
```

### 2. Dependencies o'rnatish

```bash
npm install
```

**Kutish vaqti:** ~2-3 daqiqa

### 3. Environment Variables

`.env.local` faylini yarating:

```bash
# Windows
copy .env.example .env.local

# Mac/Linux
cp .env.example .env.local
```

**`.env.local` faylini tahrirlang:**

```env
# GROQ AI (Majburiy)
GROQ_API_KEY=gsk_your_api_key_here
NEXT_PUBLIC_GROQ_API_KEY=gsk_your_api_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Groq API Key olish:**
1. https://console.groq.com saytiga o'ting
2. Ro'yxatdan o'ting
3. API Keys bo'limidan yangi key yarating
4. Keyni `.env.local` faylga qo'ying

### 4. Development Server

```bash
npm run dev
```

**Brauzerda oching:** http://localhost:3000

---

## ✅ TEKSHIRISH

### 1. AI Test

```bash
npm run test:ai
```

**Kutilgan natija:**
```
✓ TEST 1: IRAC TAHLIL - PASSED
✓ TEST 2: ZAIFLIK ANIQLASH - PASSED
✓ TEST 3: STSENARIY YARATISH - PASSED
✓ TEST 4: HUJJAT YARATISH - PASSED
✓ TEST 5: SUD SIMULYATSIYASI - PASSED
✓ TEST 6: QAROR DARAXTI - PASSED

Jami: 6/6 (100%)
```

### 2. Build Test

```bash
npm run build
```

**Kutilgan natija:**
```
✓ Creating an optimized production build
✓ Compiled successfully
```

### 3. Brauzerda Test

Quyidagi sahifalarni ochib tekshiring:

1. **IRAC Tahlil:** http://localhost:3000/irac
2. **Hujjat Generator:** http://localhost:3000/document-generator
3. **Sud Simulyatori:** http://localhost:3000/court-simulator
4. **Qonunlar Bazasi:** http://localhost:3000/legal-database
5. **AI Chat:** http://localhost:3000/ai-chat

---

## 🎯 BIRINCHI QADAMLAR

### 1. IRAC Tahlil

1. `/irac` sahifasiga o'ting
2. Ish ma'lumotlarini kiriting:
```
Shartnoma nizosi:
Ali va Vali o'rtasida 10 million so'm qiymatidagi uy-joy sotish 
shartnomasi tuzilgan. Ali shartnoma bo'yicha pul to'lagan, 
lekin Vali uyni topshirmagan.

Savol: Ali sudga murojaat qilishi mumkinmi?
```
3. "Tahlil qilish" tugmasini bosing
4. AI tahlilni ko'ring

### 2. Hujjat Yaratish

1. `/document-generator` sahifasiga o'ting
2. "Shartnoma" ni tanlang
3. Ma'lumotlarni kiriting:
```
Tomonlar: Ali Valiyev va Vali Karimov
Predmet: Uy-joy sotish
Narx: 10 million so'm
Manzil: Toshkent shahar
```
4. "Hujjat yaratish" tugmasini bosing
5. Natijani ko'ring

### 3. Sud Simulyatsiyasi

1. `/court-simulator` sahifasiga o'ting
2. "Holatlar" tabidan case ni tanlang
3. Rolni tanlang (Da'vogar/Javobgar/Sudya)
4. "Simulyatsiyani boshlash" tugmasini bosing
5. Argumentingizni kiriting
6. AI javobini oling

---

## 🛠️ SCRIPTLAR

### Development

```bash
npm run dev              # Development server
npm run build            # Production build
npm run start            # Production server
npm run lint             # Code linting
```

### Testing

```bash
npm run test             # Unit tests
npm run test:ai          # AI functions test
npm run test:groq        # Groq API test
npm run test:e2e         # E2E tests
npm run test:all         # Barcha testlar
```

### Maintenance

```bash
npm run clean            # node_modules va .next o'chirish
npm run clean:cache      # Faqat .next o'chirish
npm run reinstall        # Tozalash va qayta o'rnatish
npm run type-check       # TypeScript tekshirish
npm run format           # Code formatting
```

---

## 🔧 MUAMMOLARNI HAL QILISH

### 1. Port band bo'lsa

```bash
# Port 3000 band bo'lsa, boshqa portda ishga tushiring
PORT=3001 npm run dev
```

### 2. Node memory xatosi

```bash
# Memory limitni oshiring
set NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

### 3. Dependencies xatosi

```bash
# node_modules ni o'chirib qayta o'rnating
npm run reinstall
```

### 4. Build xatosi

```bash
# Cache ni tozalang
npm run clean:cache
npm run build
```

### 5. API key xatosi

Tekshiring:
- `.env.local` fayli mavjudmi?
- `GROQ_API_KEY` to'g'rimi?
- `NEXT_PUBLIC_GROQ_API_KEY` to'g'rimi?
- API key yaroqli vaqti tugamaganmi?

```bash
# Test qiling
npm run test:groq
```

---

## 📦 PRODUCTION BUILD

### 1. Build

```bash
npm run build
```

### 2. Test

```bash
npm run start
```

**Brauzerda oching:** http://localhost:3000

### 3. Deploy

#### Vercel:

```bash
npm i -g vercel
vercel login
vercel --prod
```

#### Netlify:

```bash
npm i -g netlify-cli
netlify login
netlify deploy --prod
```

#### Docker:

```bash
docker build -t jurisai .
docker run -p 3000:3000 jurisai
```

---

## 📊 LOCALSTORAGE

Platforma quyidagi localStorage keylaridan foydalanadi:

```javascript
// Browser Console'da tekshirish
console.log(localStorage.getItem('irac_history'))
console.log(localStorage.getItem('user_profile'))
console.log(localStorage.getItem('court_sim_stats'))
```

**Tozalash:**

```javascript
// Hammasi
localStorage.clear()

// Bitta key
localStorage.removeItem('irac_history')
```

---

## 💡 MASLAHATLAR

### Performance

1. **Production mode** ishlatish:
```bash
npm run build
npm run start
```

2. **Cache** ni tozalash:
```bash
npm run clean:cache
```

3. **Lazy loading** ishlatilgan, shuning uchun birinchi yuklash sekin bo'lishi mumkin

### Development

1. **Hot reload** ishlatilgan, shuning uchun faylni saqlashingiz bilan yangilanadi
2. **TypeScript** xatolarini ko'rish uchun:
```bash
npm run type-check
```

3. **Formatting** qilish:
```bash
npm run format
```

### AI Usage

1. **Rate limit:** Groq API'da limit bor, ko'p so'rov yubormaslik
2. **Token limit:** Juda uzun matnlar uchun response qisqa bo'lishi mumkin
3. **Error handling:** Xatolik bo'lsa, qayta urinib ko'ring

---

## 🆘 YORDAM

### Dokumentatsiya

- [README_UZBEK.md](./README_UZBEK.md) - To'liq yo'riqnoma
- [COMPLETE_FINAL_SUMMARY.md](./COMPLETE_FINAL_SUMMARY.md) - Yakuniy hisorot
- [ALL_DONE_SUMMARY.md](./ALL_DONE_SUMMARY.md) - Tuzatishlar hisoboti

### Support

- **Email:** support@jurisai.uz
- **Telegram:** @jurisai_support
- **Issues:** GitHub Issues

---

## 🎉 TAYYOR!

Endi platformadan foydalanishni boshlashingiz mumkin!

**Keyingi qadamlar:**

1. ✅ IRAC tahlil qiling
2. ✅ Hujjat yarating
3. ✅ Sud simulyatsiyasini sinab ko'ring
4. ✅ Qonunlar bazasidan foydalaning
5. ✅ AI chat bilan suhbatlashing

**Omad tilaymiz! 🚀**

---

**Version:** 4.0.0  
**Last Updated:** 2024-06-14  
**Time to Start:** ~5 daqiqa ⚡
