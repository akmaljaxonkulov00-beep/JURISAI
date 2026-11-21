import { NextRequest, NextResponse } from 'next/server'
import {
  getOfficialDocumentById,
  OFFICIAL_DOCUMENTS_REGISTRY,
} from '@/lib/documents/official-documents-data'
import { supabaseServer } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Hujjat identifikatori kiritilmadi' },
        { status: 400 }
      )
    }

    // Try finding in database
    try {
      const supabase = supabaseServer
      const { data, error } = await supabase
        .from('official_legal_documents')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (!error && data) {
        return NextResponse.json({
          success: true,
          document: data,
        })
      }
    } catch {
      // Fallback to static registry
    }

    const doc = getOfficialDocumentById(id)
    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Rasmiy hujjat topilmadi' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      document: doc,
    })
  } catch (err: any) {
    console.error('Error fetching document:', err)
    return NextResponse.json(
      { success: false, error: 'Hujjat ma’lumotlarini olishda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
