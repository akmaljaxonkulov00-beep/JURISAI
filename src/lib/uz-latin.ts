/**
 * uz-latin.ts — O'zbek tilidagi matnni LOTIN alifbosida kafolatlash.
 *
 * AI modellari ba'zan o'zbekcha javobda kirill harflarini aralashtirib
 * yuboradi (ў, қ, ғ, ҳ, ё, ж kabi). Bu yordamchi:
 *  1) matnda kirill belgilari borligini aniqlaydi
 *  2) ularni o'zbek lotin alifbosiga transliteratsiya qiladi
 *
 * Natija: AI javoblari har doim lotin o'zbek tilida bo'ladi.
 */

/** O'zbek kirill alifbosiga xos harflar (asosiy tekshiruv uchun) */
const CYRILLIC_RE = /[А-Яа-яЁёЎўҚқҒғҲҳЖжЦцЩщЪъЫыЬьЭэЮюЯя]/

/** Kirill → Lotin o'zbek alifbosi xaritasi (bitta belgi almashinuvlari) */
const CHAR_MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  ж: 'j',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'x',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sh',
  ъ: 'ʻ',
  ы: 'i',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  ў: 'oʻ',
  қ: 'q',
  ғ: 'gʻ',
  ҳ: 'h',
  е: 'e',
  ё: 'yo',
}

/** Biror kirill belgisi bormi? */
export function containsCyrillic(text: string): boolean {
  return CYRILLIC_RE.test(text)
}

/**
 * Matndagi kirill belgilarini o'zbek lotin alifbosiga o'giradi.
 * 'е' harfi kontekstga qarab 'ye' yoki 'e' bo'ladi:
 *   - so'z boshida yoki unli tovushdan keyin → 'ye' (yelka, tayyor)
 *   - aks holda → 'e' (kel, mehnat)
 */
export function toUzbekLatin(text: string): string {
  let result = ''
  let prev = ''
  for (const ch of text) {
    const lower = ch.toLowerCase()
    const isUpper = ch !== lower
    let mapped: string
    if (lower === 'е' && CHAR_MAP['е']) {
      // Kirill 'е' — kontekstga qarab: so'z boshida yoki unlidan keyin 'ye'
      const isStartOrAfterVowel = !prev || /[aoueiʻʼ']/.test(prev)
      mapped = isStartOrAfterVowel ? 'ye' : 'e'
    } else {
      mapped = CHAR_MAP[lower] !== undefined ? CHAR_MAP[lower] : ch
    }
    // Katta harfni saqlash: 'Ў' → 'Oʻ', 'Е' → 'Ye'
    if (isUpper && mapped !== ch) {
      mapped = mapped.charAt(0).toUpperCase() + mapped.slice(1)
    }
    result += mapped
    prev = lower
  }
  return result
}

/**
 * Matnni lotin o'zbek tilida kafolatlaydi: kirill belgilar bo'lsa
 * transliteratsiya qiladi, bo'lmasa o'zgarmas qaytaradi.
 */
export function ensureUzbekLatin(text: string): string {
  if (!text || !containsCyrillic(text)) return text
  return toUzbekLatin(text)
}
