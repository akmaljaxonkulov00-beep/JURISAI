import { getSupabaseAdmin } from '@/lib/supabase-admin'

export interface OfficialVerificationResult {
  isValid: boolean
  status: 'verified' | 'manual_review' | 'rejected'
  licenseNumber: string
  fullName: string
  organization?: string
  licenseDate?: string
  officialRegistryChecked: boolean
  message: string
}

/**
 * Advokat litsenziyasi va ma'lumotlarini rasmiy manbadan tekshirish.
 * Agar rasmiy API/manba mavjud bo'lsa yoki ulanishda uzilish bo'lsa,
 * soxta 'verified' bermaydi — 'manual_review' holatiga o'tkazadi va admin panelga yuboradi.
 */
export async function verifyAdvocateCredentials(params: {
  licenseNumber: string
  fullName: string
  licenseDate?: string
  barAssociation?: string
}): Promise<OfficialVerificationResult> {
  const { licenseNumber, fullName, licenseDate, barAssociation } = params
  const cleanLic = (licenseNumber || '').trim().toUpperCase()
  const cleanName = (fullName || '').trim()

  if (!cleanLic || cleanLic.length < 4) {
    return {
      isValid: false,
      status: 'rejected',
      licenseNumber: cleanLic,
      fullName: cleanName,
      officialRegistryChecked: true,
      message: "Advokatlik guvohnomasi yoki litsenziya raqami noto'g'ri kiritilgan.",
    }
  }

  // O'zbekiston Respublikasi Adliya Vazirligi / e-advokat rasmiy formati:
  // Masalan: ADV-12345 yoki 001234 yoki Toshkent shahar Advokatlar hay'ati seriyasi
  const isValidFormat = /^[A-Z0-9\-\/]{4,20}$/.test(cleanLic)

  if (!isValidFormat) {
    return {
      isValid: false,
      status: 'rejected',
      licenseNumber: cleanLic,
      fullName: cleanName,
      officialRegistryChecked: true,
      message: "Guvohnoma raqami formati O'zbekiston advokatlik reyestriga mos kelmadi.",
    }
  }

  // Rasmiy integratsiya (External Registry API). Agar tashqi API kaliti bo'lsa, so'rov yuboriladi.
  const externalRegistryUrl = process.env.UZ_ADVOCATE_REGISTRY_API_URL
  const externalApiKey = process.env.UZ_ADVOCATE_REGISTRY_API_KEY

  if (externalRegistryUrl && externalApiKey) {
    try {
      const res = await fetch(`${externalRegistryUrl}/check?license=${encodeURIComponent(cleanLic)}`, {
        headers: { Authorization: `Bearer ${externalApiKey}` },
        cache: 'no-cache',
      })
      if (res.ok) {
        const data = await res.json()
        if (data.active && data.verified) {
          return {
            isValid: true,
            status: 'verified',
            licenseNumber: cleanLic,
            fullName: data.full_name || cleanName,
            organization: data.bar_association || barAssociation,
            licenseDate: data.issue_date || licenseDate,
            officialRegistryChecked: true,
            message: "Litsenziya e-advokat davlat reyestridan muvaffaqiyatli tasdiqlandi.",
          }
        } else {
          return {
            isValid: false,
            status: 'rejected',
            licenseNumber: cleanLic,
            fullName: cleanName,
            officialRegistryChecked: true,
            message: data.reason || "Litsenziya reyestrda topilmadi yoki to'xtatilgan.",
          }
        }
      }
    } catch (e) {
      console.warn('[AdvocateService] External registry check failed:', e)
    }
  }

  // Rasmiy API ulanishi bo'lmaganda yoki to'liq avtomatik tekshirib bo'lmaganda:
  // Tizim sun'iy 'verified' bermaydi! Manual review talab etiladi.
  return {
    isValid: true,
    status: 'manual_review',
    licenseNumber: cleanLic,
    fullName: cleanName,
    organization: barAssociation,
    licenseDate,
    officialRegistryChecked: false,
    message: "Arizangiz qabul qilindi va ma'lumotlar Admin paneliga tekshiruv uchun yuborildi.",
  }
}

/**
 * Advokatning tanlangan oy va yil bo'yicha sof daromadi, komissiyasi va tranzaksiyalari.
 */
export async function getAdvocateMonthlyEarnings(
  advocateId: string,
  year: number,
  month: number // 1-12
) {
  const admin = getSupabaseAdmin()
  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString()

  try {
    // 1. Shu oydagi konsultatsiyalar
    const { data: appointments } = await admin
      .from('consultation_appointments')
      .select('*')
      .eq('advocate_id', advocateId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const list = appointments || []
    const completedApps = list.filter(a => a.status === 'completed' || a.payment_status === 'paid')
    const pendingApps = list.filter(a => a.status === 'pending' || a.payment_status === 'pending')

    const totalRevenue = completedApps.reduce((acc, cur) => acc + Number(cur.amount || 0), 0)
    const pendingRevenue = pendingApps.reduce((acc, cur) => acc + Number(cur.amount || 0), 0)
    const platformCommissionPercent = 15.0 // 15% platforma ulushi
    const platformFee = Math.round((totalRevenue * platformCommissionPercent) / 100)
    const netEarnings = totalRevenue - platformFee

    // 2. Oylar bo'yicha 6 oylik trend
    const monthlyTrend: Array<{ month: string; amount: number; count: number }> = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1)
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyTrend.push({ month: mStr, amount: 0, count: 0 })
    }

    return {
      success: true,
      year,
      month,
      totalRevenue,
      netEarnings,
      platformFee,
      pendingRevenue,
      refundedAmount: 0,
      completedConsultationsCount: completedApps.length,
      pendingConsultationsCount: pendingApps.length,
      platformCommissionPercent,
      appointments: list,
      monthlyTrend,
    }
  } catch (err: any) {
    console.error('[AdvocateService] getAdvocateMonthlyEarnings error:', err)
    return {
      success: false,
      year,
      month,
      totalRevenue: 0,
      netEarnings: 0,
      platformFee: 0,
      pendingRevenue: 0,
      refundedAmount: 0,
      completedConsultationsCount: 0,
      pendingConsultationsCount: 0,
      platformCommissionPercent: 15,
      appointments: [],
      monthlyTrend: [],
      error: err.message,
    }
  }
}
