import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, authHelpers } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Sign up user with Supabase
    const result = await authHelpers.signUp(email, password, name);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Signup failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'User created successfully. Please check your email for confirmation.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
