import { NextRequest, NextResponse } from 'next/server'
import { auth as simpleAuth } from '@/lib/simple-auth'

const auth = simpleAuth as any

export async function POST(request: NextRequest) {
  try {
    auth.logout()

    return NextResponse.json({
      success: true,
      message: 'Muvaffaqiyatli chiqildi',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Chiqishda xatolik yuz berdi' }, { status: 500 })
  }
}
