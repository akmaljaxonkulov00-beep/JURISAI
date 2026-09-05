'use client'

import { useState, useEffect } from 'react'
import { getAuthHeaders } from '@/lib/api-auth-client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { isAdminRole } from '@/lib/roles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
  Settings,
  Shield,
  CheckCircle,
  Users,
  CreditCard,
  DollarSign,
  Save,
  X,
  Trash2,
  Bell,
  Globe,
  BarChart3,
  TrendingUp,
  TrendingDown,
  LogOut,
  CalendarDays,
  Clock,
  Activity,
  UserCheck,
  UserX,
  Key,
  Smartphone,
  Search,
  Download,
  FileText,
  BookOpen,
  Mail,
  type LucideIcon,
} from 'lucide-react'
import { authService, type AuthUser } from '@/services/supabase-auth'
import MonitoringDashboard from '@/components/admin/MonitoringDashboard'
import AdminTemplateManager from '@/components/admin/AdminTemplateManager'
import AdminCommunityManager from '@/components/admin/AdminCommunityManager'
import AdminLegalManager from '@/components/admin/AdminLegalManager'
import AdminUsageLimitsManager from '@/components/admin/AdminUsageLimitsManager'
import AdminCostMonitor from '@/components/admin/AdminCostMonitor'
import ContactSettingsCard from '@/components/admin/ContactSettingsCard'
import BrandingSettingsCard from '@/components/admin/BrandingSettingsCard'
import { useAdminRealtime } from '@/hooks/useAdminRealtime'
import {
  saveSiteSettings,
  savePricingPlans,
  approvePayment as syncApprovePayment,
  rejectPayment as syncRejectPayment,
} from '@/lib/settings-sync'
import UserProfileModal from '@/components/admin/UserProfileModal'
import OnlineUsersMonitor from '@/components/admin/OnlineUsersMonitor'
import { useOnlineUsers } from '@/hooks/useOnlineUsers'

interface AdminUser {
  id: string
  uid?: string
  email?: string
  role?: string
  subscription_plan?: string
  subscription_expires_at?: string | null
  blocked?: boolean
  is_active?: boolean
  name?: string
  full_name?: string
  created_at?: string
  last_login?: string
  [key: string]: unknown
}

// Lightbox component for viewing receipt images
function ImageLightbox({ image, onClose }: { image: string | null; onClose: () => void }) {
  if (!image) return null
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-all"
      >
        <X size={20} />
      </button>
      <img
        src={image}
        alt="To'lov cheki"
        onClick={e => e.stopPropagation()}
        className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
      />
    </div>
  )
}

interface SiteSettings {
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
  logoUrl?: string
}

interface PricingPlan {
  id: string
  name: string
  price: number
  features: string[]
  caseLimit: number
  discountPercent?: number
  discountLabel?: string
}

