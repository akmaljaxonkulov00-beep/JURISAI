import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const { templateId, documentData, outputFormat, language, customFields } = await request.json();

    if (!templateId || !documentData) {
      return NextResponse.json(
        { error: 'Template ID and document data are required' },
        { status: 400 }
      );
    }

    if (!templateId || !documentData) {
      return NextResponse.json(
        { error: 'Template ID and document data are required' },
        { status: 400 }
      );
    }

    // Log usage to Supabase
    let documentContent = `Hujjat: ${templateId}\n\nMalumotlar qabul qilindi.`;
    try {
      // Call Groq for document generation
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a legal document generator. Generate a professional legal document in Uzbek language based on the provided template and data.' },
            { role: 'user', content: `Template: ${templateId}\nData: ${JSON.stringify(documentData)}\nFormat: ${outputFormat || 'docx'}` }
          ],
          temperature: 0.1,
          max_tokens: 2048,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        documentContent = data.choices[0]?.message?.content || documentContent;
      }
    } catch {}

    try {
      const supabase = getSupabaseAdmin();
      await supabase.from('usage_logs').insert({
        user_id: 'api',
        email: 'api@jurisai.uz',
        name: 'API',
        tokens: Math.ceil(documentContent.length / 4),
        action: 'document_generate',
        metadata: { templateId, output_format: outputFormat || 'docx', language: language || 'uz' },
        created_at: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      document: documentContent,
      templateId,
      outputFormat,
      language,
      usage: { totalTokens: Math.ceil(documentContent.length / 4) }
    });

  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json(
      { error: 'Hujjat generatsiyasida xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
