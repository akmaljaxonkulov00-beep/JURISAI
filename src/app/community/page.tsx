'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import {
  ArrowLeft,
  Users,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Calendar,
  Star,
  Verified,
  Search,
  Plus,
  Filter,
  Award,
  Video,
  Clock,
  Eye,
  UserCircle,
  Trash2,
  Edit3,
  X,
  Send,
  Bell,
  ChevronLeft,
  ChevronRight,
  Hash,
  Gavel,
  CheckCircle,
  Loader2,
  Lock,
  Copy,
  KeyRound,
  RefreshCw,
} from 'lucide-react'
import { useCommunity, CommunityPost } from '@/hooks/useCommunity'
import AppSidebar from '@/components/layout/AppSidebar'
import { getUserIdentityPayload } from '@/lib/client-user'

export default function Community() {
  const {
    posts,
    allPosts,
    totalPosts,
    totalPages,
    page,
    currentUser,
    notifications,
    unreadCount,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    toggleDislike,
    addComment,
    deleteComment,
    incrementView,
    markNotificationRead,
    clearNotifications,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    setPage,
    refresh,
    pauseRefresh,
    resumeRefresh,
    timeAgo,
  } = useCommunity()

  const [activeTab, setActiveTab] = useState<string>('feed')
  const [showNewPost, setShowNewPost] = useState(false)
  const [editingPost, setEditingPost] = useState<string | null>(null)
  const [postContent, setPostContent] = useState('')
  const [postCategory, setPostCategory] = useState<'question' | 'discussion' | 'case' | 'news'>(
    'discussion'
  )
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})
  const [showNotifications, setShowNotifications] = useState(false)
  const [experts, setExperts] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [webinars, setWebinars] = useState<any[]>([])
  const [expertsLoading, setExpertsLoading] = useState(false)
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [webinarsLoading, setWebinarsLoading] = useState(false)
  const [joinedGroups, setJoinedGroups] = useState<string[]>([])
  const [registeredWebinars, setRegisteredWebinars] = useState<string[]>([])
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [newGroupIcon, setNewGroupIcon] = useState('👥')
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<'public' | 'private'>('public')
  const [showJoinByCode, setShowJoinByCode] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinCodeLoading, setJoinCodeLoading] = useState(false)
  const [joinCodeError, setJoinCodeError] = useState('')
  const [createdGroup, setCreatedGroup] = useState<any>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  // ── Guruh xonasi (Telegram'dek) ──
  const [roomTab, setRoomTab] = useState<'chat' | 'members' | 'requests'>('chat')
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  const [groupRequests, setGroupRequests] = useState<any[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [isRoomCreator, setIsRoomCreator] = useState(false)
  const [myRequestSent, setMyRequestSent] = useState(false)
  const [roomBusy, setRoomBusy] = useState(false)

  // ── Guruh ichidagi muhokama ───────────────────────────────────
  const [openGroup, setOpenGroup] = useState<any>(null)
  const [groupPosts, setGroupPosts] = useState<any[]>([])
  const [groupPostsLoading, setGroupPostsLoading] = useState(false)
  const [newGroupPost, setNewGroupPost] = useState('')
  const [sendingGroupPost, setSendingGroupPost] = useState(false)

  // ── Maslahat / Mentorlik so'rovi ──────────────────────────────
  const [consultExpert, setConsultExpert] = useState<any>(null)
  const [consultType, setConsultType] = useState<'consultation' | 'mentorship'>('consultation')
  const [consultMessage, setConsultMessage] = useState('')
  const [consultSending, setConsultSending] = useState(false)
  const [consultSent, setConsultSent] = useState(false)

  // ── Yagona sidebar vositalari (desktop) — AppSidebar ichida ────────
  const renderSidebarTools = () => (
    <div className="space-y-1">
      <button
        onClick={() => setActiveTab('feed')}
        className="flex items-center gap-2 px-3 py-2 w-full text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Orqaga
      </button>
      <button
        onClick={() => {
          pauseRefresh()
          setShowNewPost(true)
          setEditingPost(null)
          setPostContent('')
          setSelectedTags([])
        }}
        className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors mb-2 flex items-center justify-center gap-2 shadow-sm"
      >
        <Plus className="w-4 h-4" /> Yangi post
      </button>
      <nav className="space-y-1">
        {[
          { id: 'feed', label: 'Lenta', icon: <MessageCircle className="w-4 h-4" /> },
          {
            id: 'notification',
            label: 'Bildirishnomalar',
            icon: <Bell className="w-4 h-4" />,
            badge: unreadCount,
          },
          { id: 'experts', label: 'Ekspertlar', icon: <Star className="w-4 h-4" /> },
          { id: 'groups', label: 'Guruhlar', icon: <Users className="w-4 h-4" /> },
          { id: 'webinars', label: 'Vebinarlar', icon: <Video className="w-4 h-4" /> },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
              activeTab === item.id
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
            {(item as any).badge > 0 && (
              <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
                {(item as any).badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )

  // ── Mobil tab bar — desktop sidebar yashirin bo'lganda ─────────────
  const renderMobileTabs = () => (
    <div className="md:hidden mb-4 flex gap-2 overflow-x-auto pb-1">
      {[
        { id: 'feed', label: 'Lenta', icon: <MessageCircle className="w-3.5 h-3.5" /> },
        {
          id: 'notification',
          label: 'Bildirishnomalar',
          icon: <Bell className="w-3.5 h-3.5" />,
          badge: unreadCount,
        },
        { id: 'experts', label: 'Ekspertlar', icon: <Star className="w-3.5 h-3.5" /> },
        { id: 'groups', label: 'Guruhlar', icon: <Users className="w-3.5 h-3.5" /> },
        { id: 'webinars', label: 'Vebinarlar', icon: <Video className="w-3.5 h-3.5" /> },
      ].map(item => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === item.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
          }`}
        >
          {item.icon}
          {item.label}
          {(item as any).badge > 0 && (
            <span className="px-1 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
              {(item as any).badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )

  // Load experts from API
  useEffect(() => {
    if (activeTab !== 'experts') return
    setExpertsLoading(true)
    fetch('/api/community/experts')
      .then(r => (r.ok ? r.json() : { data: [] }))
      .then(d => {
        setExperts(d.data || [])
        setExpertsLoading(false)
      })
      .catch(() => setExpertsLoading(false))
  }, [activeTab])

  // Load groups from API
  useEffect(() => {
    if (activeTab !== 'groups') return
    setGroupsLoading(true)
    const identity = getUserIdentityPayload()
    fetch(`/api/community/groups${identity.userId ? `?memberId=${identity.userId}` : ''}`)
      .then(r => (r.ok ? r.json() : { data: [] }))
      .then(d => {
        setGroups(d.data || [])
        setGroupsLoading(false)
      })
      .catch(() => setGroupsLoading(false))
    // Load joined groups from localStorage
    try {
      const joined = localStorage.getItem('community_joined_groups')
      if (joined) setJoinedGroups(JSON.parse(joined))
    } catch {}
  }, [activeTab])

  // Load webinars from API
  useEffect(() => {
    if (activeTab !== 'webinars') return
    setWebinarsLoading(true)
    fetch('/api/community/webinars')
      .then(r => (r.ok ? r.json() : { data: [] }))
      .then(d => {
        setWebinars(d.data || [])
        setWebinarsLoading(false)
      })
      .catch(() => setWebinarsLoading(false))
    try {
      const reg = localStorage.getItem('community_registered_webinars')
      if (reg) setRegisteredWebinars(JSON.parse(reg))
    } catch {}
  }, [activeTab])

  // Join group — member_count ni DB'da ham oshiradi
  const joinGroup = async (groupId: string) => {
    if (joinedGroups.includes(groupId)) return
    const updated = [...joinedGroups, groupId]
    setJoinedGroups(updated)
    localStorage.setItem('community_joined_groups', JSON.stringify(updated))
    setGroups(prev =>
      prev.map(g => (g.id === groupId ? { ...g, member_count: (g.member_count || 0) + 1 } : g))
    )
    try {
      await fetch('/api/community/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: groupId, delta: 1, userId: getUserIdentityPayload().userId }),
      })
    } catch {}
  }

  // Leave group — member_count ni DB'da ham kamaytiradi
  const leaveGroup = async (groupId: string) => {
    if (!joinedGroups.includes(groupId)) return
    const updated = joinedGroups.filter(id => id !== groupId)
    setJoinedGroups(updated)
    localStorage.setItem('community_joined_groups', JSON.stringify(updated))
    setGroups(prev =>
      prev.map(g => (g.id === groupId ? { ...g, member_count: Math.max(0, (g.member_count || 0) - 1) } : g))
    )
    try {
      await fetch('/api/community/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: groupId, delta: -1, userId: getUserIdentityPayload().userId }),
      })
    } catch {}
  }

  // Create group
  const createGroup = async () => {
    if (!newGroupName.trim()) return
    try {
      const r = await fetch('/api/community/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc,
          icon: newGroupIcon,
          is_private: newGroupPrivacy === 'private',
        }),
      })
      const d = await r.json()
      if (d.success && d.data) {
        setGroups(prev => [d.data, ...prev])
        joinGroup(d.data.id)
        if (d.data.is_private) {
          setCreatedGroup(d.data)
          setShowCreateGroup(false)
          setNewGroupName('')
          setNewGroupDesc('')
          setNewGroupPrivacy('public')
          return
        }
      }
    } catch {}
    setShowCreateGroup(false)
    setNewGroupName('')
    setNewGroupDesc('')
    setNewGroupPrivacy('public')
  }

  // ── Maxfiy guruhga taklif kodi orqali qo'shilish ───────────────
  const joinByCode = async () => {
    const code = joinCode.trim()
    if (!code) {
      setJoinCodeError("Taklif kodini kiriting")
      return
    }
    setJoinCodeLoading(true)
    setJoinCodeError('')
    try {
      const identity = getUserIdentityPayload()
      const r = await fetch('/api/community/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId: identity.userId, userName: identity.email }),
      })
      const d = await r.json()
      if (d.success && d.data) {
        setGroups(prev => {
          const exists = prev.some(g => g.id === d.data.id)
          return exists ? prev : [d.data, ...prev]
        })
        const updated = [...joinedGroups, d.data.id]
        setJoinedGroups(updated)
        localStorage.setItem('community_joined_groups', JSON.stringify(updated))
        setShowJoinByCode(false)
        setJoinCode('')
      } else {
        setJoinCodeError(d.error || 'Kod topilmadi. Kodni tekshirib qayta urinib ko\'ring.')
      }
    } catch {
      setJoinCodeError("Xatolik yuz berdi. Qayta urinib ko'ring.")
    } finally {
      setJoinCodeLoading(false)
    }
  }

  // ── Guruh xonasini ochish (chat + a'zolar + so'rovlar) ──────
  const openGroupRoom = async (g: any) => {
    setOpenGroup(g)
    setGroupPosts([])
    setGroupPostsLoading(true)
    setNewGroupPost('')
    setRoomTab('chat')
    setGroupMembers([])
    setGroupRequests([])
    const identity = getUserIdentityPayload()
    setIsRoomCreator(!!identity.userId && g.created_by === identity.userId)
    setMyRequestSent(false)

    // Postlarni yuklash
    try {
      const r = await fetch(`/api/community/groups/posts?groupId=${g.id}`, { cache: 'no-cache' })
      const d = await r.json()
      setGroupPosts(d.data || [])
    } catch {
      setGroupPosts([])
    } finally {
      setGroupPostsLoading(false)
    }

    // A'zolarni yuklash
    loadGroupMembers(g.id)

    // So'rovlar (yaratuvchi uchun) + mening so'rov holatim
    if (g.is_private) {
      try {
        const r = await fetch(`/api/community/groups/requests?groupId=${g.id}`, {
          cache: 'no-cache',
        })
        const d = await r.json()
        const reqs = d.data || []
        setGroupRequests(reqs)
        if (identity.userId) {
          const mine = reqs.find((x: any) => x.user_id === identity.userId)
          if (mine) setMyRequestSent(mine.status === 'pending')
        }
      } catch {}
    }
  }

  // ── A'zolar ro'yxatini yuklash ──
  const loadGroupMembers = async (groupId: string) => {
    setMembersLoading(true)
    try {
      const r = await fetch(`/api/community/groups/members?groupId=${groupId}`, {
        cache: 'no-cache',
      })
      const d = await r.json()
      setGroupMembers(d.data || [])
    } catch {
      setGroupMembers([])
    } finally {
      setMembersLoading(false)
    }
  }

  // ── Qo'shilish so'rovini yuborish (maxfiy guruh) ──
  const sendJoinRequest = async () => {
    if (!openGroup) return
    const identity = getUserIdentityPayload()
    if (!identity.userId) {
      setJoinCodeError('Kirish kerak')
      return
    }
    setRoomBusy(true)
    try {
      const r = await fetch('/api/community/groups/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: openGroup.id,
          userId: identity.userId,
          userName: identity.email || '',
          userEmail: identity.email || '',
        }),
      })
      const d = await r.json()
      if (d.success) {
        setMyRequestSent(true)
      }
    } catch {}
    setRoomBusy(false)
  }

  // ── So'rovni tasdiqlash / rad etish (yaratuvchi) ──
  const decideRequest = async (reqId: string, status: 'approved' | 'rejected') => {
    setRoomBusy(true)
    try {
      const r = await fetch('/api/community/groups/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reqId, status }),
      })
      const d = await r.json()
      if (d.success) {
        setGroupRequests(prev =>
          prev.map(x => (x.id === reqId ? { ...x, status } : x))
        )
        if (status === 'approved' && openGroup) {
          // A'zo sonini + ro'yxatni yangilash
          setOpenGroup((g: any) => ({
            ...g,
            member_count: (g?.member_count || 0) + 1,
          }))
          loadGroupMembers(openGroup.id)
        }
      }
    } catch {}
    setRoomBusy(false)
  }

  // ── A'zoni guruhdan chiqarish (yaratuvchi) ──
  const removeGroupMember = async (userId: string) => {
    if (!openGroup) return
    if (!confirm("Bu a'zoni guruhdan chiqarishni tasdiqlaysizmi?")) return
    setRoomBusy(true)
    try {
      const r = await fetch(
        `/api/community/groups/members?groupId=${openGroup.id}&userId=${userId}`,
        { method: 'DELETE' }
      )
      if (r.ok) {
        setGroupMembers(prev => prev.filter(m => m.user_id !== userId))
        setOpenGroup((g: any) => ({
          ...g,
          member_count: Math.max(0, (g?.member_count || 0) - 1),
        }))
      }
    } catch {}
    setRoomBusy(false)
  }

  // ── Taklif kodini qayta yaratish (yaratuvchi) ──
  const regenerateGroupCode = async () => {
    if (!openGroup) return
    setRoomBusy(true)
    try {
      const r = await fetch('/api/community/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: openGroup.id, regenerate_code: true }),
      })
      const d = await r.json()
      if (d.success && d.data) {
        setOpenGroup({ ...openGroup, invite_code: d.data.invite_code })
      }
    } catch {}
    setRoomBusy(false)
  }

  // ── Guruh postlari realtime — boshqa a'zolarning yangi xabarlari darhol ko'rinadi ──
  useEffect(() => {
    if (!openGroup) return
    const channel = supabase
      .channel(`group-posts-${openGroup.id}-${Date.now()}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_group_posts',
          filter: `group_id=eq.${openGroup.id}`,
        },
        (payload: any) => {
          const np = payload?.new
          if (np?.id) {
            setGroupPosts(prev =>
              prev.some(p => p.id === np.id) ? prev : [np, ...prev]
            )
            setGroups(prev =>
              prev.map(g =>
                g.id === openGroup.id ? { ...g, post_count: (g.post_count || 0) + 1 } : g
              )
            )
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [openGroup])

  // ── Guruh ichiga post yozish ──────────────────────────────────
  const sendGroupPost = async () => {
    if (!openGroup || !newGroupPost.trim() || sendingGroupPost) return
    setSendingGroupPost(true)
    const content = newGroupPost.trim()
    setNewGroupPost('')
    const user = currentUser
    let userId = user?.id || ''
    let userName = user?.name || 'Foydalanuvchi'
    try {
      const stored = sessionStorage.getItem('jurisai_user') || localStorage.getItem('auth_user')
      if (stored) {
        const u = JSON.parse(stored)
        if (u?.id) userId = u.id
        if (u?.name || u?.user_name) userName = u.name || u.user_name
      }
    } catch {}
    try {
      const r = await fetch('/api/community/groups/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: openGroup.id, userId, userName, content }),
      })
      const d = await r.json()
      if (d.success && d.data) {
        setGroupPosts(prev => [d.data, ...prev])
        setGroups(prev =>
          prev.map(g =>
            g.id === openGroup.id ? { ...g, post_count: (g.post_count || 0) + 1 } : g
          )
        )
      }
    } catch {}
    setSendingGroupPost(false)
  }

  // ── Maslahat / Mentorlik so'rovini ochish ─────────────────────
  const openConsultation = (expert: any, type: 'consultation' | 'mentorship') => {
    setConsultExpert(expert)
    setConsultType(type)
    setConsultMessage('')
    setConsultSent(false)
  }

  // ── Maslahat / Mentorlik so'rovini yuborish ───────────────────
  const sendConsultation = async () => {
    if (!consultExpert || !consultMessage.trim() || consultSending) return
    setConsultSending(true)
    try {
      const user = currentUser
      // Email'ni sessionStorage'dan olish (CommunityUser'da email yo'q)
      let userEmail = ''
      try {
        const stored = sessionStorage.getItem('jurisai_user') || localStorage.getItem('auth_user')
        if (stored) userEmail = JSON.parse(stored).email || ''
      } catch {}
      await fetch('/api/community/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertId: consultExpert.id,
          expertName: consultExpert.name,
          userId: user?.id,
          userName: user?.name,
          userEmail,
          type: consultType,
          message: consultMessage.trim(),
        }),
      })
      setConsultSent(true)
    } catch {
      setConsultSent(true)
    } finally {
      setConsultSending(false)
    }
  }

  // Register for webinar — participants_count ni DB'da ham oshiradi
  const registerWebinar = async (webinarId: string) => {
    if (registeredWebinars.includes(webinarId)) return
    const target = webinars.find(w => w.id === webinarId)
    if (target && target.max_participants && (target.participants_count || 0) >= target.max_participants)
      return
    const updated = [...registeredWebinars, webinarId]
    setRegisteredWebinars(updated)
    localStorage.setItem('community_registered_webinars', JSON.stringify(updated))
    setWebinars(prev =>
      prev.map(w =>
        w.id === webinarId ? { ...w, participants_count: (w.participants_count || 0) + 1 } : w
      )
    )
    try {
      await fetch('/api/community/webinars', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: webinarId, delta: 1 }),
      })
    } catch {}
  }

  // ── Vebinar sanasini o'zbekcha formatlash ─────────────────────
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
  const formatWebinarDate = (dateStr: string): string => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}, ${hh}:${mm}`
  }

  const AVAILABLE_TAGS = [
    'fuqarolik_huquqi',
    'jinoyat_huquqi',
    'mehnat_huquqi',
    'oilaviy_kodeks',
    'sud_qarori',
    'shartnoma',
    'aliment',
    'stajirovka',
    'kiberjinoyat',
    '2024_yangiliklari',
    'xalqaro_huquq',
    'korporativ_huquq',
  ]

  const handlePostSubmit = () => {
    if (!postContent.trim()) return
    if (editingPost) {
      updatePost(editingPost, postContent, selectedTags, postCategory)
      setEditingPost(null)
    } else {
      createPost(postContent, postCategory, selectedTags)
    }
    resumeRefresh()
    setShowNewPost(false)
    setPostContent('')
    setSelectedTags([])
  }

  const handleEditPost = (post: CommunityPost) => {
    pauseRefresh()
    setPostContent(post.content)
    setSelectedTags(post.tags)
    setPostCategory(post.category)
    setEditingPost(post.id)
    setShowNewPost(true)
  }

  const handleDeletePost = (postId: string) => {
    if (confirm("Rostdan ham bu postni o'chirmoqchimisiz?")) {
      deletePost(postId)
    }
  }

  const handleCommentSubmit = (postId: string) => {
    const text = commentInputs[postId]?.trim()
    if (!text) return
    addComment(postId, text)
    setCommentInputs(prev => ({ ...prev, [postId]: '' }))
  }

  const handleReplySubmit = (postId: string, commentId: string) => {
    const key = `${postId}_${commentId}`
    const text = replyInputs[key]?.trim()
    if (!text) return
    addComment(postId, text, commentId)
    setReplyInputs(prev => ({ ...prev, [key]: '' }))
  }

  const handleExpandPost = (postId: string) => {
    if (expandedPost !== postId) {
      incrementView(postId)
    }
    setExpandedPost(expandedPost === postId ? null : postId)
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]))
  }

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'question':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'discussion':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'case':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'news':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      default:
        return 'bg-gray-100 dark:bg-zinc-800/50 text-gray-700 dark:text-zinc-300'
    }
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'question':
        return <MessageCircle className="w-3.5 h-3.5" />
      case 'discussion':
        return <Users className="w-3.5 h-3.5" />
      case 'case':
        return <Gavel className="w-3.5 h-3.5" />
      case 'news':
        return <TrendingUp className="w-3.5 h-3.5" />
      default:
        return <MessageCircle className="w-3.5 h-3.5" />
    }
  }

  const getCategoryText = (cat: string) => {
    switch (cat) {
      case 'question':
        return 'Savol'
      case 'discussion':
        return 'Muhokama'
      case 'case':
        return 'Keys'
      case 'news':
        return 'Yangilik'
      default:
        return cat
    }
  }

  const renderComments = (postId: string) => {
    const post = allPosts.find(p => p.id === postId)
    if (!post || post.comments.length === 0) return null

    const renderComment = (comment: any, depth: number = 0) => (
      <div
        key={comment.id}
        className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-gray-100 dark:border-zinc-700' : ''}`}
      >
        <div className="flex gap-2 py-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <UserCircle className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-800 dark:text-zinc-200">
                {comment.author.name}
              </span>
              {comment.author.verified && <Verified className="w-3 h-3 text-blue-500" />}
              <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                {timeAgo(comment.createdAt)}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-zinc-300 mt-0.5">{comment.content}</p>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5">
                {comment.likes > 0 && (
                  <span className="text-[10px] text-gray-500 dark:text-zinc-400">
                    {comment.likes} 👍
                  </span>
                )}
              </div>
              <button
                onClick={() =>
                  setReplyInputs(prev => {
                    const key = `${postId}_${comment.id}`
                    if (prev[key] !== undefined) {
                      const newInputs = { ...prev }
                      delete newInputs[key]
                      return newInputs
                    }
                    return { ...prev, [key]: '' }
                  })
                }
                className="text-[10px] text-blue-500 hover:text-blue-600"
              >
                Javob
              </button>
            </div>
            {/* Reply input */}
            {replyInputs[`${postId}_${comment.id}`] !== undefined && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={replyInputs[`${postId}_${comment.id}`] || ''}
                  onChange={e =>
                    setReplyInputs(prev => ({
                      ...prev,
                      [`${postId}_${comment.id}`]: e.target.value,
                    }))
                  }
                  onKeyDown={e => e.key === 'Enter' && handleReplySubmit(postId, comment.id)}
                  placeholder="Javob yozish..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleReplySubmit(postId, comment.id)}
                  className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            )}
            {/* Nested replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-1">
                {comment.replies.map((reply: any) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    )

    return (
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
        <div className="space-y-1">{post.comments.map((c: any) => renderComment(c))}</div>
      </div>
    )
  }

  // ── Post Card ──────────────────────────────────────────────────────────
  const renderPost = (post: CommunityPost) => {
    const isExpanded = expandedPost === post.id
    const isOwner = currentUser.id === post.author.id
    const isLiked = post.likedBy.includes(currentUser.id)
    const isDisliked = post.dislikedBy.includes(currentUser.id)

    return (
      <div
        key={post.id}
        className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-zinc-800"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm text-gray-800 dark:text-zinc-100">
                  {post.author.name}
                </span>
                {post.author.verified && <Verified className="w-3.5 h-3.5 text-blue-500" />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 dark:text-zinc-400">
                  {post.author.role}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-500">•</span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                  {timeAgo(post.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.isPinned && <Award className="w-4 h-4 text-orange-500" />}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${getCategoryColor(post.category)}`}
            >
              {getCategoryIcon(post.category)}
              {getCategoryText(post.category)}
            </span>
            {isOwner && (
              <div className="flex gap-1 ml-1">
                <button
                  onClick={() => handleEditPost(post)}
                  className="p-1 text-gray-400 dark:text-zinc-500 hover:text-blue-500 rounded transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="p-1 text-gray-400 dark:text-zinc-500 hover:text-red-500 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div onClick={() => handleExpandPost(post.id)} className="cursor-pointer mb-3">
          <p
            className={`text-sm text-gray-700 dark:text-zinc-300 leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}
          >
            {post.content}
          </p>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => toggleLike(post.id)}
              className={`flex items-center gap-1 text-xs transition-colors ${isLiked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-zinc-400 hover:text-blue-500'}`}
            >
              <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{post.likes}</span>
            </button>
            <button
              onClick={() => toggleDislike(post.id)}
              className={`flex items-center gap-1 text-xs transition-colors ${isDisliked ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-zinc-400 hover:text-red-500'}`}
            >
              <ThumbsDown className={`w-4 h-4 ${isDisliked ? 'fill-current' : ''}`} />
              <span>{post.dislikes}</span>
            </button>
            <button
              onClick={e => {
                e.stopPropagation()
                if (!isExpanded) handleExpandPost(post.id)
                setExpandedPost(isExpanded ? null : post.id)
              }}
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-zinc-400 hover:text-blue-500 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{post.comments.length}</span>
            </button>
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500">
              <Eye className="w-4 h-4" />
              <span>{post.views}</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {isExpanded && (
          <div className="mt-3">
            {/* Existing comments */}
            {renderComments(post.id)}

            {/* Comment input */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
              <input
                type="text"
                value={commentInputs[post.id] || ''}
                onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleCommentSubmit(post.id)}
                placeholder="Izoh yozish..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleCommentSubmit(post.id)}
                disabled={!commentInputs[post.id]?.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Main Feed ──────────────────────────────────────────────────────────
  if (activeTab === 'feed') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 mobile-safe-top">
        <div className="flex">
          {/* Sidebar — yagona navigatsiya (desktop) */}
          <AppSidebar>{renderSidebarTools()}</AppSidebar>

          {/* Main Content */}
          <div className="flex-1 min-h-screen">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-900 px-6 py-4 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('feed')}
                    className="lg:hidden p-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Jamiyat</h1>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                      Huquqiy forum va muhokamalar
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Mobile notification bell */}
                  <button
                    onClick={() => setActiveTab('notification')}
                    className="relative lg:hidden p-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <div className="relative hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Postlar, teglar..."
                      className="w-48 lg:w-64 pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-zinc-800 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </header>

            <main className="p-4 sm:p-6 max-w-5xl mx-auto">
              {renderMobileTabs()}
              {/* Mobile Search + Filters */}
              <div className="sm:hidden mb-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Qidirish..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {['all', 'discussion', 'question', 'case', 'news'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        categoryFilter === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {cat === 'all' ? 'Barchasi' : getCategoryText(cat)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    pauseRefresh()
                    setShowNewPost(true)
                    setEditingPost(null)
                    setPostContent('')
                    setSelectedTags([])
                  }}
                  className="w-full mt-3 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Yangi post
                </button>
              </div>

              {/* Category filters (desktop) */}
              <div className="hidden sm:flex gap-2 mb-5 overflow-x-auto">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Filter className="w-3 h-3 inline mr-1" /> Barchasi
                </button>
                {['discussion', 'question', 'case', 'news'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                      categoryFilter === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {getCategoryIcon(cat)} {getCategoryText(cat)}
                  </button>
                ))}
              </div>

              {/* Loading */}
              {loading && (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-zinc-400">Yuklanmoqda...</p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400 mb-4">
                  {error}
                  <button onClick={refresh} className="ml-2 underline hover:no-underline">
                    Qayta urinish
                  </button>
                </div>
              )}

              {/* Posts */}
              {!loading && (
                <div className="space-y-4">
                  {posts.length === 0 ? (
                    <div className="text-center py-16">
                      <MessageCircle className="w-16 h-16 text-gray-300 dark:text-zinc-700 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Hozircha postlar yo'q
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
                        Birinchi postni yozing va muhokamani boshlang!
                      </p>
                      <button
                        onClick={() => {
                          setShowNewPost(true)
                          setEditingPost(null)
                          setPostContent('')
                          setSelectedTags([])
                        }}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4 inline mr-1" /> Yangi post
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                          {totalPosts} ta post
                        </p>
                        <button
                          onClick={refresh}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Yangilash
                        </button>
                      </div>
                      {posts.map(renderPost)}
                    </>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page <= 1}
                        className="p-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                            page === p
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                        className="p-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>

        {/* New Post / Edit Post Modal */}
        {showNewPost && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewPost(false)}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-xl w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingPost ? 'Postni tahrirlash' : 'Yangi post yaratish'}
                </h3>
                <button
                  onClick={() => {
                    resumeRefresh()
                    setShowNewPost(false)
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category */}
              <div className="flex gap-2 mb-4">
                {(['discussion', 'question', 'case', 'news'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setPostCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      postCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {getCategoryText(cat)}
                  </button>
                ))}
              </div>

              <textarea
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                placeholder="O'z fikringizni yozing..."
                className="w-full h-32 px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              {/* Tags */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Teglar
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs flex items-center gap-1"
                    >
                      #{tag}
                      <button
                        onClick={() => handleTagToggle(tag)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {AVAILABLE_TAGS.filter(t => !selectedTags.includes(t)).map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded text-xs hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    resumeRefresh()
                    setShowNewPost(false)
                  }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handlePostSubmit}
                  disabled={!postContent.trim()}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {editingPost ? 'Saqlash' : 'Yuborish'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Notifications Tab ──────────────────────────────────────────────────
  if (activeTab === 'notification') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 mobile-safe-top">
        <div className="flex">
          {/* Sidebar — yagona navigatsiya (desktop) */}
          <AppSidebar>{renderSidebarTools()}</AppSidebar>

          <div className="flex-1">
            <header className="bg-white dark:bg-zinc-900 px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('feed')}
                    className="lg:hidden p-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Bildirishnomalar
                  </h1>
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="text-xs text-red-500 hover:text-red-600 hover:underline"
                  >
                    Barchasini o'chirish
                  </button>
                )}
              </div>
            </header>
            <main className="p-4 sm:p-6 max-w-3xl mx-auto">
              {renderMobileTabs()}
              {notifications.length === 0 ? (
                <div className="text-center py-16">
                  <Bell className="w-16 h-16 text-gray-300 dark:text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Bildirishnomalar yo'q
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Kimdir postingizga like bossa yoki izoh qoldirsa, bu yerda ko'rinadi.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-colors ${
                        notif.read
                          ? 'bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800'
                          : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${notif.type === 'like' ? 'bg-red-100 dark:bg-red-900/30 text-red-500' : notif.type === 'comment' ? 'bg-green-100 dark:bg-green-900/30 text-green-500' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'}`}
                        >
                          {notif.type === 'like' ? (
                            <ThumbsUp className="w-4 h-4" />
                          ) : notif.type === 'comment' ? (
                            <MessageCircle className="w-4 h-4" />
                          ) : (
                            <Bell className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 dark:text-zinc-200">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                            {timeAgo(notif.createdAt)}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    )
  }

  // ── Experts Tab ────────────────────────────────────────────────────
  if (activeTab === 'experts') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 mobile-safe-top">
        <div className="flex">
          {/* Sidebar — yagona navigatsiya (desktop) */}
          <AppSidebar>{renderSidebarTools()}</AppSidebar>
          <div className="flex-1">
            <header className="bg-white dark:bg-zinc-900 px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('feed')}
                    className="lg:hidden p-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Ekspertlar va Mentorlar
                  </h1>
                </div>
              </div>
            </header>
            <main className="p-4 sm:p-6 max-w-5xl mx-auto">
              {renderMobileTabs()}
              {expertsLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Ekspertlar yuklanmoqda...
                  </p>
                </div>
              ) : experts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-5">
                    <Star className="w-10 h-10 text-blue-500" />
                  </div>
                  <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full text-xs font-medium mb-4">
                    Tez orada
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Ekspertlar bo\'limi tez orada qo\'shiladi
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-md mx-auto">
                    Hozirda ushbu bo\'lim tayyorlanmoqda. Professional huquqshunoslar va
                    mentorlar qo\'shilishi bilan bu yerda ko\'rinadi.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {experts.map((e: any, i: number) => (
                    <div
                      key={e.id || i}
                      className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-zinc-800"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserCircle className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                              {e.name}
                            </h3>
                            {e.is_verified && (
                              <Verified className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">{e.title}</p>
                          <p className="text-xs text-gray-600 dark:text-zinc-300 mb-2">
                            <span className="font-medium">Mutaxassislik:</span> {e.specialization}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-400 mb-3">
                            <span>⭐ {e.reputation} rep</span>
                            <span>📺 {e.webinars_count} vebinar</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openConsultation(e, 'consultation')}
                              className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Maslahat so'rash
                            </button>
                            <button
                              onClick={() => openConsultation(e, 'mentorship')}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Mentorlik
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Maslahat / Mentorlik so'rovi modali */}
        {consultExpert && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setConsultExpert(null)}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-5">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {consultType === 'mentorship' ? "Mentorlik so'rovi" : "Maslahat so'rovi"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    {consultExpert.name} • {consultExpert.title}
                  </p>
                </div>
                <button
                  onClick={() => setConsultExpert(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {consultSent ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    So'rov yuborildi!
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
                    {consultExpert.name} sizning so'rovingizni ko'rib chiqadi.
                  </p>
                  <button
                    onClick={() => setConsultExpert(null)}
                    className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Yopish
                  </button>
                </div>
              ) : (
                <>
                  <textarea
                    value={consultMessage}
                    onChange={e => setConsultMessage(e.target.value)}
                    placeholder={
                      consultType === 'mentorship'
                        ? "Mentorlik bo'yicha savolingizni yozing..."
                        : "Maslahat olmoqchi bo'lgan masalangizni yozing..."
                    }
                    rows={4}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => setConsultExpert(null)}
                      className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                    >
                      Bekor qilish
                    </button>
                    <button
                      onClick={sendConsultation}
                      disabled={!consultMessage.trim() || consultSending}
                      className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
                    >
                      {consultSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Yuborilmoqda...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Yuborish
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Groups Tab ──────────────────────────────────────────────────────
  if (activeTab === 'groups') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 mobile-safe-top">
        <div className="flex">
          {/* Sidebar — yagona navigatsiya (desktop) */}
          <AppSidebar>{renderSidebarTools()}</AppSidebar>
          <div className="flex-1">
            <header className="bg-white dark:bg-zinc-900 px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('feed')}
                    className="lg:hidden p-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Guruhlar va Klublar
                  </h1>
                </div>
              </div>
            </header>
            <main className="p-4 sm:p-6 max-w-5xl mx-auto">
              {renderMobileTabs()}
              {groupsLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Guruhlar yuklanmoqda...
                  </p>
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-5">
                    <Users className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Hozircha guruhlar yo\'q
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
                    Birinchi guruhni siz yarating yoki admin qo\'shgan guruhlarni kuting.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => setShowCreateGroup(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Yangi guruh yaratish
                    </button>
                    <button
                      onClick={() => {
                        setJoinCode('')
                        setJoinCodeError('')
                        setShowJoinByCode(true)
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors shadow-sm"
                    >
                      <KeyRound className="w-4 h-4" /> Kod bilan qo'shilish
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groups.map((g: any, i: number) => {
                      const isJoined = joinedGroups.includes(g.id)
                      return (
                        <div
                          key={i}
                          onClick={() => openGroupRoom(g)}
                          className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-zinc-800 cursor-pointer hover:border-blue-200 dark:hover:border-blue-800"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                              {g.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                                {g.name}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">
                                {g.description}
                              </p>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-gray-500 dark:text-zinc-400">
                                  👥 {g.member_count || 0} a\'zo
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {g.is_private && (
                                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-[10px] flex items-center gap-0.5">
                                      <Lock className="w-2.5 h-2.5" /> Maxfiy
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded text-[10px]">
                                    {g.category || 'Umumiy'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={e => {
                                    e.stopPropagation()
                                    if (isJoined) leaveGroup(g.id)
                                    else if (g.is_private) {
                                      setJoinCode('')
                                      setJoinCodeError('')
                                      setShowJoinByCode(true)
                                    } else joinGroup(g.id)
                                  }}
                                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${isJoined ? 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300' : g.is_private ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                >
                                  {isJoined ? "A'zo bo'lgan" : g.is_private ? '🔑 Kod bilan qo\'shilish' : "Qo'shilish"}
                                </button>
                                {isJoined && (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation()
                                      openGroupRoom(g)
                                    }}
                                    className="px-3 py-1.5 text-xs rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                    title="Guruh xonasini ochish"
                                  >
                                    💬 Xona
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={() => setShowCreateGroup(true)}
                      className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-500 dark:text-zinc-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-1" /> Yangi guruh yaratish
                    </button>
                    <button
                      onClick={() => {
                        setJoinCode('')
                        setJoinCodeError('')
                        setShowJoinByCode(true)
                      }}
                      className="w-full p-4 border-2 border-dashed border-amber-300 dark:border-amber-800 rounded-xl text-sm text-amber-600 dark:text-amber-400 hover:border-amber-400 hover:text-amber-500 transition-colors"
                    >
                      <KeyRound className="w-4 h-4 inline mr-1" /> Kod bilan qo'shilish
                    </button>
                  </div>
                </>
              )}
            </main>
          </div>
        </div>

        {/* Create Group Modal */}
        {showCreateGroup && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowCreateGroup(false)
              setNewGroupName('')
              setNewGroupDesc('')
            }}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Yangi guruh yaratish
                </h3>
                <button
                  onClick={() => {
                    setShowCreateGroup(false)
                    setNewGroupName('')
                    setNewGroupDesc('')
                    setNewGroupPrivacy('public')
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                    Guruh nomi
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="Masalan: Fuqarolik huquqi klubi"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                    Tavsif
                  </label>
                  <textarea
                    value={newGroupDesc}
                    onChange={e => setNewGroupDesc(e.target.value)}
                    placeholder="Guruh haqida qisqacha ma'lumot..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                    Belgi (icon)
                  </label>
                  <div className="flex gap-2">
                    {['👥', '📚', '⚖️', '🔬', '💼', '🌐', '🎓', '🏛️'].map(icon => (
                      <button
                        key={icon}
                        onClick={() => setNewGroupIcon(icon)}
                        className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${newGroupIcon === icon ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : 'bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
                    Maxfiylik
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewGroupPrivacy('public')}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${newGroupPrivacy === 'public' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'}`}
                    >
                      <div className="text-sm font-medium text-gray-800 dark:text-zinc-200">🌍 Ommaviy</div>
                      <div className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5 leading-tight">
                        Hamma ko'radi va qo'shila oladi
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewGroupPrivacy('private')}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${newGroupPrivacy === 'private' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'}`}
                    >
                      <div className="text-sm font-medium text-gray-800 dark:text-zinc-200">🔒 Maxfiy</div>
                      <div className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5 leading-tight">
                        Faqat taklif kodi bilan qo'shilish
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateGroup(false)
                    setNewGroupName('')
                    setNewGroupDesc('')
                    setNewGroupPrivacy('public')
                  }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={createGroup}
                  disabled={!newGroupName.trim()}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Yaratish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Maxfiy guruh yaratildi — taklif kodi */}
        {createdGroup && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setCreatedGroup(null)}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
              onClick={e => e.stopPropagation()}
            >
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                Maxfiy guruh yaratildi!
              </h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
                "{createdGroup.name}" guruhining taklif kodi:
              </p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="font-mono text-2xl font-bold tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-2 border-dashed border-amber-300 dark:border-amber-700 px-6 py-3 rounded-xl">
                  {createdGroup.invite_code}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdGroup.invite_code || '')
                    setCopiedCode(true)
                    setTimeout(() => setCopiedCode(false), 2000)
                  }}
                  className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                  title="Nusxa olish"
                >
                  {copiedCode ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mb-5 leading-relaxed">
                Bu kodni guruhga taklif qilmoqchi bo'lgan do'stlaringizga yuboring. Faqat shu kod
                orqali guruhga qo'shilish mumkin.
              </p>
              <button
                onClick={() => setCreatedGroup(null)}
                className="w-full px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                Tushunarli
              </button>
            </div>
          </div>
        )}

        {/* Kod bilan qo'shilish modali */}
        {showJoinByCode && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowJoinByCode(false)}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-500" /> Maxfiy guruhga qo'shilish
                </h3>
                <button
                  onClick={() => setShowJoinByCode(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">
                Maxfiy guruhga qo'shilish uchun guruh yaratuvchisi bergan taklif kodini kiriting.
              </p>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCD1234"
                maxLength={8}
                className="w-full px-3 py-3 text-center font-mono text-lg tracking-widest uppercase rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {joinCodeError && (
                <p className="text-red-500 text-xs mt-2">{joinCodeError}</p>
              )}
              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => setShowJoinByCode(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={joinByCode}
                  disabled={joinCodeLoading || !joinCode.trim()}
                  className="px-5 py-2 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {joinCodeLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Tekshirilmoqda...
                    </span>
                  ) : (
                    "Qo'shilish"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Guruh xonasi modali (Telegram'dek) */}
        {openGroup && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setOpenGroup(null)}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Guruh sarlavhasi */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {openGroup.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {openGroup.name}
                      </h3>
                      {openGroup.is_private && (
                        <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-[10px] flex items-center gap-0.5 flex-shrink-0">
                          <Lock className="w-2.5 h-2.5" /> Maxfiy
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                      {openGroup.description}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                      👥 {openGroup.member_count || 0} a\'zo • 💬 {openGroup.post_count || 0} post •{' '}
                      {openGroup.category || 'Umumiy'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {joinedGroups.includes(openGroup.id) ? (
                    <button
                      onClick={() => leaveGroup(openGroup.id)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
                    >
                      Chiqish
                    </button>
                  ) : openGroup.is_private ? (
                    <button
                      onClick={sendJoinRequest}
                      disabled={myRequestSent || roomBusy}
                      className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {myRequestSent ? "So'rov yuborildi ✓" : "📩 So'rov yuborish"}
                    </button>
                  ) : (
                    <button
                      onClick={() => joinGroup(openGroup.id)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Qo'shilish
                    </button>
                  )}
                  <button
                    onClick={() => setOpenGroup(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tablar */}
              <div className="flex gap-1 px-4 pt-3 border-b border-gray-100 dark:border-zinc-800">
                <button
                  onClick={() => setRoomTab('chat')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${roomTab === 'chat' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}
                >
                  💬 Muhokama
                </button>
                <button
                  onClick={() => setRoomTab('members')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${roomTab === 'members' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}
                >
                  👥 A'zolar ({groupMembers.length})
                </button>
                {isRoomCreator && openGroup.is_private && (
                  <button
                    onClick={() => setRoomTab('requests')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1 ${roomTab === 'requests' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}
                  >
                    🔔 So'rovlar
                    {groupRequests.filter((r: any) => r.status === 'pending').length > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[9px] leading-none">
                        {groupRequests.filter((r: any) => r.status === 'pending').length}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Mazmun */}
              <div className="flex-1 overflow-y-auto min-h-[200px]">
                {/* Chat */}
                {roomTab === 'chat' && (
                  <div className="p-4 space-y-3 bg-gray-50/50 dark:bg-zinc-950/30">
                    {groupPostsLoading ? (
                      <div className="text-center py-10">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-gray-500 dark:text-zinc-400">Yuklanmoqda...</p>
                      </div>
                    ) : groupPosts.length === 0 ? (
                      <div className="text-center py-10">
                        <MessageCircle className="w-10 h-10 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-zinc-400">
                          Hozircha muhokama yo\'q. Birinchi xabarni siz yozing!
                        </p>
                      </div>
                    ) : (
                      groupPosts.map((p: any, idx: number) => (
                        <div
                          key={p.id || idx}
                          className="bg-white dark:bg-zinc-900 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-zinc-800"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-medium text-sm text-gray-800 dark:text-white flex items-center gap-1.5">
                              <UserCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span className="truncate">{p.user_name || 'Foydalanuvchi'}</span>
                            </span>
                            <span className="text-[10px] text-gray-400 flex-shrink-0">
                              {new Date(p.created_at).toLocaleDateString('uz-UZ', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
                            {p.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* A'zolar */}
                {roomTab === 'members' && (
                  <div className="p-4 space-y-3">
                    {membersLoading ? (
                      <div className="text-center py-10">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-gray-500 dark:text-zinc-400">A'zolar yuklanmoqda...</p>
                      </div>
                    ) : groupMembers.length === 0 ? (
                      <div className="text-center py-10 text-sm text-gray-500 dark:text-zinc-400">
                        Hozircha a'zolar yo\'q
                      </div>
                    ) : (
                      groupMembers.map(m => (
                        <div
                          key={m.user_id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-sm font-medium text-blue-700 dark:text-blue-300 flex-shrink-0">
                              {(m.name || m.email || 'U')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                {m.name || m.email || 'Foydalanuvchi'}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate">
                                {m.email || 'Guruh a\'zosi'}
                              </p>
                            </div>
                          </div>
                          {isRoomCreator && (
                            <button
                              onClick={() => removeGroupMember(m.user_id)}
                              className="p-1.5 rounded-lg text-xs bg-red-100 text-red-700 hover:bg-red-200 flex-shrink-0"
                              title="Guruhdan chiqarish"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    )}

                    {/* Taklif kodi — yaratuvchi uchun */}
                    {isRoomCreator && openGroup.is_private && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                        <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-2">
                          🔑 Taklif kodi
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-bold tracking-widest text-amber-700 dark:text-amber-400">
                            {openGroup.invite_code || '—'}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(openGroup.invite_code || '')
                              setCopiedCode(true)
                              setTimeout(() => setCopiedCode(false), 2000)
                            }}
                            className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                            title="Nusxa olish"
                          >
                            {copiedCode ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={regenerateGroupCode}
                            disabled={roomBusy}
                            className="ml-auto px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                            title="Yangi taklif kodi yaratish (eski kod bekor bo'ladi)"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Qayta yaratish
                          </button>
                        </div>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5">
                          Bu kodni guruhga taklif qilmoqchi bo'lganlarga yuboring. Kodni qayta
                          yaratsangiz eski kod bekor bo'ladi.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* So'rovlar — yaratuvchi uchun */}
                {roomTab === 'requests' && (
                  <div className="p-4 space-y-3">
                    {groupRequests.filter((r: any) => r.status === 'pending').length === 0 ? (
                      <div className="text-center py-10">
                        <Bell className="w-10 h-10 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-zinc-400">
                          Yangi qo'shilish so'rovlari yo'q
                        </p>
                      </div>
                    ) : (
                      groupRequests
                        .filter((r: any) => r.status === 'pending')
                        .map((req: any) => (
                          <div
                            key={req.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                {req.user_name || req.user_email || 'Foydalanuvchi'}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate">{req.user_email}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => decideRequest(req.id, 'approved')}
                                disabled={roomBusy}
                                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                Tasdiqlash
                              </button>
                              <button
                                onClick={() => decideRequest(req.id, 'rejected')}
                                disabled={roomBusy}
                                className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                              >
                                Rad etish
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>

              {/* Xabar yozish — faqat chat tab'ida */}
              {roomTab === 'chat' && (
                <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex gap-2">
                  <input
                    type="text"
                    value={newGroupPost}
                    onChange={e => setNewGroupPost(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendGroupPost()
                      }
                    }}
                    placeholder="Guruhga xabar yozing..."
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendGroupPost}
                    disabled={!newGroupPost.trim() || sendingGroupPost}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    {sendingGroupPost ? '...' : 'Yuborish'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Webinars Tab ────────────────────────────────────────────────────
  if (activeTab === 'webinars') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 mobile-safe-top">
        <div className="flex">
          {/* Sidebar — yagona navigatsiya (desktop) */}
          <AppSidebar>{renderSidebarTools()}</AppSidebar>
          <div className="flex-1">
            <header className="bg-white dark:bg-zinc-900 px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('feed')}
                    className="lg:hidden p-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vebinarlar</h1>
                </div>
              </div>
            </header>
            <main className="p-4 sm:p-6 max-w-5xl mx-auto">
              {renderMobileTabs()}
              {webinarsLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Vebinarlar yuklanmoqda...
                  </p>
                </div>
              ) : webinars.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-5">
                    <Video className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Hozircha vebinarlar yo\'q
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-md mx-auto">
                    Vebinarlar admin tomonidan rejalashtirilganda bu yerda ko\'rinadi.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {webinars.map((w: any, i: number) => {
                    const isRegistered = registeredWebinars.includes(w.id)
                    const webinarStart = new Date(w.date).getTime()
                    const webinarEnd = webinarStart + (w.duration_minutes || 60) * 60000
                    const now = Date.now()
                    const isLive = now >= webinarStart - 30 * 60000 && now <= webinarEnd
                    const isPast = now > webinarEnd
                    const isFull =
                      !!w.max_participants && (w.participants_count || 0) >= w.max_participants
                    return (
                      <div
                        key={i}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-zinc-800"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                                {w.title}
                              </h3>
                              {isLive && (
                                <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-[10px] font-medium animate-pulse">
                                  LIVE
                                </span>
                              )}
                              {isPast && (
                                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 rounded text-[10px] font-medium">
                                  Yakunlangan
                                </span>
                              )}
                            </div>
                            {w.description && (
                              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">
                                {w.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">
                              O\'tkazuvchi: {w.host || '-'}
                              {w.host_title ? ` (${w.host_title})` : ''}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-400 mb-2">
                              <span>📅 {formatWebinarDate(w.date)}</span>
                              <span>
                                ⏱ {w.duration_minutes ? w.duration_minutes + ' min' : '1 soat'}
                              </span>
                              <span>
                                👥 {w.participants_count || 0}
                                {w.max_participants ? `/${w.max_participants}` : ''}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded text-[10px]">
                              {w.category || 'Umumiy'}
                            </span>
                          </div>
                          <button
                            disabled={isPast || isFull}
                            onClick={() => (isRegistered ? null : registerWebinar(w.id))}
                            className={`px-4 py-2 text-xs rounded-lg whitespace-nowrap transition-colors ${
                              isLive
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : isPast
                                  ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed'
                                  : isRegistered
                                    ? 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {isLive
                              ? "Qo'shilish"
                              : isPast
                                ? 'Yakunlangan'
                                : isRegistered
                                  ? "Ro'yxatdan o'tilgan"
                                  : isFull
                                    ? "To'ldi"
                                    : "Ro'yxatdan o'tish"}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return null
}
