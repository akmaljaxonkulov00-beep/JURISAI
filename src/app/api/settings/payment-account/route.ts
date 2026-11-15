import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/server-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/settings/payment-account?system=citizen|advocate|student
 * POST /api/settings/payment-account (Admin only)
 *
 * Har bir tizim (Fuqarolar, Advokatlar, Talabalar) uchun alohida
 * to'lov hisob raqami (karta raqami, karta egasi, bank nomi).
 * Qaysi tizimga qaysi hisob raqam kiritilsa, FAQAT o'sha tizimda ko'rsatiladi!
 */

const DEFAULT_ACCOUNTS: Record<string, any> = {
  citizen: {
    system: 'citizen',
    cardNumber: '8600 0000 0000 0001',
    cardHolder: 'JURISAI FUQAROLAR XIZMATI',
    bankName: 'Milliy Bank / Uzcard',
    details: 'Fuqarolar savol xaridi va Pro obuna to‘lovlari uchun',
  },
  advocate: {
    system: 'advocate',
    cardNumber: '8600 0000 0000 0002',
    cardHolder: 'JURISAI ADVOKATLAR PALATASI',
    bankName: 'Kapitalbank / Uzcard',
    details: 'Advokatlar verifikatsiyasi va a‘zolik to‘lovlari uchun',
  },
  student: {
    system: 'student',
    cardNumber: '8600 0000 0000 0003',
    cardHolder: 'JURISAI TALABALAR MARKAZI',
    bankName: 'Ipoteka Bank / Uzcard',
    details: 'Ta‘lim talabalari simulyator va kurs to‘lovlari uchun',
  },
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const system = (searchParams.get('system') || 'citizen').toLowerCase().trim()

    const admin = getSupabaseAdmin()
    const { data } = await admin
      .from('platform_settings')
      .select('value')
      .eq('key', `payment_account_${system}`)
      .maybeSingle()

    const account = data?.value || DEFAULT_ACCOUNTS[system] || DEFAULT_ACCOUNTS.citizen

    return NextResponse.json({
      success: true,
      data: account,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { system, cardNumber, cardHolder, bankName, details } = body

    if (!system || !cardNumber) {
      return NextResponse.json(
        { success: false, error: 'Tizim nomi va karta raqami kiritilishi shart' },
        { status: 400 }
      )
    }

    const cleanSystem = String(system).toLowerCase().trim()
    const accountData = {
      system: cleanSystem,
      cardNumber: String(cardNumber).trim(),
      cardHolder: String(cardHolder || '').trim(),
      bankName: String(bankName || '').trim(),
      details: String(details || '').trim(),
      updatedAt: new Date().toISOString(),
    }

    const admin = getSupabaseAdmin()
    await admin.from('platform_settings').upsert(
      {
        key: `payment_account_${cleanSystem}`,
        value: accountData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )

    return NextResponse.json({
      success: true,
      message: `${cleanSystem.toUpperCase()} tizimi uchun hisob raqami muvaffaqiyatli saqlandi!`,
      data: accountData,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
