/**
 * Kodeks nomlarini xaritalash (Mapping) utilitasi
 * 
 * Yagona manba (Single source of truth) — barcha kodeks nomlari
 * faqat shu fayl orqali boshqariladi.
 * 
 * QOIDALAR:
 * 1. Hech qaerda slug (criminal_code) foydalanuvchiga ko'rinmasligi kerak
 * 2. Hech qaerda qisqartma (JK, FK) foydalanuvchiga ko'rinmasligi kerak
 * 3. Faqat to'liq o'zbekcha rasmiy nomlar ishlatiladi
 */

// ── TO'LIQ O'ZBEKCHA NOMLAR ───────────────────────────────────────────────

/** Kodeks slug'idan to'liq o'zbekcha nomga */
export const SLUG_TO_FULL_NAME: Record<string, string> = {
  'criminal_code': 'Oʻzbekiston Respublikasi Jinoyat kodeksi',
  'civil_code': 'Oʻzbekiston Respublikasi Fuqarolik kodeksi',
  'labor_code': 'Oʻzbekiston Respublikasi Mehnat kodeksi',
  'family_code': 'Oʻzbekiston Respublikasi Oila kodeksi',
  'tax_code': 'Oʻzbekiston Respublikasi Soliq kodeksi',
  'land_code': 'Oʻzbekiston Respublikasi Yer kodeksi',
  'admin_code': 'Oʻzbekiston Respublikasi Maʼmuriy javobgarlik toʻgʻrisidagi kodeksi',
  'constitution': 'Oʻzbekiston Respublikasi Konstitutsiyasi',
  'civil_procedure_code': 'Oʻzbekiston Respublikasi Fuqarolik protsessual kodeksi',
  'criminal_procedure_code': 'Oʻzbekiston Respublikasi Jinoyat-protsessual kodeksi',
  'economic_procedure_code': 'Oʻzbekiston Respublikasi Iqtisodiy protsessual kodeksi',
  'jk': 'Oʻzbekiston Respublikasi Jinoyat kodeksi',
  'fk': 'Oʻzbekiston Respublikasi Fuqarolik kodeksi',
  'mk': 'Oʻzbekiston Respublikasi Mehnat kodeksi',
  'ok': 'Oʻzbekiston Respublikasi Oila kodeksi',
  'sk': 'Oʻzbekiston Respublikasi Soliq kodeksi',
  'zk': 'Oʻzbekiston Respublikasi Yer kodeksi',
  'mjk': 'Oʻzbekiston Respublikasi Maʼmuriy javobgarlik toʻgʻrisidagi kodeksi',
  'fpk': 'Oʻzbekiston Respublikasi Fuqarolik protsessual kodeksi',
  'jpk': 'Oʻzbekiston Respublikasi Jinoyat-protsessual kodeksi',
  'ipk': 'Oʻzbekiston Respublikasi Iqtisodiy protsessual kodeksi',
  'konst': 'Oʻzbekiston Respublikasi Konstitutsiyasi',
};

/** Qisqartmadan to'liq o'zbekcha nomga */
export const CODE_MAPPINGS: Record<string, string> = {
  JK: 'Oʻzbekiston Respublikasi Jinoyat kodeksi',
  FK: 'Oʻzbekiston Respublikasi Fuqarolik kodeksi',
  MK: 'Oʻzbekiston Respublikasi Mehnat kodeksi',
  OK: 'Oʻzbekiston Respublikasi Oila kodeksi',
  SK: 'Oʻzbekiston Respublikasi Soliq kodeksi',
  ZK: 'Oʻzbekiston Respublikasi Yer kodeksi',
  MJK: 'Oʻzbekiston Respublikasi Maʼmuriy javobgarlik toʻgʻrisidagi kodeksi',
  FPK: 'Oʻzbekiston Respublikasi Fuqarolik protsessual kodeksi',
  JPK: 'Oʻzbekiston Respublikasi Jinoyat-protsessual kodeksi',
  IPK: 'Oʻzbekiston Respublikasi Iqtisodiy protsessual kodeksi',
  KONST: 'Oʻzbekiston Respublikasi Konstitutsiyasi',
};

/** Slug'dan qisqartmaga */
const SLUG_TO_ABBR: Record<string, string> = {
  'criminal_code': 'JK',
  'civil_code': 'FK',
  'labor_code': 'MK',
  'family_code': 'OK',
  'tax_code': 'SK',
  'land_code': 'ZK',
  'admin_code': 'MJK',
  'constitution': 'KONST',
  'civil_procedure_code': 'FPK',
  'criminal_procedure_code': 'JPK',
  'economic_procedure_code': 'IPK',
};

/**
 * Kodeks ID (slug) bo'yicha to'liq o'zbekcha nomni qaytaradi
 * 
 * @param codeId - Kodeks slug'i (masalan: 'criminal_code', 'JK')
 * @returns To'liq o'zbekcha nom. Agar topilmasa, slug'ni o'zini qaytaradi
 * 
 * @example
 * getDisplayNameFromCodeId('criminal_code')  // "Oʻzbekiston Respublikasi Jinoyat kodeksi"
 * getDisplayNameFromCodeId('JK')             // "Oʻzbekiston Respublikasi Jinoyat kodeksi"
 */
export function getDisplayNameFromCodeId(codeId: string): string {
  if (!codeId) return '';
  
  // 1. To'g'ridan-to'g'ri slug yoki qisqartma bo'yicha qidirish
  if (SLUG_TO_FULL_NAME[codeId.toLowerCase()]) {
    return SLUG_TO_FULL_NAME[codeId.toLowerCase()];
  }
  
  // 2. Slug'dan qisqartma orqali qidirish
  const abbr = SLUG_TO_ABBR[codeId];
  if (abbr && CODE_MAPPINGS[abbr]) {
    return CODE_MAPPINGS[abbr];
  }
  
  // 3. To'g'ridan-to'g'ri qisqartma bo'yicha qidirish
  if (CODE_MAPPINGS[codeId.toUpperCase()]) {
    return CODE_MAPPINGS[codeId.toUpperCase()];
  }
  
  // 4. Hech qanday mapping topilmasa — o'qishli nom yaratish
  // Hech qachon raw slug'ni qaytarmaslik kerak!
  const readable = codeId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  return readable;
}

/**
 * Matndagi barcha kodeks qisqartmalarini to'liq nomlar bilan almashtiradi
 * 
 * @param text - Matn (masalan: "JK 97-moddasi")
 * @returns To'liq nomlar bilan almashtirilgan matn
 * 
 * @example
 * expandCodeReferences("JK 97-moddasi")  // "Oʻzbekiston Respublikasi Jinoyat Kodeksi 97-moddasi"
 */
export function expandCodeReferences(text: string): string {
  let result = text;
  const sorted = Object.keys(CODE_MAPPINGS).sort((a, b) => b.length - a.length);
  for (const abbr of sorted) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'g');
    result = result.replace(regex, CODE_MAPPINGS[abbr]);
  }
  return result;
}

/**
 * Qisqartma bo'yicha to'liq nomni qaytaradi
 * 
 * @deprecated getDisplayNameFromCodeId() bilan almashtirilsin
 */
export function getCodeFullName(codeId: string): string {
  return getDisplayNameFromCodeId(codeId);
}

/**
 * CODE_DISPLAY_NAMES - Komponentlarda ishlatish uchun qulay mapping
 * Bu yerda SLUG_TO_FULL_NAME dan referens olinadi (yagona manba)
 */
export const CODE_DISPLAY_NAMES: Record<string, string> = { ...SLUG_TO_FULL_NAME };
