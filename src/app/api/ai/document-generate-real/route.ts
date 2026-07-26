import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackUsage } from '@/lib/usage-tracking';
import { 
  generateArizaPrompt, 
  generateShartnomaPrompt, 
  generateDavoprompt, 
  generateVozPrompt, 
  generateIshHuquqiPrompt, 
  generateGenericPrompt 
} from '@/lib/document-generation/prompts';
import { getDocumentTitle, calculateConfidence, getMockDocument } from '@/lib/document-generation/utils';

export async function POST(request: NextRequest) {
  try {
    const { documentType, details } = await request.json();

    if (!documentType || !details) {
      return NextResponse.json(
        { error: 'Hujjat turi va tafsilotlari talab qilinadi' },
        { status: 400 }
      );
    }

    // Generate document with OpenAI
    const document = await generateDocumentWithOpenAI(documentType, details);

    // Track usage
    await trackUsage('document_generation', { documentType, details });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json(
      { error: 'Hujjat yaratishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

async function generateDocumentWithOpenAI(documentType: string, details: any) {
  const prompts: Record<string, string> = {
    'ariza': generateArizaPrompt(details),
    'shartnoma': generateShartnomaPrompt(details),
    'da-vo': generateDavoprompt(details),
    'voz': generateVozPrompt(details),
    'ish-huquqi': generateIshHuquqiPrompt(details),
    default: generateGenericPrompt(details)
  };

  const prompt = prompts[documentType] || prompts.default;

  try {
    const openaiMod = await import('@/lib/openai');
    const client = (openaiMod as any).openaiClient;
    const content = client ? await client.generateText(prompt) : 'AI hizmati vaqtincha mavjud emas.';
    
    return {
      type: documentType,
      title: typeof getDocumentTitle === 'function' ? (getDocumentTitle as any)(documentType, details) : documentType,
      content,
      metadata: {
        generatedAt: new Date().toISOString(),
        template: documentType,
        confidence: typeof calculateConfidence === 'function' ? (calculateConfidence as any)(content) : 85
      }
    };
  } catch (error) {
    console.error('OpenAI generation error:', error);
    return {
      type: documentType,
      title: documentType,
      content: 'Hujjat yaratishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.',
      metadata: { generatedAt: new Date().toISOString(), template: documentType, confidence: 0 }
    };
  }
}
