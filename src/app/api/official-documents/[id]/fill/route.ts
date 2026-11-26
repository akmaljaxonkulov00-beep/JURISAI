import { NextRequest, NextResponse } from 'next/server'
import {
  getOfficialDocumentById,
  renderOfficialDocumentText,
} from '@/lib/documents/official-documents-data'
import { supabaseServer } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Optional save to Supabase user_filled_documents
    let savedId = null
    try {
      const supabase = supabaseServer
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: savedRecord } = await supabase
          .from('user_filled_documents')
          .insert({
            user_id: user.id,
            official_document_id: doc.id,
            title: `${doc.documentName} - ${new Date().toLocaleDateString('uz-UZ')}`,
            filled_values: values,
            status: 'completed',
          })
          .select('id')
          .single()

        if (savedRecord) {
          savedId = savedRecord.id
        }
      }
    } catch {
      // Non-blocking if offline or guest
    }

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      documentName: doc.documentName,
      renderedText,
      sha256Checksum: contentHash,
      savedId,
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
