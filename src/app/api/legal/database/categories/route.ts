import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Try to load from Supabase
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        categories: [],
        total_categories: 0,
        total_documents: 0,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch categories with article counts
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('code_id')

    if (error) throw error

    if (!categories || categories.length === 0) {
      return NextResponse.json({
        success: true,
        categories: [],
        total_categories: 0,
        total_documents: 0,
        message: 'No categories found. Run the SQL migration first.',
      })
    }

    // Sonlar categories.article_count ustunidan olinadi — bu ustun import
    // vaqtida real COUNT bilan yangilangan (to'liq, kesilmagan qiymatlar).

    return NextResponse.json({
      success: true,
      categories: categories.map((cat: any) => ({
        id: cat.code_id,
        name: cat.name,
        slug: cat.code_id,
        description: cat.description || '',
        document_count: cat.article_count || 0,
        code_id: cat.code_id,
      })),
      total_categories: categories.length,
      total_documents: categories.reduce((sum: number, c: any) => sum + (c.article_count || 0), 0),
      last_updated: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Legal categories API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Kategoriyalarni olishda xatolik',
      categories: [],
      total_categories: 0,
      total_documents: 0,
    })
  }
}
