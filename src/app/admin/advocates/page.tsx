'use client'

import React, { useState, useEffect } from 'react'
import AdminNavigationHeader from '@/components/admin/AdminNavigationHeader'
import {
  Scale,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Edit,
  Trash2,
  Award,
  DollarSign,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  Filter,
  RefreshCw,
  Calendar,
  Settings,
  TrendingUp,
  CreditCard,
  Save,
  Check,
} from 'lucide-react'
import { getAuthHeaders } from '@/lib/api-auth-client'

interface Advocate {
  id: string
  user_id?: string
  full_name: string
  phone: string
  email: string
  avatar_url?: string
  bio?: string
  specialties: string[]
  experience_years: number
  license_number: string
  bar_association: string
  verification_status: string
  verification_rejection_reason?: string
  verified_at?: string
  location_city: string
  hourly_rate: number
  rating: number
  review_count: number
  created_at: string
}

export default function AdminAdvocatesPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'appointments' | 'settings' | 'revenue'>('list')
  const [advocates, setAdvocates] = useState<Advocate[]>([])
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    suspended: 0,
    avg_rate: 0,
  })
  const [revenue, setRevenue] = useState<any>({
    gross_income: 0,
    commission_percent: 12,
    platform_profit: 0,
    paid_to_advocates: 0,
    total_consultations: 0,
    transactions: [],
  })
  const [settings, setSettings] = useState<any>({
    commission_rate: 12,
    min_hourly_rate: 100000,
    max_hourly_rate: 2000000,
    auto_approve_licenses: false,
    require_bar_document: true,
    allow_online_consultations: true,
    allow_offline_consultations: true,
    cancellation_penalty_percent: 20,
  })

  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modallar
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedAdvocate, setSelectedAdvocate] = useState<Advocate | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Yangi advokat formasi
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    license_number: '',
    bar_association: 'Toshkent shahar advokatlar palatasi',
    specialties: 'Fuqarolik huquqi, Biznes huquqi',
    experience_years: 5,
    location_city: 'Toshkent',
    hourly_rate: 200000,
    bio: '',
  })

  const loadAdvocates = async () => {
    try {
      setLoading(true)
      const authHeaders = await getAuthHeaders()
      const query = new URLSearchParams()
      if (search) query.set('search', search)
      if (statusFilter !== 'all') query.set('status', statusFilter)

      const res = await fetch(`/api/admin/advocates?${query.toString()}`, {
        headers: { ...authHeaders },
      })
      const data = await res.json()
      if (data.success) {
        setAdvocates(data.advocates || [])
        if (data.stats) setStats(data.stats)
        if (data.revenue) setRevenue(data.revenue)
        if (data.settings) setSettings(data.settings)
      }
    } catch (err) {
      console.error('Advokatlarni yuklashda xatolik:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdvocates()
  }, [statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadAdvocates()
  }

  const handleUpdateStatus = async (
    advocateId: string,
    action: 'approve' | 'reject' | 'suspend' | 'pending',
    reason?: string
  ) => {
    try {
      setActionLoading(true)
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/advocates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          advocateId,
          action,
          rejectionReason: reason,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowRejectModal(false)
        setSelectedAdvocate(null)
        setRejectReason('')
        await loadAdvocates()
      } else {
        alert(data.error || 'Xatolik yuz berdi')
      }
    } catch (err) {
      alert('Tarmoq xatosi')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSavingSettings(true)
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/advocates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ settings }),
      })
      const data = await res.json()
      if (data.success) {
        alert('Advokatlar nastroykasi muvaffaqiyatli saqlandi!')
      } else {
        alert(data.error || 'Xatolik')
      }
    } catch {
      alert('Tarmoq xatosi')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleDelete = async (advocateId: string) => {
    if (!confirm('Ushbu advokat profilini o‘chirishni tasdiqlaysizmi?')) return
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`/api/admin/advocates?id=${advocateId}`, {
        method: 'DELETE',
        headers: { ...authHeaders },
      })
      const data = await res.json()
      if (data.success) {
        loadAdvocates()
      } else {
        alert(data.error || 'O‘chirishda xatolik')
      }
    } catch {
      alert('Tarmoq xatosi')
    }
  }

  const handleCreateAdvocate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const authHeaders = await getAuthHeaders()
      const specialtiesArray = formData.specialties
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)

      const res = await fetch('/api/admin/advocates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          ...formData,
          specialties: specialtiesArray,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowCreateModal(false)
        setFormData({
          full_name: '',
          phone: '',
          email: '',
          license_number: '',
          bar_association: 'Toshkent shahar advokatlar palatasi',
          specialties: 'Fuqarolik huquqi, Biznes huquqi',
          experience_years: 5,
          location_city: 'Toshkent',
          hourly_rate: 200000,
          bio: '',
        })
        loadAdvocates()
      } else {
        alert(data.error || 'Qo‘shishda xatolik')
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
        title="Advokatlar Boshqaruvi va Litsenziya Nazorati"
        subtitle="Advokatlar reyestri, verifikatsiya, qabullar, nastroykalar va alohida pul tushumi hisobi"
      >
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus size={14} />
          Yangi Advokat Qo‘shish
        </button>
      </AdminNavigationHeader>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* ── 1. Statistika vidjetlari ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-xs font-medium">
              <span>Jami Advokatlar</span>
              <Scale size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Platformada ro‘yxatda</div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-sm bg-gradient-to-br from-emerald-50/40 dark:from-emerald-950/20">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <span>Tasdiqlangan Litsenziya</span>
              <ShieldCheck size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-bold mt-2 text-emerald-700 dark:text-emerald-300">
              {stats.approved}
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-1">Amaliyotda faol</div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-sm bg-gradient-to-br from-amber-50/40 dark:from-amber-950/20">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-medium">
              <span>Kutilayotgan Arizalar</span>
              <Clock size={16} className="text-amber-600" />
            </div>
            <div className="text-2xl font-bold mt-2 text-amber-700 dark:text-amber-300">
              {stats.pending}
            </div>
            <div className="text-[11px] text-amber-600/80 mt-1">Tekshiruv kutilmoqda</div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-purple-200/80 dark:border-purple-900/40 shadow-sm bg-gradient-to-br from-purple-50/40 dark:from-purple-950/20">
            <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 text-xs font-medium">
              <span>Platforma Komissiyasi</span>
              <TrendingUp size={16} className="text-purple-600" />
            </div>
            <div className="text-xl font-bold mt-2 text-purple-700 dark:text-purple-300">
              {(revenue.platform_profit || 0).toLocaleString()} so‘m
            </div>
            <div className="text-[11px] text-purple-600/80 mt-1">{settings.commission_rate}% komissiya tushumi</div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-xs font-medium">
              <span>O‘rtacha Stavka</span>
              <DollarSign size={16} className="text-blue-600" />
            </div>
            <div className="text-xl font-bold mt-2 text-slate-900 dark:text-white">
              {stats.avg_rate.toLocaleString()} so‘m
            </div>
            <div className="text-[11px] text-slate-500 mt-1">1 soatlik xizmat</div>
          </div>
        </div>

        {/* ── 2. Ichki Bo‘limlar (Tabs) ── */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-zinc-900 rounded-xl max-w-fit">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'list'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <Scale size={15} />
            Advokatlar Ro‘yxati & Litsenziyalar ({advocates.length})
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'appointments'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <Calendar size={15} />
            Qabullar & Konsultatsiyalar ({revenue.total_consultations})
          </button>

          <button
            onClick={() => setActiveTab('revenue')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'revenue'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <CreditCard size={15} />
            Advokatlar Pul Tushumi (Moliya)
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <Settings size={15} />
            Advokatlar Nastroykasi
          </button>
        </div>

        {/* ── 3. Tab 1: Advokatlar Ro‘yxati ── */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {/* Qidiruv va Filter */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="F.I.Sh., Litsenziya raqami, shahar yoki soha bo‘yicha..."
                  className="w-full h-10 pl-10 pr-4 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </form>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
                  <Filter size={13} />
                  Holat:
                </span>
                {[
                  { id: 'all', label: 'Barchasi' },
                  { id: 'approved', label: 'Tasdiqlangan' },
                  { id: 'pending', label: 'Kutilayotgan' },
                  { id: 'suspended', label: 'To‘xtatilgan' },
                  { id: 'rejected', label: 'Rad etilgan' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      statusFilter === tab.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                <button
                  onClick={loadAdvocates}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 transition-colors"
                  title="Yangilash"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Jadval */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <Award size={16} className="text-indigo-600" />
                  Advokatlar Ro‘yxati va Litsenziyalar ({advocates.length} nafar)
                </h2>
              </div>

              {loading ? (
                <div className="p-12 text-center text-slate-400">Yuklanmoqda...</div>
              ) : advocates.length === 0 ? (
                <div className="p-12 text-center text-slate-400">Mos advokat topilmadi</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3">Advokat</th>
                        <th className="px-4 py-3">Litsenziya & Palata</th>
                        <th className="px-4 py-3">Ixtisoslik & Hudud</th>
                        <th className="px-4 py-3">Stavka / Narx</th>
                        <th className="px-4 py-3">Holat</th>
                        <th className="px-5 py-3 text-right">Amallar & Nazorat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {advocates.map(adv => (
                        <tr key={adv.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center flex-shrink-0 text-sm overflow-hidden">
                                {adv.avatar_url ? (
                                  <img src={adv.avatar_url} alt={adv.full_name} className="w-full h-full object-cover" />
                                ) : (
                                  adv.full_name?.slice(0, 2).toUpperCase() || 'AD'
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  {adv.full_name}
                                  {(adv.verification_status === 'approved' || adv.verification_status === 'verified') && (
                                    <span title="Tasdiqlangan advokat">
                                      <ShieldCheck size={14} className="text-emerald-600" />
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                                  {adv.phone && <span className="flex items-center gap-1"><Phone size={10} />{adv.phone}</span>}
                                  {adv.email && <span className="flex items-center gap-1"><Mail size={10} />{adv.email}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-mono font-semibold text-indigo-700 dark:text-indigo-300 text-xs">
                              {adv.license_number || 'ADV-UZ-000000'}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 max-w-[200px] truncate" title={adv.bar_association}>
                              {adv.bar_association || 'Advokatlar palatasi'}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Amaliyot staji: <span className="font-semibold text-slate-700 dark:text-zinc-300">{adv.experience_years || 1} yil</span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {(adv.specialties || ['Umumiy amaliyot']).slice(0, 2).map((s, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                  {s}
                                </span>
                              ))}
                              {(adv.specialties || []).length > 2 && (
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-500">
                                  +{adv.specialties.length - 2}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin size={11} className="text-slate-400" />
                              {adv.location_city || 'Toshkent'}
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {(adv.hourly_rate || 200000).toLocaleString()} so‘m
                            </div>
                            <div className="text-[10px] text-slate-400">soatiga</div>
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                              ★ {adv.rating || 5.0} ({adv.review_count || 0})
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            {adv.verification_status === 'approved' || adv.verification_status === 'verified' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                <CheckCircle2 size={12} />
                                Tasdiqlangan
                              </span>
                            ) : adv.verification_status === 'pending' || !adv.verification_status ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                                <Clock size={12} />
                                Kutilmoqda
                              </span>
                            ) : adv.verification_status === 'suspended' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                                <PauseCircle size={12} />
                                To‘xtatilgan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300">
                                <XCircle size={12} />
                                Rad etilgan
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {adv.verification_status !== 'approved' && adv.verification_status !== 'verified' && (
                                <button
                                  onClick={() => handleUpdateStatus(adv.id, 'approve')}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                                  title="Litsenziyani tasdiqlash"
                                >
                                  Tasdiqlash
                                </button>
                              )}

                              {adv.verification_status === 'approved' && (
                                <button
                                  onClick={() => handleUpdateStatus(adv.id, 'suspend')}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                                  title="Litsenziyani to‘xtatish"
                                >
                                  To‘xtatish
                                </button>
                              )}

                              {adv.verification_status !== 'rejected' && (
                                <button
                                  onClick={() => {
                                    setSelectedAdvocate(adv)
                                    setShowRejectModal(true)
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950/40 dark:text-rose-300 transition-colors"
                                  title="Rad etish"
                                >
                                  Rad etish
                                </button>
                              )}

                              <button
                                onClick={() => handleDelete(adv.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                                title="O‘chirish"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 4. Tab 2: Qabullar va Konsultatsiyalar ── */}
        {activeTab === 'appointments' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="text-indigo-600" size={18} />
              Mijozlar bilan Qabullar va Konsultatsiyalar Nazorati ({revenue.total_consultations} ta)
            </h3>
            <p className="text-xs text-slate-500">
              Platforma orqali fuqarolar tomonidan advokatlarga buyurtma qilingan onlayn va oflayn qabullar holati.
            </p>

            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {revenue.transactions.map((tx: any) => (
                <div key={tx.id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      {tx.advocate.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {tx.advocate} ↔ <span className="text-slate-600 dark:text-zinc-400">{tx.client}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{tx.service}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{tx.amount.toLocaleString()} so‘m</div>
                    <div className="text-[10px] text-emerald-600 font-medium">Komissiya: {tx.commission.toLocaleString()} so‘m</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 5. Tab 3: Pul Tushumi (Moliya) ── */}
        {activeTab === 'revenue' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="text-emerald-600" size={18} />
                  Advokatlar Bo‘yicha Alohida Pul Tushumi va Moliyaviy Hisob
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Boshqa bo‘limlarga aralashmagan holda, faqat advokatlik xizmatlari va konsultatsiyalardan olingan tushumlar
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40">
                <div className="text-xs text-slate-500">Jami Xizmatlar Aylanishi</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {(revenue.gross_income || 0).toLocaleString()} so‘m
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Fuqarolar to‘lagan jami summa</div>
              </div>

              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20">
                <div className="text-xs text-purple-700 dark:text-purple-400 font-semibold">Platforma Sof Foydasi ({settings.commission_rate}%)</div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                  {(revenue.platform_profit || 0).toLocaleString()} so‘m
                </div>
                <div className="text-[11px] text-purple-600/80 mt-1">Platforma komissiya daromadi</div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">Advokatlarga Chiqarilgan Summa</div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  {(revenue.paid_to_advocates || 0).toLocaleString()} so‘m
                </div>
                <div className="text-[11px] text-emerald-600/80 mt-1">Advokatlar hisobiga o‘tkazilgan</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider mb-3">
                So‘nggi To‘lov Tranzaksiyalari (Advokatlar bo‘yicha)
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {revenue.transactions.map((tx: any) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-semibold text-slate-500 mr-2">{tx.id}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{tx.advocate}</span>
                      <span className="text-slate-400 mx-2">•</span>
                      <span className="text-slate-600 dark:text-zinc-400">{tx.service}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-900 dark:text-white">{tx.amount.toLocaleString()} so‘m</span>
                      <span className="text-emerald-600 font-semibold">+{tx.commission.toLocaleString()} so‘m</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">To‘landi</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 6. Tab 4: Advokatlar Nastroykasi ── */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Settings className="text-indigo-600" size={18} />
                  Advokatlar Tizimi Nastroykalari va Qoidalari
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Faqat advokatlik faoliyatiga taalluqli bo‘lgan stavkalar, komissiyalar va litsenziya qoidalarini boshqarish
                </p>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                <Save size={14} />
                {savingSettings ? 'Saqlanmoqda...' : 'Nastroykani Saqlash'}
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                    Platforma Komissiya Stavkasi (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.commission_rate}
                    onChange={e => setSettings({ ...settings, commission_rate: Number(e.target.value) })}
                    className="w-full h-10 px-3 font-bold rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Har bir to‘langan konsultatsiyadan platforma ushlab qoladigan foiz.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                    Minimal 1 Soatlik Xizmat Narxi (so‘m)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    value={settings.min_hourly_rate}
                    onChange={e => setSettings({ ...settings, min_hourly_rate: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                    Bekor Qilish Jarimasi (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.cancellation_penalty_percent}
                    onChange={e => setSettings({ ...settings, cancellation_penalty_percent: Number(e.target.value) })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Mijoz 2 soatdan kam vaqt qolganda bekor qilsa qo‘llaniladigan jarima.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 space-y-3">
                  <h4 className="font-semibold text-slate-800 dark:text-zinc-200">Verifikatsiya va Qabul Qoidalari</h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.require_bar_document}
                      onChange={e => setSettings({ ...settings, require_bar_document: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Advokatlar palatasi guvohnomasini yuklash majburiy</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allow_online_consultations}
                      onChange={e => setSettings({ ...settings, allow_online_consultations: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Onlayn video va chat konsultatsiyalarga ruxsat berish</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allow_offline_consultations}
                      onChange={e => setSettings({ ...settings, allow_offline_consultations: e.target.checked })}
                      className="rounded text-indigo-600"
                    />
                    <span>Oflayn (Advokatlik byurosida) qabullarga ruxsat berish</span>
                  </label>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ── Rad etish modali ── */}
      {showRejectModal && selectedAdvocate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-zinc-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="text-rose-600" size={18} />
              Advokat arizasini rad etish
            </h3>
            <p className="text-xs text-slate-500">
              Advokat <span className="font-semibold text-slate-800 dark:text-zinc-200">{selectedAdvocate.full_name}</span> arizasini rad etish sababini kiriting:
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Masalan: Litsenziya hujjati muddati o‘tgan yoki Palata reyestrida tasdiqlanmadi..."
              rows={3}
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedAdvocate.id, 'reject', rejectReason)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Rad etishni tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Yangi advokat qo‘shish modali ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-zinc-800 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="text-indigo-600" size={18} />
              Yangi Advokat Profilini Ro‘yxatga Olish
            </h3>
            <form onSubmit={handleCreateAdvocate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Advokat F.I.Sh. *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Masalan: Azizov Sardor Bahodirovich"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Telefon *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+998 90 123 45 67"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="advokat@juristiv.uz"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Litsenziya Raqami *</label>
                  <input
                    type="text"
                    required
                    value={formData.license_number}
                    onChange={e => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="ADV-UZ-001234"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Amaliyot Staji (yil)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.experience_years}
                    onChange={e => setFormData({ ...formData, experience_years: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Advokatlar Palatasi Bo‘linmasi *</label>
                <input
                  type="text"
                  required
                  value={formData.bar_association}
                  onChange={e => setFormData({ ...formData, bar_association: e.target.value })}
                  placeholder="Toshkent shahar advokatlar palatasi"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Shahar / Hudud</label>
                  <input
                    type="text"
                    value={formData.location_city}
                    onChange={e => setFormData({ ...formData, location_city: e.target.value })}
                    placeholder="Toshkent"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">1 soatlik stavka (so‘m)</label>
                  <input
                    type="number"
                    step="10000"
                    value={formData.hourly_rate}
                    onChange={e => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Ixtisosliklar (vergul bilan)</label>
                <input
                  type="text"
                  value={formData.specialties}
                  onChange={e => setFormData({ ...formData, specialties: e.target.value })}
                  placeholder="Fuqarolik huquqi, Biznes va shartnomalar, Oila huquqi"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Qisqacha Ma’lumot / Bio</label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tajribasi, yutgan sud ishlari haqida qisqacha..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  Advokatni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
