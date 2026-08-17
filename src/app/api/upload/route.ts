import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response
    const userId = auth.user.id

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only images are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    // Upload to Supabase Storage — path session user id dan (client userId ishonilmaydi)
    const supabase = getSupabaseAdmin()
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileName = `${userId}/${Date.now()}_${safeFileName}`
    const { error } = await supabase.storage.from('check-images').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) throw error

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('check-images').getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        fileName,
        fileSize: file.size,
        fileType: file.type,
      },
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ success: false, error: 'Failed to upload file' }, { status: 500 })
  }
}
