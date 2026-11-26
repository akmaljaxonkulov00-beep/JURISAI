'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  FileCheck,
  BookOpen,
  Mail,
  Scale,
  Award,
  GraduationCap,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import { authService, type AuthUser } from '@/services/supabase-auth'
import MonitoringDashboard from '@/components/admin/MonitoringDashboard'
import AdminTemplateManager from '@/components/admin/AdminTemplateManager'
import AdminOfficialDocumentsManager from '@/components/admin/AdminOfficialDocumentsManager'
import AdminCommunityManager from '@/components/admin/AdminCommunityManager'
import AdminLegalManager from '@/components/admin/AdminLegalManager'
import AdminCourtScenarioManager from '@/components/admin/AdminCourtScenarioManager'
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
  limits?: Record<string, any>
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
  | 'court_scenarios'
  | 'community'
  | 'templates'
  | 'official_documents'
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
        "30 ta AI chat so'rovi / oy",
        '10 ta IRAC tahlili / oy',
        '10 ta hujjat generator / oy',
        '10 ta ovozli yozuv (STT) / oy',
        '5 ta senariy generator / oy',
        'Asboblar, jamiyat, statistika — cheksiz',
      ],
      caseLimit: 5,
      discountPercent: 0,
      discountLabel: '',
    },
    {
      id: 'standart',
      name: 'Standart',
      price: 29000,
      features: [
        "300 ta AI chat so'rovi / oy",
        '50 ta IRAC tahlili / oy',
        '50 ta hujjat generator / oy',
        '30 ta hujjat tahlili / oy',
        '30 ta qarorlar daraxti / oy',
        '100 ta ovozli yozuv (STT) / oy',
        '15 ta virtual sud sessiyasi / oy',
        '30 ta senariy generator / oy',
      ],
      caseLimit: 50,
      discountPercent: 0,
      discountLabel: '',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 79000,
      features: [
        "AI chat so'rovlari — Fair Use",
        'IRAC — Fair Use',
        'Hujjat — Fair Use',
        'Daraxt — Fair Use',
        'Senariy — Fair Use',
        'Ovozli yozuv (STT) — Fair Use',
        '50 ta virtual sud sessiyasi / oy',
        'Shaxsiy maslahatchi',
        'Ekspert konsultatsiyasi',
      ],
      caseLimit: 100,
      discountPercent: 0,
      discountLabel: '',
    },
  ])

  // ── 3 ta tizim bo'yicha alohida hisobotlar va hisob raqamlari (Karta rekvizitlari) ──
  const [systemsOverview, setSystemsOverview] = useState<any>({
    citizens: { total: 0, active: 0, weekly: 0, monthly: 0, revenue: 0 },
    lawStudents: { total: 0, active: 0, weekly: 0, totalEarned: 0, pendingPayouts: 0 },
    advocates: { total: 0, approved: 0, pending: 0, profit: 0 },
    students: { total: 0, active: 0, weekly: 0 },
  })

  const [paymentCards, setPaymentCards] = useState<Record<string, any>>({
    citizen: { cardNumber: '', cardHolder: '', bankName: '', details: '' },
    advocate: { cardNumber: '', cardHolder: '', bankName: '', details: '' },
    student: { cardNumber: '', cardHolder: '', bankName: '', details: '' },
  })
  const [savingCards, setSavingCards] = useState(false)
  const [reportRange, setReportRange] = useState<'week' | 'month'>('week')
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [editPlanData, setEditPlanData] = useState<PricingPlan | null>(null)

  // Profile modal
  const [profileModalUser, setProfileModalUser] = useState<AdminUser | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  // Payments
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [approvingPayment, setApprovingPayment] = useState<PaymentRequest | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<
    'weekly' | 'monthly' | '3_months' | '6_months' | 'yearly'
  >('monthly')
  const [selectedPlanForApproval, setSelectedPlanForApproval] = useState<string>('standart')
  const [rejectingPayment, setRejectingPayment] = useState<PaymentRequest | null>(null)
  const [rejectReason, setRejectReason] = useState<string>('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('pending')
  const [paymentSearchQuery, setPaymentSearchQuery] = useState<string>('')
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false)

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
    paymentDetails: 'Click: *123# 29000 UZS / Payme: 8600 1234 5678 9012',
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

        // Tizimlar ma'lumotlari va hisob raqamlarini yuklash
        const authHeaders = await getAuthHeaders()
        const [cRes, lRes, aRes, sRes, cardC, cardA, cardS] = await Promise.allSettled([
          fetch('/api/admin/citizens', { headers: authHeaders }).then(r => r.json()),
          fetch('/api/admin/law-students', { headers: authHeaders }).then(r => r.json()),
          fetch('/api/admin/advocates', { headers: authHeaders }).then(r => r.json()),
          fetch('/api/admin/students', { headers: authHeaders }).then(r => r.json()),
          fetch('/api/settings/payment-account?system=citizen').then(r => r.json()),
          fetch('/api/settings/payment-account?system=advocate').then(r => r.json()),
          fetch('/api/settings/payment-account?system=student').then(r => r.json()),
        ])

        const overview: any = {}
        if (cRes.status === 'fulfilled' && cRes.value?.success) {
          overview.citizens = {
            total: cRes.value.stats?.total || 0,
            active: cRes.value.stats?.active || 0,
            weekly: cRes.value.stats?.weekly_registered || 0,
            monthly: cRes.value.stats?.monthly_registered || 0,
            revenue: cRes.value.financeStats?.total_citizen_revenue || 0,
            weeklyRevenue: cRes.value.financeStats?.weekly_revenue || 0,
            monthlyRevenue: cRes.value.financeStats?.monthly_revenue || 0,
          }
        }
        if (lRes.status === 'fulfilled' && lRes.value?.success) {
          const d = lRes.value.data
          overview.lawStudents = {
            total: d?.stats?.total_candidates || 0,
            active: d?.stats?.active_candidates || 0,
            weekly: 2,
            totalEarned: d?.financeStats?.total_earned || 0,
            pendingPayouts: d?.stats?.pending_payouts || 0,
          }
        }
        if (aRes.status === 'fulfilled' && aRes.value?.success) {
          overview.advocates = {
            total: aRes.value.stats?.total || 0,
            approved: aRes.value.stats?.approved || 0,
            pending: aRes.value.stats?.pending || 0,
            profit: aRes.value.revenue?.platform_profit || 0,
          }
        }
        if (sRes.status === 'fulfilled' && sRes.value?.success) {
          overview.students = {
            total: sRes.value.stats?.total || 0,
            active: sRes.value.stats?.active || 0,
            weekly: sRes.value.stats?.weekly_registered || 0,
            revenue: sRes.value.financeStats?.total_student_revenue || 0,
          }
        }
        setSystemsOverview(overview)

        const cards: any = {}
        if (cardC.status === 'fulfilled' && cardC.value?.data) cards.citizen = cardC.value.data
        if (cardA.status === 'fulfilled' && cardA.value?.data) cards.advocate = cardA.value.data
        if (cardS.status === 'fulfilled' && cardS.value?.data) cards.student = cardS.value.data
        setPaymentCards(cards)
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
  const handleSavePaymentCard = async (system: 'citizen' | 'advocate' | 'student') => {
    try {
      setSavingCards(true)
      const authHeaders = await getAuthHeaders()
      const card = paymentCards[system] || {}
      const res = await fetch('/api/settings/payment-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          system,
          cardNumber: card.cardNumber,
          cardHolder: card.cardHolder,
          bankName: card.bankName,
          details: card.details,
        }),
      })
      const json = await res.json()
      if (json.success) {
        alert(`${system.toUpperCase()} tizimi uchun hisob raqami (karta) muvaffaqiyatli saqlandi!`)
      } else {
        alert(json.error || 'Saqlashda xatolik')
      }
    } catch {
      alert('Tarmoq xatosi')
    } finally {
      setSavingCards(false)
    }
  }

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
  const openApproveModal = (payment: PaymentRequest) => {
    setApprovingPayment(payment)
    setSelectedPlanForApproval(payment.plan?.toLowerCase() === 'pro' ? 'pro' : 'standart')
    setSelectedDuration('monthly')
  }

  const handleConfirmApproval = async () => {
    if (!approvingPayment || isProcessingPayment) return
    setIsProcessingPayment(true)

    const paymentId = approvingPayment.id
    const plan = selectedPlanForApproval === 'pro' ? 'pro' : 'standart'
    const duration = selectedDuration

    // Update local state immediately
    const updated = paymentRequests.map(p => {
      if (p.id === paymentId) {
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
                balance: currentBalance + (p.amount || 0),
              }
            }
          }
        } catch {}
        return { ...p, status: 'approved' as const, plan }
      }
      return p
    })
    setPaymentRequests(updated)

    // Sync to Supabase (PRIMARY) with duration and plan
    await syncApprovePayment(paymentId, { duration, planId: plan })

    // DB is source of truth — refresh from API
    realtime.refreshPayments()
    setIsProcessingPayment(false)
    setApprovingPayment(null)
  }

  const openRejectModal = (payment: PaymentRequest) => {
    setRejectingPayment(payment)
    setRejectReason('')
  }

  const handleConfirmReject = async () => {
    if (!rejectingPayment || isProcessingPayment) return
    setIsProcessingPayment(true)

    const paymentId = rejectingPayment.id
    const updated = paymentRequests.map(p => {
      if (p.id === paymentId) return { ...p, status: 'rejected' as const }
      return p
    })
    setPaymentRequests(updated)

    // Sync to Supabase (PRIMARY)
    await syncRejectPayment(paymentId, rejectReason || undefined)

    // DB is source of truth — refresh from API
    realtime.refreshPayments()
    setIsProcessingPayment(false)
    setRejectingPayment(null)
    setRejectReason('')
  }

  // Legacy direct calls fallback
  const approvePayment = async (paymentId: string) => {
    const p = paymentRequests.find(req => req.id === paymentId)
    if (p) openApproveModal(p)
  }

  const rejectPayment = async (paymentId: string) => {
    const p = paymentRequests.find(req => req.id === paymentId)
    if (p) openRejectModal(p)
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
    { id: 'court_scenarios', label: 'Virtual Sud', icon: Scale },
    {
      id: 'community',
      label: 'Jamiyat',
      icon: Users,
      badge: realtime.newConsultationsCount > 0 ? realtime.newConsultationsCount : undefined,
    },
    { id: 'templates', label: 'Namunalar', icon: FileText },
    { id: 'official_documents', label: 'Rasmiy Blankalar', icon: FileCheck },
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

          {/* Maxsus 4 ta Boshqaruv Tizimi sahifalari */}
          <div className="flex items-center gap-2 pb-3 pt-1 border-b border-gray-100 dark:border-zinc-800/80 mb-3 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
              <Shield size={12} className="text-indigo-600" />
              Tizimlar:
            </span>
            <Link
              href="/admin/advocates"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 hover:bg-emerald-100 transition-colors shrink-0"
            >
              <Scale size={13} />
              Advokatlar Nazorati
              <span className="text-[9px] px-1 rounded bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">Litsenziya</span>
            </Link>
            <Link
              href="/admin/law-students"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50 hover:bg-indigo-100 transition-colors shrink-0"
            >
              <Award size={13} />
              Yosh Advokatlar (Nomzodlar)
              <span className="text-[9px] px-1 rounded bg-indigo-200/80 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold">Maxsus Parol</span>
            </Link>
            <Link
              href="/admin/citizens"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 hover:bg-blue-100 transition-colors shrink-0"
            >
              <Users size={13} />
              Fuqarolar Nazorati
              <span className="text-[9px] px-1 rounded bg-blue-200/80 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold">Mijozlar</span>
            </Link>
            <Link
              href="/admin/students"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50 hover:bg-amber-100 transition-colors shrink-0"
            >
              <GraduationCap size={13} />
              Ta‘lim Talabalari
              <span className="text-[9px] px-1 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold">Simulyator</span>
            </Link>
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
            {/* ── 4 TA MUSTAQIL TIZIM KARTALARI ── */}
            <div className="bg-gradient-to-r from-slate-50 via-indigo-50/50 to-blue-50/50 dark:from-zinc-900/90 dark:via-indigo-950/30 dark:to-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="text-indigo-600" size={17} />
                    Platforma Tizimlari Boshqaruvi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Har bir tizim faqat o‘z ma&apos;lumotlari, alohida hisob raqamlari va mustaqil hisobotlariga ega
                  </p>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-900/60 px-2.5 py-1 rounded-lg max-w-fit">
                  4 ta Alohida Tizim
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Fuqarolar */}
                <Link
                  href="/admin/citizens"
                  className="group p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:border-blue-500 shadow-sm transition-all hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
                        <Users size={20} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/50">
                        {systemsOverview.citizens?.total || 0} ta Fuqaro
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      Fuqarolar Tizimi
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      Haqiqiy fuqarolar, yuridik savollar, Pro obunalar va alohida hisob raqam.
                    </p>
                  </div>
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-zinc-800 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                    <span>Fuqarolar Nazorati</span>
                    <span>→</span>
                  </div>
                </Link>

                {/* 2. Yosh Advokatlar (Talabalar) */}
                <Link
                  href="/admin/law-students"
                  className="group p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:border-indigo-500 shadow-sm transition-all hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold">
                        <Award size={20} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/50">
                        {systemsOverview.lawStudents?.total || 0} Nomzod
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                      Yosh Advokatlar (Talabalar)
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      Faqat maxsus parol bilan kirish, savol-javob, AI bahosi, reyting ballari va payoutlar.
                    </p>
                  </div>
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-zinc-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                    <span>Yosh Advokatlar</span>
                    <span>→</span>
                  </div>
                </Link>

                {/* 3. Advokatlar */}
                <Link
                  href="/admin/advocates"
                  className="group p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 hover:border-emerald-500 shadow-sm transition-all hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                        <Scale size={20} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/50">
                        {systemsOverview.advocates?.approved || 0} Tasdiqlangan
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      Advokatlar Tizimi
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      Litsenziyalar, arizalar, verifikatsiyalar va advokatlik a&apos;zolik to‘lovlari.
                    </p>
                  </div>
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-zinc-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                    <span>Advokatlar Nazorati</span>
                    <span>→</span>
                  </div>
                </Link>

                {/* 4. Ta'lim Talabalari (Mavjud 23 ta) */}
                <div
                  className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                        <GraduationCap size={20} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/50">
                        {systemsOverview.students?.total || 23} Talaba
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      Ta&apos;lim Talabalari
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      Mavjud 23 ta umumiy talaba: Virtual sud, IRAC tahlili va yuridik testlar faolligi.
                    </p>
                  </div>
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-zinc-800 text-xs font-semibold text-amber-600 flex items-center justify-between">
                    <span>Ta&apos;lim Simulyatori</span>
                    <span>✓ Faol</span>
                  </div>
                </div>
              </div>
            </div>

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
          <div className="space-y-6">
            {/* Payment Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
                <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 block mb-1">
                  Jami so‘rovlar
                </span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">
                  {paymentRequests.length}
                </span>
              </div>

              <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-4 shadow-xs">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block mb-1">
                  Kutilayotgan
                </span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {paymentRequests.filter(p => p.status === 'pending').length}
                </span>
              </div>

              <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl p-4 shadow-xs">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                  Tasdiqlangan
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {paymentRequests.filter(p => p.status === 'approved').length}
                </span>
              </div>

              <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl p-4 shadow-xs">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 block mb-1">
                  Rad etilgan
                </span>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {paymentRequests.filter(p => p.status === 'rejected').length}
                </span>
              </div>
            </div>

            <Card className="card-default rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-gray-100 dark:border-zinc-800 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      To‘lov so‘rovlarini boshqarish
                    </CardTitle>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                      Foydalanuvchilar yuborgan to‘lov cheklarini ko‘rib chiqish va tariflarni faollashtirish
                    </p>
                  </div>
                  <button
                    onClick={realtime.refreshPayments}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Yangilash</span>
                  </button>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                      { id: 'all', label: 'Barchasi', count: paymentRequests.length },
                      {
                        id: 'pending',
                        label: 'Kutilayotgan',
                        count: paymentRequests.filter(p => p.status === 'pending').length,
                      },
                      {
                        id: 'approved',
                        label: 'Tasdiqlangan',
                        count: paymentRequests.filter(p => p.status === 'approved').length,
                      },
                      {
                        id: 'rejected',
                        label: 'Rad etilgan',
                        count: paymentRequests.filter(p => p.status === 'rejected').length,
                      },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setPaymentStatusFilter(tab.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          paymentStatusFilter === tab.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <span>{tab.label}</span>
                        {tab.count > 0 && (
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                              paymentStatusFilter === tab.id
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300'
                            }`}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Email yoki ism bo‘yicha..."
                      value={paymentSearchQuery}
                      onChange={e => setPaymentSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                {(() => {
                  const filtered = paymentRequests.filter(p => {
                    const matchesStatus =
                      paymentStatusFilter === 'all' || p.status === paymentStatusFilter
                    const matchesSearch =
                      !paymentSearchQuery ||
                      (p.userName || '').toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
                      (p.userEmail || '').toLowerCase().includes(paymentSearchQuery.toLowerCase())
                    return matchesStatus && matchesSearch
                  })

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-16 text-secondary">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                          {paymentSearchQuery || paymentStatusFilter !== 'all'
                            ? 'Qidiruv bo‘yicha to‘lov so‘rovlari topilmadi'
                            : 'Hozircha to‘lov so‘rovlari mavjud emas'}
                        </p>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-3.5">
                      {filtered.map(p => (
                        <div
                          key={p.id}
                          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-zinc-700 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            {/* Receipt thumbnail */}
                            {p.receiptImage ? (
                              <button
                                type="button"
                                onClick={() => setLightboxImage(p.receiptImage)}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 flex-shrink-0 relative group cursor-pointer bg-gray-100"
                                title="Chekni kattalashtirib ko‘rish"
                              >
                                <img
                                  src={p.receiptImage}
                                  alt="Chek"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                  Ko‘rish
                                </div>
                              </button>
                            ) : (
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0 text-gray-400">
                                <FileText className="w-6 h-6 opacity-40" />
                              </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                  {p.userName || p.userEmail}
                                </h4>
                                <Badge
                                  className={`text-[10px] font-bold uppercase ${
                                    p.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : p.status === 'rejected'
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  }`}
                                >
                                  {p.status === 'approved'
                                    ? 'Tasdiqlangan'
                                    : p.status === 'rejected'
                                      ? 'Rad etilgan'
                                      : 'Kutilmoqda'}
                                </Badge>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                  {p.plan || 'Standart'}
                                </span>
                              </div>

                              <p className="text-xs text-gray-500 dark:text-zinc-400 truncate mb-1">
                                {p.userEmail}
                              </p>

                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span>{new Date(p.createdAt).toLocaleString('uz-UZ')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Amount & Actions */}
                          <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-zinc-800">
                            <div className="text-left md:text-right">
                              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                                To‘lov summasi
                              </span>
                              <span className="text-base font-black text-gray-900 dark:text-white">
                                {Number(p.amount || 0).toLocaleString()} UZS
                              </span>
                            </div>

                            {p.status === 'pending' && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openApproveModal(p)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Tasdiqlash</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openRejectModal(p)}
                                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                  <span>Rad etish</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
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
                  Tariflar va AI Limitlarini Boshqarish (Yagona Manba)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {pricingPlans.map(plan => {
                    const planLimits = plan.limits || {}
                    const getFeatureVal = (key: string, def: number) => {
                      const raw = planLimits[key]
                      if (typeof raw === 'number') return raw
                      if (typeof raw === 'object' && raw !== null && 'value' in raw)
                        return raw.value
                      return def
                    }

                    return (
                      <div
                        key={plan.id}
                        className="p-5 rounded-2xl bg-white dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 shadow-sm flex flex-col justify-between"
                      >
                        {editingPlan === plan.id ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                                Reja nomi
                              </label>
                              <Input
                                value={editPlanData?.name || ''}
                                onChange={e =>
                                  setEditPlanData(prev =>
                                    prev ? { ...prev, name: e.target.value } : null
                                  )
                                }
                                placeholder="Reja nomi"
                                className="w-full text-sm font-bold"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                                  Narxi (UZS / oy)
                                </label>
                                <Input
                                  type="number"
                                  value={editPlanData?.price ?? 0}
                                  onChange={e =>
                                    setEditPlanData(prev =>
                                      prev ? { ...prev, price: Number(e.target.value) } : null
                                    )
                                  }
                                  placeholder="Narxi"
                                  className="w-full text-sm font-bold text-blue-600"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                                  Kunlik limit
                                </label>
                                <Input
                                  type="number"
                                  value={editPlanData?.caseLimit ?? -1}
                                  onChange={e =>
                                    setEditPlanData(prev =>
                                      prev ? { ...prev, caseLimit: Number(e.target.value) } : null
                                    )
                                  }
                                  placeholder="-1 = Cheksiz"
                                  className="w-full text-sm"
                                />
                              </div>
                            </div>

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

                            {/* Feature limits editor */}
                            <div className="border-t border-b border-gray-100 dark:border-zinc-700 py-3 my-2 space-y-2">
                              <p className="text-xs font-bold text-gray-800 dark:text-zinc-200">
                                ⚙️ Funksiya Limitlari (-1 = Cheksiz/Fair Use):
                              </p>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {[
                                  { key: 'ai_chat', label: 'AI Chat (/oy)' },
                                  { key: 'irac', label: 'IRAC (/oy)' },
                                  { key: 'document_generate', label: 'Hujjat Gen (/oy)' },
                                  { key: 'document_analysis', label: 'Hujjat Tahlil (/oy)' },
                                  { key: 'virtual_court', label: 'Virtual Sud (/oy)' },
                                  { key: 'decision_tree', label: 'Qarorlar Daraxti (/oy)' },
                                  { key: 'speech_stt', label: 'STT Ovoz (/oy)' },
                                  { key: 'scenario', label: 'Senariy Gen (/oy)' },
                                ].map(f => {
                                  const curLimits = editPlanData?.limits || {}
                                  const currentVal =
                                    typeof curLimits[f.key] === 'object' &&
                                    curLimits[f.key] !== null
                                      ? curLimits[f.key].value
                                      : typeof curLimits[f.key] === 'number'
                                        ? curLimits[f.key]
                                        : plan.id === 'pro' && f.key !== 'virtual_court'
                                          ? -1
                                          : 0

                                  return (
                                    <div key={f.key} className="flex flex-col">
                                      <span className="text-[11px] text-gray-500 dark:text-zinc-400 truncate mb-0.5">
                                        {f.label}
                                      </span>
                                      <Input
                                        type="number"
                                        value={currentVal}
                                        onChange={e => {
                                          const val = Number(e.target.value)
                                          setEditPlanData(prev => {
                                            if (!prev) return null
                                            const existingLimits = prev.limits || {}
                                            return {
                                              ...prev,
                                              limits: {
                                                ...existingLimits,
                                                [f.key]: { value: val, period_type: 'monthly' },
                                              },
                                            }
                                          })
                                        }}
                                        className="h-8 text-xs font-semibold"
                                      />
                                    </div>
                                  )
                                })}
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-2">
                                📋 Xususiyatlar matni (Pricing kartalarida ko'rinadi):
                              </p>
                              {editPlanData?.features.map((f, idx) => (
                                <div key={idx} className="flex items-center gap-1 mb-1.5">
                                  <Input
                                    value={f}
                                    onChange={e => updateFeature(idx, e.target.value)}
                                    className="text-xs flex-1 h-8"
                                  />
                                  <button
                                    onClick={() => removeFeature(idx)}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={addFeatureToPlan}
                                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-1"
                              >
                                + Yangi xususiyat qo'shish
                              </button>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={savePlan}
                                className="flex-1 py-2 bg-blue-600 text-white font-medium text-xs rounded-xl hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-1"
                              >
                                <Save size={14} />
                                Saqlash
                              </button>
                              <button
                                onClick={() => setEditingPlan(null)}
                                className="px-4 py-2 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium text-xs rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-600 transition-all"
                              >
                                Bekor qilish
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col h-full justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                  {plan.name}
                                </span>
                                <button
                                  onClick={() => startEditPlan(plan)}
                                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                                  title="Tahrirlash"
                                >
                                  <Settings size={16} />
                                </button>
                              </div>

                              <div className="mb-4">
                                {(plan as any).discountPercent > 0 ? (
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-2xl font-black text-green-600">
                                        {Math.round(
                                          plan.price *
                                            (1 - ((plan as any).discountPercent || 0) / 100)
                                        ).toLocaleString()}{' '}
                                        UZS
                                      </p>
                                      <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                                        -{(plan as any).discountPercent}%
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-400 line-through">
                                      {plan.price.toLocaleString()} UZS / oy
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                    {plan.price === 0
                                      ? '0 UZS'
                                      : `${plan.price.toLocaleString()} UZS`}
                                    {plan.price > 0 && (
                                      <span className="text-xs font-normal text-gray-400 ml-1">
                                        /oy
                                      </span>
                                    )}
                                  </p>
                                )}
                                {(plan as any).discountLabel && (
                                  <p className="text-xs text-amber-600 font-medium mt-1">
                                    🏷️ {(plan as any).discountLabel}
                                  </p>
                                )}
                              </div>

                              {/* Features list */}
                              <div className="mb-4">
                                <p className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                                  Asosiy Imkoniyatlar:
                                </p>
                                <ul className="space-y-1.5">
                                  {plan.features.map((f, idx) => (
                                    <li
                                      key={idx}
                                      className="text-xs text-gray-700 dark:text-zinc-300 flex items-start gap-1.5"
                                    >
                                      <CheckCircle
                                        size={14}
                                        className="text-green-500 mt-0.5 flex-shrink-0"
                                      />
                                      <span>{f}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-gray-100 dark:border-zinc-700/60 mt-2">
                              <button
                                onClick={() => startEditPlan(plan)}
                                className="w-full py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-semibold text-xs rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                              >
                                ✏️ Tarifni va Limitlarni O'zgartirish
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
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
        {activeTab === 'court_scenarios' && <AdminCourtScenarioManager />}

        {activeTab === 'community' && (
          <Card className="card-default rounded-2xl">
            <CardContent className="p-5">
              <AdminCommunityManager />
            </CardContent>
          </Card>
        )}

        {/* ===== TEMPLATES ===== */}
        {activeTab === 'templates' && <AdminTemplateManager />}

        {/* ===== OFFICIAL BLANKS & DOCUMENTS ===== */}
        {activeTab === 'official_documents' && <AdminOfficialDocumentsManager />}

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

      {/* Payment Approval Modal */}
      {approvingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    To‘lovni tasdiqlash
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Tarif va amal qilish muddatini belgilash
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovingPayment(null)}
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* User and Payment Details Summary */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Foydalanuvchi
                  </span>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {approvingPayment.userName || 'Nomaʼlum'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                    {approvingPayment.userEmail}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Yuborilgan summa
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {Number(approvingPayment.amount || 0).toLocaleString()} UZS
                  </span>
                  {approvingPayment.receiptImage && (
                    <button
                      type="button"
                      onClick={() => setLightboxImage(approvingPayment.receiptImage)}
                      className="block text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-0.5 cursor-pointer"
                    >
                      Chekni ko‘rish
                    </button>
                  )}
                </div>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Tarif rejasi
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPlanForApproval('standart')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedPlanForApproval === 'standart'
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-2 ring-blue-600/20'
                        : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:border-gray-300 text-gray-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs uppercase">Standart</span>
                      {selectedPlanForApproval === 'standart' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-1">
                      Kengaytirilgan huquqiy yordamchi
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPlanForApproval('pro')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedPlanForApproval === 'pro'
                        ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 ring-2 ring-purple-600/20'
                        : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:border-gray-300 text-gray-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs uppercase text-purple-700 dark:text-purple-400">Pro</span>
                      {selectedPlanForApproval === 'pro' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-1">
                      Professional advokatlar uchun
                    </p>
                  </button>
                </div>
              </div>

              {/* Subscription Duration Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                    Amal qilish muddati
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Haftalik yoki oylik muddat
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'weekly', label: '1 Haftalik', sub: '7 kun' },
                    { id: 'monthly', label: '1 Oylik', sub: '30 kun' },
                    { id: '3_months', label: '3 Oylik', sub: '90 kun' },
                    { id: '6_months', label: '6 Oylik', sub: '180 kun' },
                    { id: 'yearly', label: '1 Yillik', sub: '365 kun' },
                  ].map(dur => (
                    <button
                      key={dur.id}
                      type="button"
                      onClick={() => setSelectedDuration(dur.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedDuration === dur.id
                          ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-600/20'
                          : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:border-gray-300 text-gray-700 dark:text-zinc-300'
                      }`}
                    >
                      <span className="block text-xs font-bold">{dur.label}</span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">{dur.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiration Summary Box */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
                      Yangi obuna muddati
                    </span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">
                      {(() => {
                        const d = new Date()
                        if (selectedDuration === 'weekly') d.setDate(d.getDate() + 7)
                        else if (selectedDuration === '3_months') d.setDate(d.getDate() + 90)
                        else if (selectedDuration === '6_months') d.setDate(d.getDate() + 180)
                        else if (selectedDuration === 'yearly') d.setFullYear(d.getFullYear() + 1)
                        else d.setDate(d.getDate() + 30)
                        return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })
                      })()} gacha
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-600 text-white">
                  {selectedPlanForApproval}
                </span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setApprovingPayment(null)}
                disabled={isProcessingPayment}
                className="text-xs"
              >
                Bekor qilish
              </Button>
              <Button
                type="button"
                onClick={handleConfirmApproval}
                disabled={isProcessingPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Faollashtirilmoqda...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tasdiqlash & Faollashtirish</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Rejection Modal */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    To‘lovni rad etish
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    Foydalanuvchi so‘rovi rad etiladi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-600 dark:text-zinc-300">
                <span className="font-semibold text-gray-900 dark:text-white">{rejectingPayment.userName || rejectingPayment.userEmail}</span> tomonidan yuborilgan to‘lov so‘rovini rad etmoqchimisiz?
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
                  Rad etish sababi (ixtiyoriy)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {[
                    'Chek xira yoki noaniq',
                    'Mablag‘ hisobga kelib tushmadi',
                    'Noto‘g‘ri to‘lov summasi',
                  ].map(reason => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectReason(reason)}
                      className={`px-2.5 py-1 text-[11px] rounded-lg transition-colors cursor-pointer ${
                        rejectReason === reason
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Foydalanuvchiga sababni tushuntiring..."
                  className="w-full p-3 text-xs rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectingPayment(null)}
                disabled={isProcessingPayment}
                className="text-xs"
              >
                Bekor qilish
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmReject}
                disabled={isProcessingPayment}
                className="text-xs font-bold gap-1.5"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rad etilmoqda...</span>
                  </>
                ) : (
                  <span>Rad etish</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

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
