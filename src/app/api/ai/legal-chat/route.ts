import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Xabar majburiy' },
        { status: 400 }
      );
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'AI xizmati sozlanmagan' },
        { status: 500 }
      );
    }

    // Build context from conversation history
    let contextText = '';
    if (context.length > 0) {
      contextText = '\n\nOldingi suhbat:\n' + context.slice(-4).map((msg: any) => 
        `${msg.role === 'user' ? 'Savol' : 'Javob'}: ${msg.content.substring(0, 150)}...`
      ).join('\n');
    }

    const systemPrompt = `Siz O'zbekiston Respublikasi qonunchiligi bo'yicha professional AI huquqiy yordamchisiz.

Javoblaringiz foydalanuvchi uchun o'qishga qulay, tushunarli va tartibli bo'lishi shart.

TAQIQLANADI:
- Bir uzun paragraf yozish. Javobni har doim bo'limlarga ajrating.
- Juda qisqa javob berish (agar foydalanuvchi "qisqacha" demasa).
- Faqat modda raqamini yozish.
- Bir xil formatda javob berish.
- "Qisqa javob", "Asosiy ma'lumot", "Maslahat" kabi sun'iy sarlavhalarni ishlatish.
- Markdown belgilarini (**, ##, ---) foydalanuvchiga ko'rsatish. Oddiy matn yozing.

JAVOB FORMATI (har bir javob shu ketma-ketlikda, LEKIN sarlavhasiz yozilsin):

1. Savolga to'g'ridan-to'g'ri javob
Birinchi 2-4 jumlada savolga sodda va aniq javob bering.

2. Batafsil tushuntirish
Mavzuni oddiy tilda izohlang. Kerak bo'lsa misollar keltiring. Murakkab huquqiy atamalarni sodda tilda tushuntiring.

3. Tegishli qonun yoki kodeks
Faqat kerak bo'lsa yozing. Agar bir nechta modda bo'lsa, barchasini tartib bilan yozing.

4. Amaliy tavsiya
Foydalanuvchi keyingi nima qilishi kerakligini yozing: advokatga murojaat qilish, sudga da'vo berish, qanday hujjatlar kerakligi, qaysi davlat organiga murojaat qilish.

5. Qo'shimcha ma'lumot
Mavzuga oid foydali eslatmalarni yozing: jarima, muddat, istisno holatlar, sud amaliyoti.

JAVOB UZUNLIGI:
- Foydalanuvchi "qisqacha" desa: 100-180 so'z
- Foydalanuvchi "batafsil" desa: 450-700 so'z
- Oddiy savol: 220-350 so'z (eng tavsiya qilinadigan)
- Murakkab huquqiy savol: 500-1200 so'z
- Foydalanuvchi hech narsa demasa, o'rtacha uzunlikda (220-350 so'z) javob bering

MUHIM QOIDALAR:
- Hech qachon yolg'on modda raqami to'qimang. Aniq bilmasangiz, "aniq modda uchun qonunlar bazasiga qarang" deb yozing.
- FAQAT O'zbekiston Respublikasining amaldagi qonunlariga asoslanib javob bering. O'zingiz modda yoki qonun to'qimang.
- Agar foydalanuvchi so'ragan masala bo'yicha aniq modda ma'lumotlar bazasida mavjud bo'lmasa, "bu masala bo'yicha aniq modda uchun O'zbekiston Respublikasining tegishli kodeksiga murojaat qilishingizni tavsiya qilaman" deb yozing.
- Kodeks nomlarini to'liq yozing ("O'zbekiston Respublikasi Jinoyat Kodeksi" — "JK" emas).
- Javoblar ChatGPT darajasida tabiiy, inson yozgandek ravon bo'lsin.
- Har bir paragraf orasida bo'sh joy qoldiring.
- Kerakli joylarda • punktlar ishlating.
- Foydalanuvchi matnni bir qarashda oson o'qiy oladigan formatda yozing.
- Faqat o'zbek tilida, sodda va tushunarli bo'lsin.

${contextText}`;

    // Call Groq with strict parameters
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        frequency_penalty: 0.3,
        presence_penalty: 0.1,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      return NextResponse.json(
        { error: 'AI xizmati xatosi', success: false },
        { status: response.status }
      );
    }

    const data = await response.json();
    let responseText = data.choices[0]?.message?.content || 'Javob olinmadi';

    // Clean up: trim if extremely long (over 3000 chars)
    if (responseText.length > 3000) {
      responseText = responseText.slice(0, 3000).trim() + '...';
    }

    // Determine category based on keywords
    let category: 'legal' | 'case' | 'document' | 'general' = 'general';
    const lowerText = message.toLowerCase();
    
    if (lowerText.includes('modda') || lowerText.includes('qonun') || lowerText.includes('kodeks')) {
      category = 'legal';
    } else if (lowerText.includes('keys') || lowerText.includes('sud') || lowerText.includes('da\'vo')) {
      category = 'case';
    } else if (lowerText.includes('shartnoma') || lowerText.includes('hujjat') || lowerText.includes('ariza')) {
      category = 'document';
    }

    // Extract related laws from response
    const relatedLaws: string[] = [];
    const lawPattern = /([А-Я][а-яА-Я\s]+кодекси?|[A-Z][a-z]+\s+kodeks[i]?)\s*(\d+[-]?(?:modda|moddasi)?)/gi;
    let match;
    while ((match = lawPattern.exec(responseText)) !== null) {
      relatedLaws.push(match[0]);
    }

    // Generate smart suggestions
    let suggestions: string[] = [];
    switch (category) {
      case 'legal':
        suggestions = [
          'Bu qonunning amalda qanday qo\'llanilishi?',
          'O\'xshash moddalar haqida ma\'lumot',
          'Bu qonun buzilganda nima bo\'ladi?'
        ];
        break;
      case 'case':
        suggestions = [
          'Sud jarayoni qancha vaqt davom etadi?',
          'Qanday dalillar kerak?',
          'Advokat yollamoq majburiymu?'
        ];
        break;
      case 'document':
        suggestions = [
          'Hujjat namunasini ko\'rsating',
          'Qanday ma\'lumotlar kerak?',
          'Hujjatni qayerga topshirish kerak?'
        ];
        break;
      default:
        suggestions = [
          'Batafsil tushuntiring',
          'Misol keltirib bering',
          'O\'xshash holatlar'
        ];
    }

    // Log usage to Supabase (non-blocking)
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('usage_logs').insert({
        user_id: 'api',
        email: 'api@jurisai.uz',
        name: 'API',
        tokens: Math.ceil(responseText.length / 4),
        action: 'ai_legal_chat',
        metadata: { category, message_length: message.length },
        created_at: new Date().toISOString(),
      });
    } catch {
      // Silently fail — logging is non-critical
    }

    return NextResponse.json({
      response: responseText,
      category,
      relatedLaws: relatedLaws.slice(0, 3),
      suggestions,
      success: true
    });

  } catch (error: any) {
    console.error('Legal Chat API Error:', error);
    return NextResponse.json(
      { 
        error: 'Xatolik yuz berdi',
        message: error.message || 'Noma\'lum xatolik',
        success: false
      },
      { status: 500 }
    );
  }
}
