// ═══════════════════════════════════════════════════════════════════════════
// settings-sync.ts — MARKAZIY SINXRONLASH XIZMATI
// Admin panelidagi har qanday o'zgarish foydalanuvchiga avtomatik aks etadi
// ═══════════════════════════════════════════════════════════════════════════

export interface SiteSettings {
  announcementBanner: string
  heroTitle: string
  heroSubtitle: string
  contactEmail: string
  contactPhone: string
  telegramLink: string
  legalDisclaimer: string
  systemPrompt: string
  paymentCardNumber: string
  paymentDetails: string
}

export interface PricingPlan {
  id: string
  name: string
  price: number
  features: string[]
  caseLimit: number
  discountPercent?: number
  discountLabel?: string
  limits?: Record<string, number>
}

export interface PaymentRequest {
  id: string
  userId: string
  userEmail: string
  userName: string
  plan: string
  amount: number
  receiptImage: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  rejectReason?: string
}

// =========================================================================
// 1. SITE SETTINGS — Sayt sozlamalari (kartalar, banner, kontakt)
// =========================================================================

export async function getPublicSettings(): Promise<SiteSettings | null> {
  // Fetch from Supabase API (single source of truth)
  try {
    const res = await fetch('/api/settings/public', {
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache' },
    })
    const result = await res.json()
    if (result.success && result.data) {
      return result.data as SiteSettings
    }
  } catch {}

  return null
}

export async function saveSiteSettings(settings: SiteSettings): Promise<boolean> {
  // Save to Supabase (PRIMARY — only source of truth)
  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    })
    const result = await res.json()
    if (!result.success) {
      console.warn('[SettingsSync] Supabase save failed:', result.error)
    }
  } catch (err) {
    console.warn('[SettingsSync] Supabase save error:', err)
  }

  // NOTE: localStorage removed — DB is the single source of truth.
  // Prevents stale data overriding DB values on refresh.

  return true
}

// =========================================================================
// 2. PRICING PLANS — Narxlar va rejalar
// =========================================================================

const PRICING_STORAGE_KEY = 'juristiv_pricing_plans'

export async function getPricingPlans(): Promise<PricingPlan[]> {
  // Fetch from Supabase (single source of truth)
  try {
    const res = await fetch('/api/settings/pricing', {
      cache: 'no-cache',
    })
    const result = await res.json()
    if (result.success && result.data && result.data.length > 0) {
      return result.data
    }
  } catch {}

  // Default — only when DB is completely empty
  return [
    {
      id: 'free',
      name: 'Bepul',
      price: 0,
      features: [
        "To'liq qonunlar bazasi — cheksiz",
        "10 ta AI chat so'rovi / oy",
        '3 ta IRAC tahlili / oy',
        '3 ta hujjat generator / oy',
        '5 ta ovozli yozuv (STT) / oy',
        '3 ta senariy generator / oy',
        'Asboblar, jamiyat, statistika — cheksiz',
      ],
      caseLimit: 5,
    },
    {
      id: 'standart',
      name: 'Standart',
      price: 45000,
      features: [
        "200 ta AI chat so'rovi / oy",
        'Cheksiz IRAC tahlili',
        '50 ta hujjat generator / oy',
        '20 ta hujjat tahlili / oy',
        '20 ta qarorlar daraxti / oy',
        '100 ta ovozli yozuv (STT) / oy',
        '5 ta virtual sud sessiyasi / oy',
        '20 ta senariy generator / oy',
      ],
      caseLimit: 50,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 140000,
      features: [
        "Cheksiz AI chat so'rovlari",
        'Cheksiz IRAC, hujjat, daraxt, senariy',
        'Cheksiz ovozli yozuv (STT)',
        'Cheksiz virtual sud sessiyalari',
        'Shaxsiy maslahatchi',
        'Ekspert konsultatsiyasi',
      ],
      caseLimit: -1,
    },
  ]
}

export async function savePricingPlans(plans: PricingPlan[]): Promise<boolean> {
  // Save to Supabase (only source of truth)
  try {
    const res = await fetch('/api/admin/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plans }),
    })
    const result = await res.json()
    if (!result.success) {
      console.warn('[SettingsSync] Pricing save failed:', result.error)
    }
  } catch (err) {
    console.warn('[SettingsSync] Pricing save error:', err)
  }

  // NOTE: localStorage removed — DB is the single source of truth.

  return true
}

// =========================================================================
// 3. PAYMENT REQUESTS — To'lov so'rovlari
// =========================================================================

