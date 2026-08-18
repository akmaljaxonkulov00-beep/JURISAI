import { describe, it, expect } from 'vitest'
import { containsCyrillic, toUzbekLatin, ensureUzbekLatin } from '@/lib/uz-latin'

describe('containsCyrillic', () => {
  it('aniqlaydi: kirill harfli matn', () => {
    expect(containsCyrillic('ўқитувчи')).toBe(true)
    expect(containsCyrillic('ҳимоя қилади')).toBe(true)
    expect(containsCyrillic('Ассалому алайкум')).toBe(true)
  })

  it('aniqlamaydi: lotin matn', () => {
    expect(containsCyrillic("o'qituvchi himoya qiladi")).toBe(false)
    expect(containsCyrillic('Salom dunyo')).toBe(false)
    expect(containsCyrillic('')).toBe(false)
  })
})

describe('toUzbekLatin', () => {
  it('o\'zbek kirill harflarini lotinga o\'giradi', () => {
    expect(toUzbekLatin('ўқитувчи')).toBe("oʻqituvchi")
    expect(toUzbekLatin('ҳимоя')).toBe('himoya')
    expect(toUzbekLatin('қўлланилади')).toBe("qoʻllaniladi")
  })

  it("'ye' kontekstini to'g'ri ishlaydi", () => {
    expect(toUzbekLatin('елка')).toBe('yelka')
    expect(toUzbekLatin('тайёр')).toBe('tayyor')
  })

  it('aralash matnni tozalaydi', () => {
    const mixed = 'Ўзбекистон ҳуқуқ тизими'
    const result = toUzbekLatin(mixed)
    expect(result).toBe("Oʻzbekiston huquq tizimi")
    expect(containsCyrillic(result)).toBe(false)
  })

  it('yu, ya, yo birikmalarini to\'g\'ri o\'giradi', () => {
    expect(toUzbekLatin('юрист')).toBe('yurist')
    expect(toUzbekLatin('якка')).toBe('yakka')
    expect(toUzbekLatin('ёшлар')).toBe('yoshlar')
  })
})

describe('ensureUzbekLatin', () => {
  it('kirill bo\'lsa transliteratsiya qiladi', () => {
    const input = "Javob: ҳа, бу тўғри"
    const result = ensureUzbekLatin(input)
    expect(containsCyrillic(result)).toBe(false)
    expect(result).toContain('ha')
    expect(result).toContain('toʻgʻri')
  })

  it('lotin matnni o\'zgartirmasdan qaytaradi', () => {
    const latin = "O'zbekiston Respublikasi Jinoyat kodeksi"
    expect(ensureUzbekLatin(latin)).toBe(latin)
  })

  it('bo\'sh matnni xavfsiz qaytaradi', () => {
    expect(ensureUzbekLatin('')).toBe('')
    expect(ensureUzbekLatin(null as unknown as string)).toBe(null as unknown as string)
  })
})
