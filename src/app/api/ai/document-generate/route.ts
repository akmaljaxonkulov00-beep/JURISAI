import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = 'You are JurisAI Document Generator — an expert legal document creation system specialized in the legislation of the Republic of Uzbekistan (O\'zbekiston Respublikasi Qonunchiligi).\n\n' +
  'STRICT RULES:\n' +
  '1. ACCURACY FIRST: You must NEVER invent or hallucinate legal clauses, article numbers, or official references.\n' +
  '2. FORMATTING: Generate professionally formatted legal documents with clear sections, numbered clauses, and proper legal language.\n' +
  '3. LANGUAGE: Answer strictly in formal Uzbek language (O\'zbek tili).\n\n' +
  'Based on the provided template and data, generate a complete legal document including:\n' +
  '- Document title and header (with O\'zbekiston Respublikasi reference)\n' +
  '- Parties/participants section\n' +
  '- Subject matter\n' +
  '- Rights and obligations\n' +
  '- Terms and conditions\n' +
  '- Signatures section with date\n' +
  '- Relevant legal basis references (only if certain)\n\n' +
  'MUHIM: Hech qachon yolg\'on qonun moddalari yoki rasmiy ma\'lumotlarni to\'qimang. Faqat berilgan ma\'lumotlar asosida ishlang.';

export async function POST(request: NextRequest) {
  try {
    const { templateId, documentData, outputFormat, language, customFields } = await request.json();

    if (!templateId || !documentData) {
      return NextResponse.json(
        { error: 'Template ID and document data are required' },
        { status: 400 }
      );
    }

    // Log usage to Supabase
    let documentContent = 'Hujjat: ' + templateId + '\n\nMalumotlar qabul qilindi.';
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
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: 'Template: ' + templateId + '\nData: ' + JSON.stringify(documentData) + '\nFormat: ' + (outputFormat || 'docx') }
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
