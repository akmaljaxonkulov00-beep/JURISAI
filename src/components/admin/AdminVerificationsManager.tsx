'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Award,
  Users,
  Search,
  ExternalLink,
} from 'lucide-react'

export default function AdminVerificationsManager() {
  const [activeSubTab, setActiveSubTab] = useState<'advocates' | 'law_students'>('advocates')
  const [advocates, setAdvocates] = useState<any[]>([])
  const [lawStudents, setLawStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  const loadData = async () => {
    try {
      setLoading(true)
      const [aRes, sRes] = await Promise.all([
        fetch('/api/verification/advocate').then(r => r.json()),
        fetch('/api/verification/student').then(r => r.json()),
      ])
      if (aRes.success && aRes.data) setAdvocates(aRes.data)
      if (sRes.success && sRes.data) setLawStudents(sRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpdateAdvocateStatus = async (advocateId: string, status: string) => {
    const reason = status === 'rejected' ? prompt('Rad etish sababini kiriting:') : undefined
    if (status === 'rejected' && !reason) return

    try {
      const res = await fetch('/api/verification/advocate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advocateId, status, rejectionReason: reason }),
      })
      const json = await res.json()
      if (json.success) {
        loadData()
      } else {
        alert(json.error || 'Xatolik')
      }
    } catch {
      alert('Tarmoq xatosi')
    }
  }

  const handleUpdateStudentStatus = async (studentId: string, status: string) => {
    const reason = status === 'rejected' ? prompt('Rad etish sababini kiriting:') : undefined
    if (status === 'rejected' && !reason) return

    try {
      const res = await fetch('/api/verification/student', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, status, rejectionReason: reason }),
      })
      const json = await res.json()
      if (json.success) {
        loadData()
      } else {
        alert(json.error || 'Xatolik')
      }
    } catch {
      alert('Tarmoq xatosi')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Litsenziya va Verifikatsiya Boshqaruvi
          </h2>
          <p className="text-xs text-secondary">
            Professional advokatlar va yurisprudensiya talabalari arizalarini ko‘rib chiqish va tasdiqlash
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-zinc-800 p-1 border border-gray-200 dark:border-zinc-700">
          <button
            onClick={() => setActiveSubTab('advocates')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'advocates'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-zinc-400'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Advokatlar ({advocates.length})
          </button>
          <button
            onClick={() => setActiveSubTab('law_students')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'law_students'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-sm'
                : 'text-gray-600 dark:text-zinc-400'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Talabalar ({lawStudents.length})
          </button>
        </div>
      </div>

      {/* Advocates Tab */}
      {activeSubTab === 'advocates' && (
        <div className="card-default rounded-2xl border border-card-border overflow-hidden">
          <div className="p-4 border-b border-card-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Advokatlik litsenziyasi bo‘yicha arizalar
            </h3>
            <span className="text-xs text-secondary">
              Tasdiqlangan advokatlar avtomatik &ldquo;Rasmiy litsenziyalangan&rdquo; nishonini oladi
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-secondary">Yuklanmoqda...</div>
          ) : advocates.length === 0 ? (
            <div className="p-8 text-center text-xs text-secondary">Arizalar mavjud emas</div>
          ) : (
            <div className="divide-y divide-card-border">
              {advocates.map(adv => (
                <div
                  key={adv.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-zinc-800/40"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {adv.full_name}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          adv.verification_status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : adv.verification_status === 'rejected'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {adv.verification_status}
                      </span>
                    </div>
                    <p className="text-xs text-secondary">
                      Litsenziya: <strong className="font-mono text-blue-600">{adv.license_number}</strong> • {adv.bar_association} • {adv.experience_years} yil tajriba
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Email: {adv.email} • Tel: {adv.phone} • Shahar: {adv.location_city}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {adv.verification_status !== 'approved' && (
                      <button
                        onClick={() => handleUpdateAdvocateStatus(adv.user_id || adv.id, 'approved')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
                      >
                        Tasdiqlash
                      </button>
                    )}
                    {adv.verification_status !== 'rejected' && (
                      <button
                        onClick={() => handleUpdateAdvocateStatus(adv.user_id || adv.id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold"
                      >
                        Rad etish
                      </button>
                    )}
                    {adv.verification_status === 'approved' && (
                      <button
                        onClick={() => handleUpdateAdvocateStatus(adv.user_id || adv.id, 'suspended')}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold"
                      >
                        To‘xtatish
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Law Students Tab */}
      {activeSubTab === 'law_students' && (
        <div className="card-default rounded-2xl border border-card-border overflow-hidden">
          <div className="p-4 border-b border-card-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Talabalik hujjati bo‘yicha arizalar
            </h3>
            <span className="text-xs text-secondary">
              Faqat tasdiqlangan talabalar ommaviy savollarga javob bera oladi
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-secondary">Yuklanmoqda...</div>
          ) : lawStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-secondary">Arizalar mavjud emas</div>
          ) : (
            <div className="divide-y divide-card-border">
              {lawStudents.map(std => (
                <div
                  key={std.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-zinc-800/40"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {std.full_name}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          std.verification_status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : std.verification_status === 'rejected'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {std.verification_status}
                      </span>
                    </div>
                    <p className="text-xs text-secondary">
                      OTM: {std.university} • {std.study_year}-kurs • Guvohnoma №: <strong className="font-mono text-indigo-600">{std.student_id_number}</strong>
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Yo‘nalish: {std.specialization || std.faculty} • Bergan javoblari: {std.answers_count || 0} ta
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {std.verification_status !== 'approved' && (
                      <button
                        onClick={() => handleUpdateStudentStatus(std.user_id || std.id, 'approved')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
                      >
                        Tasdiqlash
                      </button>
                    )}
                    {std.verification_status !== 'rejected' && (
                      <button
                        onClick={() => handleUpdateStudentStatus(std.user_id || std.id, 'rejected')}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold"
                      >
                        Rad etish
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
