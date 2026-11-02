'use client'

import React, { useState } from 'react'
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Search,
  Filter,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  Printer,
  FileCheck,
  Edit3,
  X,
  Sparkles,
} from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export interface PracticeDocument {
  id: string
  title: string
  category: 'davo' | 'shartnoma' | 'shikoyat' | 'ishonchnoma'
  categoryLabel: string
  codeRef: string
  description: string
  proceduralContent: string
  placeholders: string[]
}

export const VERIFIED_PRACTICE_DOCUMENTS: PracticeDocument[] = [
  // ── 1. DA'VO ARIZALARI ──
  {
    id: 'davo_qarz',
    title: 'Qarz summasi va penya undirish to‘g‘risida da‘vo arizasi',
    category: 'davo',
    categoryLabel: 'Da‘vo arizasi',
    codeRef: 'FK 732, 735, 736-moddalari; FPK 188, 189-moddalari',
    description:
      'Qarz shartnomasi yoki tilxat bo‘yicha qaytarilmagan asosiy qarz summasi, muddati o‘tgan kunlar uchun penya va davlat bojini javobgardan undirish namunasi.',
    placeholders: ['Sud nomi', 'Da‘vogar F.I.Sh.', 'Da‘vogar manzili', 'Javobgar F.I.Sh.', 'Javobgar manzili', 'Qarz summasi', 'Shartnoma sanasi'],
    proceduralContent: `FUQAROLIK ISHLARI BO‘YICHA [Sud nomi] SUDIGA

Da‘vogar: [Da‘vogar F.I.Sh.]
Yashash manzili: [Da‘vogar manzili], Tel: [Telefon raqami]
Javobgar: [Javobgar F.I.Sh.]
Yashash manzili: [Javobgar manzili], Tel: [Javobgar telefoni]
Da‘vo bahosi: [Qarz summasi] so‘m
Davlat boji: [Davlat boji summasi] so‘m

DA‘VO ARIZASI
(Qarz summasi va penya undirish to‘g‘risida)

[Shartnoma sanasi] yilda men va javobgar [Javobgar F.I.Sh.] o‘rtasida qarz shartnomasi (tilxat) tuzilgan. Mazkur kelishuvga binoan, men javobgarga [Qarz summasi] so‘m miqdoridagi pul mablag‘ini [Qaytarish sanasi] gacha qaytarish sharti bilan berganman.

Biroq, javobgar majburiyatini o‘z vaqtida bajarmasdan, belgilangan muddat o‘tgan bo‘lsa-da, qarz mablag‘ini qaytarishdan bo‘yin tovlab kelmoqda. Mening takroriy og‘zaki va yozma talablarim e‘tiborsiz qoldirildi.

O‘zbekiston Respublikasi Fuqarolik Kodeksining 236-moddasiga asosan majburiyatlar tegishli tartibda bajarilishi shart. FKning 732, 735-moddalariga muvofiq, qarz oluvchi qarz beruvchiga olingan qarz summasini shartnomada kelishilgan muddatda va tartibda qaytarishi shart.

Yuqoridagilarga ko‘ra, O‘zbekiston Respublikasi FPKning 188, 189-moddalariga asosan,

SO‘RAYMAN:
1. Javobgar [Javobgar F.I.Sh.] dan mening foydamga [Qarz summasi] so‘m asosiy qarz summasini undirishingizni;
2. Majburiyat kechiktirilganligi uchun [Penya summasi] so‘m miqdorida penya undirishingizni;
3. Da‘vo arizasi uchun to‘langan [Davlat boji summasi] so‘m davlat boji va pochta xarajatlarini javobgardan undirib berishingizni.

Ilova:
1. Da‘vo arizasi nusxasi;
2. Qarz shartnomasi (yoki tilxat) nusxasi;
3. Davlat boji to‘langanligi to‘g‘risida kvitansiya;
4. Pasport nusxasi.

Da‘vogar: ____________________ [Da‘vogar F.I.Sh.]
Sana: 2026-yil "___" ____________`,
  },
  {
    id: 'davo_nikoh',
    title: 'Nikohni bekor qilish va voyaga yetmagan bolalar ta‘minotiga aliment undirish',
    category: 'davo',
    categoryLabel: 'Da‘vo arizasi',
    codeRef: 'Oila kodeksi 37, 38, 41, 96-moddalari; FPK 188, 189-moddalari',
    description:
      'Oilaviy kelishmovchiliklar natijasida birga yashash imkoni bo‘lmaganda nikohni bekor qilish va voyaga yetmagan bolalar ta‘minoti uchun aliment tayinlash to‘g‘risida sudga ariza.',
    placeholders: ['Sud nomi', 'Da‘vogar F.I.Sh.', 'Javobgar F.I.Sh.', 'Nikoh tuzilgan sana', 'FXDYO organi nomi', 'Bolalarning F.I.Sh. va tug‘ilgan sanasi'],
    proceduralContent: `FUQAROLIK ISHLARI BO‘YICHA [Sud nomi] SUDIGA

Da‘vogar: [Da‘vogar F.I.Sh.]
Manzili: [Da‘vogar manzili], Tel: [Telefon raqami]
Javobgar: [Javobgar F.I.Sh.]
Manzili: [Javobgar manzili], Tel: [Javobgar telefoni]

DA‘VO ARIZASI
(Nikohni bekor qilish va aliment undirish to‘g‘risida)

Men javobgar [Javobgar F.I.Sh.] bilan [Nikoh tuzilgan sana] yilda qonuniy nikohdan o‘tganmiz (Nikoh guvohnomasi raqami: [Guvohnoma raqami], bergan organ: [FXDYO organi nomi]).

Birgalikdagi turmushimizdan [Bolalarning F.I.Sh. va tug‘ilgan sanasi] tug‘ilgan farzandlarimiz bor. So‘nggi paytlarda o‘rtamizdagi fe‘l-atvor nomutanosibligi va o‘zaro kelishmovchiliklar tufayli oilaviy munosabatlarimiz butunlay buzildi. [Ayrilgan sana] yildan buyon alohida yashab kelmoqdamiz. Oila va nikohni saqlab qolishning imkoni yo‘q.

Javobgar voyaga yetmagan farzandlarimizning moddiy ta‘minotida ixtiyoriy ravishda ishtirok etmayapti.

O‘zbekiston Respublikasi Oila Kodeksining 37, 38, 41, 96, 99-moddalariga hamda FPKning 188, 189-moddalariga asosan,

SO‘RAYMAN:
1. Men va javobgar [Javobgar F.I.Sh.] o‘rtasidagi [Nikoh sanasi] dagi [Raqam]-sonli nikohni bekor qilishingizni;
2. Voyaga yetmagan farzandlarimiz: [Farzandlar ismi] ta‘minoti uchun javobgardan har oylik daromadining qonunda belgilangan qismida aliment undirishingizni;
3. Sud xarajatlarini javobgar hisobiga yuklashingizni.

Ilova:
1. Da‘vo arizasi nusxasi;
2. Nikoh tuzilganligi to‘g‘risidagi guvohnomaning asl nusxasi;
3. Bolalarning tug‘ilganlik haqidagi guvohnomalari nusxasi;
4. Yashash joyidan ma‘lumotnoma;
5. Davlat boji to‘langanligi haqida kvitansiya.

Da‘vogar: ____________________ [Da‘vogar F.I.Sh.]
Sana: 2026-yil "___" ____________`,
  },
  {
    id: 'davo_mehnat',
    title: 'Ishga tiklash va majburiy progul uchun ish haqi undirish to‘g‘risida da‘vo arizasi',
    category: 'davo',
    categoryLabel: 'Da‘vo arizasi',
    codeRef: 'Mehnat Kodeksi 161, 560, 561-moddalari; FPK 188-moddasi',
    description:
      'Ish beruvchi tashabbusi bilan qonunga xilof ravishda mehnat shartnomasi bekor qilingan xodimni avvalgi ishiga tiklash va to‘lanmagan ish haqini undirish namunasi.',
    placeholders: ['Sud nomi', 'Da‘vogar F.I.Sh.', 'Tashkilot nomi', 'Buyruq sanasi va raqami', 'Lavozim nomi', 'O‘rtacha oylik ish haqi'],
    proceduralContent: `FUQAROLIK ISHLARI BO‘YICHA [Sud nomi] SUDIGA

Da‘vogar: [Da‘vogar F.I.Sh.]
Yashash manzili: [Da‘vogar manzili], Tel: [Telefon raqami]
Javobgar: [Tashkilot nomi]
Yuridik manzili: [Tashkilot manzili], STIR: [STIR raqami]
Davlat boji: O‘zR Davlat boji to‘g‘risidagi Qonunining 8-moddasiga asosan da‘vogar davlat bojidan ozod qilingan.

DA‘VO ARIZASI
(Ishga tiklash va majburiy progul vaqti uchun ish haqini undirish to‘g‘risida)

Men [Ishga kirgan sana] dan e‘tiboran [Tashkilot nomi] da [Lavozim nomi] lavozimida mehnat qilib kelganman. Ish beruvchining [Buyruq sanasi] dagi [Buyruq raqami]-sonli buyrug‘iga asosan men bilan tuzilgan mehnat shartnomasi asossiz va qonun talablariga zid ravishda bekor qilingan.

Mehnat shartnomasini bekor qilishda amaldagi Mehnat Kodeksining 161-164-moddalarida nazarda tutilgan kafolatlar, ogohlantirish muddati va asosli sabablar talablariga rioya etilmagan.

Mehnat Kodeksining 161, 560, 561-moddalariga hamda FPKning 188, 189-moddalariga asosan,

SO‘RAYMAN:
1. Ish beruvchi [Tashkilot nomi] ning [Buyruq sanasi] dagi [Buyruq raqami]-sonli buyrug‘ini noqonuniy deb topib, meni avvalgi [Lavozim nomi] lavozimiga ishga tiklashingizni;
2. Majburiy progul davri uchun o‘rtacha oylik ish haqi hisobidan [Hisoblangan summa] so‘m ish haqini javobgardan mening foydamga undirishingizni;
3. Noqonuniy ishdan bo‘shatish oqibatida yetkazilgan ma‘naviy zarar uchun kompensatsiya undirishingizni.

Ilova:
1. Da‘vo arizasi nusxasi;
2. Ishga qabul qilish va bo‘shatish haqidagi buyruqlar nusxasi;
3. Elektron mehnat daftarchasidan ko‘chirma;
4. Oylik ish haqi to‘g‘risida ma‘lumotnoma.

Da‘vogar: ____________________ [Da‘vogar F.I.Sh.]
Sana: 2026-yil "___" ____________`,
  },
  {
    id: 'davo_sud_buyrugi',
    title: 'Hisoblangan lekin to‘lanmagan ish haqini undirish to‘g‘risida sud buyrug‘i arizasi',
    category: 'davo',
    categoryLabel: 'Sud buyrug‘i',
    codeRef: 'FPK 170, 171, 172-moddalari',
    description:
      'Korxona tomonidan rasman hisoblangan, lekin xodimga to‘lab berilmagan oylik ish haqi va unga tenglashtirilgan to‘lovlarni soddalashtirilgan tartibda undirish.',
    placeholders: ['Sud nomi', 'Ariza beruvchi F.I.Sh.', 'Qarzdor tashkilot nomi', 'Qarzdorlik davri', 'Undiriladigan summa'],
    proceduralContent: `FUQAROLIK ISHLARI BO‘YICHA [Sud nomi] SUDIGA

Undiruvchi: [Ariza beruvchi F.I.Sh.]
Manzili: [Yashash manzili], Tel: [Telefon raqami]
Qarzdor: [Qarzdor tashkilot nomi]
Manzili: [Tashkilot yuridik manzili], STIR: [STIR]

SUD BUYRUG‘I BERISH TO‘G‘RISIDA ARIZA
(Hisoblangan, lekin to‘lanmagan ish haqini undirish haqida)

Men [Ishga qabul sanasi] dan [Qarzdor tashkilot nomi] da [Lavozim nomi] lavozimida ishlab kelmoqdaman (yoki ishlaganman).

Tashkilot ma‘muriyati tomonidan menga [Qarzdorlik davri] davri uchun jami [Undiriladigan summa] so‘m miqdorida ish haqi hisoblangan, biroq bugungi kunga qadar amalda to‘lab berilmagan. Qarzdorlik mavjudligi korxona bergan ma‘lumotnoma bilan to‘liq tasdiqlanadi.

O‘zbekiston Respublikasi FPKning 170-moddasi 1-bandi, 171, 172-moddalariga muvofiq, hisoblangan, lekin to‘lanmagan ish haqi bo‘yicha sud buyrug‘i beriladi.

Yuqoridagilarga asosan,

SO‘RAYMAN:
Qarzdor [Qarzdor tashkilot nomi] dan mening foydamga hisoblangan, lekin to‘lanmagan [Undiriladigan summa] so‘m ish haqi qarzdorligini undirish haqida sud buyrug‘i chiqarishingizni.

Ilova:
1. Ariza nusxasi;
2. Hisoblangan ish haqi to‘g‘risida tashkilot ma‘lumotnomasi;
3. Mehnat shartnomasi / buyruq nusxasi;
4. Pasport nusxasi.

Ariza beruvchi: ____________________ [Ariza beruvchi F.I.Sh.]
Sana: 2026-yil "___" ____________`,
  },

  // ── 2. SHARTNOMALAR ──
  {
    id: 'shartnoma_qarz',
    title: 'Fuqarolar o‘rtasida qarz shartnomasi va pul qabul qilinganligi to‘g‘risida tilxat',
    category: 'shartnoma',
    categoryLabel: 'Shartnoma',
    codeRef: 'Fuqarolik Kodeksi 732, 733, 734, 735-moddalari',
    description:
      'Jismoniy shaxslar o‘rtasida pul mablag‘larini ma‘lum muddatga qarz berish, foiz va qaytarish kafolatlari hamda sud nizolarida rasmiy dalil bo‘luvchi tilxat shakli.',
    placeholders: ['Tuzilgan shahar', 'Qarz beruvchi F.I.Sh.', 'Qarz oluvchi F.I.Sh.', 'Qarz summasi', 'Qaytarish muddati'],
    proceduralContent: `QARZ SHARTNOMASI VA TILXAT

[Tuzilgan shahar] shahri                                      2026-yil "___" ____________

Biz, bir tomondan fuqaro [Qarz beruvchi F.I.Sh.], pasport: [Pasport seriya va raqami], yashash manzili: [Manzili] (keyingi o‘rinlarda "Qarz beruvchi"),
va ikkinchi tomondan fuqaro [Qarz oluvchi F.I.Sh.], pasport: [Pasport seriya va raqami], yashash manzili: [Manzili] (keyingi o‘rinlarda "Qarz oluvchi"),
quyidagilar to‘g‘risida mazkur shartnomani tuzdik:

1. SHARTNOMA PREDMETI
1.1. Qarz beruvchi Qarz oluvchiga [Qarz summasi] (so‘z bilan: [Summa so‘z bilan]) so‘m miqdoridagi pul mablag‘ini naqd / bank o‘tkazmasi shaklida topshirdi, Qarz oluvchi esa mazkur summani to‘liq qabul qilib oldi.
1.2. Qarz oluvchi ushbu qarz summasini 2026-yil "___" ____________ kunidan kechiktirmasdan Qarz beruvchiga to‘liq qaytarish majburiyatini oladi.

2. TOMONLARNING MAJBURIYATLARI VA JAVOBGARLIGI
2.1. Qarz mablag‘i qaytarilishi kechiktirilgan har bir kun uchun Qarz oluvchi Qarz beruvchiga qaytarilmagan summaning [0.1]% miqdorida penya to‘laydi.
2.2. Ushbu shartnoma O‘zbekiston Respublikasi Fuqarolik Kodeksining 732–736-moddalariga muvofiq tuzilgan bo‘lib, taraflar uchun qat‘iy majburiy kuchga ega.

3. NIZOLARNI HAL ETISH
3.1. Mazkur shartnomadan kelib chiqadigan nizolar qonun hujjatlariga muvofiq fuqarolik ishlari bo‘yicha sudda ko‘rib chiqiladi.

PUL MABLAG‘I QABUL QILINGANLIGI HAQIDA TILXAT:
Men, [Qarz oluvchi F.I.Sh.], yuqorida ko‘rsatilgan [Qarz summasi] so‘m pulni Qarz beruvchidan to‘liq va sanab oldim. E‘tirozim yo‘q.

Qarz beruvchi: ____________________ [Imzo va F.I.Sh.]
Qarz oluvchi:  ____________________ [Imzo va F.I.Sh.]`,
  },
  {
    id: 'shartnoma_ijara',
    title: 'Turar joyni (xonadon / hovli) ijaraga berish shartnomasi',
    category: 'shartnoma',
    categoryLabel: 'Shartnoma',
    codeRef: 'Fuqarolik Kodeksi 535, 573-580-moddalari; Soliq Kodeksi',
    description:
      'Turar joyni vaqtincha yashash uchun ijaraga berish, oylik to‘lov tartibi, kommunal to‘lovlar va mulkni asrash bo‘yicha tomonlarning javobgarligi.',
    placeholders: ['Shahar', 'Ijaraga beruvchi F.I.Sh.', 'Ijarachi F.I.Sh.', 'Turar joy manzili', 'Oylik ijara haqi', 'Ijara muddati'],
    proceduralContent: `TURAR JOY IJARA SHARTNOMASI

[Shahar] shahri                                             2026-yil "___" ____________

Mulkdor (Ijaraga beruvchi): [Ijaraga beruvchi F.I.Sh.], pasport: [Pasport ma‘lumotlari],
va Ijarachi: [Ijarachi F.I.Sh.], pasport: [Pasport ma‘lumotlari],
o‘rtasida quyidagi shartlar asosida shartnoma tuzildi:

1. SHARTNOMA PREDMETI
1.1. Ijaraga beruvchi o‘ziga xususiy mulk huquqi asosida tegishli bo‘lgan, [Turar joy manzili] manzilida joylashgan [Xonalar soni] xonali turar joyni Ijarachiga vaqtincha yashash uchun haq evaziga topshiradi.
1.2. Ijara muddati: 2026-yil "___" ____________ dan 2026-yil "___" ____________ gacha etib belgilandi.

2. IJARA HAQI VA TO‘LOV TARTIBI
2.1. Oylik ijara haqi miqdori [Oylik ijara haqi] so‘m qilib belgilandi.
2.2. To‘lov har oyning [To‘lov kuni]-sanasiga qadar naqd yoki bank kartasi orqali to‘lanadi.
2.3. Kommunal xizmatlar (elektr, gaz, suv, chiqindi) to‘lovlari [Tomon nomi] tomonidan amalga oshiriladi.

3. TOMONLARNING HUQUQ VA MAJBURIYATLARI
3.1. Ijarachi turar joyni toza saqlash, yong‘in va texnika xavfsizligiga rioya qilish majburiyatini oladi.
3.2. Ijarachi mulk egasining yozma roziligisiz xonadonni uchinchi shaxslarga qayta ijaraga berishga haqli emas.

Ijaraga beruvchi: ____________________ [Imzo va F.I.Sh.]
Ijarachi:         ____________________ [Imzo va F.I.Sh.]`,
  },
  {
    id: 'shartnoma_oldi_sotdi',
    title: 'Ko‘chmas mulk / Noturar joy oldi-sotdi shartnomasi',
    category: 'shartnoma',
    categoryLabel: 'Shartnoma',
    codeRef: 'Fuqarolik Kodeksi 479–488-moddalari',
    description:
      'Mulk huquqini sotuvchidan xaridorga o‘tkazish, mulk bahosi, to‘lov shakli, kadastr hujjatlari va mulkni topshirish shartlari.',
    placeholders: ['Shahar', 'Sotuvchi F.I.Sh.', 'Xaridor F.I.Sh.', 'Mulk kadastr raqami', 'Mulk manzili', 'Kelishilgan sotuv bahosi'],
    proceduralContent: `KO‘CHMAS MULK OLDI-SOTDI SHARTNOMASI

[Shahar] shahri                                             2026-yil "___" ____________

Sotuvchi: [Sotuvchi F.I.Sh.], pasport: [Pasport seriya va raqami],
va Xaridor: [Xaridor F.I.Sh.], pasport: [Pasport seriya va raqami],
quyidagilar haqida mazkur shartnomani tuzdilar:

1. SHARTNOMA PREDMETI
1.1. Sotuvchi o‘ziga tegishli bo‘lgan, [Mulk manzili] manzilida joylashgan, kadastr raqami [Mulk kadastr raqami] bo‘lgan ko‘chmas mulkni Xaridorga mulk qilib sotadi, Xaridor esa mulkni qabul qilib oladi va belgilangan pul summasini to‘laydi.
1.2. Ushbu mulkning sotuv bahosi tomonlarning o‘zaro kelishuvi bilan [Kelishilgan sotuv bahosi] so‘m deb belgilandi.

2. HISOB-KITOBLAR VA TOPSHIRISH TARTIBI
2.1. Xaridor ko‘rsatilgan summani shartnoma imzolangunga qadar to‘liq to‘ladi (yoki to‘lash grafigi bo‘yicha to‘laydi).
2.2. Mazkur shartnoma notarial tasdiqlangan va davlat ro‘yxatidan (Kadastr) o‘tkazilgan paytdan e‘tiboran qonuniy kuchga kiradi.

Sotuvchi: ____________________ [Imzo va F.I.Sh.]
Xaridor:  ____________________ [Imzo va F.I.Sh.]`,
  },

  // ── 3. SHIKOYATLAR VA ILTIMOSNOMALAR ──
  {
    id: 'shikoyat_apellatsiya',
    title: 'Birinchi instansiya sudi hal qiluv qarori ustidan Apellatsiya shikoyati',
    category: 'shikoyat',
    categoryLabel: 'Shikoyat',
    codeRef: 'Fuqarolik protsessual kodeksi 383, 385, 388-moddalari',
    description:
      'Qonuniy kuchga kirmagan birinchi instansiya sudi qarori ustidan yuqori sud instansiyasiga protsessual va moddiy qonun normalari buzilganligi asosi bilan shikoyat.',
    placeholders: ['Apellatsiya sudi nomi', 'Shikoyat beruvchi F.I.Sh.', 'Birinchi instansiya sudi', 'Ish raqami', 'Qaror sanasi', 'Qarorning bekor qilinishi lozim bo‘lgan sabablari'],
    proceduralContent: `[Apellatsiya sudi nomi] SUDINING FUQAROLIK ISHLARI BO‘YICHA SUDLOV HAY‘ATIGA

Shikoyat beruvchi (Da‘vogar / Javobgar): [Shikoyat beruvchi F.I.Sh.]
Manzili: [Manzili], Tel: [Telefon raqami]
Ishdagi boshqa taraf: [Boshqa taraf F.I.Sh.]
Manzili: [Manzili]

APELLATSIYA SHIKOYATI
([Birinchi instansiya sudi] ning [Qaror sanasi] dagi hal qiluv qarori ustidan)

[Birinchi instansiya sudi] tomonidan [Ish raqami]-sonli fuqarolik ishi ko‘rib chiqilib, [Qaror sanasi] da [Qarorning qisqa mazmuni] to‘g‘risida hal qiluv qarori chiqarilgan.

Mazkur hal qiluv qaroriga mutlaqo qo‘shilmayman, chunki sud ish holatlarini to‘liq o‘rganmagan va moddiy hamda protsessual huquq normalarini noto‘g‘ri qo‘llagan. Xususan, [Qarorning bekor qilinishi lozim bo‘lgan sabablari].

O‘zbekiston Respublikasi FPKning 383, 385, 399-moddalariga asosan,

SO‘RAYMAN:
[Birinchi instansiya sudi] ning [Qaror sanasi] dagi [Ish raqami]-sonli hal qiluv qarorini bekor qilishingizni va ish bo‘yicha yangi qonuniy qaror qabul qilishingizni.

Ilova:
1. Apellatsiya shikoyati nusxasi;
2. Hal qiluv qarori nusxasi;
3. Davlat boji to‘langanligi haqida kvitansiya;
4. Shikoyat vajlarini tasdiqlovchi dalillar.

Shikoyat beruvchi: ____________________ [Imzo va F.I.Sh.]
Sana: 2026-yil "___" ____________`,
  },
  {
    id: 'iltimosnoma_muddat',
    title: 'O‘tkazib yuborilgan da‘vo yoki protsessual muddatni tiklash to‘g‘risida iltimosnoma',
    category: 'shikoyat',
    categoryLabel: 'Iltimosnoma',
    codeRef: 'FPK 153-moddasi; FK 156-moddasi',
    description:
      'Kasallik, xizmat safari yoki boshqa uzrli holatlar tufayli o‘tkazib yuborilgan shikoyat berish yoki da‘vo muddatini qayta tiklash haqida sudga iltimosnoma.',
    placeholders: ['Sud nomi', 'Iltimosnoma beruvchi F.I.Sh.', 'O‘tkazib yuborilgan muddat sababi', 'Tasdiqlovchi hujjat nomi'],
    proceduralContent: `FUQAROLIK ISHLARI BO‘YICHA [Sud nomi] SUDIGA

Iltimosnoma beruvchi: [Iltimosnoma beruvchi F.I.Sh.]
Manzili: [Manzili], Tel: [Telefon raqami]

ILTIMOSNOMA
(O‘tkazib yuborilgan protsessual muddatni tiklash haqida)

[Sud nomi] sudining [Qaror sanasi] dagi qarori ustidan shikoyat berish muddati [O‘tkazib yuborilgan muddat sababi] sababli o‘tkazib yuborilgan. Mazkur holat ilova qilinayotgan [Tasdiqlovchi hujjat nomi] (masalan: statsionar davolanish haqida ma‘lumotnoma) bilan to‘liq tasdiqlanadi.

O‘zbekiston Respublikasi FPKning 153-moddasiga binoan, qonunda belgilangan muddat sud tomonidan uzrli deb topilgan sabablarga ko‘ra o‘tkazib yuborilgan bo‘lsa, u qayta tiklanishi mumkin.

Yuqoridagilarga asosan,

SO‘RAYMAN:
O‘tkazib yuborilgan shikoyat berish muddatini uzrli deb topib, mazkur muddatni qayta tiklashingizni.

Ilova:
1. Uzrli sabablarni tasdiqlovchi hujjat nusxasi;
2. Tayyorlangan shikoyat nusxasi.

Iltimosnoma beruvchi: ____________________ [Imzo va F.I.Sh.]
Sana: 2026-yil "___" ____________`,
  },

  // ── 4. ISHONCHNOMALAR VA DALOLATNOMALAR ──
  {
    id: 'ishonchnoma_sud',
    title: 'Sud organlarida ishonchli vakil sifatida qatnashish uchun ishonchnoma',
    category: 'ishonchnoma',
    categoryLabel: 'Ishonchnoma',
    codeRef: 'Fuqarolik protsessual kodeksi 66, 67-moddalari; FK 134–144-moddalari',
    description:
      'Sud jarayonida jismoniy yoki yuridik shaxs nomidan to‘liq huquqlar bilan (da‘vo berish, kelishuv tuzish, dalil taqdim etish) ishtirok etish uchun rasmiy ishonchnoma.',
    placeholders: ['Berilgan shahar', 'Ishonch bildiruvchi F.I.Sh.', 'Ishonchli vakil F.I.Sh.', 'Vakil pasport ma‘lumotlari', 'Amal qilish muddati'],
    proceduralContent: `ISHONCHNOMA
(Sudlarda vakillik qilish uchun)

[Berilgan shahar] shahri                                     2026-yil "___" ____________

Men, fuqaro [Ishonch bildiruvchi F.I.Sh.], pasport: [Pasport seriya va raqami], yashash manzili: [Manzili],
mazkur ishonchnoma orqali fuqaro [Ishonchli vakil F.I.Sh.] ga, pasport: [Vakil pasport ma‘lumotlari], yashash manzili: [Vakil manzili],
O‘zbekiston Respublikasining barcha fuqarolik, iqtisodiy va ma‘muriy sudlarida mening nomimdan barcha qonuniy huquqlar bilan ishtirok etish vakolatini beraman.

Ushbu ishonchnoma asosida vakil quyidagi protsessual harakatlarni amalga oshirish huquqiga ega:
- Mening nomimdan da‘vo arizasi va iltimosnomalar imzolash hamda sudga taqdim etish;
- Ish materiallari bilan to‘liq tanishish, dalillar taqdim etish;
- Da‘vo talablaridan butunlay yoki qisman voz kechish, da‘voni tan olish;
- Kelishuv bitimi tuzish va imzolash;
- Sud qarorlari ustidan apellatsiya, kassatsiya shikoyatlari berish;
- Ijro varaqasini undiruvga taqdim etish va ijro harakatlarida qatnashish.

Ishonchnoma [Amal qilish muddati] (masalan: bir yil) muddatga berildi.

Ishonch bildiruvchi: ____________________ [Imzo va F.I.Sh.]`,
  },
  {
    id: 'dalolatnoma_topshirish',
    title: 'Ko‘chmas mulk yoki tovar-moddiy boyliklarni qabul qilish-topshirish dalolatnomasi',
    category: 'ishonchnoma',
    categoryLabel: 'Dalolatnoma',
    codeRef: 'Fuqarolik Kodeksi 488, 540-moddalari',
    description:
      'Shartnoma asosida bino, inshoot, xonadon yoki asbob-uskunalarni haqiqiy holati va butligini qayd etgan holda bir tarafdan ikkinchi tarafga topshirish akti.',
    placeholders: ['Shahar', 'Topshiruvchi F.I.Sh.', 'Qabul qiluvchi F.I.Sh.', 'Mulk yoki tovar tavsifi', 'Mulkning texnik holati'],
    proceduralContent: `QABUL QILISH-TOPSHIRISH DALOLATNOMASI (AKT)

[Shahar] shahri                                             2026-yil "___" ____________

Biz, bir tomondan [Topshiruvchi F.I.Sh.] (Topshiruvchi),
va ikkinchi tomondan [Qabul qiluvchi F.I.Sh.] (Qabul qiluvchi),
2026-yil "___" ____________ dagi [Shartnoma nomi va raqami]-sonli shartnomaga asosan mazkur dalolatnomani tuzdik:

1. Topshiruvchi quyidagi mulkni (yoki tovarlarni) Qabul qiluvchiga topshirdi, Qabul qiluvchi esa ularni qabul qilib oldi:
   [Mulk yoki tovar tavsifi, soni, inventar raqami].

2. Mulkning texnik va amaldagi holati:
   [Mulkning texnik holati - soz, kamchiliklarsiz, foydalanishga yaroqli].

3. Qabul qiluvchi topshirilgan mulkning sifati, butligi va miqdori bo‘yicha Topshiruvchiga hech qanday e‘tiroz bildirmaydi.

Topshirdi: ____________________ [Imzo va F.I.Sh.]
Qabul qildi: ____________________ [Imzo va F.I.Sh.]`,
  },
]

