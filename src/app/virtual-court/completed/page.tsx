'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Gavel,
  Search,
  Users,
  Scale,
  Clock,
  ArrowLeft,
  RefreshCw,
  Award,
  ChevronRight,
  Shield,
  FileText,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react'
import { useAuth } from '@/app/providers'
import { getAuthHeaders } from '@/lib/api-auth-client'
import { ROLE_LABELS, type MultiplayerRole, type MultiplayerCaseCategory } from '@/lib/court/multiplayer-types'

interface CompletedTrialItem {
  id: string
  code: string
  title: string
  courtType: string
  caseCategory: MultiplayerCaseCategory
  startedAt?: string
  completedAt: string
  durationFormatted: string
  myRole: MultiplayerRole
  myScore?: {
    totalScore: number
    xpEarned: number
    proceduralGrade: string
  }
  participantsCount: number
  verdictSummary?: string
  judgedByName?: string
}

export default function CompletedTrialsPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [trials, setTrials] = useState<CompletedTrialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const authHeaders = await getAuthHeaders()

      const guestId = typeof window !== 'undefined' ? sessionStorage.getItem('juristiv_mp_guest_id') : null
      const guestName = typeof window !== 'undefined' ? sessionStorage.getItem('juristiv_mp_guest_name') : null

      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      if (selectedRole !== 'all') params.set('role', selectedRole)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      params.set('page', String(page))
      params.set('limit', '9')

      const res = await fetch(`/api/court/multiplayer/history?${params.toString()}`, {
        headers: {
          ...authHeaders,
          ...(guestId ? { 'x-guest-id': guestId } : {}),
          ...(guestName ? { 'x-guest-name': encodeURIComponent(guestName) } : {}),
        },
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Yakunlangan ishlarni yuklab bo‘lmadi')
      }

      setTrials(data.trials || [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.total || 0)
    } catch (err: any) {
      console.error('fetchHistory error:', err)
      setError(err.message || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, selectedRole, searchQuery, page])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const getCategoryBadge = (cat: MultiplayerCaseCategory) => {
    switch (cat) {
      case 'criminal':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">Jinoyat ishi</span>
      case 'civil':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">Fuqarolik ishi</span>
      case 'labor':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">Mehnat nizosi</span>
      case 'economic':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Iqtisodiy ish</span>
      case 'administrative':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">Ma’muriy ish</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">Umumiy</span>
    }
  }

  const getRoleBadge = (role: MultiplayerRole) => {
    const meta = ROLE_LABELS[role]
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
        <span>{meta?.icon || '⚖️'}</span>
        <span>{meta?.title || role}</span>
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Top Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          href="/virtual-court/multiplayer"
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Multiplayer Sud Zaliga qaytish</span>
        </Link>

        <div className="flex items-center gap-2 text-xs">
          <Award className="w-4 h-4 text-amber-400" />
          <span className="text-zinc-300 font-semibold">Dosye va Protsessual Tahlillar</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Banner Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-blue-950/40 via-zinc-900 to-zinc-900 border border-blue-500/20 p-6 sm:p-8 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold">
              <Scale className="w-3.5 h-3.5" />
              <span>Sud Arxivlari & Rasmiy Protokollar</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Yakunlangan Sud Ishlari
            </h1>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Siz ishtirok etgan barcha virtual sud majlislarining rasmiy bayonnomalari, chiqarilgan
              hukmlar, shaxsiy protsessual baholashlar va taqdim etilgan dalillar ushbu arxivda saqlanadi.
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Sud nomi, ish kodi yoki sud turi bo‘yicha qidiruv..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={e => {
                  setSelectedCategory(e.target.value)
                  setPage(1)
                }}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Barcha toifalar</option>
                <option value="criminal">Jinoyat ishlari</option>
                <option value="civil">Fuqarolik ishlari</option>
                <option value="labor">Mehnat nizolari</option>
                <option value="economic">Iqtisodiy ishlar</option>
                <option value="administrative">Ma’muriy ishlar</option>
              </select>

              {/* Role Filter */}
              <select
                value={selectedRole}
                onChange={e => {
                  setSelectedRole(e.target.value)
                  setPage(1)
                }}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Barcha rollar</option>
                <option value="SUDYA">Sudya</option>
                <option value="PROKUROR">Davlat ayblovchisi</option>
                <option value="ADVOKAT">Advokat (Himoyachi)</option>
                <option value="AYBLANUVCHI">Ayblanuvchi / Javobgar</option>
                <option value="GUVOH">Guvoh</option>
                <option value="KOTIB">Sud kotibi</option>
              </select>

              <button
                onClick={fetchHistory}
                className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Yangilash"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Trials List / Grid */}
        {loading && trials.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
            <p className="text-sm text-zinc-400">Yakunlangan sud ishlari yuklanmoqda...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-center space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto text-rose-400" />
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={fetchHistory}
              className="mt-2 px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/40 text-xs font-bold text-white transition-colors"
            >
              Qaytadan urinish
            </button>
          </div>
        ) : trials.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-500 mx-auto">
              <Gavel className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Yakunlangan sud ishlari topilmadi</h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'all' || selectedRole !== 'all'
                  ? 'Qidiruv mezonlariga mos keladigan yakunlangan sud ishi topilmadi.'
                  : 'Siz hali yakunlangan sud ishlarida qatnashmagansiz. Multiplayer sud zaliga qo‘shiling yoki yangi sud zali oching.'}
              </p>
            </div>
            <Link
              href="/virtual-court/multiplayer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Multiplayer sud zaliga o‘tish</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Topilgan sud ishlari: {totalCount} ta</span>
              <span>Sahifa {page} / {totalPages}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {trials.map(trial => (
                <div
                  key={trial.id}
                  className="rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-blue-500/40 p-5 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-blue-950/20 group"
                >
                  <div className="space-y-3.5">
                    {/* Header: Category & Code */}
                    <div className="flex items-center justify-between gap-2">
                      {getCategoryBadge(trial.caseCategory)}
                      <span className="font-mono text-xs text-zinc-400 bg-zinc-800/80 px-2.5 py-0.5 rounded-md border border-zinc-700/60">
                        #{trial.code}
                      </span>
                    </div>

                    {/* Case Title */}
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                        {trial.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="truncate">{trial.courtType}</span>
                      </p>
                    </div>

                    {/* Meta info: Role, Time, Participants */}
                    <div className="pt-2 border-t border-zinc-800/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Sizning rolingiz:</span>
                        {getRoleBadge(trial.myRole)}
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Davomiyligi:</span>
                        </span>
                        <span className="font-semibold text-zinc-300">{trial.durationFormatted}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Ishtirokchilar:</span>
                        </span>
                        <span className="font-semibold text-zinc-300">{trial.participantsCount} nafar</span>
                      </div>
                    </div>

                    {/* Score / Grade Pill (if available) */}
                    {trial.myScore && (
                      <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-semibold text-blue-200">
                            Baho: {trial.myScore.proceduralGrade} ({trial.myScore.totalScore}/100)
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-400">
                          +{trial.myScore.xpEarned} XP
                        </span>
                      </div>
                    )}

                    {/* Verdict Summary snippet */}
                    {trial.verdictSummary && (
                      <div className="text-xs text-zinc-400 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60 line-clamp-2">
                        <span className="font-semibold text-zinc-300">Hukm: </span>
                        {trial.verdictSummary}
                      </div>
                    )}
                  </div>

                  {/* Open Dossier Button */}
                  <div className="pt-4 mt-2">
                    <Link
                      href={`/virtual-court/completed/${trial.code || trial.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 hover:border-blue-500 transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      <span>To‘liq dosye va bayonnoma</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
                >
                  Oldingi
                </button>
                <span className="text-xs text-zinc-400 px-3">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
                >
                  Keyingi
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
