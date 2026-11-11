'use client'

import React, { useState, useEffect } from 'react'
import AdminNavigationHeader from '@/components/admin/AdminNavigationHeader'
import {
  GraduationCap,
  Award,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
  Copy,
  Building,
  CreditCard,
  FileCheck,
  BarChart3,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { getAuthHeaders } from '@/lib/api-auth-client'

interface Student {
  id: string
  user_id?: string
  full_name: string
  university: string
  faculty: string
  study_year: number
  student_id_number: string
  verification_status: string
  email: string
  phone: string
  court_cases_count: number
  moot_court_score: number
  answers_count: number
  irac_score: number
  certificate_issued: boolean
  created_at: string
}

interface Invitation {
  id: string
  student_name: string
  university: string
  faculty?: string
  study_year?: number
  student_id_code: string
  invite_code: string
  status: string
  created_at: string
}

interface Payout {
  id: string
  student_id: string
  amount: number
  card_number: string
  card_holder: string
  status: string
  created_at: string
}

export default function AdminStudentsPage() {
  const [activeTab, setActiveTab] = useState<'students' | 'invitations' | 'certificates' | 'payouts'>('students')
  const [students, setStudents] = useState<Student[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    certified: 0,
    invitations_count: 0,
    pending_payouts: 0,
    avg_score: 88,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Yangi taklifnoma yaratish modali
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    studentName: '',
    university: 'Toshkent davlat yuridik universiteti (TDYU)',
    faculty: 'Yurisprudensiya',
    studyYear: 3,
    studentIdCode: '',
    email: '',
    phone: '',
  })
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const authHeaders = await getAuthHeaders()
      const query = new URLSearchParams()
      if (search) query.set('search', search)

      const res = await fetch(`/api/admin/students?${query.toString()}`, {
        headers: { ...authHeaders },
      })
      const data = await res.json()
      if (data.success) {
        setStudents(data.students || [])
        setInvitations(data.invitations || [])
        setPayouts(data.payouts || [])
        if (data.stats) setStats(data.stats)
      }
    } catch (err) {
      console.error('Talabalar ma’lumotlarini yuklashda xatolik:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleToggleCertificate = async (studentId: string, currentStatus: boolean) => {
    try {
      setActionLoading(true)
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          studentId,
          action: 'issue_certificate',
          certificateIssued: !currentStatus,
        }),
      })
      const data = await res.json()
      if (data.success) {
        await loadData()
      } else {
        alert(data.error || 'Sertifikat holatini o‘zgartirishda xatolik')
      }
    } catch {
      alert('Tarmoq xatosi')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(inviteForm),
      })
      const data = await res.json()
      if (data.success) {
        setShowInviteModal(false)
        setInviteForm({
          studentName: '',
          university: 'Toshkent davlat yuridik universiteti (TDYU)',
          faculty: 'Yurisprudensiya',
          studyYear: 3,
          studentIdCode: '',
          email: '',
          phone: '',
        })
        await loadData()
      } else {
        alert(data.error || 'Taklifnoma yaratishda xatolik')
      }
    } catch {
      alert('Tarmoq xatosi')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 pb-16">
      <AdminNavigationHeader
        title="Yurist-Talabalar va Advokatlikka Nomzodlar Nazorati"
        subtitle="OTM talabalari, stajyorlar, sud zali simulyatori (Moot court) natijalari va akkreditatsiya reyestri"
      >
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus size={14} />
          Yangi Stajyor Taklifnomasi
        </button>
      </AdminNavigationHeader>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* ── 1. Statistika vidjetlari ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-xs font-medium">
              <span>Jami Talabalar</span>
              <GraduationCap size={16} className="text-indigo-600" />
            </div>
            <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Ro‘yxatdan o‘tgan</div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-sm bg-gradient-to-br from-emerald-50/40 dark:from-emerald-950/20">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <span>Sertifikatlangan</span>
              <Award size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-bold mt-2 text-emerald-700 dark:text-emerald-300">
              {stats.certified}
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-1">Advokatlikka tavsiyanoma</div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 shadow-sm bg-gradient-to-br from-blue-50/40 dark:from-blue-950/20">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-xs font-medium">
              <span>O‘rtacha Simulyator Bali</span>
              <BarChart3 size={16} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold mt-2 text-blue-700 dark:text-blue-300">
              {stats.avg_score} / 100
            </div>
            <div className="text-[11px] text-blue-600/80 mt-1">Moot Court amaliyoti</div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-sm bg-gradient-to-br from-amber-50/40 dark:from-amber-950/20">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-medium">
              <span>Taklifnomalar</span>
              <KeyRound size={16} className="text-amber-600" />
            </div>
            <div className="text-2xl font-bold mt-2 text-amber-700 dark:text-amber-300">
              {stats.invitations_count}
            </div>
            <div className="text-[11px] text-amber-600/80 mt-1">Vaucher kodlar</div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-xs font-medium">
              <span>Kutilayotgan Mukofot</span>
              <CreditCard size={16} className="text-purple-600" />
            </div>
            <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
              {stats.pending_payouts}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Payout so‘rovlari</div>
          </div>
        </div>

        {/* ── 2. Ichki Bo‘limlar (Tabs) ── */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-zinc-900 rounded-xl max-w-fit">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'students'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <GraduationCap size={15} />
            Talabalar va Sud Amaliyoti ({students.length})
          </button>

          <button
            onClick={() => setActiveTab('invitations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'invitations'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <KeyRound size={15} />
            Taklifnomalar va Kodlar ({invitations.length})
          </button>

          <button
            onClick={() => setActiveTab('certificates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'certificates'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <Award size={15} />
            Sertifikat va Tavsiyanomalar ({stats.certified})
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'payouts'
                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
            }`}
          >
            <CreditCard size={15} />
            Mukofotlar ({payouts.length})
          </button>
        </div>

        {/* ── 3. Tab 1: Talabalar va Sud Amaliyoti ── */}
        {activeTab === 'students' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                <GraduationCap size={16} className="text-indigo-600" />
                Yurist-Talabalar va Nomzodlar Ro‘yxati
              </h2>
              <button
                onClick={loadData}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 hover:bg-slate-200"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">Yuklanmoqda...</div>
            ) : students.length === 0 ? (
              <div className="p-12 text-center text-slate-400">Talabalar topilmadi</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3">Talaba</th>
                      <th className="px-4 py-3">OTM & Fakultet</th>
                      <th className="px-4 py-3">Sud Simulyatori (Moot Court)</th>
                      <th className="px-4 py-3">Kazus Yechish (IRAC)</th>
                      <th className="px-4 py-3">Tavsiyanoma</th>
                      <th className="px-5 py-3 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {students.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {s.full_name}
                            {s.certificate_issued && (
                              <span title="Sertifikatlangan nomzod">
                                <Award size={14} className="text-emerald-600" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {s.student_id_number}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {s.email}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-800 dark:text-zinc-200">
                            {s.university}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {s.faculty} • <span className="font-medium text-slate-700 dark:text-zinc-300">{s.study_year}-kurs</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-700 dark:text-indigo-300">
                              {s.moot_court_score || 85} ball
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                              {s.court_cases_count || 4} ta sud
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Sudya / Advokat / Prokuror
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-bold text-emerald-700 dark:text-emerald-400">
                            {s.irac_score || 90}% aniqlik
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {s.answers_count || 10} ta tahliliy javob
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          {s.certificate_issued ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 size={12} />
                              Berilgan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-500">
                              Kutilmoqda
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleToggleCertificate(s.id, s.certificate_issued)}
                            disabled={actionLoading}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              s.certificate_issued
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                            }`}
                          >
                            {s.certificate_issued ? 'Bekor qilish' : 'Tavsiyanoma Berish'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 4. Tab 2: Taklifnomalar va Kodlar ── */}
        {activeTab === 'invitations' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                <KeyRound size={16} className="text-amber-500" />
                Stajyorlar Taklifnomalari va Vaucher Kodlari ({invitations.length} ta)
              </h2>
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              >
                <Plus size={13} />
                Yangi Taklifnoma
              </button>
            </div>

            {invitations.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                Taklifnomalar mavjud emas. Yuqoridagi tugma orqali yarating.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3">Talaba F.I.Sh.</th>
                      <th className="px-4 py-3">OTM & ID Kod</th>
                      <th className="px-4 py-3">Taklifnoma Kodi (Vaucher)</th>
                      <th className="px-4 py-3">Holat</th>
                      <th className="px-4 py-3">Yaratilgan Sana</th>
                      <th className="px-5 py-3 text-right">Nusxalash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {invitations.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                          {inv.student_name}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-700 dark:text-zinc-300">{inv.university}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{inv.student_id_code}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-800/40">
                            {inv.invite_code}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {inv.status === 'claimed' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              <Check size={11} />
                              Faollashtirilgan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                              <Clock size={11} />
                              Kutilmoqda
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {new Date(inv.created_at).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleCopy(inv.invite_code)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 transition-colors"
                          >
                            <Copy size={12} />
                            {copiedCode === inv.invite_code ? 'Nusxalandi!' : 'Kodni nusxalash'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 5. Tab 3: Sertifikat va Tavsiyanomalar ── */}
        {activeTab === 'certificates' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="text-emerald-600" size={18} />
                  Advokatlik Palatasiga Tavsiyanomalar va Moot Court Sertifikatlari
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sud simulyatorida kamida 4 ta ishda qatnashib 80+ ball to‘plagan talabalarga rasmiy tavsiyanoma beriladi.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.filter(s => s.certificate_issued).map(s => (
                <div key={s.id} className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded">
                      AKKREDITATSIYA TASDIQLANGAN
                    </span>
                    <ShieldCheck className="text-emerald-600" size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{s.full_name}</h4>
                    <p className="text-xs text-slate-500">{s.university} • {s.faculty}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {s.student_id_number}</p>
                  </div>
                  <div className="pt-2 border-t border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600 dark:text-zinc-400">Sud zali bali:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">{s.moot_court_score}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 6. Tab 4: Mukofotlar (Payouts) ── */}
        {activeTab === 'payouts' && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="text-purple-600" size={18} />
              Talabalar Mukofotlari va Hisob-kitoblar ({payouts.length})
            </h3>
            <p className="text-xs text-slate-500">
              Yuridik kazuslarni yechish va fuqarolarga bepul yuridik ko‘mak berish orqali to‘plangan rag‘batlantirish mablag‘lari.
            </p>

            {payouts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                Hozircha faol to‘lov so‘rovi yo‘q
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Talaba</th>
                      <th className="px-4 py-2.5">Miqdor</th>
                      <th className="px-4 py-2.5">Karta</th>
                      <th className="px-4 py-2.5">Holat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map(p => (
                      <tr key={p.id} className="border-t">
                        <td className="px-4 py-2.5 font-bold">{p.card_holder || p.student_id}</td>
                        <td className="px-4 py-2.5 font-bold text-emerald-600">{(p.amount || 0).toLocaleString()} so‘m</td>
                        <td className="px-4 py-2.5 font-mono">{p.card_number}</td>
                        <td className="px-4 py-2.5 font-semibold text-amber-600">{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Yangi taklifnoma modali ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-zinc-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="text-indigo-600" size={18} />
              Yangi Stajyor Taklifnomasi Yaratish
            </h3>
            <form onSubmit={handleCreateInvite} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Talaba F.I.Sh. *</label>
                <input
                  type="text"
                  required
                  value={inviteForm.studentName}
                  onChange={e => setInviteForm({ ...inviteForm, studentName: e.target.value })}
                  placeholder="Masalan: Qodirov Jamshid"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">OTM Nomi *</label>
                <input
                  type="text"
                  required
                  value={inviteForm.university}
                  onChange={e => setInviteForm({ ...inviteForm, university: e.target.value })}
                  placeholder="TDYU, JIDU, O‘zMU..."
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Fakultet</label>
                  <input
                    type="text"
                    value={inviteForm.faculty}
                    onChange={e => setInviteForm({ ...inviteForm, faculty: e.target.value })}
                    placeholder="Xususiy huquq"
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Kurs</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={inviteForm.studyYear}
                    onChange={e => setInviteForm({ ...inviteForm, studyYear: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">Talabalik Guvohnomasi / Reyestr Kodi</label>
                <input
                  type="text"
                  value={inviteForm.studentIdCode}
                  onChange={e => setInviteForm({ ...inviteForm, studentIdCode: e.target.value })}
                  placeholder="ID-984210"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  Taklifnoma Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
