'use client'

// ═══════════════════════════════════════════════════════════════════════════
// AdminCommunityManager — Jamiyat boshqaruvi: Ekspertlar + Vebinarlar
// Admin tomonidan ekspert va vebinarlar qo'shiladi/tahrirlanadi/o'chiriladi
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import {
  Star,
  Video,
  Users,
  MessageSquare,
  Plus,
  Trash2,
  X,
  RefreshCw,
  UserCheck,
  UserX,
  Calendar,
  Clock,
  Check,
  Pin,
  PinOff,
  Newspaper,
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

type Group = {
  id: string
  name: string
  description: string
  icon: string
  category: string
  member_count: number
  post_count: number
  is_private?: boolean
  invite_code?: string | null
  created_by?: string | null
  created_at: string
}

type Consultation = {
  id: string
  expert_id: string
  expert_name: string
  user_id: string
  user_name: string
  user_email: string
  type: 'consultation' | 'mentorship'
  message: string
  status: string
  admin_reply?: string
  reply_at?: string
  assigned_expert_id?: string
  status_history?: any[]
  created_at: string
}

type FeedPost = {
  id: string
  author?: {
    id?: string
    name?: string
    avatar?: string
    role?: string
  }
  content?: string
  category?: string
  tags?: string[]
  likes?: number
  dislikes?: number
  comments?: any[]
  views?: number
  is_pinned?: boolean
  created_at?: string
}

export default function AdminCommunityManager() {
  const [tab, setTab] = useState<'experts' | 'webinars' | 'groups' | 'consultations' | 'feed'>(
    'experts'
  )

  const [experts, setExperts] = useState<Expert[]>([])
  const [webinars, setWebinars] = useState<Webinar[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Consultation reply / assignment ──
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [assignedExpert, setAssignedExpert] = useState<Record<string, string>>({})

  // ── Group detail (a'zolar boshqaruvi) ──
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  const [groupMembersLoading, setGroupMembersLoading] = useState(false)

  // ── Add group form ──
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    icon: '👥',
    category: 'Umumiy',
    is_private: false,
  })

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

  const loadGroups = useCallback(async () => {
    try {
      const r = await fetch('/api/community/groups')
      const d = await r.json()
      setGroups(d.data || [])
    } catch {
      setGroups([])
    }
  }, [])

  const loadConsultations = useCallback(async () => {
    try {
      const r = await fetch('/api/community/consultations')
      const d = await r.json()
      setConsultations(d.data || [])
    } catch {
      setConsultations([])
    }
  }, [])

  const loadFeed = useCallback(async () => {
    try {
      const r = await fetch('/api/community/posts', { cache: 'no-store' })
      const d = await r.json()
      setFeedPosts(d.data || [])
    } catch {
      setFeedPosts([])
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    await Promise.all([
      loadExperts(),
      loadWebinars(),
      loadGroups(),
      loadConsultations(),
      loadFeed(),
    ])
    setLoading(false)
  }, [loadExperts, loadWebinars, loadGroups, loadConsultations, loadFeed])

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

  // ── Group CRUD ──────────────────────────────────────────────────
  const addGroup = async () => {
    if (!groupForm.name.trim()) return
    try {
      await fetch('/api/community/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupForm),
      })
      setShowAddGroup(false)
      setGroupForm({ name: '', description: '', icon: '👥', category: 'Umumiy', is_private: false })
      await loadGroups()
    } catch {
      setError("Guruh qo'shilmadi")
    }
  }

  const deleteGroup = async (id: string) => {
    if (!confirm("Guruhni o'chirishni tasdiqlaysizmi? Bu guruhdagi barcha a'zolar, xabarlar va so'rovlar ham o'chadi."))
      return
    try {
      await fetch(`/api/community/groups?id=${id}`, { method: 'DELETE' })
      setExpandedGroup(null)
      await loadGroups()
    } catch {}
  }

  // ── Guruh a'zolarini yuklash (admin) ──
  const toggleGroupDetail = async (g: Group) => {
    if (expandedGroup === g.id) {
      setExpandedGroup(null)
      setGroupMembers([])
      return
    }
    setExpandedGroup(g.id)
    setGroupMembersLoading(true)
    setGroupMembers([])
    try {
      const r = await fetch(`/api/community/groups/members?groupId=${g.id}&memberId=&admin=1`, {
        cache: 'no-cache',
      })
      const d = await r.json()
      setGroupMembers(d.success ? d.data || [] : [])
    } catch {
      setGroupMembers([])
    } finally {
      setGroupMembersLoading(false)
    }
  }

  // ── A'zoni chiqarish (admin) ──
  const removeGroupMember = async (groupId: string, userId: string) => {
    if (!confirm("A'zoni guruhdan chiqarishni tasdiqlaysizmi?")) return
    try {
      const r = await fetch(
        `/api/community/groups/members?groupId=${groupId}&userId=${userId}&actorId=admin`,
        { method: 'DELETE' }
      )
      if (r.ok) {
        setGroupMembers(prev => prev.filter(m => m.user_id !== userId))
        await loadGroups()
      }
    } catch {}
  }

  // ── Moderator tayinlash / olib tashlash (admin) ──
  const setGroupModerator = async (groupId: string, userId: string, role: 'member' | 'moderator') => {
    try {
      const r = await fetch('/api/community/groups/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, userId, role, actorId: 'admin', actorName: 'Admin' }),
      })
      if (r.ok) {
        setGroupMembers(prev =>
          prev.map(m => (m.user_id === userId ? { ...m, role } : m))
        )
      }
    } catch {}
  }

  // ── Feed moderation ───────────────────────────────────────────────
  const deletePost = async (id: string) => {
    if (!confirm("Postni o'chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.")) return
    try {
      await fetch(`/api/community/posts?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      await loadFeed()
    } catch {
      setError("Post o'chirilmadi")
    }
  }

  const togglePinPost = async (post: FeedPost) => {
    try {
      await fetch('/api/community/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, isPinned: !post.is_pinned }),
      })
      await loadFeed()
    } catch {
      setError('Pin holati yangilanmadi')
    }
  }

  // ── Consultation status update ───────────────────────────────────
  const updateConsultation = async (
    id: string,
    status: string,
    adminReply?: string,
    expertId?: string
  ) => {
    try {
      await fetch('/api/community/consultations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          adminReply: adminReply || undefined,
          assignedExpertId: expertId || undefined,
          actor: 'admin',
        }),
      })
      // Tozalash
      setReplyDrafts(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      await loadConsultations()
    } catch {}
  }

  const UZ_MONTHS = [
    'yanvar',
    'fevral',
    'mart',
    'aprel',
    'may',
    'iyun',
    'iyul',
    'avgust',
    'sentabr',
    'oktabr',
    'noyabr',
    'dekabr',
  ]
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}, ${hh}:${mm}`
  }

  const inputCls =
    'w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          {tab === 'experts' && (
            <>
              <Star className="w-5 h-5 text-blue-500" /> Ekspertlar boshqaruvi
            </>
          )}
          {tab === 'webinars' && (
            <>
              <Video className="w-5 h-5 text-blue-500" /> Vebinarlar boshqaruvi
            </>
          )}
          {tab === 'groups' && (
            <>
              <Users className="w-5 h-5 text-blue-500" /> Guruhlar boshqaruvi
            </>
          )}
          {tab === 'consultations' && (
            <>
              <MessageSquare className="w-5 h-5 text-blue-500" /> Maslahat so'rovlari
            </>
          )}
          {tab === 'feed' && (
            <>
              <Newspaper className="w-5 h-5 text-blue-500" /> Lenta moderatsiyasi
            </>
          )}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-xl p-1">
            <button
              onClick={() => setTab('experts')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === 'experts'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400'
              }`}
            >
              Ekspertlar ({experts.length})
            </button>
            <button
              onClick={() => setTab('webinars')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === 'webinars'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400'
              }`}
            >
              Vebinarlar ({webinars.length})
            </button>
            <button
              onClick={() => setTab('groups')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === 'groups'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400'
              }`}
            >
              Guruhlar ({groups.length})
            </button>
            <button
              onClick={() => setTab('consultations')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === 'consultations'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400'
              }`}
            >
              So'rovlar ({consultations.length})
            </button>
            <button
              onClick={() => setTab('feed')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === 'feed'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400'
              }`}
            >
              Lenta ({feedPosts.length})
            </button>
          </div>
          <button
            onClick={load}
            className="p-2 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {tab !== 'consultations' && tab !== 'feed' && (
            <button
              onClick={() =>
                tab === 'experts'
                  ? setShowAddExpert(true)
                  : tab === 'webinars'
                    ? setShowAddWebinar(true)
                    : setShowAddGroup(true)
              }
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />{' '}
              {tab === 'experts'
                ? 'Ekspert qo‘shish'
                : tab === 'webinars'
                  ? 'Vebinar qo‘shish'
                  : 'Guruh qo‘shish'}
            </button>
          )}
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
                    <Calendar size={10} /> {formatDate(w.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {w.duration_minutes} min
                  </span>
                  <span>
                    👥 {w.participants_count}/{w.max_participants}
                  </span>
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

      {/* ── GROUPS LIST ── */}
      {tab === 'groups' && (
        <div className="space-y-2">
          {groups.length === 0 && !loading && (
            <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-8">
              Hozircha guruhlar yo‘q
            </p>
          )}
          {groups.map(g => (
            <div key={g.id}>
              <div className="p-3 rounded-xl border bg-gray-50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-700 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                    {g.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-800 dark:text-white">
                        {g.name}
                      </span>
                      {g.is_private && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
                          🔒 Maxfiy
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded">
                        {g.category || 'Umumiy'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
                      {g.description || '—'}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                      👥 {g.member_count || 0} a'zo • 💬 {g.post_count || 0} post
                      {g.is_private && g.invite_code && (
                        <span className="ml-1 font-mono text-amber-500">• 🔑 {g.invite_code}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleGroupDetail(g)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 ${
                      expandedGroup === g.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                    title="A'zolarni boshqarish"
                  >
                    <Users size={13} /> A'zolar
                  </button>
                  <button
                    onClick={() => deleteGroup(g.id)}
                    className="p-1.5 rounded-lg text-xs bg-red-100 text-red-700 hover:bg-red-200"
                    title="Guruhni o'chirish"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Guruh a'zolari boshqaruvi */}
              {expandedGroup === g.id && (
                <div className="mt-2 p-3 rounded-xl border border-blue-100 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-900/10">
                  <p className="text-xs font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-1.5">
                    <Users size={13} className="text-blue-500" /> A'zolar ({groupMembers.length})
                  </p>
                  {groupMembersLoading ? (
                    <p className="text-xs text-gray-500 dark:text-zinc-400 py-3 text-center">
                      Yuklanmoqda...
                    </p>
                  ) : groupMembers.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-zinc-400 py-3 text-center">
                      Hozircha a'zolar yo'q
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {groupMembers.map(m => {
                        const isModerator = ['moderator', 'admin'].includes(m.role)
                        const isCreator = g.created_by?.toString() === m.user_id
                        return (
                          <div
                            key={m.user_id}
                            className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-zinc-900 rounded-lg border border-gray-100 dark:border-zinc-700"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-medium text-blue-700 dark:text-blue-300 flex-shrink-0">
                                {(m.name || 'U')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-800 dark:text-white truncate">
                                  {m.name || 'Foydalanuvchi'}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {isCreator ? '⭐ Yaratuvchi' : isModerator ? '🛡️ Moderator' : 'A\'zo'}
                                </p>
                              </div>
                            </div>
                            {!isCreator && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() =>
                                    setGroupModerator(
                                      g.id,
                                      m.user_id,
                                      isModerator ? 'member' : 'moderator'
                                    )
                                  }
                                  className={`p-1.5 rounded-lg text-xs ${
                                    isModerator
                                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                      : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-gray-200'
                                  }`}
                                  title={
                                    isModerator ? 'Moderatorlikdan olish' : 'Moderator qilish'
                                  }
                                >
                                  <UserCheck size={13} />
                                </button>
                                <button
                                  onClick={() => removeGroupMember(g.id, m.user_id)}
                                  className="p-1.5 rounded-lg text-xs bg-red-100 text-red-700 hover:bg-red-200"
                                  title="A'zoni chiqarish"
                                >
                                  <UserX size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── CONSULTATIONS LIST ── */}
      {tab === 'consultations' && (
        <div className="space-y-2">
          {consultations.length === 0 && !loading && (
            <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-8">
              Hozircha maslahat so'rovlari yo‘q
            </p>
          )}
          {consultations.map(c => (
            <div
              key={c.id}
              className="p-3 rounded-xl border bg-gray-50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-700"
            >
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-800 dark:text-white">
                      {c.user_name || c.user_email || 'Foydalanuvchi'}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        c.type === 'mentorship'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {c.type === 'mentorship' ? 'Mentorlik' : 'Maslahat'}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        c.status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}
                    >
                      {c.status === 'pending'
                        ? 'Kutilmoqda'
                        : c.status === 'answered'
                          ? 'Javob berilgan'
                          : 'Yopilgan'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    Ekspert: {c.expert_name || '-'}
                    {c.user_email ? ` • ${c.user_email}` : ''}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-zinc-300 mt-1.5 bg-white dark:bg-zinc-900 rounded-lg p-2 border border-gray-100 dark:border-zinc-700">
                    {c.message}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                    {new Date(c.created_at).toLocaleString('uz-UZ')}
                  </p>

                  {/* Admin javobi */}
                  {c.admin_reply && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/40 rounded-lg">
                      <p className="text-[10px] font-medium text-green-700 dark:text-green-300 mb-1">
                        Admin javobi
                      </p>
                      <p className="text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-wrap">
                        {c.admin_reply}
                      </p>
                    </div>
                  )}

                  {/* Holat tarixi */}
                  {Array.isArray(c.status_history) && c.status_history.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.status_history.map((h: any, hi: number) => (
                        <span
                          key={hi}
                          className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 rounded"
                        >
                          {h.status} •{' '}
                          {new Date(h.at).toLocaleDateString('uz-UZ', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {c.status === 'pending' && (
                  <div className="flex flex-col items-end gap-2 min-w-[200px]">
                    {/* Ekspertga ulash */}
                    {experts.length > 0 && (
                      <select
                        value={assignedExpert[c.id] || ''}
                        onChange={e =>
                          setAssignedExpert(prev => ({ ...prev, [c.id]: e.target.value }))
                        }
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Ekspert tanlang...</option>
                        {experts.map(e => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <textarea
                      value={replyDrafts[c.id] || ''}
                      onChange={e => setReplyDrafts(prev => ({ ...prev, [c.id]: e.target.value }))}
                      placeholder="Javob matni..."
                      rows={2}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          updateConsultation(
                            c.id,
                            'answered',
                            replyDrafts[c.id],
                            assignedExpert[c.id]
                          )
                        }
                        disabled={!replyDrafts[c.id]?.trim()}
                        className="px-2.5 py-1.5 rounded-lg text-xs bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 flex items-center gap-1"
                        title="Javob berish"
                      >
                        <Check size={13} /> Javob berish
                      </button>
                      <button
                        onClick={() => updateConsultation(c.id, 'closed')}
                        className="p-1.5 rounded-lg text-xs bg-gray-200 text-gray-600 hover:bg-gray-300"
                        title="Yopish"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── FEED LIST (moderatsiya) ── */}
      {tab === 'feed' && (
        <div className="space-y-2">
          {feedPosts.length === 0 && !loading && (
            <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-8">
              Hozircha postlar yo‘q
            </p>
          )}
          {feedPosts.map(p => (
            <div
              key={p.id}
              className={`p-3 rounded-xl border bg-gray-50 dark:bg-zinc-800/50 ${
                p.is_pinned
                  ? 'border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/10'
                  : 'border-gray-100 dark:border-zinc-700'
              }`}
            >
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-800 dark:text-white">
                      {p.author?.name || 'Mehmon'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded">
                      {p.category || 'discussion'}
                    </span>
                    {p.is_pinned && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded flex items-center gap-1">
                        <Pin size={9} /> Pinlangan
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-zinc-300 mt-1.5 bg-white dark:bg-zinc-900 rounded-lg p-2 border border-gray-100 dark:border-zinc-700 line-clamp-3 whitespace-pre-wrap">
                    {p.content}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 dark:text-zinc-500 mt-1.5">
                    <span>👍 {p.likes || 0}</span>
                    <span>👎 {p.dislikes || 0}</span>
                    <span>💬 {p.comments?.length || 0}</span>
                    <span>👁 {p.views || 0}</span>
                    {p.created_at && (
                      <span>{new Date(p.created_at).toLocaleDateString('uz-UZ')}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => togglePinPost(p)}
                    className={`p-1.5 rounded-lg text-xs ${
                      p.is_pinned
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                    title={p.is_pinned ? 'Pinni olib tashlash' : 'Pinlash'}
                  >
                    {p.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                  </button>
                  <button
                    onClick={() => deletePost(p.id)}
                    className="p-1.5 rounded-lg text-xs bg-red-100 text-red-700 hover:bg-red-200"
                    title="O‘chirish"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ekspert qo‘shish</h3>
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

      {/* ── ADD GROUP MODAL ── */}
      {showAddGroup && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddGroup(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Guruh qo‘shish</h3>
              <button
                onClick={() => setShowAddGroup(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={groupForm.name}
                onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Guruh nomi *"
                className={inputCls}
              />
              <textarea
                value={groupForm.description}
                onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Tavsif"
                rows={2}
                className={`${inputCls} resize-none`}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={groupForm.category}
                  onChange={e => setGroupForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="Kategoriya (masalan: Jinoyat huquqi)"
                  className={inputCls}
                />
                <div>
                  <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">
                    Belgi (icon)
                  </label>
                  <div className="flex gap-1.5">
                    {['👥', '📚', '⚖️', '🔬', '💼', '🌐'].map(icon => (
                      <button
                        key={icon}
                        onClick={() => setGroupForm(f => ({ ...f, icon }))}
                        className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                          groupForm.icon === icon
                            ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                            : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-zinc-400 mb-1">
                  Maxfiylik
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGroupForm(f => ({ ...f, is_private: false }))}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                      !groupForm.is_private
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                      🌍 Ommaviy
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">
                      Hamma ko'radi
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupForm(f => ({ ...f, is_private: true }))}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                      groupForm.is_private
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                      🔒 Maxfiy
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">
                      Taklif kodi bilan
                    </div>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddGroup(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl"
              >
                Bekor qilish
              </button>
              <button
                onClick={addGroup}
                disabled={!groupForm.name.trim()}
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Vebinar qo‘shish</h3>
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
