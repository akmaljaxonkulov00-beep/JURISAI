import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

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
    // Use Groq Whisper-compatible model for high-accuracy Uzbek STT
    if (GROQ_API_KEY && audioData) {
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: (() => {
          // Convert base64 to blob and send as form data
          const binaryStr = atob(audioData.split(',')[1] || audioData);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('file', blob, 'audio.webm');
          formData.append('model', 'whisper-large-v3');
          formData.append('language', 'uz');
          formData.append('response_format', 'json');
          return formData;
        })(),
      });

      if (response.ok) {
        const result = await response.json();
        return NextResponse.json({
          success: true,
          text: result.text,
          confidence: result.segments?.[0]?.confidence || 0.9,
          message: 'Groq Whisper STT'
        });
      }
    }

    // Fallback: browser Web Speech API instructions
    return NextResponse.json({
      success: true,
      text: null,
      confidence: 0,
      message: 'Web Speech API ishlatilsin — frontend uz-UZ tilida',
      use_browser_stt: true,
      language: 'uz-UZ'
    });
  } catch (error: any) {
    console.error('STT error:', error);
    return NextResponse.json(
      { error: error.message || 'STT xatosi', use_browser_stt: true, language: 'uz-UZ' },
      { status: 500 }
    );
  }
}
