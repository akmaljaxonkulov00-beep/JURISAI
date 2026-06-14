import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { caseText } = await request.json();

    if (!caseText || caseText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Holat matni kamida 50 ta belgidan iborat bo\'lishi kerak' },
        { status: 400 }
      );
    }

    // Mock IRAC analysis
    const analysis = await analyzeCaseWithAI(caseText);

    // Track usage
    await trackUsage('irac_analysis', { caseLength: caseText.length, confidence: analysis.confidence });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('IRAC analysis error:', error);
    return NextResponse.json(
      { error: 'Tahlil qilishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

async function analyzeCaseWithAI(caseText: string) {
  // Mock IRAC analysis based on case content
  const analyses = [
    {
      issue: "Berilgan holatda fuqaroning mulkiy huquqlari buzilganligi masalasi ko'rib chiqilmoqda. Asosiy masala - shartnoma shartlarining to'g'ri bajarilmasligi va undan kelib chiqqan zararning qoplash masalasi.",
      rule: "O'zbekiston Respublikasi Fuqarolik kodeksining 350-moddasiga ko'ra, shartnoma tomonlari o'z majburiyatlarini qonun hujjatlarida belgilangan tartibda bajarishlari shart. 367-moddasiga ko'ra, majburiyatni noto'g'ri bajargan tomon ikkinchi tomonga yetkazilgan zararni qoplashi lozim.",
      application: "Berilgan holatda, sotuvchi tomonidan tovar sifatiga ko'ra talab qilinayotgan xususiyatlar bo'lmaganligi, shu sababli xaridor tomonidan shartnoma bekor qilinishi va to'langan pulning qaytarilishi talabi qonuniy asoslangan. Sotuvchining xatosi tovarning sifatiga oid ma'lumotni to'liq bermaganligida ifodalanadi.",
      conclusion: "Xulosa qilib aytganda, xaridorning da'vosi asosli hisoblanadi. Sotuvchi to'langan pulni qaytarishi va, agar bo'lsa, qo'shimcha zararni qoplashi kerak. Shartnoma bekor qilinishi O'zbekiston Respublikasi Fuqarolik kodeksining 357-moddasiga muvofiq amalga oshirilishi mumkin.",
      sources: [
        {
          title: "O'zbekiston Respublikasi Fuqarolik kodeksi",
          article: "350-modda. Shartnomaning bajarilishi",
          url: "https://lex.uz/acts/-/text/1492387"
        },
        {
          title: "O'zbekiston Respublikasi Fuqarolik kodeksi",
          article: "367-modda. Majburiyatni noto'g'ri bajarish oqibatida yetkazilgan zararning qoplanishi",
          url: "https://lex.uz/acts/-/text/1492387"
        },
        {
          title: "O'zbekiston Respublikasi Fuqarolik kodeksi",
          article: "357-modda. Shartnomani bekor qilish",
          url: "https://lex.uz/acts/-/text/1492387"
        }
      ],
      confidence: 85
    },
    {
      issue: "Ishchi va ish beruvchi o'rtasidida mehnat munosabatlari doirasida yuzaga kelgan nizolarni hal qilish masalasi ko'rib chiqilmoqda. Asosiy e'tibor mehnat shartnomasining shartlariga rioya qilmaslik va shundan kelib chiqqan huquqiy oqibatlarga qaratilgan.",
      rule: "O'zbekiston Respublikasi Mehnat kodeksining 79-moddasiga ko'ra, mehnat shartnomasi yozma shaklda tuzilishi shart. 84-moddasiga ko'ra, ish beruvchi ishchining mehnatini to'g'ri va o'z vaqtida haq to'lashi majburiyati bor.",
      application: "Berilgan holatda, ish beruvchi tomonidan mehnat shartnomasining shartlari buzilgan - ish haqi vaqti va to'liq to'lanmagan. Ishchining da'vosi qonuniy asoslangan, chunki u o'z mehnatini to'liq bajargan, ammo haqini to'liq olmagan.",
      conclusion: "Xulosa qilib aytganda, ishchi o'z da'vosi bilan to'g'ri chiqqan. Ish beruvchi to'langmagan ish haqini to'lashi, kechikma uchun kompensatsiya to'lashi va agar bo'lsa, moral zarar uchun tovon to'lashi shart. Mehnat inspektsiyasiga murojaat qilish tavsiya etiladi.",
      sources: [
        {
          title: "O'zbekiston Respublikasi Mehnat kodeksi",
          article: "79-modda. Mehnat shartnomasi",
          url: "https://lex.uz/acts/-/text/1493359"
        },
        {
          title: "O'zbekiston Respublikasi Mehnat kodeksi",
          article: "84-modda. Ish haqini to'lash",
          url: "https://lex.uz/acts/-/text/1493359"
        },
        {
          title: "O'zbekiston Respublikasi Mehnat kodeksi",
          article: "237-modda. Ish haqini to'lash muddatining buzilishi",
          url: "https://lex.uz/acts/-/text/1493359"
        }
      ],
      confidence: 90
    },
    {
      issue: "Oilaviy nizo masalasi ko'rib chiqilmoqda, xususan, ajralish jarayonida bolalar ta'lim-tarbiyasi bilan bog'liq kelishmovchiliklar va mulkni taqsimlash masalalari.",
      rule: "O'zbekiston Respublikasi Oilaviy kodeksining 55-moddasiga ko'ra, ajralish to'g'risidagi da'vo sud tomonidan ko'rib chiqiladi. 58-moddasiga ko'ra, bolalar manfaati birinchi o'rinda qo'yilishi kerak.",
      application: "Berilgan holatda, ajrashayotgan ota-onalar bolalar ta'lim-tarbiyasi va mulkni taqsimlash masalasida kelisha olmaganliklari uchun sudga murojaat qilishgan. Sud qarori bolalar manfaatini inobatga olishi va adolatli taqsimotni ta'minlashi kerak.",
      conclusion: "Xulosa qilib aytganda, sud ajralishni tasdiqlashi, bolalar ta'lim-tarbiyasini kim topshirishini aniqlashi va mulkni adolatli taqsimlashi kerak. Ikkala tomon ham bolalar manfaatini birinchi o'ringa qo'yishi lozim.",
      sources: [
        {
          title: "O'zbekiston Respublikasi Oilaviy kodeksi",
          article: "55-modda. Ajralish to'g'risida da'vo qo'yish",
          url: "https://lex.uz/acts/-/text/1492387"
        },
        {
          title: "O'zbekiston Respublikasi Oilaviy kodeksi",
          article: "58-modda. Ajralishda bolalar manfaati",
          url: "https://lex.uz/acts/-/text/1492387"
        },
        {
          title: "O'zbekiston Respublikasi Oilaviy kodeksi",
          article: "62-modda. Mulkni taqsimlash",
          url: "https://lex.uz/acts/-/text/1492387"
        }
      ],
      confidence: 88
    }
  ];

  // Select analysis based on case content
  let selectedAnalysis = analyses[0];
  const lowerCaseText = caseText.toLowerCase();
  
  if (lowerCaseText.includes('ish') || lowerCaseText.includes('ishchi') || lowerCaseText.includes('ish beruvchi')) {
    selectedAnalysis = analyses[1];
  } else if (lowerCaseText.includes('ajrash') || lowerCaseText.includes('bola') || lowerCaseText.includes('oilaviy')) {
    selectedAnalysis = analyses[2];
  }

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  return selectedAnalysis;
}

async function trackUsage(feature: string, metadata?: any) {
  try {
    await supabase.from('usage_tracking').insert({
      id: crypto.randomUUID(),
      user_id: 'demo-user', // Replace with actual user ID
      feature,
      action: 'analyze',
      quantity: 1,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Usage tracking error:', error);
  }
}
