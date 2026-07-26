import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.postId || !body.content) {
      return NextResponse.json({ success: false, error: 'postId and content are required' }, { status: 400 });
    }

    const user = body.author || { id: 'anonymous', name: 'Mehmon', avatar: 'user', role: 'Foydalanuvchi', verified: false, reputation: 0 };

    const newComment = {
      id: 'cmt_' + Date.now(),
      postId: body.postId,
      author: user,
      content: body.content,
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      replies: [],
      parentId: body.parentId || null,
    };

    // Try Supabase first
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error } = await supabase.from('community_comments').insert([newComment]);
        if (!error) {
          return NextResponse.json({ success: true, data: newComment, source: 'supabase' });
        }
      }
    } catch {}

    return NextResponse.json({ success: true, data: newComment, source: 'api' });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const postId = searchParams.get('postId');
    if (!id || !postId) {
      return NextResponse.json({ success: false, error: 'id and postId are required' }, { status: 400 });
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error } = await supabase.from('community_comments').delete().eq('id', id);
        if (!error) {
          return NextResponse.json({ success: true, source: 'supabase' });
        }
      }
    } catch {}

    return NextResponse.json({ success: true, source: 'api' });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }
}
