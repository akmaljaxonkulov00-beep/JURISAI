import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Telegram service import with error handling
let telegramService: any = null;
try {
  const { telegramService: ts } = require('@/lib/telegram');
  telegramService = ts;
} catch (error) {
  console.warn('Telegram service not available:', error);
}

export async function POST(request: NextRequest) {
  try {
    const { type, title, description, email, userAgent, url } = await request.json();

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'Sarlavha va tafsilotlar maydonlari to\'ldirilishi shart' },
        { status: 400 }
      );
    }

    // Get auth header from request (optional)
    const authHeader = request.headers.get('Authorization')?.replace('Bearer ', '');
    let userId = null;
    let userEmail = null;

    if (authHeader) {
      // Verify user with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(authHeader);
      if (!error && user?.id) {
        userId = user.id;
        userEmail = user.email;
      }
    }
    
    // Create feedback record
    const { data: feedback, error: insertError } = await supabase
      .from('feedback')
      .insert({
        type: type || 'improvement',
        title: title.trim(),
        description: description.trim(),
        email: email || userEmail || null,
        user_id: userId,
        user_agent: userAgent || null,
        url: url || null,
        status: 'NEW',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating feedback:', insertError);
      return NextResponse.json(
        { error: 'Fikrni yuborishda xatolik yuz berdi' },
        { status: 500 }
      );
    }

    // Send Telegram notification to admin
    const notificationText = `
<b>Yangi fikr taklif qilindi!</b>

<b>Turi:</b> ${type === 'bug' ? 'Xatolik' : type === 'feature' ? 'Yangi imkoniyat' : type === 'improvement' ? 'Yaxshilash' : 'Boshqa'}
<b>Sarlavha:</b> ${title}
<b>Fikr:</b> ${description}
<b>Email:</b> ${email || userEmail || 'Ko\'rsatilmagan'}
<b>Foydalanuvchi:</b> ${userEmail || 'Mehmon'}
<b>Sahifa:</b> ${url || 'Noma\'lum'}
<b>ID:</b> ${feedback.id}
<b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}

<b>Platform:</b> JURISAI Legal AI
    `.trim();

    if (telegramService) {
      await telegramService.sendCustomNotification(notificationText);
    }

    return NextResponse.json(
      { 
        message: 'Fikringiz muvaffaqiyatli yuborildi. Rahmat!',
        feedbackId: feedback.id 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Fikrni yuborishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get auth header from request
    const authHeader = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(authHeader);
    
    if (error || !user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('feedback')
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          first_name,
          last_name
        )
      `, { count: 'exact' });

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (type !== 'all') {
      query = query.eq('type', type);
    }

    // Apply pagination and ordering
    const { data: feedbacks, error: fetchError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error('Error fetching feedbacks:', fetchError);
      return NextResponse.json(
        { error: 'Fikrlarni olishda xatolik yuz berdi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      feedbacks,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Feedback fetch error:', error);
    return NextResponse.json(
      { error: 'Fikrlarni olishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get auth header from request
    const authHeader = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(authHeader);
    
    if (error || !user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { feedbackId, status } = await request.json();

    if (!feedbackId || !status) {
      return NextResponse.json(
        { error: 'Feedback ID and status are required' },
        { status: 400 }
      );
    }

    const { data: updatedFeedback, error: updateError } = await supabase
      .from('feedback')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating feedback:', updateError);
      return NextResponse.json(
        { error: 'Feedback statusini yangilashda xatolik yuz berdi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Feedback status updated successfully',
      feedback: updatedFeedback,
    });
  } catch (error) {
    console.error('Feedback update error:', error);
    return NextResponse.json(
      { error: 'Feedback statusini yangilashda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
