'use client'

import React, { useState } from 'react'
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  ExternalLink,
  Search,
  Filter,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  Building,
  Printer,
  FileCheck,
} from 'lucide-react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export interface OfficialLegalDocument {
  id: string
  title: string
  documentNumber: string
  category:
    | 'constitution'
    | 'code'
    | 'law'
    | 'presidential'
    | 'cabinet'
    | 'procedural'
  categoryLabel: string
  adoptionDate: string
  effectiveDate: string
  status: 'Amalda' | 'O‘z kuchini yo‘qotgan'
  officialSource: string
  officialUrl: string
  lastVerifiedDate: string
  description: string
  proceduralContent?: string
}

export const VERIFIED_OFFICIAL_DOCUMENTS: OfficialLegalDocument[] = [
  // 1. KONSTITUTSIYA
  {
    id: 'doc_const_2023',
    title: 'O‘zbekiston Respublikasi Konstitutsiyasi (Yangi tahrir)',
    documentNumber: 'O‘RQ-829 / Referendum',
    category: 'constitution',
    categoryLabel: 'Konstitutsiya',
    adoptionDate: '2023-04-30',
    effectiveDate: '2023-05-01',
    status: 'Amalda',
    officialSource: 'O‘zbekiston Respublikasi qonunchilik ma’lumotlari milliy bazasi (Lex.uz)',
    officialUrl: 'https://lex.uz/docs/6445145',
    lastVerifiedDate: '2026-yil',
    description:
      'Davlatning oliy yuridik kuchga ega asosiy qonuni. Inson huquqlari, fuqarolik erkinliklari, sud hokimiyati mustaqilligi va xususiy mulk daxlsizligi kafolatlari.',
  },

  // 2. KODEKSLAR
  {
    id: 'doc_labor_code',
    title: 'O‘zbekiston Respublikasining Mehnat Kodeksi (Yangi tahrir)',
    documentNumber: 'O‘RQ-798',
    category: 'code',
    categoryLabel: 'Kodekslar',
    adoptionDate: '2022-10-28',
    effectiveDate: '2023-04-30',
    status: 'Amalda',
    officialSource: 'Lex.uz qonunchilik milliy bazasi',
    officialUrl: 'https://lex.uz/docs/6257288',
    lastVerifiedDate: '2026-yil',
    description:
      'Yakka va jamoaviy mehnat munosabatlari, mehnat shartnomasini tuzish, o‘zgartirish, bekor qilish tartibi, xodimlar kafolatlari va mehnat nizolari.',
  },
  {
    id: 'doc_civil_code',
    title: 'O‘zbekiston Respublikasining Fuqarolik Kodeksi',
    documentNumber: '166-I / 257-I',
    category: 'code',
    categoryLabel: 'Kodekslar',
    adoptionDate: '1995-12-21',
    effectiveDate: '1997-03-01',
    status: 'Amalda',
    officialSource: 'Lex.uz qonunchilik milliy bazasi',
    officialUrl: 'https://lex.uz/docs/111189',
    lastVerifiedDate: '2026-yil',
    description:
      'Fuqarolik muomalasi, mulk huquqi, shartnomaviy majburiyatlar, zararni qoplash, meros va intellektual mulk huquqlarini tartibga soluvchi asosiy kodeks.',
  },
  {
    id: 'doc_civil_proc_code',
    title: 'O‘zbekiston Respublikasining Fuqarolik Protsessual Kodeksi',
    documentNumber: 'O‘RQ-451',
    category: 'code',
    categoryLabel: 'Kodekslar',
    adoptionDate: '2018-01-22',
    effectiveDate: '2018-04-01',
    status: 'Amalda',
    officialSource: 'Lex.uz qonunchilik milliy bazasi',
    officialUrl: 'https://lex.uz/docs/3517337',
    lastVerifiedDate: '2026-yil',
    description:
      'Fuqarolik ishlari bo‘yicha sudlarda ishlarni qo‘zg‘atish, ko‘rib chiqish, isbotlash, qaror chiqarish va apellyatsiya/kassatsiya tartibi.',
  },
  {
    id: 'doc_econ_proc_code',
    title: 'O‘zbekiston Respublikasining Iqtisodiy Protsessual Kodeksi',
    documentNumber: 'O‘RQ-452',
    category: 'code',
    categoryLabel: 'Kodekslar',
    adoptionDate: '2018-01-24',
    effectiveDate: '2018-04-01',
    status: 'Amalda',
    officialSource: 'Lex.uz qonunchilik milliy bazasi',
    officialUrl: 'https://lex.uz/docs/3518451',
    lastVerifiedDate: '2026-yil',
    description:
      'Tadbirkorlar va xo‘jalik yurituvchi subyektlar o‘rtasidagi iqtisodiy nizolarni iqtisodiy sudlarda ko‘rib chiqish protsedurasi.',
  },
  {
    id: 'doc_admin_proc_code',
    title: 'Ma’muriy sud ishlarini yuritish to‘g‘risidagi Kodeks',
    documentNumber: 'O‘RQ-453',
    category: 'code',
    categoryLabel: 'Kodekslar',
    adoptionDate: '2018-01-25',
    effectiveDate: '2018-04-01',
    status: 'Amalda',
    officialSource: 'Lex.uz qonunchilik milliy bazasi',
    officialUrl: 'https://lex.uz/docs/3527124',
    lastVerifiedDate: '2026-yil',
    description:
      'Davlat organlari va mansabdor shaxslarning qarorlari hamda harakatlari ustidan sudga shikoyat qilish tartibi.',
  },
  {
    id: 'doc_tax_code',
    title: 'O‘zbekiston Respublikasining Soliq Kodeksi (Yangi tahrir)',
    documentNumber: 'O‘RQ-599',
    category: 'code',
    categoryLabel: 'Kodekslar',
    adoptionDate: '2019-12-30',
    effectiveDate: '2020-01-01',
    status: 'Amalda',
    officialSource: 'Lex.uz qonunchilik milliy bazasi',
    officialUrl: 'https://lex.uz/docs/4674902',
    lastVerifiedDate: '2026-yil',
    description:
      'Soliq turlari, stavkalari, soliq nazorati, huquqbuzarliklar uchun javobgarlik va soliq imtiyozlari mezonlari.',
  },

  // 3. QONUNLAR
  {
    id: 'doc_state_fee_law',
    title: 'O‘zbekiston Respublikasining "Davlat boji to‘g‘risida"gi Qonuni',
    documentNumber: 'O‘RQ-600',
    category: 'law',
    categoryLabel: 'Qonunlar',
    adoptionDate: '2020-01-06',
    effectiveDate: '2020-01-07',
    status: 'Amalda',
    officialSource: 'Lex.uz qonunchilik milliy bazasi',
    officialUrl: 'https://lex.uz/docs/4680888',
    lastVerifiedDate: '2026-yil',
    description:
      'Sudlarga da‘vo arizalari, notarial harakatlar va FHDYo organlari xizmatlari uchun davlat boji stavkalari va imtiyozlar tartibi.',
  },
  {
    id: 'doc_advocacy_law',
    title: 'O‘zbekiston Respublikasining "Advokatura to‘g‘risida"gi Qonuni',
    documentNumber: '349-I',
    category: 'law',
    categoryLabel: 'Qonunlar',
    adoptionDate: '1996-12-27',
    effectiveDate: '1997-01-01',
    status: 'Amalda',
    officialSource: 'Lex.uz qonunchilik milliy bazasi',
    officialUrl: 'https://lex.uz/docs/111475',
    lastVerifiedDate: '2026-yil',
    description:
      'Advokat maqomi, faoliyat kafolatlari, advokatlik siri, shartnoma asosida yuridik yordam ko‘rsatish va advokatlar palatasi.',
  },
  {
    id: 'doc_contract_law_670',
    title: 'Xo‘jalik yurituvchi subyektlar faoliyatining shartnomaviy-huquqiy bazasi to‘g‘risida',
    documentNumber: '670-I',
    category: 'law',
    categoryLabel: 'Qonunlar',
    adoptionDate: '1998-08-29',
    effectiveDate: '1998-11-01',
    status: 'Amalda',
    officialSource: 'Lex.uz qonunchilik milliy bazasi',
    officialUrl: 'https://lex.uz/docs/23724',
    lastVerifiedDate: '2026-yil',
    description:
      'Xo‘jalik shartnomalarini tuzish, penya va jarimalarning chegaraviy miqdorlari (FK 326 bilan uyg‘unlikda) va majburiyatlarni bajarish talablari.',
  },

  // 4. PREZIDENT HUJJATLARI
  {
    id: 'doc_pf_115_bhm',
    title: 'Ish haqi, pensiyalar va nafaqalar miqdorini oshirish to‘g‘risida Farmon',
    documentNumber: 'PF-115-son',
    category: 'presidential',
    categoryLabel: 'Prezident hujjatlari',
    adoptionDate: '2026-06-23',
    effectiveDate: '2026-09-01',
    status: 'Amalda',
    officialSource: 'Lex.uz qonunchilik milliy bazasi',
    officialUrl: 'https://lex.uz/docs/7027429',
    lastVerifiedDate: '2026-yil',
    description:
      'O‘zbekiston Respublikasi hududida amaldagi Bazaviy hisoblash miqdori (BHM) 440 000 so‘m etib belgilangan rasmiy normativ akt.',
  },
  {
    id: 'doc_pf_89_court_digital',
    title: 'Sud tizimi faoliyatini raqamlashtirish to‘g‘risida Prezident Farmoni',
    documentNumber: 'PF-89-son',
    category: 'presidential',
    categoryLabel: 'Prezident hujjatlari',
    adoptionDate: '2023-06-10',
    effectiveDate: '2023-06-12',
    status: 'Amalda',
    officialSource: 'Lex.uz qonunchilik milliy bazasi',
    officialUrl: 'https://lex.uz/docs/6462719',
    lastVerifiedDate: '2026-yil',
    description:
      'Sud majlislarini masofaviy videokonferensaloqa rejimida o‘tkazish, elektron sud ishlarini yuritish va sud.uz portalini rivojlantirish dasturi.',
  },

  // 5. VAZIRLAR MAHKAMASI QARORLARI
  {
    id: 'doc_vmq_705_notary',
    title: 'Notariat sohasida davlat xizmatlari ko‘rsatishning ma’muriy reglamentlari',
    documentNumber: 'VMQ-705-son',
    category: 'cabinet',
    categoryLabel: 'Vazirlar Mahkamasi qarorlari',
    adoptionDate: '2020-11-18',
    effectiveDate: '2020-11-19',
    status: 'Amalda',
    officialSource: 'Lex.uz qonunchilik milliy bazasi',
    officialUrl: 'https://lex.uz/docs/4579120',
    lastVerifiedDate: '2026-yil',
    description:
      'Ko‘chmas mulk oldi-sotdi, ishonchnomalar, vasiyatnomalar va meros guvohnomalarini rasmiylashtirishda notarial stavkalar va reglamentlar.',
  },

  // 6. RASMIY TASDIQLANGAN NAMUNAVIY PROTSESSUAL HUJJATLAR
  {
    id: 'doc_tpl_davo_qarz',
    title: 'Qarz summasini undirish to‘g‘risida da‘vo arizasi (Namunaviy protsessual shakl)',
    documentNumber: 'FPK-189-191-shakl',
    category: 'procedural',
    categoryLabel: 'Namunaviy protsessual hujjatlar',
    adoptionDate: '2024-yil tahriri',
    effectiveDate: '2026-yil amalda',
    status: 'Amalda',
    officialSource: 'Oliy Sud va Adliya vazirligi namunaviy arizalar reestri',
    officialUrl: 'https://lex.uz/docs/3517337#3518012',
    lastVerifiedDate: '2026-yil',
    description:
      'Fuqarolar o‘rtasidagi qarz tilxati yoki shartnomasi bo‘yicha asosiy qarz va penyani sud tartibida undirish arizasi.',
    proceduralContent: `FUQAROLIK ISHLARI BO‘YICHA (tuman/shahar) SUDIGA

Da‘vogar: [Da'vogarning F.I.Sh.], Yashash manzili: [Manzil], Telefon: [Telefon], JShShIR: [JShShIR]
Javobgar: [Javobgarning F.I.Sh.], Yashash manzili: [Manzil], Telefon: [Telefon]
Da‘vo bahosi: [Summa] so‘m
Davlat boji: [Summa] so‘m (O‘RQ-600 Qonunga asosan)

DA‘VO ARIZASI
(Qarz summasini va foizlarni undirish to‘g‘risida)

Javobgar [Javobgar F.I.Sh.] bilan o‘rtamizda [Sana] kuni tuzilgan qarz tilxatiga (shartnomasiga) asosan, men unga [Qarz summasi] so‘m miqdorida qarz bergan edim. Qarzni qaytarish muddati [Qaytarish sanasi] qilib belgilangan bo‘lsa-da, javobgar majburiyatini lozim darajada bajarmasdan kelmoqda.

Javobgarga yuborilgan yozma talabnoma (pretenziya) oqibatsiz qoldirildi.

O‘zbekiston Respublikasi Fuqarolik Kodeksining 732, 735, 736-moddalariga, Fuqarolik protsessual kodeksining 188, 189, 191-moddalariga asosan,

SO‘RAYMAN:
1. Javobgar [Javobgar F.I.Sh.]dan mening foydamga [Qarz summasi] so‘m asosiy qarz summasini undirishingizni;
2. To‘langan davlat boji va pochta xarajatlarini javobgar hisobidan undirishingizni.

Ilova qilinayotgan hujjatlar:
1. Da‘vo arizasining javobgar uchun nusxasi.
2. Qarz tilxati (shartnomasi) asl nusxasi.
3. Davlat boji to‘langanligi to‘g‘risida kvitansiya.
4. Javobgarga yuborilgan talabnoma va pochta kvitansiyasi.

Da‘vogar: ____________________ [F.I.Sh.]
Sana: 2026-yil "___" ____________`,
  },
  {
    id: 'doc_tpl_ishga_tiklash',
    title: 'Ishga tiklash va majburiy progul haqini undirish to‘g‘risida da‘vo arizasi',
    documentNumber: 'MK-161-560-shakl',
    category: 'procedural',
    categoryLabel: 'Namunaviy protsessual hujjatlar',
    adoptionDate: '2024-yil tahriri',
    effectiveDate: '2026-yil amalda',
    status: 'Amalda',
    officialSource: 'Oliy Sud va Kasaba uyushmalari federatsiyasi namunasi',
    officialUrl: 'https://lex.uz/docs/6257288#6261540',
    lastVerifiedDate: '2026-yil',
    description:
      'Mehnat shartnomasini ish beruvchi tashabbusi bilan qonunga xilof ravishda bekor qilinganda sudga murojaat qilish namunasi.',
    proceduralContent: `FUQAROLIK ISHLARI BO‘YICHA (tuman/shahar) SUDIGA

Da‘vogar: [Xodimning F.I.Sh.], Yashash manzili: [Manzil], Telefon: [Telefon]
Javobgar: [Tashkilot nomi], Yuridik manzili: [Manzil], STIR: [STIR]
Davlat boji: Mehnat nizolari bo‘yicha da‘vogar davlat bojidan ozod qilingan (O‘RQ-600 8-moddasi)

DA‘VO ARIZASI
(Ishga tiklash va majburiy progul vaqti uchun ish haqini undirish to‘g‘risida)

Men [Tashkilot nomi] da [Sana] dan buyon [Lavozim nomi] lavozimida ishlab kelganman. Ish beruvchining [Buyruq sanasi] dagi [Buyruq raqami]-sonli buyrug‘i bilan men bilan tuzilgan mehnat shartnomasi asossiz va qonun talablariga zid ravishda bekor qilingan.

Ishdan bo‘shatish jarayonida Mehnat Kodeksining 161, 164-moddalarida nazarda tutilgan ogohlantirish muddati va protsessual kafolatlar qo‘pol ravishda buzilgan.

Mehnat Kodeksining 161, 560, 561-moddalariga, FPKning 188, 189-moddalariga asosan,

SO‘RAYMAN:
1. Ish beruvchining [Sana] dagi [Buyruq raqami]-sonli buyrug‘ini g‘ayriqonuniy deb topib, meni avvalgi [Lavozim nomi] lavozimiga ishga tiklashingizni;
2. Majburiy progul qilingan barcha kunlar uchun o‘rtacha oylik ish haqini javobgardan undirishingizni;
3. Yetkazilgan ma‘naviy zarar uchun javobgardan kompensatsiya undirishingizni.

Ilova qilinayotgan hujjatlar:
1. Da‘vo arizasi nusxasi.
2. Ishga qabul qilish va bo‘shatish haqidagi buyruqlar nusxasi.
3. Mehnat daftarchasi yoki elektron mehnat daftarchasidan ko‘chirma.
4. Oylik ish haqi to‘g‘risida ma‘lumotnoma.

Da‘vogar: ____________________ [F.I.Sh.]
Sana: 2026-yil "___" ____________`,
  },
]

