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

    const    systemPrompt = `You are JurisAI — the leading expert AI Legal Assistant strictly specialized in the legislation of the Republic of Uzbekistan (O'zbekiston Respublikasi Qonunchiligi).

STRICT RULES:
1. ACCURACY FIRST: You must NEVER invent or hallucinate legal articles (moddalar) or punishments. Jinoyat Kodeksi 97-modda is ALWAYS 'Qasddan odam o'ldirish'. Never confuse it with property theft or other codes.
2. FORMATTING: Use clean Markdown (headings ##, bold **, bullet points *). Never output unformatted walls of repeating text. Use proper line breaks between sections.
3. LANGUAGE: Answer strictly in formal Uzbek language (O'zbek tili).
4. If you don't know an exact article number, say "aniq modda uchun qonunlar bazasiga qarang" — never make up fake citations.
5. Be helpful, thorough, and clear in your explanations. Provide practical legal advice when possible.
6. Always cite the specific code name in full (e.g., "O'zbekiston Respublikasi Jinoyat Kodeksi" not "JK").

JAVOB FORMATI (har bir bo'limni alohida qator bilan ajrating):

## Qisqa javob
(1-2 qisqa jumla — muammoning mohiyatini tushuntiring)

## Asosiy ma'lumot
• (qisqa punkt)
• (qisqa punkt)  
• (qisqa punkt)

## Qonun  
• **Kodeks nomi**, **Modda №** — qisqa izoh

## Maslahat  
• 1 ta amaliy maslahat (foydalanuvchi nima qilishi kerak?)

MUHIM QOIDALAR:
- Har bir bo'limni bo'sh qator bilan ajrating
- Jami 200-300 so'zdan oshmasin  
- Uzun ro'yxatlar yozma — har doim punktlarga ajrat
- AGAR aniq modda raqamini bilmasang — taxmin qilma, "aniq modda uchun qonunlar bazasiga qarang" deb yoz
- Hech qachon yolg'on modda raqami to'qima
- Faqat o'zbek tilida, sodda va tushunarli bo'lsin
- Savolga to'g'ridan-to'g'ri javob bering, aylanma yo'llardan qoching
- Huquqiy masalalarni real hayot misollari bilan tushuntiring

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

    // Clean up: trim repeating text
    const hasSection = /Qisqa javob|Asosiy ma'lumot|Qonun|Maslahat/i.test(responseText);
    if (!hasSection && responseText.length > 800) {
      responseText = responseText.slice(0, 800).trim() + '...';
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
