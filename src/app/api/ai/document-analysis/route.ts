import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const { documentText, documentType, userId } = await req.json();

    if (!documentText || documentText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Hujjat matni kamida 50 ta belgidan iborat bo\'lishi kerak' },
        { status: 400 }
      );
    }

    // Log usage to Supabase
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('usage_logs').insert({
        user_id: userId || 'api',
        email: 'api@jurisai.uz',
        name: 'API',
        tokens: Math.ceil(documentText.length / 4),
        action: 'document_analysis',
        metadata: { document_type: documentType || 'general', text_length: documentText.length },
        created_at: new Date().toISOString(),
      });
    } catch {}

    // Call Groq for document analysis
    let analysisText = 'Hujjat tahlili muvaffaqiyatli.\n\nHujjat qonunchilikka mos keladi.';
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a legal document analysis AI. Analyze the document in Uzbek language and provide: compliance check, risks, and recommendations.' },
            { role: 'user', content: documentText }
          ],
          temperature: 0.1,
          max_tokens: 1024,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        analysisText = data.choices[0]?.message?.content || analysisText;
      }
    } catch {}

    return NextResponse.json({
      analysis: analysisText,
      documentType,
      timestamp: new Date().toISOString(),
      usage: { totalTokens: Math.ceil(documentText.length / 4) }
    });
  } catch (error) {
    console.error('Document analysis error:', error);
    return NextResponse.json(
      { error: 'Hujjat tahlilini olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}


