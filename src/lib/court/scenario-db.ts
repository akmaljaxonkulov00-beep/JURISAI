import { CourtScenario } from './court-types'
import { getStagesForProcedure } from './stage-machine'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════════════════
// VERIFIED PRODUCTION EDUCATIONAL SCENARIOS (O'ZBEKISTON QONUNCHILIGI ASOSIDA)
// ═══════════════════════════════════════════════════════════════════════════

export const SEED_SCENARIOS: CourtScenario[] = [
  // 1. JINOYAT — O'G'IRLIK ISHI (JK 169-modda)
  {
    id: 'scen_theft_169',
    title: "Supermarketdan o'g'rilik ishi",
    description:
      "Supermarketdan 1 850 000 so'mlik tovarlarni o'g'irlashda ayblanayotgan fuqaro ishi bo'yicha sud jarayoni.",
    category: 'criminal',
    procedure_type: 'trial',
    difficulty: 'easy',
    facts:
      "2024-yil 12-oktabr kuni soat 18:30 larda sudlanuvchi Shuxrat Qodirov Toshkent shahridagi 'Korzinka' supermarketidan umumiy qiymati 1 850 000 so'mlik oziq-ovqat va maishiy tovarlarni savatga joylab, to'lov qilmasdan kassadan olib chiqib ketayotgan vaqtda qo'riqchi tomonidan to'xtatilgan. Ayblanuvchi oilasida og'ir moddiy sharoit borligini, voyaga yetmagan 2 nafar nogiron farzandi borligini, qilmishidan chin dildan pushaymonligini bildirmoqda. Yetkazilgan moddiy zarar do'konga to'liq qoplangan.",
    legal_basis: [
      {
        code: 'JK',
        article: '169-modda 2-qism',
        title: "O'g'rilik",
        relevance: "O'zganing mol-mulkini yashirin talon-toroj qilish",
      },
      {
        code: 'JK',
        article: '55-modda',
        title: 'Jazoni yengillashtiruvchi holatlar',
        relevance: 'Zararni ixtiyoriy qoplash, pushaymonlik, voyaga yetmagan bolalari borligi',
      },
      {
        code: 'JPK',
        article: '88-modda',
        title: 'Isbot qilinishi lozim bo‘lgan holatlar',
        relevance: 'Jinoyat sodir etilgan vaqt, joy, usul va aybdorning shaxsi',
      },
    ],
    participants: [
      {
        id: 'part_judge',
        role: 'SUDYA',
        title: 'Sud raisi',
        name: 'Farhod Ergashev',
        avatarIcon: '⚖️',
        isUser: false,
        objective:
          'Ishni xolis va qonuniy ko‘rib chiqish, taraflarga teng imkoniyat berish va adolatli hukm chiqarish.',
        allowedKnowledge: ['barcha_ish_materiallari', 'sudlanuvchi_mahallasi', 'ekspertiza'],
        communicationStyle: 'formal',
      },
      {
        id: 'part_prosecutor',
        role: 'PROKUROR',
        title: 'Davlat ayblovchisi',
        name: 'Akbar Toshmatov',
        avatarIcon: '⚡',
        isUser: false,
        objective:
          'Ayblovni qat’iy himoya qilish, jinoyat tarkibi to‘liqligini isbotlash va jazo tayinlashni so‘rash.',
        allowedKnowledge: ['ayblov_xulosasi', 'videoyozuv', 'dalillar_ro‘yxati'],
        communicationStyle: 'formal',
      },
      {
        id: 'part_lawyer',
        role: 'ADVOKAT',
        title: 'Himoyachi',
        name: 'Nilufar Karimova',
        avatarIcon: '🛡️',
        isUser: false,
        objective:
          'Sudlanuvchining huquqlarini himoya qilish, JK 55-modda asosida ozodlikdan mahrum etish bilan bog‘liq bo‘lmagan jazo (jarima/jamoat ishlari) tayinlanishiga erishish.',
        allowedKnowledge: ['ayblov_xulosasi', 'oilaviy_ahvol', 'zarar_qoplangani'],
        communicationStyle: 'formal',
      },
      {
        id: 'part_defendant',
        role: 'SUDLANUVCHI',
        title: 'Sudlanuvchi',
        name: 'Shuxrat Qodirov',
        avatarIcon: '👤',
        isUser: false,
        objective: 'Haqiqatni aytish, pushaymonligini bildirish va suddan yengillik so‘rash.',
        allowedKnowledge: ['shaxsiy_harakatlar', 'moddiy_qiyinchilik'],
        hiddenSecrets: ['Ilgari sudlanmagan, lekin mahallasida qarzga botgan.'],
        communicationStyle: 'emotional',
      },
      {
        id: 'part_witness',
        role: 'GUVOH',
        title: 'Guvoh (Do‘kon xavfsizlik boshlig‘i)',
        name: 'Alisher Bekov',
        avatarIcon: '🔍',
        isUser: false,
        objective:
          'Faktlarni xolisona aytish — qanday to‘xtatilgani va tovarlar holatini ko‘rsatish.',
        allowedKnowledge: ['to‘xtatish_vaqti', 'kassa_holati', 'akt'],
        communicationStyle: 'objective',
      },
      {
        id: 'part_clerk',
        role: 'KOTIB',
        title: 'Sud kotibi',
        name: 'Zulfiya Xasanova',
        avatarIcon: '📋',
        isUser: false,
        objective: 'Sud majlisi bayonnomasini yuritish va ishtirokchilar kelganligini tekshirish.',
        allowedKnowledge: ['taraflar_ro‘yxati'],
        communicationStyle: 'formal',
      },
    ],
    stages: getStagesForProcedure('trial'),
    evidence: [
      {
        id: 'ev_1',
        title: 'Kuzatuv kamerasi videoyozuvi (CD-disk)',
        type: 'photo',
        description:
          'Supermarket zalida tovarlarni sumkaga joylab kassadan o‘tish jarayoni tasvirlangan videofayl.',
        content:
          'Videoda fuqaroning 18:24 dan 18:31 gacha bo‘lgan harakatlari to‘liq va uzilishsiz aks etgan.',
        source: 'Ichki xavfsizlik xizmati kamerasi',
        relevance:
          'Sudlanuvchining bevosita harakatlarini tasdiqlovchi to‘g‘ridan-to‘g‘ri ashyoviy dalil.',
        visibility: 'public',
        status: 'admitted',
      },
      {
        id: 'ev_2',
        title: 'Kassa kvitansiyasi va tovar inventarizatsiyasi akti',
        type: 'document',
        description:
          'Olingan tovarlarning chakana narxi va umumiy summasi 1 850 000 so‘m ekanligi haqidagi moliyaviy hujjat.',
        content:
          'Tovar turlari: 4 quti go‘sht mahsulotlari, bolalar kiyimi, shirinliklar. Jami 1 850 000 so‘m.',
        source: 'Buxgalteriya',
        relevance:
          'Zarar miqdorini belgilaydi (JK 169-modda bo‘yicha ancha miqdor chegarasini ko‘rsatadi).',
        visibility: 'public',
        status: 'admitted',
      },
      {
        id: 'ev_3',
        title: 'Moddiy ahvol va voyaga yetmagan bolalar haqida ma’lumotnoma',
        type: 'document',
        description:
          'Mahalla fuqarolar yig‘inidan olingan kam ta’minlanganlik va oilaviy sharoit to‘g‘risidagi rasmiy xat.',
        content: 'Sudlanuvchining qaramog‘ida 2 nafar voyaga yetmagan farzandi bor, xotini ishsiz.',
        source: 'Mahalla qo‘mitasi',
        relevance: 'JK 55-modda bo‘yicha jazoni yengillashtiruvchi muhim holat.',
        visibility: 'defense_only',
        status: 'unsubmitted',
      },
      {
        id: 'ev_4',
        title: 'Zarar to‘liq qoplanganligi haqida kvitansiya va do‘kon xati',
        type: 'receipt',
        description:
          'Do‘kon hisob raqamiga 1 850 000 so‘m qaytarilgani va da’vo yo‘qligi haqidagi to‘lov hujjati.',
        content:
          'Supermarket ma’muriyati to‘lov qabul qilinganini va moddiy da’vosi yo‘qligini tasdiqlaydi.',
        source: 'Do‘kon ma’muriyati',
        relevance: 'Zararni to‘liq qoplanganligi javobgarlik darajasini keskin kamaytiradi.',
        visibility: 'defense_only',
        status: 'unsubmitted',
      },
    ],
    expected_outcome:
      'Sudlanuvchi JK 169-moddasi bilan aybdor deb topilishi mumkin, lekin JK 55-moddani qo‘llab, zararning qoplanganligi va farzandlarining borligi inobatga olinib, ozodlikdan mahrum qilish bilan bog‘liq bo‘lmagan jazo (jarima yoki ish haqining 20% ushlab qolingan holda axloq tuzatish ishlari) tayinlanishi kutiladi.',
    active: true,
  },

  // 2. FUQAROLIK — SHARTNOMA NIZOSI (FK 345, 666-moddalar)
  {
    id: 'scen_contract_civil',
    title: 'Qurilish pudrat shartnomasi buzilishi',
    description:
      "Bino ta'miri bo'yicha 60 mln so'm qarz va 15 mln so'm penyani undirish to'g'risidagi fuqarolik ishi.",
    category: 'civil',
    procedure_type: 'trial',
    difficulty: 'medium',
    facts:
      "Da'vogar 'Stroy Modern' MChJ va Javobgar 'Baraka Savdo' MChJ o'rtasida umumiy qiymati 120 mln so'mlik bino ta'miri bo'yicha pudrat shartnomasi imzolangan. Buyurtmachi 60 mln so'm avans to'lagan, pudratchi ishlarni yakunlab Forma-2 dalolatnomasini topshirgan. Biroq buyurtmachi tom qismida suv oqishi va pardozlashdagi nuqsonlarni vaj qilib, qolgan 60 mln so'mni to'lashdan bosh tortgan. Da'vogar sud orqali qarzni va shartnoma bo'yicha hisoblangan 15 mln so'm penyani undirishni talab qilmoqda.",
    legal_basis: [
      {
        code: 'FK',
        article: '345-modda',
        title: 'Shartnomaviy majburiyatlarni lozim darajada bajarish',
        relevance: 'Taraflar majburiyatlarini shartnoma shartlariga muvofiq bajarishlari shart.',
      },
      {
        code: 'FK',
        article: '666-modda',
        title: 'Pudrat shartnomasi',
        relevance: 'Bajarilgan ish natijasini qabul qilish va haqini to‘lash majburiyati.',
      },
      {
        code: 'FK',
        article: '672-modda',
        title: 'Ish sifati uchun pudratchining javobgarligi',
        relevance:
          'Buyurtmachi aniqlangan nuqsonlarni bartaraf etishni yoki narxni mutanosib kamaytirishni talab qilishga haqli.',
      },
    ],
    participants: [
      {
        id: 'part_judge_civ',
        role: 'SUDYA',
        title: 'Sudya',
        name: 'Olimjon Rustamov',
        avatarIcon: '⚖️',
        isUser: false,
        objective:
          'FPK qoidalariga rioya qilgan holda, da’vo talablarining qonuniyligi va haqiqiy ish hajmini tekshirish.',
        allowedKnowledge: ['ish_hujjatlari', 'ekspertiza'],
        communicationStyle: 'formal',
      },
      {
        id: 'part_plaintiff_rep',
        role: 'ADVOKAT',
        title: "Da'vogar vakili (Himoyachi)",
        name: 'Sardor Saidov',
        avatarIcon: '💼',
        isUser: false,
        objective:
          "Forma-2 dalolatnomasi asosida qolgan 60 mln so'm va penyani to'liq undirib berish.",
        allowedKnowledge: ['shartnoma', 'dalolatnomalar', 'hisob_kitob'],
        communicationStyle: 'formal',
      },
      {
        id: 'part_defendant_rep',
        role: 'PROKUROR',
        title: 'Javobgar vakili',
        name: 'Lola Umarova',
        avatarIcon: '📑',
        isUser: false,
        objective:
          "Ishdagi nuqsonlar bartaraf etilmaguncha to'lov to'xtatilganini asoslash va qisman da'voni rad ettirish.",
        allowedKnowledge: ['nuqsonlar_dalolatnomasi', 'foto_hisobot'],
        communicationStyle: 'formal',
      },
      {
        id: 'part_expert',
        role: 'EKSPERT',
        title: 'Sud-qurilish eksperti',
        name: 'Ilhom Yusupov',
        avatarIcon: '📐',
        isUser: false,
        objective:
          'Qurilishdagi nuqsonlar qiymati va hajmi bo‘yicha xolis ekspert xulosasini berish.',
        allowedKnowledge: ['ob’ekt_ko‘rigi', 'smeta_hisobi'],
        communicationStyle: 'objective',
      },
      {
        id: 'part_clerk_civ',
        role: 'KOTIB',
        title: 'Sud kotibi',
        name: 'Dilnoza Rahimova',
        avatarIcon: '📋',
        isUser: false,
        objective: 'Majlis bayonini yuritish.',
        allowedKnowledge: ['taraflar'],
        communicationStyle: 'formal',
      },
    ],
    stages: getStagesForProcedure('trial'),
    evidence: [
      {
        id: 'ev_c1',
        title: 'Qurilish pudrat shartnomasi va ilovalar',
        type: 'contract',
        description: '2024-yil 15-martda imzolangan 120 mln so‘mlik shartnoma matni.',
        content:
          'Shartnomada ishlarni topshirish muddati 60 kun, kechiktirilgan har kun uchun 0.1% penya ko‘rsatilgan.',
        source: 'Da’vogar va Javobgar',
        relevance: 'Tomonlarning asosiy huquq va majburiyatlarini belgilaydi.',
        visibility: 'public',
        status: 'admitted',
      },
      {
        id: 'ev_c2',
        title: 'Bajarilgan ishlar to‘g‘risida dalolatnoma (Forma-2)',
        type: 'document',
        description: 'Pudratchi tomonidan 120 mln so‘mlik ish to‘liq bajarilgani haqidagi akt.',
        content: 'Javobgar vakili imzolashdan bosh tortgan, bir tomonlama imzolangan.',
        source: 'Da’vogar',
        relevance: 'Ishning yakunlanganligini isbotlashga urinish.',
        visibility: 'public',
        status: 'admitted',
      },
      {
        id: 'ev_c3',
        title: 'Sud-qurilish texnik ekspertizasi xulosasi',
        type: 'expert_opinion',
        description: 'Rasmiy sud ekspertizasining ob’ekt bo‘yicha xulosasi.',
        content:
          'Ekspertiza bino ta’mirida 8 200 000 so‘mlik sifat nuqsonlari (tom gidroizolyatsiyasi) mavjudligini aniqlagan.',
        source: 'Sud ekspertizasi markazi',
        relevance: 'Da’vo summasidan 8.2 mln so‘mni chegirib tashlashga asos bo‘ladi.',
        visibility: 'public',
        status: 'admitted',
      },
    ],
    expected_outcome:
      "Sud da'vogarning talabini qisman qanoatlantiradi: 60 mln so'mdan ekspertiza aniqlagan 8.2 mln so'm nuqson chegirilib, 51.8 mln so'm asosiy qarz hamda FK 327-modda bo'yicha oqilona miqdorda qisqartirilgan penya undiriladi.",
    active: true,
  },

  // 3. MEHNAT — ISHDAN BO'SHATISH NIZOSI (MK 161, 543-moddalar)
  {
    id: 'scen_labor_dismissal',
    title: "Noqonuniy ishdan bo'shatish",
    description:
      "Xodimni ishga tiklash va majburiy progul uchun ish haqini undirish to'g'risidagi mehnat nizosi.",
    category: 'labor',
    procedure_type: 'trial',
    difficulty: 'medium',
    facts:
      "Da'vogar Shahnoza Mahmudova bankda bosh mutaxassis bo'lib ishlab kelgan. Homiladorlikning 4-oyida unga nisbatan 'kasbiy layoqatsizligi' vaji bilan (MK 161-modda) attestatsiya o'tkazilib, ishdan bo'shatish buyrug'i chiqarilgan. Attestatsiya o'tkazishda kasaba uyushmasi roziligi olinmagan, homilador ayollarni ish beruvchi tashabbusi bilan bo'shatishni taqiqlovchi Mehnat kodeksi normalari buzilgan. Xodim ishga tiklash va 3 oylik majburiy progul uchun 18 mln so'm undirishni so'ramoqda.",
    legal_basis: [
      {
        code: 'MK',
        article: '408-modda',
        title: 'Homilador ayollar bilan mehnat shartnomasini bekor qilishdagi kafolatlar',
        relevance:
          'Homilador ayollar bilan korxona tugatilishidan tashqari hollarda shartnomani bekor qilish man etiladi.',
      },
      {
        code: 'MK',
        article: '543-modda',
        title: 'Noqonuniy ishdan bo‘shatilganda xodimning huquqlarini tiklash',
        relevance: 'Ishga tiklash va majburiy progul vaqti uchun haq to‘lash.',
      },
    ],
    participants: [
      {
        id: 'part_judge_lab',
        role: 'SUDYA',
        title: 'Sudya',
        name: 'Gulnora Karimova',
        avatarIcon: '⚖️',
        isUser: false,
        objective:
          'Mehnat qonunchiligiga rioya etilganini va ishdan bo‘shatish asosliligini tekshirish.',
        allowedKnowledge: ['ish_hujjatlari', 'tibbiy_ma’lumot'],
        communicationStyle: 'formal',
      },
      {
        id: 'part_worker_rep',
        role: 'ADVOKAT',
        title: 'Xodim vakili (Advokat)',
        name: 'Bobur Azizov',
        avatarIcon: '🛡️',
        isUser: false,
        objective:
          'MK 408-moddasiga tayanib buyruqni bekor qilish, ishga tiklash va kompensatsiya undirish.',
        allowedKnowledge: ['barcha_xodim_hujjatlari'],
        communicationStyle: 'formal',
      },
      {
        id: 'part_employer_rep',
        role: 'PROKUROR',
        title: 'Ish beruvchi yuristi',
        name: 'Jamshid Qosimov',
        avatarIcon: '👔',
        isUser: false,
        objective:
          'Attestatsiya natijalari va xodimning ish sifatini ko‘rsatib bo‘shatishni oqlash.',
        allowedKnowledge: ['attestatsiya_hujjatlari'],
        communicationStyle: 'formal',
      },
    ],
    stages: getStagesForProcedure('trial'),
    evidence: [
      {
        id: 'ev_l1',
        title: 'Ishdan bo‘shatish to‘g‘risidagi buyruq',
        type: 'document',
        description: 'Bank boshqaruvining 2024-yil 1-avgustdagi buyrug‘i.',
        content:
          'Xodim bilan shartnoma MK 161-modda 3-bandi (malaka yetarli emasligi) bilan bekor qilingan.',
        source: 'Kadrlar bo‘limi',
        relevance: 'Nizoli huquqiy akt.',
        visibility: 'public',
        status: 'admitted',
      },
      {
        id: 'ev_l2',
        title: 'Homiladorlik hisobiga olinganlik to‘g‘risida tibbiy ma’lumotnoma',
        type: 'document',
        description:
          '14-sonli poliklinikaning xodim 16 haftalik homilador ekanligi haqidagi rasmiy hujjati.',
        content: 'Xodim 2024-yil 10-iyuldan (ishdan bo‘shatishdan oldin) hisobga turgan.',
        source: 'Poliklinika',
        relevance: 'MK 408-moddasining buzilganligini to‘g‘ridan-to‘g‘ri isbotlaydi.',
        visibility: 'public',
        status: 'admitted',
      },
    ],
    expected_outcome:
      "Sud buyruqni noqonuniy deb topadi, xodimni avvalgi lavozimiga zudlik bilan ishga tiklaydi va majburiy progul kunlari uchun 18 mln so'm ish haqi va ma'naviy zarar undirish haqida hal qiluv qarori chiqaradi.",
    active: true,
  },

  // 4. MUZOKARA (NEGOTIATION) — BIZNES SHARTNOMASI NIZOSI
  {
    id: 'scen_negotiation_business',
    title: "Yetkazib berilgan tovar to'lovi bo'yicha muzokara",
    description:
      "85 mln so'mlik to'lov kechikishi va 15 mln so'm penyani sudgacha o'zaro kelishuv yo'li bilan hal etish.",
    category: 'economic',
    procedure_type: 'negotiation',
    difficulty: 'medium',
    facts:
      "Qishloq xo'jaligi mahsulotlari yetkazib beruvchi fermer xo'jaligi va savdo tarmog'i o'rtasida 85 mln so'mlik mahsulot topshirilganidan keyin to'lov 90 kunga kechikkan. Shartnomaga binoan 15 mln so'm penya hisoblangan. Fermer sudga da'vo arizasi kiritishidan oldin tomonlar advokatlar ishtirokida muzokaralar stoliga o'tirishdi. Maqsad — to'lovni 3 oyga bo'lib to'lash grafigini tasdiqlash va penyani kamaytirish.",
    legal_basis: [
      {
        code: 'FK',
        article: '324-modda',
        title: 'Zararni qoplash majburiyati',
        relevance: 'Qarzni qaytarish va foizlar to‘lash majburiyati.',
      },
      {
        code: 'FK',
        article: '260-modda',
        title: 'Neustoyka (jarima, penya)',
        relevance: 'Majburiyat kechiktirilganda penya to‘lash.',
      },
    ],
    participants: [
      {
        id: 'part_creditor_lawyer',
        role: 'ADVOKAT',
        title: 'Fermer xo‘jaligi advokati',
        name: 'Dilshod Raxmonov',
        avatarIcon: '🛡️',
        isUser: false,
        objective:
          'Qarzning kamida 40 foizini zudlik bilan undirish, qolganiga qat’iy grafik va kafillik olish.',
        allowedKnowledge: ['fermer_bank_holati', 'mahsulot_hujjatlari'],
        communicationStyle: 'formal',
      },
      {
        id: 'part_debtor_dir',
        role: 'PROKUROR',
        title: 'Savdo tarmog‘i direktori',
        name: 'Jasur Fayziyev',
        avatarIcon: '👔',
        isUser: false,
        objective:
          'Penya summasidan to‘liq kechishni so‘rash va to‘lovni 4 oyga bo‘lib to‘lashga erishish.',
        allowedKnowledge: ['kassadagi_tushum', 'aylanma_mablag‘'],
        communicationStyle: 'emotional',
      },
      {
        id: 'part_mediator',
        role: 'SUDYA',
        title: 'Neytral mediator',
        name: 'Ziyoda Qosimova',
        avatarIcon: '🤝',
        isUser: false,
        objective:
          'Tomonlarni o‘zaro maqbul kompromissga keltirish va bitim tuzilishini ta’minlash.',
        allowedKnowledge: ['ikkala_taraf_talabi'],
        communicationStyle: 'objective',
      },
    ],
    stages: getStagesForProcedure('negotiation'),
    evidence: [
      {
        id: 'ev_n1',
        title: 'Mahsulot yetkazib berish shartnomasi va schyot-faktura',
        type: 'contract',
        description:
          '85 mln so‘mlik qishloq xo‘jaligi mahsulotlari topshirilgani to‘g‘risidagi qabul dalolatnomasi.',
        content: 'Mahsulotlar to‘liq hajmda va nuqsonsiz qabul qilingan.',
        source: 'Fermer xo‘jaligi',
        relevance: 'Qarz mavjudligining so‘zsiz isboti.',
        visibility: 'public',
        status: 'admitted',
      },
    ],
    expected_outcome:
      "Tomonlar kelishuv bitimi tuzadilar: Qarzning 30 mln so'mi 10 kun ichida to'lanadi, qolgan 55 mln so'm 2 oyga teng taqsimlanadi, penya 5 mln so'mgacha kamaytiriladi.",
    active: true,
  },

  // 5. TERGOV (INVESTIGATION) — FIRIBGARLIK ISHI (JK 168-modda)
  {
    id: 'scen_investigation_fraud',
    title: 'Kiber-firibgarlik tergovi',
    description:
      "Bank kartalaridan fishing havolasi orqali 14.5 mln so'm pul o'g'irlanganligi bo'yicha tergov simulyatsiyasi.",
    category: 'criminal',
    procedure_type: 'investigation',
    difficulty: 'hard',
    facts:
      "Fuqaro Shahzod Karimovning plastik kartasidan 'Telegram' orqali yuborilgan soxta lotereya havolasi (fishing) orqali 14 500 000 so'm mablag' noma'lum kartaga o'tkazib olingan. Tergovchi mablag' tushgan karta egasi Doniyor Olimovni (dropper) aniqladi. So'roq paytida u o'z kartasini Telegramdagi begona shaxsga 500 000 so'm evaziga vaqtincha foydalanishga berganini da'vo qilmoqda. Tergovchi haqiqiy jinoyat zanjirini ochishi va dalillarni mustahkamlashi zarur.",
    legal_basis: [
      {
        code: 'JK',
        article: '168-modda 3-qism',
        title: 'Firibgarlik',
        relevance: 'Axborot texnologiyalaridan foydalanib sodir etilgan firibgarlik.',
      },
      {
        code: 'JPK',
        article: '96-modda',
        title: 'So‘roq qilish tartibi',
        relevance: 'Gumon qilinuvchini so‘roq qilish qoidalari.',
      },
    ],
    participants: [
      {
        id: 'part_investigator',
        role: 'PROKUROR',
        title: 'Katta tergovchi',
        name: 'Temur Nazarov',
        avatarIcon: '🔍',
        isUser: false,
        objective:
          'Dropperning qilmishdagi ishtirok darajasini, sheriklarini va pul harakati izlarini fosh etish.',
        allowedKnowledge: ['bank_ko‘chirmasi', 'IP_loglar'],
        communicationStyle: 'formal',
      },
      {
        id: 'part_suspect',
        role: 'SUDYA',
        title: 'Gumonlanuvchi',
        name: 'Doniyor Olimov',
        avatarIcon: '👤',
        isUser: false,
        objective:
          'O‘zining jinoyatdan xabarsiz bo‘lganini va pulni o‘zi olmaganini isbotlashga urinish.',
        allowedKnowledge: ['kartani_bergan_holati'],
        communicationStyle: 'evasive',
      },
      {
        id: 'part_defense',
        role: 'ADVOKAT',
        title: 'Gumonlanuvchi advokati',
        name: 'Akmal Ismoilov',
        avatarIcon: '🛡️',
        isUser: false,
        objective:
          'Mijozi firibgarlik rejasidan bexabar bo‘lganini, qasddan sodir etilmaganini asoslash.',
        allowedKnowledge: ['mijoz_gaplari'],
        communicationStyle: 'formal',
      },
    ],
    stages: getStagesForProcedure('investigation'),
    evidence: [
      {
        id: 'ev_inv1',
        title: 'Bank tranzaksiyasi va IP manzil loglari',
        type: 'report',
        description:
          'Pul mablag‘lari 14.5 mln so‘m hajmda 3 daqiqa ichida yechib olingani haqidagi bank hisoboti.',
        content:
          'Pul Toshkent shahrida ro‘yxatga olingan karta orqali bankomatdan naqdlashtirilgan.',
        source: 'Bank monitoring xizmati',
        relevance: 'Pul harakatining aniq izi.',
        visibility: 'public',
        status: 'admitted',
      },
    ],
    expected_outcome:
      "Tergovchi gumonlanuvchining ko'rsatmalaridagi ziddiyatlarni ochib, JK 168-modda bo'yicha ayblov e'lon qiladi.",
    active: true,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Barcha faol ssenariylarni qaytaradi (avval `court_scenarios`, bo'lmasa SEED)
 */
export async function listAllScenarios(options?: {
  category?: string
  procedure_type?: string
  difficulty?: string
  includeInactive?: boolean
}): Promise<CourtScenario[]> {
  try {
    let query = supabase.from('court_scenarios').select('*')

    if (!options?.includeInactive) {
      query = query.eq('active', true)
    }
    if (options?.category && options.category !== 'all') {
      query = query.eq('category', options.category)
    }
    if (options?.procedure_type && options.procedure_type !== 'all') {
      query = query.eq('procedure_type', options.procedure_type)
    }
    if (options?.difficulty && options.difficulty !== 'all') {
      query = query.eq('difficulty', options.difficulty)
    }

    const { data, error } =
      typeof (query as any).order === 'function'
        ? await (query as any).order('created_at', { ascending: false })
        : await query

    if (!error && data && data.length > 0) {
      return data as CourtScenario[]
    }
  } catch (err) {
    console.warn('Error fetching court_scenarios from Supabase, using seed fallback:', err)
  }

  // Fallback to verified seed scenarios
  let filtered = SEED_SCENARIOS
  if (options?.category && options.category !== 'all') {
    filtered = filtered.filter(s => s.category === options.category)
  }
  if (options?.procedure_type && options.procedure_type !== 'all') {
    filtered = filtered.filter(s => s.procedure_type === options.procedure_type)
  }
  if (options?.difficulty && options.difficulty !== 'all') {
    filtered = filtered.filter(s => s.difficulty === options.difficulty)
  }
  return filtered
}

/**
 * ID bo'yicha ssenariyni oladi
 */
export async function getScenarioById(scenarioId: string): Promise<CourtScenario | null> {
  try {
    const { data, error } = await supabase
      .from('court_scenarios')
      .select('*')
      .eq('id', scenarioId)
      .maybeSingle()

    if (!error && data) {
      return data as CourtScenario
    }
  } catch {}

  const found = SEED_SCENARIOS.find(s => s.id === scenarioId)
  return found || null
}

/**
 * Admin: yangi ssenariy qo'shish
 */
export async function createScenario(
  scenario: Omit<CourtScenario, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; scenario?: CourtScenario; error?: string }> {
  try {
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('court_scenarios')
      .insert({
        title: scenario.title,
        description: scenario.description || '',
        category: scenario.category || 'criminal',
        procedure_type: scenario.procedure_type || 'trial',
        difficulty: scenario.difficulty || 'medium',
        facts: scenario.facts || '',
        legal_basis: scenario.legal_basis || [],
        participants: scenario.participants || [],
        stages: scenario.stages || getStagesForProcedure(scenario.procedure_type),
        evidence: scenario.evidence || [],
        expected_outcome: scenario.expected_outcome || '',
        active: scenario.active !== undefined ? scenario.active : true,
      })
      .select('*')
      .single()

    if (error) throw error
    return { success: true, scenario: data as CourtScenario }
  } catch (err: any) {
    console.error('createScenario error:', err)
    return { success: false, error: err.message || 'Ssenariy saqlashda xatolik' }
  }
}

/**
 * Admin: ssenariyni yangilash
 */
export async function updateScenario(
  scenarioId: string,
  updates: Partial<CourtScenario>
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('court_scenarios')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scenarioId)

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error('updateScenario error:', err)
    return { success: false, error: err.message || 'Ssenariy yangilashda xatolik' }
  }
}

/**
 * Admin: ssenariyni o'chirish
 */
export async function deleteScenario(
  scenarioId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = getSupabaseAdmin()
    const { error } = await admin.from('court_scenarios').delete().eq('id', scenarioId)
    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error('deleteScenario error:', err)
    return { success: false, error: err.message || 'Ssenariy o‘chirishda xatolik' }
  }
}
