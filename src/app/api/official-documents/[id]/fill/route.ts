import { NextRequest, NextResponse } from 'next/server'
import {
  getOfficialDocumentById,
  renderOfficialDocumentText,
} from '@/lib/documents/official-documents-data'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import crypto from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const values: Record<string, string> = body.values || {}

    const doc = getOfficialDocumentById(id)
    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Hujjat namunasi topilmadi' },
        { status: 404 }
      )
    }

    // Validate required fields
    const missingFields: string[] = []
    for (const field of doc.fields) {
      if (field.required && (!values[field.name] || values[field.name].trim() === '')) {
        missingFields.push(field.label)
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Quyidagi majburiy maydonlar to‘ldirilmadi: ${missingFields.join(', ')}`,
          missingFields,
        },
        { status: 400 }
      )
    }

    // Render formatted document text
    const renderedText = renderOfficialDocumentText(doc, values)
    const contentHash = crypto.createHash('sha256').update(renderedText).digest('hex')

    // Persist to authenticated user's Supabase records
    let savedId: string | null = null
    let persistenceWarning: string | null = null
    try {
      const admin = getSupabaseAdmin()
      const title = `${doc.documentName} - ${new Date().toLocaleDateString('uz-UZ')}`

      // Look up official_legal_documents UUID by filename if seeded
      const { data: dbDoc } = await admin
        .from('official_legal_documents')
        .select('id')
        .eq('original_filename', doc.originalFilename)
        .maybeSingle()

      if (dbDoc?.id) {
        const { data: savedRecord, error: fillErr } = await admin
          .from('user_filled_documents')
          .insert({
            user_id: auth.user.id,
            document_id: dbDoc.id,
            title,
            filled_data: values,
            status: 'completed',
          })
          .select('id')
          .single()

        if (fillErr) {
          persistenceWarning = fillErr.message
        } else if (savedRecord?.id) {
          savedId = savedRecord.id
        }
      } else {
        // Fallback to generated_documents using its exact schema (document_data + generated_content)
        const { data: genRecord, error: genErr } = await admin
          .from('generated_documents')
          .insert({
            user_id: auth.user.id,
            template_id: doc.id,
            document_data: {
              title,
              status: 'completed',
              form_data: values,
              official_source: doc.officialSourceName,
            },
            generated_content: renderedText,
            output_format: 'pdf',
            language: 'uz',
          })
          .select('id')
          .single()

        if (genErr) {
          persistenceWarning = genErr.message
        } else if (genRecord?.id) {
          savedId = genRecord.id
        }
      }
    } catch (saveErr: any) {
      persistenceWarning = saveErr?.message || 'Hujjatni bazaga saqlashda xatolik'
      console.warn('[official-documents/fill] Persist warning:', saveErr)
    }

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      documentName: doc.documentName,
      renderedText,
      sha256Checksum: contentHash,
      savedId,
      ...(persistenceWarning ? { persistenceWarning } : {}),
      officialSource: {
        name: doc.officialSourceName,
        url: doc.officialSourceUrl,
        authority: doc.issuingAuthority,
        version: doc.versionNumber,
        status: doc.verificationStatus,
      },
      legalBasis: doc.legalBasis,
    })
  } catch (err: any) {
    console.error('Error filling document:', err)
    return NextResponse.json(
      { success: false, error: 'Hujjatni shakllantirishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
