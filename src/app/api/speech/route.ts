import { NextRequest, NextResponse } from 'next/server';

// Text-to-Speech (TTS) - Matnni ovozga aylantirish
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, text, audioData } = body;

    switch (action) {
      case 'text-to-speech':
        return await textToSpeech(text);
      case 'speech-to-text':
        return await speechToText(audioData);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Speech API error:', error);
    return NextResponse.json(
      { error: 'Speech service error' },
      { status: 500 }
    );
  }
}

async function textToSpeech(text: string) {
  try {
    // Hozircha browser'ning Web Speech API ni ishlatamiz
    // Kelajakda ElevenLabs yoki Google TTS integratsiya qilish mumkin
    
    return NextResponse.json({
      success: true,
      text,
      audio_url: null, // Browser TTS ishlatiladi
      message: 'Browser TTS ishlatiladi'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'TTS failed' },
      { status: 500 }
    );
  }
}

async function speechToText(audioData: string) {
  try {
    // Hozircha browser'ning Web Speech API ni ishlatamiz
    // Kelajakda Whisper API yoki Google STT integratsiya qilish mumkin
    
    return NextResponse.json({
      success: true,
      text: 'Speech recognition...', // Browser STT ishlatiladi
      confidence: 0.9,
      message: 'Browser STT ishlatiladi'
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'STT failed' },
      { status: 500 }
    );
  }
}
