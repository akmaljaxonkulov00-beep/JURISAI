'use client'

import React, { useState, useEffect } from 'react'
import AdminNavigationHeader from '@/components/admin/AdminNavigationHeader'
import {
  GraduationCap,
  BookOpen,
  DollarSign,
  Settings,
  Search,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Building,
  Mail,
  Phone,
  Sparkles,
  Sliders,
  Award,
  FileText,
} from 'lucide-react'
import { getAuthHeaders } from '@/lib/api-auth-client'

interface Student {
  id: string
  user_id?: string
  full_name: string
  university: string
  faculty: string
  study_year: number
  email: string
  phone: string
  tests_completed: number
  avg_exam_score: number
  subscription_plan: string
  blocked: boolean
  created_at: string
}

export default function AdminStudentsPage() {
  const [activeTab, setActiveTab] = useState<'students' | 'tests' | 'revenue' | 'settings'>('students')
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    blocked: 0,
    paid_subscribers: 0,
    avg_score: 76,
  })
  const [financeStats, setFinanceStats] = useState({
    total_student_revenue: 0,
    active_student_subscriptions: 0,
    monthly_price: 49000,
    exam_packs_revenue: 0,
  })

  // Nastroykalar
  const [settings, setSettings] = useState({
    daily_free_tests: 5,
    exam_pass_score: 70,
    monthly_student_price: 49000,
    ai_tutor_limit_daily: 20,
    enable_discount_mode: true,
  })
  const [savingSettings, setSavingSettings] = useState(false)

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadData = async () => {
    try {
      setLoading(true)
      const authHeaders = await getAuthHeaders()
      const query = new URLSearchParams()
      if (search) query.set('search', search)
      if (statusFilter !== 'all') query.set('status', statusFilter)

      const res = await fetch(`/api/admin/students?${query.toString()}`, {
        headers: { ...authHeaders },
      })
      const data = await res.json()
      if (data.success) {
        setStudents(data.students || [])
        if (data.stats) setStats(data.stats)
        if (data.financeStats) setFinanceStats(data.financeStats)
        if (data.settings) setSettings(data.settings)
      }
    } catch (err) {
      console.error('Umumiy talabalarni yuklashda xatolik:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const handleToggleBlock = async (student: Student) => {
    const newBlockedState = !student.blocked
    if (!confirm(`${student.full_name} talaba hisobini ${newBlockedState ? 'bloklamoqchimisiz' : 'ochmoqchimisiz'}?`)) return

    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          action: 'toggle_block',
          studentId: student.id,
          blocked: newBlockedState,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStudents(prev =>
          prev.map(s => (s.id === student.id ? { ...s, blocked: newBlockedState } : s))
        )
      }
    } catch (err) {
      console.error('Bloklash xatosi:', err)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSavingSettings(true)
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          action: 'save_settings',
          settings,
        }),
      })
      const data = await res.json()
      if (data.success) {
        alert('Talabalar tizimi nastroykalari saqlandi!')
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
        title="Umumiy Talabalar Boshqaruvi"
        subtitle="Universitet va ta’lim muassasalari talabalari, testlar bazasi, o‘quv obunalari va alohida tushum nazorati"
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
        {/* Alohida Talaba Metrikalari */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>Umumiy Talabalar</span>
              <GraduationCap size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-black mt-2 text-amber-900 dark:text-amber-200">{stats.total}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              {stats.active} ta faol o‘quvchi
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>Talabalar Tushumi (Moliya)</span>
              <DollarSign size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black mt-2 text-emerald-900 dark:text-emerald-200">
              {financeStats.total_student_revenue.toLocaleString('uz-UZ')} <span className="text-xs font-semibold">so‘m</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              {financeStats.active_student_subscriptions} ta oylik obunachi
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>O‘rtacha Imtihon Bali</span>
              <Award size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-black mt-2 text-blue-900 dark:text-blue-200">
              {stats.avg_score}%
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              O‘tish chegarasi: {settings.exam_pass_score}%
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>Kunlik Test Limiti</span>
              <BookOpen size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-black mt-2 text-indigo-900 dark:text-indigo-200">
              {settings.daily_free_tests} ta
            </div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-1">
              Bepul test yechish imkoni
            </div>
          </div>
        </div>

        {/* 4 ta alohida sub-tab */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'students'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100'
              }`}
            >
              <GraduationCap size={15} />
              Umumiy Talabalar Ro‘yxati
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/30 text-white font-extrabold">
                {students.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tests')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'tests'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100'
              }`}
            >
              <BookOpen size={15} />
              Yuridik Testlar & Imtihonlar
            </button>

            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'revenue'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100'
              }`}
            >
              <DollarSign size={15} />
              Talabalar Pul Tushumi (Moliya)
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100'
              }`}
            >
              <Settings size={15} />
              Talabalar Nastroykalari
            </button>
          </div>
        </div>

        {/* 1. TALABALAR RO'YXATI */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Talaba ismi, email yoki OTM..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadData()}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">Barcha holatlar</option>
                  <option value="active">Faol talabalar</option>
                  <option value="blocked">Bloklanganlar</option>
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Talaba (O‘quvchi)</th>
                      <th className="py-3 px-4">Ta’lim Muassasasi</th>
                      <th className="py-3 px-4 text-center">Topshirilgan Testlar</th>
                      <th className="py-3 px-4 text-center">O‘rtacha Natija</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Umumiy talabalar topilmadi
                        </td>
                      </tr>
                    ) : (
                      students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <span>📚</span>
                              {student.full_name}
                            </div>
                            <div className="text-[11px] text-slate-500">{student.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                              <Building size={12} className="text-slate-400" />
                              {student.university}
                            </div>
                            <div className="text-[11px] text-slate-500">{student.faculty} • {student.study_year}-kurs</div>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-amber-600 dark:text-amber-400">
                            {student.tests_completed} ta
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                              {student.avg_exam_score}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {student.blocked ? (
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
                            <button
                              onClick={() => handleToggleBlock(student)}
                              className={`p-1.5 rounded-lg text-xs font-semibold ${
                                student.blocked
                                  ? 'text-emerald-600 hover:bg-emerald-50'
                                  : 'text-rose-600 hover:bg-rose-50'
                              }`}
                              title={student.blocked ? 'Ochish' : 'Bloklash'}
                            >
                              {student.blocked ? <Unlock size={14} /> : <Lock size={14} />}
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

        {/* 2. YURIDIK TESTLAR & IMTIHONLAR TABI */}
        {activeTab === 'tests' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Baza hajmi</span>
                <div className="text-xl font-bold mt-1 text-slate-900 dark:text-zinc-100">1 450+ Test Savollari</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Fuqarolik, jinoyat, mehnat, konstitutsiya</div>
              </div>

              <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Imtihon Simulyatori</span>
                <div className="text-xl font-bold mt-1 text-emerald-600">Davlat Attestatsiyasi Formati</div>
                <div className="text-[11px] text-slate-400 mt-0.5">30 ta savol • 45 daqiqa vaqt limiti</div>
              </div>

              <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-sm">
                <span className="text-xs text-slate-500 font-medium">AI Tyutor Maslahatlari</span>
                <div className="text-xl font-bold mt-1 text-indigo-600">Xatolar Tahlili</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Noto‘g‘ri javoblarga kodeks moddasi bilan sharh</div>
              </div>
            </div>
          </div>
        )}

        {/* 3. ALOHIDA PUL TUSHUMI (MOLIYA) TABI */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-amber-900 to-slate-900 text-white rounded-2xl shadow-md space-y-1">
                <span className="text-xs text-amber-300 font-medium">Umumiy Talabalardan Jami Tushum</span>
                <div className="text-2xl font-black">{financeStats.total_student_revenue.toLocaleString('uz-UZ')} so‘m</div>
                <div className="text-[11px] text-amber-300/80">Oylik talaba o‘quv ta&apos;riflari va test paketlari</div>
              </div>

              <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl shadow-md space-y-1">
                <span className="text-xs text-indigo-300 font-medium">Faol Talaba Obunalari</span>
                <div className="text-2xl font-black">{financeStats.active_student_subscriptions} ta</div>
                <div className="text-[11px] text-indigo-300/80">Har biri 49 000 so‘m/oylik ta&apos;rif</div>
              </div>

              <div className="p-4 bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl shadow-md space-y-1">
                <span className="text-xs text-emerald-300 font-medium">Maxsus Imtihon Test Paketlari</span>
                <div className="text-2xl font-black">{financeStats.exam_packs_revenue.toLocaleString('uz-UZ')} so‘m</div>
                <div className="text-[11px] text-emerald-300/80">Magistratura va litsenziya test simulyatsiyalari</div>
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
                  <Sliders size={18} className="text-amber-600 dark:text-amber-400" />
                  Umumiy Talabalar Tizimi Alohida Nastroykalari
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Ushbu sozlamalar ta&apos;lim tizimiga kiritilgan universitet talabalariga tatbiq qilinadi.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Kunlik bepul testlar soni (dona)
                  </label>
                  <input
                    type="number"
                    value={settings.daily_free_tests}
                    onChange={(e) => setSettings({ ...settings, daily_free_tests: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-400">Har bir talabaga kunlik beriladigan bepul testlar kvotasi.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Imtihon o‘tish minimal bali (%)
                  </label>
                  <input
                    type="number"
                    value={settings.exam_pass_score}
                    onChange={(e) => setSettings({ ...settings, exam_pass_score: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-400">Attestatsiya simulyatsiyasidan muvaffaqiyatli o‘tish foizi.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Talaba oylik obuna narxi (so‘m)
                  </label>
                  <input
                    type="number"
                    value={settings.monthly_student_price}
                    onChange={(e) => setSettings({ ...settings, monthly_student_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-400">Cheksiz testlar va AI tyutor yordamchisi oylik to‘lovi.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    Kunlik AI Tyutor so‘rovlar limiti (dona)
                  </label>
                  <input
                    type="number"
                    value={settings.ai_tutor_limit_daily}
                    onChange={(e) => setSettings({ ...settings, ai_tutor_limit_daily: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-400">Kuniga AI tahlilidan foydalanish chegarasi.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  {savingSettings ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Talabalar Nastroykalarini Saqlash
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
