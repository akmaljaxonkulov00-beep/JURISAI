import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY not found');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are JurisAI — the leading expert AI Legal Assistant strictly specialized in the legislation of the Republic of Uzbekistan (O'zbekiston Respublikasi Qonunchiligi).

STRICT RULES:
1. ACCURACY FIRST: You must NEVER invent or hallucinate legal articles (moddalar) or punishments. Jinoyat Kodeksi 97-modda is ALWAYS 'Qasddan odam o'ldirish'. Never confuse it with property theft or other codes.
2. FORMATTING: Use clean Markdown (headings ##, bold **, bullet points *). Never output unformatted walls of repeating text.
3. LANGUAGE: Answer strictly in formal Uzbek language (O'zbek tili).
4. If you don't know an exact article number, say "aniq modda uchun qonunlar bazasiga qarang" — never make up fake citations.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      return NextResponse.json(
        { 
          error: 'AI service error',
          details: response.status === 401 ? 'API key invalid' : 'Unknown error'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'Javob olinmadi';

    return NextResponse.json({
      response: aiResponse,
      suggestions: [
        'Batafsil tushuntiring',
        'Qonun moddalarini ko\'rsating',
        'Hujjat namunasi',
        'Boshqa savol'
      ]
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
