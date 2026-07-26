/**
 * CODE_MAPPINGS — O'zbekiston Respublikasi Qonun Kodekslari to'liq nomlari
 * 
 * Qisqartmalar faqat internal key sifatida ishlatiladi.
 * UI da hech qachon JK, FK, FPK kabi qisqartmalar ko'rsatilmaydi.
 * Faqat to'liq nomlar ishlatiladi.
 */

export const CODE_MAPPINGS: Record<string, string> = {
  JK: "Oʻzbekiston Respublikasi Jinoyat Kodeksi",
  FK: "Oʻzbekiston Respublikasi Fuqarolik Kodeksi",
  MK: "Oʻzbekiston Respublikasi Mehnat Kodeksi",
  OK: "Oʻzbekiston Respublikasi Oila Kodeksi",
  SK: "Oʻzbekiston Respublikasi Soliq Kodeksi",
  ZK: "Oʻzbekiston Respublikasi Yer Kodeksi",
  MJK: "Oʻzbekiston Respublikasi Maʼmuriy Javobgarlik Toʻgʻrisidagi Kodeksi",
  FPK: "Oʻzbekiston Respublikasi Fuqarolik Protsessual Kodeksi",
  JPK: "Oʻzbekiston Respublikasi Jinoyat Protsessual Kodeksi",
  IPK: "Oʻzbekiston Respublikasi Iqtisodiy Protsessual Kodeksi",
};

export const CODE_ABBREVIATIONS = Object.keys(CODE_MAPPINGS);

/**
 * Replace code abbreviations in text with full names.
 * Example: "JK 97-modda" → "Oʻzbekiston Respublikasi Jinoyat Kodeksi 97-modda"
 */
export function expandCodeReferences(text: string): string {
  let result = text;
  for (const [abbr, fullName] of Object.entries(CODE_MAPPINGS)) {
    // Replace standalone abbreviations like "JK 97", "FK 342" etc.
    const regex = new RegExp(`\\b${abbr}\\b`, 'g');
    result = result.replace(regex, fullName);
  }
  return result;
}

/**
 * Get full name from abbreviation. Returns the abbreviation if not found.
 */
export function getCodeFullName(abbreviation: string): string {
  return CODE_MAPPINGS[abbreviation] || abbreviation;
}

/**
 * All code IDs mapped to their internal keys
 */
export const CODE_ID_TO_KEY: Record<string, string> = {
  criminal_code: 'JK',
  civil_code: 'FK',
  labor_code: 'MK',
  family_code: 'OK',
  tax_code: 'SK',
  land_code: 'ZK',
  admin_code: 'MJK',
  civil_procedure_code: 'FPK',
  criminal_procedure_code: 'JPK',
  economic_procedure_code: 'IPK',
  constitution: 'KONST',
};

/**
 * Get full display name from code ID
 */
export function getDisplayNameFromCodeId(codeId: string): string {
  const key = CODE_ID_TO_KEY[codeId];
  if (key && CODE_MAPPINGS[key]) {
    return CODE_MAPPINGS[key];
  }
  return codeId;
}
