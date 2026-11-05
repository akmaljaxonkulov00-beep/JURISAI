'use client'

import React, { useState, useEffect } from 'react'
import {
  Award,
  KeyRound,
  UserPlus,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Copy,
  ExternalLink,
  Trash2,
  Send,
  Building,
  CreditCard,
  Shield,
  Search,
} from 'lucide-react'

export default function AdminLawStudentManager() {
  const [activeTab, setActiveTab] = useState<'invitations' | 'payouts'>('invitations')

  // Invitations State
  const [invitations, setInvitations] = useState<any[]>([])
  const [loadingInvites, setLoadingInvites] = useState(true)
  const [showCreateInviteModal, setShowCreateInviteModal] = useState(false)
  const [fullName, setFullName] = useState('')
  const [university, setUniversity] = useState('Toshkent davlat yuridik universiteti (TDYU)')
  const [studyYear, setStudyYear] = useState(3)
  const [studentIdNumber, setStudentIdNumber] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [createdInviteResult, setCreatedInviteResult] = useState<any | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Payouts State
  const [payouts, setPayouts] = useState<any[]>([])
  const [loadingPayouts, setLoadingPayouts] = useState(true)
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null)

  const loadInvitations = async () => {
    try {
      setLoadingInvites(true)
      const res = await fetch('/api/law-student/invitations')
      const json = await res.json()
      if (json.success && json.invitations) {
        setInvitations(json.invitations)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingInvites(false)
    }
  }

  const loadPayouts = async () => {
    try {
      setLoadingPayouts(true)
      const res = await fetch('/api/admin/payouts')
      const json = await res.json()
      if (json.success && json.payouts) {
        setPayouts(json.payouts)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingPayouts(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'invitations') {
      loadInvitations()
    } else {
      loadPayouts()
    }
  }, [activeTab])

  // Generate random password helper
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$'
    let pass = ''
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setTempPassword(pass)
  }

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError(null)

    if (!tempPassword) {
      setInviteError('Vaqtinchalik parolni kiriting yoki tasodifiy generatsiya qiling')
      return
    }

    setCreatingInvite(true)
    try {
      const res = await fetch('/api/law-student/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          university,
          studyYear,
          studentIdNumber,
          tempPassword,
          expiresInDays: 7,
        }),
      })

      const json = await res.json()
      if (json.success) {
        setCreatedInviteResult({
          token: json.token,
          tempPassword,
          fullName,
          claimUrl: `${window.location.origin}/auth/law-student?token=${json.token}`,
        })
        loadInvitations()
      } else {
        setInviteError(json.error || 'Taklifnoma yaratishda xatolik')
      }
    } catch {
      setInviteError('Tarmoq xatosi yuz berdi')
    } finally {
      setCreatingInvite(false)
    }
  }

  const handlePayoutAction = async (payoutId: string, status: 'approved' | 'paid' | 'rejected') => {
    let note = ''
    if (status === 'rejected') {
      const promptNote = prompt('Rad etish sababini kiriting:')
      if (promptNote === null) return
      note = promptNote
    }

    setProcessingPayoutId(payoutId)
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, status, note }),
      })
      const json = await res.json()
      if (json.success) {
        loadPayouts()
      } else {
        alert(json.error || 'Xatolik')
      }
    } catch {
      alert('Tarmoq xatosi')
    } finally {
      setProcessingPayoutId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Yuridik Talabalar Portali Nazorati
          </h2>
          <p className="text-xs text-gray-500">
            Talabalarni faqat taklifnoma orqali qabul qilish, hamyonlarini va pul yechish so‘rovlarini boshqarish
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'invitations'
                ? 'bg-white dark:bg-gray-900 text-indigo-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Taklifnomalar ({invitations.length})
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'payouts'
                ? 'bg-white dark:bg-gray-900 text-emerald-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Pul yechish so‘rovlari ({payouts.filter(p => p.status === 'pending').length} kutilmoqda)
          </button>
        </div>
      </div>

      {/* Tab 1: Invitations */}
      {activeTab === 'invitations' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Talabalar uchun rasmiy taklifnomalar
              </h3>
              <p className="text-xs text-gray-500">
                Talabalar o‘zboshimchalik bilan ro‘yxatdan o‘ta olmaydi, faqat admin taklifnomasi bilan kiradi.
              </p>
            </div>

            <button
              onClick={() => {
                setShowCreateInviteModal(true)
                setCreatedInviteResult(null)
                generateRandomPassword()
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              Yangi taklifnoma yaratish
            </button>
          </div>

          {loadingInvites ? (
            <div className="p-8 text-center text-xs text-gray-400">Yuklanmoqda...</div>
          ) : invitations.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 border border-dashed rounded-xl">
              Hozircha birorta ham taklifnoma yaratilmagan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400">
                    <th className="pb-3 font-semibold">Talaba F.I.Sh.</th>
                    <th className="pb-3 font-semibold">OTM & Kurs</th>
                    <th className="pb-3 font-semibold">Guvohnoma raqami</th>
                    <th className="pb-3 font-semibold">Token</th>
                    <th className="pb-3 font-semibold">Amal qilish muddati</th>
                    <th className="pb-3 font-semibold text-right">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {invitations.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 font-bold text-gray-900 dark:text-white">
                        {inv.full_name}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">
                        {inv.university} ({inv.study_year}-kurs)
                      </td>
                      <td className="py-3 font-mono text-gray-500">
                        {inv.student_id_number}
                      </td>
                      <td className="py-3 font-mono text-indigo-600">
                        {inv.invite_token}
                      </td>
                      <td className="py-3 text-gray-500">
                        {new Date(inv.expires_at).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            inv.status === 'claimed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : inv.status === 'expired'
                                ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {inv.status === 'claimed'
                            ? 'Faollashtirilgan'
                            : inv.status === 'expired'
                              ? 'Muddati o‘tgan'
                              : 'Kutilmoqda'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Payout Requests */}
      {activeTab === 'payouts' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Talabalar pul yechish so‘rovlari (Student Payouts)
              </h3>
              <p className="text-xs text-gray-500">
                Sifatli yuridik javoblari uchun to‘plangan mukofot pullarini plastik kartalarga o‘tkazib berish
              </p>
            </div>
            <span className="text-xs text-gray-400">
              Minimal yechish summasi: 100 000 UZS
            </span>
          </div>

          {loadingPayouts ? (
            <div className="p-8 text-center text-xs text-gray-400">Yuklanmoqda...</div>
          ) : payouts.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 border border-dashed rounded-xl">
              Hozircha pul yechish so‘rovlari yo‘q.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400">
                    <th className="pb-3 font-semibold">Sana</th>
                    <th className="pb-3 font-semibold">Talaba F.I.Sh.</th>
                    <th className="pb-3 font-semibold">Summa</th>
                    <th className="pb-3 font-semibold">Karta raqami</th>
                    <th className="pb-3 font-semibold">Karta egasi</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {payouts.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 text-gray-500">
                        {new Date(p.created_at).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-3 font-bold text-gray-900 dark:text-white">
                        {p.student_name || 'Talaba'}
                      </td>
                      <td className="py-3 font-extrabold text-emerald-600 font-mono">
                        {Number(p.amount).toLocaleString()} UZS
                      </td>
                      <td className="py-3 font-mono text-gray-700 dark:text-gray-300">
                        {p.card_number}
                      </td>
                      <td className="py-3 text-gray-700 dark:text-gray-300 uppercase">
                        {p.card_holder_name}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            p.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : p.status === 'approved'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                : p.status === 'rejected'
                                  ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {p.status === 'paid'
                            ? 'To‘langan'
                            : p.status === 'approved'
                              ? 'Tasdiqlangan'
                              : p.status === 'rejected'
                                ? 'Rad etilgan'
                                : 'Kutilmoqda'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {p.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handlePayoutAction(p.id, 'paid')}
                              disabled={processingPayoutId === p.id}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                            >
                              To‘landi
                            </button>
                            <button
                              onClick={() => handlePayoutAction(p.id, 'rejected')}
                              disabled={processingPayoutId === p.id}
                              className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-bold text-[11px]"
                            >
                              Rad etish
                            </button>
                          </div>
                        )}
                        {p.status === 'approved' && (
                          <button
                            onClick={() => handlePayoutAction(p.id, 'paid')}
                            disabled={processingPayoutId === p.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                          >
                            To‘landi deb belgilash
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Invitation */}
      {showCreateInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Yuridik Talaba uchun Taklifnoma Yaratish
            </h3>

            {createdInviteResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Taklifnoma muvaffaqiyatli yaratildi!
                  </p>
                  <p>Ushbu ma’lumotlarni talabaga taqdim eting:</p>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-xl space-y-1 font-mono text-[11px] text-gray-800 dark:text-gray-200 select-all border">
                    <div><strong>Havola:</strong> {createdInviteResult.claimUrl}</div>
                    <div><strong>Token:</strong> {createdInviteResult.token}</div>
                    <div><strong>Vaqtinchalik parol:</strong> {createdInviteResult.tempPassword}</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Salom! Juristiv.uz talabalar amaliyot tizimiga taklifnomangiz:\nHavola: ${createdInviteResult.claimUrl}\nToken: ${createdInviteResult.token}\nVaqtinchalik parol: ${createdInviteResult.tempPassword}`
                      )
                      alert('Nusxalandi!')
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Ma’lumotlarni nusxalash
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateInviteModal(false)
                      setCreatedInviteResult(null)
                    }}
                    className="px-4 py-2 rounded-xl border text-xs font-semibold"
                  >
                    Yopish
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvitation} className="space-y-4">
                {inviteError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs">
                    {inviteError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Talabaning F.I.Sh.
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Masalan: Rustamov Jasur Anvar o‘g‘li"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    OTM nomi
                  </label>
                  <input
                    type="text"
                    value={university}
                    onChange={e => setUniversity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Kurs / Bosqich
                    </label>
                    <select
                      value={studyYear}
                      onChange={e => setStudyYear(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold"
                    >
                      <option value={1}>1-kurs</option>
                      <option value={2}>2-kurs</option>
                      <option value={3}>3-kurs</option>
                      <option value={4}>4-kurs</option>
                      <option value={5}>Magistratura</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Talabalik guvohnoma №
                    </label>
                    <input
                      type="text"
                      value={studentIdNumber}
                      onChange={e => setStudentIdNumber(e.target.value)}
                      placeholder="TDYU-2023-8901"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Vaqtinchalik parol
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] text-indigo-600 hover:underline font-semibold"
                    >
                      Qayta generatsiya
                    </button>
                  </div>
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={e => setTempPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono font-bold"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateInviteModal(false)}
                    className="px-4 py-2.5 rounded-xl border text-xs font-semibold"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={creatingInvite}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    {creatingInvite ? 'Yaratilmoqda...' : 'Taklifnomani yaratish'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
