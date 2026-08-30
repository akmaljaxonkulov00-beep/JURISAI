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
  // 0. Optimistic cache read — return cached immediately, refresh in bg
  let cachedData: SiteSettings | null = null
  try {
    const cached = localStorage.getItem('juristiv_settings')
    if (cached) cachedData = JSON.parse(cached) as SiteSettings
  } catch {}
  if (!cachedData) {
    try {
      const legacy =
        localStorage.getItem('admin_site_settings') || localStorage.getItem('siteSettings')
      if (legacy) cachedData = JSON.parse(legacy) as SiteSettings
    } catch {}
  }

  // 1. Try Supabase (fresh data)
  try {
    const res = await fetch('/api/settings/public', {
      cache: 'no-cache',
      headers: { 'Cache-Control': 'no-cache' },
    })
    const result = await res.json()
    if (result.success && result.data) {
      const freshData = result.data as SiteSettings
      try {
        localStorage.setItem('juristiv_settings', JSON.stringify(freshData))
        localStorage.setItem('admin_site_settings', JSON.stringify(freshData))
        localStorage.setItem('siteSettings', JSON.stringify(freshData))
      } catch {}
      return freshData
    }
  } catch {}

  // 2. Fresh data failed — return cached data
  if (cachedData) return cachedData

  return null
}

export async function saveSiteSettings(settings: SiteSettings): Promise<boolean> {
  // 1. Save to Supabase (PRIMARY)
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

  // 2. Save to localStorage cache (SECONDARY)
  try {
    localStorage.setItem('juristiv_settings', JSON.stringify(settings))
    localStorage.setItem('admin_site_settings', JSON.stringify(settings))
    localStorage.setItem('siteSettings', JSON.stringify(settings))
  } catch {}

  return true
}

// =========================================================================
// 2. PRICING PLANS — Narxlar va rejalar
// =========================================================================

const PRICING_STORAGE_KEY = 'juristiv_pricing_plans'

export async function getPricingPlans(): Promise<PricingPlan[]> {
  // Try Supabase first
  try {
    const res = await fetch('/api/settings/pricing', {
      cache: 'no-cache',
    })
    const result = await res.json()
    if (result.success && result.data && result.data.length > 0) {
      try {
        localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(result.data))
      } catch {}
      return result.data
    }
  } catch {}

  // Fallback to localStorage
  try {
    const cached = localStorage.getItem(PRICING_STORAGE_KEY)
    if (cached) return JSON.parse(cached)
  } catch {}

  // Fallback to legacy
  try {
    const legacy = localStorage.getItem('admin_pricing_plans')
    if (legacy) return JSON.parse(legacy)
  } catch {}

  // Default
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
  // Save to Supabase
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

  // Save to localStorage
  try {
    localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(plans))
    localStorage.setItem('admin_pricing_plans', JSON.stringify(plans))
  } catch {}

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
      const mapped = rawPayments.map(p => ({
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
      try {
        localStorage.setItem('juristiv_payment_requests', JSON.stringify(mapped))
      } catch {}
      return mapped
    }
  } catch {}

  // Fallback to localStorage
  try {
    const cached = localStorage.getItem('juristiv_payment_requests')
    if (cached) return JSON.parse(cached)
    const legacy = localStorage.getItem('payment_requests')
    if (legacy) return JSON.parse(legacy)
  } catch {}

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

  // Save to Supabase (PRIMARY)
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

  // Save to localStorage
  try {
    const existing = JSON.parse(localStorage.getItem('payment_requests') || '[]')
    existing.push(paymentRecord)
    localStorage.setItem('payment_requests', JSON.stringify(existing))
    localStorage.setItem('juristiv_payment_requests', JSON.stringify(existing))

    // Also save as user's payment_history
    localStorage.setItem(
      'payment_history',
      JSON.stringify({
        status: 'pending',
        amount: payment.amount,
        plan: payment.plan,
        date: new Date().toLocaleDateString('uz-UZ'),
        receiptImage: payment.receiptImage,
      })
    )
  } catch {}

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
      try {
        localStorage.setItem('juristiv_announcements', JSON.stringify(result.data))
      } catch {}
      return result.data
    }
  } catch {}

  try {
    const cached = localStorage.getItem('juristiv_announcements')
    if (cached) return JSON.parse(cached)
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
