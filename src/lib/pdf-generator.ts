import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export interface LegalPdfOptions {
  title: string
  subtitle?: string
  content: string
  date?: string
  author?: string
  legalBasis?: string
  metadata?: Record<string, string>
  isCourtDocument?: boolean
}

/**
 * Uzbek Latin matnlarni PDF-lib StandardFonts (WinAnsi / ASCII) ga xavfsiz moslaydi
 */
function sanitizeTextForPdf(text: string): string {
  if (!text) return ''
  return text
    .replace(/[ʻʼ'`’]/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x00-\x7F]/g, char => {
      const map: Record<string, string> = {
        ў: "o'",
        Ў: "O'",
        ғ: "g'",
        Ғ: "G'",
        қ: 'q',
        Қ: 'Q',
        ҳ: 'h',
        Ҳ: 'H',
        ё: 'yo',
        Ё: 'Yo',
        ю: 'yu',
        Ю: 'Yu',
        я: 'ya',
        Я: 'Ya',
        ч: 'ch',
        Ч: 'Ch',
        ш: 'sh',
        Ш: 'Sh',
      }
      return map[char] || ''
    })
}

/**
 * Matnni berilgan eni (max width) bo'yicha qatorlarga bo'ladi
 */
function wrapText(text: string, maxWidth: number, fontSize: number, font: any): string[] {
  const lines: string[] = []
  const paragraphs = text.split('\n')

  for (const para of paragraphs) {
    if (para.trim().length === 0) {
      lines.push('')
      continue
    }

    const words = para.split(' ')
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const width = font.widthOfTextAtSize(testLine, fontSize)

      if (width <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    }

    if (currentLine) lines.push(currentLine)
  }

  return lines
}

/**
 * Haqiqiy sud hujjati (A4, Times New Roman, o'ngga surilgan rekvizitlar, markazlashgan sarlavha, toza qora matn)
 */
async function generateCourtDocumentPdf(content: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const times = await doc.embedFont(StandardFonts.TimesRoman)
  const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold)

  const pageWidth = 595.28 // A4
  const pageHeight = 841.89
  const leftMargin = 56.7 // 20mm
  const rightMargin = 42.5 // 15mm
  const topMargin = 56.7
  const bottomMargin = 56.7
  const contentWidth = pageWidth - leftMargin - rightMargin

  let page = doc.addPage([pageWidth, pageHeight])
  let y = pageHeight - topMargin

  const sanitized = sanitizeTextForPdf(content)
  const rawParagraphs = sanitized.split('\n')

  let isInHeaderBlock = true
  const fontSize = 12
  const lineHeight = 16

  for (let i = 0; i < rawParagraphs.length; i++) {
    const p = rawParagraphs[i].trim()

    // Sarlavha aniqlash: DA'VO ARIZA, ARIZA, SHIKOYAT, SHARTNOMA, ILTIMOSNOMA
    const isMainTitle =
      p.match(/^DA['']?VO\s+ARIZA/i) ||
      p.match(/^SUD\s+BUYRUG['']?I/i) ||
      p.match(/^TURAR\s+JOY/i) ||
      p.match(/^QARZ\s+SHARTNOMASI/i) ||
      p.match(/^ILTIMOSNOMA/i) ||
      p.match(/^SHIKOYAT/i) ||
      p.match(/^KO['']?CHMAS\s+MULK/i) ||
      p.match(/^NOTARIAL/i)
    const isSubTitle = p.startsWith('(') && p.endsWith(')')

    if (isMainTitle || isSubTitle) {
      isInHeaderBlock = false
    }

    if (p === '') {
      y -= lineHeight * 0.7
      continue
    }

    // Sahifa tugashini tekshirish
    if (y < bottomMargin + lineHeight * 2) {
      page = doc.addPage([pageWidth, pageHeight])
      y = pageHeight - topMargin
    }

    if (isInHeaderBlock) {
      // Sud rekvizitlari va "shapka" qismi — o'ng tomonda joylashadi (A4 ning o'ng 52% qismida)
      const headerX = leftMargin + contentWidth * 0.46
      const headerMaxWidth = contentWidth * 0.54
      const wrapped = wrapText(p, headerMaxWidth, fontSize, times)

      for (const line of wrapped) {
        if (y < bottomMargin + lineHeight) {
          page = doc.addPage([pageWidth, pageHeight])
          y = pageHeight - topMargin
        }
        const isBold = line.startsWith('Fuqarolik') || line.startsWith('Da‘vogar:') || line.startsWith("Da'vogar:") || line.startsWith('Javobgar:') || line.startsWith('Da‘vo mazmuni:') || line.startsWith("Da'vo mazmuni:")
        page.drawText(line, {
          x: headerX,
          y,
          size: fontSize,
          font: isBold ? timesBold : times,
          color: rgb(0, 0, 0),
        })
        y -= lineHeight
      }
    } else if (isMainTitle || isSubTitle) {
      // Markazlashgan sarlavha
      y -= 8
      const font = timesBold
      const size = isMainTitle ? 14 : 12
      const textWidth = font.widthOfTextAtSize(p, size)
      const centerX = leftMargin + Math.max(0, (contentWidth - textWidth) / 2)

      page.drawText(p, {
        x: centerX,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
      })
      y -= lineHeight + (isMainTitle ? 6 : 14)
    } else {
      // Asosiy matn (paragraflar)
      const isBoldSection =
        p === 'So‘rayman:' ||
        p === "So'rayman:" ||
        p === 'SO‘RAYMAN:' ||
        p === "SO'RAYMAN:" ||
        p === 'ILTIMOS QILAMAN:' ||
        p.startsWith('Ilova') ||
        p.startsWith('1.') ||
        p.startsWith('2.') ||
        p.startsWith('3.')

      const isSignatureLine = p.startsWith('Da‘vogar:') || p.startsWith("Da'vogar:") || p.startsWith('Arizachi:') || p.startsWith('Sotuvchi:') || p.startsWith('Ijaraga beruvchi:')

      const wrapped = wrapText(p, contentWidth, fontSize, times)

      for (let j = 0; j < wrapped.length; j++) {
        const line = wrapped[j]
        if (y < bottomMargin + lineHeight) {
          page = doc.addPage([pageWidth, pageHeight])
          y = pageHeight - topMargin
        }

        // Birinchi qator uchun xatboshi (indent)
        const lineX = (j === 0 && !isBoldSection && !isSignatureLine && !line.match(/^[0-9]+\./))
          ? leftMargin + 25
          : leftMargin

        page.drawText(line, {
          x: lineX,
          y,
          size: fontSize,
          font: (isBoldSection && j === 0) ? timesBold : times,
          color: rgb(0, 0, 0),
        })
        y -= lineHeight
      }
      y -= 4 // Paragraf oralig'i
    }
  }

  return await doc.save()
}

export async function generateLegalPdf(options: LegalPdfOptions): Promise<Uint8Array> {
  // Haqiqiy sud va rasmiy blanklar standarti: Times New Roman, o'ngga surilgan rekvizitlar, sof A4 sud hujjati
  return await generateCourtDocumentPdf(options.content)
}

export function downloadPdfBlob(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as any], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
