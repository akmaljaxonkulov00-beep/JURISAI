import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Mock legal categories
    const mockCategories = [
      {
        id: 'cat_1',
        name: 'Fuqarolik huquqi',
        slug: 'civil',
        description: 'Fuqarolik-huquqiy munosabatlar, shartnomalar, mulk huquqi',
        document_count: 1250,
        subcategories: [
          {
            id: 'subcat_1',
            name: 'Shartnoma huquqi',
            slug: 'contracts',
            document_count: 450
          },
          {
            id: 'subcat_2',
            name: 'Mulk huquqi',
            slug: 'property',
            document_count: 320
          },
          {
            id: 'subcat_3',
            name: 'Meros huquqi',
            slug: 'inheritance',
            document_count: 180
          },
          {
            id: 'subcat_4',
            name: 'Huquqiy shaxslar',
            slug: 'legal_entities',
            document_count: 300
          }
        ]
      },
      {
        id: 'cat_2',
        name: 'Mehnat huquqi',
        slug: 'labor',
        description: 'Mehnat munosabatlari, ish haqi, mehnat xavfsizligi',
        document_count: 890,
        subcategories: [
          {
            id: 'subcat_5',
            name: 'Ish haqi',
            slug: 'wages',
            document_count: 280
          },
          {
            id: 'subcat_6',
            name: 'Ish vaqti',
            slug: 'working_hours',
            document_count: 150
          },
          {
            id: 'subcat_7',
            name: 'Mehnat xavfsizligi',
            slug: 'safety',
            document_count: 220
          },
          {
            id: 'subcat_8',
            name: 'Mehnat munosabatlarini tugatish',
            slug: 'termination',
            document_count: 240
          }
        ]
      },
      {
        id: 'cat_3',
        name: 'Oilaviy huquq',
        slug: 'family',
        description: 'Oilaviy munosabatlar, nikoh, ajralish, vosa huquqi',
        document_count: 650,
        subcategories: [
          {
            id: 'subcat_9',
            name: 'Nikoh',
            slug: 'marriage',
            document_count: 180
          },
          {
            id: 'subcat_10',
            name: 'Ajralish',
            slug: 'divorce',
            document_count: 150
          },
          {
            id: 'subcat_11',
            name: 'Vosa huquqi',
            slug: 'child_rights',
            document_count: 200
          },
          {
            id: 'subcat_12',
            name: 'Aliment',
            slug: 'alimony',
            document_count: 120
          }
        ]
      },
      {
        id: 'cat_4',
        name: 'Jinoyat huquqi',
        slug: 'criminal',
        description: 'Jinoyatlar, jazo choralari, jinoiy protsess',
        document_count: 1120,
        subcategories: [
          {
            id: 'subcat_13',
            name: 'Jinoyat turlari',
            slug: 'crimes',
            document_count: 450
          },
          {
            id: 'subcat_14',
            name: 'Jazo turlari',
            slug: 'punishments',
            document_count: 280
          },
          {
            id: 'subcat_15',
            name: 'Jinoiy protsess',
            slug: 'criminal_procedure',
            document_count: 390
          }
        ]
      },
      {
        id: 'cat_5',
        name: 'Konstitutsion huquq',
        slug: 'constitutional',
        description: 'Konstitutsiya, inson huquqlari, davlat tuzilishi',
        document_count: 340,
        subcategories: [
          {
            id: 'subcat_16',
            name: 'Inson huquqlari',
            slug: 'human_rights',
            document_count: 120
          },
          {
            id: 'subcat_17',
            name: 'Davlat hokimiyati',
            slug: 'state_power',
            document_count: 100
          },
          {
            id: 'subcat_18',
            name: 'Mahalliy hokimiyat',
            slug: 'local_government',
            document_count: 120
          }
        ]
      },
      {
        id: 'cat_6',
        name: 'Yer huquqi',
        slug: 'land',
        description: 'Yer munosabatlari, yer fondidan foydalanish',
        document_count: 480,
        subcategories: [
          {
            id: 'subcat_19',
            name: 'Yer fondidan foydalanish',
            slug: 'land_use',
            document_count: 200
          },
          {
            id: 'subcat_20',
            name: 'Yer mulki',
            slug: 'land_ownership',
            document_count: 180
          },
          {
            id: 'subcat_21',
            name: 'Qishloq xo\'jalik yerlari',
            slug: 'agricultural_land',
            document_count: 100
          }
        ]
      }
    ];

    return NextResponse.json({
      categories: mockCategories,
      total_categories: mockCategories.length,
      total_documents: mockCategories.reduce((sum, cat) => sum + cat.document_count, 0),
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Legal categories get error:', error);
    return NextResponse.json(
      { error: 'Kategoriyalarni olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
