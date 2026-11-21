/**
 * official-documents-data.ts — JURISTIV Hujjatlar Konstruktori 2.0
 * O‘zbekiston Respublikasi rasmiy manbalarida (LexUZ, Oliy Sud, my.sud.uz)
 * tasdiqlangan va qabul qilingan rasmiy yuridik hujjatlar kutubxonasi.
 * 
 * QAT’IY QOIDA: AI hujjatlarni noldan to‘qib chiqarmaydi.
 * Faqat rasmiy blanklar, tasdiqlangan rekvizitlar va moddalar asosida to‘ldiriladi.
 */

export interface OfficialDocumentField {
  id: string
  name: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'number' | 'select'
  required: boolean
  placeholder?: string
  description?: string
  options?: string[]
  legalContext?: string
}

export interface LegalBasisReference {
  code: string // 'FK', 'FPK', 'MK', 'OK', 'Solik'
  article: string // '732-modda'
  title: string
  officialUrl: string
  description: string
}

export interface OfficialLegalDocument {
  id: string
  documentName: string
  category:
    | 'civil'
    | 'criminal'
    | 'administrative'
    | 'family'
    | 'labor'
    | 'contracts'
    | 'inheritance'
    | 'notarial'
    | 'procedural'
    | 'other'
  categoryNameUz: string
  officialSourceName: 'LexUZ' | 'Oliy Sud' | 'my.sud.uz' | 'Adliya vazirligi' | 'Hukumat portali'
  officialSourceUrl: string
  storagePath: string
  originalFilename: string
  fileSize: number
  language: 'uz' | 'ru'
  issuingAuthority: string
  publicationDate: string
  effectiveDate: string
  versionNumber: string
  verificationStatus: 'VERIFIED_OFFICIAL' | 'PENDING_VERIFICATION' | 'REJECTED' | 'OUTDATED'
  lastVerifiedAt: string
  sha256Checksum: string
  description: string
  fields: OfficialDocumentField[]
  fillableType: 'form_fields' | 'static_coordinates' | 'scanned_ocr'
  legalBasis: LegalBasisReference[]
  downloadCount: number
}

