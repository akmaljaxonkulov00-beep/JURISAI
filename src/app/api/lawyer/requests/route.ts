import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-client';

// GET - Get all client requests for a lawyer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lawyerId = searchParams.get('lawyerId');
    const status = searchParams.get('status');
    const urgency = searchParams.get('urgency');

    if (!lawyerId) {
      return NextResponse.json(
        { error: 'Advokat ID si kerak' },
        { status: 400 }
      );
    }

    let query = supabaseServer
      .from('client_requests')
      .select(`
        *,
        client:client_id (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('lawyer_id', lawyerId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (urgency) {
      query = query.eq('urgency', urgency);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Get requests error:', error);
      return NextResponse.json(
        { error: 'So\'rovlarni olishda xatolik yuz berdi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requests: requests || []
    });

  } catch (error) {
    console.error('Get requests error:', error);
    return NextResponse.json(
      { error: 'Server xatosi' },
      { status: 500 }
    );
  }
}

// POST - Create new client request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      lawyerId,
      clientId,
      subject,
      description,
      urgency,
      category
    } = body;

    // Validate required fields
    if (!lawyerId || !clientId || !subject || !description || !urgency || !category) {
      return NextResponse.json(
        { error: 'Barcha majburiy maydonlar to\'ldirilishi shart' },
        { status: 400 }
      );
    }

    // Create client request
    const { data: requestData, error: requestError } = await supabaseServer
      .from('client_requests')
      .insert({
        lawyer_id: lawyerId,
        client_id: clientId,
        subject,
        description,
        urgency,
        category,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (requestError) {
      console.error('Create request error:', requestError);
      return NextResponse.json(
        { error: 'So\'rovni yaratishda xatolik yuz berdi' },
        { status: 500 }
      );
    }

    // Get client info for notification
    const { data: client } = await supabaseServer
      .from('clients')
      .select('name, email')
      .eq('id', clientId)
      .single();

    // Get lawyer info for notification
    const { data: lawyer } = await supabaseServer
      .from('lawyers')
      .select('email, first_name')
      .eq('id', lawyerId)
      .single();

    // In production, send notifications here
    console.log('New client request created:', {
      requestId: requestData.id,
      client: client?.name,
      lawyer: lawyer?.first_name,
      subject
    });

    return NextResponse.json({
      success: true,
      request: requestData
    });

  } catch (error) {
    console.error('Create request error:', error);
    return NextResponse.json(
      { error: 'Server xatosi' },
      { status: 500 }
    );
  }
}

// PUT - Update request status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      requestId,
      status,
      lawyerResponse,
      estimatedTime,
      estimatedCost
    } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'So\'rov ID si va status kerak' },
        { status: 400 }
      );
    }

    // Update request
    const { data: updatedRequest, error: updateError } = await supabaseServer
      .from('client_requests')
      .update({
        status,
        lawyer_response: lawyerResponse,
        estimated_time: estimatedTime,
        estimated_cost: estimatedCost,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Update request error:', updateError);
      return NextResponse.json(
        { error: 'So\'rovni yangilashda xatolik yuz berdi' },
        { status: 500 }
      );
    }

    // Get request details for notification
    const { data: requestDetails } = await supabaseServer
      .from('client_requests')
      .select(`
        *,
        client:client_id (
          name,
          email
        ),
        lawyer:lawyer_id (
          first_name,
          email
        )
      `)
      .eq('id', requestId)
      .single();

    // In production, send notifications here
    console.log('Request updated:', {
      requestId,
      status,
      client: requestDetails?.client?.name,
      lawyer: requestDetails?.lawyer?.first_name
    });

    return NextResponse.json({
      success: true,
      request: updatedRequest
    });

  } catch (error) {
    console.error('Update request error:', error);
    return NextResponse.json(
      { error: 'Server xatosi' },
      { status: 500 }
    );
  }
}
