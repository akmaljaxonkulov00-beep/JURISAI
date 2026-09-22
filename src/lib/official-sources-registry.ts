import { OfficialLegalSource } from '@/types/professional-tools'

/**
 * Official Legal Sources Registry for Uzbekistan
 * Provides strictly verified metadata, URLs, and legal bases.
 */

export const CURRENT_BHM_VALUE = 375_000 // 2024-yil 1-sentabrdan kuchga kirgan (PF-108)
export const CURRENT_CBU_MAIN_RATE = 13.5 // Markaziy Bankning amaldagi asosiy stavkasi (%)

export const OFFICIAL_LEGAL_SOURCES: Record<string, OfficialLegalSource> = {
  STATE_FEE_LAW: {
    source_key: 'state_fee_law',
    source_name: 'O‘zbekiston Respublikasining "Davlat boji to‘g‘risida"gi Qonuni',
    source_type: 'law',
    official_domain: 'lex.uz',
    url: 'https://lex.uz/docs/4680888',
    document_number: 'O‘RQ-600',
    document_title:
      '"Davlat boji to‘g‘risida"gi O‘zbekiston Respublikasi Qonuni va Davlat boji stavkalari miqdorlari (Ilova)',
    effective_date: '2020-01-06',
    verification_status: 'verified',
    description:
      'Sudlarga murojaat qilishda to‘lanadigan davlat boji stavkalarini belgilovchi yagona qonun.',
  },
  BHM_DECREE: {
    source_key: 'bhm_rate_current',
    source_name: 'O‘zbekiston Respublikasi Prezidentining PF-108-son Farmoni',
    source_type: 'decree',
    official_domain: 'lex.uz',
    url: 'https://lex.uz/docs/7027429',
    document_number: 'PF-108',
    document_title: 'Ish haqi, pensiyalar va nafaqalar miqdorini oshirish to‘g‘risida',
    effective_date: '2024-09-01',
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
    url: 'https://cbu.uz/uz/monetary-policy/main-rate/',
    document_number: 'MB Qarori',
    document_title:
      'Markaziy bank Boshqaruvining asosiy stavkani yillik 13,5% darajasida belgilash to‘g‘risidagi qarori',
    effective_date: '2024-12-12',
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
    url: 'https://lex.uz/docs/54641',
    document_number: '670-I-son Qonun',
    document_title:
      'Xo‘jalik yurituvchi subyektlar o‘rtasidagi shartnomaviy majburiyatlar va penya hisoblash tartibi',
    effective_date: '1998-08-29',
    verification_status: 'verified',
    description:
      'Penya kuniga 0.5% miqdorida hisoblanadi, biroq kechiktirilgan summaning 50%idan oshmasligi shart (25-32-moddalar).',
  },
  CIVIL_CODE: {
    source_key: 'civil_code_uz',
    source_name: 'O‘zbekiston Respublikasi Fuqarolik Kodeksi',
    source_type: 'code',
    official_domain: 'lex.uz',
    url: 'https://lex.uz/docs/111189',
    document_number: 'FK',
    document_title: 'O‘zbekiston Respublikasining Fuqarolik Kodeksi',
    effective_date: '1997-03-01',
    verification_status: 'verified',
    description:
      'Da‘vo muddati (150-162-moddalar), Boshqa shaxslarning mablag‘laridan foydalanganlik (327-modda).',
  },
  LABOR_CODE: {
    source_key: 'labor_code_uz',
    source_name: 'O‘zbekiston Respublikasi Mehnat Kodeksi',
    source_type: 'code',
    official_domain: 'lex.uz',
    url: 'https://lex.uz/docs/6257288',
    document_number: 'O‘RQ-798',
    document_title: 'Yangi tahrirdagi Mehnat Kodeksi',
    effective_date: '2023-04-30',
    verification_status: 'verified',
    description: 'Mehnat nizolarini sudga taqdim etish muddatlari (560-modda).',
  },
}
