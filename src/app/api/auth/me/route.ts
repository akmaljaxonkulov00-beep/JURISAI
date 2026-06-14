import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/simple-auth';

export async function GET(request: NextRequest) {
  try {
    const user = auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authenticated user not found' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Foydalanuvchi ma\'lumotlarini olishda xatolik' },
      { status: 500 }
    );
  }
}
