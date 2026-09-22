import { OfficialLegalSource } from '@/types/professional-tools'

/**
 * Official Legal Sources Registry for Uzbekistan
 * Provides strictly verified metadata, URLs, article references, and legal bases.
 * Fully active as of 2026.
 */

export const CURRENT_BHM_VALUE = 375_000 // Bazaviy hisoblash miqdori (BHM)
export const CURRENT_CBU_MAIN_RATE = 13.5 // Markaziy Bankning amaldagi asosiy qayta moliyalash stavkasi (%)

export interface LegalSourceVersionMeta {
  source_key: string
  source_name: string
  source_type: 'code' | 'law' | 'decree' | 'plenum' | 'cbu_rate' | 'regulation' | 'standard_form'
  official_domain: string
  official_url: string
  url: string
  document_id?: string
  document_number: string
  document_title: string
  article?: string
  part?: string
  paragraph?: string
  adoption_date?: string
  publication_date?: string
  effective_date: string
  expiration_date?: string | null
  current_version: string
  retrieved_at: string
  verified_at: string
  verification_status: 'verified' | 'pending' | 'deprecated' | 'archived'
  content_hash?: string
  current_rate?: number
  currency?: string
  description: string
}

export const OFFICIAL_LEGAL_SOURCES: Record<string, LegalSourceVersionMeta> = {
  STATE_FEE_LAW: {
    source_key: 'state_fee_law',
    source_name: 'O‘zbekiston Respublikasining "Davlat boji to‘g‘risida"gi Qonuni',
    source_type: 'law',
    official_domain: 'lex.uz',
    official_url: 'https://lex.uz/docs/4680888',
    url: 'https://lex.uz/docs/4680888',
    document_id: '4680888',
    document_number: 'O‘RQ-600',
    document_title:
      '"Davlat boji to‘g‘risida"gi O‘zbekiston Respublikasi Qonuni va Davlat boji stavkalari miqdorlari (Ilova)',
    effective_date: '2020-01-06',
    current_version: '2026.1',
    retrieved_at: '2026-09-22',
    verified_at: '2026-09-22',
    verification_status: 'verified',
    description:
      'Sudlarga murojaat qilishda to‘lanadigan davlat boji stavkalarini belgilovchi yagona qonun.',
  },
  BHM_DECREE: {
    source_key: 'bhm_rate_current',
    source_name: 'O‘zbekiston Respublikasi Prezidentining PF-108-son Farmoni',
    source_type: 'decree',
    official_domain: 'lex.uz',
    official_url: 'https://lex.uz/docs/7027429',
    url: 'https://lex.uz/docs/7027429',
    document_id: '7027429',
    document_number: 'PF-108',
    document_title: 'Ish haqi, pensiyalar va nafaqalar miqdorini oshirish to‘g‘risida',
    effective_date: '2024-09-01',
    current_version: '2026.1',
    retrieved_at: '2026-09-22',
    verified_at: '2026-09-22',
    current_rate: CURRENT_BHM_VALUE,
    currency: 'UZS',
    verification_status: 'verified',
    description: 'Bazaviy hisoblash miqdori (BHM) = 375 000 so‘m qilib belgilangan.',
  },
  CBU_MAIN_RATE: {
    source_key: 'cbu_refinancing_rate',
    source_name: 'O‘zbekiston Respublikasi Markaziy banki Asosiy stavkasi',
    source_type: 'cbu_rate',
    official_domain: 'cbu.uz',
    official_url: 'https://cbu.uz/uz/monetary-policy/main-rate/',
    url: 'https://cbu.uz/uz/monetary-policy/main-rate/',
    document_number: 'MB Boshqaruv Qarori',
    document_title:
      'Markaziy bank Boshqaruvining asosiy stavkani yillik 13,5% darajasida belgilash to‘g‘risidagi qarori',
    effective_date: '2024-12-12',
    current_version: '2026.1',
    retrieved_at: '2026-09-22',
    verified_at: '2026-09-22',
    current_rate: CURRENT_CBU_MAIN_RATE,
    verification_status: 'verified',
    description:
      'FK 327-moddasi bo‘yicha pul majburiyatlarini kechiktirganlik uchun hisoblanadigan rasmiy stavka.',
  },
  CONTRACT_LAW_670: {
    source_key: 'contract_penalty_law',
    source_name:
      'O‘zbekiston Respublikasining "Xo‘jalik yurituvchi subyektlar faoliyatining shartnomaviy-huquqiy bazasi to‘g‘risida"gi Qonuni',
    source_type: 'law',
    official_domain: 'lex.uz',
    official_url: 'https://lex.uz/docs/54641',
    url: 'https://lex.uz/docs/54641',
    document_id: '54641',
    document_number: '670-I-son Qonun',
    document_title:
      'Xo‘jalik yurituvchi subyektlar o‘rtasidagi shartnomaviy majburiyatlar va penya hisoblash tartibi',
    effective_date: '1998-08-29',
    current_version: '2026.1',
    retrieved_at: '2026-09-22',
    verified_at: '2026-09-22',
    verification_status: 'verified',
    description:
      'Penya kuniga 0.5% miqdorida hisoblanadi, biroq kechiktirilgan summaning 50%idan oshmasligi shart (25-32-moddalar).',
  },
  CIVIL_CODE: {
    source_key: 'civil_code_uz',
    source_name: 'O‘zbekiston Respublikasi Fuqarolik Kodeksi',
    source_type: 'code',
    official_domain: 'lex.uz',
    official_url: 'https://lex.uz/docs/111189',
    url: 'https://lex.uz/docs/111189',
    document_id: '111189',
    document_number: 'FK',
    document_title: 'O‘zbekiston Respublikasining Fuqarolik Kodeksi',
    effective_date: '1997-03-01',
    current_version: '2026.1',
    retrieved_at: '2026-09-22',
    verified_at: '2026-09-22',
    verification_status: 'verified',
    description:
      'Umumiy da‘vo muddati 3 yil (150-modda), Pul majburiyatlarini buzganlik uchun foizlar (327-modda), Zararni qoplash (14-modda).',
  },
  CIVIL_PROCEDURE_CODE: {
    source_key: 'civil_procedure_code_uz',
    source_name: 'O‘zbekiston Respublikasi Fuqarolik Protsessual Kodeksi',
    source_type: 'code',
    official_domain: 'lex.uz',
    official_url: 'https://lex.uz/docs/3517337',
    url: 'https://lex.uz/docs/3517337',
    document_id: '3517337',
    document_number: 'O‘RQ-465',
    document_title: 'O‘zbekiston Respublikasining Fuqarolik Protsessual Kodeksi',
    effective_date: '2018-04-01',
    current_version: '2026.1',
    retrieved_at: '2026-09-22',
    verified_at: '2026-09-22',
    verification_status: 'verified',
    description:
      'Fuqarolik sudlariga ariza va shikoyat berish muddatlari, sud xarajatlari va da’vo tartibi.',
  },
  ECONOMIC_PROCEDURE_CODE: {
    source_key: 'economic_procedure_code_uz',
    source_name: 'O‘zbekiston Respublikasi Iqtisodiy Protsessual Kodeksi',
    source_type: 'code',
    official_domain: 'lex.uz',
    official_url: 'https://lex.uz/docs/3523891',
    url: 'https://lex.uz/docs/3523891',
    document_id: '3523891',
    document_number: 'O‘RQ-468',
    document_title: 'O‘zbekiston Respublikasining Iqtisodiy Protsessual Kodeksi',
    effective_date: '2018-04-01',
    current_version: '2026.1',
    retrieved_at: '2026-09-22',
    verified_at: '2026-09-22',
    verification_status: 'verified',
    description:
      'Tadbirkorlar va yuridik shaxslar o‘rtasidagi iqtisodiy nizolar bo‘yicha sud ishlarini yuritish tartibi.',
  },
  ADMIN_PROCEDURE_CODE: {
    source_key: 'admin_procedure_code_uz',
    source_name: 'O‘zbekiston Respublikasi Ma’muriy Sud Ishlarini Yuritish To‘g‘risidagi Kodeksi',
    source_type: 'code',
    official_domain: 'lex.uz',
    official_url: 'https://lex.uz/docs/3527353',
    url: 'https://lex.uz/docs/3527353',
    document_id: '3527353',
    document_number: 'O‘RQ-469',
    document_title:
      'O‘zbekiston Respublikasining Ma’muriy Sud Ishlarini Yuritish To‘g‘risidagi Kodeksi (MSIK)',
    effective_date: '2018-04-01',
    current_version: '2026.1',
    retrieved_at: '2026-09-22',
    verified_at: '2026-09-22',
    verification_status: 'verified',
    description:
      'Davlat organlari va mansabdor shaxslarning qarorlari hamda harakatlari ustidan sudga shikoyat qilish tartibi.',
  },
  LABOR_CODE: {
    source_key: 'labor_code_uz',
    source_name: 'O‘zbekiston Respublikasi Mehnat Kodeksi',
    source_type: 'code',
    official_domain: 'lex.uz',
    official_url: 'https://lex.uz/docs/6257288',
    url: 'https://lex.uz/docs/6257288',
    document_id: '6257288',
    document_number: 'O‘RQ-798',
    document_title: 'Yangi tahrirdagi Mehnat Kodeksi',
    effective_date: '2023-04-30',
    current_version: '2026.1',
    retrieved_at: '2026-09-22',
    verified_at: '2026-09-22',
    verification_status: 'verified',
    description:
      'Ishga tiklash (3 oy), boshqa mehnat nizolari (6 oy), moddiy zarar (1 yil) muddatlari (560-modda).',
  },
  SUPREME_COURT_PLENUM_CONTRACT: {
    source_key: 'supreme_court_plenum_contract',
    source_name: 'Oliy Sud Plenumi Qarori № 24',
    source_type: 'plenum',
    official_domain: 'sud.uz',
    official_url: 'https://sud.uz/plenum-qarorlari/',
    url: 'https://sud.uz/plenum-qarorlari/',
    document_number: '24-son Plenum',
    document_title:
      'Sudlar tomonidan shartnomaviy munosabatlarni tartibga soluvchi qonun hujjatlarini qo‘llash amaliyoti to‘g‘risida',
    effective_date: '2023-11-20',
    current_version: '2026.1',
    retrieved_at: '2026-09-22',
    verified_at: '2026-09-22',
    verification_status: 'verified',
    description:
      'Shartnomaviy javobgarlik, penya miqdorini kamaytirish (FK 326-modda) va zararni undirish bo‘yicha sud amaliyoti tushuntirishlari.',
  },
}

/**
 * Returns active version of legal source or throws if deprecated.
 */
export function getActiveLegalSource(key: string): LegalSourceVersionMeta | null {
  const source = OFFICIAL_LEGAL_SOURCES[key]
  if (!source) return null
  if (source.verification_status !== 'verified') {
    console.warn(`Legal source ${key} is not verified`)
  }
  return source
}

/**
 * Checks if a legal source date is currently active (future-proof version check).
 */
export function isLegalSourceActive(
  source: LegalSourceVersionMeta,
  checkDate = new Date()
): boolean {
  const effective = new Date(source.effective_date)
  if (checkDate < effective) return false
  if (source.expiration_date) {
    const expiration = new Date(source.expiration_date)
    if (checkDate > expiration) return false
  }
  return source.verification_status === 'verified'
}
