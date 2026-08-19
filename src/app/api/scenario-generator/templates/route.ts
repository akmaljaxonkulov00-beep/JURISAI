import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/scenario-generator/templates
 * Senariy generator shablonlarini olish (DB dan yoki fallback)
 */
export async function GET() {
  const sb = getSupabaseAdmin()

  try {
    // DB dan shablonlarni olishga urinamiz
    const { data, error } = await sb
      .from('scenario_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data || data.length === 0) {
      // DB da yo'q — default shablonlar
      return NextResponse.json({
        templates: getDefaultTemplates(),
      })
    }

    return NextResponse.json({ templates: data })
  } catch {
    return NextResponse.json({
      templates: getDefaultTemplates(),
    })
  }
}

function getDefaultTemplates() {
  return [
    {
      id: 'tpl-1',
      name: 'Jinoyat tergovi',
      description: "Jinoyat ishi bo'yicha tergov harakatlarini simulyatsiya qiling",
      scenario_type: 'tergov',
      difficulty_level: "o'rta",
      is_active: true,
    },
    {
      id: 'tpl-2',
      name: 'Sud jarayoni',
      description: "Sud majlisini to'liq simulyatsiya qiling — sudya, prokuror, advokat rollari",
      scenario_type: 'sud',
      difficulty_level: 'murakkab',
      is_active: true,
    },
    {
      id: 'tpl-3',
      name: 'Muzokara',
      description: 'Huquqiy nizoni muzokara orqali hal qilishni mashq qiling',
      scenario_type: 'muzokara',
      difficulty_level: "boshlang'ich",
      is_active: true,
    },
    {
      id: 'tpl-4',
      name: "Ishdan bo'shatish nizosi",
      description: "Mehnat huquqi bo'yicha ishdan bo'shatish nizosini hal qiling",
      scenario_type: 'mehnat',
      difficulty_level: "o'rta",
      is_active: true,
    },
    {
      id: 'tpl-5',
      name: 'Ajrashish ishi',
      description: "Oila huquqi bo'yicha ajrashish va mulk taqsimoti ishini ko'rib chiqing",
      scenario_type: 'oila',
      difficulty_level: 'murakkab',
      is_active: true,
    },
  ]
}
