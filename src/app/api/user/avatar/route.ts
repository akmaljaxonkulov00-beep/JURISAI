import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const userId = auth.user.id
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'Fayl tanlanmadi' }, { status: 400 })
    }

    // 1. Validate MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faqat rasm fayllari (JPEG, PNG, WebP) qabul qilinadi',
        },
        { status: 400 }
      )
    }

    // 2. Validate Size (Max 4MB)
    const MAX_SIZE = 4 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rasm hajmi 4 MB dan oshmasligi kerak',
        },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`

    // Attempt upload to 'avatars' bucket, fallback to 'check-images' bucket
    let publicUrl = ''
    let uploadError = null

    try {
      const { error: avError } = await supabase.storage.from('avatars').upload(fileName, file, {
        upsert: true,
        cacheControl: '3600',
        contentType: file.type,
      })

      if (!avError) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
        publicUrl = urlData?.publicUrl || ''
      } else {
        uploadError = avError
      }
    } catch (e) {
      uploadError = e
    }

    // Fallback if 'avatars' bucket does not exist
    if (!publicUrl) {
      try {
        const { error: chkError } = await supabase.storage
          .from('check-images')
          .upload(fileName, file, {
            upsert: true,
            cacheControl: '3600',
            contentType: file.type,
          })

        if (!chkError) {
          const { data: urlData } = supabase.storage.from('check-images').getPublicUrl(fileName)
          publicUrl = urlData?.publicUrl || ''
        } else {
          console.warn('Storage upload fallback failed:', chkError)
        }
      } catch (e) {
        console.warn('Storage fallback exception:', e)
      }
    }

    // If storage is completely offline or permissions missing, convert to data URL
    if (!publicUrl) {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      publicUrl = `data:${file.type};base64,${base64}`
    }

    // Update user record
    try {
      await supabase
        .from('registered_users')
        .update({ avatar: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId)

      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { avatar: publicUrl },
      })
    } catch (dbErr) {
      console.warn('DB avatar update warning:', dbErr)
    }

    return NextResponse.json({
      success: true,
      data: {
        avatarUrl: publicUrl,
      },
    })
  } catch (err) {
    console.error('Avatar upload error:', err)
    return NextResponse.json(
      { success: false, error: 'Rasmni yuklashda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}
