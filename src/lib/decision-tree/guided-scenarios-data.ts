/**
 * guided-scenarios-data.ts — JURISTIV Qarorlar Daraxti 2.0
 * 6 ta asosiy soha bo'yicha bosqichma-bosqich yo'l ko'rsatuvchi ssenariylar va qonuniy asoslar.
 */

export interface GuidedOption {
  id: string
  label: string
  hint?: string
  nextQuestionId: string | null // null means terminal verdict
  terminalResultId?: string
  winProbabilityChange: number // e.g. +20, -30
}

export interface GuidedQuestion {
  id: string
  question: string
  explanation: string
  legalBasis: {
    code: string
    article: string
    title: string
    url: string
  }
  options: GuidedOption[]
}

export interface GuidedTerminalResult {
  id: string
  title: string
  winProbability: number // 0-100
  probabilityLevel: 'high' | 'medium' | 'low'
  summary: string
  requiredEvidence: string[]
  risks: string[]
  recommendedSteps: string[]
  applicableLaws: Array<{
    code: string
    article: string
    title: string
    url: string
  }>
  matchingDocumentId?: string // Hujjatlar konstruktoriga bog'lanish
  matchingDocumentName?: string
}

export interface GuidedScenario {
  id: string
  category: 'civil' | 'labor' | 'family' | 'inheritance' | 'administrative' | 'contracts'
  categoryNameUz: string
  title: string
  description: string
  icon: string
  initialQuestionId: string
  questions: Record<string, GuidedQuestion>
  results: Record<string, GuidedTerminalResult>
}

