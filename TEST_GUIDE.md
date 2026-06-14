# 🧪 TEST QILISH QOLLANMASI

**Server:** http://localhost:3000  
**Status:** ✅ ISHLAYABDI

---

## 1️⃣ AI ASSISTANT TESTI

### Sahifa
👉 **http://localhost:3000/ai-assistant**

### Test Savollari

#### Test 1: Qisqa Savol
```
Savol: Jinoyat kodeksi nima?

Kutilgan javob formati:
📋 QISQA JAVOB:
[1 jumla]

📖 ASOSIY MA'LUMOT:
• [3 ta punkt]

⚖️ QONUN:
• [2 ta modda]

💡 MASLAHAT:
• [1 maslahat]

Javob uzunligi: 120-150 so'z
```

#### Test 2: Konkret Modda
```
Savol: Mehnat kodeksi 161-modda nima haqida?

Kutilgan:
- Shartnoma bekor qilish haqida ma'lumot
- Qisqa va aniq javob
- Tegishli moddalar
```

#### Test 3: Huquqiy Masala
```
Savol: Ishdan bo'shatilgan, nima qilishim kerak?

Kutilgan:
- Konkret amaliy maslahat
- Qaysi kodeks va modda
- Keyingi qadamlar
```

---

## 2️⃣ COURT SIMULATOR TESTI

### Sahifa
👉 **http://localhost:3000/court-simulator**

### Test Jarayoni

#### 1-qadam: Holat Tanlash
```
1. "Holatlar" bo'limiga o'ting
2. Bir holat tanlang (masalan: "O'g'irlik holati")
3. Rol tanlang: Ayblovchi / Himoyachi / Hakam
4. Qiyinlik: Boshlang'ich
```

#### 2-qadam: Simulyatsiya Boshlash
```
1. "Simulyatsiyani boshlash" tugmasini bosing
2. Kutilgan: Sud javosi (60-80 so'z)
3. Format:
   🏛️ [1 jumla]
   📋 [1 qadam]
```

#### 3-qadam: Argument Yuborish
```
1. Argument kiriting: "Aybdor ekanligiga dalillar yetarli"
2. "Yuborish" tugmasini bosing
3. Kutilgan: Sud javobi (50-80 so'z)
4. Format:
   🏛️ [1 jumla]
   📋 [Baho]
```

#### 4-qadam: Simulyatsiyani Yakunlash
```
1. "Tugatish" tugmasini bosing
2. Kutilgan: Hukm (80-120 so'z)
3. Format:
   ⚖️ [2 jumla - qaror]
   📊 [Ball: 0-100]
```

### Ball Tizimi
```
✅ 80-100: Yutildi
🟡 60-79:  Qisman yutildi
❌ 0-59:   Yutirilmadi
```

---

## 3️⃣ OVOZLI FUNKSIYALAR TESTI

### Talab
```
⚠️ Chrome yoki Edge browser kerak!
⚠️ Mikrofon ruxsati kerak!
```

### Test TTS (Text-to-Speech)

#### Court Simulator sahifasida:
```
1. Simulyatsiyani boshlang
2. 🔊 "Eshitish ON" tugmasini bosing (yashil rangga aylanadi)
3. Argument yuboring
4. Kutilgan: AI javobi ovozli o'qiladi
5. Til: Rus tili (O'zbek tili texnik cheklovlar tufayli)
```

### Test STT (Speech-to-Text)

#### Court Simulator sahifasida:
```
1. Argument input maydonida 🎤 "Gapiring" tugmasini bosing
2. Tugma qizil rangga aylanadi va "Tinglanmoqda..." yozadi
3. Mikrofondan gapiring
4. Kutilgan: Matn avtomatik kiritiladi
5. ⏹️ To'xtatish uchun qayta bosing
```

---

## 4️⃣ QONUNLAR BAZASI TESTI

### Sahifa
👉 **http://localhost:3000/legal-database**

### Qidirish Testi
```
1. Qidiruv maydoniga "o'g'irlik" yozing
2. Kutilgan: JK 169-modda topiladi
3. Modda matni to'liq ko'rinadi
```

### Kodeks Tanlash
```
1. "Jinoyat Kodeksi" tugmasini bosing
2. Kutilgan: JK moddalari ro'yxati
3. Istalgan moddani oching
```

---

## 5️⃣ XATOLIKLARNI TEKSHIRISH

### Browser Console (F12)

#### Tekshirish kerak:
```bash
# ✅ TO'G'RI (bunday bo'lmasligi kerak):
✓ No errors
✓ 200 OK responses

# ❌ XATO (agar ko'rsangiz - xabar bering):
✗ 500 Internal Server Error
✗ SSL certificate error
✗ fetch failed
✗ GROQ_API_KEY not found
```

