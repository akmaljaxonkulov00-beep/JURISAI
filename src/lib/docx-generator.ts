import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Header,
  Footer,
  convertMillimetersToTwip,
} from 'docx'

export interface LegalDocxOptions {
  title: string
  content: string
  subtitle?: string
  legalBasis?: string
  isCourtDocument?: boolean
  isEducationalSample?: boolean
}

const COURT_TITLE_RE =
  /^(DA[‘'ʼ`]VO\s+ARIZA|SUD\s+BUYRUG[‘'ʼ`]I|TURAR\s+JOY|QARZ\s+SHARTNOMASI|ILTIMOSNOMA|SHIKOYAT|APELLYATSIYA|KASSATSIYA|KO[‘'ʼ`]CHMAS\s+MULK|NOTARIAL|E[‘'ʼ`]TIROZ|ADVOKAT\s+SO[‘'ʼ`]ROVI|ARIZA)/i

/**
 * Generates a genuine OOXML Microsoft Word (.docx) Blob using the `docx` library,
 * supporting full Unicode Uzbek Latin characters and standard Uzbekistan court formatting.
 */
export async function generateLegalDocxBytes(options: LegalDocxOptions): Promise<Uint8Array> {
  const { title, content, subtitle, legalBasis, isCourtDocument = true, isEducationalSample = false } = options
  const lines = (content || '').split('\n')
  const children: Paragraph[] = []

  if (!isCourtDocument) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 28,
            font: 'Times New Roman',
          }),
        ],
      })
    )
    if (subtitle) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: subtitle,
              italics: true,
              size: 22,
              font: 'Times New Roman',
            }),
          ],
        })
      )
    }
  }

  let inHeader = isCourtDocument

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()
    if (!trimmed) {
      children.push(new Paragraph({ spacing: { after: 80 }, children: [] }))
      continue
    }

    if (isCourtDocument && COURT_TITLE_RE.test(trimmed)) {
      inHeader = false
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 80 },
          children: [
            new TextRun({
              text: trimmed,
              bold: true,
              size: 28,
              font: 'Times New Roman',
            }),
          ],
        })
      )
      continue
    }

    if (isCourtDocument && trimmed.startsWith('(') && trimmed.endsWith(')')) {
      inHeader = false
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: trimmed,
              size: 24,
              font: 'Times New Roman',
            }),
          ],
        })
      )
      continue
    }

    if (inHeader) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: convertMillimetersToTwip(75) },
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: trimmed,
              size: 24,
              font: 'Times New Roman',
            }),
          ],
        })
      )
      continue
    }

    const isBoldHeading =
      /^(So[‘'ʼ`]rayman|SO[‘'ʼ`]RAYMAN|ILTIMOS\s+QILAMAN|Ilova)/i.test(trimmed)
    const isSignature = /^(Da[‘'ʼ`]vogar:|Arizachi:|Javobgar:|Shartnoma\s+tomonlari)/i.test(trimmed)

    children.push(
      new Paragraph({
        alignment: isSignature || isBoldHeading ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
        indent: isSignature || isBoldHeading ? undefined : { firstLine: convertMillimetersToTwip(12.5) },
        spacing: {
          before: isSignature ? 300 : isBoldHeading ? 160 : 0,
          after: 120,
          line: 276,
        },
        children: [
          new TextRun({
            text: trimmed,
            bold: isBoldHeading || isSignature,
            size: 24,
            font: 'Times New Roman',
          }),
        ],
      })
    )
  }

  if (legalBasis) {
    children.push(
      new Paragraph({
        spacing: { before: 240, after: 80 },
        children: [
          new TextRun({
            text: `Huquqiy asoslar: ${legalBasis}`,
            italics: true,
            size: 20,
            color: '444444',
            font: 'Times New Roman',
          }),
        ],
      })
    )
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertMillimetersToTwip(20),
              bottom: convertMillimetersToTwip(20),
              left: convertMillimetersToTwip(25),
              right: convertMillimetersToTwip(15),
            },
          },
        },
        headers: isEducationalSample
          ? {
              default: new Header({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: "JURISTIV — O'quv namunasi (Rasmiy hujjat emas)",
                        size: 16,
                        color: '666666',
                        font: 'Times New Roman',
                      }),
                    ],
                  }),
                ],
              }),
            }
          : undefined,
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'JURISTIV LegalTech Platform — www.juristiv.uz',
                    size: 16,
                    color: '888888',
                    font: 'Times New Roman',
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  })

  const buf = await Packer.toBuffer(doc)
  return new Uint8Array(buf)
}

export async function generateLegalDocx(options: LegalDocxOptions): Promise<Blob> {
  const bytes = await generateLegalDocxBytes(options)
  return new Blob([bytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

export function downloadDocxBlob(blob: Blob, filename: string) {
  const safeName = filename.endsWith('.docx') ? filename : `${filename}.docx`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = safeName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
