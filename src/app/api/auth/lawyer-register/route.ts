import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      firstName,
      lastName,
      email,
      phone,
      licenseNumber,
      specialization,
      experience,
      officeAddress,
      education,
      barAssociation,
      bio,
      website,
      linkedin
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !licenseNumber || !specialization || !officeAddress || !education || !barAssociation || !bio) {
      return NextResponse.json(
        { error: 'Barcha majburiy maydonlar to\'ldirilishi shart' },
        { status: 400 }
      );
    }

    // Check if lawyer with this email already exists
    const { data: existingLawyer, error: checkError } = await supabaseServer
      .from('lawyers')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Check existing lawyer error:', checkError);
      return NextResponse.json(
        { error: 'Ma\'lumotlarni tekshirishda xatolik yuz berdi' },
        { status: 500 }
      );
    }

    if (existingLawyer) {
      return NextResponse.json(
        { error: 'Bu email bilan avval ro\'yxatdan o\'tilgan' },
        { status: 400 }
      );
    }

    // Create lawyer profile
    const { data: lawyerData, error: lawyerError } = await supabaseServer
      .from('lawyers')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        license_number: licenseNumber,
        specialization,
        experience,
        office_address: officeAddress,
        education,
        bar_association: barAssociation,
        bio,
        website,
        linkedin,
        status: 'pending', // pending approval
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (lawyerError) {
      console.error('Lawyer creation error:', lawyerError);
      return NextResponse.json(
        { error: 'Advokat profilini yaratishda xatolik yuz berdi' },
        { status: 500 }
      );
    }

    // Create user account for lawyer
    const tempPassword = Math.random().toString(36).slice(-8); // Generate temporary password
    
    const { data: userData, error: userError } = await supabaseServer.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: 'lawyer',
        lawyer_id: lawyerData.id,
        first_name: firstName,
        last_name: lastName
      }
    });

    if (userError) {
      console.error('User creation error:', userError);
      // Rollback lawyer creation
      await supabaseServer
        .from('lawyers')
        .delete()
        .eq('id', lawyerData.id);
      
      return NextResponse.json(
        { error: 'Foydalanuvchi akkauntini yaratishda xatolik yuz berdi' },
        { status: 500 }
      );
    }

    // Update lawyer with user ID
    const { error: updateError } = await supabaseServer
      .from('lawyers')
      .update({ user_id: userData.user.id })
      .eq('id', lawyerData.id);

    if (updateError) {
      console.error('Lawyer update error:', updateError);
    }

    // Send welcome email (in production, you'd use an email service)
    console.log('Lawyer registered successfully:', {
      lawyerId: lawyerData.id,
      userId: userData.user.id,
      email,
      tempPassword
    });

    return NextResponse.json({
      message: 'Advokat ro\'yxatdan o\'tish muvaffaqiyatli amalga oshirildi',
      lawyer: lawyerData,
      tempPassword // In production, send this via email
    });

  } catch (error) {
    console.error('Lawyer registration error:', error);
    return NextResponse.json(
      { error: 'Server xatosi. Iltimos, qayta urinib ko\'ring.' },
      { status: 500 }
    );
  }
}
