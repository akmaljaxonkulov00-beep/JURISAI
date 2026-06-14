import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { googleAIService } from '@/lib/google-ai';

export async function POST(req: NextRequest) {
  try {
    const { documentText, documentType, userId } = await req.json();

    if (!documentText || documentText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Hujjat matni kamida 50 ta belgidan iborat bo\'lishi kerak' },
        { status: 400 }
      );
    }

    // Use Groq AI for document analysis
    const aiRequest = {
      type: 'document-analysis' as const,
      query: documentText,
      context: `Document analysis for ${documentType || 'general'} document. Provide comprehensive analysis including legal compliance, risks, and recommendations.`,
      jurisdiction: 'uzbekistan',
      language: 'uz'
    };
    
    const aiResponse = await googleAIService.generateLegalResponse(aiRequest);

    if (!aiResponse.success) {
      console.error('Google AI Error:', aiResponse.error);
      return NextResponse.json(
        { error: 'Hujjat tahlilini olishda xatolik yuz berdi' },
        { status: 500 }
      );
    }

    // Track usage
    if (userId && supabase) {
      await trackUsage('document_analysis', documentText.length, userId);
    }

    return NextResponse.json({
      analysis: aiResponse.text,
      documentType,
      timestamp: new Date().toISOString(),
      usage: aiResponse.usage
    });
  } catch (error) {
    console.error('Document analysis error:', error);
    return NextResponse.json(
      { error: 'Hujjat tahlilini olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

async function trackUsage(feature: string, textLength: number, userId?: string) {
  if (!supabase || !userId) return;
  
  try {
    await supabase.from('usage_tracking').insert({
      feature,
      action: 'analysis',
      quantity: 1,
      metadata: { textLength },
      user_id: userId,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Usage tracking error:', error);
  }
}
