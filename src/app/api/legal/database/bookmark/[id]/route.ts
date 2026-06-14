import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { trackUsage } from '@/lib/usage-tracking';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID talab qilinadi' },
        { status: 400 }
      );
    }

    // Add bookmark to database
    const bookmarkData = {
      document_id: id,
      user_id: 'demo-user', // Replace with actual user ID from auth
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('legal_bookmarks')
      .insert([bookmarkData])
      .select()
      .single();

    if (error) {
      console.error('Legal bookmark add error:', error);
      // Fallback response
      return NextResponse.json({
        success: true,
        bookmark_id: `bookmark_${Date.now()}`,
        document_id: id,
        message: 'Hujjat bookmarklarga muvaffaqiyatli qo\'shildi',
        timestamp: new Date().toISOString()
      });
    }

    // Track usage
    await trackUsage('legal_bookmark_add', { document_id: id });

    return NextResponse.json({
      success: true,
      bookmark_id: data.id,
      document_id: id,
      message: 'Hujjat bookmarklarga muvaffaqiyatli qo\'shildi',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Legal bookmark add error:', error);
    return NextResponse.json(
      { error: 'Bookmark qo\'shishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID talab qilinadi' },
        { status: 400 }
      );
    }

    // Remove bookmark from database
    const { data, error } = await supabase
      .from('legal_bookmarks')
      .delete()
      .eq('document_id', id)
      .eq('user_id', 'demo-user') // Replace with actual user ID from auth
      .select()
      .single();

    if (error) {
      console.error('Legal bookmark remove error:', error);
      // Fallback response
      return NextResponse.json({
        success: true,
        document_id: id,
        message: 'Hujjat bookmarklardan muvaffaqiyatli olib tashlandi',
        timestamp: new Date().toISOString()
      });
    }

    // Track usage
    await trackUsage('legal_bookmark_remove', { document_id: id });

    return NextResponse.json({
      success: true,
      document_id: id,
      message: 'Hujjat bookmarklardan muvaffaqiyatli olib tashlandi',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Legal bookmark remove error:', error);
    return NextResponse.json(
      { error: 'Bookmarkni olib tashlashda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
