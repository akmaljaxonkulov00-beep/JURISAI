import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export interface LegalPdfOptions {
  title: string
  subtitle?: string
  content: string
  date?: string
  author?: string
  legalBasis?: string
  metadata?: Record<string, string>
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
      // Common Uzbek Latin characters fallback
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

export async function generateLegalPdf(options: LegalPdfOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const helvetica = await doc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const pageWidth = 595.28 // A4 width
  const pageHeight = 841.89 // A4 height
  const margin = 50
  const contentWidth = pageWidth - margin * 2

  let page = doc.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  // ── Header (JURISTIV Legal Document) ──
  page.drawRectangle({
    x: margin,
    y: y - 5,
    width: contentWidth,
    height: 3,
    color: rgb(0.12, 0.44, 0.95), // #1e70f5
  })

  page.drawText('JURISTIV — HUQUQIY AXBOROT VA HUJJATLAR TIZIMI', {
    x: margin,
    y: y + 5,
    size: 9,
    font: helveticaBold,
    color: rgb(0.3, 0.3, 0.3),
  })

  y -= 35

  // ── Document Title ──
  const sanitizedTitle = sanitizeTextForPdf(options.title)
  const titleLines = wrapText(sanitizedTitle, contentWidth, 16, helveticaBold)
  for (const line of titleLines) {
    page.drawText(line, {
      x: margin,
      y,
      size: 16,
      font: helveticaBold,
      color: rgb(0.08, 0.12, 0.2),
    })
    y -= 22
  }

  // ── Subtitle / Metadata ──
  if (options.subtitle) {
    const sub = sanitizeTextForPdf(options.subtitle)
    page.drawText(sub, {
      x: margin,
      y,
      size: 11,
      font: helvetica,
      color: rgb(0.4, 0.45, 0.5),
    })
    y -= 18
  }

  // Date and legal basis
  const dateStr = options.date || new Date().toLocaleDateString('uz-UZ')
  page.drawText(`Sana: ${dateStr}`, {
    x: margin,
    y,
    size: 10,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  })
  y -= 25

  // Divider
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 0.5,
    color: rgb(0.8, 0.82, 0.85),
  })
  y -= 25

  // ── Content ──
  const sanitizedContent = sanitizeTextForPdf(options.content)
  const contentLines = wrapText(sanitizedContent, contentWidth, 10.5, helvetica)

  const lineHeight = 16

  for (const line of contentLines) {
    if (y < margin + 40) {
      // Add new page
      page = doc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin

      // Header on subsequent pages
      page.drawText(`JURISTIV — ${sanitizedTitle.slice(0, 40)}`, {
        x: margin,
        y: y + 10,
        size: 8,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
      })
      page.drawLine({
        start: { x: margin, y: y + 5 },
        end: { x: pageWidth - margin, y: y + 5 },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85),
      })
      y -= 20
    }

    if (line === '') {
      y -= lineHeight * 0.8
      continue
    }

    // Check if line looks like a header (e.g. ## or uppercase or colon)
    const isSectionHeader =
      line.startsWith('##') || line.endsWith(':') || line.match(/^[0-9]+\.\s+[A-Z]/)
    const displayLine = line.replace(/^##\s*/, '')

    if (isSectionHeader) {
      y -= 4
      page.drawText(displayLine, {
        x: margin,
        y,
        size: 11.5,
        font: helveticaBold,
        color: rgb(0.1, 0.2, 0.45),
      })
      y -= lineHeight + 2
    } else {
      page.drawText(displayLine, {
        x: margin,
        y,
        size: 10.5,
        font: helvetica,
        color: rgb(0.15, 0.15, 0.15),
      })
      y -= lineHeight
    }
  }

  // ── Footer / Signature section ──
  if (y < margin + 80) {
    page = doc.addPage([pageWidth, pageHeight])
    y = pageHeight - margin - 40
  } else {
    y -= 30
  }

  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 0.5,
    color: rgb(0.8, 0.82, 0.85),
  })
  y -= 20

  page.drawText('Hujjat JURISTIV platformasi orqali shakllantirildi (www.juristiv.uz)', {
    x: margin,
    y,
    size: 8,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  })

  return await doc.save()
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
