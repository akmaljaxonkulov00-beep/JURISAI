export interface SeedCase {
  id: string
  title: string
  category:
    | 'fuqarolik'
    | 'jinoyat'
    | 'mehnat'
    | 'oila'
    | 'iqtisodiy'
    | 'ma’muriy'
    | 'konstitutsiyaviy'
    | string
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  law_references: string[]
  key_questions?: string[]
}

export const SEED_IRAC_CASES: SeedCase[] = [
  // ==========================================
  // FUQAROLIK HUQUQI (CIVIL LAW) - 10 CASES
  // ==========================================
  {
    id: 'civ-001',
    title: "Ko'chmas mulk oldi-sotdi shartnomasini haqiqiy emas deb topish",
    category: 'fuqarolik',
    difficulty: 'medium',
    description:
      "Fuqaro A. o'ziga tegishli turar-joy xonadonini fuqaro B.ga notarial tasdiqlangan oldi-sotdi shartnomasi orqali sotgan. Biroq, shartnoma tuzilgan vaqtda fuqaro A. spirtli ichimliklar ta'sirida bo'lgan va o'z harakatlarining oqibatini to'liq anglamaganini da'vo qilib, sudga shartnomani haqiqiy emas deb topish to'g'risida da'vo arizasi kiritgan. Sud-tibbiy ekspertizasi fuqaro A.da surunkali alkogolizm asoratlari mavjudligini, ammo muomala layoqatidan mahrum etilmaganini aniqladi.",
    law_references: [
      "O'zbekiston Respublikasi Fuqarolik Kodeksi 113, 116, 121-moddalari",
      "O'zbekiston Respublikasi Oliy Sudi Plenumi Qarorlari",
    ],
    key_questions: [
      "Fuqaro A.ning bitim paytidagi holati bitimni haqiqiy emas deb topishga asos bo'ladimi?",
      "FK 121-moddasini qo'llash shartlari qanday?",
    ],
  },
  {
    id: 'civ-002',
    title: "Qarz shartnomasi bo'yicha foizlar va penya undirish",
    category: 'fuqarolik',
    difficulty: 'easy',
    description:
      "Fuqaro K. fuqaro M.ga tilxat asosida 50 000 000 so'm qarz bergan. Tilxatda qarz 6 oy muddatda qaytarilishi, har kechiktirilgan kun uchun 0.5% penya to'lanishi ko'rsatilgan. Qarz muddati tugaganidan keyin 1 yil o'tib, M. qarzni qaytarmagan. K. suddan asosiy qarz, 90 000 000 so'm penya va inflyatsiya zararini undirishni so'ramoqda.",
    law_references: [
      "O'zbekiston Respublikasi Fuqarolik Kodeksi 732, 734, 735, 327, 385-moddalari",
    ],
    key_questions: [
      'Tilxat yozma qarz shartnomasi kuchiga egami?',
      'Sud penya miqdorini asossiz yuqori deb kamaytirishi mumkinmi (FK 326-modda)?',
    ],
  },
  {
    id: 'civ-003',
    title: "Yetkazilgan moddiy va ma'naviy zararni qoplash (Yo'l-transport hodisasi)",
    category: 'fuqarolik',
    difficulty: 'medium',
    description:
      "Toshkent shahrida avtomashina haydovchisi R. qizil chiroqqa o'tib, piyodalar o'tish joyida fuqaro G.ni urib yuborgan. Oqibatda G. og'ir tan jarohati olib, 3 oy shifoxonada davolangan. G. davolanish xarajatlari (25 mln so'm), boy berilgan ish haqi (15 mln so'm) va 50 mln so'm ma'naviy zarar undirish bo'yicha da'vo kiritgan. Avtomobil R.ga ishonchnoma asosida tegishli bo'lib, egasi D. hisoblanadi.",
    law_references: ["O'zbekiston Respublikasi Fuqarolik Kodeksi 985, 999, 1021, 1022-moddalari"],
    key_questions: [
      'Zararni kim qoplashi kerak — haydovchi R.mi yoki mulk egasi D.mi?',
      "Ma'naviy zarar miqdori sud tomonidan qanday mezonlar asosida belgilanadi?",
    ],
  },
  {
    id: 'civ-004',
    title: "Iste'molchi huquqlarini himoya qilish: Sifatsiz maishiy texnika",
    category: 'fuqarolik',
    difficulty: 'easy',
    description:
      "Xaridor do'kondan 12 million so'mga qimmatbaho muzlatgich xarid qildi. 2 hafta ichida muzlatgich sovutishni to'xtatdi. Do'kon ma'muriyati kafolat xizmati faqat ta'mirlash bilan cheklanishini, tovar almashtirilmasligini yoki pul qaytarilmasligini ma'lum qildi. Xaridor tovar pulini to'liq qaytarish va 1% kunlik kechiktirish jarimasi talab qilmoqda.",
    law_references: [
      "O'zbekiston Respublikasi 'Iste'molchilarning huquqlarini himoya qilish to'g'risida'gi Qonuni 13, 14, 19-moddalari",
      'FK 422-moddasi',
    ],
    key_questions: [
      "Iste'molchining nuqsonli tovar aniqlanganda qanday mutlaq huquqlari mavjud?",
      "Do'konning ta'mirlash bilan cheklanish haqidagi talabi qonuniymi?",
    ],
  },
  {
    id: 'civ-005',
    title: 'Meros taqsimoti va vasiyatnomaning haqiqiyligi',
    category: 'fuqarolik',
    difficulty: 'hard',
    description:
      "Marhum fuqaro S. barcha mol-mulkini (uy-joy va jamg'armalar) begona fuqaro T.ga vasiyat qilib qoldirgan. Ammo marhumning qaramog'ida bo'lgan 70 yoshli nogiron onasi va voyaga yetmagan 14 yoshli o'g'li merosdan mahrum etilgan. Marhumning qonuniy merosxo'rlari vasiyatnomaga qaramay merosdan majburiy ulush talab qilib sudga murojaat qilishdi.",
    law_references: ["O'zbekiston Respublikasi Fuqarolik Kodeksi 1118, 1142, 1146-moddalari"],
    key_questions: [
      'Merosda majburiy ulush huquqi kimlarga tegishli?',
      'Majburiy ulush miqdori qonuniy meros ulushiga nisbatan qanday hisoblanadi?',
    ],
  },
  {
    id: 'civ-006',
    title:
      "Mulkdorning o'zganing noqonuniy egaligidan mol-mulkni talab qilib olishi (Vindformatsiya)",
    category: 'fuqarolik',
    difficulty: 'hard',
    description:
      "Fuqaro O.ga tegishli avtomobil firibgarlik yo'li bilan soxta hujjatlar asosida uchinchi shaxs P.ga sotib yuborilgan. P. avtomobilni o'z navbatida vijdonli xaridor Q.ga bozor bahosida sotgan. O. avtomobilni Q.dan qaytarib olish to'g'risida da'vo qo'zg'atdi. Q. esa o'zining vijdonli xaridor ekanligini ta'kidlamoqda.",
    law_references: ["O'zbekiston Respublikasi Fuqarolik Kodeksi 228, 229, 230-moddalari"],
    key_questions: [
      'Mulk egasining ixtiyoridan tashqari chiqib ketgan mulk vijdonli egallovchidan qaytarib olinadimi?',
      'Vijdonli egallovchining huquqlari qanday himoya qilinadi?',
    ],
  },
  {
    id: 'civ-007',
    title: 'Ijara shartnomasini muddatidan oldin bekor qilish va zararni undirish',
    category: 'fuqarolik',
    difficulty: 'medium',
    description:
      "Kompaniya savdo markazidagi do'konni 3 yil muddatga ijaraga olgan. 1 yil o'tgach, bozor kon'yunkturasi o'zgarganini sabab qilib, ijarachi 1 oy oldin ogohlantirish berib shartnomani bekor qilganini e'lon qildi va xonani bo'shatdi. Ijaraga beruvchi qolgan 2 yillik ijara haqini va xonaning bo'sh qolishi oqibatidagi zararni talab qilmoqda.",
    law_references: ["O'zbekiston Respublikasi Fuqarolik Kodeksi 382, 551, 552, 555-moddalari"],
    key_questions: [
      'Ijarachi shartnomani bir tomonlama bekor qilishga haqlimi?',
      'Ijaraga beruvchi boy berilgan foydani undirib ololadimi?',
    ],
  },
  {
    id: 'civ-008',
    title: 'Mualliflik huquqining buzilishi va tovon puli talabi',
    category: 'fuqarolik',
    difficulty: 'medium',
    description:
      "Fotograf X. tomonidan olingan noyob shahar manzarasi fotosurati reklama agentligi Y. tomonidan muallifning ruxsatisiz va ismini ko'rsatmasdan tijorat bannerlarida hamda veb-saytda ishlatilgan. Muallif X. fotosuratdan foydalanishni to'xtatish, mualliflik huquqini tan olish va 100 mln so'm tovon puli undirish talabi bilan chiqqan.",
    law_references: [
      "O'zbekiston Respublikasi 'Mualliflik huquqi va turdosh huquqlar to'g'risida'gi Qonuni 18, 19, 65-moddalari",
      'FK 1041-moddasi',
    ],
    key_questions: [
      'Mualliflik asaridan ruxsatsiz foydalanish oqibatlari qanday?',
      "Zarar o'rniga tovon (kompensatsiya) undirish tartibi qanday?",
    ],
  },
  {
    id: 'civ-009',
    title: "Servitut belgilash: Qo'shni yer uchastkasidan o'tish huquqi",
    category: 'fuqarolik',
    difficulty: 'easy',
    description:
      "Fuqaro N.ning yer uchastkasiga umumiy foydalanishdagi yo'ldan kirishning yagona imkoni qo'shnisi V.ning yer uchastkasi orqali o'tish hisoblanadi. Qo'shni V. o'z hududini to'liq devor bilan o'rab olgan va N.ga o'tishga ruxsat bermayapti. N. majburiy servitut o'rnatish to'g'risida sudga murojaat qilgan.",
    law_references: [
      "O'zbekiston Respublikasi Fuqarolik Kodeksi 173-moddasi",
      "O'zbekiston Respublikasi Yer Kodeksi 30-moddasi",
    ],
    key_questions: [
      'Qanday hollarda servitut sud tartibida majburiy belgilanadi?',
      "Servitut uchun to'lov to'lanishi shartmi?",
    ],
  },
  {
    id: 'civ-010',
    title: "Kafillik shartnomasi bo'yicha kafildan qarz undirish",
    category: 'fuqarolik',
    difficulty: 'medium',
    description:
      "Bank qarzdorga 200 mln so'm kredit ajratgan, kafil esa solidar javobgarlik bo'yicha kafillik bergan. Qarzdor 4 oy davomida to'lovlarni to'lamay xorijga chiqib ketgan. Bank to'g'ridan-to'g'ri kafilning mol-mulkiga qaratilgan da'vo kiritgan. Kafil avvalo asosiy qarzdorning garovdagi mulkini sotishni talab qilmoqda.",
    law_references: ["O'zbekiston Respublikasi Fuqarolik Kodeksi 292, 293, 294, 298-moddalari"],
    key_questions: [
      'Solidar va subsidiar kafillikning farqi nima?',
      "Kafil asosiy qarzni to'lagach, qanday huquqlarga ega bo'ladi?",
    ],
  },

  // ==========================================
  // JINOYAT HUQUQI (CRIMINAL LAW) - 10 CASES
  // ==========================================
  {
    id: 'crim-001',
    title: "Firibgarlik va o'zganing mulkini o'zlashtirish chegarasi",
    category: 'jinoyat',
    difficulty: 'hard',
    description:
      "Kompaniya menejeri J. mijozlardan tovar yetkazib berish uchun jami 150 mln so'm naqd pul olgan. Pulni kompaniya hisobiga topshirmasdan, o'zining shaxsiy ehtiyojlariga sarflab yuborgan va mijozlarga soxta to'lov kvitansiyalarini bergan. Tergov organi harakatni JK 168-modda (Firibgarlik) deb baholagan, himoyachi esa JK 167-modda (O'zlashtirish yoki rastrata qilish) bo'yicha qayta malakalashni talab qilmoqda.",
    law_references: [
      "O'zbekiston Respublikasi Jinoyat Kodeksi 167, 168-moddalari",
      "Oliy Sud Plenumi qarori 'Firibgarlik ishlari bo'yicha sud amaliyoti to'g'risida'",
    ],
    key_questions: [
      "Ishonib topshirilgan mulkni talon-toroj qilish bilan aldash yo'li bilan mulkni egallashning farqi nimada?",
      "Harakat qaysi modda bilan to'g'ri malakalanadi?",
    ],
  },
  {
    id: 'crim-002',
    title: 'Zaruriy mudofaa va uning chegarasidan chetga chiqish',
    category: 'jinoyat',
    difficulty: 'hard',
    description:
      "Tungi vaqtda fuqaro E.ning uyiga pichoq bilan qurollangan niqobli shaxs bostirib kirgan. E. oshxonadan bolg'a olib, bosqinchining boshiga bir necha zarba bergan. Oqibatda bosqinchi olgan jarohatlaridan shifoxonada vafot etgan. Prokuratura E.ga nisbatan JK 104-moddasi 3-qismi 'd' bandi (qasddan badanga og'ir shikast yetkazish o'limga sabab bo'lishi) bilan ayblov e'lon qildi.",
    law_references: ["O'zbekiston Respublikasi Jinoyat Kodeksi 37, 38, 100, 104-moddalari"],
    key_questions: [
      "Qurolli hujum vaqtida hayotga tajovuz bo'lganda zaruriy mudofaa chegarasi bormi?",
      "JK 37-moddasi talablari bo'yicha E. jinoiy javobgarlikdan to'liq ozod qilinadimi?",
    ],
  },
  {
    id: 'crim-003',
    title: "Yo'l harakati xavfsizligi qoidalarini buzish oqibatida o'lim yetkazish",
    category: 'jinoyat',
    difficulty: 'medium',
    description:
      "Haydovchi Z. shahar ichida belgilangan 60 km/soat tezlik o'rniga 95 km/soat tezlikda harakatlanib, mast holatda bo'lgan piyodani urib yuborgan. Piyoda voqea joyida halok bo'lgan. Sud-avtotexnika ekspertizasi haydovchi belgilangan tezlikda harakatlangan taqdirda ham tormoz berib to'xtashga ulgura olmasligini xulosa qilgan.",
    law_references: [
      "O'zbekiston Respublikasi Jinoyat Kodeksi 266-moddasi 2-qismi",
      "Yo'l Harakati Qoidalari",
    ],
    key_questions: [
      "Haydovchining tezlikni oshirishi va o'lim o'rtasida to'g'ridan-to'g'ri sababiy bog'lanish bormi?",
      'Jabrlanuvchining qoidabuzarligi haydovchining aybini yengillashtiradimi?',
    ],
  },
  {
    id: 'crim-004',
    title: 'Pora berishga dalolat qilish va firibgarlik',
    category: 'jinoyat',
    difficulty: 'medium',
    description:
      "Fuqaro U. fuqaro F.ga o'zining OTMdagi yuqori martabali tanishlari orqali uning o'g'lini o'qishga kiritib qo'yishni va'da qilib, 5000 AQSH dollari olgan. Aslida U.ning hech qanday tanishi bo'lmagan va pulni o'z ehtiyojlariga ishlatgan. DXX tomonidan U. pulni olayotgan paytda ushlangan.",
    law_references: ["O'zbekiston Respublikasi Jinoyat Kodeksi 168-moddasi, 28, 211-moddalari"],
    key_questions: [
      'Pora berishda vositachilik, poraga dalolat qilish va firibgarlik qanday farqlanadi?',
      'Qilmish JK 168 va 28, 211-moddalar jami bilan malakalanadimi?',
    ],
  },
  {
    id: 'crim-005',
    title: "Kiberjinoyatchilik: Bank kartasidan mablag'larni o'g'irlash",
    category: 'jinoyat',
    difficulty: 'medium',
    description:
      "Shaxs X. soxta havola (fishing sayt) orqali fuqaro Y.ning bank karta ma'lumotlari va SMS-kodini qo'lga kiritib, karta hisobidagi 18 mln so'm mablag'ni o'zining elektron hamyoniga o'tkazib olgan va kriptovalyutaga aylantirgan.",
    law_references: [
      "O'zbekiston Respublikasi Jinoyat Kodeksi 169-moddasi 3-qismi 'b' bandi (axborot tizimlariga noqonuniy kirib o'g'rilik sodir etish)",
    ],
    key_questions: [
      "Karta hisobidan ruxsatsiz pul yechish firibgarlikmi yoki o'g'rilik?",
      "Axborot texnologiyalaridan foydalanib o'g'irlik qilishning og'irlashtiruvchi belgilari nimalar?",
    ],
  },
  {
    id: 'crim-006',
    title: "Mansab vakolatini suiiste'mol qilish va mansab soxtakorligi",
    category: 'jinoyat',
    difficulty: 'hard',
    description:
      "Davlat tashkiloti rahbari Q. tender o'tkazmasdan o'zining yaqin qarindoshiga tegishli MCHJ bilan shartnoma imzolagan va bajarilmagan ishlar uchun 400 mln so'm mablag'ni o'tkazib bergan, hisobotlarga esa soxta ma'lumotlar kiritgan.",
    law_references: ["O'zbekiston Respublikasi Jinoyat Kodeksi 205, 207, 209-moddalari"],
    key_questions: [
      "Mansab vakolatini suiiste'mol qilish va hokimiyat harakatsizligining farqi?",
      "Tashkilotga yetkazilgan juda ko'p miqdordagi zarar qanday malakalanadi?",
    ],
  },
  {
    id: 'crim-007',
    title: 'Bezorilik va qasddan badanga yengil shikast yetkazish',
    category: 'jinoyat',
    difficulty: 'easy',
    description:
      "Jamoat transportida fuqaro A. hech bir sababsiz boshqa yo'lovchi B.ni haqorat qilib, yuziga musht tushirgan va uning burun suyagini sindirgan. A. bu ishni shaxsiy adovat tufayli qilmaganini, kayfiyati yomon bo'lganini aytgan.",
    law_references: ["O'zbekiston Respublikasi Jinoyat Kodeksi 277-moddasi (Bezorilik)"],
    key_questions: [
      'Jamiyatda yurish-turish qoidalarini qasddan mensimaslik qanday aniqlanadi?',
      'JK 109 va 277-moddalarning raqobati qanday hal etiladi?',
    ],
  },
  {
    id: 'crim-008',
    title: "Giyohvandlik vositalarini o'tkazish maqsadsiz saqlash",
    category: 'jinoyat',
    difficulty: 'medium',
    description:
      "Shaxs tekshirilganda uning yonidan 1.2 gramm sintetik giyohvandlik vositasi (mefedron) topilgan. Shaxs vositani faqat o'zi iste'mol qilish uchun sotib olganini, sotish maqsadi bo'lmaganini ta'kidlamoqda. Tergov esa miqdor ko'pligini aytib o'tkazish maqsadini taxmin qilmoqda.",
    law_references: [
      "O'zbekiston Respublikasi Jinoyat Kodeksi 273, 276-moddalari",
      "Vazirlar Mahkamasining giyohvandlik vositalari miqdorlari bo'yicha qarori",
    ],
    key_questions: [
      "O'tkazish maqsadi qanday dalillar bilan isbotlanishi shart?",
      "Giyohvand moddalarning oz, ko'p va juda ko'p miqdorlari qanday belgilanadi?",
    ],
  },
  {
    id: 'crim-009',
    title: 'Jinoiy faoliyatdan olingan daromadlarni legallashtirish',
    category: 'jinoyat',
    difficulty: 'hard',
    description:
      "Shaxs noqonuniy valyuta qimmatliklari savdosi va kontrabandadan topilgan 2 mlrd so'm mablag'ni turli uchinchi shaxslar nomiga ochilgan firmalar orqali ko'chmas mulk va qimmatbaho avtomobillar sotib olishga yo'naltirgan.",
    law_references: [
      "O'zbekiston Respublikasi Jinoyat Kodeksi 243-moddasi (Jinoiy faoliyatdan olingan daromadlarni legallashtirish)",
    ],
    key_questions: [
      'Predmetning jinoiy kelib chiqishini yashirish usullari qanday isbotlanadi?',
      'JK 243-modda mustaqil jinoyat tarkibi hisoblanadimi?',
    ],
  },
  {
    id: 'crim-010',
    title: "Ehtiyotsizlik orqasida o'limga sabab bo'lish",
    category: 'jinoyat',
    difficulty: 'easy',
    description:
      "Qurilish maydoni boshlig'i xavfsizlik to'rlarini o'rnatmaganligi sababli, balandlikda ishlayotgan ishchi yiqilib tushib vafot etgan. Boshliq xodimning o'zi ehtiyotsizlik qilganini da'vo qilmoqda.",
    law_references: [
      "O'zbekiston Respublikasi Jinoyat Kodeksi 257-moddasi (Mehnatni muhofaza qilish qoidalarini buzish)",
    ],
    key_questions: [
      "Xavfsizlik texnikasiga mas'ul shaxsning javobgarligi chegarasi qanday?",
      'Ishchining ehtiyotsizligi rahbarning jinoiy javobgarligini istisno qiladimi?',
    ],
  },

  // ==========================================
  // MEHNAT HUQUQI (LABOR LAW) - 10 CASES
  // ==========================================
  {
    id: 'lab-001',
    title: 'Mehnat shartnomasini ish beruvchining tashabbusi bilan asossiz bekor qilish',
    category: 'mehnat',
    difficulty: 'medium',
    description:
      "Xodim kasallik varaqasi asosida 10 kun davolanishda bo'lgan davrda ish beruvchi uning mehnat shartnomasini shtat qisqarishi vaji bilan bekor qilgan. Xodim ishga tiklash, majburiy progul vaqtiga haq to'lash va ma'naviy zarar talab qilib sudga da'vo kiritgan.",
    law_references: [
      "O'zbekiston Respublikasi Mehnat Kodeksi (yangi tahrir) 161, 163, 171, 443-moddalari",
    ],
    key_questions: [
      "Xodim vaqtincha mehnatga layoqatsiz bo'lgan davrda mehnat shartnomasini bekor qilish mumkinmi?",
      "Ishga tiklanganda xodimga qanday to'lovlar undirib beriladi?",
    ],
  },
  {
    id: 'lab-002',
    title: 'Homilador ayol bilan muddatli mehnat shartnomasini bekor qilish',
    category: 'mehnat',
    difficulty: 'easy',
    description:
      "Kompaniyada 1 yillik muddatli shartnoma asosida ishlayotgan xodim ayolning shartnoma muddati tugashidan 1 oy oldin homiladorligi ma'lum bo'ldi. Ish beruvchi muddat tugashi munosabati bilan shartnomani bekor qilish haqida xabarnoma bergan.",
    law_references: ["O'zbekiston Respublikasi Mehnat Kodeksi 408, 409-moddalari"],
    key_questions: [
      'Homilador ayol bilan muddatli shartnoma tugaganda ish beruvchining majburiyati qanday?',
      "Qanday hollarda homilador ayolni ishdan bo'shatishga qonunan yo'l qo'yiladi?",
    ],
  },
  {
    id: 'lab-003',
    title: "Ish vaqtidan tashqari ishlar va dam olish kunlaridagi mehnatga haq to'lash",
    category: 'mehnat',
    difficulty: 'easy',
    description:
      "Dasturchi kompaniyada 6 oy davomida har shanba va yakshanba kunlari hamda ish kunlari 3 soatdan ortiqcha ishlagan. Ish beruvchi ichki buyruq bo'lmagani va bu o'z ixtiyori bilan qilinganini aytib qo'shimcha haq to'lashdan bosh tortgan. Dasturchida tizimga kirish loglari va topshiriq xatlari mavjud.",
    law_references: ["O'zbekiston Respublikasi Mehnat Kodeksi 187, 190, 196, 262-moddalari"],
    key_questions: [
      'Ish vaqtidan tashqari ishga jalb qilish tartibi qanday?',
      "Qo'shimcha soatlar uchun to'lov qanday miqdorda (kamida 2 hissa) hisoblanadi?",
    ],
  },
  {
    id: 'lab-004',
    title: "Intizomiy jazo qo'llash tartibining buzilishi",
    category: 'mehnat',
    difficulty: 'medium',
    description:
      "Xodim ishga 40 daqiqa kechikib kelgani uchun unga o'sha kunning o'zidayoq 'hayfsan' e'lon qilingan va oylik maoshining 30% miqdorida jarima solingan. Ish beruvchi xodimdan yozma tushuntirish xati olmagan.",
    law_references: ["O'zbekiston Respublikasi Mehnat Kodeksi 312, 313, 315-moddalari"],
    key_questions: [
      'Intizomiy jazo berishdan oldin yozma tushuntirish talab qilish majburiymi?',
      "Bir nojo'ya harakat uchun birdaniga ikkita jazo (hayfsan + jarima) qo'llash mumkinmi?",
    ],
  },
  {
    id: 'lab-005',
    title: "Xodimning to'liq moddiy javobgarligi shartnomasi",
    category: 'mehnat',
    difficulty: 'medium',
    description:
      "Omborxona mudiri bilan to'liq moddiy javobgarlik shartnomasi tuzilgan. Inventarizatsiya natijasida 80 mln so'mlik tovar kamomadi aniqlangan. Mudir omborxona qulfi buzilgani va signalizatsiya ishlamaganini aytib, kamomad o'z aybi bilan bo'lmaganini da'vo qilmoqda.",
    law_references: ["O'zbekiston Respublikasi Mehnat Kodeksi 338, 340, 343-moddalari"],
    key_questions: [
      'Ish beruvchining tovar saqlanishi uchun zarur sharoit yaratish majburiyati bormi?',
      "Mudir to'liq moddiy javobgarlikdan qanday hollarda ozod bo'ladi?",
    ],
  },
  {
    id: 'lab-006',
    title: 'Masofaviy (remote) ish rejimida mehnat shartnomasini bekor qilish',
    category: 'mehnat',
    difficulty: 'hard',
    description:
      "Masofaviy ishchi ish beruvchining xabarlariga 2 kun davomida javob bermagani uchun ish beruvchi uni 'ishga sababsiz kelmaganlik (progul)' asosi bilan ishdan bo'shatgan. Xodim internet aloqasi uzilib qolganini tasdiqlovchi provayder ma'lumotnomasini taqdim etgan.",
    law_references: ["O'zbekiston Respublikasi Mehnat Kodeksi 452, 459, 460-moddalari"],
    key_questions: [
      "Masofaviy xodimga progul tushunchasi qanday qo'llaniladi?",
      "Aloqa o'rnatilmaganligi shartnomani bekor qilishga yetarli asos bo'ladimi?",
    ],
  },
  {
    id: 'lab-007',
    title: "Sinov muddati davrida ishdan bo'shatish",
    category: 'mehnat',
    difficulty: 'easy',
    description:
      "Xodim 3 oylik sinov muddati bilan ishga qabul qilingan. Sinov muddatining 80-kunida ish beruvchi hech qanday sabab va asos ko'rsatmasdan xodimga sinovdan o'tmagani haqida xat berib, shartnomani bekor qilgan.",
    law_references: ["O'zbekiston Respublikasi Mehnat Kodeksi 129, 131, 132-moddalari"],
    key_questions: [
      "Sinov muddati natijasi salbiy bo'lganda ish beruvchi sabablarni asoslab berishi shartmi?",
      'Sinov muddati davrida ogohlantirish muddati qancha (kamida 3 kun)?',
    ],
  },
  {
    id: 'lab-008',
    title: "Kasb kasalligi oqibatida sog'liqqa yetkazilgan zararni qoplash",
    category: 'mehnat',
    difficulty: 'hard',
    description:
      "Kimyo zavodida 15 yil ishlagan xodimda o'pka kasalligi (kasb kasalligi) aniqlanib, 2-guruh nogironligi belgilangan. Zavod ma'muriyati barcha himoya vositalari berilganini vaj qilib, xodimga bir yo'la to'lanadigan nafaqa va har oylik kompensatsiyani to'lashdan bosh tortgan.",
    law_references: [
      "O'zbekiston Respublikasi Mehnat Kodeksi 349, 350-moddalari",
      'Vazirlar Mahkamasining 60-sonli Qarori',
    ],
    key_questions: [
      "Kasb kasalligida ish beruvchining aybidan qat'i nazar zarar qoplanadimi?",
      "Bir yo'la beriladigan tovon puli qanday hisoblanadi?",
    ],
  },
  {
    id: 'lab-009',
    title: "Xodimni boshqa ishga o'tkazishning qonuniyligi",
    category: 'mehnat',
    difficulty: 'medium',
    description:
      "Bosh buxgalter o'z roziligisiz va mutaxassisligiga to'g'ri kelmaydigan boshqa bo'limga oddiy iqtisodchi lavozimiga 'ishlab chiqarish zarurati' vaji bilan 3 oy muddatga o'tkazilgan va maoshi kamaytirilgan.",
    law_references: ["O'zbekiston Respublikasi Mehnat Kodeksi 138, 141, 145-moddalari"],
    key_questions: [
      "Ishlab chiqarish zarurati bo'yicha boshqa ishga o'tkazishning maksimal muddati qancha?",
      "Xodimning mutaxassisligiga to'g'ri kelmaydigan va maoshi kam ishga o'tkazishga yo'l qo'yiladimi?",
    ],
  },
  {
    id: 'lab-010',
    title: "Foydalanilmagan mehnat ta'tillari uchun kompensatsiya undirish",
    category: 'mehnat',
    difficulty: 'easy',
    description:
      "Xodim tashkilotda 5 yil ishlagan davrida biror marta ham mehnat ta'tiliga chiqmagan. Ishdan bo'shash vaqtida ish beruvchi faqat oxirgi 1 yil uchun kompensatsiya to'lashini, oldingi yillar kuyib ketganini bildirgan.",
    law_references: ["O'zbekiston Respublikasi Mehnat Kodeksi 216, 234-moddalari"],
    key_questions: [
      "Foydalanilmagan yillik ta'tillar ishdan bo'shaganda bekor bo'ladimi?",
      "Barcha 5 yillik foydalanilmagan ta'tillar uchun to'liq pullik kompensatsiya to'lanishi shartmi?",
    ],
  },

  // ==========================================
  // OILA HUQUQI (FAMILY LAW) - 10 CASES
  // ==========================================
  {
    id: 'fam-001',
    title: "Er-xotinning umumiy mol-mulkini bo'lish va ipoteka krediti",
    category: 'oila',
    difficulty: 'hard',
    description:
      "Nikoh davrida er-xotin nomiga ipoteka krediti asosida olingan 3 xonali xonadon mavjud. Ipoteka to'lovlarining 70 foizini erning ota-onasi to'lagan. Nikoh bekor qilingach, xotin uyning 50 foiz ulushiga va bolalari bilan yashash huquqiga da'vo qilmoqda. Er esa to'lovlarni ota-onasi to'lagani uchun uyni shaxsiy mulk deb hisoblaydi.",
    law_references: ["O'zbekiston Respublikasi Oila Kodeksi 23, 27, 28-moddalari"],
    key_questions: [
      'Nikoh davrida olingan mol-mulk qanday taqsimlanadi?',
      "Uchinchi shaxslarning ipoteka to'lovlarida qatnashishi mulk huquqiga qanday ta'sir qiladi?",
    ],
  },
  {
    id: 'fam-002',
    title: "Aliment miqdorini qat'iy summada belgilash",
    category: 'oila',
    difficulty: 'medium',
    description:
      "Ota rasmiy ish joyida minimal ish haqi oladi, lekin uning nomida bir nechta tijorat ob'ektlari va xorijiy bank hisobvaraqlari mavjud. Ona 2 nafar voyaga yetmagan bola uchun oylik daromadning 1/3 qismi emas, balki har bir bola uchun 3 mln so'm qat'iy summada aliment undirishni talab qilmoqda.",
    law_references: ["O'zbekiston Respublikasi Oila Kodeksi 99, 102-moddalari"],
    key_questions: [
      "Qanday hollarda aliment qat'iy pul summasida undiriladi?",
      "Otani qo'shimcha daromadlarini hisobga olish tartibi qanday?",
    ],
  },
  {
    id: 'fam-003',
    title: "Otalikni belgilash va aliment undirish (Nikohsiz tug'ilgan bola)",
    category: 'oila',
    difficulty: 'medium',
    description:
      "Rasmiy nikohdan o'tmagan er-xotin 3 yil birga yashagan va bola tug'ilgan. Tug'ilganlik guvohnomasida ota ustunida chiziqcha qo'yilgan. Oradan 2 yil o'tib, er munosabatlarni to'xtatgan. Ona DNK ekspertizasi o'tkazish, otalikni sud orqali tan olish va o'tgan davr uchun aliment undirishni so'ramoqda.",
    law_references: ["O'zbekiston Respublikasi Oila Kodeksi 61, 62, 101-moddalari"],
    key_questions: [
      'Otalikni sud tartibida belgilash asoslari nimalardan iborat?',
      "Otalik tan olingach, o'tgan davrlar uchun aliment undiriladimi?",
    ],
  },
  {
    id: 'fam-004',
    title: 'Ota-onalik huquqidan mahrum qilish',
    category: 'oila',
    difficulty: 'medium',
    description:
      "Ota 5 yil davomida farzandining tarbiyasida qatnashmagan, surunkali giyohvandlikka chalingan, aliment to'lashdan qasddan bo'yin tovlagan va jinoiy javobgarlikka tortilgan. Ona otani ota-onalik huquqidan mahrum qilish to'g'risida da'vo kiritgan.",
    law_references: ["O'zbekiston Respublikasi Oila Kodeksi 79, 80, 81-moddalari"],
    key_questions: [
      'Ota-onalik huquqidan mahrum qilishning asosiy qonuniy sabablari?',
      "Huquqdan mahrum qilingan ota aliment to'lash majburiyatidan ozod bo'ladimi?",
    ],
  },
  {
    id: 'fam-005',
    title: 'Nikoh shartnomasining shartlarini haqiqiy emas deb topish',
    category: 'oila',
    difficulty: 'hard',
    description:
      "Nikoh shartnomasiga ko'ra, agar nikoh xotinning xiyonati sababli bekor qilinsa, u barcha umumiy mol-mulkdan mahrum bo'lishi va bolalardan voz kechishi shartligi belgilangan. Xotin ushbu bandlar o'zini o'ta noqulay ahvolga solib qo'yganini va shaxsiy nomulkiy huquqlarini cheklashini aytib haqiqiy emas deb topishni so'ramoqda.",
    law_references: ["O'zbekiston Respublikasi Oila Kodeksi 31, 32, 36-moddalari"],
    key_questions: [
      'Nikoh shartnomasida shaxsiy nomulkiy munosabatlarni belgilash mumkinmi?',
      "Xotinni o'ta noqulay ahvolga soladigan shartlar haqiqiymi?",
    ],
  },
  {
    id: 'fam-006',
    title: "Farzand bilan ko'rishish tartibini belgilash",
    category: 'oila',
    difficulty: 'easy',
    description:
      "Ajralishdan so'ng bola ona bilan qolgan. Ona ota bilan bolaning ko'rishishiga mutlaqo to'sqinlik qilib, bolani otaga qarshi qayramoqda. Ota haftada 2 kun va ta'til kunlarining yarmida bola bilan alohida ko'rishish va sayohatga olib chiqish tartibini belgilashni so'ramoqda.",
    law_references: ["O'zbekiston Respublikasi Oila Kodeksi 66, 76, 77-moddalari"],
    key_questions: [
      "Alohida yashayotgan ota-onaning bola bilan muloqot qilish huquqi qanday ta'minlanadi?",
      "Ona to'sqinlik qilgan taqdirda sud qanday choralar ko'radi?",
    ],
  },
  {
    id: 'fam-007',
    title: 'Voyaga yetgan mehnatga layoqatsiz farzandga aliment undirish',
    category: 'oila',
    difficulty: 'easy',
    description:
      "19 yoshli fuqaro bolalikdan 1-guruh nogironi hisoblanadi va mustaqil ishlay olmaydi. U alohida yashayotgan badavlat otasidan har oy moddiy ta'minot (aliment) undirish to'g'risida da'vo ochgan. Ota farzandi 18 yoshga to'lgani sababli majburiyati tugaganini aytmoqda.",
    law_references: ["O'zbekiston Respublikasi Oila Kodeksi 100-moddasi"],
    key_questions: [
      "Voyaga yetgan mehnatga layoqatsiz bolalarga aliment to'lash shartlari?",
      "Nafaqaxo'r yoki nogiron bolaga moddiy yordam qanday miqdorda belgilanadi?",
    ],
  },
  {
    id: 'fam-008',
    title: 'Farzandlikka olishni bekor qilish',
    category: 'oila',
    difficulty: 'hard',
    description:
      "Farzandlikka olingan 12 yoshli bola va asrab oluvchi ota-ona o'rtasida o'zaro kelishmovchilik, begonasirash yuzaga kelgan. Ota-ona bolani tarbiya qila olmasligini, bola uydan qochib ketayotganini aytib farzandlikka olishni bekor qilishni talab qilmoqda. Vasiylik organi bunga qarshi.",
    law_references: ["O'zbekiston Respublikasi Oila Kodeksi 169, 170, 171-moddalari"],
    key_questions: [
      'Farzandlikka olishni bekor qilish qanday hollarda bolaning manfaatiga mos keladi?',
      'Bolaning 10 yoshdan oshgandagi fikri qanday inobatga olinadi?',
    ],
  },
  {
    id: 'fam-009',
    title: 'Nikohni haqiqiy emas deb topish (Soxta nikoh)',
    category: 'oila',
    difficulty: 'medium',
    description:
      "Fuqaro A. poytaxtda ro'yxatga turish (propiska) va imtiyozli uy-joy olish maqsadida fuqaro B. bilan moddiy manfaat evaziga rasmiy nikohdan o'tgan, biroq oila qurish niyatida bo'lmagan va birga yashamagan. Prokuror soxta nikohni haqiqiy emas deb topishni so'rab da'vo kiritgan.",
    law_references: ["O'zbekiston Respublikasi Oila Kodeksi 49, 50, 52-moddalari"],
    key_questions: [
      'Soxta nikohning huquqiy oqibatlari qanday?',
      'Nikoh haqiqiy emas deb topilganda olingan mol-mulk qanday taqsimlanadi?',
    ],
  },
  {
    id: 'fam-010',
    title: 'Voyaga yetmagan bolaning xorijga chiqishiga ota roziligini sud orqali olish',
    category: 'oila',
    difficulty: 'easy',
    description:
      "Ona iqtidorli 13 yoshli o'g'lini xalqaro olimpiadada qatnashish uchun Germaniyaga 10 kunga olib chiqmoqchi. Alohida yashayotgan ota hech bir asossiz rozilik arizasini berishdan bosh tortmoqda. Ona ota roziligisiz chiqishga ruxsat berishni so'rab sudga ariza bergan.",
    law_references: [
      "O'zbekiston Respublikasi Oila Kodeksi 71-moddasi",
      "Vazirlar Mahkamasining xorijga chiqish pasportlari to'g'risidagi Nizomi",
    ],
    key_questions: [
      "Otaning asossiz qarshiligi sud orqali qanday yengib o'tiladi?",
      "Bolaning ta'lim olish va rivojlanish huquqi qanday himoyalanadi?",
    ],
  },

  // ==========================================
  // IQTISODIY HUQUQ (ECONOMIC/COMMERCIAL LAW) - 10 CASES
  // ==========================================
  {
    id: 'econ-001',
    title: "Yetkazib berish shartnomasi bo'yicha to'lovni undirish va penya",
    category: 'iqtisodiy',
    difficulty: 'medium',
    description:
      "MCHJ 'A' MCHJ 'B'ga 500 mln so'mlik qurilish mahsulotlarini yetkazib bergan. MCHJ 'B' tovarlarni qabul qilib olgan, dalolatnoma imzolangan, ammo 90 kun davomida to'lov qilinmagan. Shartnomada har bir kun uchun 0.1% penya (lekin 10% dan oshmagan miqdorda) belgilangan. MCHJ 'A' sud orqali 500 mln asosiy qarz va 50 mln penya undirishni so'ramoqda.",
    law_references: [
      "O'zbekiston Respublikasi Fuqarolik Kodeksi 437, 442, 444-moddalari",
      "'Xo'jalik yurituvchi sub'ektlar faoliyatining shartnomaviy-huquqiy bazasi to'g'risida'gi Qonun 25-32-moddalari",
    ],
    key_questions: [
      'Mahsulot yetkazib berish shartnomasida majburiyat buzilganda javobgarlik choralari?',
      "Iqtisodiy sudda da'vo arizasiga ilova qilinadigan zaruriy hujjatlar qaysilar?",
    ],
  },
  {
    id: 'econ-002',
    title: 'Qurilish pudrati shartnomasini bekor qilish va kafolat summasi',
    category: 'iqtisodiy',
    difficulty: 'hard',
    description:
      "Buyurtmachi va Bosh pudratchi o'rtasida 2 mlrd so'mlik bino qurilishi shartnomasi tuzilgan. Pudratchi ishlarni 5 oyga kechiktirgan va oraliq sifat talablariga javob bermagan. Buyurtmachi shartnomani bekor qilish, to'langan 600 mln so'm avansni qaytarish va 200 mln so'm jarima undirish bo'yicha da'vo kiritgan. Pudratchi esa ob'ektda qilingan ishlarni qabul qilishni talab qilmoqda.",
    law_references: [
      "O'zbekiston Respublikasi Fuqarolik Kodeksi 631, 638, 646, 655-moddalari",
      'Iqtisodiy Protsessual Kodeksi',
    ],
    key_questions: [
      'Pudrat shartnomasida muddat buzilganda buyurtmachining shartnomadan voz kechish huquqi?',
      "Bajarilgan ishlar hajmini baholashda ekspertizaning o'rni qanday?",
    ],
  },
  {
    id: 'econ-003',
    title: "MCHJ ishtirokchilari o'rtasidagi korporativ nizo (Ulushni sotishda imtiyozli huquq)",
    category: 'iqtisodiy',
    difficulty: 'hard',
    description:
      "MCHJning 40% ulushiga ega bo'lgan ta'sischi o'z ulushini boshqa ishtirokchilarga taklif qilmasdan to'g'ridan-to'g'ri uchinchi shaxsga sotib yuborgan. Qolgan ishtirokchilar imtiyozli sotib olish huquqi buzilganligini da'vo qilib, xaridor huquq va majburiyatlarini o'zlariga o'tkazishni talab qilmoqdalar.",
    law_references: [
      "O'zbekiston Respublikasi 'Mas'uliyati cheklangan hamda qo'shimcha mas'uliyatli jamiyatlar to'g'risida'gi Qonuni 20-moddasi",
    ],
    key_questions: [
      'MCHJ ishtirokchisining imtiyozli sotib olish huquqi qanday amalga oshiriladi?',
      "Uchinchi shaxs bilan tuzilgan oldi-sotdi shartnomasining taqdiri nima bo'ladi?",
    ],
  },
  {
    id: 'econ-004',
    title: "Bankrotlik (To'lovga qobiliyatsizlik) jarayonini boshlash",
    category: 'iqtisodiy',
    difficulty: 'hard',
    description:
      "Kreditor korxona qarzdor MCHJdan 300 mln so'm qarzni 6 oy davomida undira olmadi. Majburiy ijro byurosi qarzdor nomida mol-mulk yo'qligi sababli ijro hujjatini qaytargan. Kreditor iqtisodiy sudga qarzdorni to'lovga qobiliyatsiz deb topish to'g'risida ariza bilan murojaat qildi.",
    law_references: [
      "O'zbekiston Respublikasi 'To'lovga qobiliyatsizlik to'g'risida'gi Qonuni 4, 5, 36, 40-moddalari",
    ],
    key_questions: [
      "Yuridik shaxsni to'lovga qobiliyatsiz deb topishning minimal qarz miqdori va muddati qanday?",
      'Tugash jarayonida kreditorlar talablarini qondirish navbati qanday belgilanadi?',
    ],
  },
  {
    id: 'econ-005',
    title: "Lizing shartnomasi bo'yicha lizing ob'ektini qaytarib olish",
    category: 'iqtisodiy',
    difficulty: 'medium',
    description:
      "Lizing oluvchi korxona og'ir yuk mashinasining oylik lizing to'lovlarini 4 oy davomida to'lamagan. Lizing beruvchi shartnomani muddatidan oldin bekor qilish, texnikani majburiy qaytarib olish va qolgan qarzni undirishni talab qilmoqda.",
    law_references: [
      "O'zbekiston Respublikasi Fuqarolik Kodeksi 588, 595, 599-moddalari",
      "O'zbekiston Respublikasi 'Lizing to'g'risida'gi Qonuni",
    ],
    key_questions: [
      "Lizing to'lovlari kechiktirilganda lizing beruvchining ob'ektni qaytarib olish huquqi?",
      "Lizing ob'ektining eskirishi va zararlar qanday qoplanadi?",
    ],
  },
  {
    id: 'econ-006',
    title: "Franchayzing shartnomasi bo'yicha royalti to'lovlari va sir saqlash",
    category: 'iqtisodiy',
    difficulty: 'medium',
    description:
      "Franchayzi xalqaro brend ostida restoran faoliyatini yuritib, 6 oylik royalti to'lovlarini to'lamagan va brendning maxfiy retseptura texnologiyalarini o'zining boshqa shaxsiy restoranlar tarmog'ida qo'llagan. Franchayzer 100 000 AQSH dollari miqdorida jarima va zararni talab qilmoqda.",
    law_references: ["O'zbekiston Respublikasi Fuqarolik Kodeksi 862, 868, 873-moddalari"],
    key_questions: [
      'Tijorat konsessiyasi shartnomasida maxfiylik majburiyatini buzish oqibatlari?',
      'Noqonuniy foydalanilgan intellektual mulkdan olingan daromadlar qanday undiriladi?',
    ],
  },
  {
    id: 'econ-007',
    title: "Tovar belgisiga bo'lgan mutlaq huquqni himoya qilish",
    category: 'iqtisodiy',
    difficulty: 'medium',
    description:
      "Mashhur ichimlik ishlab chiqaruvchi MCHJ 'X' boshqa MCHJ 'Y' tomonidan xuddi shunday dizayn va adashtirib yuborish darajasida o'xshash nomdagi ichimlik ishlab chiqarilayotganini aniqladi. Da'vogar mahsulotlarni muomaladan chiqarish, yo'q qilish va 300 mln so'm zarar undirishni so'ramoqda.",
    law_references: [
      "O'zbekiston Respublikasi 'Tovar belgilari, xizmat ko'rsatish belgilari va tovar kelib chiqqan joy nomlari to'g'risida'gi Qonuni 27-moddasi",
    ],
    key_questions: [
      "Adashtirib yuborish darajasida o'xshashlik mezonlari qanday aniqlanadi?",
      "Kontrafakt mahsulotlarni yo'q qilish xarajatlari kimning zimmasiga yuklatiladi?",
    ],
  },
  {
    id: 'econ-008',
    title: "Sug'urta tovoni to'lashni rad etish bo'yicha nizo",
    category: 'iqtisodiy',
    difficulty: 'medium',
    description:
      "Omborxonada sodir bo'lgan yong'in oqibatida 1 mlrd so'mlik tovar nobud bo'lgan. Sug'urta kompaniyasi yong'in xavfsizligi qoidalariga rioya etilmaganligini sabab qilib sug'urta tovonini to'lashdan bosh tortgan. Sug'urtalovchi esa yong'in qasddan sodir etilmaganini ta'kidlamoqda.",
    law_references: [
      "O'zbekiston Respublikasi Fuqarolik Kodeksi 940, 951, 958-moddalari",
      "'Sug'urta faoliyati to'g'risida'gi Qonun",
    ],
    key_questions: [
      "Sug'urta hodisasi yuz berganda sug'urtalovchining to'lovdan bosh tortish asoslari qonuniymi?",
      "Ekspertiza xulosasining sudda dalil sifatidagi o'rni?",
    ],
  },
  {
    id: 'econ-009',
    title: 'Davlat xaridlari shartnomasini bajarishdan bir tomonlama bosh tortish',
    category: 'iqtisodiy',
    difficulty: 'hard',
    description:
      "G'olib deb topilgan yetkazib beruvchi xalqaro bozorda narxlar keskin ko'tarilib ketganini vaj qilib, davlat buyurtmachisiga tovar yetkazib berishdan bosh tortgan. Buyurtmachi korxonani insofsiz ijrochilarning yagona reyestriga kiritish va kafolat ta'minotini davlat daromadiga undirishni talab qilmoqda.",
    law_references: [
      "O'zbekiston Respublikasi 'Davlat xaridlari to'g'risida'gi Qonuni 42, 49-moddalari",
    ],
    key_questions: [
      "Bozor narxlarining o'zgarishi fors-major holati hisoblanadimi?",
      'Insofsiz ijrochilar reyestriga kiritish oqibatlari qanday?',
    ],
  },
  {
    id: 'econ-010',
    title: "Faktoring shartnomasi bo'yicha pul talabnomasidan boshqa shaxs foydasiga voz kechish",
    category: 'iqtisodiy',
    difficulty: 'hard',
    description:
      "Mijoz o'z xaridori bo'lgan uchinchi shaxsga nisbatan bo'lgan 400 mln so'mlik qarz talabnomasini bankka (faktorga) bergan. Xaridor tovar nuqsonli bo'lgani sababli bankka to'lov qilishdan bosh tortmoqda va bankdan o'zaro hisob-kitobni mijoz bilan hal qilishni talab qilmoqda.",
    law_references: ["O'zbekiston Respublikasi Fuqarolik Kodeksi 749, 755, 757-moddalari"],
    key_questions: [
      "Qarzdor faktorga nisbatan qanday e'tirozlarni bildirishi mumkin?",
      "Mijoz yetkazib berilgan tovar sifati uchun bank oldida javobgar bo'ladimi?",
    ],
  },

  // ==========================================
  // MA'MURIY HUQUQ (ADMINISTRATIVE LAW) - 10 CASES
  // ==========================================
  {
    id: 'adm-001',
    title: "Hokim qarorini haqiqiy emas deb topish (Yer uchastkasini olib qo'yish)",
    category: 'ma’muriy',
    difficulty: 'hard',
    description:
      "Tuman hokimi tadbirkorga 10 yilga ijara huquqi asosida berilgan yer uchastkasini 'samarasiz foydalanilmoqda' degan vaj bilan bir tomonlama bekor qilish to'g'risida qaror qabul qilgan. Tadbirkor hududda loyiha-smeta ishlari va qurilish boshlanganini ko'rsatib, hokim qarorini bekor qilishni so'rab ma'muriy sudga murojaat qilgan.",
    law_references: [
      "O'zbekiston Respublikasi Ma'muriy Sud Ishlarini Yuritish to'g'risidagi Kodeksi (MSIYtK) 27, 185-moddalari",
      'Yer Kodeksi 36-moddasi',
    ],
    key_questions: [
      "Ma'muriy organning huquqiy hujjatini haqiqiy emas deb topish asoslari?",
      "Yerga bo'lgan huquq sud qarorisiz ma'muriy tartibda bekor qilinishi mumkinmi?",
    ],
  },
  {
    id: 'adm-002',
    title: 'Soliq organining asossiz hisoblangan penya va jarima qarori ustidan shikoyat',
    category: 'ma’muriy',
    difficulty: 'medium',
    description:
      "Kompaniyada o'tkazilgan kameral soliq tekshiruvi natijasida 120 mln so'm qo'shimcha QQS va jarima hisoblangan. Kompaniya soliq imtiyoziga ega ekanligini isbotlovchi barcha birlamchi hujjatlarni taqdim etgan bo'lsa-da, soliq organi talabnomani ijroga qaratgan.",
    law_references: ["O'zbekiston Respublikasi Soliq Kodeksi 14, 85, 227-moddalari", 'MSIYtK'],
    key_questions: [
      'Soliq qarorlari ustidan sudga shikoyat qilish muddati va tartibi?',
      "Sud jarayonida soliq organi o'z qarorining qonuniyligini qanday isbotlashi shart?",
    ],
  },
  {
    id: 'adm-003',
    title: "Bojxona qiymatini qayta hisoblash va to'lovlarni undirish to'g'risidagi qaror",
    category: 'ma’muriy',
    difficulty: 'hard',
    description:
      "Importyor xorijdan olib kelgan tovarlar uchun shartnoma qiymati (1-usul) asosida bojxona deklaratsiyasini topshirgan. Bojxona posti xalqaro narxlar axborot bazasiga tayanib, qiymatni 40% oshirgan holda 6-usul bo'yicha qayta hisoblab qo'shimcha 80 mln so'm boj undirgan.",
    law_references: ["O'zbekiston Respublikasi Bojxona Kodeksi 302, 305, 319-moddalari"],
    key_questions: [
      "Bojxona qiymatini aniqlash usullarini qo'llashning ketma-ketligi?",
      'Bojxona organining qiymatni rad etish asosi yetarlimi?',
    ],
  },
  {
    id: 'adm-004',
    title: "Litsenziyani to'xtatib turish yoki bekor qilish ustidan nizo",
    category: 'ma’muriy',
    difficulty: 'medium',
    description:
      "Tibbiyot xususiy klinikasining litsenziyasi vazirlik tomonidan bitta qoidabuzarlik uchun to'g'ridan-to'g'ri bekor qilingan. Klinika kamchilik bartaraf etilganini va litsenziyani bekor qilish faqat sud tartibida amalga oshirilishi kerakligini ta'kidlamoqda.",
    law_references: [
      "O'zbekiston Respublikasi 'Litsenziyalash, ruxsat berish va xabardor qilish tartib-taomillari to'g'risida'gi Qonuni 32, 33-moddalari",
    ],
    key_questions: [
      "Litsenziyani ma'muriy organ va sud tomonidan bekor qilish vakolatlari chegarasi?",
      'Qoidabuzarlikni bartaraf etish uchun muddat berilishi shartmi?',
    ],
  },
  {
    id: 'adm-005',
    title: "Davlat xizmatlari agentligining ro'yxatdan o'tkazishni rad etish harakati",
    category: 'ma’muriy',
    difficulty: 'easy',
    description:
      "Tadbirkor qo'shma korxona ta'sis etish uchun hujjat topshirgan. Ro'yxatdan o'tkazuvchi organ qonunda nazarda tutilmagan qo'shimcha ma'lumotnomalarni talab qilib, arizani rad etgan. Tadbirkor mansabdor shaxsning noqonuniy harakati ustidan shikoyat qilgan.",
    law_references: [
      "O'zbekiston Respublikasi 'Davlat xizmatlari to'g'risida'gi Qonun",
      "'Ma'muriy tartib-taomillar to'g'risida'gi Qonun 4, 9-moddalari",
    ],
    key_questions: [
      "Ma'muriy organ tomonidan qonunda belgilanmagan hujjatlarni talab qilishning taqiqlanishi?",
      'Davlat organi harakatsizligi yoki asossiz rad etishining oqibatlari?',
    ],
  },
  {
    id: 'adm-006',
    title: 'Monopoliyaga qarshi organning raqobatni cheklovchi qarori ustidan nizo',
    category: 'ma’muriy',
    difficulty: 'hard',
    description:
      "Raqobat qo'mitasi yirik distribyutor korxonaga nisbatan 'ustun mavqeni suiiste'mol qilgan' deb xulosa qilib, 500 mln so'm moliyaviy jarima qo'llagan. Korxona bozordagi o'z ulushi 35% dan oshmasligini va ustun mavqega ega emasligini isbotlovchi mustaqil tahlilni sudga kiritgan.",
    law_references: [
      "O'zbekiston Respublikasi 'Raqobat to'g'risida'gi Qonun (yangi tahrir) 13, 16, 38-moddalari",
    ],
    key_questions: [
      'Tovarning tegishli bozori chegaralari va ishtirokchi ulushi qanday hisoblanadi?',
      "Moliyaviy jarima qo'llashning qonuniyligi qanday tekshiriladi?",
    ],
  },
  {
    id: 'adm-007',
    title: 'Axborot olish huquqining buzilishi ustidan shikoyat',
    category: 'ma’muriy',
    difficulty: 'easy',
    description:
      "Jurnalist vazirlikka davlat byudjeti mablag'larining sarflanishi to'g'risida rasmiy so'rov yuborgan. Vazirlik 30 kun davomida javob bermagan va so'ngra 'ichki foydalanish uchun' deb ma'lumot berishdan bosh tortgan. Jurnalist ma'lumot berish majburiyatini yuklashni so'ramoqda.",
    law_references: [
      "O'zbekiston Respublikasi 'Axborot erkinligi prinsiplari va kafolatlari to'g'risida'gi Qonuni 6, 8-moddalari",
      "'Davlat hokimiyati va boshqaruvi organlari faoliyatining ochiqligi to'g'risida'gi Qonun",
    ],
    key_questions: [
      'Davlat byudjeti sarfi yopiq axborot toifasiga kiradimi?',
      "Mansabdor shaxsning axborot berishdan bosh tortishi qanday javobgarlikka sabab bo'ladi?",
    ],
  },
  {
    id: 'adm-008',
    title: "Ekologik nazorat organi tomonidan faoliyatni to'xtatib qo'yish",
    category: 'ma’muriy',
    difficulty: 'medium',
    description:
      "Ekologiya inspeksiyasi ishlab chiqarish zavodida havoga zararli moddalar me'yordan ortiq chiqarilayotgani sababli zavod faoliyatini 30 kunga to'xtatish haqida qaror chiqargan. Korxona bunday vakolat faqat sudga tegishli ekanligini aytmoqda.",
    law_references: [
      "O'zbekiston Respublikasi 'Tabiatni muhofaza qilish to'g'risida'gi Qonun",
      "'Ekologik nazorat to'g'risida'gi Qonun",
    ],
    key_questions: [
      "Tadbirkorlik sub'ekti faoliyatini to'xtatib turish qanday tartibda (sud orqali) amalga oshiriladi?",
      'Favqulodda hollarda davlat organining vakolatlari chegarasi?',
    ],
  },
  {
    id: 'adm-009',
    title: "Mehnat inspeksiyasi ko'rsatmasini haqiqiy emas deb topish",
    category: 'ma’muriy',
    difficulty: 'medium',
    description:
      "Mehnat inspektori korxonani tekshirib, xodimlarning ish vaqti hisobi noto'g'ri yuritilgan degan asos bilan rahbarga yirik miqdorda ma'muriy jarima solgan va ko'rsatma bergan. Korxona tekshiruv Tadbirkorlar vakili (Ombudsman) bilan kelishilmaganini ko'rsatmoqda.",
    law_references: [
      "O'zbekiston Respublikasi 'Tadbirkorlik faoliyati erkinligining kafolatlari to'g'risida'gi Qonuni 42-moddasi",
    ],
    key_questions: [
      'Kelishilmagan noqonuniy tekshiruv natijasida olingan dalillarning yuridik kuchi?',
      "Ma'muriy organning noqonuniy ko'rsatmasini bekor qilish tartibi?",
    ],
  },
  {
    id: 'adm-010',
    title: "Uy-joyni buzish (snos) va kompensatsiya to'lash bo'yicha ma'muriy nizolar",
    category: 'ma’muriy',
    difficulty: 'hard',
    description:
      "Davlat ehtiyojlari uchun fuqaroning xususiy xonadoni buzilishga tushgan. Hokimlik taklif qilgan kompensatsiya bozor bahosidan 3 barobar past bo'lib, fuqaro yangi taklif qilingan uyni qabul qilishdan bosh tortgan. Hokimlik majburiy ko'chirish to'g'risida qaror chiqargan.",
    law_references: [
      "O'zbekiston Respublikasi 'Yer uchastkalarini kompensatsiya evaziga jamoat ehtiyojlari uchun olib qo'yish tartib-taomillari to'g'risida'gi Qonun",
      'MSIYtK',
    ],
    key_questions: [
      "Mulkdor bilan kelishuvga erishilmaganda majburiy ko'chirish mumkinmi?",
      "Bozor bahosidagi kompensatsiya va zararlarni oldindan to'liq qoplash prinsipi qanday ishlaydi?",
    ],
  },

  // ==========================================
  // KONSTITUTSIYAVIY HUQUQ (CONSTITUTIONAL LAW) - 10 CASES
  // ==========================================
  {
    id: 'const-001',
    title: "Yangi Konstitutsiya bo'yicha inson qadr-qimmati va shaxsiy daxlsizlik",
    category: 'konstitutsiyaviy',
    difficulty: 'medium',
    description:
      "Tergov organi tomonidan gumon qilinuvchining uyi sud qarorisiz, faqat tergovchi qarori bilan 'kechiktirib bo'lmaydigan holat' degan vaj bilan tintuv qilingan. Fuqaro Konstitutsiyaviy normalarga tayanib, uy-joy daxlsizligi faqat sud qarori bilan cheklanishi mumkinligini aytib shikoyat qilgan.",
    law_references: [
      "O'zbekiston Respublikasi Konstitutsiyasi 27, 31-moddalari",
      'JPK 158-moddasi',
    ],
    key_questions: [
      "Konstitutsiyaning to'g'ridan-to'g'ri amal qilish prinsipi qanday ishlaydi?",
      "Sud qarorisiz o'tkazilgan tintuv natijalari qonuniy dalil bo'ladimi?",
    ],
  },
  {
    id: 'const-002',
    title: 'Xabeas Korpus: Qamoqqa olish ehtiyot chorasining konstitutsiyaviy kafolatlari',
    category: 'konstitutsiyaviy',
    difficulty: 'hard',
    description:
      "Shaxs ushlangandan so'ng 48 soat ichida sudga olib chiqilmasdan 72 soat vaqtincha saqlash hibsxonasida ushlab turilgan. Himoyachi Konstitutsiyaning 27-moddasi buzilganini, shaxs zudlik bilan ozod etilishi shartligini talab qilmoqda.",
    law_references: [
      "O'zbekiston Respublikasi Konstitutsiyasi 27-moddasi (Qamoqqa olishga faqat sud qarori asosida yo'l qo'yilishi)",
    ],
    key_questions: [
      'Shaxsni ushlab turishning konstitutsiyaviy maksimal muddati (48 soat) buzilishi oqibatlari?',
      'Noqonuniy ushlab turilgan shaxsning huquqlari qanday tiklanadi?',
    ],
  },
  {
    id: 'const-003',
    title: "Aybsizlik prezumpsiyasi va o'ziga qarshi ko'rsatma bermaslik huquqi (Miranda qoidasi)",
    category: 'konstitutsiyaviy',
    difficulty: 'medium',
    description:
      "Gumonlanuvchiga ushlangan paytida sukut saqlash va advokatga ega bo'lish huquqlari tushuntirilmagan. Shaxs bosim ostida o'z aybiga iqrorlik arizasi yozib bergan. Himoyachi sudda ushbu ko'rsatmalarni Konstitutsiyaga zid deb topib, dalillar qatoridan chiqarishni so'ramoqda.",
    law_references: ["O'zbekiston Respublikasi Konstitutsiyasi 28-moddasi", 'JPK 17, 22-moddalari'],
    key_questions: [
      "Konstitutsiyaviy 'Miranda qoidalari' buzilganda olingan iqrorlik dalil kuchi bormi?",
      "Hech kim o'ziga va yaqin qarindoshlariga qarshi guvohlik berishga majbur emasligi prinsipi?",
    ],
  },
  {
    id: 'const-004',
    title: 'Mulk daxlsizligi va mulkni musodara qilishning konstitutsiyaviy asoslari',
    category: 'konstitutsiyaviy',
    difficulty: 'hard',
    description:
      "Ma'muriy komissiya qarori bilan fuqaroning noqonuniy savdo qilgan tovarlari to'g'ridan-to'g'ri davlat daromadiga musodara qilingan. Fuqaro mulkdan mahrum qilish faqat qonuniy sud qarori bilan amalga oshirilishi kerakligini ta'kidlamoqda.",
    law_references: [
      "O'zbekiston Respublikasi Konstitutsiyasi 65, 66-moddalari (Xususiy mulk daxlsizligi)",
    ],
    key_questions: [
      "Ma'muriy organlar mulkni musodara qilish huquqiga egami?",
      'Sud qarorisiz mulkdan mahrum etishning konstitutsiyaviy taqiqlanishi?',
    ],
  },
  {
    id: 'const-005',
    title: 'Advokat yordami olish huquqining konstitutsiyaviy kafolatlari',
    category: 'konstitutsiyaviy',
    difficulty: 'medium',
    description:
      "Og'ir jinoyatda ayblanayotgan shaxsga tergov davomida advokat tanlash imkoni berilmagan, davlat hisobidan tayinlangan advokat esa tergov harakatlarida amalda qatnashmagan. Sud jarayonida ayblanuvchi himoya huquqi buzilganini bildirgan.",
    law_references: [
      "O'zbekiston Respublikasi Konstitutsiyasi 29-moddasi (Malakali yuridik yordam olish huquqi)",
    ],
    key_questions: [
      'Malakali yuridik yordam olish huquqining buzilishi tergov natijalarini bekor qiladimi?',
      "Davlat hisobidan advokat ta'minlashning majburiy kafolatlari qanday?",
    ],
  },
  {
    id: 'const-006',
    title: "Tenglik prinsipi va kamsitishga (diskriminatsiyaga) yo'l qo'yilmasligi",
    category: 'konstitutsiyaviy',
    difficulty: 'easy',
    description:
      "Davlat xizmatiga qabul qilish bo'yicha tanlov e'lonida nomzodlarning jinsi (faqat erkaklar) va yoshi (30 yoshgacha) bo'yicha cheklovlar qo'yilgan. 32 yoshli ayol nomzod ushbu tanlov qoidalarini Konstitutsiyaga zid deb topishni so'ramoqda.",
    law_references: [
      "O'zbekiston Respublikasi Konstitutsiyasi 19, 37-moddalari",
      "'Davlat fuqarolik xizmati to'g'risida'gi Qonun",
    ],
    key_questions: [
      "Davlat xizmatiga kirishda teng imkoniyatlar kafolati qanday ta'minlanadi?",
      "Diskriminatsiyaga qarshi konstitutsiyaviy normalar qanday qo'llaniladi?",
    ],
  },
  {
    id: 'const-007',
    title: "Tibbiy yordam olish va sog'liqni saqlash huquqi",
    category: 'konstitutsiyaviy',
    difficulty: 'easy',
    description:
      "Davlat shifoxonasi shoshilinch tez tibbiy yordamga muhtoj bo'lgan fuqarodan dastlab to'lov qilishni yoki sug'urta polisini talab qilib, tibbiy yordam ko'rsatishni kechiktirgan. Oqibatda bemorning ahvoli og'irlashgan.",
    law_references: [
      "O'zbekiston Respublikasi Konstitutsiyasi 48-moddasi (Bepul kafolatlangan tibbiy yordam)",
    ],
    key_questions: [
      "Kafolatlangan bepul tibbiy yordam ko'rsatishdan bosh tortishning huquqiy oqibatlari?",
      "Inson hayoti va sog'lig'ini saqlash bo'yicha davlat kafolatlari?",
    ],
  },
  {
    id: 'const-008',
    title: "Ta'lim olish huquqi va oliy ta'lim muassasalarining akademik erkinligi",
    category: 'konstitutsiyaviy',
    difficulty: 'medium',
    description:
      "Universitet talabasi shaxsiy ijtimoiy tarmoq sahifasida ta'lim sifatini tanqid qilgan posti uchun rektor buyrug'i bilan o'qishdan chetlashtirilgan. Talaba fikr bildirish erkinligi va ta'lim olish huquqi buzilgani bo'yicha sudga murojaat qilgan.",
    law_references: ["O'zbekiston Respublikasi Konstitutsiyasi 33, 50, 51-moddalari"],
    key_questions: [
      "So'z erkinligi va tanqid qilish huquqi talabani o'qishdan haydashga asos bo'ladimi?",
      "Oliy ta'lim muassasasida o'qish huquqini tiklash tartibi?",
    ],
  },
  {
    id: 'const-009',
    title: "Konstitutsiyaviy sudga fuqarolarning to'g'ridan-to'g'ri murojaat qilish huquqi",
    category: 'konstitutsiyaviy',
    difficulty: 'hard',
    description:
      "Fuqaro barcha sud instansiyalarini o'tib, uning ishida qo'llanilgan qonun normasi Konstitutsiyaning inson huquqlariga oid qoidalariga zid kelishini aniqlagan. Fuqaro Konstitutsiyaviy sudga ushbu qonun normasining konstitutsiyaviyligini tekshirish to'g'risida to'g'ridan-to'g'ri shikoyat kiritdi.",
    law_references: [
      "O'zbekiston Respublikasi Konstitutsiyasi 133-moddasi",
      "'Konstitutsiyaviy sud to'g'risida'gi Konstitutsiyaviy Qonun 27-moddasi",
    ],
    key_questions: [
      'Fuqarolarning Konstitutsiyaviy sudga murojaat qilish shartlari va qoidalari qanday?',
      "Konstitutsiyaga zid deb topilgan qonunning yuridik oqibatlari nima bo'ladi?",
    ],
  },
  {
    id: 'const-010',
    title: "Atrof-muhitga oid huquqlar: Qulay tabiiy muhitga ega bo'lish huquqi",
    category: 'konstitutsiyaviy',
    difficulty: 'medium',
    description:
      "Aholi turar joy massivida yashovchi fuqarolar yaqin atrofda noqonuniy ravishda qurilayotgan, havoni ifloslantiruvchi zavod qurilishini to'xtatish va yashil hududni saqlab qolish talabi bilan jamoaviy konstitutsiyaviy da'vo qo'zg'atdilar.",
    law_references: [
      "O'zbekiston Respublikasi Konstitutsiyasi 49-moddasi (Qulay atrof-muhitga, uning holati to'g'risida ishonchli axborotga ega bo'lish huquqi)",
    ],
    key_questions: [
      "Konstitutsiyadagi ekologik huquqlarning to'g'ridan-to'g'ri himoyasi qanday amalga oshiriladi?",
      "Shaharsozlikda jamoatchilik eshituvlarining o'rni qanday?",
    ],
  },

  // ==========================================
  // XALQARO VA INSON HUQUQLARI (INTERNATIONAL LAW) - 2 CASES (Bonus total 72 cases)
  // ==========================================
  {
    id: 'intl-001',
    title: 'Xalqaro tijorat arbitraji qarorlarini tan olish va ijroga qaratish',
    category: 'iqtisodiy',
    difficulty: 'hard',
    description:
      "London xalqaro arbitraj sudi (LCIA) O'zbekiston kompaniyasidan xorijiy kompaniya foydasiga 2 mln dollar undirish haqida qaror qabul qilgan. Xorijiy kompaniya Toshkent shahar sudiga ushbu qarorni ijroga qaratish to'g'risida ariza kiritgan. O'zbekiston kompaniyasi esa jamoat tartibiga zidligini vaj qilmoqda.",
    law_references: [
      '1958-yilgi Nyu-York Konvensiyasi',
      "O'zbekiston Respublikasi 'Xalqaro tijorat arbitraji to'g'risida'gi Qonuni 51, 52-moddalari",
    ],
    key_questions: [
      "Xalqaro arbitraj qarorlarini tan olishni rad etish asoslari qat'iy chegaralanganmi?",
      "'Jamoat tartibi' (public policy) tushunchasining mazmuni nima?",
    ],
  },
  {
    id: 'intl-002',
    title: 'Ekstraditsiya: Jinoyatchilarni ushlab berish va boshpana huquqi',
    category: 'jinoyat',
    difficulty: 'hard',
    description:
      "Xorijiy davlat tomonidan iqtisodiy jinoyatda ayblanib qidiruvda bo'lgan chet el fuqarosi O'zbekistonda ushlangan. Shaxs o'z yurtiga qaytarilsa qiynoqlarga duchor bo'lishi mumkinligini aytib boshpana so'ragan. Bosh prokuratura ekstraditsiya masalasini ko'rib chiqmoqda.",
    law_references: [
      '1984-yilgi BMTning Qiynoqlarga qarshi Konvensiyasi 3-moddasi',
      "O'zbekiston Respublikasi JPK 598-605-moddalari",
    ],
    key_questions: [
      'Non-refoulement (qaytarib yubormaslik) xalqaro huquqiy prinsipi qanday ishlaydi?',
      'Ekstraditsiya qilishni rad etishning majburiy asoslari qanday?',
    ],
  },
]
