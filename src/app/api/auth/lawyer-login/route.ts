import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email va parol kiritilishi shart' },
        { status: 400 }
      );
    }

    // Authenticate user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Email yoki parol noto\'g\'ri' },
        { status: 401 }
      );
    }

    // Check if user is a lawyer
    const { data: lawyerData, error: lawyerError } = await supabase
      .from('lawyers')
      .select('id, first_name, last_name, email, specialization, experience, status')
      .eq('user_id', authData.user.id)
      .single();

    if (lawyerError || !lawyerData) {
      // Sign out the user if they're not a lawyer
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Bu advokat login emas' },
        { status: 403 }
      );
    }

    // Check if lawyer is approved
    if (lawyerData.status !== 'approved') {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Advokat profili hali tasdiqlanmagan. Iltimos, admin bilan bog\'laning.' },
        { status: 403 }
      );
    }

    // Update last login
    await supabase
      .from('lawyers')
      .update({ last_login: new Date().toISOString() })
      .eq('id', lawyerData.id);

    return NextResponse.json({
      success: true,
      lawyer: {
        id: lawyerData.id,
        firstName: lawyerData.first_name,
        lastName: lawyerData.last_name,
        email: lawyerData.email,
        specialization: lawyerData.specialization,
        experience: lawyerData.experience,
        status: lawyerData.status
      }
    });

  } catch (error) {
    console.error('Lawyer login error:', error);
    return NextResponse.json(
      { error: 'Server xatosi. Iltimos, qayta urinib ko\'ring.' },
      { status: 500 }
    );
  }
}
