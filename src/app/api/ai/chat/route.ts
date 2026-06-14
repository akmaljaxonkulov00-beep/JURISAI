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
        model: 'llama-3.1-8b-instant', // Fast model
        messages: [
          {
            role: 'system',
            content: 'Sen O\'zbekiston huquq tizimi bo\'yicha professional AI yordamchisan. O\'zbek yoki rus tilida aniq va foydali javoblar ber. Huquqiy maslahat berishda O\'zbekiston qonunchiligiga asoslan.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
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
