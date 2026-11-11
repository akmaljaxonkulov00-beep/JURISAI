'use client'

import React, { useState, useEffect } from 'react'
import AdminNavigationHeader from '@/components/admin/AdminNavigationHeader'
import {
  Award,
  KeyRound,
  DollarSign,
  Settings,
  Search,
  Plus,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  CreditCard,
  RefreshCw,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  Sliders,
  AlertCircle,
  TrendingUp,
  UserCheck,
} from 'lucide-react'
import { getAuthHeaders } from '@/lib/api-auth-client'

interface LawStudent {
  id: string
  user_id?: string
  full_name: string
  university: string
  faculty: string
  study_year: number
  student_id_number: string
  level: string
  reputation_score: number
  answers_count: number
  approved_answers_count: number
  moot_court_score: number
  status: string
  email: string
  phone: string
  created_at: string
}

interface Invitation {
  id: string
  student_name: string
  university: string
  faculty: string
  study_year: number
  student_id_code: string
  invite_code: string
  status: string
  expires_at: string
  created_at: string
}

interface Payout {
  id: string
  student_id: string
  student_name: string
  amount: number
  card_number: string
  card_holder_name: string
  payment_method: string
  status: string
  admin_notes?: string
  created_at: string
}

export default function AdminLawStudentsPage() {
  const [activeTab, setActiveTab] = useState<'candidates' | 'invitations' | 'payouts' | 'settings'>('candidates')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [lawStudents, setLawStudents] = useState<LawStudent[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [financeStats, setFinanceStats] = useState({
    total_earned: 0,
    total_withdrawn: 0,
    current_balance: 0,
    pending_payouts_amount: 0,
    payouts_count: 0,
  })
  const [stats, setStats] = useState({
    total_candidates: 0,
    active_candidates: 0,
    total_invitations: 0,
    active_invitations: 0,
    pending_payouts: 0,
  })

  // Nastroykalar
  const [settings, setSettings] = useState({
    answer_reward_amount: 15000,
    min_payout_amount: 100000,
    moot_court_pass_score: 80,
    invitation_valid_days: 30,
    auto_accreditation_threshold: 50,
    require_special_code: true,
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Taklifnoma yaratish modali
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    student_name: '',
    university: 'Toshkent davlat yuridik universiteti (TDYU)',
    faculty: 'Yurisprudensiya',
    study_year: 3,
    student_id_code: '',
    days_valid: 30,
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const authHeaders = await getAuthHeaders()
      const query = new URLSearchParams()
      if (search) query.set('search', search)
      if (statusFilter !== 'all') query.set('status', statusFilter)

      const res = await fetch(`/api/admin/law-students?${query.toString()}`, {
        headers: { ...authHeaders },
      })
      const data = await res.json()
      if (data.success && data.data) {
        setLawStudents(data.data.lawStudents || [])
        setInvitations(data.data.invitations || [])
        setPayouts(data.data.payouts || [])
        if (data.data.financeStats) setFinanceStats(data.data.financeStats)
        if (data.data.stats) setStats(data.data.stats)
        if (data.data.settings) setSettings(data.data.settings)
      }
    } catch (err) {
      console.error('Yosh advokatlar ma\'lumotini yuklashda xatolik:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/law-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          action: 'create_invitation',
          ...inviteForm,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowInviteModal(false)
        setInviteForm({
          student_name: '',
          university: 'Toshkent davlat yuridik universiteti (TDYU)',
          faculty: 'Yurisprudensiya',
          study_year: 3,
          student_id_code: '',
          days_valid: 30,
        })
        loadData()
      } else {
        alert(data.error || 'Taklifnoma yaratishda xatolik yuz berdi')
      }
    } catch (err) {
      console.error('Taklifnoma xatosi:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRevokeInvite = async (invitationId: string) => {
    if (!confirm('Ushbu taklifnoma parolini bekor qilmoqchimisiz?')) return
    try {
      const authHeaders = await getAuthHeaders()
      await fetch('/api/admin/law-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          action: 'revoke_invitation',
          invitation_id: invitationId,
        }),
      })
      loadData()
    } catch (err) {
      console.error('Bekor qilishda xatolik:', err)
    }
  }

  const handleUpdatePayout = async (payoutId: string, newStatus: string) => {
    try {
      const authHeaders = await getAuthHeaders()
      await fetch('/api/admin/law-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          action: 'update_payout',
          payout_id: payoutId,
          payout_status: newStatus,
        }),
      })
      loadData()
    } catch (err) {
      console.error('Payout yangilash xatosi:', err)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSavingSettings(true)
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/law-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          action: 'save_settings',
          settings,
        }),
      })
      const data = await res.json()
      if (data.success) {
        alert('Yosh advokatlar tizimi nastroykalari saqlandi!')
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
        title="Yosh Advokatlar Boshqaruvi"
        subtitle="Advokat bo‘lmoqchi bo‘lgan talabalar, maxsus parol taklifnomalari, stajirovka va alohida mukofot tushumi nazorati"
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
        {/* Yuqori alohida statistika ko'rsatkichlari */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>Jami Nomzodlar</span>
              <Award size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-black mt-2 text-indigo-900 dark:text-indigo-200">
              {stats.total_candidates}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              {stats.active_candidates} ta faol stajyor
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>Maxsus Parollar</span>
              <KeyRound size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-black mt-2 text-amber-900 dark:text-amber-200">
              {stats.active_invitations}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Jami {stats.total_invitations} ta vaucher chiqarilgan
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>Yosh Advokatlar Mukofoti</span>
              <DollarSign size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black mt-2 text-emerald-900 dark:text-emerald-200">
              {financeStats.total_earned.toLocaleString('uz-UZ')} <span className="text-xs font-semibold">so‘m</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              {financeStats.total_withdrawn.toLocaleString('uz-UZ')} so‘m to‘lab berilgan
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>Kutilayotgan Yechishlar</span>
              <Clock size={16} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div className="text-2xl font-black mt-2 text-rose-900 dark:text-rose-200">
              {financeStats.pending_payouts_amount.toLocaleString('uz-UZ')} <span className="text-xs font-semibold">so‘m</span>
            </div>
            <div className="text-[11px] text-rose-600 font-semibold mt-1">
              {stats.pending_payouts} ta so‘rov tasdiqlashda
            </div>
          </div>
        </div>

        {/* 4 ta alohida bo'lim tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('candidates')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'candidates'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100'
              }`}
            >
              <Award size={15} />
              Yosh Advokatlar Ro‘yxati & Reytingi
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/30 text-white font-extrabold">
                {lawStudents.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'invitations'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100'
              }`}
            >
              <KeyRound size={15} />
              Maxsus Parollar & Taklifnomalar
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-extrabold">
                {invitations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'payouts'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100'
              }`}
            >
              <DollarSign size={15} />
              Yosh Advokatlar Pul Tushumi (Moliya)
              {stats.pending_payouts > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-extrabold animate-pulse">
                  {stats.pending_payouts}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100'
              }`}
            >
              <Settings size={15} />
              Yosh Advokatlar Nastroykalari
            </button>
          </div>

          {activeTab === 'invitations' && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus size={14} />
              Yangi Maxsus Parol Berish
            </button>
          )}
        </div>

        {/* 1. NOMZODLAR TABI */}
        {activeTab === 'candidates' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nomzod ismi, OTM yoki guvohnoma..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadData()}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Barcha statuslar</option>
                  <option value="active">Faol nomzodlar</option>
                  <option value="suspended">To‘xtatilganlar</option>
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Yosh Advokat (Nomzod)</th>
                      <th className="py-3 px-4">OTM & Fakultet</th>
                      <th className="py-3 px-4 text-center">Guvohnoma ID</th>
                      <th className="py-3 px-4 text-center">Daraja & XP</th>
                      <th className="py-3 px-4 text-center">Javoblar</th>
                      <th className="py-3 px-4 text-center">Virtual Sud</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {lawStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Yosh advokatlar topilmadi
                        </td>
                      </tr>
                    ) : (
                      lawStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <span>🎓⚖️</span>
                              {student.full_name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400">{student.email || 'Email kiritilmagan'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                              <Building size={12} className="text-slate-400" />
                              {student.university}
                            </div>
                            <div className="text-[11px] text-slate-500">{student.faculty} • {student.study_year}-kurs</div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            {student.student_id_number}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {student.level} • {student.reputation_score} XP
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                            {student.approved_answers_count} / {student.answers_count} ta
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              {student.moot_court_score}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {student.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 size={11} /> Faol Stajyor
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                <XCircle size={11} /> To‘xtatilgan
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                alert(`${student.full_name} ga Advokatlikka nomzodlik akkreditatsiya tavsiyanomasi berildi!`)
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
                            >
                              Tavsiyanoma
                            </button>
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

        {/* 2. MAXSUS PAROLLAR & TAKLIFNOMALAR TABI */}
        {activeTab === 'invitations' && (
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl flex items-start gap-3">
              <KeyRound size={20} className="text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
              <div className="text-xs text-indigo-900 dark:text-indigo-200">
                <span className="font-bold">Maxsus Parol Tizimi:</span> Advokat bo‘lmoqchi bo‘lgan talabalar
                ro‘yxatdan o‘tishda aynan ushbu vaucher taklifnoma parolini kiritishlari shart. Tizimga oddiy foydalanuvchilar
                o‘zboshimchalik bilan kira olmaydi. Kod bir marta ishlatilgach, uning statusi &quot;used&quot; holatiga o‘tadi.
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Talaba Ismi</th>
                      <th className="py-3 px-4">OTM & Fakultet</th>
                      <th className="py-3 px-4">Maxsus Parol (Kod)</th>
                      <th className="py-3 px-4 text-center">Amal Qilish Muddati</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {invitations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Hozircha maxsus parollar chiqarilmagan
                        </td>
                      </tr>
                    ) : (
                      invitations.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-zinc-100">
                            {inv.student_name}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-zinc-400">
                            {inv.university} • {inv.study_year}-kurs
                          </td>
                          <td className="py-3 px-4">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs border border-indigo-200 dark:border-indigo-800">
                              <span>🔑 {inv.invite_code}</span>
                              <button
                                onClick={() => handleCopy(inv.invite_code)}
                                className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-300"
                                title="Nusxa olish"
                              >
                                {copiedCode === inv.invite_code ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center text-[11px] text-slate-500">
                            {new Date(inv.expires_at).toLocaleDateString('uz-UZ')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {inv.status === 'active' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                                Faol (Kutilmoqda)
                              </span>
                            ) : inv.status === 'used' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200">
                                Ishlatilgan
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-300">
                                Bekor qilingan
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {inv.status === 'active' && (
                              <button
                                onClick={() => handleRevokeInvite(inv.id)}
                                className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              >
                                Bekor qilish
                              </button>
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
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl shadow-md space-y-1">
                <span className="text-xs text-indigo-300 font-medium">Yosh Advokatlar Hamyon Balansi</span>
                <div className="text-2xl font-black">{financeStats.current_balance.toLocaleString('uz-UZ')} so‘m</div>
                <div className="text-[11px] text-indigo-300/80">Platforma hamyonlarida qolgan jami mablag‘</div>
              </div>

              <div className="p-4 bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl shadow-md space-y-1">
                <span className="text-xs text-emerald-300 font-medium">Jami Berilgan Stajirovka Mukofotlari</span>
                <div className="text-2xl font-black">{financeStats.total_earned.toLocaleString('uz-UZ')} so‘m</div>
                <div className="text-[11px] text-emerald-300/80">To‘liq yechib olingan: {financeStats.total_withdrawn.toLocaleString('uz-UZ')} so‘m</div>
              </div>

              <div className="p-4 bg-gradient-to-br from-rose-900 to-slate-900 text-white rounded-2xl shadow-md space-y-1">
                <span className="text-xs text-rose-300 font-medium">Tasdiqlash Kutilayotgan Pul So‘rovlari</span>
                <div className="text-2xl font-black">{financeStats.pending_payouts_amount.toLocaleString('uz-UZ')} so‘m</div>
                <div className="text-[11px] text-rose-300/80">{stats.pending_payouts} ta talabaning arizasi</div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Talabalar Pul Yechib Olish So‘rovlari (Payout Requests)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Yosh Advokat</th>
                      <th className="py-3 px-4">Yechish Summasi</th>
                      <th className="py-3 px-4">Karta Raqami & Egasi</th>
                      <th className="py-3 px-4 text-center">Sana</th>
                      <th className="py-3 px-4 text-center">Holat</th>
                      <th className="py-3 px-4 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {payouts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Pul yechib olish so‘rovlari mavjud emas
                        </td>
                      </tr>
                    ) : (
                      payouts.map((payout) => (
                        <tr key={payout.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-zinc-100">
                            {payout.student_name}
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-emerald-600 dark:text-emerald-400">
                            {payout.amount.toLocaleString('uz-UZ')} so‘m
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono text-slate-800 dark:text-zinc-200">{payout.card_number}</div>
                            <div className="text-[11px] text-slate-500">{payout.card_holder_name}</div>
                          </td>
                          <td className="py-3 px-4 text-center text-[11px] text-slate-500">
                            {new Date(payout.created_at).toLocaleDateString('uz-UZ')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {payout.status === 'pending' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                                Kutilmoqda
                              </span>
                            ) : payout.status === 'paid' || payout.status === 'approved' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                                To‘langan
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
                                Rad etilgan
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {payout.status === 'pending' && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleUpdatePayout(payout.id, 'paid')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all"
                                >
                                  To‘lash
                                </button>
                                <button
                                  onClick={() => handleUpdatePayout(payout.id, 'rejected')}
                                  className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[11px] font-bold transition-all"
                                >
                                  Rad etish
                                </button>
                              </div>
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

        {/* 4. ALOHIDA NASTROYKALAR TABI */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800 mb-6">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sliders size={18} className="text-indigo-600 dark:text-indigo-400" />
                  Yosh Advokatlar Tizimi Alohida Nastroykalari
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Ushbu sozlamalar faqat advokat bo‘lmoqchi bo‘lgan talabalar tizimiga tatbiq etiladi va boshqa bo‘limlarga ta&apos;sir qilmaydi.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Fuqaro savoliga tasdiqlangan javob uchun stajirovka mukofoti (so‘m)
                  </label>
                  <input
                    type="number"
                    value={settings.answer_reward_amount}
                    onChange={(e) => setSettings({ ...settings, answer_reward_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400">Har bir muvaffaqiyatli taqrizdan o‘tgan yuridik javob uchun talabaga to‘lanadigan summa.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Minimal pul yechish chegarasi (so‘m)
                  </label>
                  <input
                    type="number"
                    value={settings.min_payout_amount}
                    onChange={(e) => setSettings({ ...settings, min_payout_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400">Talaba hamyonidan kamida qancha miqdorda pul yechib olish so‘rovi bera oladi.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Virtual Sud (Moot Court) o‘tish minimal bali (%)
                  </label>
                  <input
                    type="number"
                    value={settings.moot_court_pass_score}
                    onChange={(e) => setSettings({ ...settings, moot_court_pass_score: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400">Sud jarayoni simulyatorida tavsiyanoma olish uchun zarur bo‘lgan minimal ball.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Yangi taklifnoma paroli amal qilish muddati (kun)
                  </label>
                  <input
                    type="number"
                    value={settings.invitation_valid_days}
                    onChange={(e) => setSettings({ ...settings, invitation_valid_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400">Yaratilgan vaucher paroli necha kun davomida ro‘yxatdan o‘tishga yaroqli bo‘ladi.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  {savingSettings ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Yosh Advokatlar Nastroykalarini Saqlash
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* YANGI MAXSUS PAROL YARATISH MODALI */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <KeyRound size={16} className="text-indigo-600" />
                Yangi Maxsus Parol (Taklifnoma) Berish
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Talaba F.I.Sh. *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Azizov Jasur Botirovich"
                  value={inviteForm.student_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, student_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  OTM Nomi *
                </label>
                <input
                  type="text"
                  required
                  value={inviteForm.university}
                  onChange={(e) => setInviteForm({ ...inviteForm, university: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Kurs
                  </label>
                  <select
                    value={inviteForm.study_year}
                    onChange={(e) => setInviteForm({ ...inviteForm, study_year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs"
                  >
                    <option value={1}>1-kurs</option>
                    <option value={2}>2-kurs</option>
                    <option value={3}>3-kurs</option>
                    <option value={4}>4-kurs</option>
                    <option value={5}>Magistratura</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                    Amal qilish (kun)
                  </label>
                  <input
                    type="number"
                    value={inviteForm.days_valid}
                    onChange={(e) => setInviteForm({ ...inviteForm, days_valid: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  {actionLoading ? <RefreshCw size={13} className="animate-spin" /> : <KeyRound size={13} />}
                  Maxsus Parol Generatsiya Qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
