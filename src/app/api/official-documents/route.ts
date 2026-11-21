import { NextRequest, NextResponse } from 'next/server'
import {
  OFFICIAL_DOCUMENTS_REGISTRY,
  getOfficialDocuments,
  OfficialLegalDocument,
} from '@/lib/documents/official-documents-data'
import { supabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const query = searchParams.get('q') || undefined

    // First check database if official_legal_documents table exists and has rows
    try {
      const supabase = supabaseServer
      let dbQuery = supabase
        .from('official_legal_documents')
        .select('*')
        .eq('verification_status', 'VERIFIED_OFFICIAL')
        .order('download_count', { ascending: false })

      if (category && category !== 'all') {
        dbQuery = dbQuery.eq('category', category)
      }
      if (query) {
        dbQuery = dbQuery.ilike('document_name', `%${query}%`)
      }

      const { data, error } = await dbQuery
      if (!error && data && data.length > 0) {
        return NextResponse.json({
          success: true,
          documents: data,
          total: data.length,
          source: 'database',
        })
      }
    } catch {
      // Fallback to static verified registry
    }

    const filtered = getOfficialDocuments(category, query)

    return NextResponse.json({
      success: true,
      documents: filtered,
      total: filtered.length,
      source: 'verified_registry',
    })
  } catch (err: any) {
    console.error('Error fetching official documents:', err)
    return NextResponse.json(
      { success: false, error: 'Hujjatlar ro‘yxatini yuklashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
