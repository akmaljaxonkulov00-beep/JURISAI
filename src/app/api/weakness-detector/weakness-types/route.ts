import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Mock weakness types data
    const mockWeaknessTypes = [
      {
        id: 'type_1',
        name: 'Mantiqiy xatolik',
        slug: 'logical_fallacy',
        description: 'Argumentda mantiqiy xatoliklar mavjud - sabab va oqibat o\'rtasida to\'g\'ri bog\'lanish yo\'q',
        severity: 'medium',
        examples: [
          'Sababsiz xulosa chiqarish',
          'Noto\'g\'ri umumlashtirish',
          'Yolg\'on dilemma',
          'Shaxsiy hujum (ad hominem)'
        ],
        detection_indicators: [
          'Shu sababli, demak...',
          'Albatta, chunki...',
          'Bu aniq shunday deyman'
        ],
        improvement_suggestions: [
          'Har bir xulosaning oldidan aniq sabablar keltiring',
          'Mantiqiy bog\'lanishlarni tekshiring',
          'Qo\'shimcha dalillar qo\'shing'
        ],
        related_concepts: ['mantiq', 'argumentatsiya', 'xulosa chiqarish'],
        frequency: 0.35
      },
      {
        id: 'type_2',
        name: 'Dalillar yetishmasligi',
        slug: 'insufficient_evidence',
        description: 'Argument uchun yetarli dalillar keltirilmagan',
        severity: 'high',
        examples: [
          'Shaxsiy fikrga tayanish',
          'Hech qanday hujjatsiz da\'vo',
          'Statistika ma\'lumotlari yo\'q',
          'Ekspert fikri yo\'q'
        ],
        detection_indicators: [
          'Menimcha...',
          'Bu aniq shunday',
          'Hammasi shunday deyman',
          'Hech qanday shubha yo\'q'
        ],
        improvement_suggestions: [
          'Qonun hujjatlariga havolalar qo\'shing',
          'Rasmiy statistik ma\'lumotlardan foydalaning',
          'Mustaqil ekspert xulosalarini keltiring',
          'Amaliy misollarni keltiring'
        ],
        related_concepts: ['dalillar', 'isbotlash', 'guvohnama'],
        frequency: 0.42
      },
      {
        id: 'type_3',
        name: 'Hissiy murojaat',
        slug: 'emotional_appeal',
        description: 'Argumentda hissiy murojaat ortiqcha, rasmiy uslub buzilgan',
        severity: 'low',
        examples: [
          'Bu juda adolatsiz',
          'Bu noto\'g\'ri va aqldan ozganlik',
          'Yuragim qonadi',
          'Bu insoniylikka zid'
        ],
        detection_indicators: [
          'Juda adolatsiz',
          'Aqldan ozganlik',
          'Yomonlik',
          'Yuragini sindirish'
        ],
        improvement_suggestions: [
          'Rasmiy uslubni qo\'llang',
          'Hissiy ifodalarni kamaytiring',
          'O\'rniga rasmiy dalillarga e\'tibor bering',
          'Obyektiv baholashni qo\'llang'
        ],
        related_concepts: ['hissiyot', 'obyektivlik', 'rasmiy uslub'],
        frequency: 0.28
      },
      {
        id: 'type_4',
        name: 'Noto\'g\'ri umumlashtirish',
        slug: 'hasty_generalization',
        description: 'Cheklangan misollar asosida keng umumlashtirish',
        severity: 'medium',
        examples: [
          'Barcha... shunday',
          'Hech qachon... emas',
          'Har doim... bo\'ladi',
          'Bu har doim shunday'
        ],
        detection_indicators: [
          'Barcha',
          'Hech qachon',
          'Har doim',
          'Hech kim'
        ],
        improvement_suggestions: [
          'Umumlashtirishni cheklang',
          'Istisnolarni ko\'rsating',
          'Statistik ma\'lumotlardan foydalaning',
          'Qo\'shimcha misollar keltiring'
        ],
        related_concepts: ['umumlashtirish', 'statistika', 'misollar'],
        frequency: 0.31
      },
      {
        id: 'type_5',
        name: 'Tuzilishdagi xatolik',
        slug: 'structural_error',
        description: 'Argument tuzilishi noto\'g\'ri, mantiqiy ketma-ketlik buzilgan',
        severity: 'medium',
        examples: [
          'Kirish qismi yo\'q',
          'Xulosa asosiy argument bilan bog\'lanmagan',
          'Mantiqiy ketma-ketlik yo\'q',
          'Noto\'g\'ri o\'tishlar'
        ],
        detection_indicators: [
          'Boshida hech narsa yo\'q',
          'Xulosa hech qanday bog\'lanishsiz',
          'Biror narsa yetishmayapti',
          'Tushunarsiz o\'tish'
        ],
        improvement_suggestions: [
          'Aniq kirish qismi qo\'shing',
          'Mantiqiy ketma-ketlikni tuzlang',
          'Xulosani asosiy argument bilan bog\'lang',
          'O\'tishlarni yaxshilang'
        ],
        related_concepts: ['tuzilish', 'ketma-ketlik', 'mantiq'],
        frequency: 0.25
      },
      {
        id: 'type_6',
        name: 'Qarama-qarshilik',
        slug: 'contradiction',
        description: 'Argument ichida o\'zaro qarama-qarshi fikrlar mavjud',
        severity: 'high',
        examples: [
          'Bir daftada ikki xil fikr',
          'Xulosa bilan asosiy fikr ziddiyatda',
          'Oldingi gap bilan keyingi gap ziddiyatda',
          'Bir vaqtning o\'zida ikki xil da\'vo'
        ],
        detection_indicators:
        [
          'Biroq...',
          'Lekin...',
          'Ammo...',
          'Bir tomondan... boshqa tomondan...'
        ],
        improvement_suggestions: [
          'Qarama-qarshiliklarni aniqlang',
          'Bir fikrni tanlang',
          'Ziddiyatni hal qiling',
          'Mantiqiy izchillikni ta\'minlang'
        ],
        related_concepts: ['ziddiyat', 'izchillik', 'mantiqiy bog\'lanish'],
        frequency: 0.18
      },
      {
        id: 'type_7',
        name: 'Nisbatan xatolik',
        slug: 'relative_error',
        description: 'Nisbatan to\'g\'ri, lekin mutlaqo to\'g\'ri bo\'lmagan xulosa',
        severity: 'low',
        examples: [
          'Qisman to\'g\'ri, lekin to\'liq emas',
          'Bir jihatdan to\'g\'ri, boshqasidan noto\'g\'ri',
          'Asosiy fikr to\'g\'ri, tafsilotlar xato',
          'Umumiy yo\'nalish to\'g\'ri, ammo detallar xato'
        ],
        detection_indicators: [
          'Asosan to\'g\'ri',
          'Qisman to\'g\'ri',
          'Bir jihatdan',
          'Umuman olganda'
        ],
        improvement_suggestions: [
          'To\'liq to\'g\'rilikni ta\'minlang',
          'Barcha jihatlarini ko\'rib chiqing',
          'Xatolarni tuzating',
          'To\'liq aniqlikni qo\'shing'
        ],
        related_concepts: ['nisbatanlik', 'to\'liqlik', 'aniqlik'],
        frequency: 0.22
      },
      {
        id: 'type_8',
        name: 'Kontekstdan chetga chiqish',
        slug: 'context_drift',
        description: 'Argument asosiy mavzudan chetga chib ketadi',
        severity: 'medium',
        examples: [
          'Asosiy mavzudan chetlangan fikrlar',
          'Keraksiz tafsilotlar',
          'Asosiy masalaga aloqasi yo\'q',
          'Ortiqcha ma\'lumotlar'
        ],
        detection_indicators: [
          'Shuningdek...',
          'Bundan tashqari...',
          'Yana bir narsa...',
          'Kechasi...'
        ],
        improvement_suggestions: [
          'Asosiy mavzuga qayting',
          'Keraksiz tafsilotlarni olib tashlang',
          'Asosiy masalaga e\'tibor qarating',
          'Qisqaroq qiling'
        ],
        related_concepts: ['kontekst', 'mavzu', 'aniqlik'],
        frequency: 0.19
      }
    ];

    return NextResponse.json({
      weakness_types: mockWeaknessTypes,
      total_types: mockWeaknessTypes.length,
      categories: {
        by_severity: {
          high: mockWeaknessTypes.filter(t => t.severity === 'high').length,
          medium: mockWeaknessTypes.filter(t => t.severity === 'medium').length,
          low: mockWeaknessTypes.filter(t => t.severity === 'low').length
        },
        by_frequency: {
          common: mockWeaknessTypes.filter(t => t.frequency >= 0.3).length,
          moderate: mockWeaknessTypes.filter(t => t.frequency >= 0.2 && t.frequency < 0.3).length,
          rare: mockWeaknessTypes.filter(t => t.frequency < 0.2).length
        }
      },
      summary: {
        most_common: mockWeaknessTypes.reduce((prev, current) => (prev.frequency > current.frequency) ? prev : current),
        most_severe: mockWeaknessTypes.filter(t => t.severity === 'high').reduce((prev, current) => (prev.frequency > current.frequency) ? prev : current),
        easiest_to_fix: mockWeaknessTypes.filter(t => t.severity === 'low').reduce((prev, current) => (prev.frequency > current.frequency) ? prev : current)
      },
      usage_tips: [
        'Har bir zaiflik turi uchun aniq misollar va tuzatish usullarini o\'rganing',
        'Zaifliklarni aniqlash uchun muntazam mashq qiling',
        'Turli argument turlarida ko\'proq zaifliklarni topishga harakat qiling',
        'Zaifliklarni oldindan oldini bo\'lish uchun reja tuzing'
      ],
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Weakness types get error:', error);
    return NextResponse.json(
      { error: 'Zaiflik turlarini olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
