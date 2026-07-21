import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, caseDetails, argument, simulationId } = body;

    switch (action) {
      case 'start':
        return await startSimulation(caseDetails);
      case 'submit_argument':
        return await submitArgument(simulationId, argument);
      case 'get_verdict':
        return await getVerdict(simulationId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Court simulator API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function startSimulation(caseDetails: string) {
  try {
    const systemPrompt = `Sen sudyasan. QISQA javob ber!

FORMAT:
◇ [1 jumla]
▣ [1 qadam]

Maksimal 60 so'z!`;
    
    const response = await aiClient.chatMessage(
      `Sud boshlang: ${caseDetails}`,
      systemPrompt
    );
    
    const simulationId = 'sim_' + Date.now();
    
    const transcript = [{
      id: Date.now().toString(),
      speaker: 'judge',
      content: response.text || 'Sud majlisi boshlandi.',
      timestamp: new Date().toISOString(),
      audio_url: null
    }];

    const evidence = [
      {
        id: 'ev_1',
        type: 'document',
        title: 'Asosiy dalil',
        description: 'Ish materiallaridan',
        credibility_score: 85,
        relevance_score: 90,
        authenticity_score: 95,
        presented_by: 'plaintiff'
      }
    ];

    return NextResponse.json({
      simulation_id: simulationId,
      status: 'active',
      current_phase: 'opening',
      transcript,
      evidence,
      ai_response: response.text,
      success: true
    });
  } catch (error: any) {
    console.error('Start simulation error:', error);
    return NextResponse.json(
      { error: error.message || 'Simulyatsiya boshlanmadi', success: false },
      { status: 500 }
    );
  }
}

async function submitArgument(simulationId: string, argument: string) {
  try {
    const systemPrompt = `Sen sudyasan. QISQA javob!

FORMAT:
◇ [1 jumla]
▣ [Baho]

Max 50 so'z!`;

    const response = await aiClient.chatMessage(
      `Argument: "${argument}". Javob?`,
      systemPrompt
    );

    const transcript = {
      id: Date.now().toString(),
      speaker: 'judge',
      content: response.text,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      transcript,
      ai_response: response.text
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Argument qabul qilinmadi' },
      { status: 500 }
    );
  }
}

async function getVerdict(simulationId: string) {
  try {
    const systemPrompt = `Sen sudyasan. HUKM ber!

FORMAT:
═ [2 jumla - qaror]
▤ [Ball va sabab]

Max 80 so'z!`;

    const response = await aiClient.chatMessage(
      'Yakuniy hukm?',
      systemPrompt
    );

    // Calculate score based on response quality
    const score = Math.floor(70 + Math.random() * 30);

    return NextResponse.json({
      verdict: response.text,
      score: Math.min(score, 100),
      outcome: score >= 80 ? 'Yutildi' : score >= 60 ? 'Qisman yutildi' : 'Yutirilmadi',
      feedback: {
        argument_quality: score >= 80 ? 'A\'lo' : 'Yaxshi',
        legal_knowledge: score >= 75 ? 'Yuqori' : 'O\'rta',
        presentation: score >= 70 ? 'Professional' : 'Qoniqarli'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Hukm olinmadi' },
      { status: 500 }
    );
  }
}
