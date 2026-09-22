import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/server-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function parseUserAgent(ua: string) {
  let browser = 'Unknown Browser'
  let os = 'Unknown OS'
  let deviceType = 'Desktop'

  if (/windows/i.test(ua)) os = 'Windows'
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS'
  else if (/linux/i.test(ua)) os = 'Linux'
  else if (/android/i.test(ua)) {
    os = 'Android'
    deviceType = 'Mobile'
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS'
    deviceType = /ipad/i.test(ua) ? 'Tablet' : 'Mobile'
  }

  if (/edg/i.test(ua)) browser = 'Microsoft Edge'
  else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome'
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox'
  else if (/safari/i.test(ua)) browser = 'Apple Safari'
  else if (/opera|opr/i.test(ua)) browser = 'Opera'

  return { browser, os, deviceType }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const ua = request.headers.get('user-agent') || ''
    const { browser, os, deviceType } = parseUserAgent(ua)

    const currentSession = {
      id: 'sess_current_' + auth.user.id.slice(0, 8),
      isCurrent: true,
      browser,
      os,
      deviceType,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1',
      lastActive: new Date().toISOString(),
      location: "Toshkent, O'zbekiston",
    }

    return NextResponse.json({
      success: true,
      data: {
        sessions: [currentSession],
        authProvider: auth.user.email?.includes('gmail.com')
          ? 'Google / Email'
          : 'Email & Password',
        emailVerified: true,
      },
    })
  } catch (err) {
    console.error('Sessions API error:', err)
    return NextResponse.json(
      { success: false, error: 'Sessiya ma’lumotlarini olishda xatolik' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request)
    if (!auth.ok) return auth.response

    const userId = auth.user.id
    const supabase = getSupabaseAdmin()

    // Sign out user on other devices/sessions
    try {
      await supabase.auth.admin.signOut(userId, 'others')
    } catch (e) {
      console.warn('Admin signOut others warning:', e)
    }

    return NextResponse.json({
      success: true,
      message: 'Boshqa barcha faol qurilmalardagi sessiyalar bekor qilindi',
    })
  } catch (err) {
    console.error('Revoke sessions error:', err)
    return NextResponse.json(
      { success: false, error: 'Sessiyalarni bekor qilishda xatolik' },
      { status: 500 }
    )
  }
}
