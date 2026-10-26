'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Gavel,
  Plus,
  LogIn,
  Search,
  Users,
  Shield,
  Scale,
  Sparkles,
  ArrowRight,
  Radio,
  Clock,
  ArrowLeft,
  Bot,
  Mic,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '@/app/providers'
import { getAuthHeaders } from '@/lib/api-auth-client'
import CreateRoomModal from '@/components/court/multiplayer/CreateRoomModal'
import JoinRoomModal from '@/components/court/multiplayer/JoinRoomModal'
import type {
  CreateRoomInput,
  MultiplayerRole,
  MultiplayerCaseCategory,
} from '@/lib/court/multiplayer-types'

function MultiplayerLobbyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCodeParam, setJoinCodeParam] = useState<string>('')

  // Check URL join code query
  useEffect(() => {
    const code = searchParams.get('join') || searchParams.get('code')
    if (code) {
      setJoinCodeParam(code.toUpperCase().trim())
      setShowJoinModal(true)
    }
  }, [searchParams])

  // Fetch Public Rooms List
  const fetchRooms = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/court/multiplayer/rooms')
      const data = await res.json()
      if (data.success && data.rooms) {
        setRooms(data.rooms)
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
    const timer = setInterval(fetchRooms, 5000)
    return () => clearInterval(timer)
  }, [])

  // Create Room Handler
  const handleCreateRoom = async (input: CreateRoomInput) => {
    const authHeaders = await getAuthHeaders()
    const guestId =
      sessionStorage.getItem('juristiv_mp_guest_id') ||
      `guest_${Math.random().toString(36).substring(2, 9)}`
    const guestName = sessionStorage.getItem('juristiv_mp_guest_name') || user?.name || 'Sud Raisi'
    sessionStorage.setItem('juristiv_mp_guest_id', guestId)
    sessionStorage.setItem('juristiv_mp_guest_name', guestName)

    const res = await fetch('/api/court/multiplayer/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        'x-guest-id': user?.id || guestId,
        'x-guest-name': encodeURIComponent(user?.name || guestName),
      },
      body: JSON.stringify(input),
    })

    const data = await res.json()
    if (!data.success) {
      throw new Error(data.error || 'Xona yaratishda xatolik yuz berdi')
    }

    router.push(`/virtual-court/multiplayer/${data.room.code}`)
  }

  // Join Room Handler
  const handleJoinRoom = async (code: string, role?: MultiplayerRole) => {
    const authHeaders = await getAuthHeaders()
    const guestId =
      sessionStorage.getItem('juristiv_mp_guest_id') ||
      `guest_${Math.random().toString(36).substring(2, 9)}`
    const guestName =
      sessionStorage.getItem('juristiv_mp_guest_name') || user?.name || 'Ishtirokchi'
    sessionStorage.setItem('juristiv_mp_guest_id', guestId)
    sessionStorage.setItem('juristiv_mp_guest_name', guestName)

    const res = await fetch(`/api/court/multiplayer/rooms/${code}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        'x-guest-id': user?.id || guestId,
        'x-guest-name': encodeURIComponent(user?.name || guestName),
      },
      body: JSON.stringify({ role }),
    })

    const data = await res.json()
    if (!data.success) {
      throw new Error(data.error || 'Xonaga ulanishda xatolik yuz berdi')
    }

    router.push(`/virtual-court/multiplayer/${code}`)
  }

  // Filtered rooms
  const filteredRooms = rooms.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.courtType.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCat = selectedCategory === 'all' || r.caseCategory === selectedCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Top Breadcrumb Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          href="/virtual-court"
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Yakka tartibdagi Virtual Sudga qaytish</span>
        </Link>

        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-400">Multiplayer tarmog‘i faol</span>
        </div>
      </header>

      {/* Main Lobby Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-br from-blue-950/60 via-zinc-900 to-zinc-900 border border-blue-500/20 p-6 sm:p-10 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold">
              <Scale className="w-3.5 h-3.5" />
              <span>O‘zbekiston Qonunchiligi Asosida</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Virtual Sud — Ko‘p Foydalanuvchili Onlayn Zallar
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              Real vaqtda boshqa huquqshunoslar, talabalar va hamkasblar bilan birga sud majlisida
              ishtirok eting. Sudya, Prokuror, Advokat, Guvoh yoki Kotib rolini tanlang va
              protsessual tajribangizni oshiring.
            </p>

            {/* Primary Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                <span>Sud zali yaratish</span>
              </button>

              <button
                onClick={() => {
                  setJoinCodeParam('')
                  setShowJoinModal(true)
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 transition-all transform hover:-translate-y-0.5"
              >
                <LogIn className="w-4 h-4 text-blue-400" />
                <span>Sudga qo‘shilish (Kod orqali)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'Barcha zallar' },
              { id: 'criminal', label: 'Jinoyat ishlari' },
              { id: 'civil', label: 'Fuqarolik ishlari' },
              { id: 'labor', label: 'Mehnat nizolari' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap border transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Xona nomi yoki kodi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={fetchRooms}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Yangilash"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Public Rooms Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Ochiq sud majlislari ({filteredRooms.length})</span>
            <span className="font-mono">Real-time sinxronizatsiya</span>
          </div>

          {filteredRooms.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-500 mx-auto">
                <Gavel className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Hozircha ochiq zallar mavjud emas</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Birinchi bo‘lib o‘zingiz sud zalini yarating yoki do‘stingiz yuborgan kod orqali
                  qo‘shiling.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              >
                Yangi sud zali ochish
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map(r => {
                const isWaiting = r.status === 'waiting'
                const isCompleted = r.status === 'completed'

                return (
                  <div
                    key={r.id}
                    className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4 group shadow-lg hover:shadow-blue-500/5"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                          {r.code}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isWaiting ? (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Kutish zali
                            </span>
                          ) : isCompleted ? (
                            <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                              Yakunlangan
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                              Sud jarayoni
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Room Title */}
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                          {r.title}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">{r.courtType}</p>
                      </div>

                      {/* Details row: Host & Capacity */}
                      <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
                        <span>
                          Raisi: <strong className="text-zinc-300">{r.hostName}</strong>
                        </span>
                        <div className="flex items-center gap-1 font-mono text-zinc-300">
                          <Users className="w-3.5 h-3.5 text-zinc-500" />
                          <span>
                            {r.participantCount} / {r.maxParticipants}
                          </span>
                        </div>
                      </div>

                      {/* Available Roles Pills */}
                      {r.availableRoles && r.availableRoles.length > 0 && (
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">
                            Bo‘sh rollar:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {r.availableRoles.slice(0, 4).map((role: string) => (
                              <span
                                key={role}
                                className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700"
                              >
                                {role}
                              </span>
                            ))}
                            {r.availableRoles.length > 4 && (
                              <span className="text-[10px] text-zinc-500 self-center">
                                +{r.availableRoles.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Join Button */}
                    <button
                      onClick={() => handleJoinRoom(r.code)}
                      className="w-full py-2.5 rounded-2xl font-bold text-xs bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 hover:border-blue-500 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <span>Xonaga kirish</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateRoom={handleCreateRoom}
      />

      <JoinRoomModal
        isOpen={showJoinModal}
        initialCode={joinCodeParam}
        onClose={() => setShowJoinModal(false)}
        onJoinRoom={handleJoinRoom}
      />
    </div>
  )
}

export default function MultiplayerLobbyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
          Yuklanmoqda...
        </div>
      }
    >
      <MultiplayerLobbyContent />
    </Suspense>
  )
}
