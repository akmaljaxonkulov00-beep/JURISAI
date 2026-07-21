import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';

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

    // Build context from conversation history
    let contextText = '';
    if (context.length > 0) {
      contextText = '\n\nOldingi suhbat:\n' + context.slice(-4).map((msg: any) => 
        `${msg.role === 'user' ? 'Savol' : 'Javob'}: ${msg.content.substring(0, 150)}...`
      ).join('\n');
    }

    // Professional system prompt with markdown formatting
    const systemPrompt = `You are JurisAI — an expert legal consultant specialized in Uzbekistan legislation. Provide clear, structured, readable, and highly accurate markdown responses. Use headings (##), bullet points, bold key terms, and cited legal articles (moddalar). Never generate repetitive loops or unformatted walls of text.

JAVOB FORMATI:
## Qisqa javob
(1-2 qisqa jumla)

## Asosiy ma'lumot
• (qisqa punkt)
• (qisqa punkt)  
• (qisqa punkt)

## Qonun  
• **Kodeks nomi**, **Modda №** — qisqa izoh

## Maslahat  
• 1 ta amaliy maslahat

MUHIM QOIDALAR:
- Jami 100 so'zdan oshmasin  
- Uzun ro'yxatlar yozma — har doim punktlarga ajrat
- AGAR aniq modda raqamini bilmasang — taxmin qilma, "aniq modda uchun qonunlar bazasiga qarang" deb yoz
- Hech qachon yolg'on modda raqami to'qima
- Faqat o'zbek tilida, sodda va tushunarli

${contextText}`;

    // Call AI with strict limits
    const response = await aiClient.chatMessage(message, systemPrompt);

    // Return raw text - frontend will format it
    let responseText = response.text;

    // Tozalash: agar AI uzun raqamli ro'yxat bersa (1. 2. 3...) — kesib tashlaymiz
    // Agar 4 bo'lim yo'q bo'lsa, lekin uzun bo'lsa — birinchi 600 belgini olamiz
    const hasSection = /QISQA JAVOB|ASOSIY MA'LUMOT|QONUN|MASLAHAT/.test(responseText);
    if (!hasSection && responseText.length > 600) {
      responseText = responseText.slice(0, 600).trim() + '...';
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

    // Extract related laws from response (simple regex pattern)
    const relatedLaws: string[] = [];
    const lawPattern = /([А-Я][а-яА-Я\s]+кодекси?|[A-Z][a-z]+\s+kodeks[i]?)\s*(\d+[-]?(?:modda|moddasi)?)/gi;
    let match;
    while ((match = lawPattern.exec(responseText)) !== null) {
      relatedLaws.push(match[0]);
    }

    // Generate smart suggestions based on category
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

    return NextResponse.json({
      response: responseText,
      category,
      relatedLaws: relatedLaws.slice(0, 3), // Top 3
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
