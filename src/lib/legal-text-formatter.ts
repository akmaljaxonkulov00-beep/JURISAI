/**
 * legal-text-formatter.ts
 * AI bergan yuridik matnlarni chiroyli, tartibli va to'g'ri Markdown formatiga keltiradi.
 */

export function cleanAndFormatLegalText(text: string): string {
  if (!text) return ''
  let res = text

  // 1. Agar "1. Matn. 2. Matn." kabi raqamli bandlar bitta satrga yopishtirilgan bo'lsa:
  res = res.replace(/([.?!;])\s+(\d+\.\s+)/g, '$1\n\n$2')

  // 2. Agar "* band; * band" ko'rinishida yopishtirilgan bo'lsa, yangi qatordagi bulletga aylantirish:
  res = res.replace(/([:;.])\s+[*•]\s+/g, '$1\n- ')
  res = res.replace(/;\s+[*•]\s+/g, ';\n- ')

  // 3. Sarlavhalar oldida bo'sh qator tashlash va bo'sh '#' belgilarini tozalash:
  res = res.replace(/^[ \t]*#{1,6}[ \t]*$/gm, '')
  res = res.replace(/([^\n])(#{1,4}\s+)/g, '$1\n\n$2')

  // 4. Konstitutsiyaviy va rasmiy davlat atamalarini kafolatlash:
  res = res.replace(/\bSenatus\b/gi, 'Senat')
  res = res.replace(/\bQonun chiqarish palatasi\b/gi, 'Qonunchilik palatasi')
  res = res.replace(/\bOliy Sovet\b/gi, 'Oliy Kengash')
  res = res.replace(/\b[Qq]uvvat manbai\b/g, 'davlat hokimiyatining birdan-bir manbai')
  res = res.replace(/14\s+bo[‘']?limdan?\s+va\s+150\s+moddadan?/gi, '6 ta bo‘lim, 27 ta bob va 155 ta moddadan')

  // 5. Ortiqcha uch yoki undan ortiq bo'sh qatorlarni ikkitaga keltirish:
  res = res.replace(/\n{3,}/g, '\n\n')

  return res.trim()
}