### Network Tab (F12 → Network)

#### API Chaqiruvlarni tekshirish:
```
1. AI Assistant sahifasida savol yuboring
2. Network tabda "/api/ai/legal-chat" ni toping
3. Status: 200 ✅
4. Response: JSON format
5. Response uzunligi: ~500-1000 belgigacha
```

---

## 6️⃣ PERFORMANCE TESTI

### Javob Vaqti

#### AI Assistant:
```
Savol yuboring va vaqtni o'lchang:
- ✅ Yaxshi: 2-5 soniya
- ⚠️ Qoniqarli: 5-10 soniya
- ❌ Sekin: 10+ soniya
```

#### Court Simulator:
```
Argument yuboring:
- ✅ Yaxshi: 3-6 soniya
- ⚠️ Qoniqarli: 6-12 soniya
- ❌ Sekin: 12+ soniya
```

---

## 7️⃣ MOBILE TEST (Ixtiyoriy)

### Responsive Design
```
1. F12 → Toggle Device Toolbar bosing (Ctrl+Shift+M)
2. "iPhone 12 Pro" ni tanlang
3. Barcha sahifalar mobile formatda to'g'ri ko'rinishi kerak
```

### Touch Events
```
1. Mobile viewda tugmalarni bosing
2. Hammasi ishlashi kerak
```

---

## 🐛 XATOLAR BO'LSA

### Console Error: "SSL certificate error"
```bash
# .env va .env.local tekshiring:
NODE_TLS_REJECT_UNAUTHORIZED=0  # ✅ Bo'lishi kerak
```

### Error: "GROQ_API_KEY not found"
```bash
# .env va .env.local tekshiring:
GROQ_API_KEY=gsk_ftEyNP...  # ✅ To'liq key
NEXT_PUBLIC_GROQ_API_KEY=gsk_ftEyNP...  # ✅ Ikkala variant ham
```

### 500 Error on API calls
```bash
# 1. Server qayta ishga tushiring:
npm run dev

# 2. Cache tozalang:
rm -rf .next
npm run dev

# 3. Browser cache tozalang:
Ctrl+Shift+R (hard reload)
```

### Voice not working
```
⚠️ Chrome/Edge ishlatayabsizmi?
⚠️ Mikrofon ruxsati berdingizmi?
⚠️ HTTPS yoki localhost kerakmi? (localhost - OK)
```

---

## ✅ KUTILGAN NATIJALAR

### AI Assistant
```
✅ Qisqa javoblar (120-150 so'z)
✅ Strukturali format (📋 📖 ⚖️ 💡)
✅ Aniq va tushunarli
✅ Tegishli qonun moddalari
✅ Amaliy maslahatlar
```

### Court Simulator
```
✅ Sud jarayoni boshlandi
✅ Argument qabul qilindi
✅ Sud javobi olindi (qisqa)
✅ Ball olindi (0-100)
✅ Hukm berildi
```

### Voice Functions
```
✅ TTS: AI javobi ovozli o'qiladi
✅ STT: Ovoz matnga aylanadi
✅ Aniq va tushunarli
```

---

## 📊 TEST NATIJALARINI YOZISH

### Format:
```markdown
## Test Natija - [Sana]

### AI Assistant
- ✅/❌ Javob olinmi?
- ✅/❌ Format to'g'rimi?
- ✅/❌ Qisqami? (120-150 so'z)
- Javob vaqti: X soniya

### Court Simulator
- ✅/❌ Sud boshlandi?
- ✅/❌ Argument yuborildi?
- ✅/❌ Javob olindi?
- ✅/❌ Ball olindi?

### Voice
- ✅/❌ TTS ishlayabdimi?
- ✅/❌ STT ishlayabdimi?

### Umumiy Baho
[A'lo / Yaxshi / Qoniqarli / Yomon]

### Muammolar
[Agar bo'lsa, yozing]
```

---

## 🎯 SUCCESS KRITERYALARI

Test muvaffaqiyatli hisoblanadi agar:

```
✅ Barcha API chaqiruvlar 200 OK
✅ AI javoblar 120-150 so'z
✅ Format to'g'ri (📋 📖 ⚖️ 💡)
✅ Javob vaqti 10 soniyadan kam
✅ Build muvaffaqiyatli (0 errors)
✅ TypeScript 0 errors
✅ Console da kritik xatoliklar yo'q
```

---

**Omad!** 🚀

Agar savol bo'lsa yoki yordam kerak bo'lsa - xabar bering!