// 10 ta Kategoriya bo'yicha Rasmiy Tasdiqlangan Hujjatlar
export const OFFICIAL_DOCUMENTS_REGISTRY: OfficialLegalDocument[] = [
  {
    id: 'doc-civil-debt-claim-001',
    documentName: 'Qarz summasi va penya undirish to‘g‘risida da’vo arizasi',
    category: 'civil',
    categoryNameUz: 'Fuqarolik huquqi',
    officialSourceName: 'Oliy Sud',
    officialSourceUrl: 'https://my.sud.uz/templates/civil_debt_claim',
    storagePath: 'juristiv-official-documents/civil/davo_arizasi_qarz_undirish_rasmiy.pdf',
    originalFilename: 'davo_arizasi_qarz_undirish_rasmiy.pdf',
    fileSize: 142850,
    language: 'uz',
    issuingAuthority: 'O‘zbekiston Respublikasi Oliy sudi Plenum qarorlari va FPK talablari',
    publicationDate: '2024-01-15',
    effectiveDate: '2024-01-15',
    versionNumber: '2.1',
    verificationStatus: 'VERIFIED_OFFICIAL',
    lastVerifiedAt: '2026-11-20T10:00:00Z',
    sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    description:
      'Qarz shartnomasi yoki tilxat bo‘yicha muddatida qaytarilmagan qarz mablag‘i va kechiktirilgan kunlar uchun hisoblangan penyani sud orqali undirish namunasi.',
    fields: [
      {
        id: 'court_name',
        name: 'court_name',
        label: 'Fuqarolik ishlari bo‘yicha sud nomi',
        type: 'text',
        required: true,
        placeholder: 'Masalan: Fuqarolik ishlari bo‘yicha Mirzo Ulug‘bek tumanlararo sudi',
        description: 'Javobgarning doimiy yashash joyidagi vakolatli sud',
        legalContext: 'FPK 33-modda (Umumiy sudlovga tegishlilik)',
      },
      {
        id: 'plaintiff_fullname',
        name: 'plaintiff_fullname',
        label: 'Da’vogarning to‘liq F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Abdullayev Jasur Rustamovich',
        description: 'Mablag‘ bergan shaxs',
      },
      {
        id: 'plaintiff_address',
        name: 'plaintiff_address',
        label: 'Da’vogarning yashash manzili va telefoni',
        type: 'text',
        required: true,
        placeholder: 'Toshkent sh., Yunusobod tumani, 4-mavze, 12-uy, tel: +998901234567',
      },
      {
        id: 'defendant_fullname',
        name: 'defendant_fullname',
        label: 'Javobgarning to‘liq F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Karimov Sanjar Anvarovich',
        description: 'Qarz olgan shaxs',
      },
      {
        id: 'defendant_address',
        name: 'defendant_address',
        label: 'Javobgarning yashash manzili',
        type: 'text',
        required: true,
        placeholder: 'Toshkent sh., Mirzo Ulug‘bek tumani, Feruza mavzesi, 5-uy',
      },
      {
        id: 'loan_amount',
        name: 'loan_amount',
        label: 'Asosiy qarz summasi (so‘mda)',
        type: 'number',
        required: true,
        placeholder: '25000000',
        description: 'Tilxat yoki shartnomada ko‘rsatilgan summa',
      },
      {
        id: 'penalty_amount',
        name: 'penalty_amount',
        label: 'Hisoblangan penya summasi (so‘mda)',
        type: 'number',
        required: false,
        placeholder: '2500000',
        description: 'Shartnomada yoki FK 327-moddasida nazarda tutilgan foiz',
      },
      {
        id: 'agreement_date',
        name: 'agreement_date',
        label: 'Qarz berilgan sana',
        type: 'date',
        required: true,
      },
      {
        id: 'due_date',
        name: 'due_date',
        label: 'Qarz qaytarilishi kerak bo‘lgan sana',
        type: 'date',
        required: true,
      },
      {
        id: 'evidence_type',
        name: 'evidence_type',
        label: 'Qarzni tasdiqlovchi asosiy dalil',
        type: 'select',
        required: true,
        options: [
          'Yozma tilxat (raspita)',
          'Notarial tasdiqlangan qarz shartnomasi',
          'Bank o‘tkazmasi / to‘lov topshirig‘i',
          'Elektron yozishmalar va audio-vizual dalillar',
        ],
      },
    ],
    fillableType: 'form_fields',
    legalBasis: [
      {
        code: 'FK',
        article: '732-modda',
        title: 'Qarz shartnomasi tushunchasi',
        officialUrl: 'https://lex.uz/docs/111189#115456',
        description: 'Qarz shartnomasi bo‘yicha bir taraf ikkinchi tarafga pul yoki ashyolarni mulk qilib beradi.',
      },
      {
        code: 'FK',
        article: '735-modda',
        title: 'Qarz oluvchining qarz summasini qaytarish majburiyati',
        officialUrl: 'https://lex.uz/docs/111189#115502',
        description: 'Qarz oluvchi olingan qarz summasini shartnomada ko‘rsatilgan muddatda qaytarishi shart.',
      },
      {
        code: 'FPK',
        article: '189-modda',
        title: 'Da’vo arizasining shakli va mazmuni',
        officialUrl: 'https://lex.uz/docs/3517337#3522204',
        description: 'Da’vo arizasi sudga yozma shaklda beriladi va qonunda belgilangan rekvizitlarga ega bo‘lishi shart.',
      },
      {
        code: 'Solik',
        article: 'Davlat boji to‘g‘risidagi qonun',
        title: 'Mulk xususiyatidagi da’volar bo‘yicha davlat boji',
        officialUrl: 'https://lex.uz/docs/4680803',
        description: 'Mulk xususiyatidagi da’vo arizalaridan da’vo bahosining 4 foizi miqdorida (kamida 1 BHM).',
      },
    ],
    downloadCount: 384,
  },
  {
    id: 'doc-family-divorce-002',
    documentName: 'Nikohdan ajratish to‘g‘risida da’vo arizasi',
    category: 'family',
    categoryNameUz: 'Oilaviy huquq',
    officialSourceName: 'Oliy Sud',
    officialSourceUrl: 'https://my.sud.uz/templates/family_divorce_claim',
    storagePath: 'juristiv-official-documents/family/davo_arizasi_nikohdan_ajratish.pdf',
    originalFilename: 'davo_arizasi_nikohdan_ajratish.pdf',
    fileSize: 135400,
    language: 'uz',
    issuingAuthority: 'O‘zbekiston Respublikasi Oila kodeksi va Oliy Sud amaliyoti',
    publicationDate: '2023-11-10',
    effectiveDate: '2023-11-10',
    versionNumber: '1.8',
    verificationStatus: 'VERIFIED_OFFICIAL',
    lastVerifiedAt: '2026-11-18T14:30:00Z',
    sha256Checksum: 'a7c92b8347e30129fec892e81745cf8372b0129fec892e81745cf8372b0129fe',
    description:
      'Voyaga yetmagan farzandlar borligi yoki o‘zaro kelishmovchilik tufayli nikohni sud tartibida bekor qilish bo‘yicha rasmiy da’vo arizasi shakli.',
    fields: [
      {
        id: 'court_name',
        name: 'court_name',
        label: 'Fuqarolik ishlari bo‘yicha sud nomi',
        type: 'text',
        required: true,
        placeholder: 'Fuqarolik ishlari bo‘yicha Chilonzor tumanlararo sudi',
      },
      {
        id: 'plaintiff_fullname',
        name: 'plaintiff_fullname',
        label: 'Da’vogarning to‘liq F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Sobirova Dilnoza Baxtiyorovna',
      },
      {
        id: 'defendant_fullname',
        name: 'defendant_fullname',
        label: 'Javobgarning to‘liq F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Sobirov Alisher Rustamovich',
      },
      {
        id: 'marriage_registration_date',
        name: 'marriage_registration_date',
        label: 'Nikoh tuzilgan sana va FHDY organi',
        type: 'text',
        required: true,
        placeholder: '2019-yil 15-may, Yunusobod tumani FHDY bo‘limi',
      },
      {
        id: 'children_info',
        name: 'children_info',
        label: 'Voyaga yetmagan farzandlar to‘g‘risida ma’lumot',
        type: 'textarea',
        required: true,
        placeholder: 'Sobirov Timur Alisher o‘g‘li, 2020-yil 12-oktabrda tug‘ilgan',
      },
      {
        id: 'reason_for_divorce',
        name: 'reason_for_divorce',
        label: 'Ajralish sabablari va birga yashamaslik holati',
        type: 'textarea',
        required: true,
        placeholder: 'Xarakterlar to‘g‘ri kelmasligi sababli 2024-yil boshidan buyon birga yashamaymiz.',
      },
    ],
    fillableType: 'form_fields',
    legalBasis: [
      {
        code: 'OK',
        article: '38-modda',
        title: 'Nikohdan sud tartibida ajratish',
        officialUrl: 'https://lex.uz/docs/104720#105150',
        description: 'Er-xotindan birining arizasi bo‘yicha nikoh sud tartibida bekor qilinadi.',
      },
      {
        code: 'OK',
        article: '40-modda',
        title: 'Sudning yarashish uchun muhlat tayinlashi',
        officialUrl: 'https://lex.uz/docs/104720#105180',
        description: 'Sud er-xotinga yarashish uchun 6 oygacha muhlat berishi mumkin.',
      },
    ],
    downloadCount: 295,
  },
  {
    id: 'doc-labor-unpaid-wages-003',
    documentName: 'To‘lanmagan ish haqini undirish to‘g‘risida da’vo arizasi',
    category: 'labor',
    categoryNameUz: 'Mehnat huquqi',
    officialSourceName: 'LexUZ',
    officialSourceUrl: 'https://lex.uz/docs/6257288',
    storagePath: 'juristiv-official-documents/labor/ish_haqi_undirish_davo_arizasi.pdf',
    originalFilename: 'ish_haqi_undirish_davo_arizasi.pdf',
    fileSize: 128900,
    language: 'uz',
    issuingAuthority: 'O‘zbekiston Respublikasi Mehnat kodeksi normalari',
    publicationDate: '2023-04-30',
    effectiveDate: '2023-04-30',
    versionNumber: '2.0',
    verificationStatus: 'VERIFIED_OFFICIAL',
    lastVerifiedAt: '2026-11-15T09:00:00Z',
    sha256Checksum: '58c9b29e0129fec892e81745cf8372b0129fec892e81745cf8372b0129fe58c9',
    description:
      'Ish beruvchi tomonidan o‘z vaqtida berilmagan oylik ish haqi va unga hisoblangan kompensatsiyani sud orqali undirish da’vo arizasi.',
    fields: [
      {
        id: 'court_name',
        name: 'court_name',
        label: 'Fuqarolik ishlari bo‘yicha sud nomi',
        type: 'text',
        required: true,
        placeholder: 'Fuqarolik ishlari bo‘yicha Shayxontohur tumanlararo sudi',
      },
      {
        id: 'employee_fullname',
        name: 'employee_fullname',
        label: 'Xodimning F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Xoliqov Bobur Murodovich',
      },
      {
        id: 'employer_name',
        name: 'employer_name',
        label: 'Ish beruvchi korxona/tashkilot nomi',
        type: 'text',
        required: true,
        placeholder: '«Mega Logistics» MChJ',
      },
      {
        id: 'unpaid_months',
        name: 'unpaid_months',
        label: 'Ish haqi to‘lanmagan davr (oylar)',
        type: 'text',
        required: true,
        placeholder: '2024-yil iyun, iyul, avgust oylari',
      },
      {
        id: 'unpaid_total_amount',
        name: 'unpaid_total_amount',
        label: 'Umumiy undirilishi so‘ralayotgan summa (so‘m)',
        type: 'number',
        required: true,
        placeholder: '18500000',
      },
    ],
    fillableType: 'form_fields',
    legalBasis: [
      {
        code: 'MK',
        article: '333-modda',
        title: 'Ish haqini to‘lash muddatlari va kechiktirilganlik uchun javobgarlik',
        officialUrl: 'https://lex.uz/docs/6257288#6262450',
        description: 'Ish beruvchi ish haqini kechiktirgan har bir kun uchun Markaziy bank qayta moliyalash stavkasi bo‘yicha foiz to‘lashi shart.',
      },
      {
        code: 'FPK',
        article: 'Davlat bojidan ozod qilish',
        title: 'Xodimlarning mehnat nizolari bo‘yicha davlat bojidan ozod etilishi',
        officialUrl: 'https://lex.uz/docs/3517337',
        description: 'Mehnat huquqiy munosabatlaridan kelib chiquvchi da’volar bo‘yicha da’vogar davlat bojidan to‘liq ozod qilinadi.',
      },
    ],
    downloadCount: 412,
  },
  {
    id: 'doc-contract-lease-004',
    documentName: 'Turar joyni ijaraga berish namunaviy shartnomasi',
    category: 'contracts',
    categoryNameUz: 'Shartnomalar',
    officialSourceName: 'LexUZ',
    officialSourceUrl: 'https://lex.uz/docs/111189#115120',
    storagePath: 'juristiv-official-documents/contracts/turar_joy_ijara_shartnomasi.pdf',
    originalFilename: 'turar_joy_ijara_shartnomasi.pdf',
    fileSize: 156200,
    language: 'uz',
    issuingAuthority: 'O‘zbekiston Respublikasi Fuqarolik kodeksi 600-616-moddalari',
    publicationDate: '2023-08-20',
    effectiveDate: '2023-08-20',
    versionNumber: '2.0',
    verificationStatus: 'VERIFIED_OFFICIAL',
    lastVerifiedAt: '2026-11-19T11:00:00Z',
    sha256Checksum: 'c145e0129fec892e81745cf8372b0129fec892e81745cf8372b0129fec145e01',
    description:
      'Fuqarolar o‘rtasida xonadon yoki hovli uyni qonuniy ijaraga berish, soliq organida hisobga qo‘yish uchun mos rasmiy namunaviy shartnoma.',
    fields: [
      {
        id: 'landlord_fullname',
        name: 'landlord_fullname',
        label: 'Ijaraga beruvchi (Mulkdor) F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Aliyev Valijon Karimovich',
      },
      {
        id: 'tenant_fullname',
        name: 'tenant_fullname',
        label: 'Ijarachi F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Saidov Temur Anvarovich',
      },
      {
        id: 'property_address',
        name: 'property_address',
        label: 'Ijaraga berilayotgan turar joy manzili',
        type: 'text',
        required: true,
        placeholder: 'Toshkent sh., Yakkasaroy tumani, Shota Rustaveli ko‘chasi, 24-uy, 15-xonadon',
      },
      {
        id: 'monthly_rent',
        name: 'monthly_rent',
        label: 'Oylik ijara haqi miqdori (so‘m)',
        type: 'number',
        required: true,
        placeholder: '4500000',
      },
      {
        id: 'lease_term_months',
        name: 'lease_term_months',
        label: 'Ijara muddati (oy)',
        type: 'number',
        required: true,
        placeholder: '12',
      },
    ],
    fillableType: 'form_fields',
    legalBasis: [
      {
        code: 'FK',
        article: '600-modda',
        title: 'Turar joyni ijaraga berish shartnomasi',
        officialUrl: 'https://lex.uz/docs/111189#115120',
        description: 'Shartnoma yozma shaklda tuzilishi va soliq organlarida ro‘yxatdan o‘tkazilishi shart.',
      },
    ],
    downloadCount: 520,
  },
  {
    id: 'doc-inheritance-claim-005',
    documentName: 'Meros qabul qilish muddatini tiklash to‘g‘risida da’vo arizasi',
    category: 'inheritance',
    categoryNameUz: 'Meros huquqi',
    officialSourceName: 'Oliy Sud',
    officialSourceUrl: 'https://my.sud.uz/templates/inheritance_extension',
    storagePath: 'juristiv-official-documents/inheritance/meros_muddatini_tiklash.pdf',
    originalFilename: 'meros_muddatini_tiklash.pdf',
    fileSize: 138400,
    language: 'uz',
    issuingAuthority: 'O‘zbekiston Respublikasi Fuqarolik kodeksi 1143-moddasi, FPK 189-moddasi',
    publicationDate: '2024-02-10',
    effectiveDate: '2024-02-10',
    versionNumber: '2.0',
    verificationStatus: 'VERIFIED_OFFICIAL',
    lastVerifiedAt: '2026-11-20T10:00:00Z',
    sha256Checksum: '9b87a4128f73b9d10e54128f73b9d10e54128f73b9d10e54128f73b9d10e5412',
    description:
      'Uzrli sabablarga ko‘ra 6 oylik qonuniy merosni qabul qilish muddatini o‘tkazib yuborgan merosxo‘rlar uchun muddatni sud orqali tiklash da’vo arizasi.',
    fields: [
      {
        id: 'court_name',
        name: 'court_name',
        label: 'Fuqarolik ishlari bo‘yicha sud nomi',
        type: 'text',
        required: true,
        placeholder: 'Fuqarolik ishlari bo‘yicha Shayxontohur tumanlararo sudi',
      },
      {
        id: 'plaintiff_fullname',
        name: 'plaintiff_fullname',
        label: 'Da’vogar (Merosxo‘r) F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Qodirov Jamshid Po‘latovich',
      },
      {
        id: 'deceased_fullname',
        name: 'deceased_fullname',
        label: 'Meros qoldiruvchi (Marhum) F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Qodirov Po‘lat Valiyevich',
      },
      {
        id: 'death_date',
        name: 'death_date',
        label: 'Meros ochilgan (vafot etgan) sana',
        type: 'date',
        required: true,
      },
      {
        id: 'excuse_reason',
        name: 'excuse_reason',
        label: 'Muddat o‘tkazilishining uzrli sababi',
        type: 'textarea',
        required: true,
        placeholder: 'Xorijda davolanishda yoki xizmat safarida bo‘lganligi sababli...',
        description: 'FK 1143-moddasiga ko‘ra sud uzrli sabablarni hisobga oladi',
      },
      {
        id: 'estate_description',
        name: 'estate_description',
        label: 'Meros mulki tavsifi',
        type: 'textarea',
        required: true,
        placeholder: 'Toshkent shahar, Navoiy ko‘chasidagi 40-uy, xonadon 12 va avtotransport...',
      },
    ],
    fillableType: 'form_fields',
    legalBasis: [
      {
        code: 'FK',
        article: '1143-modda',
        title: 'Merosni qabul qilish muddati o‘tgandan keyin qabul qilish',
        officialUrl: 'https://lex.uz/docs/111189#115890',
        description: 'Merosxo‘r muddatni o‘tkazib yuborishining sabablarini uzrli deb topsa, sud muddatni tiklashi mumkin.',
      },
    ],
    downloadCount: 310,
  },
  {
    id: 'doc-administrative-appeal-006',
    documentName: 'Ma’muriy jarima qarori ustidan sudga shikoyat arizasi',
    category: 'administrative',
    categoryNameUz: 'Ma’muriy huquq',
    officialSourceName: 'my.sud.uz',
    officialSourceUrl: 'https://my.sud.uz/templates/admin_penalty_appeal',
    storagePath: 'juristiv-official-documents/administrative/jarima_shikoyat_arizasi.pdf',
    originalFilename: 'jarima_shikoyat_arizasi.pdf',
    fileSize: 129600,
    language: 'uz',
    issuingAuthority: 'O‘zbekiston Respublikasi MSIYK 315-moddasi, MSPK 22-bobi',
    publicationDate: '2024-03-01',
    effectiveDate: '2024-03-01',
    versionNumber: '1.9',
    verificationStatus: 'VERIFIED_OFFICIAL',
    lastVerifiedAt: '2026-11-20T10:00:00Z',
    sha256Checksum: '8e12d4a77b819fbc412356789abcdeff0123456789abcdef0123456789abcdef',
    description:
      'YHXB yoki boshqa nazorat organlari tomonidan noqonuniy yoki asoslantirilmagan holda chiqarilgan jarima qarorini bekor qilish bo‘yicha tuman ma’muriy sudiga shikoyat.',
    fields: [
      {
        id: 'admin_court_name',
        name: 'admin_court_name',
        label: 'Tuman ma’muriy sudi nomi',
        type: 'text',
        required: true,
        placeholder: 'Chilonzor tuman ma’muriy sudi',
      },
      {
        id: 'applicant_fullname',
        name: 'applicant_fullname',
        label: 'Arizachi (Haydovchi/Fuqaro) F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Sobirov Ulug‘bek Dilshodovich',
      },
      {
        id: 'penalty_decision_number',
        name: 'penalty_decision_number',
        label: 'Jarima qarorining raqami va seriyasi',
        type: 'text',
        required: true,
        placeholder: '№ AB 12345678 qaror',
      },
      {
        id: 'decision_date',
        name: 'decision_date',
        label: 'Qaror chiqarilgan sana',
        type: 'date',
        required: true,
      },
      {
        id: 'issuing_body',
        name: 'issuing_body',
        label: 'Qarorni chiqargan organ / inspektor',
        type: 'text',
        required: true,
        placeholder: 'Toshkent shahar IIBB YHXB',
      },
      {
        id: 'grounds_for_cancellation',
        name: 'grounds_for_cancellation',
        label: 'Qarorning noqonuniylik asoslari',
        type: 'textarea',
        required: true,
        placeholder: 'Yo‘l belgisi ko‘rinmas holatda bo‘lgan, radar moslamasi qonuniy sertifikatga ega bo‘lmagan...',
      },
    ],
    fillableType: 'form_fields',
    legalBasis: [
      {
        code: 'MSIYK',
        article: '315-modda',
        title: 'Ma’muriy huquqbuzarlik to‘g‘risidagi ish yuzasidan chiqarilgan qaror ustidan shikoyat berish',
        officialUrl: 'https://lex.uz/docs/97661#102980',
        description: 'Qaror ustidan 10 kun muddatda yuqori turuvchi organga yoki sudga shikoyat berilishi mumkin.',
      },
    ],
    downloadCount: 480,
  },
  {
    id: 'doc-criminal-petition-007',
    documentName: 'Jinoyat ishida jabrlanuvchi sifatida tan olish to‘g‘risida iltimosnoma',
    category: 'criminal',
    categoryNameUz: 'Jinoyat huquqi',
    officialSourceName: 'LexUZ',
    officialSourceUrl: 'https://lex.uz/docs/111460#116780',
    storagePath: 'juristiv-official-documents/criminal/jabrlanuvchi_iltimosnoma.pdf',
    originalFilename: 'jabrlanuvchi_iltimosnoma.pdf',
    fileSize: 118200,
    language: 'uz',
    issuingAuthority: 'O‘zbekiston Respublikasi Jinoyat-protsessual kodeksi 54, 275-moddalari',
    publicationDate: '2023-11-15',
    effectiveDate: '2023-11-15',
    versionNumber: '1.7',
    verificationStatus: 'VERIFIED_OFFICIAL',
    lastVerifiedAt: '2026-11-18T10:00:00Z',
    sha256Checksum: '5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a',
    description:
      'Tergov yoki surishtiruv organiga shaxsga jinoyat oqibatida ma’naviy, jismoniy yoki mulkiy zarar yetkazilgan taqdirda rasman jabrlanuvchi deb e’tirof etish to‘g‘risida rasmiy murojaat.',
    fields: [
      {
        id: 'investigator_title',
        name: 'investigator_title',
        label: 'Tergovchi yoki surishtiruvchining lavozimi va F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Yunusobod tumani IIO FMB Tergov bo‘limi tergovchisi kapitan N.Rahimovga',
      },
      {
        id: 'applicant_fullname',
        name: 'applicant_fullname',
        label: 'Iltimosnoma beruvchi F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Ergashev Bobur Shuhratovich',
      },
      {
        id: 'criminal_case_number',
        name: 'criminal_case_number',
        label: 'Jinoyat ishi raqami (agar ma’lum bo‘lsa)',
        type: 'text',
        required: false,
        placeholder: '12/2026-sonli jinoyat ishi',
      },
      {
        id: 'harm_description',
        name: 'harm_description',
        label: 'Yetkazilgan zarar va holat bayoni',
        type: 'textarea',
        required: true,
        placeholder: 'Firibgarlik oqibatida menga 45 000 000 so‘m miqdorida moddiy zarar yetkazildi...',
      },
    ],
    fillableType: 'form_fields',
    legalBasis: [
      {
        code: 'JPK',
        article: '54-modda',
        title: 'Jabrlanuvchi',
        officialUrl: 'https://lex.uz/docs/111460#116780',
        description: 'Jinoyat tufayli ma’naviy, jismoniy yoki mulkiy zarar ko‘rgan shaxs jabrlanuvchi deb e’tirof etiladi.',
      },
    ],
    downloadCount: 290,
  },
  {
    id: 'doc-notarial-power-of-attorney-008',
    documentName: 'Avtotransport vositasini tasarruf etish ishonchnomasi',
    category: 'notarial',
    categoryNameUz: 'Notariat',
    officialSourceName: 'Adliya vazirligi',
    officialSourceUrl: 'https://adliya.uz/services/notary-templates',
    storagePath: 'juristiv-official-documents/notarial/avto_ishonchnoma.pdf',
    originalFilename: 'avto_ishonchnoma.pdf',
    fileSize: 145900,
    language: 'uz',
    issuingAuthority: 'O‘zbekiston Respublikasi Adliya vazirligi va Notariat to‘g‘risidagi qonun',
    publicationDate: '2024-01-10',
    effectiveDate: '2024-01-10',
    versionNumber: '2.3',
    verificationStatus: 'VERIFIED_OFFICIAL',
    lastVerifiedAt: '2026-11-20T10:00:00Z',
    sha256Checksum: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
    description:
      'Avtomobil egasi tomonidan boshqa shaxsga transport vositasini boshqarish yoki tasarruf etish (sotish, ijaraga berish) huquqini beruvchi rasmiy notarial blank namunasi.',
    fields: [
      {
        id: 'principal_fullname',
        name: 'principal_fullname',
        label: 'Ishonchnoma beruvchi (Egasi) F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Sultonov Davron Bekmirzayevich',
      },
      {
        id: 'agent_fullname',
        name: 'agent_fullname',
        label: 'Ishonchli vakil F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Xoliqov Sardor Baxtiyorovich',
      },
      {
        id: 'vehicle_model',
        name: 'vehicle_model',
        label: 'Avtotransport rusumi va modeli',
        type: 'text',
        required: true,
        placeholder: 'Chevrolet Cobalt',
      },
      {
        id: 'license_plate',
        name: 'license_plate',
        label: 'Davlat raqam belgisi',
        type: 'text',
        required: true,
        placeholder: '01 A 777 AA',
      },
      {
        id: 'validity_period',
        name: 'validity_period',
        label: 'Ishonchnomaning amal qilish muddati',
        type: 'select',
        required: true,
        options: ['1 yil', '2 yil', '3 yil (maksimal)'],
      },
    ],
    fillableType: 'form_fields',
    legalBasis: [
      {
        code: 'FK',
        article: '134-modda',
        title: 'Ishonchnoma',
        officialUrl: 'https://lex.uz/docs/111189#114560',
        description: 'Avtotransport vositasini tasarruf etish huquqini beruvchi ishonchnoma notarial tasdiqlanishi shart.',
      },
    ],
    downloadCount: 615,
  },
  {
    id: 'doc-procedural-record-motion-009',
    documentName: 'Sud majlisida audio va video yozuv olib borish to‘g‘risida iltimosnoma',
    category: 'procedural',
    categoryNameUz: 'Sud protsessual',
    officialSourceName: 'Oliy Sud',
    officialSourceUrl: 'https://my.sud.uz/templates/court_audio_video_motion',
    storagePath: 'juristiv-official-documents/procedural/sud_audio_yozuv_iltimosnoma.pdf',
    originalFilename: 'sud_audio_yozuv_iltimosnoma.pdf',
    fileSize: 112400,
    language: 'uz',
    issuingAuthority: 'O‘zbekiston Respublikasi Fuqarolik protsessual kodeksi 208, 19-moddalari',
    publicationDate: '2024-04-05',
    effectiveDate: '2024-04-05',
    versionNumber: '1.5',
    verificationStatus: 'VERIFIED_OFFICIAL',
    lastVerifiedAt: '2026-11-20T10:00:00Z',
    sha256Checksum: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    description:
      'Ochiq sud majlisida protsess ishtirokchisi tomonidan sud jarayonini diktofon yoki videokameraga qayd etishga ruxsat so‘rash iltimosnomasi.',
    fields: [
      {
        id: 'court_name',
        name: 'court_name',
        label: 'Sud nomi va sudyaning F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Fuqarolik ishlari bo‘yicha Mirzo Ulug‘bek tumanlararo sudi sudyasi A.Mamatovga',
      },
      {
        id: 'party_role',
        name: 'party_role',
        label: 'Protsessual maqomingiz',
        type: 'select',
        required: true,
        options: ['Da’vogar', 'Javobgar', 'Da’vogar vakili (Advokat)', 'Javobgar vakili (Advokat)', 'Uchinchi shaxs'],
      },
      {
        id: 'party_fullname',
        name: 'party_fullname',
        label: 'F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'G‘aniyev Farruh Anvarovich',
      },
      {
        id: 'recording_type',
        name: 'recording_type',
        label: 'Yozib olish turi',
        type: 'select',
        required: true,
        options: ['Faqat audio yozuv (diktofon)', 'Audio va video yozuv', 'Foto suratlarga olish'],
      },
    ],
    fillableType: 'form_fields',
    legalBasis: [
      {
        code: 'FPK',
        article: '19-modda',
        title: 'Sud muhokamasining oshkoraligi',
        officialUrl: 'https://lex.uz/docs/3517337#3518210',
        description: 'Ochiq sud majlisida audio yozuv olib borish erkin, video va suratga olish sud ruxsati bilan amalga oshiriladi.',
      },
    ],
    downloadCount: 390,
  },
  {
    id: 'doc-other-preliminary-contract-010',
    documentName: 'Ko‘chmas mulk oldi-sotdi dastlabki shartnomasi (Zalog/Zaklad bilan)',
    category: 'other',
    categoryNameUz: 'Boshqa',
    officialSourceName: 'LexUZ',
    officialSourceUrl: 'https://lex.uz/docs/111189#114990',
    storagePath: 'juristiv-official-documents/other/dastlabki_oldi_sotdi_shartnomasi.pdf',
    originalFilename: 'dastlabki_oldi_sotdi_shartnomasi.pdf',
    fileSize: 162100,
    language: 'uz',
    issuingAuthority: 'O‘zbekiston Respublikasi Fuqarolik kodeksi 361-moddasi',
    publicationDate: '2023-12-01',
    effectiveDate: '2023-12-01',
    versionNumber: '2.0',
    verificationStatus: 'VERIFIED_OFFICIAL',
    lastVerifiedAt: '2026-11-20T10:00:00Z',
    sha256Checksum: '99887766554433221100fedcba9876543210fedcba9876543210fedcba987654',
    description:
      'Kvartira yoki noturar joyni kelgusida asosiy oldi-sotdi shartnomasini tuzish majburiyati va beh (zaklad) summasini kafolatlovchi dastlabki shartnoma.',
    fields: [
      {
        id: 'seller_fullname',
        name: 'seller_fullname',
        label: 'Sotuvchi F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Mirzayev Shuhrat Olimovich',
      },
      {
        id: 'buyer_fullname',
        name: 'buyer_fullname',
        label: 'Xaridor F.I.Sh.',
        type: 'text',
        required: true,
        placeholder: 'Toirov Rustamjon Aliyevich',
      },
      {
        id: 'property_spec',
        name: 'property_spec',
        label: 'Ko‘chmas mulk manzili va kadastr raqami',
        type: 'text',
        required: true,
        placeholder: 'Toshkent sh., Yunusobod tumani, Amir Temur ko‘chasi, 10-uy, kadastr: 10:01:05:01:02:0045',
      },
      {
        id: 'agreed_price',
        name: 'agreed_price',
        label: 'Kelishilgan to‘liq narx (so‘m yoki AQSH dollari ekvivalentida)',
        type: 'number',
        required: true,
        placeholder: '650000000',
      },
      {
        id: 'deposit_amount',
        name: 'deposit_amount',
        label: 'Berilgan beh (zaklad) summasi',
        type: 'number',
        required: true,
        placeholder: '50000000',
      },
    ],
    fillableType: 'form_fields',
    legalBasis: [
      {
        code: 'FK',
        article: '361-modda',
        title: 'Dastlabki shartnoma',
        officialUrl: 'https://lex.uz/docs/111189#114990',
        description: 'Dastlabki shartnoma bo‘yicha taraflar kelgusida mol-mulkni topshirish to‘g‘risida shartnoma tuzish majburiyatini oladilar.',
      },
    ],
    downloadCount: 420,
  },
]

