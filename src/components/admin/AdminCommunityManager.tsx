'use client'

// ═══════════════════════════════════════════════════════════════════════════
// AdminCommunityManager — Jamiyat boshqaruvi: Ekspertlar + Vebinarlar
// Admin tomonidan ekspert va vebinarlar qo'shiladi/tahrirlanadi/o'chiriladi
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import {
  Star,
  Video,
  Plus,
  Trash2,
  X,
  RefreshCw,
  UserCheck,
  UserX,
  Calendar,
  Clock,
} from 'lucide-react'

type Expert = {
  id: string
  name: string
  title: string
  specialization: string
  bio: string
  reputation: number
  webinars_count: number
  is_verified: boolean
  is_active: boolean
  created_at: string
}

type Webinar = {
  id: string
  title: string
  description: string
  host: string
  host_title: string
  category: string
  date: string
  duration_minutes: number
  max_participants: number
  participants_count: number
  is_live: boolean
  is_active: boolean
  created_at: string
}

export default function AdminCommunityManager() {
  const [tab, setTab] = useState<'experts' | 'webinars'>('experts')

  const [experts, setExperts] = useState<Expert[]>([])
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Add expert form ──
  const [showAddExpert, setShowAddExpert] = useState(false)
  const [expertForm, setExpertForm] = useState({
    name: '',
    title: '',
    specialization: '',
    bio: '',
  })

  // ── Add webinar form ──
  const [showAddWebinar, setShowAddWebinar] = useState(false)
  const [webinarForm, setWebinarForm] = useState({
    title: '',
    description: '',
    host: '',
    host_title: '',
    category: 'Umumiy',
    date: '',
    duration_minutes: 60,
    max_participants: 500,
  })

  const loadExperts = useCallback(async () => {
    try {
      const r = await fetch('/api/community/experts')
      const d = await r.json()
      setExperts(d.data || [])
    } catch {
      setExperts([])
    }
  }, [])

  const loadWebinars = useCallback(async () => {
    try {
      const r = await fetch('/api/community/webinars')
      const d = await r.json()
      setWebinars(d.data || [])
    } catch {
      setWebinars([])
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    await Promise.all([loadExperts(), loadWebinars()])
    setLoading(false)
  }, [loadExperts, loadWebinars])

  useEffect(() => {
    load()
  }, [load])

  // ── Expert CRUD ─────────────────────────────────────────────────
  const addExpert = async () => {
    if (!expertForm.name.trim()) return
    try {
      await fetch('/api/community/experts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expertForm),
      })
      setShowAddExpert(false)
      setExpertForm({ name: '', title: '', specialization: '', bio: '' })
      await loadExperts()
    } catch {
      setError("Ekspert qo'shilmadi")
    }
  }

  const toggleExpert = async (e: Expert) => {
    try {
      await fetch('/api/community/experts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: e.id, is_active: !e.is_active }),
      })
      await loadExperts()
    } catch {}
  }

  const deleteExpert = async (id: string) => {
    if (!confirm("Ekspertni o'chirishni tasdiqlaysizmi?")) return
    try {
      await fetch(`/api/community/experts?id=${id}`, { method: 'DELETE' })
      await loadExperts()
    } catch {}
  }

  // ── Webinar CRUD ────────────────────────────────────────────────
  const addWebinar = async () => {
    if (!webinarForm.title.trim() || !webinarForm.date) return
    try {
      await fetch('/api/community/webinars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webinarForm),
      })
      setShowAddWebinar(false)
      setWebinarForm({
        title: '',
        description: '',
        host: '',
        host_title: '',
        category: 'Umumiy',
        date: '',
        duration_minutes: 60,
        max_participants: 500,
      })
      await loadWebinars()
    } catch {
      setError('Vebinar qo‘shilmadi')
    }
  }

  const toggleWebinar = async (w: Webinar) => {
    try {
      await fetch('/api/community/webinars', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: w.id, is_active: !w.is_active }),
      })
      await loadWebinars()
    } catch {}
  }

  const deleteWebinar = async (id: string) => {
    if (!confirm('Vebinarni o‘chirishni tasdiqlaysizmi?')) return
    try {
      await fetch(`/api/community/webinars?id=${id}`, { method: 'DELETE' })
      await loadWebinars()
    } catch {}
  }

  const inputCls =
    'w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          {tab === 'experts' ? (
            <>
              <Star className="w-5 h-5 text-blue-500" /> Ekspertlar boshqaruvi
            </>
          ) : (
            <>
              <Video className="w-5 h-5 text-blue-500" /> Vebinarlar boshqaruvi
            </>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setTab('experts')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === 'experts'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400'
              }`}
            >
              Ekspertlar ({experts.length})
            </button>
            <button
              onClick={() => setTab('webinars')}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === 'webinars'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400'
              }`}
            >
              Vebinarlar ({webinars.length})
            </button>
          </div>
          <button
            onClick={load}
            className="p-2 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() =>
              tab === 'experts' ? setShowAddExpert(true) : setShowAddWebinar(true)
            }
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> {tab === 'experts' ? 'Ekspert qo‘shish' : 'Vebinar qo‘shish'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* ── EXPERTS LIST ── */}
      {tab === 'experts' && (
        <div className="space-y-2">
          {experts.length === 0 && !loading && (
            <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-8">
              Hozircha ekspertlar yo‘q
            </p>
          )}
          {experts.map(e => (
            <div
              key={e.id}
              className={`p-3 rounded-xl border flex items-center justify-between flex-wrap gap-2 ${
                e.is_active
                  ? 'bg-gray-50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-700'
                  : 'bg-gray-50 dark:bg-zinc-800/30 border-gray-100 dark:border-zinc-700 opacity-60'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-800 dark:text-white">
                    {e.name}
                  </span>
                  {e.is_verified && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      Tasdiqlangan
                    </span>
                  )}
                  {!e.is_active && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded">
                      Yashirin
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  {e.title} • {e.specialization}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                  ⭐ {e.reputation} rep • 📺 {e.webinars_count} vebinar
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => toggleExpert(e)}
                  className={`p-1.5 rounded-lg text-xs ${e.is_active ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}
                  title={e.is_active ? 'Yashirish' : 'Faollashtirish'}
                >
                  {e.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                </button>
                <button
                  onClick={() => deleteExpert(e.id)}
                  className="p-1.5 rounded-lg text-xs bg-red-100 text-red-700 hover:bg-red-200"
                  title="O‘chirish"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── WEBINARS LIST ── */}
      {tab === 'webinars' && (
        <div className="space-y-2">
          {webinars.length === 0 && !loading && (
            <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-8">
              Hozircha vebinarlar yo‘q
            </p>
          )}
          {webinars.map(w => (
            <div
              key={w.id}
              className={`p-3 rounded-xl border flex items-center justify-between flex-wrap gap-2 ${
                w.is_active
                  ? 'bg-gray-50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-700'
                  : 'bg-gray-50 dark:bg-zinc-800/30 border-gray-100 dark:border-zinc-700 opacity-60'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-800 dark:text-white">
                    {w.title}
                  </span>
                  {w.is_live && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded animate-pulse">
                      LIVE
                    </span>
                  )}
                  {!w.is_active && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded">
                      Yashirin
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  {w.host || '-'} • {w.category || 'Umumiy'}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} /> {w.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {w.duration_minutes} min
                  </span>
                  <span>👥 {w.participants_count}/{w.max_participants}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => toggleWebinar(w)}
                  className={`p-1.5 rounded-lg text-xs ${w.is_active ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}
                  title={w.is_active ? 'Yashirish' : 'Faollashtirish'}
                >
                  {w.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                </button>
                <button
                  onClick={() => deleteWebinar(w.id)}
                  className="p-1.5 rounded-lg text-xs bg-red-100 text-red-700 hover:bg-red-200"
                  title="O‘chirish"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD EXPERT MODAL ── */}
      {showAddExpert && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddExpert(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Ekspert qo‘shish
              </h3>
              <button
                onClick={() => setShowAddExpert(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={expertForm.name}
                onChange={e => setExpertForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ism familiya *"
                className={inputCls}
              />
              <input
                value={expertForm.title}
                onChange={e => setExpertForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Unvoni (masalan: Huquqshunoslik fanlari doktori)"
                className={inputCls}
              />
              <input
                value={expertForm.specialization}
                onChange={e => setExpertForm(f => ({ ...f, specialization: e.target.value }))}
                placeholder="Mutaxassislik (masalan: Fuqarolik huquqi)"
                className={inputCls}
              />
              <textarea
                value={expertForm.bio}
                onChange={e => setExpertForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Qisqacha tarjimai hol"
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddExpert(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl"
              >
                Bekor qilish
              </button>
              <button
                onClick={addExpert}
                disabled={!expertForm.name.trim()}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Qo‘shish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD WEBINAR MODAL ── */}
      {showAddWebinar && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddWebinar(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Vebinar qo‘shish
              </h3>
              <button
                onClick={() => setShowAddWebinar(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={webinarForm.title}
                onChange={e => setWebinarForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Vebinar nomi *"
                className={inputCls}
              />
              <textarea
                value={webinarForm.description}
                onChange={e => setWebinarForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Tavsif"
                rows={2}
                className={`${inputCls} resize-none`}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={webinarForm.host}
                  onChange={e => setWebinarForm(f => ({ ...f, host: e.target.value }))}
                  placeholder="O‘tkazuvchi"
                  className={inputCls}
                />
                <input
                  value={webinarForm.host_title}
                  onChange={e => setWebinarForm(f => ({ ...f, host_title: e.target.value }))}
                  placeholder="Unvoni"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="datetime-local"
                  value={webinarForm.date}
                  onChange={e => setWebinarForm(f => ({ ...f, date: e.target.value }))}
                  className={inputCls}
                />
                <input
                  value={webinarForm.category}
                  onChange={e => setWebinarForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="Kategoriya"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={webinarForm.duration_minutes}
                  onChange={e =>
                    setWebinarForm(f => ({
                      ...f,
                      duration_minutes: parseInt(e.target.value) || 60,
                    }))
                  }
                  placeholder="Davomiyligi (daqiqa)"
                  className={inputCls}
                />
                <input
                  type="number"
                  value={webinarForm.max_participants}
                  onChange={e =>
                    setWebinarForm(f => ({
                      ...f,
                      max_participants: parseInt(e.target.value) || 500,
                    }))
                  }
                  placeholder="Maks. ishtirokchi"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddWebinar(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl"
              >
                Bekor qilish
              </button>
              <button
                onClick={addWebinar}
                disabled={!webinarForm.title.trim() || !webinarForm.date}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Qo‘shish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