export default function DocumentConstructorWorkspace() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeDoc, setActiveDoc] = useState<PracticeDocument>(VERIFIED_PRACTICE_DOCUMENTS[0])
  const [editedContent, setEditedContent] = useState<string>(VERIFIED_PRACTICE_DOCUMENTS[0].proceduralContent)
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  const filteredDocs = VERIFIED_PRACTICE_DOCUMENTS.filter(doc => {
    const matchCat = selectedCategory === 'all' || doc.category === selectedCategory
    const q = searchQuery.toLowerCase().trim()
    const matchQuery =
      !q ||
      doc.title.toLowerCase().includes(q) ||
      doc.codeRef.toLowerCase().includes(q) ||
      doc.description.toLowerCase().includes(q)
    return matchCat && matchQuery
  })

  const handleSelectDoc = (doc: PracticeDocument) => {
    setActiveDoc(doc)
    setEditedContent(doc.proceduralContent)
    setIsEditing(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(editedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${activeDoc.title}</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 14pt;
              line-height: 1.5;
              padding: 40px;
              color: #000;
              white-space: pre-wrap;
            }
            @page {
              size: A4;
              margin: 20mm;
            }
          </style>
        </head>
        <body>${editedContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const handleDownloadTxt = () => {
    const blob = new Blob([editedContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeDoc.id}_namunasi.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPdf = async () => {
    try {
      setGeneratingPdf(true)
      const pdfDoc = await PDFDocument.create()
      const font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
      const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

      // A4 dimensions
      const pageWidth = 595.28
      const pageHeight = 841.89
      const margin = 50
      const contentWidth = pageWidth - margin * 2

      let page = pdfDoc.addPage([pageWidth, pageHeight])
      let y = pageHeight - margin

      const lines = editedContent.split('\n')
      const fontSize = 11
      const lineHeight = 16

      // Simple ASCII cleaner for standard PDF fonts
      const cleanLine = (str: string) => {
        return str
          .replace(/‘|’|ʻ|ʼ|`/g, "'")
          .replace(/“|”/g, '"')
          .replace(/—|–/g, '-')
      }

      for (const rawLine of lines) {
        const text = cleanLine(rawLine)

        // Split long lines if needed
        const words = text.split(' ')
        let currentLine = ''

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word
          const width = font.widthOfTextAtSize(testLine, fontSize)

          if (width > contentWidth && currentLine) {
            if (y < margin + lineHeight) {
              page = pdfDoc.addPage([pageWidth, pageHeight])
              y = pageHeight - margin
            }
            page.drawText(currentLine, {
              x: margin,
              y,
              size: fontSize,
              font,
              color: rgb(0.1, 0.1, 0.1),
            })
            y -= lineHeight
            currentLine = word
          } else {
            currentLine = testLine
          }
        }

        if (currentLine) {
          if (y < margin + lineHeight) {
            page = pdfDoc.addPage([pageWidth, pageHeight])
            y = pageHeight - margin
          }
          page.drawText(currentLine, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0.1, 0.1, 0.1),
          })
          y -= lineHeight
        } else {
          y -= lineHeight * 0.7
        }
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${activeDoc.id}_namunasi.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('PDF generation error:', e)
      // Fallback to text download
      handleDownloadTxt()
    } finally {
      setGeneratingPdf(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              Rasmiy Da‘vo Arizalari va Shartnomalar Konstruktori
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-2xl">
              Sud amaliyoti va qonunchilik talablariga mos tayyor yuridik hujjatlar. Barcha hujjatlarni to‘g‘ridan-to‘g‘ri sayt ichida ko‘rish, tahrirlash, chop etish va PDF/Word formatida yuklab olishingiz mumkin.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Amaldagi Qonunchilik
            </span>
          </div>
        </div>

        {/* Search and Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Hujjat nomi yoki kalit so‘z (masalan: Qarz undirish, Nikohni bekor qilish, Ijara shartnomasi)..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              aria-label="Hujjat toifasi"
              className="px-3.5 py-2.5 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Barcha hujjatlar ({VERIFIED_PRACTICE_DOCUMENTS.length})</option>
              <option value="davo">Da‘vo arizalari & Sud buyrug‘i</option>
              <option value="shartnoma">Shartnomalar & Tilxatlar</option>
              <option value="shikoyat">Shikoyat & Iltimosnomalar</option>
              <option value="ishonchnoma">Ishonchnoma & Dalolatnomalar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Document List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 px-1 font-medium">
            <span>Hujjatlar ro‘yxati ({filteredDocs.length} ta)</span>
            <span>Tanlang va tahrirlang</span>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredDocs.map(doc => {
              const isSelected = activeDoc.id === doc.id
              return (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-sm'
                      : 'bg-white dark:bg-zinc-900 border-gray-200/80 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                      {doc.categoryLabel}
                    </span>
                    <span className="text-[11px] font-mono text-gray-400">
                      {doc.codeRef.split(';')[0]}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-snug mb-1.5">
                    {doc.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {doc.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Interactive Document Canvas & Tools */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-sm p-6 space-y-5">
          {/* Document Header & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-amber-400">
                {activeDoc.categoryLabel} namunalari
              </span>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mt-0.5">
                {activeDoc.title}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                Huquqiy asos: {activeDoc.codeRef}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  isEditing
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:bg-gray-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isEditing ? 'Ko‘rish rejimi' : 'Tahrirlash'}
              </button>

              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 transition-colors"
                title="Matndan nusxa olish"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Nusxalandi' : 'Nusxa olish'}
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 transition-colors"
                title="Chop etish"
              >
                <Printer className="w-3.5 h-3.5" />
                Chop etish
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={generatingPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {generatingPdf ? 'PDF...' : 'PDF yuklash'}
              </button>
            </div>
          </div>

          {/* Document Canvas (A4 Paper Aesthetic) */}
          <div className="relative">
            {isEditing ? (
              <div>
                <div className="text-[11px] text-gray-500 dark:text-zinc-400 mb-2 flex items-center justify-between">
                  <span>Matnni o‘zingizning ma‘lumotlaringiz bilan to‘g‘ridan-to‘g‘ri o‘zgartirishingiz mumkin:</span>
                  <button
                    onClick={() => setEditedContent(activeDoc.proceduralContent)}
                    className="text-blue-600 hover:underline text-[11px]"
                  >
                    Dastlabki holatga qaytarish
                  </button>
                </div>
                <textarea
                  value={editedContent}
                  onChange={e => setEditedContent(e.target.value)}
                  rows={24}
                  className="w-full p-5 font-serif text-xs sm:text-sm leading-relaxed bg-white dark:bg-zinc-950 border border-blue-400 dark:border-blue-700 rounded-2xl text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner resize-y"
                />
              </div>
            ) : (
              <div className="p-6 sm:p-8 bg-slate-50 dark:bg-zinc-950/80 border border-gray-200/90 dark:border-zinc-800 rounded-2xl font-serif text-xs sm:text-sm text-gray-900 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-[620px] overflow-y-auto shadow-inner select-text">
                {editedContent}
              </div>
            )}
          </div>

          {/* Placeholders Guide */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
            <span className="font-bold">Eslatma:</span> Hujjatdagi to‘rtburchak qavs ichidagi <code className="bg-white/80 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono font-semibold">[Ism, Summa, Manzil]</code> kabi so‘zlar joyiga o‘zingizning tegishli faktik ma‘lumotlaringizni kiritib, <strong>PDF</strong> yoki <strong>Chop etish</strong> tugmasi orqali tayyor rasmiy hujjatni olishingiz mumkin.
          </div>
        </div>
      </div>
    </div>
  )
}
