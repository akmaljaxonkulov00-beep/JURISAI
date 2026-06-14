import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-client';

// GET - Get all clients for a lawyer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lawyerId = searchParams.get('lawyerId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (!lawyerId) {
      return NextResponse.json(
        { error: 'Advokat ID si kerak' },
        { status: 400 }
      );
    }

    let query = supabaseServer
      .from('clients')
      .select(`
        *,
        cases:client_cases (
          id,
          status,
          case_type,
          created_at,
          revenue
        )
      `)
      .eq('lawyer_id', lawyerId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: clients, error } = await query;

    if (error) {
      console.error('Get clients error:', error);
      return NextResponse.json(
        { error: 'Mijozlarni olishda xatolik yuz berdi' },
        { status: 500 }
      );
    }

    // Calculate client statistics
    const clientsWithStats = clients?.map(client => {
      const cases = client.cases || [];
      const activeCases = cases.filter((c: any) => c.status === 'active').length;
      const completedCases = cases.filter((c: any) => c.status === 'completed').length;
      const totalRevenue = cases.reduce((sum: number, c: any) => sum + (c.revenue || 0), 0);
      
      return {
        ...client,
        totalCases: cases.length,
        activeCases,
        completedCases,
        totalRevenue
      };
    }) || [];

    return NextResponse.json({
      success: true,
      clients: clientsWithStats
    });

  } catch (error) {
    console.error('Get clients error:', error);
    return NextResponse.json(
      { error: 'Server xatosi' },
      { status: 500 }
    );
  }
}

// POST - Create new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      lawyerId,
      name,
      email,
      phone,
      address,
      caseType,
      initialDescription
    } = body;

    // Validate required fields
    if (!lawyerId || !name || !email || !phone) {
      return NextResponse.json(
        { error: 'Barcha majburiy maydonlar to\'ldirilishi shart' },
        { status: 400 }
      );
    }

    // Check if client already exists
    const { data: existingClient } = await supabaseServer
      .from('clients')
      .select('id')
      .eq('email', email)
      .eq('lawyer_id', lawyerId)
      .single();

    if (existingClient) {
      return NextResponse.json(
        { error: 'Bu mijoz allaqachon mavjud' },
        { status: 400 }
      );
    }

    // Create client
    const { data: clientData, error: clientError } = await supabaseServer
      .from('clients')
      .insert({
        lawyer_id: lawyerId,
        name,
        email,
        phone,
        address,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (clientError) {
      console.error('Create client error:', clientError);
      return NextResponse.json(
        { error: 'Mijozni yaratishda xatolik yuz berdi' },
        { status: 500 }
      );
    }

    // Create initial case if provided
    if (caseType && initialDescription) {
      const { error: caseError } = await supabaseServer
        .from('client_cases')
        .insert({
          client_id: clientData.id,
          lawyer_id: lawyerId,
          case_type: caseType,
          description: initialDescription,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (caseError) {
        console.error('Create initial case error:', caseError);
      }
    }

    // Get lawyer info for notification
    const { data: lawyer } = await supabaseServer
      .from('lawyers')
      .select('first_name, email')
      .eq('id', lawyerId)
      .single();

    // In production, send welcome email to client
    console.log('New client created:', {
      clientId: clientData.id,
      clientName: name,
      lawyer: lawyer?.first_name
    });

    return NextResponse.json({
      success: true,
      client: clientData
    });

  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json(
      { error: 'Server xatosi' },
      { status: 500 }
    );
  }
}

// PUT - Update client information
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      clientId,
      name,
      email,
      phone,
      address,
      status,
      notes
    } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Mijoz ID si kerak' },
        { status: 400 }
      );
    }

    // Update client
    const { data: updatedClient, error: updateError } = await supabaseServer
      .from('clients')
      .update({
        name,
        email,
        phone,
        address,
        status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single();

    if (updateError) {
      console.error('Update client error:', updateError);
      return NextResponse.json(
        { error: 'Mijozni yangilashda xatolik yuz berdi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      client: updatedClient
    });

  } catch (error) {
    console.error('Update client error:', error);
    return NextResponse.json(
      { error: 'Server xatosi' },
      { status: 500 }
    );
  }
}

// DELETE - Delete client
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Mijoz ID si kerak' },
        { status: 400 }
      );
    }

    // Check if client has active cases
    const { data: activeCases } = await supabaseServer
      .from('client_cases')
      .select('id')
      .eq('client_id', clientId)
      .eq('status', 'active');

    if (activeCases && activeCases.length > 0) {
      return NextResponse.json(
        { error: 'Mijozda faol ishlar bor, o\'chirib bo\'lmaydi' },
        { status: 400 }
      );
    }

    // Delete client
    const { error: deleteError } = await supabaseServer
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (deleteError) {
      console.error('Delete client error:', deleteError);
      return NextResponse.json(
        { error: 'Mijozni o\'chirishda xatolik yuz berdi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mijoz muvaffaqiyatli o\'chirildi'
    });

  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json(
      { error: 'Server xatosi' },
      { status: 500 }
    );
  }
}
