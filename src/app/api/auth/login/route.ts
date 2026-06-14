import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/simple-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email va parol talab qilinadi' },
        { status: 400 }
      );
    }

    const result = await auth.login(email, password);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Muvaffaqiyatli login qilindi',
        user: auth.getUser()
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login qilishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