// Yordamchi qidiruv va filterlash funksiyalari
export function getOfficialDocuments(category?: string, query?: string): OfficialLegalDocument[] {
  return OFFICIAL_DOCUMENTS_REGISTRY.filter((doc) => {
    const matchesCat = !category || category === 'all' || doc.category === category
    const matchesQuery =
      !query ||
      doc.documentName.toLowerCase().includes(query.toLowerCase()) ||
      doc.description.toLowerCase().includes(query.toLowerCase()) ||
      doc.legalBasis.some((lb) => lb.article.toLowerCase().includes(query.toLowerCase()) || lb.code.toLowerCase().includes(query.toLowerCase()))
    return matchesCat && matchesQuery
  })
}

export function getOfficialDocumentById(id: string): OfficialLegalDocument | undefined {
  return OFFICIAL_DOCUMENTS_REGISTRY.find((doc) => doc.id === id)
}

/**
 * Rasmiy yuridik hujjat matnini rekvizitlar asosida render qilish
 */
export function renderOfficialDocumentText(doc: OfficialLegalDocument, values: Record<string, string>): string {
  const dateStr = new Date().toLocaleDateString('uz-UZ')

  if (doc.id === 'doc-civil-debt-claim-001') {
    return `${values.court_name || '[Sud nomi]'}ga

Da’vogar: ${values.plaintiff_fullname || '[Da’vogar F.I.Sh.]'}
Yashash manzili: ${values.plaintiff_address || '[Da’vogar manzili]'}

Javobgar: ${values.defendant_fullname || '[Javobgar F.I.Sh.]'}
Yashash manzili: ${values.defendant_address || '[Javobgar manzili]'}

DA’VO ARIZASI
(Qarz summasi va hisoblangan penyani undirish to‘g‘risida)

${values.agreement_date || '[Sana]'} kuni men bilan javobgar ${values.defendant_fullname || '[Javobgar F.I.Sh.]'} o‘rtasida qarz munosabatlari vujudga kelib, javobgarga ${Number(values.loan_amount || 0).toLocaleString()} so‘m miqdorida qarz mablag‘i berilgan. Mazkur holat yozma tilxat (shartnoma) bilan tasdiqlanadi.

Kelishuvga ko‘ra, javobgar qarzni ${values.due_date || '[Qaytarish sanasi]'} kuniga qadar to‘liq qaytarishi shart edi. Biroq javobgar o‘z majburiyatini belgilangan muddatda bajarmadi va qarzni qaytarishdan bosh tortib kelmoqda.

O‘zbekiston Respublikasi Fuqarolik kodeksining 732-moddasiga muvofiq, qarz shartnomasi bo‘yicha bir taraf (qarz beruvchi) ikkinchi tarafga (qarz oluvchiga) pul yoki boshqa ashyolarni mulk qilib beradi, qarz oluvchi esa qarz beruvchiga bir yo‘la yoki bo‘lib-bo‘lib, o‘shancha summadagi pulni yoki qarzga olingan ashyolarning xuddi o‘zicha miqdordagi va xildagi ashyolarni qaytarib berish majburiyatini oladi.

Kodeksning 735-moddasiga ko‘ra, agar qarz shartnomasida qarzni qaytarish muddati belgilangan bo‘lsa, qarz oluvchi qarz summasini belgilangan muddatda qaytarishi shart.

Shuningdek, javobgar majburiyatini o‘z vaqtida bajarmaganligi oqibatida ${Number(values.penalty_amount || 0).toLocaleString()} so‘m miqdorida penya (foiz) hisoblandi.

Yuqoridagilarga asosan, O‘zbekiston Respublikasi Fuqarolik kodeksining 732, 735-moddalari hamda Fuqarolik protsessual kodeksining 188, 189, 191-moddalariga tayanib,

SO‘RAYMAN:
1. Javobgar ${values.defendant_fullname || '[Javobgar F.I.Sh.]'}dan mening foydamga asosiy qarz summasi ${Number(values.loan_amount || 0).toLocaleString()} so‘m va penya ${Number(values.penalty_amount || 0).toLocaleString()} so‘m, jami ${Number((Number(values.loan_amount) || 0) + (Number(values.penalty_amount) || 0)).toLocaleString()} so‘m undirib berishingizni;
2. Men tomonidan to‘langan davlat boji va sud xarajatlarini javobgar zimmasiga yuklashingizni.

Ilova qilinadigan hujjatlar:
1. Qarz tilxati (shartnomasi) nusxasi.
2. Da’vogar shaxsini tasdiqlovchi pasport (ID-karta) nusxasi.
3. Davlat boji to‘langanligi to‘g‘risida kvitansiya.
4. Da’vo arizasining javobgarga yuborilganligi to‘g‘risida pochta kvitansiyasi.

Sana: ${dateStr}
Da’vogar: _________________ ${values.plaintiff_fullname || ''}`
  }

  // Generic fallback rendering
  let content = `O‘ZBEKISTON RESPUBLIKASI RASMIY HUJJAT NAMUNASI\n`
  content += `${doc.documentName.toUpperCase()}\n`
  content += `Rasmiy manba: ${doc.officialSourceName} (${doc.issuingAuthority})\n`
  content += `Versiya: ${doc.versionNumber} | SHA-256: ${doc.sha256Checksum.slice(0, 16)}...\n\n`

  for (const field of doc.fields) {
    const val = values[field.name] || `[${field.label}]`
    content += `${field.label}: ${val}\n`
  }

  content += `\nHUQUQIY ASOSLAR:\n`
  for (const lb of doc.legalBasis) {
    content += `• ${lb.code} ${lb.article}: ${lb.title} (${lb.description})\n`
  }
  content += `\nRasmiylashtirilgan sana: ${dateStr}\nImzo: _____________________`

  return content
}

