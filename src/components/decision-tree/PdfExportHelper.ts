import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib'
import {
  DecisionCase,
  DecisionNode,
  TreeStatistics,
  PathSimulationMetrics,
} from '@/types/decision-tree'
import { formatCurrencySom } from '@/lib/decision-tree-engine'

/**
 * Sanitize text to safe ASCII characters for standard PDF fonts
 */
function sanitizeText(s: string = ''): string {
  return s
    .replace(/ʻ/g, "'")
    .replace(/[’‘`]/g, "'")
    .replace(/—|–/g, '-')
    .replace(/[^\x20-\x7E]/g, ch => (ch === "'" ? "'" : ' '))
}

export async function generateDecisionTreePdf(
  decisionCase: DecisionCase,
  statistics: TreeStatistics,
  simulation?: PathSimulationMetrics | null
): Promise<Blob> {
  const doc = await PDFDocument.create()
  const pageSize: [number, number] = [595.28, 841.89] // A4 standard
  const margin = 45
  const pageWidth = pageSize[0] - margin * 2

  let page: PDFPage = doc.addPage(pageSize)
  const font: PDFFont = await doc.embedFont(StandardFonts.Helvetica)
  const bold: PDFFont = await doc.embedFont(StandardFonts.HelveticaBold)

  const cDark = rgb(0.12, 0.14, 0.18)
  const cGray = rgb(0.42, 0.45, 0.5)
  const cBlue = rgb(0.15, 0.35, 0.85)
  const cGreen = rgb(0.06, 0.55, 0.32)
  const cRed = rgb(0.85, 0.2, 0.2)

  let y = pageSize[1] - margin

  const ensureSpace = (needed: number) => {
    if (y - needed < margin + 35) {
      page = doc.addPage(pageSize)
      y = pageSize[1] - margin
    }
  }

  const drawTextWrapped = (
    text: string,
    opts: {
      size?: number
      bold?: boolean
      color?: typeof cDark
      indent?: number
      lineSpacing?: number
    } = {}
  ) => {
    const f = opts.bold ? bold : font
    const size = opts.size || 10
    const color = opts.color || cDark
    const indent = opts.indent || 0
    const spacing = opts.lineSpacing || 1.35

    const clean = sanitizeText(text)
    const words = clean.split(/\s+/).filter(Boolean)
    const lines: string[] = []
    let line = ''

    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (f.widthOfTextAtSize(test, size) > pageWidth - indent) {
        if (line) lines.push(line)
        line = w
      } else {
        line = test
      }
    }
    if (line) lines.push(line)

    ensureSpace(lines.length * size * spacing + 4)
    for (const ln of lines) {
      page.drawText(ln, { x: margin + indent, y, size, font: f, color })
      y -= size * spacing
    }
    y -= 3
  }

  // 1. Header Banner
  drawTextWrapped('JURISTIV — QARORLAR DARAXTI HUQUQIY HISOBOTI', {
    size: 16,
    bold: true,
    color: cBlue,
  })
  drawTextWrapped(`Ish: ${decisionCase.name}`, { size: 12, bold: true, color: cDark })
  drawTextWrapped(
    `Soha: ${decisionCase.case_type.toUpperCase()}  |  Rol: ${decisionCase.user_role}  |  Sana: ${new Date().toLocaleDateString(
      'uz-UZ'
    )}`,
    { size: 9, color: cGray }
  )

  y -= 6
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageSize[0] - margin, y },
    thickness: 1,
    color: rgb(0.8, 0.83, 0.88),
  })
  y -= 14

  // 2. Executive Summary & Key Facts
  if (decisionCase.analysis?.case_summary) {
    drawTextWrapped('1. HUQUQIY ISH XULOSASI', { size: 11, bold: true, color: cBlue })
    drawTextWrapped(decisionCase.analysis.case_summary, { size: 9.5, indent: 6 })
    y -= 8
  }

  if (decisionCase.analysis?.key_facts?.length) {
    drawTextWrapped('2. ASOSIY YURIDIK FAKTLAR', { size: 11, bold: true, color: cBlue })
    decisionCase.analysis.key_facts.forEach(f => {
      drawTextWrapped(`• ${f}`, { size: 9, indent: 10 })
    })
    y -= 8
  }

  // 3. Applicable Laws
  if (decisionCase.analysis?.applicable_laws?.length) {
    drawTextWrapped('3. TEGISHLI QONUNCHILIK NORMALARI', { size: 11, bold: true, color: cBlue })
    decisionCase.analysis.applicable_laws.forEach(l => {
      drawTextWrapped(
        `• ${l.code_name || l.code_id}, ${l.article_number}-modda: ${l.title || ''}`,
        {
          size: 9,
          bold: true,
          indent: 10,
        }
      )
      if (l.excerpt) {
        drawTextWrapped(`  "${l.excerpt}"`, { size: 8.5, color: cGray, indent: 18 })
      }
    })
    y -= 8
  }

  // 4. Tree Statistics Overview
  drawTextWrapped('4. STRATEGIK KO‘RSATKICHLAR VA METRIKALAR', {
    size: 11,
    bold: true,
    color: cBlue,
  })
  const statsRows = [
    `Jami variantlar va tugunlar: ${statistics.variants} ta`,
    `Qaror qabul qilish nuqtalari: ${statistics.decisionPoints} ta`,
    `Optimal natijalar: ${statistics.optimalPaths} ta  |  Xavfli natijalar: ${statistics.riskPaths} ta`,
    `AI tahlil ishonchliligi: ${statistics.confidence}%`,
    `Taxminiy umumiy xarajat: ${formatCurrencySom(statistics.totalCost)}`,
    `Kutilayotgan davomiylik: ${statistics.durations.join(' / ') || '1-3 oy'}`,
  ]
  statsRows.forEach(row => {
    drawTextWrapped(`• ${row}`, { size: 9, indent: 10 })
  })
  y -= 8

  // 5. Decision Tree Structure Outline
  drawTextWrapped('5. QARORLAR DARAXTI TUZILMASI', { size: 11, bold: true, color: cBlue })

  function printNode(node: DecisionNode, depth = 0) {
    const metas: string[] = []
    if (node.probability != null) metas.push(`${node.probability}%`)
    if (node.estimated_duration) metas.push(node.estimated_duration)
    if (node.estimated_cost) metas.push(formatCurrencySom(node.estimated_cost))
    if (node.legal_basis) metas.push(node.legal_basis)

    const metaStr = metas.length ? ` [${metas.join(' | ')}]` : ''
    drawTextWrapped(`${'   '.repeat(depth)}• ${node.title} (${node.type})${metaStr}`, {
      size: 8.5,
      indent: 8,
    })

    if (!node.collapsed && node.children) {
      node.children.forEach(c => printNode(c, depth + 1))
    }
  }

  printNode(decisionCase.tree, 0)
  y -= 8

  // 6. Selected Path Simulation (if present)
  if (simulation && simulation.pathNodes.length > 1) {
    drawTextWrapped('6. TANLANGAN STRATEGIK YO‘NALISH TAHLILI (SIMULYATSIYA)', {
      size: 11,
      bold: true,
      color: cGreen,
    })
    drawTextWrapped(`Ketma-ketlik: ${simulation.pathNodes.map(p => p.title).join('  ->  ')}`, {
      size: 9,
      bold: true,
      indent: 8,
    })
    drawTextWrapped(`Umumiy xarajat: ${formatCurrencySom(simulation.totalCost)}`, {
      size: 8.5,
      indent: 12,
    })
    drawTextWrapped(`AI ishonchliligi: ${simulation.overallConfidence}%`, {
      size: 8.5,
      indent: 12,
    })
    if (simulation.recommendedSteps.length) {
      drawTextWrapped('Amaliy qadamlar:', { size: 8.5, bold: true, indent: 12 })
      simulation.recommendedSteps.forEach(s => {
        drawTextWrapped(`- ${s}`, { size: 8, indent: 16 })
      })
    }
    y -= 8
  }

  // 7. Footer & Legal Disclaimer
  y -= 14
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageSize[0] - margin, y },
    thickness: 0.5,
    color: rgb(0.85, 0.87, 0.9),
  })
  y -= 12
  drawTextWrapped(
    'Juristiv — Qarorlar daraxti huquqiy tahlil tizimi. Mazkur hisobot umumiy axborot va strategik rejalashtirish maqsadida taqdim etiladi. U rasmiy advokatlik xulosasi yoki sud natijasining kafolati emas.',
    { size: 7.5, color: cGray }
  )

  const pdfBytes = await doc.save()
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
}
