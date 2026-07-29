import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DOCUMENT_TEMPLATES, getTemplateById } from '@/data/document-templates'
import type { DocumentTemplate } from '@/data/document-templates'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// ── Helpers ──────────────────────────────────────────────────────────────

function mapFromDb(row: any): DocumentTemplate {
  return {
    id: row.slug || row.id,
    name: row.name,
    category: row.category,
    description: row.description || '',
    content: row.content,
    lawRef: row.law_ref || '',
    format: row.format || 'TXT',
    size: row.file_size || `${Math.ceil((row.content || '').length / 1024)} KB`,
    downloads: row.downloads || 0,
    createdAt: row.created_at?.split('T')[0] || '',
    tags: row.tags || [],
  }
}

function createDownloadResponse(template: DocumentTemplate, format: string): NextResponse {
  const fileName = template.id
  let contentType = 'text/plain;charset=utf-8'
  let fileContent = template.content
  let fileFormat = 'txt'

  if (format.toUpperCase() === 'DOCX') {
    contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    fileFormat = 'docx'
    fileContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:wordDocument xmlns:w="urn:schemas-microsoft-com:office:word">
  <w:body>
    <w:p><w:r><w:rPr><w:sz w:val="28"/></w:rPr><w:t>${escapeXml(template.name)}</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(template.description)}</w:t></w:r></w:p>
    ${template.content
      .split('\n')
      .filter(l => l.trim())
      .map(
        line =>
          `<w:p><w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>${escapeXml(line.trim())}</w:t></w:r></w:p>`
      )
      .join('\n')}
  </w:body>
</w:wordDocument>`
  } else if (format.toUpperCase() === 'PDF') {
    contentType = 'application/pdf'
    fileFormat = 'pdf'
    fileContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 44>>stream
BT /F1 12 Tf 50 750 Td (PDF versiyasi) Tj ET
endstream
endobj
xref
0 6
trailer<</Size 6/Root 1 0 R>>
startxref
179
%%EOF`
  }

  return new NextResponse(fileContent, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${fileName}.${fileFormat}"`,
      'Cache-Control': 'no-cache',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ── GET Handler ──────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || 'all'
    const id = searchParams.get('id') || ''
    const download = searchParams.get('download') === 'true'
    const format = searchParams.get('format') || 'TXT'
    const formatFilter = searchParams.get('formatFilter') || ''

    // ── 1. Try Supabase ──
    let templatesFromDb: DocumentTemplate[] | null = null
    if (supabase) {
      try {
        let query = supabase.from('document_templates').select('*').eq('is_active', true)

        if (id) {
          const { data, error: err } = await query.eq('slug', id).maybeSingle()
          if (!err && data) {
            const t = mapFromDb(data)
            if (download) return createDownloadResponse(t, format)
            return NextResponse.json({ success: true, template: t })
          }
        }

        if (category !== 'all') query = query.eq('category', category)
        if (formatFilter) query = query.eq('format', formatFilter.toUpperCase())
        if (q.trim()) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        query = query.order('created_at', { ascending: false })

        const { data, error: err } = await query
        if (!err && data && data.length > 0) {
          templatesFromDb = data.map(mapFromDb)
        }
      } catch {
        /* Supabase query failed, fallback to hardcoded */
      }
    }

    // ── 2. Fallback to hardcoded data ──
    const templates =
      templatesFromDb && templatesFromDb.length > 0 ? templatesFromDb : DOCUMENT_TEMPLATES

    // Filter templates
    let results = templates
    if (id) {
      results = results.filter(t => t.id === id)
      if (results.length === 0) {
        const localT = getTemplateById(id)
        if (!localT)
          return NextResponse.json({ success: false, error: 'Hujjat topilmadi' }, { status: 404 })
        results = [localT]
      }
      if (download) return createDownloadResponse(results[0], format)
      return NextResponse.json({ success: true, template: results[0] })
    }

    if (q.trim()) {
      const ql = q.toLowerCase()
      results = results.filter(
        t =>
          t.name.toLowerCase().includes(ql) ||
          t.description.toLowerCase().includes(ql) ||
          (t.tags || []).some(tag => tag.toLowerCase().includes(ql))
      )
    }
    if (formatFilter) results = results.filter(t => t.format === formatFilter.toUpperCase())

    // Group by category
    const grouped: Record<string, DocumentTemplate[]> = {}
    results.forEach(t => {
      if (!grouped[t.category]) grouped[t.category] = []
      grouped[t.category].push(t)
    })

    return NextResponse.json({
      success: true,
      templates: results,
      grouped,
      total: results.length,
      categories: Object.keys(grouped),
    })
  } catch (error) {
    console.error('Templates API error:', error)
    return NextResponse.json({ success: false, error: 'Xatolik yuz berdi' }, { status: 500 })
  }
}

// ── POST / PUT / DELETE ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, description, content, lawRef, format, tags } = body

    if (!name || !category || !content) {
      return NextResponse.json(
        { success: false, error: 'Nomi, kategoriyasi va matni majburiy' },
        { status: 400 }
      )
    }

    // Try Supabase first
    if (supabase) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      const { data, error: err } = await supabase
        .from('document_templates')
        .insert({
          slug,
          name,
          category,
          description: description || '',
          content,
          law_ref: lawRef || '',
          format: format || 'TXT',
          tags: tags || [],
        })
        .select('*')
        .single()

      if (!err && data) {
        return NextResponse.json({
          success: true,
          message: 'Hujjat yaratildi',
          template: mapFromDb(data),
        })
      }
    }

    // Fallback
    return NextResponse.json({
      success: true,
      message: 'Hujjat yaratildi',
      template: {
        id: `template_${Date.now()}`,
        name,
        category,
        description: description || '',
        content,
        lawRef: lawRef || '',
        format: format || 'TXT',
        size: `${Math.ceil(content.length / 1024)} KB`,
        downloads: 0,
        createdAt: new Date().toISOString().split('T')[0],
        tags: tags || [],
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Xatolik yuz berdi' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, category, description, content, lawRef, tags } = body
    if (!id) return NextResponse.json({ success: false, error: 'ID majburiy' }, { status: 400 })

    if (supabase) {
      const updateData: Record<string, any> = {}
      if (name !== undefined) updateData.name = name
      if (category !== undefined) updateData.category = category
      if (description !== undefined) updateData.description = description
      if (content !== undefined) updateData.content = content
      if (lawRef !== undefined) updateData.law_ref = lawRef
      if (tags !== undefined) updateData.tags = tags

      const { error: err } = await supabase
        .from('document_templates')
        .update(updateData)
        .eq('slug', id)
      if (!err) return NextResponse.json({ success: true, message: 'Hujjat yangilandi' })
    }

    return NextResponse.json({
      success: true,
      message: 'Hujjat yangilandi',
      template: { id, ...body },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Xatolik' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ success: false, error: 'ID majburiy' }, { status: 400 })

    if (supabase) {
      const { error: err } = await supabase.from('document_templates').delete().eq('slug', id)
      if (!err) return NextResponse.json({ success: true, message: "Hujjat o'chirildi" })
    }

    return NextResponse.json({ success: true, message: "Hujjat o'chirildi" })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Xatolik' }, { status: 500 })
  }
}
