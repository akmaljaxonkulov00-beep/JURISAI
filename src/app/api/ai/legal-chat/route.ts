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

    // Determine category and build appropriate system prompt
    const systemPrompt = `Sen O'zbekiston huquq bo'yicha AI yordamchisan.

JAVOBNI FAQAT QUYIDAGI 4 BO'LIMDA BER. HAR BO'LIM ALOHIDA QATORDA:

📋 QISQA JAVOB:
(faqat 1 ta qisqa jumla)

📖 ASOSIY MA'LUMOT:
• (1-punkt, qisqa)
• (2-punkt, qisqa)
• (3-punkt, qisqa)

⚖ QONUN:
• (kodeks nomi va modda — faqat aniq bilganingni yoz)

💡 MASLAHAT:
• (1 ta amaliy maslahat)

ENG MUHIM QOIDALAR:
- JAMI 100 so'zdan oshmasin
- Uzun ro'yxatlar yozma (1, 2, 3, 4... deb sanab ketma)
- Bitta uzun abzas yozma — har doim punktlarga ajrat
- AGAR aniq modda raqamini bilmasang — taxmin qilma, "aniq modda uchun qonunlar bazasiga qarang" deb yoz
- Hech qachon yolg'on modda raqami to'qima
- Faqat o'zbek tilida, sodda

${contextText}`;

    // Call AI with strict limits
    const response = await aiClient.chatMessage(message, systemPrompt);

    // Return raw text - frontend will format it
    let responseText = response.text;

    // Tozalash: agar AI uzun raqamli ro'yxat bersa (1. 2. 3...) — kesib tashlaymiz
    // Agar 4 bo'lim emoji yo'q bo'lsa, lekin uzun bo'lsa — birinchi 600 belgini olamiz
    const hasEmoji = /📋|📖|⚖|💡/.test(responseText);
    if (!hasEmoji && responseText.length > 600) {
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