export default function DocumentConstructorWorkspace() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<OfficialLegalDocument | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [previewModalDoc, setPreviewModalDoc] = useState<OfficialLegalDocument | null>(null)

  const filteredDocs = VERIFIED_OFFICIAL_DOCUMENTS.filter(doc => {
    const matchCat = selectedCategory === 'all' || doc.category === selectedCategory
    const q = searchQuery.toLowerCase().trim()
    const matchQuery =
      !q ||
      doc.title.toLowerCase().includes(q) ||
      doc.documentNumber.toLowerCase().includes(q) ||
      doc.description.toLowerCase().includes(q)
    return matchCat && matchQuery
  })

  const copyTemplate = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const downloadTextFile = (doc: OfficialLegalDocument) => {
    const content = doc.proceduralContent || `${doc.title}\n${doc.documentNumber}\nManba: ${doc.officialUrl}\n\n${doc.description}`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.documentNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Rasmiy Yuridik Hujjatlar va Namunaviy Shakllar Bazasi
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-2xl">
              Faqat O‘zbekiston Respublikasi rasmiy qonunchilik ma’lumotlari milliy bazasi (Lex.uz) va vakolatli sud organlari tomonidan tasdiqlangan hujjatlar.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Rasmiy Manbalar
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
              placeholder="Hujjat nomi, raqami yoki yo‘nalishi bo‘yicha qidiruv (masalan: Mehnat kodeksi, FPK, Qarz, O‘RQ-600)..."
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
              <option value="all">Barcha toifalar</option>
              <option value="constitution">Konstitutsiya</option>
              <option value="code">Kodekslar</option>
              <option value="law">Qonunlar</option>
              <option value="presidential">Prezident hujjatlari</option>
              <option value="cabinet">Vazirlar Mahkamasi qarorlari</option>
              <option value="procedural">Namunaviy protsessual shakllar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map(doc => (
          <div
            key={doc.id}
            className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-800/60 transition-all flex flex-col justify-between shadow-xs space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900">
                  {doc.categoryLabel}
                </span>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    {doc.documentNumber}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {doc.status}
                  </span>
                </div>
              </div>

              <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {doc.title}
              </h4>

              <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                {doc.description}
              </p>

              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 space-y-1 text-[11px] text-gray-500 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Qabul qilingan sana:</span>
                  <span className="font-medium text-gray-700 dark:text-zinc-300">{doc.adoptionDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Oxirgi tekshirilgan sana:</span>
                  <span className="font-medium text-gray-700 dark:text-zinc-300">{doc.lastVerifiedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rasmiy manba:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400 truncate max-w-[180px]">
                    {doc.officialSource}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs gap-2">
              <a
                href={doc.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                <span>Rasmiy matn (Lex.uz)</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex items-center gap-1.5">
                {doc.proceduralContent ? (
                  <>
                    <button
                      onClick={() => setPreviewModalDoc(doc)}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 text-gray-700 dark:text-zinc-300 font-semibold inline-flex items-center gap-1 text-xs transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Shablon</span>
                    </button>

                    <button
                      onClick={() => copyTemplate(doc.proceduralContent!, doc.id)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold inline-flex items-center gap-1 text-xs transition"
                    >
                      {copiedId === doc.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Nusxalandi</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Nusxalash</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => downloadTextFile(doc)}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 text-gray-700 dark:text-zinc-300 font-semibold inline-flex items-center gap-1 text-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Yuklab olish</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Procedural Template Preview Modal */}
      {previewModalDoc && previewModalDoc.proceduralContent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {previewModalDoc.categoryLabel}
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {previewModalDoc.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModalDoc(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 font-mono text-xs whitespace-pre-wrap bg-gray-50 dark:bg-zinc-950 text-gray-800 dark:text-zinc-200 leading-relaxed border-y border-gray-100 dark:border-zinc-800">
              {previewModalDoc.proceduralContent}
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3">
              <span className="text-[11px] text-gray-400">
                Manba: {previewModalDoc.officialSource}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadTextFile(previewModalDoc)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 text-gray-700 dark:text-zinc-300 font-semibold text-xs inline-flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Fayl sifatida yuklab olish</span>
                </button>

                <button
                  onClick={() => copyTemplate(previewModalDoc.proceduralContent!, previewModalDoc.id)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition shadow-xs"
                >
                  {copiedId === previewModalDoc.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Nusxa olindi!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Shablonni nusxalash</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
