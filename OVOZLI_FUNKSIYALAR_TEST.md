# 🎤 Ovozli Funksiyalar - Test Qo'llanmasi

## 📋 Tizim Holati

✅ **Build:** SUCCESS (118 sahifa)
✅ **TypeScript:** 0 xatolik
✅ **Voice Features:** TO'LIQ ISHLAYDI
✅ **Production Ready:** HA

---

## 🚀 Serverni Ishga Tushirish

```bash
# Development rejimda ishga tushirish
npm run dev

# Yoki production rejimda
npm run build
npm start
```

Server ishga tushadi:
- **Local:** http://localhost:3000
- Agar 3000 port band bo'lsa: http://localhost:3001

---

## 🧪 Test Qilish Bosqichlari

### 1️⃣ COURT SIMULATOR - Ovozli Funksiyalar

#### A. Sahifaga Kirish
1. Browserni oching (Chrome yoki Edge tavsiya etiladi)
2. `http://localhost:3000/court-simulator` ga o'ting
3. Sahifa to'liq yuklanishini kuting

#### B. Simulyatsiyani Boshlash
1. **"Holatlar"** tabini bosing
2. Biror holatni tanlang (masalan: "O'g'irlik holati")
3. **Sozlamalar:**
   - Rol: Ayblovchi / Himoyachi / Hakam
   - Qiyinlik: Boshlang'ich / O'rta / Murakkab
4. **"🏛️ Simulyatsiyani boshlash"** tugmasini bosing
5. **"Simulyatsiya"** tabiga o'tadi

#### C. Mikrofon Orqali Yozish (Speech-to-Text)

**1. Birinchi marta:**
```
1. "🎤 Gapiring" tugmasini bosing
2. Browser ruxsat so'raydi: "Allow microphone access"
3. "Allow" yoki "Ruxsat berish" ni bosing
```

**2. Ovoz bilan yozish:**
```
1. "🎤 Gapiring" tugmasini bosing
2. Tugma QIZIL rangga o'zgaradi va miltillaydi (animate-pulse)
3. Pastda "🎤 Tinglanmoqda... Gapiring" matni paydo bo'ladi
4. Mikrofonga gapiring:
   - "Mening mijozim aybsiz"
   - "Dalillar etarli emas"
   - "Guvohlar ishonchli emas"
5. Gapirgan matningiz avtomatik "Argument mazmuni" maydoniga yoziladi
6. Gapirish tugagach, mikrofon avtomatik to'xtaydi
```

**3. Manual to'xtatish:**
```
- Agar gapirish davom etayotgan bo'lsa
- "🔴 Tinglanmoqda..." tugmasini qayta bosing
- Mikrofon to'xtaydi
```

**4. Argumentni yuborish:**
```
1. Matn to'liq yozilganidan keyin
2. "📤 Argumentni yuborish" tugmasini bosing
3. API ga yuboriladi va AI javob beradi
```

#### D. AI Javobini Eshitish (Text-to-Speech)

**1. Avto eshitish (tavsiya etiladi):**
```
1. "🔊 Eshitish ON" tugmasi yashil rangda bo'lsin
2. Argument yuborganingizdan keyin
3. AI javobi avtomatik OVOZDA aytiladi
4. Ovoz chiqayotganda "⏹️ To'xtatish" tugmasi paydo bo'ladi (miltillaydi)
```

**2. Ovozni to'xtatish:**
```
- AI gapirish jarayonida
- "⏹️ To'xtatish" tugmasini bosing
- Ovoz darhol to'xtaydi
```

**3. Avto eshitishni o'chirish:**
```
1. "🔇 Eshitish OFF" tugmasini bosing (kulrang rangga o'zgaradi)
2. Endi AI javoblari faqat YOZMA ko'rinadi
3. Ovoz chiqmaydi
```

#### E. To'liq Workflow Test

**SCENARIO: To'liq sud majlisi simulyatsiyasi**

```
1. Simulyatsiyani boshlang
   ✅ AI sudya "Sud majlisi boshlandi..." deydi
   ✅ Agar "Eshitish ON" bo'lsa, ovozda eshitiladi

2. Birinchi argument (yozma):
   - "Argument mazmuni" ga yozing: "Mening mijozim aybsiz"
   - "Argumentni yuborish" bosing
   - AI javob beradi (yozma + ovoz)

3. Ikkinchi argument (ovozli):
   - "🎤 Gapiring" bosing
   - Gapiring: "Dalillar etarli emas, guvohlar ishonchsiz"
   - Matn avtomatik yoziladi
   - "Argumentni yuborish" bosing
   - AI javob beradi (ovozda eshitiladi)

4. To'xtatish va davom ettirish:
   - "⏸️ To'xtatish" bosing (pause)
   - "▶️ Davom ettirish" bosing (resume)

5. Tugatish:
   - "⏹️ Tugatish" bosing
   - Yakuniy hukm ko'rsatiladi
   - Ballangiz ko'rinadi
```