export const GUIDED_SCENARIOS: GuidedScenario[] = [
  // 1. FUQAROLIK: Qarz undirish
  {
    id: 'civil-debt',
    category: 'civil',
    categoryNameUz: 'Fuqarolik huquqi',
    title: 'Qarz mablag‘i va penyani undirish',
    description: 'Qarzdordan qaytarilmagan pul mablag‘ini sud orqali undirish istiqbollari va zarur hujjatlar',
    icon: '💰',
    initialQuestionId: 'q_has_document',
    questions: {
      q_has_document: {
        id: 'q_has_document',
        question: 'Qarz berilganligini tasdiqlovchi yozma hujjat (tilxat, shartnoma yoki bank cheki) bormi?',
        explanation:
          'O‘zbekiston Respublikasi Fuqarolik kodeksining 733-moddasiga binoan, fuqarolar o‘rtasidagi qarz BHMning 10 baravaridan oshsa, yozma shaklda tuzilishi shart. Yozma shaklga rioya qilmaslik sudda guvohlarning ko‘rsatuvlariga tayanish huquqidan mahrum qiladi (FK 109-modda).',
        legalBasis: {
          code: 'FK',
          article: '733-modda',
          title: 'Qarz shartnomasining shakli',
          url: 'https://lex.uz/docs/111189#115680',
        },
        options: [
          {
            id: 'opt_notary',
            label: 'Ha, notarial tasdiqlangan qarz shartnomasi bor',
            hint: 'Eng ishonchli dalil — notarius ijro xati olish ham mumkin',
            nextQuestionId: 'q_due_date',
            winProbabilityChange: 40,
          },
          {
            id: 'opt_handwritten',
            label: 'Ha, qo‘lda yozilgan tilxat (raspilka) mavjud',
            hint: 'Qarzdor o‘z qo‘li bilan imzolagan va pasport ma’lumotlari yozilgan',
            nextQuestionId: 'q_due_date',
            winProbabilityChange: 30,
          },
          {
            id: 'opt_bank_transfer',
            label: 'Yozma tilxat yo‘q, lekin bank karta/hisobiga o‘tkazilgan to‘lov cheki bor',
            hint: 'Bank tasdiqlagan tranzaksiya kvitansiyasi',
            nextQuestionId: 'q_statute_limit',
            winProbabilityChange: 15,
          },
          {
            id: 'opt_verbal',
            label: 'Hujjat yo‘q, faqat og‘zaki kelishilgan (guvohlar bor)',
            hint: 'Faqat guvohlarning so‘ziga tayanish qarz ishlarida juda qiyin',
            nextQuestionId: null,
            terminalResultId: 'res_debt_no_docs',
            winProbabilityChange: -40,
          },
          {
            id: 'opt_unknown',
            label: 'Bilmayman / Hujjat yo‘qolgan',
            hint: 'Hujjatni tiklash yoki bankdan ko‘chirma olish talab etiladi',
            nextQuestionId: 'q_due_date',
            winProbabilityChange: 0,
          },
        ],
      },
      q_due_date: {
        id: 'q_due_date',
        question: 'Tilxat yoki kelishuvda qarzni qaytarishning aniq muddati ko‘rsatilganmi?',
        explanation:
          'FK 735-moddasiga ko‘ra, qarz muddati kelgan paytdan boshlab majburiyat buzilgan hisoblanadi va penya talab qilish huquqi paydo bo‘ladi. Agar muddat ko‘rsatilmagan bo‘lsa, talab qo‘yilgan kundan boshlab 30 kun beriladi.',
        legalBasis: {
          code: 'FK',
          article: '735-modda',
          title: 'Qarz oluvchining qarz summasini qaytarish majburiyati',
          url: 'https://lex.uz/docs/111189#115695',
        },
        options: [
          {
            id: 'opt_due_expired',
            label: 'Ha, muddat ko‘rsatilgan va allaqachon o‘tib ketgan',
            nextQuestionId: 'q_statute_limit',
            winProbabilityChange: 20,
          },
          {
            id: 'opt_no_due_date',
            label: 'Yo‘q, aniq muddat ko‘rsatilmagan',
            hint: 'Avval rasmiy talabnoma (pretenziya) yuborish kerak bo‘ladi',
            nextQuestionId: 'q_statute_limit',
            winProbabilityChange: 5,
          },
          {
            id: 'opt_due_not_yet',
            label: 'Qaytarish muddati hali kelmagan',
            nextQuestionId: null,
            terminalResultId: 'res_debt_premature',
            winProbabilityChange: -50,
          },
        ],
      },
      q_statute_limit: {
        id: 'q_statute_limit',
        question: 'Qarz qaytarilishi kerak bo‘lgan kundan buyon qancha vaqt o‘tdi?',
        explanation:
          'FK 150-moddasiga binoan umumiy da’vo muddati 3 yil. Agar 3 yildan oshib ketgan bo‘lsa va muddat to‘xtatilish holatlari (qisman to‘lash, yozma tan olish) bo‘lmasa, javobgar muddati o‘tganligini vaj qilib da’voni rad ettirishi mumkin (FK 153-modda).',
        legalBasis: {
          code: 'FK',
          article: '150-modda',
          title: 'Umumiy da’vo muddati',
          url: 'https://lex.uz/docs/111189#114620',
        },
        options: [
          {
            id: 'opt_under_3_years',
            label: '3 yildan kam vaqt o‘tdi (Da’vo muddati ichida)',
            nextQuestionId: null,
            terminalResultId: 'res_debt_success_high',
            winProbabilityChange: 25,
          },
          {
            id: 'opt_over_3_years_recognized',
            label: '3 yildan oshgan, lekin qarzdor yaqinda qisman to‘ladi yoki yozma xat berdi',
            hint: 'FK 157-moddasiga asosan qarzdorning harakati da’vo muddatini yangidan boshlaydi',
            nextQuestionId: null,
            terminalResultId: 'res_debt_success_medium',
            winProbabilityChange: 10,
          },
          {
            id: 'opt_over_3_years_silent',
            label: '3 yildan oshgan va hech qanday to‘lov yoki yozishmalar bo‘lmagan',
            nextQuestionId: null,
            terminalResultId: 'res_debt_expired',
            winProbabilityChange: -30,
          },
        ],
      },
    },
    results: {
      res_debt_success_high: {
        id: 'res_debt_success_high',
        title: 'Qarzni to‘liq undirish imkoniyati juda yuqori',
        winProbability: 92,
        probabilityLevel: 'high',
        summary:
          'Sizda yetarli yozma dalillar mavjud, qarz muddati kelgan va da’vo muddati (3 yil) o‘tmagan. Sudda qarz summasi, penya va to‘langan davlat bojini to‘liq undirish kafolatlangan.',
        requiredEvidence: [
          'Tilxat yoki qarz shartnomasining asl nusxasi',
          'Da’vogar va javobgarning pasport (ID-karta) nusxalari',
          'Bank orqali pul o‘tkazilgan bo‘lsa, bank kvitansiyasi',
          'Sudga to‘langan davlat boji kvitansiyasi',
        ],
        risks: [
          'Javobgarda rasmiy mulk yoki hisob raqamida mablag‘ bo‘lmasligi (MIB orqali ijro etishda cho‘zilish)',
        ],
        recommendedSteps: [
          'Javobgarga 7 kunlik yozma ogohlantirish (talabnoma) yuboring',
          'Hujjatlar konstruktoridan foydalanib da’vo arizasini tayyorlang',
          'Davlat bojini to‘lang va arizani fuqarolik sudiga (my.sud.uz orqali) topshiring',
        ],
        applicableLaws: [
          {
            code: 'FK',
            article: '732-modda',
            title: 'Qarz shartnomasi',
            url: 'https://lex.uz/docs/111189#115670',
          },
          {
            code: 'FK',
            article: '735-modda',
            title: 'Qarzni qaytarish majburiyati',
            url: 'https://lex.uz/docs/111189#115695',
          },
          {
            code: 'FPK',
            article: '189-modda',
            title: 'Da’vo arizasining shakli va mazmuni',
            url: 'https://lex.uz/docs/3517337#3520110',
          },
        ],
        matchingDocumentId: 'doc-civil-debt-claim-001',
        matchingDocumentName: 'Qarz summasi va penya undirish to‘g‘risida da’vo arizasi',
      },
      res_debt_success_medium: {
        id: 'res_debt_success_medium',
        title: 'Qarzni undirish imkoniyati o‘rtacha (Qo‘shimcha dalil talab etiladi)',
        winProbability: 65,
        probabilityLevel: 'medium',
        summary:
          'Ish bo‘yicha da’vo muddati yoki to‘lov tasdig‘i bilan bog‘liq noaniqliklar mavjud. Qarzdorning qarzni tan olganligini isbotlovchi bank ko‘chirmasi yoki yozishmalar sudda hal qiluvchi rol o‘ynaydi.',
        requiredEvidence: [
          'Qarzdor bilan yozishmalar (SMS, Telegram — notarial tasdiqlangan)',
          'Bank o‘tkazmalari ko‘chirmasi',
          'Guvohlar ko‘rsatuvlari',
        ],
        risks: [
          'Javobgar da’vo muddati o‘tganligini vaj qilib ko‘rsatishi mumkin',
        ],
        recommendedSteps: [
          'Qarzdordan qarzni tan olish to‘g‘risida solishtirma dalolatnoma (akt sverkasi) oling',
          'Da’vo arizasida da’vo muddatining uzilishi asoslarini batafsil yoriting',
        ],
        applicableLaws: [
          {
            code: 'FK',
            article: '157-modda',
            title: 'Da’vo muddati o‘tishining uzilishi',
            url: 'https://lex.uz/docs/111189#114660',
          },
        ],
        matchingDocumentId: 'doc-civil-debt-claim-001',
        matchingDocumentName: 'Qarz summasi va penya undirish to‘g‘risida da’vo arizasi',
      },
      res_debt_no_docs: {
        id: 'res_debt_no_docs',
        title: 'Sud orqali undirish ehtimoli juda past (Hujjat yetishmaydi)',
        winProbability: 15,
        probabilityLevel: 'low',
        summary:
          'FK 109 va 733-moddalari talablariga rioya qilinmagan. Yozma tilxatsiz fuqarolik sudi faqat guvohlarning og‘zaki so‘zlari asosida qarz undirib bermaydi.',
        requiredEvidence: [
          'Bank orqali amalga oshirilgan to‘lov cheki',
          'Qarzdorning ovozli xabari yoki audioyozuvi (agar ekspertiza tasdiqlasa)',
        ],
        risks: [
          'FPK talablariga ko‘ra da’vo arizasi dalillar yetarli bo‘lmagani sababli rad etiladi',
        ],
        recommendedSteps: [
          'Qarzdor bilan uchrashib, qarzni qismlarga bo‘lib to‘lash haqida rasmiy tilxat yozdirib oling',
          'Agar qarzdor firibgarlik yo‘li bilan pulni o‘zlashtirgan bo‘lsa, IIOga ariza berish varianti ko‘rib chiqiladi',
        ],
        applicableLaws: [
          {
            code: 'FK',
            article: '109-modda',
            title: 'Bitimning oddiy yozma shakliga rioya qilmaslik oqibatlari',
            url: 'https://lex.uz/docs/111189#114420',
          },
        ],
      },
      res_debt_premature: {
        id: 'res_debt_premature',
        title: 'Da’vo berishga hali erta (Muddat kelmagan)',
        winProbability: 0,
        probabilityLevel: 'low',
        summary:
          'Shartnomada yoki tilxatda ko‘rsatilgan qarzni qaytarish muddati hali yetib kelmagan. Muddatidan oldin da’vo qo‘zg‘atish sud tomonidan rad etiladi.',
        requiredEvidence: ['Tilxat'],
        risks: ['Sud arizani qabul qilishni rad etadi'],
        recommendedSteps: ['Kelishilgan muddat tugashini kuting'],
        applicableLaws: [
          {
            code: 'FK',
            article: '735-modda',
            title: 'Qarzni qaytarish muddati',
            url: 'https://lex.uz/docs/111189#115695',
          },
        ],
      },
      res_debt_expired: {
        id: 'res_debt_expired',
        title: 'Da’vo muddati (3 yil) o‘tib ketgan',
        winProbability: 25,
        probabilityLevel: 'low',
        summary:
          'Qarz muddati tugaganidan buyon 3 yildan ortiq vaqt o‘tgan. Agar javobgar sudda da’vo muddati o‘tganligini bildirsa, sud da’voni qanoatlantirishni rad etishga majbur.',
        requiredEvidence: [
          'Da’vo muddatini o‘tkazib yuborishning uzrli sabablarini tasdiqlovchi tibbiy yoki xizmat ma’lumotnomalari',
        ],
        risks: ['FK 153-moddasiga binoan sud da’voni to‘liq rad etadi'],
        recommendedSteps: [
          'Muddatni tiklash bo‘yicha uzrli sabablarni to‘plang yoki qarzdordan qarzni tan olganligi to‘g‘risida yangi yozma xat oling',
        ],
        applicableLaws: [
          {
            code: 'FK',
            article: '153-modda',
            title: 'Da’vo muddatini qo‘llash oqibatlari',
            url: 'https://lex.uz/docs/111189#114635',
          },
        ],
      },
    },
  },

  // 2. MEHNAT HUQUQI: Ish haqini undirish va noqonuniy bo'shatish
  {
    id: 'labor-dismissal',
    category: 'labor',
    categoryNameUz: 'Mehnat huquqi',
    title: 'Noqonuniy bo‘shatish va to‘lanmagan ish haqini undirish',
    description: 'Ish beruvchi tomonidan qonun buzilgan holda ishdan bo‘shatilgan yoki oylik berilmagan holatlarni hal qilish',
    icon: '💼',
    initialQuestionId: 'q_labor_contract',
    questions: {
      q_labor_contract: {
        id: 'q_labor_contract',
        question: 'Ish beruvchi bilan rasmiy mehnat shartnomasi yoki buyruq mavjudmi?',
        explanation:
          'Yangi Mehnat kodeksining 104-moddasiga ko‘ra mehnat shartnomasi yozma shaklda tuzilishi shart. Lekin xodim ish beruvchining ruxsati bilan haqiqatda ishga qo‘yilgan bo‘lsa, shartnoma tuzilgan hisoblanadi (MK 107-modda).',
        legalBasis: {
          code: 'MK',
          article: '107-modda',
          title: 'Haqiqatda ishga qo‘yish',
          url: 'https://lex.uz/docs/6257288#6258410',
        },
        options: [
          {
            id: 'opt_contract_yes',
            label: 'Ha, rasmiy mehnat shartnomasi va ishga qabul qilish buyrug‘i bor',
            hint: 'Mehnat daftarchasi yoki YAMMT tizimidagi yozuv mavjud',
            nextQuestionId: 'q_labor_claim_type',
            winProbabilityChange: 40,
          },
          {
            id: 'opt_contract_electronic',
            label: 'YAMMT (my.mehnat.uz) tizimida elektron ro‘yxatdan o‘tgan',
            hint: 'Yagona milliy mehnat tizimidagi elektron mehnat shartnomasi',
            nextQuestionId: 'q_labor_claim_type',
            winProbabilityChange: 40,
          },
          {
            id: 'opt_contract_informal',
            label: 'Shartnoma tuzilmagan, norasmiy ishlaganman (lekin isbotlar bor)',
            hint: 'Guvohlar, korxona propuski, oylik tushgan karta ko‘chirmasi',
            nextQuestionId: 'q_labor_claim_type',
            winProbabilityChange: 10,
          },
          {
            id: 'opt_contract_unknown',
            label: 'Bilmayman / Hujjatlar ishxonada qolgan',
            nextQuestionId: 'q_labor_claim_type',
            winProbabilityChange: 15,
          },
        ],
      },
      q_labor_claim_type: {
        id: 'q_labor_claim_type',
        question: 'Asosiy talabingiz nimadan iborat?',
        explanation:
          'Mehnat nizolarida talab turiga qarab da’vo muddatlari turlicha bo‘ladi: Ishga tiklash bo‘yicha ishdan bo‘shatish buyrug‘i berilgan kundan boshlab 1 OY, boshqa mehnat nizolari bo‘yicha 6 OY (MK 560-modda).',
        legalBasis: {
          code: 'MK',
          article: '560-modda',
          title: 'Mehnat nizolarini ko‘rib chiqish uchun sudga murojaat qilish muddatlari',
          url: 'https://lex.uz/docs/6257288#6262980',
        },
        options: [
          {
            id: 'opt_unpaid_wages',
            label: 'Oylik ish haqi va ishdan bo‘shatish nafaqasini undirish',
            hint: 'MK 333-modda bo‘yicha kechiktirilgan har bir kun uchun kompensatsiya bilan',
            nextQuestionId: 'q_labor_deadline',
            winProbabilityChange: 25,
          },
          {
            id: 'opt_reinstatement',
            label: 'Noqonuniy bo‘shatilganman — ishga qayta tiklashni talab qilaman',
            hint: 'Majburiy progul kunlari uchun o‘rtacha ish haqi undirish bilan',
            nextQuestionId: 'q_labor_deadline',
            winProbabilityChange: 20,
          },
        ],
      },
      q_labor_deadline: {
        id: 'q_labor_deadline',
        question: 'Ishdan bo‘shatilganingiz yoki huquqingiz buzilganidan buyon qancha vaqt o‘tdi?',
        explanation:
          'Ishga tiklash bo‘yicha muddat 1 oy! Oylik undirish bo‘yicha 6 oy. Ish xodimi mehnat nizolari bo‘yicha sudga murojaat qilganda davlat bojidan to‘liq ozod etilgan (FPK 19-modda, Soliq kodeksi).',
        legalBasis: {
          code: 'MK',
          article: '560-modda',
          title: 'Sudga murojaat qilish muddatlari',
          url: 'https://lex.uz/docs/6257288#6262980',
        },
        options: [
          {
            id: 'opt_labor_time_valid',
            label: 'Belgilangan muddat ichida (1 oydan / 6 oydan kam)',
            nextQuestionId: null,
            terminalResultId: 'res_labor_success',
            winProbabilityChange: 30,
          },
          {
            id: 'opt_labor_time_passed',
            label: 'Muddat o‘tib ketgan, lekin uzrli sabab (kasallik, karantin) bor edi',
            nextQuestionId: null,
            terminalResultId: 'res_labor_remedy',
            winProbabilityChange: 10,
          },
          {
            id: 'opt_labor_time_too_late',
            label: 'Muddat ancha oldin o‘tib ketgan, uzrli sabablar yo‘q',
            nextQuestionId: null,
            terminalResultId: 'res_labor_expired',
            winProbabilityChange: -30,
          },
        ],
      },
    },
    results: {
      res_labor_success: {
        id: 'res_labor_success',
        title: 'Ish haqini undirish va huquqni tiklash ehtimoli juda yuqori',
        winProbability: 95,
        probabilityLevel: 'high',
        summary:
          'Mehnat qonunchiligi xodim manfaatlarini qat’iy himoya qiladi. MK 333-moddasiga asosan kechiktirilgan har bir kun uchun Markaziy bank qayta moliyalash stavkasi miqdorida foiz hamda ma’naviy zarar undiriladi. Xodim davlat boji to‘lamaydi!',
        requiredEvidence: [
          'Mehnat shartnomasi yoki buyruq ko‘chirmasi',
          'Ishdan bo‘shatish haqidagi buyruq',
          'Oylik maosh bo‘yicha hisob-kitob varaqasi (raschyotka) yoki bank kartasi ko‘chirmasi',
        ],
        risks: [
          'Ish beruvchi korxona tugatilgan yoki bankrot bo‘lgan bo‘lishi mumkin',
        ],
        recommendedSteps: [
          'Bandlik va mehnat munosabatlari vazirligi Davlat mehnat inspeksiyasiga xat bering',
          'Hujjatlar konstruktoridan foydalanib Fuqarolik sudiga da’vo arizasi tayyorlang',
          'Ariza va dalillarni bepul (davlat bojisiz) sudga topshiring',
        ],
        applicableLaws: [
          {
            code: 'MK',
            article: '333-modda',
            title: 'Ish haqini to‘lash kechiktirilganligi uchun javobgarlik',
            url: 'https://lex.uz/docs/6257288#6260810',
          },
          {
            code: 'FPK',
            article: '189-modda',
            title: 'Mehnat nizolarida da’vo qo‘zg‘atish',
            url: 'https://lex.uz/docs/3517337#3520110',
          },
        ],
        matchingDocumentId: 'doc-labor-unpaid-wages-003',
        matchingDocumentName: 'To‘lanmagan ish haqini undirish to‘g‘risida da’vo arizasi',
      },
      res_labor_remedy: {
        id: 'res_labor_remedy',
        title: 'O‘tkazilgan muddatni tiklash bilan da’vo kiritish mumkin',
        winProbability: 70,
        probabilityLevel: 'medium',
        summary:
          'MK 560-moddasiga asosan uzrli sabablar bilan o‘tkazib yuborilgan muddat sud tomonidan qayta tiklanishi mumkin. Arizaga kasallik varaqasi yoki rasmiy ma’lumotnomalar ilova qilinishi kerak.',
        requiredEvidence: ['Kasallik varaqasi (bolnichniy)', 'Mehnat shartnomasi'],
        risks: ['Sud sabablarni uzrsiz deb topishi mumkin'],
        recommendedSteps: [
          'Da’vo arizasida da’vo muddatini tiklash to‘g‘risida alohida iltimosnoma kiriting',
        ],
        applicableLaws: [
          {
            code: 'MK',
            article: '560-modda',
            title: 'O‘tkazilgan muddatlarni tiklash',
            url: 'https://lex.uz/docs/6257288#6262980',
          },
        ],
        matchingDocumentId: 'doc-labor-unpaid-wages-003',
        matchingDocumentName: 'To‘lanmagan ish haqini undirish to‘g‘risida da’vo arizasi',
      },
      res_labor_expired: {
        id: 'res_labor_expired',
        title: 'Da’vo muddati o‘tganligi sababli rad etilish xavfi bor',
        winProbability: 30,
        probabilityLevel: 'low',
        summary:
          'Xodim sudga murojaat qilish muddatini jiddiy uzrli sabablarsiz o‘tkazib yuborgan taqdirda ish beruvchining arizasiga ko‘ra ish rad qilinishi mumkin.',
        requiredEvidence: ['Dalillar'],
        risks: ['Javobgar da’vo muddatini vaj qiladi'],
        recommendedSteps: [
          'Pretenziya orqali kelishish yoki prokuratura organiga qonunbuzarlik yuzasidan xabar berish',
        ],
        applicableLaws: [
          {
            code: 'MK',
            article: '560-modda',
            title: 'Sudga murojaat qilish muddati',
            url: 'https://lex.uz/docs/6257288#6262980',
          },
        ],
      },
    },
  },

  // 3. OILAVIY HUQUQ: Nikohdan ajratish va aliment
  {
    id: 'family-divorce',
    category: 'family',
    categoryNameUz: 'Oilaviy huquq',
    title: 'Nikohdan ajratish va voyaga yetmagan bolalarga aliment',
    description: 'Sud orqali nikohni bekor qilish, yarashtirish muddati va aliment miqdorini belgilash',
    icon: '👨‍👩‍👧',
    initialQuestionId: 'q_family_kids',
    questions: {
      q_family_kids: {
        id: 'q_family_kids',
        question: 'O‘rtada voyaga yetmagan umumiy farzandlar bormi?',
        explanation:
          'Oila kodeksining 40-moddasiga ko‘ra, voyaga yetmagan bolalari bo‘lgan er-xotinlar faqat sud tartibida ajratiladi (FHDYo orqali ajratish mumkin emas).',
        legalBasis: {
          code: 'OK',
          article: '40-modda',
          title: 'Sud tartibida nikohdan ajratish',
          url: 'https://lex.uz/docs/104720#105450',
        },
        options: [
          {
            id: 'opt_kids_yes',
            label: 'Ha, voyaga yetmagan farzand(lar)imiz bor',
            hint: 'Aliment ham bir vaqtning o‘zida hal qilinadi',
            nextQuestionId: 'q_family_consent',
            winProbabilityChange: 20,
          },
          {
            id: 'opt_kids_no',
            label: 'Yo‘q, umumiy farzandlar yo‘q',
            nextQuestionId: 'q_family_consent',
            winProbabilityChange: 30,
          },
        ],
      },
      q_family_consent: {
        id: 'q_family_consent',
        question: 'Ikkinchi taraf (er yoki xotin) ajrashishga rozimi?',
        explanation:
          'Agar ikkinchi taraf rozi bo‘lmasa, sud OK 40-moddasiga muvofiq oilani saqlab qolish uchun 6 oygacha yarashtirish muddati tayinlashi mumkin.',
        legalBasis: {
          code: 'OK',
          article: '40-modda',
          title: 'Er-xotinga yarashtirish uchun muhlat berish',
          url: 'https://lex.uz/docs/104720#105465',
        },
        options: [
          {
            id: 'opt_both_agree',
            label: 'Ha, ikkala tomon ham ajrashishga to‘liq rozi',
            nextQuestionId: null,
            terminalResultId: 'res_divorce_mutual',
            winProbabilityChange: 35,
          },
          {
            id: 'opt_one_opposes',
            label: 'Yo‘q, ikkinchi taraf ajrashishga qarshi yoki kelmayapti',
            hint: 'Sud 1 oydan 6 oygacha yarashtirish muddati berishi mumkin',
            nextQuestionId: null,
            terminalResultId: 'res_divorce_disputed',
            winProbabilityChange: 15,
          },
        ],
      },
    },
    results: {
      res_divorce_mutual: {
        id: 'res_divorce_mutual',
        title: 'Nikohni bekor qilish va aliment belgilash tezkor amalga oshiriladi',
        winProbability: 95,
        probabilityLevel: 'high',
        summary:
          'O‘zaro kelishuv mavjud bo‘lganda sud ishni tez ko‘rib chiqadi. Bolalar mavjud bo‘lsa, OK 96-moddasiga binoan aliment darhol belgilanadi: 1 bola uchun 1/4, 2 bola uchun 1/3 qism.',
        requiredEvidence: [
          'Nikoh tuzilganligi to‘g‘risida guvohnoma (asl nusxasi)',
          'Bolalarning tug‘ilganlik to‘g‘risidagi guvohnomalari',
          'Mahalla yoki yashash joyidan ma’lumotnoma',
        ],
        risks: ['Mulk taqsimoti bo‘yicha alohida da’vo qo‘zg‘atish zarurati'],
        recommendedSteps: [
          'Hujjatlar konstruktoridan nikohdan ajratish da’vo arizasini to‘ldiring',
          'Davlat bojini to‘lang va fuqarolik sudiga topshiring',
        ],
        applicableLaws: [
          {
            code: 'OK',
            article: '38-modda',
            title: 'Nikohdan ajratish asoslari',
            url: 'https://lex.uz/docs/104720#105430',
          },
          {
            code: 'OK',
            article: '96-modda',
            title: 'Ota-onaning bolalarga ta’minot berish majburiyati',
            url: 'https://lex.uz/docs/104720#105990',
          },
        ],
        matchingDocumentId: 'doc-family-divorce-002',
        matchingDocumentName: 'Nikohdan ajratish to‘g‘risida da’vo arizasi',
      },
      res_divorce_disputed: {
        id: 'res_divorce_disputed',
        title: 'Sud yarashtirish muddati tayinlashi mumkin (Ish davomiyligi 3-6 oy)',
        winProbability: 80,
        probabilityLevel: 'medium',
        summary:
          'Ikkinchi tomon qarshi bo‘lsa, sud oilani saqlash maqsadida 6 oygacha muddat beradi. Agar muddatdan keyin ham tiklanmasa, nikoh bekor qilinadi.',
        requiredEvidence: [
          'Nikoh guvohnomasi',
          'Birga yashamaslik va oilaviy nizolarni tasdiqlovchi dalillar',
        ],
        risks: ['Jarayon 6 oygacha cho‘zilishi mumkin'],
        recommendedSteps: [
          'Birgalikda yashash imkonsiz ekanligini tasdiqlovchi dalillarni tayyorlang',
          'Bolaga aliment undirish talabini alohida sud buyrug‘i orqali tezlashtiring',
        ],
        applicableLaws: [
          {
            code: 'OK',
            article: '40-modda',
            title: 'Sudda nikohdan ajratish tartibi',
            url: 'https://lex.uz/docs/104720#105465',
          },
        ],
        matchingDocumentId: 'doc-family-divorce-002',
        matchingDocumentName: 'Nikohdan ajratish to‘g‘risida da’vo arizasi',
      },
    },
  },
]

export function getScenarioById(id: string): GuidedScenario | undefined {
  return GUIDED_SCENARIOS.find((s) => s.id === id)
}
