'use client'

import React, { useState, useEffect } from 'react'
import AdminNavigationHeader from '@/components/admin/AdminNavigationHeader'
import {
  Users,
  MessageSquare,
  DollarSign,
  Settings,
  Search,
  Filter,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  MapPin,
  Mail,
  Phone,
  Sparkles,
  Crown,
  CreditCard,
  Sliders,
  TrendingUp,
  Clock,
  HelpCircle,
} from 'lucide-react'
import { getAuthHeaders } from '@/lib/api-auth-client'

interface Citizen {
  id: string
  name?: string
  full_name?: string
  email: string
  phone?: string
  city?: string
  role?: string
  subscription_plan?: string
  subscription_expires_at?: string | null
  balance?: number
  blocked?: boolean
  created_at?: string
  profile?: any
}

interface LegalQuestion {
  id: string
  citizen_id: string
  title: string
  category: string
  status: string
  is_paid_question: boolean
  price: number
  answers_count: number
  created_at: string
}

export default function AdminCitizensPage() {
  const [activeTab, setActiveTab] = useState<'citizens' | 'questions' | 'revenue' | 'settings'>('citizens')
  const [citizens, setCitizens] = useState<Citizen[]>([])
  const [questions, setQuestions] = useState<LegalQuestion[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    blocked: 0,
    pro: 0,
    premium: 0,
    total_questions: 0,
    unresolved_questions: 0,
  })
  const [financeStats, setFinanceStats] = useState({
    total_citizen_revenue: 0,
    questions_revenue: 0,
    subscriptions_revenue: 0,
    total_balance_held: 0,
    paid_questions_count: 0,
  })

  // Nastroykalar
  const [settings, setSettings] = useState({
    free_questions_monthly: 2,
    question_price: 9900,
    express_surcharge: 15000,
    pro_monthly_price: 79000,
    premium_monthly_price: 149000,
    enable_paid_questions: true,
  })
  const [savingSettings, setSavingSettings] = useState(false)

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modallar
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null)
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [balanceAmount, setBalanceAmount] = useState<number>(50000)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const authHeaders = await getAuthHeaders()
      const query = new URLSearchParams()
      if (search) query.set('search', search)
      if (planFilter !== 'all') query.set('plan', planFilter)
      if (statusFilter !== 'all') query.set('status', statusFilter)

      const res = await fetch(`/api/admin/citizens?${query.toString()}`, {
        headers: { ...authHeaders },
      })
      const data = await res.json()
      if (data.success) {
        setCitizens(data.citizens || [])
        setQuestions(data.questions || [])
        if (data.stats) setStats(data.stats)
        if (data.financeStats) setFinanceStats(data.financeStats)
        if (data.settings) setSettings(data.settings)
      }
    } catch (err) {
      console.error('Fuqarolarni yuklashda xatolik:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [planFilter, statusFilter])

  const handleToggleBlock = async (citizen: Citizen) => {
    const newBlockedState = !citizen.blocked
    const confirmMsg = newBlockedState
      ? `${citizen.full_name || citizen.email} hisobini bloklamoqchimisiz?`
      : `${citizen.full_name || citizen.email} hisobini blokdan chiqarmoqchimisiz?`
    if (!confirm(confirmMsg)) return

    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/citizens', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          citizenId: citizen.id,
          action: 'toggle_block',
          blocked: newBlockedState,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setCitizens(prev =>
          prev.map(c => (c.id === citizen.id ? { ...c, blocked: newBlockedState } : c))
        )
      }
    } catch (err) {
      console.error('Bloklashda xatolik:', err)
    }
  }

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCitizen) return

    try {
      setActionLoading(true)
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/citizens', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          citizenId: selectedCitizen.id,
          balanceChange: balanceAmount,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowBalanceModal(false)
        setSelectedCitizen(null)
        loadData()
      }
    } catch (err) {
      console.error('Balans qo‘shishda xatolik:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCitizen) return

    try {
      setActionLoading(true)
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/citizens', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          citizenId: selectedCitizen.id,
          subscriptionPlan: selectedPlan,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowPlanModal(false)
        setSelectedCitizen(null)
        loadData()
      }
    } catch (err) {
      console.error('Tarif o‘zgartirishda xatolik:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSavingSettings(true)
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/citizens', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          action: 'save_settings',
          settings,
        }),
      })
      const data = await res.json()
      if (data.success) {
        alert('Fuqarolar tizimi nastroykalari saqlandi!')
      }
    } catch (err) {
      console.error('Nastroykalarni saqlashda xatolik:', err)
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors">
      <AdminNavigationHeader
        title="Fuqarolar Boshqaruvi"
        subtitle="Yuridik yordam oluvchi fuqarolar reyestri, yuridik savollar, alohida pul tushumlari va sozlamalar nazorati"
      >
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Yangilash
        </button>
      </AdminNavigationHeader>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Alohida Fuqaro Metrikalari */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>Jami Fuqarolar</span>
              <Users size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-black mt-2 text-blue-900 dark:text-blue-200">{stats.total}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              {stats.active} ta faol mijoz
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>Pro & Premium A&apos;zolar</span>
              <Crown size={16} className="text-amber-500 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-black mt-2 text-amber-900 dark:text-amber-200">
              {stats.pro + stats.premium}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              {stats.pro} Pro • {stats.premium} Premium
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>Fuqarolar Tushumi (Moliya)</span>
              <DollarSign size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black mt-2 text-emerald-900 dark:text-emerald-200">
              {financeStats.total_citizen_revenue.toLocaleString('uz-UZ')} <span className="text-xs font-semibold">so‘m</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              {financeStats.questions_revenue.toLocaleString('uz-UZ')} so‘m savollardan
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>Yuridik Murojaatlar</span>
              <MessageSquare size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-black mt-2 text-indigo-900 dark:text-indigo-200">
              {stats.total_questions}
            </div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-1">
              {stats.unresolved_questions} ta javob kutayotgan savol
            </div>
          </div>
        </div>

        {/* 4 ta alohida sub-tab */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('citizens')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'citizens'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100'
              }`}
            >
              <Users size={15} />
              Fuqarolar Reyestri & Hisoblari
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/30 text-white font-extrabold">
                {citizens.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'questions'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100'
              }`}
            >
              <MessageSquare size={15} />
              Yuridik Savollar & Murojaatlar
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-extrabold">
                {questions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'revenue'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100'
              }`}
            >
              <DollarSign size={15} />
              Fuqarolar Pul Tushumi (Moliya)
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100'
              }`}
            >
              <Settings size={15} />
              Fuqarolar Nastroykalari
            </button>
          </div>
        </div>

        {/* 1. FUQAROLAR REYESTRI TABI */}
        {activeTab === 'citizens' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Fuqaro ismi, email yoki shahar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadData()}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Barcha tariflar</option>
                  <option value="free">Free (Bepul)</option>
                  <option value="pro">Pro</option>
                  <option value="premium">Premium</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Barcha holatlar</option>
                  <option value="active">Faollar</option>
                  <option value="blocked">Bloklanganlar</option>
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Fuqaro (Mijoz)</th>
                      <th className="py-3 px-4">Aloqa & Shahar</th>
                      <th className="py-3 px-4 text-center">Tarif</th>
                      <th className="py-3 px-4 text-center">Hamyon Balansi</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {citizens.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Fuqarolar topilmadi
                        </td>
                      </tr>
                    ) : (
                      citizens.map((citizen) => (
                        <tr key={citizen.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <span>🏛️</span>
                              {citizen.full_name || citizen.name || 'Fuqaro'}
                            </div>
                            <div className="text-[11px] text-slate-500">{citizen.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-700 dark:text-zinc-300 font-medium">
                              {citizen.phone || 'Telefon yo‘q'}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin size={11} className="text-slate-400" />
                              {citizen.city || 'Toshkent'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {citizen.subscription_plan === 'premium' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                                ⭐ PREMIUM
                              </span>
                            ) : citizen.subscription_plan === 'pro' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200">
                                💎 PRO
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400">
                                FREE
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {(citizen.balance || 0).toLocaleString('uz-UZ')} so‘m
                          </td>
                          <td className="py-3 px-4 text-center">
                            {citizen.blocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                <Lock size={11} /> Bloklangan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <CheckCircle2 size={11} /> Faol
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedCitizen(citizen)
                                  setShowBalanceModal(true)
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg text-[11px] font-medium"
                                title="Balans to‘ldirish"
                              >
                                +Balans
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCitizen(citizen)
                                  setSelectedPlan(citizen.subscription_plan || 'pro')
                                  setShowPlanModal(true)
                                }}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-lg text-[11px] font-medium"
                                title="Tarifni boshqarish"
                              >
                                Tarif
                              </button>
                              <button
                                onClick={() => handleToggleBlock(citizen)}
                                className={`p-1 rounded-lg ${
                                  citizen.blocked
                                    ? 'text-emerald-600 hover:bg-emerald-50'
                                    : 'text-rose-600 hover:bg-rose-50'
                                }`}
                                title={citizen.blocked ? 'Ochish' : 'Bloklash'}
                              >
                                {citizen.blocked ? <Unlock size={14} /> : <Lock size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. YURIDIK SAVOLLAR & MUROJAATLAR TABI */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Fuqarolar Yuborgan Yuridik Savollar Reyestri
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Savol Mavzusi</th>
                      <th className="py-3 px-4">Yo‘nalish (Kategoriya)</th>
                      <th className="py-3 px-4 text-center">To‘lov Holati</th>
                      <th className="py-3 px-4 text-center">Javoblar</th>
                      <th className="py-3 px-4 text-center">Sana</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {questions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Hozircha fuqarolardan savollar kelib tushmagan
                        </td>
                      </tr>
                    ) : (
                      questions.map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-zinc-100">
                            {q.title}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                              {q.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {q.is_paid_question ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                                💰 9 900 so‘m to‘langan
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                                Bepul kvota
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                            {q.answers_count} ta
                          </td>
                          <td className="py-3 px-4 text-center text-[11px] text-slate-500">
                            {new Date(q.created_at).toLocaleDateString('uz-UZ')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {q.status === 'resolved' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                Hal qilingan
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                Ochiq
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. ALOHIDA PUL TUSHUMI (MOLIYA) TABI */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-2xl shadow-md space-y-1">
                <span className="text-xs text-blue-300 font-medium">Fuqarolardan Jami Pul Tushumi</span>
                <div className="text-2xl font-black">{financeStats.total_citizen_revenue.toLocaleString('uz-UZ')} so‘m</div>
                <div className="text-[11px] text-blue-300/80">Yuridik savollar va abonent to‘lovlari yig‘indisi</div>
              </div>

              <div className="p-4 bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl shadow-md space-y-1">
                <span className="text-xs text-emerald-300 font-medium">Yuridik Savollar Sotuvidan Tushum</span>
                <div className="text-2xl font-black">{financeStats.questions_revenue.toLocaleString('uz-UZ')} so‘m</div>
                <div className="text-[11px] text-emerald-300/80">{financeStats.paid_questions_count} ta 9 900 so‘mlik savol xaridi</div>
              </div>

              <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl shadow-md space-y-1">
                <span className="text-xs text-indigo-300 font-medium">Pro / Premium Obunalar Tushumi</span>
                <div className="text-2xl font-black">{financeStats.subscriptions_revenue.toLocaleString('uz-UZ')} so‘m</div>
                <div className="text-[11px] text-indigo-300/80">Oylik doimiy huquqiy xizmat obunalari</div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Fuqarolar Depozit Hamyonlari Balansi
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Platformadagi fuqarolarning jami oldindan to‘langan shaxsiy balanslari: <strong className="font-mono text-emerald-600">{financeStats.total_balance_held.toLocaleString('uz-UZ')} so‘m</strong>.
                Ushbu mablag‘lar fuqarolar tomonidan keyinchalik advokat konsultatsiyalari yoki pullik savollar uchun sarflanadi.
              </p>
            </div>
          </div>
        )}

        {/* 4. ALOHIDA NASTROYKALAR TABI */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800 mb-6">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sliders size={18} className="text-blue-600 dark:text-blue-400" />
                  Fuqarolar Tizimi Alohida Nastroykalari
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Ushbu parametrlar faqat fuqarolar bo‘limiga tegishli (savollar narxi, bepul limitlar va paketlar).
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Oylik bepul savollar limiti (dona)
                  </label>
                  <input
                    type="number"
                    value={settings.free_questions_monthly}
                    onChange={(e) => setSettings({ ...settings, free_questions_monthly: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400">Har bir fuqaroga har oy bepul beriladigan savollar soni (odatda 2 ta).</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    1 ta yuridik savol narxi (so‘m)
                  </label>
                  <input
                    type="number"
                    value={settings.question_price}
                    onChange={(e) => setSettings({ ...settings, question_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400">Bepul limit tugagach, har bitta savol uchun olinadigan to‘lov (9 900 so‘m).</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Pro ta&apos;rif oylik obuna narxi (so‘m)
                  </label>
                  <input
                    type="number"
                    value={settings.pro_monthly_price}
                    onChange={(e) => setSettings({ ...settings, pro_monthly_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400">Cheksiz tezkor AI tahlil va 10 ta yuridik savol paketi narxi.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Premium ta&apos;rif oylik obuna narxi (so‘m)
                  </label>
                  <input
                    type="number"
                    value={settings.premium_monthly_price}
                    onChange={(e) => setSettings({ ...settings, premium_monthly_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400">To‘liq advokat ko‘rigi, shaxsiy menejer va sud hujjati shablonlari narxi.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  {savingSettings ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Fuqarolar Nastroykalarini Saqlash
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* BALANS MODALI */}
      {showBalanceModal && selectedCitizen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
              Balans To‘ldirish: {selectedCitizen.full_name || selectedCitizen.email}
            </h3>
            <form onSubmit={handleAddBalance} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Qo‘shiladigan summa (so‘m)</label>
                <input
                  type="number"
                  step="10000"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
                >
                  {actionLoading ? 'Saqlanmoqda...' : 'To‘ldirish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TARIF MODALI */}
      {showPlanModal && selectedCitizen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
              Tarifni O‘zgartirish: {selectedCitizen.full_name || selectedCitizen.email}
            </h3>
            <form onSubmit={handleUpdatePlan} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Yangi ta&apos;rif rejasi</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold"
                >
                  <option value="free">Free (Bepul)</option>
                  <option value="pro">Pro (Oylik)</option>
                  <option value="premium">Premium (Oylik)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
                >
                  {actionLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