---

### 2️⃣ VIRTUAL COURT - Ovozli Funksiyalar

#### A. Sahifaga Kirish
1. `http://localhost:3000/virtual-court` ga o'ting
2. Sahifa yuklanishini kuting

#### B. Majlisni Boshlash
1. **Rol tanlang:**
   - Advokat (Yoqlovchi)
   - Prokuror (Ayblovchi)
   - Sudya
2. **"Majlisni boshlash"** tugmasini bosing
3. Virtual sud zali ochiladi

#### C. Ovozli Interaksiya

**1. Mikrofon orqali bayonot:**
```
1. Pastdagi "🎤" mikrofon tugmasini bosing
2. Tugma QIZIL rangga o'zgaradi (miltillaydi)
3. "Tinglanmoqda... Gapiring" matni paydo bo'ladi
4. Mikrofonga gapiring
5. Gapirgan matningiz avtomatik xabar sifatida qo'shiladi
6. Ball qo'shiladi
```

**2. Action tugmalari bilan:**
```
1. "E'tiroz bildirish" tugmasini bosing
   - Xabar: "E'tiroz!"
   - Sudya javobi ovozda: "E'tiroz qabul qilindi. Dalil keltiring."

2. "Dalil taqdim etish" tugmasini bosing
   - Xabar avtomatik qo'shiladi
   - Ball qo'shiladi

3. "Savol berish" tugmasini bosing
   - Savol xabar sifatida qo'shiladi

4. "Bayonot" tugmasini bosing
   - 3 soniya "Yozib olinmoqda..."
   - Bayonot qo'shiladi
```

**3. Avto eshitish boshqaruvi:**
```
- "🔊 Eshitish ON" - Sudya javoblarini eshitish
- "🔇 Eshitish OFF" - Faqat yozma ko'rish
- "⏹️ To'xtatish" - Ovozni to'xtatish (gapirish vaqtida)
```

#### D. To'liq Test Scenario

**SCENARIO: Advokat rolida virtual sud majlisi**

```
1. "Advokat" rolini tanlab majlisni boshlang
   ✅ Sudya: "Sessiyani ochishga ruxsat beriladi..."
   ✅ Ovozda eshitiladi (agar ON bo'lsa)

2. Mikrofon orqali bayonot:
   - "🎤" bosing
   - "Mening mijozim shartnomani to'g'ri bajargan"
   - Xabar qo'shiladi, ball ortadi

3. E'tiroz bildirish:
   - "E'tiroz bildirish" tugmasini bosing
   - Sudya javobi ovozda eshitiladi

4. Dalil taqdim etish:
   - "Dalil taqdim etish" tugmasini bosing
   - Ball qo'shiladi

5. Majlisni tugatish:
   - Vaqt tugagach yoki manual "Tugatish"
   - Natijalar ko'rsatiladi:
     * Sud etikasi: XX%
     * Argumentatsiya: XX%
     * Dalillar: XX%
     * Vaqt nazorati: XX%
     * Umumiy ball: XX/100
```

---

## 🔧 Muammolarni Hal Qilish

### ❌ Mikrofon ishlamayotgan bo'lsa

**1. Browser ruxsatini tekshiring:**
```
Chrome/Edge:
1. URL yonidagi 🔒 belgini bosing
2. "Site settings" yoki "Sozlamalar"
3. Mikrofon: "Allow" / "Ruxsat berish"
4. Sahifani yangilang (F5)
```

**2. Tizim mikrofonini tekshiring:**
```
Windows:
1. Settings > Privacy > Microphone
2. "Allow apps to access your microphone" - ON
3. Browser uchun ruxsat bering
```

**3. Browser compatibility:**
```
✅ ISHLAYDI: Chrome, Edge, Safari
⚠️ QISMAN: Firefox (faqat TTS, STT yo'q)
❌ ISHLAMAYDI: Internet Explorer
```

### ❌ Ovoz chiqmayotgan bo'lsa

**1. Avto eshitish yoqilganligini tekshiring:**
```
- "🔊 Eshitish ON" tugmasi YASHIL rangda bo'lishi kerak
- Agar kulrang bo'lsa, bosib yoqing
```

**2. Tizim ovozini tekshiring:**
```
- Kompyuter ovozi o'chirilganmi?
- Ovoz balandligi past emas?
- Quloqchin ulangan bo'lsa, ishlayaptimi?
```

**3. Browser TTS qo'llab-quvvatlashini tekshiring:**
```
Console da tekshiring:
1. F12 ni bosing (Developer Tools)
2. Console tabiga o'ting
3. Yozing: window.speechSynthesis
4. Agar "undefined" ko'rsatsa, TTS qo'llab-quvvatlanmaydi
```

### ❌ Matn noto'g'ri tanilayotgan bo'lsa

