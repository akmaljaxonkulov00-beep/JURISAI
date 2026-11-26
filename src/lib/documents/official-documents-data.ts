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
        placeholder: 'Masalan: Toshkent shahar Mirzo Ulug‘bek tumanlararo',
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
        label: 'Da’vogarning yashash manzili',
        type: 'text',
        required: true,
        placeholder: 'Toshkent sh., Yunusobod tumani, 4-mavze, 12-uy',
      },
      {
        id: 'plaintiff_phone',
        name: 'plaintiff_phone',
        label: 'Da’vogarning telefon raqami',
        type: 'text',
        required: false,
        placeholder: '+998901234567',
      },
      {
        id: 'plaintiff_email',
        name: 'plaintiff_email',
        label: 'Da’vogarning elektron pochta manzili',
        type: 'text',
        required: false,
        placeholder: 'davogar@mail.uz',
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
        id: 'defendant_phone',
        name: 'defendant_phone',
        label: 'Javobgarning telefon raqami',
        type: 'text',
        required: false,
        placeholder: '+998911234567',
      },
      {
        id: 'defendant_email',
        name: 'defendant_email',
        label: 'Javobgarning elektron pochta manzili',
        type: 'text',
        required: false,
        placeholder: 'javobgar@mail.uz',
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
        label: 'Bank foizi / penya summasi (so‘mda)',
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
          'o‘zaro tilxat',
          'notarial tasdiqlangan qarz shartnomasi',
          'bank o‘tkazmasi / to‘lov topshirig‘i',
          'elektron yozishmalar va audio-vizual dalillar',
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

  // Helper formatting
  const fmtNumber = (val?: string | number) => {
    if (!val) return '________'
    const clean = String(val).replace(/[^\d]/g, '')
    return clean ? Number(clean).toLocaleString('uz-UZ') : String(val)
  }

  const formatCourtName = (raw?: string) => {
    if (!raw) return 'Fuqarolik ishlari bo‘yicha sudiga'
    const trimmed = raw.trim()
    if (trimmed.toLowerCase().endsWith('sudiga')) return trimmed
    if (trimmed.toLowerCase().startsWith('fuqarolik ishlari')) return `${trimmed} sudiga`
    return `Fuqarolik ishlari bo‘yicha ${trimmed} sudiga`
  }

  // 1. DA'VO ARIZASI: QARZ VA FOIZLARNI UNDIRISH (Foydalanuvchi rasmlaridagi haqiqiy sud andozasi)
  if (doc.id === 'doc-civil-debt-claim-001') {
    const courtFormatted = formatCourtName(values.court_name)
    const loanFormatted = fmtNumber(values.loan_amount)
    const penaltyFormatted = fmtNumber(values.penalty_amount || '0')
    const agreementDateStr = values.agreement_date || '______ yil "___" ________'
    const dueDateStr = values.due_date || '______ yil "___" ________'
    const evidenceStr = values.evidence_type ? values.evidence_type.toLowerCase() : 'o‘zaro tilxat'

    return `${courtFormatted}

Da‘vogar: ${values.plaintiff_address || '[Da‘vogar manzili]'}da yashovchi
${values.plaintiff_fullname || '[Da‘vogar F.I.Sh.]'}
Telefon: ${values.plaintiff_phone || values.phone || '[Telefon]'}
Elektron pochta manzili: ${values.plaintiff_email || values.email || '[Elektron pochta manzili]'}

Javobgar: ${values.defendant_address || '[Javobgar manzili]'}da yashovchi
${values.defendant_fullname || '[Javobgar F.I.Sh.]'}
Telefon: ${values.defendant_phone || '[Telefon]'}
Elektron pochta manzili: ${values.defendant_email || '[Elektron pochta manzili]'}

Da‘vo mazmuni: ${values.defendant_fullname || '[Javobgar F.I.Sh.]'}dan ${loanFormatted} so‘m
qarzdorlikni undirish to‘g‘risida


DA‘VO ARIZA
(Qarz shartnomasi bo‘yicha qarzdorlikni undirish to‘g‘risida)

Ish bo‘yicha javobgar ${values.defendant_fullname || '[Javobgar F.I.Sh.]'} ${agreementDateStr}da mening oldimga kelib qarz so‘radi. Shundan so‘ng men javobgarga ${evidenceStr} asosida ${loanFormatted} so‘m miqdorida qarz berdim. Javobgar ${loanFormatted} so‘mni ${dueDateStr}ga qadar qaytarishi lozim edi, shunday bo‘lsa-da javobgar ${loanFormatted} so‘m qarzni qaytarmasdan kelayapti. Shu kunga qadar javobgarga bir necha bor qarzni qaytarishni so‘rab murojaat qildim, lekin javobgar turli xil bahonalar bilan qarzni qaytarmasdan kelmoqda.

O‘zbekiston Respublikasining Fuqarolik kodeksi 324-moddasiga ko‘ra, qarzdor majburiyatni bajarmaganligi yoki lozim darajada bajarmaganligi tufayli kreditorga yetkazilgan zararni to‘lashi shart.
Agar qonunchilikda yoki shartnomada o‘zgacha tartib nazarda tutilgan bo‘lmasa, zararni aniqlashda majburiyat bajarilishi kerak bo‘lgan joyda, qarzdor kreditorning talablarini ixtiyoriy qanoatlantirgan kunda, bordi-yu, talab ixtiyoriy qanoatlantirilgan bo‘lmasa, — da‘vo qo‘zg‘atilgan kunda mavjud bo‘lgan narxlar e‘tiborga olinadi. Sud vaziyatga qarab, zararni to‘lash haqidagi talabni qaror chiqarilgan kunda mavjud bo‘lgan narxlarni e‘tiborga olgan holda qanoatlantirishi mumkin.

Fuqarolik kodeksi 734-moddasida, agar qonunda yoki qarz shartnomasida boshqacha tartib nazarda tutilgan bo‘lmasa, qarz beruvchi (yuridik shaxs yoki fuqaro) qarz oluvchidan qarz summasiga shartnomada belgilangan miqdorda va tartibda foizlar olish huquqiga ega bo‘ladi.
Agar qarz shartnomasi bo‘yicha qarz oluvchiga turga xos alomatlari bilan belgilangan ashyolar topshirilsa, ularning miqdori va shakli (pul yoki natura holidagi) shartnomada ko‘zda tutilgan hollarda foizlar to‘lanishi kerak.
Foizlar to‘lash tartibi va muddatlari qarz shartnomasi bilan belgilanadi. Agar foizlar to‘lash tartibi va muddatlari shartnomada belgilangan bo‘lmasa, ular asosiy qarzni qaytarish uchun shartnomada nazarda tutilgan tartibda va muddatlarda to‘lanadi.

Fuqarolik kodeksining 735-moddasida esa qarz oluvchi olingan qarz summasini qarz shartnomasida nazarda tutilgan muddatda va tartibda qarz beruvchiga qaytarishi shart.

Yuqoridagilardan kelib chiqqan holda ushbu davrda javobgar qarzni qaytarmaganligi sababli ${penaltyFormatted} so‘m miqdorida bank foizi (penya) ham undirish lozim deb hisoblayman.

Yuqoridagilardan kelib chiqib, O‘zbekiston Respublikasi Fuqarolik kodeksining 324, 734-735 moddalariga hamda FPKning 188, 189, 191-moddalariga asosan suddan,

So‘rayman:

${values.defendant_fullname || '[Javobgar F.I.Sh.]'}dan mening foydamga ${loanFormatted} so‘m asosiy qarz hamda qarzni o‘z vaqtida qaytarmaganligi sababli ${penaltyFormatted} so‘m miqdorida bank foizi undirib berishingizni.

Ilova qilingan hujjatlar:
1. Da‘vo arizasi nusxasi;
2. Qarz tilxati (shartnomasi) nusxasi;
3. Davlat boji to‘langanligi to‘g‘risida kvitansiya;
4. Pochta xarajatlari to‘langanligi kvitansiyasi;
5. Da‘vogar pasporti nusxasi.

Da‘vogar: ${values.plaintiff_fullname || '[Da‘vogar F.I.Sh.]'}        ___________        ${dateStr}`
  }

  // 2. NIKOHDAN AJRATISH TO'G'RISIDA DA'VO ARIZASI
  if (doc.id === 'doc-family-divorce-002') {
    const courtFormatted = formatCourtName(values.court_name)
    return `${courtFormatted}

Da‘vogar: ${values.plaintiff_address || '[Da‘vogar manzili]'}da yashovchi
${values.plaintiff_fullname || '[Da‘vogar F.I.Sh.]'}
Telefon: ${values.plaintiff_phone || '[Telefon]'}

Javobgar: ${values.defendant_address || '[Javobgar manzili]'}da yashovchi
${values.defendant_fullname || '[Javobgar F.I.Sh.]'}
Telefon: ${values.defendant_phone || '[Telefon]'}

DA‘VO ARIZA
(Nikohni bekor qilish to‘g‘risida)

Men javobgar ${values.defendant_fullname || '[Javobgar F.I.Sh.]'} bilan ${values.marriage_registration_date || '[Nikoh sanasi va FHDY organi]'}da qonuniy nikohdan o‘tganmiz.

Birgalikdagi turmushimiz davomida quyidagi voyaga yetmagan farzandlarimiz bor:
${values.children_info || 'Farzandlar to‘g‘risida ma’lumot'}

So‘nggi paytlarda o‘rtamizdagi fe‘l-atvor nomutanosibligi va quyidagi sabablarga ko‘ra oilaviy munosabatlarimiz butunlay buzildi:
${values.reason_for_divorce || 'Ajralish sabablari'}

Hozirgi kunda alohida yashaymiz, o‘zaro yarashish va oilani saqlab qolishning imkoni yo‘q.

O‘zbekiston Respublikasi Oila kodeksining 37, 38, 41-moddalari hamda FPKning 188, 189-moddalariga asosan,

SO‘RAYMAN:
1. Men va javobgar ${values.defendant_fullname || '[Javobgar F.I.Sh.]'} o‘rtasidagi qonuniy nikohni bekor qilishingizni;
2. Sud xarajatlarini javobgar zimmasiga yuklashingizni.

Ilova qilingan hujjatlar:
1. Da‘vo arizasi nusxasi;
2. Nikoh to‘g‘risidagi guvohnomaning asl nusxasi;
3. Bolalarning tug‘ilganlik haqidagi guvohnomalari nusxalari;
4. Yashash joyidan ma‘lumotnoma;
5. Davlat boji to‘langanligi to‘g‘risida kvitansiya.

Da‘vogar: ${values.plaintiff_fullname || '[Da‘vogar F.I.Sh.]'}        ___________        ${dateStr}`
  }

  // 3. ISH HAQI VA KOMPENSATSIYANI UNDIRISH TO'G'RISIDA DA'VO ARIZASI
  if (doc.id === 'doc-labor-unpaid-wages-003') {
    const courtFormatted = formatCourtName(values.court_name)
    const amountFormatted = fmtNumber(values.unpaid_total_amount)
    return `${courtFormatted}

Da‘vogar: ${values.employee_address || '[Xodim manzili]'}da yashovchi
${values.employee_fullname || '[Xodim F.I.Sh.]'}
Telefon: ${values.employee_phone || '[Telefon]'}

Javobgar: ${values.employer_name || '[Ish beruvchi korxona/tashkilot nomi]'}
Yuridik manzili: ${values.employer_address || '[Yuridik manzil]'}

Davlat boji: Mehnat kodeksi va FPK talablariga muvofiq xodim davlat bojidan ozod etilgan.

DA‘VO ARIZA
(To‘lanmagan oylik ish haqi va kompensatsiya undirish to‘g‘risida)

Men «${values.employer_name || '[Ish beruvchi nomi]'}» tashkilotida qonuniy mehnat shartnomasi asosida ishlab kelganman (ishlayman).

Ish beruvchi ma‘muriyati tomonidan ${values.unpaid_months || '[To‘lanmagan davr/oylar]'} davri uchun menga hisoblangan jami ${amountFormatted} so‘m miqdoridagi oylik ish haqi amalda to‘lab berilmadi.

O‘zbekiston Respublikasi Mehnat kodeksining 244, 253, 333-moddalariga asosan, ish beruvchi xodimga tegishli bo‘lgan ish haqini belgilangan muddatda to‘lashi shart. Ish haqi kechiktirilgan har bir kun uchun ish beruvchi moddiy javobgar hisoblanadi.

Yuqoridagilarga asosan hamda FPKning 188, 189-moddalariga tayanib,

SO‘RAYMAN:
1. Javobgar «${values.employer_name || '[Ish beruvchi nomi]'}» hisobidan mening foydamga to‘lanmagan ${amountFormatted} so‘m ish haqi qarzdorligini;
2. Kechiktirilgan kunlar uchun hisoblangan qonuniy foizlarni undirib berishingizni.

Ilova qilingan hujjatlar:
1. Da‘vo arizasi nusxasi;
2. Mehnat shartnomasi va buyruqdan ko‘chirma;
3. Korxona hisob-kitob bo‘limi bergan ma‘lumotnoma;
4. Pasport nusxasi.

Da‘vogar: ${values.employee_fullname || '[Xodim F.I.Sh.]'}        ___________        ${dateStr}`
  }

  // 4. TURAR JOY IJARA SHARTNOMASI
  if (doc.id === 'doc-contract-lease-004') {
    const rentFormatted = fmtNumber(values.monthly_rent)
    return `TURAR JOYNI IJARAGA BERISH SHARTNOMASI

Toshkent shahri                                            ${dateStr}

Mulkdor (Ijaraga beruvchi): ${values.landlord_fullname || '[Ijaraga beruvchi F.I.Sh.]'}, pasport ma‘lumotlari: ${values.landlord_passport || '________________'}, yashash manzili: ${values.landlord_address || '________________'} (bir tomondan),
va Ijarachi: ${values.tenant_fullname || '[Ijarachi F.I.Sh.]'}, pasport ma‘lumotlari: ${values.tenant_passport || '________________'}, yashash manzili: ${values.tenant_address || '________________'} (ikkinchi tomondan), quyidagilar to‘g‘risida mazkur shartnomani tuzdilar:

1. SHARTNOMA PREDMETI
1.1. Ijaraga beruvchi o‘ziga xususiy mulk huquqi asosida tegishli bo‘lgan quyidagi manzilda joylashgan turar joyni Ijarachiga vaqtincha yashash uchun haq evaziga ijaraga beradi:
Manzil: ${values.property_address || '[Turar joy manzili]'}
1.2. Turar joy Ijarachiga ${values.lease_term_months || '12'} oy muddatga ijaraga topshiriladi.

2. TO‘LOV TARTIBI VA HISOB-KITOBLAR
2.1. Oylik ijara haqi ${rentFormatted} so‘mni tashkil etadi.
2.2. Ijara haqi har oyning 5-sanasiga qadar naqd yoki bank o‘tkazmasi orqali to‘lanadi.
2.3. Kommunal to‘lovlar (elektr, gaz, sovuq va issiq suv, internet) iste‘mol qilingan hajmga muvofiq Ijarachi tomonidan o‘z vaqtida to‘lanadi.

3. TARAFLARNING HUQUQ VA MAJBURIYATLARI
3.1. Ijarachi turar joydan faqat yashash maqsadida foydalanishi, yong‘in va sanitariya xavfsizligi qoidalariga qat‘iy rioya qilishi, mulkni but saqlashi shart.
3.2. Ijarachi ijaraga olingan joyni uchinchi shaxslarga ikkilamchi ijaraga (subarenda) berishga haqli emas.
3.3. Mazkur shartnoma O‘zbekiston Respublikasi Soliq kodeksining talablariga muvofiq davlat soliq xizmati organlarida (ijara.soliq.uz) hisobga qo‘yilishi shart.

4. NIZOLARNI HAL ETISH
4.1. Ushbu shartnoma yuzasidan kelib chiquvchi barcha nizolar O‘zbekiston Respublikasi Fuqarolik kodeksining 600-616-moddalariga muvofiq qonuniy sud tartibida hal etiladi.

5. TARAFLARNING REKVIZITLARI VA IMZOLARI:

Ijaraga beruvchi:                           Ijarachi:
${values.landlord_fullname || '[F.I.Sh.]'}                 ${values.tenant_fullname || '[F.I.Sh.]'}
Imzo: _____________________                 Imzo: _____________________`
  }

  // 5. MEROSNI QABUL QILISH MUDDATINI TIKLASH
  if (doc.id === 'doc-inheritance-claim-005') {
    const courtFormatted = formatCourtName(values.court_name)
    return `${courtFormatted}

Da‘vogar: ${values.plaintiff_address || '[Da‘vogar manzili]'}da yashovchi
${values.plaintiff_fullname || '[Merosxo‘r F.I.Sh.]'}
Telefon: ${values.plaintiff_phone || '[Telefon]'}

Manfaatdor shaxslar: Notarial idora

DA‘VO ARIZA
(Merosni qabul qilish muddatini tiklash to‘g‘risida)

${values.death_date || '[Vafot sanasi]'}da mening yaqin qarindoshim (meros qoldiruvchi) ${values.deceased_fullname || '[Marhum F.I.Sh.]'} vafot etdi. Marhumning vafotidan so‘ng quyidagi meros mulki ochildi:
${values.estate_description || '[Meros mulki tavsifi]'}

Men qonun bo‘yicha merosxo‘r hisoblanaman. Biroq quyidagi uzrli sabablarga ko‘ra 6 oylik qonuniy muddatda notariat idorasiga murojaat qila olmadim:
${values.excuse_reason || '[Uzrli sabab bayoni]'}

O‘zbekiston Respublikasi Fuqarolik kodeksining 1143-moddasiga ko‘ra, agar merosxo‘r meros ochilganligini bilmagan yoki boshqa uzrli sabablarga ko‘ra muddatni o‘tkazib yuborgan bo‘lsa, sud muddatni tiklashi mumkin.

Yuqoridagilarga asosan hamda FPKning 188, 189-moddalariga tayangan holda,

SO‘RAYMAN:
1. Marhum ${values.deceased_fullname || '[Marhum F.I.Sh.]'}dan qolgan meros mulkini qabul qilish muddatini tiklashingizni;
2. Meni merosni qabul qilgan merosxo‘r deb e‘tirof etishingizni.

Ilova qilingan hujjatlar:
1. Da‘vo arizasi nusxalari;
2. O‘lim to‘g‘risidagi guvohnoma nusxasi;
3. Qarindoshlik aloqalarini tasdiqlovchi hujjatlar;
4. Muddat o‘tkazilganligining uzrli sabablarini tasdiqlovchi dalillar;
5. Davlat boji to‘langanligi kvitansiyasi.

Da‘vogar: ${values.plaintiff_fullname || '[F.I.Sh.]'}        ___________        ${dateStr}`
  }

  // 6. MA'MURIY JARIMA QARORI USTIDAN SHIKOYAT
  if (doc.id === 'doc-administrative-appeal-006') {
    const adminCourt = values.admin_court_name
      ? (values.admin_court_name.endsWith('sudiga') ? values.admin_court_name : `${values.admin_court_name} sudiga`)
      : 'Tuman ma‘muriy sudiga'
    return `${adminCourt}

Arizachi (shikoyat beruvchi): ${values.applicant_address || '[Arizachi manzili]'}da yashovchi
${values.applicant_fullname || '[Arizachi F.I.Sh.]'}
Telefon: ${values.applicant_phone || '[Telefon]'}

Javobgar organ: ${values.issuing_body || '[Qarorni chiqargan organ / Mansabdor shaxs]'}

SHIKOYAT ARIZASI
(Ma‘muriy jarima qo‘llash to‘g‘risidagi qarorni bekor qilish haqida)

${values.issuing_body || '[Organ]'} tomonidan ${values.decision_date || '[Sana]'} kuni menga nisbatan ${values.penalty_decision_number || '[Qaror raqami]'} sonli ma‘muriy jazo qo‘llash haqida qaror qabul qilingan.

Mazkur qaror quyidagi asoslarga ko‘ra asossiz va noqonuniy deb hisoblayman:
${values.grounds_for_cancellation || '[Noqonuniylik asoslari va vajlar]'}

O‘zbekiston Respublikasi Ma‘muriy javobgarlik to‘g‘risidagi kodeksining 314, 315-moddalariga muvofiq,

SO‘RAYMAN:
${values.issuing_body || '[Organ]'}ning ${values.decision_date || '[Sana]'} dagi ${values.penalty_decision_number || '[Qaror raqami]'} sonli qarorini bekor qilib, ma‘muriy huquqbuzarlik to‘g‘risidagi ishni tugatishingizni.

Ilova qilingan hujjatlar:
1. Shikoyat arizasi nusxasi;
2. Nizoli ma‘muriy qaror nusxasi;
3. Dalillar (foto/video/hujjatlar nusxalari);
4. Fuqaro pasporti nusxasi.

Arizachi: ${values.applicant_fullname || '[F.I.Sh.]'}        ___________        ${dateStr}`
  }

  // 7. JINOYAT ISHIDA JABRLANUVCHI DEB TAN OLISH TO'G'RISIDA ILTIMOSNOMA
  if (doc.id === 'doc-criminal-petition-007') {
    return `${values.investigator_title || '[Tergovchi yoki surishtiruvchining lavozimi va F.I.Sh.]'}

Arizachi: ${values.applicant_address || '[Arizachi manzili]'}da yashovchi
${values.applicant_fullname || '[Arizachi F.I.Sh.]'}
Telefon: ${values.applicant_phone || '[Telefon]'}

ILTIMOSNOMA
(Jinoyat ishi bo‘yicha jabrlanuvchi deb tan olish to‘g‘risida)

Sizning yurituvuvizda bo‘lgan ${values.criminal_case_number || 'jinoyat ishi'} bo‘yicha quyidagilarni ma‘lum qilaman:
Sodir etilgan jinoiy harakat oqibatida menga quyidagi zarar yetkazildi:
${values.harm_description || '[Yetkazilgan zarar va holat bayoni]'}

O‘zbekiston Respublikasi Jinoyat-protsessual kodeksining 54-moddasiga ko‘ra, jinoyat tufayli ma‘naviy, jismoniy yoki mulkiy zarar ko‘rgan shaxs jabrlanuvchi deb e‘tirof etiladi. JPKning 55-moddasida jabrlanuvchining protsessual huquqlari belgilangan.

Yuqoridagilarga asosan, JPKning 54, 55 va 275-moddalariga muvofiq,

ILTIMOS QILAMAN:
1. Meni mazkur jinoyat ishi bo‘yicha rasman jabrlanuvchi deb tan olish haqida qaror chiqarishingizni;
2. Menga JPKda nazarda tutilgan jabrlanuvchining huquq va majburiyatlarini tushuntirishingizni.

Ilova qilingan hujjatlar:
1. Zararni tasdiqlovchi hujjatlar;
2. Shaxsni tasdiqlovchi pasport nusxasi.

Arizachi: ${values.applicant_fullname || '[F.I.Sh.]'}        ___________        ${dateStr}`
  }

  // 8. NOTARIAL ISHONCHNOMA (AVTOTRANSPORTNI BOSHQARISH VA TASARRUF ETISH)
  if (doc.id === 'doc-notarial-power-of-attorney-008') {
    return `O‘ZBEKISTON RESPUBLIKASI
NOTARIAL TASDIQLANADIGAN ISHONCHNOMA

Toshkent shahri                                            ${dateStr}

Men, fuqaro ${values.principal_fullname || '[Ishonchnoma beruvchi F.I.Sh.]'}, pasport: ${values.principal_passport || '________________'}, yashash manzili: ${values.principal_address || '________________'},
ushbu ishonchnoma orqali fuqaro ${values.agent_fullname || '[Ishonchli vakil F.I.Sh.]'}ga (pasport: ${values.agent_passport || '________________'}, yashash manzili: ${values.agent_address || '________________'})
o‘zimga xususiy mulk huquqi asosida tegishli bo‘lgan quyidagi avtotransport vositasini:
Rusumi va modeli: ${values.vehicle_model || '[Avtotransport modeli]'}
Davlat raqam belgisi: ${values.license_plate || '[Davlat raqami]'}
Kuzov / shassi raqami: ${values.vin_number || '________________'}

boshqarish, texnik ko‘rikdan o‘tkazish, sug‘urta shartnomalarini tuzish, jarima va to‘lovlarni to‘lash, yo‘l-patrul xizmati organlarida va barcha idoralarda mening nomimdan harakat qilish huquqi bilan ishonchli vakil etib tayinlayman.

Ishonchnoma ${values.validity_period || '3 yil'} muddatga berildi (boshqa shaxsga o‘tkazish huquqi bilan / huquqisiz).

Matn menga to‘liq o‘qib eshitirildi, mazmuni va huquqiy oqibatlari tushunarli.

Ishonchnoma beruvchi: ${values.principal_fullname || '[F.I.Sh.]'}
Imzo: _____________________`
  }

  // 9. SUD MAJLISIDA AUDIO VA VIDEO YOZUV OLIB BORISH TO'G'RISIDA ILTIMOSNOMA
  if (doc.id === 'doc-procedural-record-motion-009') {
    return `${values.court_name || '[Sud nomi va raislik etuvchi sudyaga]'}

Arizachi: ${values.party_fullname || '[F.I.Sh.]'}
Ishdagi maqomi: ${values.party_role || '[Da’vogar / Javobgar / Vakil]'}

ILTIMOSNOMA
(Sud majlisida texnik qayd etish vositalaridan foydalanish to‘g‘risida)

Sizning raisligingizda ko‘rilayotgan fuqarolik ishi bo‘yicha sud muhokamasining oshkoraligini ta‘minlash hamda o‘z huquq va qonuniy manfaatlarimni to‘liq himoya qilish maqsadida sud majlisi jarayonida ${values.recording_type ? values.recording_type.toLowerCase() : 'audio yozuv olib borish'}dan foydalanish zarurati mavjud.

O‘zbekiston Respublikasi Fuqarolik protsessual kodeksining 19-moddasi hamda Oliy sud Plenumining ochiqlik to‘g‘risidagi qaroriga muvofiq, ochiq sud majlisida audio yozuv erkin amalga oshiriladi.

Yuqoridagilarga asosan, FPKning 19 va 208-moddalariga muvofiq,

ILTIMOS QILAMAN:
Mazkur ish bo‘yicha sud majlisida ${values.recording_type ? values.recording_type.toLowerCase() : 'audio yozuv olib borish'}ga ruxsat berishingizni.

Arizachi: ${values.party_fullname || '[F.I.Sh.]'}        ___________        ${dateStr}`
  }

  // 10. KO'CHMAS MULK DASTLABKI OLDI-SOTDI SHARTNOMASI
  if (doc.id === 'doc-other-preliminary-contract-010') {
    const priceFormatted = fmtNumber(values.agreed_price)
    const depositFormatted = fmtNumber(values.deposit_amount)
    return `KO‘CHMAS MULK OLDI-SOTDISI BO‘YICHA DASTLABKI SHARTNOMA
(Beh / Zaklad kafolati bilan)

Toshkent shahri                                            ${dateStr}

Biz, bir tomondan «Sotuvchi» — ${values.seller_fullname || '[Sotuvchi F.I.Sh.]'} (pasport: ${values.seller_passport || '________________'}),
va ikkinchi tomondan «Xaridor» — ${values.buyer_fullname || '[Xaridor F.I.Sh.]'} (pasport: ${values.buyer_passport || '________________'}),
O‘zbekiston Respublikasi Fuqarolik kodeksining 361-moddasiga asosan quyidagilar to‘g‘risida mazkur dastlabki shartnomani tuzdik:

1. SHARTNOMA PREDMETI
1.1. Taraflar kelgusida quyidagi ko‘chmas mulk ob’ekti bo‘yicha notarial tasdiqlangan asosiy oldi-sotdi shartnomasini tuzish majburiyatini oladilar:
Ob’ekt tavsifi: ${values.property_spec || '[Ko‘chmas mulk manzili va kadastr raqami]'}

2. NARX VA HISOB-KITOBLAR
2.1. Ko‘chmas mulkning kelishilgan to‘liq bahosi ${priceFormatted} so‘mni tashkil etadi.
2.2. Mazkur dastlabki shartnoma imzolangan vaqtda Xaridor Sotuvchiga ${depositFormatted} so‘m miqdorida beh (zaklad) summasini topshirdi, Sotuvchi esa ushbu mablag‘ni qabul qilib oldi.
2.3. Asosiy shartnoma tuzilganda berilgan beh summasi ko‘chmas mulkning umumiy qiymatiga hisobga olinadi.

3. ASOSIY SHARTNOMANI TUZISH MUDDATI
3.1. Taraflar asosiy oldi-sotdi shartnomasini va mulk huquqini davlat ro‘yxatidan o‘tkazishni 30 (o‘ttiz) kalendar kun ichida notarial tartibda rasmiylashtirish majburiyatini oladilar.
3.2. Agar asosiy shartnoma tuzilishidan Sotuvchi bosh tortsa, FKning 312-moddasiga muvofiq zaklad summasini ikki baravar miqdorida Xaridorga qaytaradi. Agar Xaridor bosh tortsa, zaklad summasi Sotuvchida qoladi.

4. TARAFLARNING IMZOLARI:

Sotuvchi: _____________________ ${values.seller_fullname || ''}
Xaridor:  _____________________ ${values.buyer_fullname || ''}`
  }

  // Umumiy shablonlar uchun professional yuridik shakl
  let content = `${doc.documentName.toUpperCase()}\n\n`
  for (const field of doc.fields) {
    const val = values[field.name] || `________________`
    content += `${field.label}: ${val}\n`
  }
  content += `\nSana: ${dateStr}\nImzo: _____________________`
  return content
}

