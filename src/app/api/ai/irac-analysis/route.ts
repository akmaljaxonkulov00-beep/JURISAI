import { NextRequest, NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase';
import { googleAIService } from '@/lib/google-ai';

export async function POST(request: NextRequest) {
  try {
    const { caseText, userId } = await request.json();

    if (!caseText || caseText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Jinoyat ishi matni kamida 50 ta belgidan iborat bo\'lishi kerak' },
        { status: 400 }
      );
    }

    // Use Google AI for IRAC analysis
    const iracResult = await googleAIService.performIRACAnalysis(caseText);

    // Track usage
    if (userId && supabaseClient) {
      await trackUsage('irac_analysis', caseText.length, userId);
    }

    return NextResponse.json({
      irac: iracResult,
      caseText,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('IRAC analysis error:', error);
    return NextResponse.json(
      { error: 'IRAC tahlilini olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

async function trackUsage(feature: string, textLength: number, userId?: string) {
  if (!supabaseClient || !userId) return;
  
  try {
    await supabaseClient.from('usage_tracking').insert({
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
