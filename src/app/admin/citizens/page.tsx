'use client'

import React, { useState, useEffect } from 'react'
import AdminNavigationHeader from '@/components/admin/AdminNavigationHeader'
import {
  Users,
  ShieldAlert,
  CreditCard,
  Crown,
  Search,
  Filter,
  RefreshCw,
  Lock,
  Unlock,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  MapPin,
  Mail,
  Phone,
  Sparkles,
  TrendingUp,
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
  last_login?: string
}

export default function AdminCitizensPage() {
  const [citizens, setCitizens] = useState<Citizen[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    blocked: 0,
    pro: 0,
    premium: 0,
    total_balance: 0,
  })
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

  const loadCitizens = async () => {
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
        if (data.stats) setStats(data.stats)
      }
    } catch (err) {
      console.error('Fuqarolarni yuklashda xatolik:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCitizens()
  }, [planFilter, statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadCitizens()
  }

  const handleToggleBlock = async (citizen: Citizen) => {
    const newBlockedState = !citizen.blocked
    const confirmMsg = newBlockedState
      ? `Fuqaro ${citizen.name || citizen.email} hisobini bloklashni tasdiqlaysizmi?`
      : `Fuqaro ${citizen.name || citizen.email} hisobini blokdan chiqarilsinmi?`
    if (!confirm(confirmMsg)) return

    try {
      setActionLoading(true)
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
        await loadCitizens()
      } else {
        alert(data.error || 'Xatolik yuz berdi')
      }
    } catch {
      alert('Tarmoq xatosi')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDepositBalance = async (e: React.FormEvent) => {
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
        setBalanceAmount(50000)
        await loadCitizens()
      } else {
        alert(data.error || 'Balansni yangilashda xatolik')
      }
    } catch {
      alert('Tarmoq xatosi')
    } finally {
      setActionLoading(false)
    }
  }

  const handleChangePlan = async (e: React.FormEvent) => {
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
        await loadCitizens()
      } else {
        alert(data.error || 'Tarifni yangilashda xatolik')
      }
    } catch {
      alert('Tarmoq xatosi')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 pb-16">
      <AdminNavigationHeader
        title="Fuqarolar Boshqaruvi va Nazorat Tizimi"
        subtitle="Yuridik maslahat, AI huquqiy yordamchi va hujjat yaratish xizmatidan foydalanuvchi fuqarolar hisobi"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* ── 1. Statistika vidjetlari ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-xs font-medium">
              <span>Jami Fuqarolar</span>
              <Users size={16} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Ro‘yxatdan o‘tgan</div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-sm bg-gradient-to-br from-emerald-50/40 dark:from-emerald-950/20">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <span>Faol Foydalanuvchilar</span>
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-bold mt-2 text-emerald-700 dark:text-emerald-300">
              {stats.active}
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-1">Bloklanmagan</div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-purple-200/80 dark:border-purple-900/40 shadow-sm bg-gradient-to-br from-purple-50/40 dark:from-purple-950/20">
            <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 text-xs font-medium">
              <span>Pullik Obunachilar</span>
              <Crown size={16} className="text-purple-600" />
            </div>
            <div className="text-2xl font-bold mt-2 text-purple-700 dark:text-purple-300">
              {stats.pro + stats.premium}
            </div>
            <div className="text-[11px] text-purple-600/80 mt-1">Pro & Premium</div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 shadow-sm bg-gradient-to-br from-rose-50/40 dark:from-rose-950/20">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs font-medium">
              <span>Bloklanganlar</span>
              <ShieldAlert size={16} className="text-rose-600" />
            </div>
            <div className="text-2xl font-bold mt-2 text-rose-700 dark:text-rose-300">
              {stats.blocked}
            </div>
            <div className="text-[11px] text-rose-600/80 mt-1">Kirish cheklangan</div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-xs font-medium">
              <span>Hisob Balansi</span>
              <DollarSign size={16} className="text-emerald-600" />
            </div>
            <div className="text-xl font-bold mt-2 text-slate-900 dark:text-white">
              {stats.total_balance.toLocaleString()} so‘m
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Jami depozitlar</div>
          </div>
        </div>

        {/* ── 2. Qidiruv va Filtrlash Paneli ── */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Fuqaro ismi, email yoki shahar bo‘yicha qidirish..."
              className="w-full h-10 pl-10 pr-4 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
              <Filter size={13} />
              Tarif:
            </span>
            {[
              { id: 'all', label: 'Barchasi' },
              { id: 'free', label: 'Bepul' },
              { id: 'pro', label: 'Pro' },
              { id: 'premium', label: 'Premium' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPlanFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  planFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <button
              onClick={loadCitizens}
              className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 transition-colors"
              title="Yangilash"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── 3. Fuqarolar Jadvali ── */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              Fuqarolar Ro‘yxati va Hisob Boshqaruvi ({citizens.length} nafar)
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Fuqarolar yuklanmoqda...
            </div>
          ) : citizens.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users size={40} className="mx-auto text-slate-300 dark:text-zinc-700 mb-2" />
              Mos fuqaro topilmadi
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Fuqaro</th>
                    <th className="px-4 py-3">Hudud & Aloqa</th>
                    <th className="px-4 py-3">Obuna Tarifi</th>
                    <th className="px-4 py-3">Hisob Balansi</th>
                    <th className="px-4 py-3">Holat</th>
                    <th className="px-5 py-3 text-right">Boshqaruv Amallari</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {citizens.map(c => {
                    const plan = c.subscription_plan || 'free'
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                              {(c.full_name || c.name || c.email || 'F').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {c.full_name || c.name || 'Fuqaro'}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                                <Mail size={10} />
                                {c.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-zinc-300">
                            <MapPin size={12} className="text-slate-400" />
                            {c.city || 'Toshkent'}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {c.phone || "Telefon kiritilmagan"}
                          </div>
                          {c.last_login && (
                            <div className="text-[10px] text-slate-400">
                              Kirgan: {new Date(c.last_login).toLocaleDateString('uz-UZ')}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {plan === 'premium' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                                <Crown size={12} />
                                PREMIUM
                              </span>
                            ) : plan === 'pro' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300">
                                <Sparkles size={12} />
                                PRO
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                                BEPUL
                              </span>
                            )}
                          </div>
                          {c.subscription_expires_at && (
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Calendar size={10} />
                              Gacha: {new Date(c.subscription_expires_at).toLocaleDateString('uz-UZ')}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {(c.balance || 0).toLocaleString()} so‘m
                          </div>
                          <button
                            onClick={() => {
                              setSelectedCitizen(c)
                              setShowBalanceModal(true)
                            }}
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium mt-0.5 block"
                          >
                            + Balans to‘ldirish
                          </button>
                        </td>

                        <td className="px-4 py-3.5">
                          {c.blocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                              <Lock size={11} />
                              Bloklangan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 size={11} />
                              Faol
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedCitizen(c)
                                setSelectedPlan(c.subscription_plan || 'pro')
                                setShowPlanModal(true)
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
                              title="Tarifni boshqarish"
                            >
                              Tarif
                            </button>

                            <button
                              onClick={() => handleToggleBlock(c)}
                              disabled={actionLoading}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                c.blocked
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                              }`}
                            >
                              {c.blocked ? 'Ochish' : 'Bloklash'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Balans to‘ldirish modali ── */}
      {showBalanceModal && selectedCitizen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-zinc-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="text-emerald-600" size={18} />
              Fuqaro Balansini To‘ldirish
            </h3>
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-800 dark:text-zinc-200">{selectedCitizen.name || selectedCitizen.email}</span> hisobiga mablag‘ kiritish:
            </p>
            <form onSubmit={handleDepositBalance} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Mablag‘ miqdori (so‘m)</label>
                <input
                  type="number"
                  step="5000"
                  min="5000"
                  value={balanceAmount}
                  onChange={e => setBalanceAmount(Number(e.target.value))}
                  className="w-full h-10 px-3 text-sm font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Balansni To‘ldirish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Tarifni o‘zgartirish modali ── */}
      {showPlanModal && selectedCitizen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-zinc-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Crown className="text-amber-500" size={18} />
              Obuna Tarifini Belgilash
            </h3>
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-800 dark:text-zinc-200">{selectedCitizen.name || selectedCitizen.email}</span> uchun obuna rejasini tanlang:
            </p>
            <form onSubmit={handleChangePlan} className="space-y-4">
              <div className="space-y-2">
                {[
                  { id: 'free', label: 'Bepul (Standart cheklovlar)' },
                  { id: 'pro', label: 'PRO (Cheksiz AI va hujjatlar)' },
                  { id: 'premium', label: 'PREMIUM (Advokat konsultatsiyasi + Prioritet)' },
                ].map(p => (
                  <label key={p.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800">
                    <input
                      type="radio"
                      name="plan"
                      value={p.id}
                      checked={selectedPlan === p.id}
                      onChange={() => setSelectedPlan(p.id)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-zinc-200">{p.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Tarifni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