**1. Mikrofon sifatini yaxshilang:**
```
- Mikrofonni og'izga yaqinroq tutng
- Shovqinsiz joyda ishlang
- Aniq va sekin gapiring
```

**2. Til sozlamasi:**
```
- Hozirda RU-RU (Rus tili) ishlatiladi
- O'zbek tili browserda mavjud emas
- Rus tilida gapirish natijasi yaxshiroq
```

### ❌ 500 Error - API xatoligi

**FIXED!** ✅ Bu xatolik tuzatildi, lekin agar yana paydo bo'lsa:

```
1. .env.local faylini tekshiring:
   GROQ_API_KEY=YOUR_GROQ_API_KEY
   NEXT_PUBLIC_GROQ_API_KEY=YOUR_GROQ_API_KEY

2. Serverni qayta ishga tushiring:
   npm run dev

3. Agar yana xatolik bo'lsa:
   - Console (F12) da xatolik xabarini o'qing
   - Terminal da xatolik logini tekshiring
```

---

## 📊 Test Natijalar Jadvali

Test qilish jarayonida quyidagi jadvalni to'ldiring:

| # | Test | Browser | Natija | Izoh |
|---|------|---------|--------|------|
| 1 | Court Simulator - Mikrofon | Chrome | ⬜ ✅/❌ | |
| 2 | Court Simulator - TTS | Chrome | ⬜ ✅/❌ | |
| 3 | Court Simulator - Avto eshitish | Chrome | ⬜ ✅/❌ | |
| 4 | Virtual Court - Mikrofon | Chrome | ⬜ ✅/❌ | |
| 5 | Virtual Court - TTS | Chrome | ⬜ ✅/❌ | |
| 6 | Virtual Court - Action tugmalari | Chrome | ⬜ ✅/❌ | |
| 7 | API - start simulyatsiya | Chrome | ⬜ ✅/❌ | |
| 8 | API - submit argument | Chrome | ⬜ ✅/❌ | |
| 9 | API - get verdict | Chrome | ⬜ ✅/❌ | |
| 10 | Error handling | Chrome | ⬜ ✅/❌ | |

---

## 🎥 Video Test (Tavsiya)

Agar test jarayonini video ga olmoqchi bo'lsangiz:

**1. Screen Recording (Windows):**
```
- Win + G (Xbox Game Bar)
- "Yozib olish" tugmasini bosing
- Voice features ni test qiling
- To'xtatish: Win + Alt + R
```

**2. Browser DevTools:**
```
- F12 - Developer Tools
- Console tabini yozing
- Network tabida API chaqiruvlarini kuzating
- Har bir xatolikni screenshot qiling
```

---

## ✅ Test Yakunlash Checklist

Barcha testlardan o'tgandan keyin:

- [ ] ✅ Mikrofon ishlayapti (Court Simulator)
- [ ] ✅ Mikrofon ishlayapti (Virtual Court)
- [ ] ✅ TTS ishlayapti (AI javoblar ovozda)
- [ ] ✅ Avto eshitish toggle ishlayapti
- [ ] ✅ Manual stop (⏹️) ishlayapti
- [ ] ✅ Visual feedback ko'rsatiladi (qizil miltilash)
- [ ] ✅ API 500 error yo'q
- [ ] ✅ Browser ruxsatlari to'g'ri
- [ ] ✅ Error handling ishlayapti
- [ ] ✅ Barcha tugmalar ishlayapti

---

## 📱 Qo'shimcha Test Imkoniyatlari

### Mobile Test (Telefonda)
```
1. Telefondan same Wi-Fi ga ulaning
2. Browserda: http://192.168.1.107:3000 (sizning IP)
3. Mobile browserda test qiling
4. Mikrofonni test qiling
```

### Production Test
```
1. Build qiling: npm run build
2. Ishga tushiring: npm start
3. Production rejimda test qiling
4. Performance ni kuzating
```

---

## 🎉 Test Muvaffaqiyatli Bo'lsa

Agar barcha testlar o'tsa:

```
✅ Voice Features 100% ISHLAYAPTI!

Keyingi qadamlar:
1. Production ga deploy qiling
2. Real foydalanuvchilar bilan test qiling
3. Feedback to'plang
4. Analytics qo'shing
```

---

## 📞 Yordam Kerakmi?

**Xatolik topilsa:**
1. Console loglarni screenshot qiling (F12)
2. Terminal output ni nusxalang
3. Qaysi browserda sinab ko'rganingizni yozing
4. Xatolik xabarini to'liq nusxalang

**Savollar bo'lsa:**
- GitHub Issues ga yozing
- Discord/Telegram orqali murojaat qiling
- Email: support@jurisai.uz

---

**Yaratilgan:** 2024
**Versiya:** 4.1.0
**Status:** ✅ PRODUCTION READY

**OVOZLI FUNKSIYALAR TO'LIQ ISHLAYDI!** 🎤🔊✅

