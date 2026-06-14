import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/simple-auth';

export async function POST(request: NextRequest) {
  try {
    auth.logout();

    return NextResponse.json({
      success: true,
      message: 'Muvaffaqiyatli chiqildi'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Chiqishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
