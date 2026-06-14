import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID talab qilinadi' },
        { status: 400 }
      );
    }

    // Mock document details
    const mockDocument = {
      id: id,
      title: 'O\'zbekiston Respublikasi Fuqarolik kodeksi',
      type: 'code',
      category: 'civil',
      content: `O\'zbekiston Respublikasi Fuqarolik kodeksi

BO'LIM 1. UMUMIY QOIDALAR

1-modda. Fuqarolik qonunchiligi
O\'zbekiston Respublikasida fuqarolik qonunchiligiga fuqarolik-huquqiy munosabatlarni tartibga soluvchi qonun hujjatlari, shu jumladan, ushbu Kodeks, fuqarolik huquqlari va erkinliklarining asosini tashkil etuvchi O\'zbekiston Respublikasi Konstitutsiyasi, shuningdek, O\'zbekiston Respublikasining xalqaro shartnomalari kiradi.

2-modda. Fuqarolik-huquqiy munosabatlarning asoslari
Fuqarolik-huquqiy munosabatlar asoslari fuqarolik qonunchiligida nazarda tutilgan hollarda, shuningdek, fuqarolik huquqlari va erkinliklarining buzilishi oqibatida kelib chiqqan holatlarda yuzaga keladi.

3-modda. Fuqarolik-huquqiy munosabatlarning turlari
Fuqarolik-huquqiy munosabatlar shartnoma asosida yoki boshqa asoslarda vujudga kelishi mumkin.

BO'LIM 2. SHARTNOMALAR

350-modda. Shartnomaning bajarilishi
Shartnoma tomonlari o\'z majburiyatlarini qonun hujjatlarida belgilangan tartibda bajarishlari shart.

357-modda. Shartnomani bekor qilish asoslari
Shartnoma qonunda nazarda tutilgan hollarda, shuningdek, tomonlarning o\'zaro kelishuviga ko\'ra bekor qilinishi mumkin.

367-modda. Majburiyatni noto\'g\'ri bajarish oqibatida yetkazilgan zararning qoplanishi
Majburiyatni noto\'g\'ri bajarish oqibatida yetkazilgan zarar to\'liq qoplanishi shart. Zararni qoplashning miqdori va tartibi qonun hujjatlarida belgilanadi.`,
      url: 'https://lex.uz/acts/-/text/1492387',
      publication_date: '1996-12-25T00:00:00Z',
      effective_date: '1997-03-01T00:00:00Z',
      last_updated: '2023-12-15T00:00:00Z',
      language: 'uz',
      pages: 245,
      articles_count: 768,
      tags: ['fuqarolik', 'shartnoma', 'majburiyat', 'zarar'],
      related_documents: [
        {
          id: 'doc_2',
          title: 'O\'zbekiston Respublikasi Mehnat kodeksi',
          relation_type: 'related'
        },
        {
          id: 'doc_3',
          title: 'O\'zbekiston Respublikasi Oilaviy kodeksi',
          relation_type: 'related'
        }
      ],
      sections: [
        {
          id: 'section_1',
          title: 'Umumiy qoidalar',
          articles_range: '1-11',
          description: 'Fuqarolik qonunchiligining asosiy tamoyillari'
        },
        {
          id: 'section_2',
          title: 'Shartnomalar',
          articles_range: '350-453',
          description: 'Shartnomalar tuzilishi va bajarilishi qoidalari'
        },
        {
          id: 'section_3',
          title: 'Majburiyatlar',
          articles_range: '454-653',
          description: 'Majburiyatlar turlari va bajarilishi'
        }
      ],
      popularity_score: 95,
      view_count: 15420,
      download_count: 3280,
      bookmark_count: 892,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    return NextResponse.json(mockDocument);

  } catch (error) {
    console.error('Legal document get error:', error);
    return NextResponse.json(
      { error: 'Qonun hujjatini olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
