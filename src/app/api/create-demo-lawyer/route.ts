import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
  try {
    // Demo lawyer data
    const demoLawyer = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'lawyer@demo.com',
      phone: '+998 90 123 45 67',
      license_number: 'DEMO-001',
      specialization: ['Jinoyat huquqi', 'Fuqarolik huquqi'],
      experience: 5,
      office_address: 'Toshkent shahar, Chilonzor tumani, Amir Temur ko\'chasi 123',
      education: 'Toshkent Davlat Yuridik Universiteti, 2015',
      bar_association: 'O\'zbekiston Advokatlar Assotsiatsiyasi',
      bio: 'Professional advokat with 5+ years of experience in criminal and civil law. Committed to providing high-quality legal services to clients.',
      website: 'https://demo-lawyer.uz',
      linkedin: 'https://linkedin.com/in/demolawyer',
      status: 'approved'
    };

    // Check if demo lawyer already exists
    const { data: existingLawyer } = await supabaseServer
      .from('lawyers')
      .select('id')
      .eq('email', demoLawyer.email)
      .single();

    if (existingLawyer) {
      return NextResponse.json({
        success: true,
        message: 'Demo advokat allaqachon mavjud',
        lawyer: existingLawyer,
        email: demoLawyer.email,
        password: 'demo123456'
      });
    }

    // Create lawyer profile
    const { data: lawyerData, error: lawyerError } = await supabaseServer
      .from('lawyers')
      .insert({
        ...demoLawyer,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (lawyerError) {
      console.error('Demo lawyer creation error:', lawyerError);
      return NextResponse.json(
        { error: 'Demo advokatni yaratishda xatolik yuz berdi' },
        { status: 500 }
      );
    }

    // Create user account for demo lawyer
    const { data: userData, error: userError } = await supabaseServer.auth.admin.createUser({
      email: demoLawyer.email,
      password: 'demo123456',
      email_confirm: true,
      user_metadata: {
        role: 'lawyer',
        lawyer_id: lawyerData.id,
        first_name: demoLawyer.first_name,
        last_name: demoLawyer.last_name
      }
    });

    if (userError) {
      console.error('Demo user creation error:', userError);
      // Rollback lawyer creation
      await supabaseServer
        .from('lawyers')
        .delete()
        .eq('id', lawyerData.id);
      
      return NextResponse.json(
        { error: 'Demo foydalanuvchi akkauntini yaratishda xatolik yuz berdi' },
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

    // Create demo clients
    const demoClients = [
      {
        lawyer_id: lawyerData.id,
        name: 'Ali Karimov',
        email: 'ali.karimov@example.com',
        phone: '+998 90 234 56 78',
        address: 'Toshkent shahar, Yunusobod tumani',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        lawyer_id: lawyerData.id,
        name: 'Dilora Toshmatova',
        email: 'dilora.toshmatova@example.com',
        phone: '+998 91 345 67 89',
        address: 'Toshkent shahri, Mirzo Ulug\'bek tumani',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { data: clientsData } = await supabaseServer
      .from('clients')
      .insert(demoClients)
      .select();

    // Create demo cases
    if (clientsData) {
      const demoCases = [
        {
          client_id: clientsData[0].id,
          lawyer_id: lawyerData.id,
          case_type: 'Jinoyat huquqi',
          description: 'Mulkni o\'g\'irlash ishi bo\'yicha himoya',
          status: 'active',
          revenue: 1500000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          client_id: clientsData[1].id,
          lawyer_id: lawyerData.id,
          case_type: 'Oilaviy huquq',
          description: 'Ajrim va bolalarni taqsimlash masalasi',
          status: 'active',
          revenue: 800000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      await supabaseServer
        .from('client_cases')
        .insert(demoCases);
    }

    // Create demo requests
    if (clientsData) {
      const demoRequests = [
        {
          lawyer_id: lawyerData.id,
          client_id: clientsData[0].id,
          subject: 'Shartnoma tahlili',
          description: 'Sotib olish shartnomasini huquqiy jihatdan tekshirish kerak',
          urgency: 'high',
          category: 'Shartnoma huquqi',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          lawyer_id: lawyerData.id,
          client_id: clientsData[1].id,
          subject: 'Mehnat shartnomasi',
          description: 'Ishdan bo\'shatish masalasi bo\'yicha maslahat kerak',
          urgency: 'medium',
          category: 'Mehnat huquqi',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      await supabaseServer
        .from('client_requests')
        .insert(demoRequests);
    }

    console.log('Demo lawyer created successfully:', {
      lawyerId: lawyerData.id,
      userId: userData.user.id,
      email: demoLawyer.email
    });

    return NextResponse.json({
      success: true,
      message: 'Demo advokat muvaffaqiyatli yaratildi',
      lawyer: lawyerData,
      email: demoLawyer.email,
      password: 'demo123456'
    });

  } catch (error) {
    console.error('Demo lawyer creation error:', error);
    return NextResponse.json(
      { error: 'Server xatosi. Iltimos, qayta urinib ko\'ring.' },
      { status: 500 }
    );
  }
}