interface PaymentRequest {
  id: string
  userId: string
  userEmail: string
  userName: string
  plan: string
  amount: number
  receiptImage: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface TokenUsage {
  userId: string
  userEmail: string
  userName: string
  tokens: number
  date: string
  action: string
}

interface LoginActivity {
  userId: string
  userEmail: string
  date: string
  method: 'email' | 'google'
}

type TabType =
  | 'dashboard'
  | 'reports'
  | 'monitoring'
  | 'cost'
  | 'users'
  | 'payments'
  | 'pricing'
  | 'usage_limits'
  | 'legal'
  | 'community'
  | 'templates'
  | 'settings'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isAdmin, setUser, logout: authLogout } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [adminAuthError, setAdminAuthError] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')

  // Report filters
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily')
  const [reportDays, setReportDays] = useState(30)
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([])
  const [tokenUsages, setTokenUsages] = useState<TokenUsage[]>([])

  // Real-time data subscription
  const realtime = useAdminRealtime()
  const onlineUsers = useOnlineUsers()

  // User search
  const [userSearchQuery, setUserSearchQuery] = useState('')

  // Pricing
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([
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
      discountPercent: 0,
      discountLabel: '',
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
      discountPercent: 0,
      discountLabel: '',
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
      discountPercent: 0,
      discountLabel: '',
    },
  ])
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [editPlanData, setEditPlanData] = useState<PricingPlan | null>(null)

  // Profile modal
  const [profileModalUser, setProfileModalUser] = useState<AdminUser | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  // Payments
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  // Users
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])

  // Site settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    announcementBanner: 'JURISTIV - Huquqiy AI yordamchingiz!',
    heroTitle: 'Huquqiy masalalarni AI bilan yeching',
    heroSubtitle: "O'zbekiston qonunchiligi bo'yicha professional AI yordamchi",
    contactEmail: 'support@juristiv.uz',
    contactPhone: '+998 90 123 45 67',
    telegramLink: 'https://t.me/juristiv_bot',
    legalDisclaimer:
      "JURISTIV tomonidan berilgan ma'lumotlar faqat ma'lumot uchun. Rasmiy huquqiy maslahat o'rnini bosa olmaydi.",
    systemPrompt: 'You are Juristiv — an expert legal consultant...',
    paymentCardNumber: '8600 1234 5678 9012',
    paymentDetails: 'Click: *123# 45000 UZS / Payme: 8600 1234 5678 9012',
  })
  const [settingsSaved, setSettingsSaved] = useState(false)

  useEffect(() => {
    // NOTE: Settings and pricing plans should ONLY come from database.
    // localStorage fallback removed to prevent stale data overriding DB.

    // Wire real-time data to local state (initial load + continuous updates)
    setPaymentRequests(realtime.paymentRequests)
    setAllUsers(realtime.allUsers.map(u => ({ ...u, id: u.id || u.user_id || u.uid || '' })))
    setLoginActivities(realtime.loginActivities)
    setTokenUsages(realtime.tokenUsages)
    setLoading(realtime.loading)

    try {
      const storedSession =
        sessionStorage.getItem('juristiv_user') || sessionStorage.getItem('auth_user')
      if (storedSession) {
        const parsedUser = JSON.parse(storedSession)
        if (parsedUser && parsedUser.email) {
          if (!user) {
            setUser(parsedUser)
          }
          if (isAdminRole(parsedUser.role)) {
            setAdminUser(parsedUser)
          }
        }
      }
    } catch {}

    setLoading(false)
  }, [
    realtime.paymentRequests,
    realtime.allUsers,
    realtime.loginActivities,
    realtime.tokenUsages,
    realtime.loading,
    realtime.newPaymentsCount,
  ])

  // === DB'dan saqlangan sozlamalar va narxlarni YUKLASH ===
  // (Aks holda admin panel doim hardcoded defaultlarni ko'rsatadi va
  // admin "saqlamadi" deb o'ylaydi. DB — yagona manba.)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [settingsRes, pricingRes] = await Promise.allSettled([
          fetch('/api/settings/public', { cache: 'no-cache' }),
          fetch('/api/settings/pricing', { cache: 'no-cache' }),
        ])
        if (cancelled) return
        if (settingsRes.status === 'fulfilled' && settingsRes.value.ok) {
          const json = await settingsRes.value.json()
          if (json.success && json.data) {
            const d = json.data as Partial<SiteSettings>
            setSiteSettings(prev => ({
              ...prev,
              announcementBanner: d.announcementBanner || prev.announcementBanner,
              heroTitle: d.heroTitle || prev.heroTitle,
              heroSubtitle: d.heroSubtitle || prev.heroSubtitle,
              contactEmail: d.contactEmail || prev.contactEmail,
              contactPhone: d.contactPhone || prev.contactPhone,
              telegramLink: d.telegramLink || prev.telegramLink,
              legalDisclaimer: d.legalDisclaimer || prev.legalDisclaimer,
              systemPrompt: d.systemPrompt || prev.systemPrompt,
              paymentCardNumber: d.paymentCardNumber || prev.paymentCardNumber,
              paymentDetails: d.paymentDetails || prev.paymentDetails,
            }))
          }
        }
        if (pricingRes.status === 'fulfilled' && pricingRes.value.ok) {
          const json = await pricingRes.value.json()
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setPricingPlans(
              json.data.map((p: Record<string, unknown>) => ({
                id: String(p.id),
                name: String(p.name || ''),
                price: Number(p.price) || 0,
                features: Array.isArray(p.features) ? (p.features as string[]) : [],
                caseLimit: Number(p.caseLimit ?? p.case_limit ?? -1),
                discountPercent: Number(p.discountPercent ?? p.discount_percent ?? 0),
                discountLabel: String(p.discountLabel ?? p.discount_label ?? ''),
              }))
            )
          }
        }
      } catch {
        // silent — defaultlar ishlatiladi
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // === LOGOUT — nuclear clear + hard redirect ===
  const handleLogout = async () => {
    await authService.signOut()
    // authService.signOut() now does: localStorage.clear(), sessionStorage.clear(), window.location.href = '/signin'
    setAdminUser(null)
    setUser(null)
  }

  // ===== ADMIN AUTH =====
  // Kirish Supabase orqali amalga oshiriladi, adminlik esa database'dagi
  // haqiqiy roldan (registered_users) tekshiriladi — hardcoded email yo'q.
  const handleAdminLogin = async () => {
    setAdminAuthError('')

    const normalizedEmail = authEmail.trim().toLowerCase()
    const normalizedPass = authPassword.trim()

    if (!normalizedEmail || !normalizedPass) {
      setAdminAuthError('Email va parolni kiriting')
      return
    }

    try {
      const result = await authService.signIn(normalizedEmail, normalizedPass)
      if (result.success && result.data) {
        if (isAdminRole(result.data.role)) {
          const adminData: AdminUser = {
            ...(result.data as unknown as AdminUser),
            id: result.data.id || 'admin',
            subscription_plan: result.data.subscription_plan || 'pro',
          }
          localStorage.setItem('auth_user', JSON.stringify(adminData))
          sessionStorage.setItem('auth_user', JSON.stringify(adminData))
          localStorage.setItem('juristiv_user', JSON.stringify(adminData))
          sessionStorage.setItem('juristiv_user', JSON.stringify(adminData))
          sessionStorage.setItem('auth_token', adminData.id)

          setAdminUser(adminData)
          setUser(adminData as unknown as AuthUser)
          setAdminAuthError('')
        } else {
          setAdminAuthError('Bu akkaunt admin huquqiga ega emas')
        }
      } else {
        setAdminAuthError(result.error || "Email yoki parol noto'g'ri")
      }
    } catch {
      setAdminAuthError('Tizimga kirishda xatolik yuz berdi.')
    }
  }

  // ===== USER MANAGEMENT (local + Supabase sync) =====
  const syncUserToSupabase = async (userData: AdminUser) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          userId: userData.id || userData.uid || userData.email,
          email: userData.email,
          role: userData.role,
          subscription_plan: userData.subscription_plan,
          subscription_expires_at: userData.subscription_expires_at,
          blocked: userData.blocked,
          name: userData.name,
        }),
      })
    } catch {}
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          userId,
          action: 'changeRole',
          data: { role: newRole },
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.success === false) {
        alert(json.error || "Rozini o'zgartirishda xatolik")
      }
    } catch {
      alert("Server bilan bog'lanishda xatolik")
    }
    realtime.refreshUsers()
  }

  const updateUserSubscription = async (userId: string, plan: string) => {
    const expiresAt = plan !== 'free' ? new Date(Date.now() + 365 * 86400000).toISOString() : ''
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          userId,
          action: 'changeSubscription',
          data: { planId: plan, expiresAt },
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.success === false) {
        alert(json.error || "Tarifni o'zgartirishda xatolik")
      }
    } catch {
      alert("Server bilan bog'lanishda xatolik")
    }
    // Refresh users from DB after update
    realtime.refreshUsers()
  }

  const toggleUserBlock = async (userId: string) => {
    const user = allUsers.find((u: AdminUser) => u.id === userId || u.uid === userId)
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          userId,
          action: user?.blocked ? 'unblock' : 'block',
        }),
      })
    } catch {}
    realtime.refreshUsers()
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("Bu foydalanuvchini o'chirishni tasdiqlaysizmi?")) return
    try {
      await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ userId }),
      })
    } catch {}
    realtime.refreshUsers()
  }

  const resetUserPassword = async (userId: string, email?: string) => {
    const newPass = prompt(`Yangi parolni kiriting${email ? ` (${email})` : ''} — kamida 6 belgi:`)
    if (!newPass) return
    if (newPass.length < 6) {
      alert("Parol kamida 6 belgidan iborat bo'lishi kerak")
      return
    }
    if (!confirm("Parolni o'rnatishni tasdiqlaysizmi? Foydalanuvchi yangi parol bilan kiradi."))
      return
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ userId, email, password: newPass }),
      })
      const json = await res.json()
      if (json.success) {
        alert(json.message || "Parol muvaffaqiyatli o'rnatildi")
      } else {
        alert(json.error || "Parolni o'rnatishda xatolik")
      }
    } catch {
      alert("Server bilan bog'lanishda xatolik")
    }
  }

  // ===== TOKEN TRACKING =====
  const getUserTokens = (userId: string): number => {
    return (Array.isArray(tokenUsages) ? tokenUsages : [])
      .filter(t => t.userId === userId)
      .reduce((sum, t) => sum + t.tokens, 0)
  }

  const getUserTokensByPeriod = (userId: string, days: number): number => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return tokenUsages
      .filter(t => t.userId === userId && new Date(t.date) >= cutoff)
      .reduce((sum, t) => sum + t.tokens, 0)
  }

  // ===== REPORT CALCULATIONS =====
  const getReportStats = () => {
    const now = new Date()
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - reportDays)

    // Users registered in period
    const newUsers = (Array.isArray(allUsers) ? allUsers : []).filter((u: AdminUser) => {
      const created = u.created_at || u.last_login
      return created && new Date(created) >= cutoff
    })

    // Logins in period
    const recentLogins = (Array.isArray(loginActivities) ? loginActivities : []).filter(
      l => new Date(l.date) >= cutoff
    )

    // Tokens used in period
    const tokensUsed = tokenUsages
      .filter(t => new Date(t.date) >= cutoff)
      .reduce((sum, t) => sum + t.tokens, 0)

    // Payments in period
    const paymentsInPeriod = (Array.isArray(paymentRequests) ? paymentRequests : []).filter(
      p => new Date(p.createdAt) >= cutoff
    )
    const approvedPayments = paymentsInPeriod.filter(p => p.status === 'approved')
    const totalRevenue = approvedPayments.reduce((sum, p) => sum + p.amount, 0)
    const pendingPayments = paymentsInPeriod.filter(p => p.status === 'pending').length

    // Active users (logged in within period)
    const activeUserIds = new Set(recentLogins.map(l => l.userId))
    const activeUsers = activeUserIds.size

    // Calculate growth vs previous period
    const prevCutoff = new Date()
    prevCutoff.setDate(prevCutoff.getDate() - reportDays * 2)
    const prevNewUsers = (Array.isArray(allUsers) ? allUsers : []).filter((u: AdminUser) => {
      const created = u.created_at || u.last_login
      return created && new Date(created) >= prevCutoff && new Date(created) < cutoff
    })
    const userGrowth =
      prevNewUsers.length > 0
        ? Math.round(((newUsers.length - prevNewUsers.length) / prevNewUsers.length) * 100)
        : 0

    return {
      newUsers: newUsers.length,
      totalUsers: allUsers.length,
      userGrowth,
      recentLogins: recentLogins.length,
      activeUsers,
      tokensUsed,
      totalRevenue,
      approvedCount: approvedPayments.length,
      pendingCount: pendingPayments,
      totalPayments: paymentsInPeriod.length,
    }
  }

  // ===== PAYMENT MANAGEMENT =====
  const approvePayment = async (paymentId: string) => {
    // Update local state immediately
    const updated = paymentRequests.map(p => {
      if (p.id === paymentId) {
        // Update user session with subscription + balance
        const plan = p.plan === 'pro' ? 'pro' : 'standart'
        updateUserSubscription(p.userId, plan)
        try {
          const storedUser =
            sessionStorage.getItem('juristiv_user') || sessionStorage.getItem('auth_user')
          if (storedUser) {
            const userData = JSON.parse(storedUser)
            if (userData.id === p.userId || userData.email === p.userEmail) {
              const currentBalance = Number(userData.balance || 0)
              const updatedUser = {
                ...userData,
                subscription_plan: plan,
                subscription_expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
                balance: currentBalance + (p.amount || 0),
              }
              // Session updated via Supabase auth — no localStorage override
            }
          }
        } catch {}
        return { ...p, status: 'approved' as const }
      }
      return p
    })
    setPaymentRequests(updated)

    // Sync to Supabase (PRIMARY)
    await syncApprovePayment(paymentId)

    // DB is source of truth — refresh from API
    realtime.refreshPayments()
  }

  const rejectPayment = async (paymentId: string) => {
    const updated = paymentRequests.map(p => {
      if (p.id === paymentId) return { ...p, status: 'rejected' as const }
      return p
    })
    setPaymentRequests(updated)

    // Sync to Supabase (PRIMARY)
    await syncRejectPayment(paymentId)

    // DB is source of truth — refresh from API
    realtime.refreshPayments()
  }

  // ===== PRICING MANAGEMENT =====
  const startEditPlan = (plan: PricingPlan) => {
    setEditingPlan(plan.id)
    setEditPlanData({ ...plan })
  }

  const savePlan = async () => {
    if (!editPlanData) return
    const updated = pricingPlans.map(p => (p.id === editingPlan ? editPlanData : p))
    setPricingPlans(updated)
    // Save to Supabase (PRIMARY)
    await savePricingPlans(updated)
    setEditingPlan(null)
    setEditPlanData(null)
  }

  const addFeatureToPlan = () => {
    if (!editPlanData) return
    setEditPlanData({ ...editPlanData, features: [...editPlanData.features, ''] })
  }

  const updateFeature = (idx: number, value: string) => {
    if (!editPlanData) return
    const features = [...editPlanData.features]
    features[idx] = value
    setEditPlanData({ ...editPlanData, features })
  }

  const removeFeature = (idx: number) => {
    if (!editPlanData) return
    setEditPlanData({
      ...editPlanData,
      features: (Array.isArray(editPlanData.features) ? editPlanData.features : []).filter(
        (_, i) => i !== idx
      ),
    })
  }

  // ===== SITE SETTINGS =====
  const saveSettings = async () => {
    // Save to Supabase FIRST (PRIMARY storage)
    await saveSiteSettings(siteSettings)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  // Export report as CSV
  const exportReport = () => {
    const stats = getReportStats()
    const rows = [
      ["Ko'rsatkich", 'Qiymat'],
      ['Jami foydalanuvchilar', String(stats.totalUsers)],
      ['Yangi foydalanuvchilar', String(stats.newUsers)],
      ["Foydalanuvchi o'sishi (%)", String(stats.userGrowth)],
      ['Faol foydalanuvchilar', String(stats.activeUsers)],
      ['Kirishlar soni', String(stats.recentLogins)],
      ['Ishlatilgan tokenlar', String(stats.tokensUsed)],
      ['Umumiy daromad (UZS)', String(stats.totalRevenue)],
      ["Tasdiqlangan to'lovlar", String(stats.approvedCount)],
      ["Kutilayotgan to'lovlar", String(stats.pendingCount)],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hisobot_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Adminlik database'dagi roldan aniqlanadi (isAdminRole: ADMIN/SUPER_ADMIN)
  const autoDetectedAdmin = isAdminRole(user?.role)
  const isSuperAdmin = isAdminRole(user?.role) || isAdminRole(adminUser?.role)
  const effectiveIsAdmin = isAdmin || isSuperAdmin || !!adminUser || autoDetectedAdmin
  const effectiveUser = adminUser || user

  const tabs: { id: TabType; label: string; icon: LucideIcon; badge?: number }[] = [
    { id: 'dashboard', label: 'Boshqaruv', icon: Shield },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'cost', label: 'Xarajat', icon: TrendingUp },
    { id: 'reports', label: 'Hisobotlar', icon: BarChart3 },
    {
      id: 'users',
      label: 'Foydalanuvchilar',
      icon: Users,
      badge: realtime.newUsersCount > 0 ? realtime.newUsersCount : undefined,
    },
    {
      id: 'payments',
      label: "To'lovlar",
      icon: CreditCard,
      badge: realtime.newPaymentsCount > 0 ? realtime.newPaymentsCount : undefined,
    },
    { id: 'pricing', label: 'Narxlar', icon: DollarSign },
    { id: 'usage_limits', label: 'Limitlar', icon: Activity },
    { id: 'legal', label: 'Qonunlar', icon: BookOpen },
    {
      id: 'community',
      label: 'Jamiyat',
      icon: Users,
      badge: realtime.newConsultationsCount > 0 ? realtime.newConsultationsCount : undefined,
    },
    { id: 'templates', label: 'Namunalar', icon: FileText },
    { id: 'settings', label: 'Sozlamalar', icon: Settings },
  ]

  // ===== LOGIN SCREEN =====
  if (!effectiveIsAdmin) {
    return (
      <div className="min-h-screen bg-page-custom flex items-center justify-center p-4">
        <Card className="w-full max-w-md card-default rounded-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-gray-800 dark:text-white">Admin Panel</CardTitle>
            <p className="text-sm text-secondary mt-2">Admin huquqlarini tasdiqlang</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="Admin email"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                Parol
              </label>
              <Input
                type="password"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="Parolni kiriting"
                className="w-full"
              />
            </div>
            {adminAuthError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                {adminAuthError}
              </div>
            )}
            <Button onClick={handleAdminLogin} className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              Admin panelga kirish
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const reportStats = getReportStats()

  return (
    <div className="h-[100dvh] flex flex-col bg-page-custom overflow-hidden">
      {/* ===== HEADER ===== */}
      <div className="card-default border-b border-card-border flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                <p className="text-xs text-secondary">
                  {effectiveUser?.email} • {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex gap-2 flex-wrap">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                        if (tab.id === 'payments') realtime.refreshPayments()
                        if (tab.id === 'users') realtime.refreshUsers()
                        if (tab.id === 'community') realtime.refreshConsultations()
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 relative ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                      {tab.badge && (
                        <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold text-white bg-red-500 rounded-full animate-pulse">
                          {tab.badge > 9 ? '9+' : tab.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all flex items-center gap-1"
                title="Chiqish"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Chiqish</span>
              </button>
            </div>
          </div>
          {/* Mobile tabs */}
          <div className="md:hidden flex gap-1 flex-wrap pb-3">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    if (tab.id === 'payments') realtime.refreshPayments()
                    if (tab.id === 'users') realtime.refreshUsers()
                    if (tab.id === 'community') realtime.refreshConsultations()
                  }}
                  className={`px-2 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 relative ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300'
                  }`}
                >
                  <Icon size={12} />
                  {tab.label}
                  {tab.badge && (
                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[8px] font-bold text-white bg-red-500 rounded-full animate-pulse ml-1">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* ===== DASHBOARD ===== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Online Users Monitor — premium card above stats */}
            <div className="lg:max-w-sm">
              <OnlineUsersMonitor
                count={onlineUsers.count}
                users={onlineUsers.users}
                connected={onlineUsers.connected}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="card-default rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-secondary">Jami foydalanuvchilar</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {allUsers.length}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500 opacity-60" />
                  </div>
                </CardContent>
              </Card>
              <Card className="card-default rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-secondary">Kutilayotgan to\'lovlar</p>
                      <p className="text-2xl font-bold text-orange-600 mt-1">
                        {
                          (Array.isArray(paymentRequests) ? paymentRequests : []).filter(
                            p => p.status === 'pending'
                          ).length
                        }
                      </p>
                    </div>
                    <CreditCard className="w-8 h-8 text-orange-500 opacity-60" />
                  </div>
                </CardContent>
              </Card>
              <Card className="card-default rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-secondary">Tasdiqlangan to\'lovlar</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {
                          (Array.isArray(paymentRequests) ? paymentRequests : []).filter(
                            p => p.status === 'approved'
                          ).length
                        }
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500 opacity-60" />
                  </div>
                </CardContent>
              </Card>
              <Card className="card-default rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-secondary">Premium foydalanuvchilar</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">
                        {
                          (Array.isArray(allUsers) ? allUsers : []).filter(
                            (u: AdminUser) => u.subscription_plan && u.subscription_plan !== 'free'
                          ).length
                        }
                      </p>
                    </div>
                    <Shield className="w-8 h-8 text-purple-500 opacity-60" />
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Quick overview */}
            <Card className="card-default rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Tezkor ko\'rinish
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <p className="text-xs text-secondary">So\'nggi 30 kundagi</p>
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mt-1">
                      Yangilar: {reportStats.newUsers}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Faollar: {reportStats.activeUsers}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                    <p className="text-xs text-secondary">So\'nggi 30 kundagi</p>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300 mt-1">
                      Kirishlar: {reportStats.recentLogins}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Tokenlar: {reportStats.tokensUsed}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800">
                    <p className="text-xs text-secondary">So\'nggi 30 kundagi</p>
                    <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 mt-1">
                      Daromad: {reportStats.totalRevenue.toLocaleString()} UZS
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      To\'lovlar: {reportStats.approvedCount} ta
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                    <p className="text-xs text-secondary">O\'sish</p>
                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mt-1">
                      {reportStats.userGrowth > 0 ? '+' : ''}
                      {reportStats.userGrowth}%
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-400">foydalanuvchilar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== REPORTS ===== */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant={reportType === 'daily' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReportType('daily')}
                >
                  <CalendarDays size={14} className="mr-1" /> Kunlik
                </Button>
                <Button
                  variant={reportType === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReportType('monthly')}
                >
                  <CalendarDays size={14} className="mr-1" /> Oylik
                </Button>
              </div>
              <select
                value={reportDays}
                onChange={e => setReportDays(Number(e.target.value))}
                className="text-xs p-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
              >
                <option value={7}>7 kun</option>
                <option value={30}>30 kun</option>
                <option value={90}>90 kun</option>
                <option value={365}>1 yil</option>
              </select>
              <Button size="sm" variant="outline" onClick={exportReport}>
                <Download size={14} className="mr-1" /> CSV yuklab olish
              </Button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="card-default rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-secondary">Yangi foydalanuvchilar</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {reportStats.newUsers}
                      </p>
                      <p
                        className={`text-xs mt-1 flex items-center gap-1 ${reportStats.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {reportStats.userGrowth >= 0 ? (
                          <TrendingUp size={12} />
                        ) : (
                          <TrendingDown size={12} />
                        )}
                        {reportStats.userGrowth > 0 ? '+' : ''}
                        {reportStats.userGrowth}% o'tgan davrga nisbatan
                      </p>
                    </div>
                    <UserCheck className="w-8 h-8 text-blue-500 opacity-60" />
                  </div>
                </CardContent>
              </Card>
              <Card className="card-default rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-secondary">Faol foydalanuvchilar</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {reportStats.activeUsers}
                      </p>
                      <p className="text-xs text-secondary mt-1">
                        Jami: {reportStats.totalUsers} ta
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-green-500 opacity-60" />
                  </div>
                </CardContent>
              </Card>
              <Card className="card-default rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-secondary">Ishlatilgan tokenlar</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {reportStats.tokensUsed.toLocaleString()}
                      </p>
                      <p className="text-xs text-secondary mt-1">
                        {reportStats.recentLogins} ta kirish
                      </p>
                    </div>
                    <Smartphone className="w-8 h-8 text-purple-500 opacity-60" />
                  </div>
                </CardContent>
              </Card>
              <Card className="card-default rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-secondary">Daromad</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {reportStats.totalRevenue.toLocaleString()} UZS
                      </p>
                      <p className="text-xs text-secondary mt-1">
                        {reportStats.approvedCount} ta to'lov
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-orange-500 opacity-60" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User activity list */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-default rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white text-base">
                    <Clock className="w-4 h-4 text-blue-500" />
                    So'nggi login faolliklari
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loginActivities.length === 0 ? (
                    <p className="text-sm text-secondary text-center py-4">
                      Hali login faolligi yo'q
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(loginActivities ?? [])
                        .slice(-10)
                        .reverse()
                        .map((log, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/50"
                          >
                            <div className="flex items-center gap-2">
                              {log.method === 'google' ? (
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                  <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                    fill="#4285F4"
                                  />
                                </svg>
                              ) : (
                                <Shield size={12} className="text-blue-500" />
                              )}
                              <span className="text-xs text-gray-700 dark:text-zinc-300">
                                {log.userEmail}
                              </span>
                            </div>
                            <span className="text-xs text-secondary">
                              {new Date(log.date).toLocaleString('uz-UZ')}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-default rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white text-base">
                    <Activity className="w-4 h-4 text-blue-500" />
                    Token ishlatilishi (oxirgi 10 ta)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tokenUsages.length === 0 ? (
                    <p className="text-sm text-secondary text-center py-4">
                      Hali token ishlatilmagan
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(tokenUsages ?? [])
                        .slice(-10)
                        .reverse()
                        .map((t, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/50"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700 dark:text-zinc-300 truncate">
                                {t.userEmail}
                              </p>
                              <p className="text-[10px] text-secondary truncate">{t.action}</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-xs font-medium text-blue-600">
                                {t.tokens.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-secondary">
                                {new Date(t.date).toLocaleDateString('uz-UZ')}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ===== MONITORING ===== */}
        {activeTab === 'monitoring' && <MonitoringDashboard />}

        {/* ===== XARAJAT MONITORINGI ===== */}
        {activeTab === 'cost' && <AdminCostMonitor />}

        {/* ===== USAGE LIMITS ===== */}
        {activeTab === 'usage_limits' && <AdminUsageLimitsManager />}

        {/* ===== USERS ===== */}
        {activeTab === 'users' && (
          <Card className="card-default rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                  <Users className="w-5 h-5 text-blue-500" />
                  Foydalanuvchilarni boshqarish
                </CardTitle>
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500"
                  />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={e => setUserSearchQuery(e.target.value)}
                    placeholder="Qidirish..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 w-48"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {allUsers.length === 0 ? (
                <div className="text-center py-10 text-secondary">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>Hali foydalanuvchilar yo'q</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {allUsers
                    .filter((u: AdminUser) => {
                      if (!userSearchQuery) return true
                      const q = userSearchQuery.toLowerCase()
                      return (
                        (u.name || '').toLowerCase().includes(q) ||
                        (u.email || '').toLowerCase().includes(q)
                      )
                    })
                    .map((u: AdminUser) => {
                      const tokenCount = getUserTokens(u.id || u.uid || '')
                      const tokenCount30 = getUserTokensByPeriod(u.id || u.uid || '', 30)
                      return (
                        <div
                          key={u.id || u.uid}
                          className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm text-gray-800 dark:text-white">
                                  {u.name || u.email?.split('@')[0]}
                                </span>
                                <Badge
                                  className={
                                    isAdminRole(u.role)
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 dark:bg-zinc-800/30 text-gray-600 dark:text-zinc-400'
                                  }
                                >
                                  {isAdminRole(u.role) ? 'Admin' : 'Foydalanuvchi'}
                                </Badge>
                                {(u.provider === 'google' ||
                                  (u.email && u.provider !== 'email')) && (
                                  <Badge className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-1">
                                    {u.provider === 'google' ? (
                                      <>
                                        <Globe size={10} /> Google
                                      </>
                                    ) : (
                                      <>{u.provider}</>
                                    )}
                                  </Badge>
                                )}
                                {u.provider === 'email' && (
                                  <Badge className="bg-gray-50 dark:bg-zinc-800/30 text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                                    <Mail size={10} /> Email
                                  </Badge>
                                )}
                                {u.blocked && (
                                  <Badge className="bg-red-100 text-red-800">Bloklangan</Badge>
                                )}
                                {u.subscription_plan && u.subscription_plan !== 'free' && (
                                  <Badge className="bg-green-100 text-green-800">
                                    {u.subscription_plan === 'pro' ? 'Pro' : 'Standart'}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-secondary mt-0.5">{u.email}</p>
                              <div className="flex items-center gap-3 mt-1 text-[10px] text-secondary">
                                <span>Tokenlar: {tokenCount.toLocaleString()}</span>
                                <span>30 kun: {tokenCount30.toLocaleString()}</span>
                                {u.last_login && (
                                  <span>
                                    Oxirgi kirish:{' '}
                                    {new Date(u.last_login).toLocaleDateString('uz-UZ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              <button
                                onClick={() => {
                                  setProfileModalUser(u)
                                  setProfileModalOpen(true)
                                }}
                                className="p-1.5 rounded-lg text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                                title="Profilni ko'rish"
                              >
                                <UserCheck size={14} />
                              </button>
                              <select
                                value={u.role || 'USER'}
                                onChange={e => updateUserRole(u.id || u.uid || '', e.target.value)}
                                className="text-xs p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
                              >
                                <option value="USER">User</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                              <select
                                value={u.subscription_plan || 'free'}
                                onChange={e =>
                                  updateUserSubscription(u.id || u.uid || '', e.target.value)
                                }
                                className="text-xs p-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
                              >
                                <option value="free">Bepul</option>
                                <option value="standart">Standart</option>
                                <option value="pro">Pro</option>
                              </select>
                              <button
                                onClick={() => toggleUserBlock(u.id || u.uid || '')}
                                className={`p-1.5 rounded-lg text-xs ${u.blocked ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                                title={u.blocked ? 'Faollashtirish' : 'Bloklash'}
                              >
                                {u.blocked ? <UserCheck size={14} /> : <UserX size={14} />}
                              </button>
                              <button
                                onClick={() => resetUserPassword(u.id || u.uid || '', u.email)}
                                className="p-1.5 rounded-lg text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all"
                                title="Parolni qayta o'rnatish"
                              >
                                <Key size={14} />
                              </button>
                              <button
                                onClick={() => deleteUser(u.id || u.uid || '')}
                                className="p-1.5 rounded-lg text-xs bg-red-100 text-red-700 hover:bg-red-200"
                                title="O'chirish"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  {allUsers.filter((u: AdminUser) => {
                    if (!userSearchQuery) return true
                    const q = userSearchQuery.toLowerCase()
                    return (
                      (u.name || '').toLowerCase().includes(q) ||
                      (u.email || '').toLowerCase().includes(q)
                    )
                  }).length === 0 &&
                    userSearchQuery && (
                      <p className="text-sm text-secondary text-center py-4">
                        Hech narsa topilmadi
                      </p>
                    )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ===== PAYMENTS ===== */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <Card className="card-default rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    To'lov so'rovlarini boshqarish
                  </CardTitle>
                  <button
                    onClick={realtime.refreshPayments}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all flex items-center gap-1"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Yangilash
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {paymentRequests.length === 0 ? (
                  <div className="text-center py-10 text-secondary">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p>Hali to'lov so'rovlari yo'q</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {paymentRequests.map(p => (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium text-sm text-gray-800 dark:text-white">
                              {p.userName || p.userEmail}
                            </p>
                            <p className="text-xs text-secondary">
                              {p.userEmail} • {p.plan}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                p.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : p.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {p.status === 'approved'
                                ? 'Tasdiqlangan'
                                : p.status === 'rejected'
                                  ? 'Rad etilgan'
                                  : 'Kutilmoqda'}
                            </Badge>
                            <span className="font-bold text-sm text-gray-800 dark:text-white">
                              {p.amount.toLocaleString()} UZS
                            </span>
                          </div>
                        </div>
                        {p.receiptImage && (
                          <div className="mb-3">
                            <button
                              onClick={() => setLightboxImage(p.receiptImage)}
                              className="w-full max-w-xs block"
                            >
                              <img
                                src={p.receiptImage}
                                alt="Chek"
                                className="w-full rounded-lg border dark:border-zinc-700 hover:opacity-90 transition-opacity cursor-pointer"
                              />
                            </button>
                          </div>
                        )}
                        {p.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => approvePayment(p.id)}
                              className="px-4 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle size={14} /> Tasdiqlash
                            </button>
                            <button
                              onClick={() => rejectPayment(p.id)}
                              className="px-4 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                            >
                              <X size={14} /> Rad etish
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-secondary mt-2">
                          {new Date(p.createdAt).toLocaleString('uz-UZ')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== PRICING ===== */}
        {activeTab === 'pricing' && (
          <div className="space-y-4">
            <Card className="card-default rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                  <DollarSign className="w-5 h-5 text-blue-500" />
                  Narxlar va rejalarni boshqarish
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {pricingPlans.map(plan => (
                    <div
                      key={plan.id}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700"
                    >
                      {editingPlan === plan.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editPlanData?.name || ''}
                            onChange={e =>
                              setEditPlanData(prev =>
                                prev ? { ...prev, name: e.target.value } : null
                              )
                            }
                            placeholder="Reja nomi"
                            className="w-full text-sm"
                          />
                          <Input
                            type="number"
                            value={editPlanData?.price || 0}
                            onChange={e =>
                              setEditPlanData(prev =>
                                prev ? { ...prev, price: Number(e.target.value) } : null
                              )
                            }
                            placeholder="Narxi (UZS)"
                            className="w-full text-sm"
                          />
                          <Input
                            type="number"
                            value={editPlanData?.caseLimit || 0}
                            onChange={e =>
                              setEditPlanData(prev =>
                                prev ? { ...prev, caseLimit: Number(e.target.value) } : null
                              )
                            }
                            placeholder="Kunlik limit"
                            className="w-full text-sm"
                          />
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">
                                Chegirma (%)
                              </label>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={editPlanData?.discountPercent || 0}
                                onChange={e =>
                                  setEditPlanData(prev =>
                                    prev
                                      ? {
                                          ...prev,
                                          discountPercent: Math.min(
                                            100,
                                            Math.max(0, Number(e.target.value))
                                          ),
                                        }
                                      : null
                                  )
                                }
                                placeholder="0"
                                className="w-full text-sm"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">
                                Chegirma yorlig'i
                              </label>
                              <Input
                                value={editPlanData?.discountLabel || ''}
                                onChange={e =>
                                  setEditPlanData(prev =>
                                    prev ? { ...prev, discountLabel: e.target.value } : null
                                  )
                                }
                                placeholder="Masalan: Yangi yil"
                                className="w-full text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">
                              Xususiyatlar:
                            </p>
                            {editPlanData?.features.map((f, idx) => (
                              <div key={idx} className="flex items-center gap-1 mb-1">
                                <Input
                                  value={f}
                                  onChange={e => updateFeature(idx, e.target.value)}
                                  className="text-xs flex-1"
                                />
                                <button
                                  onClick={() => removeFeature(idx)}
                                  className="p-1 text-red-500"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={addFeatureToPlan}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                              + Xususiyat qo'shish
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={savePlan}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                            >
                              <Save size={14} className="inline mr-1" />
                              Saqlash
                            </button>
                            <button
                              onClick={() => setEditingPlan(null)}
                              className="px-3 py-1.5 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs rounded-lg"
                            >
                              Bekor qilish
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-gray-800 dark:text-white">{plan.name}</h3>
                            <button
                              onClick={() => startEditPlan(plan)}
                              className="p-1 text-gray-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              <Settings size={14} />
                            </button>
                          </div>
                          <div className="mb-2">
                            {(plan as any).discountPercent > 0 ? (
                              <div className="flex items-center gap-2">
                                <p className="text-xl font-bold text-green-600">
                                  {Math.round(
                                    plan.price * (1 - ((plan as any).discountPercent || 0) / 100)
                                  ).toLocaleString()}{' '}
                                  UZS
                                </p>
                                <span className="text-sm text-gray-400 line-through">
                                  {plan.price.toLocaleString()} UZS
                                </span>
                                <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                                  -{(plan as any).discountPercent}%
                                </span>
                              </div>
                            ) : (
                              <p className="text-xl font-bold text-blue-600">
                                {plan.price.toLocaleString()} UZS
                              </p>
                            )}
                            {(plan as any).discountLabel && (
                              <p className="text-xs text-orange-500 font-medium mt-0.5">
                                🏷️ {(plan as any).discountLabel}
                              </p>
                            )}
                          </div>
                          <ul className="space-y-1">
                            {plan.features.map((f, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-secondary flex items-start gap-1"
                              >
                                <CheckCircle
                                  size={12}
                                  className="text-green-500 mt-0.5 flex-shrink-0"
                                />
                                {f}
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-secondary mt-2">
                            Kunlik limit: {plan.caseLimit === -1 ? 'Cheksiz' : plan.caseLimit} ta
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== LEGAL ===== */}
        {activeTab === 'legal' && (
          <Card className="card-default rounded-2xl">
            <CardContent className="p-5">
              <AdminLegalManager />
            </CardContent>
          </Card>
        )}

        {/* ===== COMMUNITY (Jamiyat) ===== */}
        {activeTab === 'community' && (
          <Card className="card-default rounded-2xl">
            <CardContent className="p-5">
              <AdminCommunityManager />
            </CardContent>
          </Card>
        )}

        {/* ===== TEMPLATES ===== */}
        {activeTab === 'templates' && <AdminTemplateManager />}

        {/* ===== SETTINGS ===== */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Logo Upload */}
            <Card className="card-default rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                  <Shield className="w-5 h-5 text-blue-500" />
                  Logotip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-zinc-800">
                    {siteSettings.logoUrl ? (
                      <img
                        src={siteSettings.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <Shield className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-zinc-400 mb-2">
                      Logo URL kiriting (rasim havolasi)
                    </p>
                    <Input
                      value={siteSettings.logoUrl || ''}
                      onChange={e =>
                        setSiteSettings(prev => ({ ...prev, logoUrl: e.target.value }))
                      }
                      placeholder="https://example.com/logo.png"
                      className="w-full text-sm"
                    />
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                      PNG, JPG yoki SVG formatdagi rasm URL manzili
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Site settings */}
            <Card className="card-default rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                  <Settings className="w-5 h-5 text-blue-500" />
                  Sayt sozlamalari
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'announcementBanner', label: 'Banner matni', icon: Bell },
                  { key: 'heroTitle', label: 'Bosh sahifa sarlavhasi', icon: Globe },
                  { key: 'heroSubtitle', label: 'Bosh sahifa taglavhasi', icon: Globe },
                  { key: 'contactEmail', label: 'Email', icon: Globe },
                  { key: 'contactPhone', label: 'Telefon', icon: Globe },
                  { key: 'telegramLink', label: 'Telegram havola', icon: Globe },
                  { key: 'paymentCardNumber', label: 'Plastik karta raqami', icon: CreditCard },
                  { key: 'paymentDetails', label: "To'lov tafsilotlari", icon: CreditCard },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                      {field.label}
                    </label>
                    <Input
                      value={(siteSettings as unknown as Record<string, string>)[field.key]}
                      onChange={e =>
                        setSiteSettings(prev => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="w-full"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    Huquqiy ogohlantirish
                  </label>
                  <textarea
                    value={siteSettings.legalDisclaimer}
                    onChange={e =>
                      setSiteSettings(prev => ({ ...prev, legalDisclaimer: e.target.value }))
                    }
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white resize-none text-sm"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                    AI System Prompt
                  </label>
                  <textarea
                    value={siteSettings.systemPrompt}
                    onChange={e =>
                      setSiteSettings(prev => ({ ...prev, systemPrompt: e.target.value }))
                    }
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white resize-none text-sm font-mono"
                    rows={4}
                  />
                </div>

                <Button onClick={saveSettings} className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Saqlash
                </Button>
                {settingsSaved && <p className="text-sm text-green-600">Sozlamalar saqlandi! ✅</p>}
              </CardContent>
            </Card>

            {/* Branding — Logo */}
            <BrandingSettingsCard />

            {/* Contact & Social Links Settings */}
            <ContactSettingsCard />

            {/* Logout section */}
            <Card className="card-default rounded-2xl border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <LogOut className="w-5 h-5" />
                  Xavfsizlik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary mb-4">
                  Admin panelidan chiqish va login sahifasiga qaytish.
                </p>
                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Admin panelidan chiqish
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Lightbox for receipt images */}
      <ImageLightbox image={lightboxImage} onClose={() => setLightboxImage(null)} />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userId={profileModalUser?.id || profileModalUser?.uid || profileModalUser?.email}
        userName={profileModalUser?.name || profileModalUser?.email}
        userEmail={profileModalUser?.email}
        user={profileModalUser}
        paymentHistory={paymentRequests}
        tokenHistory={tokenUsages}
        loginHistory={loginActivities}
      />
    </div>
  )
}
