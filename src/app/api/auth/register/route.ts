import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/simple-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, parol va ism talab qilinadi' },
        { status: 400 }
      );
    }

    const result = await auth.register({ email, password, name });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Muvaffaqiyatli ro\'yxatdan o\'tildi',
        user: auth.getUser()
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Ro\'yxatdan o\'tishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