export async function getPaymentRequests(): Promise<PaymentRequest[]> {
  try {
    // Avval foydalanuvchi admin ekanligini tekshirish
    let isAdmin = false
    try {
      const storedUser =
        localStorage.getItem('juristiv_user') || sessionStorage.getItem('juristiv_user')
      if (storedUser) {
        const parsed = JSON.parse(storedUser)
        isAdmin = parsed?.role === 'ADMIN' || parsed?.role === 'SUPER_ADMIN'
      }
    } catch {
      /* ignore */
    }

    // Admin bo'lmasa — faqat o'z to'lovlarini olish (admin API 403 qaytaradi)
    const endpoint = isAdmin ? '/api/admin/analytics?type=payments' : '/api/payments'

    const res = await fetch(endpoint, {
      cache: 'no-cache',
      credentials: 'include',
    })

    // 403/401 bo'lsa — bo'sh ro'yxat qaytarish (cheksiz loop oldini olish)
    if (res.status === 403 || res.status === 401) {
      return []
    }

    const result = await res.json()

    // /api/payments formati: { success, data: { payments: [...] } }
    // /api/admin/analytics formati: { success, data: { paymentRequests: [...] } }
    const rawPayments = isAdmin
      ? (result.data?.paymentRequests as
          | Array<{
              id?: string
              user_id?: string
              userId?: string
              userEmail?: string
              user_email?: string
              user_name?: string
              userName?: string
              plan?: string
              amount?: number
              receipt_image?: string
              receiptImage?: string
              status?: string
              created_at?: string
              createdAt?: string
              reject_reason?: string
              rejectReason?: string
            }>
          | undefined)
      : (result.data?.payments as
          | Array<{
              id?: string
              user_id?: string
              userId?: string
              userEmail?: string
              user_email?: string
              user_name?: string
              userName?: string
              plan?: string
              amount?: number
              receipt_image?: string
              receiptImage?: string
              status?: string
              created_at?: string
              createdAt?: string
              reject_reason?: string
              rejectReason?: string
            }>
          | undefined)

    if (result.success && rawPayments) {
      return rawPayments.map(p => ({
        id: p.id || '',
        userId: p.user_id || p.userId || p.userEmail || '',
        userEmail: p.user_email || p.userEmail || '',
        userName: p.user_name || p.userName || '',
        plan: p.plan || '',
        amount: p.amount || 0,
        receiptImage: p.receipt_image || p.receiptImage || '',
        status: (p.status as 'pending' | 'approved' | 'rejected') || 'pending',
        createdAt: p.created_at || p.createdAt || '',
        rejectReason: p.reject_reason || p.rejectReason || '',
      }))
    }
  } catch {}

  // No localStorage fallback — DB is the single source of truth
  return []
}

export async function submitPaymentRequest(
  payment: Omit<PaymentRequest, 'id' | 'createdAt'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  const id = 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)
  const paymentRecord: PaymentRequest = {
    ...payment,
    id,
    createdAt: new Date().toISOString(),
  }

  // Save to Supabase (only source of truth)
  try {
    const res = await fetch('/api/log/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: payment.userId,
        userEmail: payment.userEmail,
        userName: payment.userName,
        plan: payment.plan,
        amount: payment.amount,
        receiptImage: payment.receiptImage,
      }),
    })
    const result = await res.json()
    if (!result.success) {
      console.warn('[SettingsSync] Payment submit failed:', result.error)
    }
  } catch (err) {
    console.warn('[SettingsSync] Payment submit error:', err)
  }

  // NOTE: localStorage removed — DB is the single source of truth.

  return { success: true, id }
}

export async function approvePayment(paymentId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/payments/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, action: 'approve' }),
    })
    const result = await res.json()
    if (!result.success) {
      console.warn('[SettingsSync] Payment approve failed:', result.error)
      return false
    }
    return true
  } catch (err) {
    console.warn('[SettingsSync] Payment approve error:', err)
    return false
  }
}

export async function rejectPayment(paymentId: string, reason?: string): Promise<boolean> {
  try {
    const res = await fetch('/api/payments/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, action: 'reject', reason }),
    })
    const result = await res.json()
    if (!result.success) {
      console.warn('[SettingsSync] Payment reject failed:', result.error)
      return false
    }
    return true
  } catch (err) {
    console.warn('[SettingsSync] Payment reject error:', err)
    return false
  }
}

// =========================================================================
// 4. USER PROFILE / SUBSCRIPTION — Foydalanuvchi profili va obuna
// =========================================================================

export function getUserProfile(): Record<string, unknown> | null {
  try {
    const stored = sessionStorage.getItem('juristiv_user') || sessionStorage.getItem('auth_user')
    if (stored) return JSON.parse(stored)
    const localStored = localStorage.getItem('juristiv_user') || localStorage.getItem('auth_user')
    if (localStored) return JSON.parse(localStored)
  } catch {}
  return null
}

export function updateUserSubscription(plan: string, expiresAt?: string): void {
  try {
    const user = getUserProfile()
    if (!user) return

    const updated = {
      ...user,
      subscription_plan: plan,
      subscription_expires_at: expiresAt || new Date(Date.now() + 365 * 86400000).toISOString(),
    }

    sessionStorage.setItem('juristiv_user', JSON.stringify(updated))
    sessionStorage.setItem('auth_user', JSON.stringify(updated))
    localStorage.setItem('juristiv_user', JSON.stringify(updated))
    localStorage.setItem('auth_user', JSON.stringify(updated))
  } catch {}
}

// =========================================================================
// 5. ANNOUNCEMENTS — E'lonlar va bannerlar
// =========================================================================

export async function getAnnouncements(): Promise<
  { message: string; type: 'info' | 'warning' | 'success'; active: boolean }[]
> {
  try {
    const res = await fetch('/api/settings/announcements', {
      cache: 'no-cache',
    })
    const result = await res.json()
    if (result.success && result.data) {
      return result.data
    }
  } catch {}

  return []
}

// =========================================================================
// 6. POLLING & MANUAL REFRESH — Sozlamalarni yangilash
// =========================================================================

export async function refreshAllSettings(): Promise<void> {
  await Promise.allSettled([
    getPublicSettings(),
    getPricingPlans(),
    getPaymentRequests(),
    getAnnouncements(),
  ])
}
