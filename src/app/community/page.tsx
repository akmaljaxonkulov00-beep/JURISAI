'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { useCommunity, CommunityPost } from '@/hooks/useCommunity'
import AppSidebar from '@/components/layout/AppSidebar'

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
    fetch('/api/community/groups')
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

  // Join group
  const joinGroup = (groupId: string) => {
    const updated = [...joinedGroups, groupId]
    setJoinedGroups(updated)
    localStorage.setItem('community_joined_groups', JSON.stringify(updated))
    // Try API
    fetch('/api/community/groups', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: groupId,
        member_count: groups.find(g => g.id === groupId)?.member_count + 1,
      }),
    }).catch(() => {})
  }

  // Leave group
  const leaveGroup = (groupId: string) => {
    const updated = joinedGroups.filter(id => id !== groupId)
    setJoinedGroups(updated)
    localStorage.setItem('community_joined_groups', JSON.stringify(updated))
  }

  // Create group
  const createGroup = async () => {
    if (!newGroupName.trim()) return
    try {
      const r = await fetch('/api/community/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName, description: newGroupDesc, icon: newGroupIcon }),
      })
      const d = await r.json()
      if (d.success && d.data) {
        setGroups(prev => [d.data, ...prev])
        joinGroup(d.data.id)
      }
    } catch {}
    setShowCreateGroup(false)
    setNewGroupName('')
    setNewGroupDesc('')
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

  // Register for webinar
  const registerWebinar = (webinarId: string) => {
    const updated = [...registeredWebinars, webinarId]
    setRegisteredWebinars(updated)
    localStorage.setItem('community_registered_webinars', JSON.stringify(updated))
    fetch('/api/community/webinars', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: webinarId,
        participants_count: webinars.find(w => w.id === webinarId)?.participants_count + 1,
      }),
    }).catch(() => {})
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
                  <Star className="w-16 h-16 text-gray-300 dark:text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Hozircha ekspertlar yo\'q
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Admin tomonidan ekspertlar qo\'shilgandan keyin bu yerda ko\'rinadi.
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
                    {consultType === 'mentorship' ? 'Mentorlik so\'rovi' : "Maslahat so'rovi"}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.map((g: any, i: number) => {
                  const isJoined = joinedGroups.includes(g.id)
                  return (
                    <div
                      key={i}
                      className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-zinc-800"
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
                              👥 {g.member_count} a\'zo
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded text-[10px]">
                              {g.category || 'Umumiy'}
                            </span>
                          </div>
                          <button
                            onClick={() => (isJoined ? leaveGroup(g.id) : joinGroup(g.id))}
                            className={`w-full px-3 py-1.5 text-xs rounded-lg transition-colors ${isJoined ? 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                          >
                            {isJoined ? "A'zo bo'lgan" : "Qo'shilish"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl text-sm text-gray-500 dark:text-zinc-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-1" /> Yangi guruh yaratish
              </button>
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
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateGroup(false)
                    setNewGroupName('')
                    setNewGroupDesc('')
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
              <div className="space-y-4">
                {webinars.map((w: any, i: number) => {
                  const isRegistered = registeredWebinars.includes(w.id)
                  const isLive = new Date(w.date).getTime() <= Date.now() + 86400000 * 3
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
                          </div>
                          <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">
                            O\'tkazuvchi: {w.host || '-'}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-400 mb-2">
                            <span>📅 {w.date}</span>
                            <span>
                              ⏱ {w.duration_minutes ? w.duration_minutes + ' min' : '1 soat'}
                            </span>
                            <span>👥 {w.participants_count}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded text-[10px]">
                            {w.category || 'Umumiy'}
                          </span>
                        </div>
                        <button
                          onClick={() => (isRegistered ? null : registerWebinar(w.id))}
                          className={`px-4 py-2 text-xs rounded-lg whitespace-nowrap transition-colors ${isLive ? 'bg-red-600 text-white hover:bg-red-700' : isRegistered ? 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                          {isLive
                            ? "Qo'shilish"
                            : isRegistered
                              ? "Ro'yxatdan o'tilgan"
                              : "Ro'yxatdan o'tish"}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return null
}
