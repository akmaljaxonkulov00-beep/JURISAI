'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase-client'

// ── Types ──────────────────────────────────────────────────────────────

export interface CommunityUser {
  id: string
  name: string
  avatar: string
  role: string
  verified: boolean
  reputation: number
}

export interface CommunityPost {
  id: string
  author: CommunityUser
  content: string
  category: 'question' | 'discussion' | 'case' | 'news'
  tags: string[]
  likes: number
  dislikes: number
  likedBy: string[]
  dislikedBy: string[]
  comments: CommunityComment[]
  views: number
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export interface CommunityComment {
  id: string
  postId: string
  author: CommunityUser
  content: string
  likes: number
  likedBy: string[]
  createdAt: string
  replies: CommunityComment[]
  parentId?: string
}

export interface CommunityNotification {
  id: string
  type: 'like' | 'comment' | 'reply' | 'mention' | 'post_approved'
  message: string
  fromUser: string
  postId?: string
  read: boolean
  createdAt: string
}

// ── Auth ──────────────────────────────────────────────────────────────

// ── Default Current User ───────────────────────────────────────────────

function getCurrentUser(): CommunityUser {
  if (typeof window === 'undefined') {
    return {
      id: 'guest',
      name: 'Mehmon',
      avatar: 'user',
      role: 'Foydalanuvchi',
      verified: false,
      reputation: 0,
    }
  }
  try {
    const stored = localStorage.getItem('auth_user') || sessionStorage.getItem('juristiv_user')
    if (stored) {
      const u = JSON.parse(stored)
      if (u && u.id) {
        return {
          id: u.id || u.uid || 'user_' + Date.now(),
          name: u.name || u.user_name || u.email || 'Foydalanuvchi',
          avatar: 'user',
          role: u.role || u.user_role || 'Foydalanuvchi',
          verified: false,
          reputation: u.reputation || 0,
        }
      }
    }
  } catch {}
  return {
    id: 'guest_' + Date.now(),
    name: 'Mehmon',
    avatar: 'user',
    role: 'Foydalanuvchi',
    verified: false,
    reputation: 0,
  }
}

// ── Helpers ────────────────────────────────────────────────────────────

function generateId(): string {
  return 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Hozir'
  if (mins < 60) return mins + ' min oldin'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + ' soat oldin'
  const days = Math.floor(hours / 24)
  if (days < 7) return days + ' kun oldin'
  return new Date(dateStr).toLocaleDateString('uz-UZ')
}

// ── Hook ───────────────────────────────────────────────────────────────

export function useCommunity() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [notifications, setNotifications] = useState<CommunityNotification[]>([])
  const [currentUser, setCurrentUser] = useState<CommunityUser>(getCurrentUser)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Posts are loaded from DB API (loadFromApi) ──

  // NOTE: Posts are DB-backed. localStorage removed as primary source.

  // ── API'dan yuklash (Supabase — barcha qurilmalar uchun yagona manba) ──
  const loadFromApi = useCallback(async () => {
    try {
      const res = await fetch('/api/community/posts', { cache: 'no-cache' })
      const data = await res.json()
      if (data?.success && Array.isArray(data.data)) {
        setPosts(data.data)
      }
    } catch {
      // API failed — keep existing state
    }
  }, [])

  // ── Post'ni Supabase'ga sinxronlash (like/izoh/ko'rish va h.k.) ──
  const syncPost = useCallback(async (post: CommunityPost) => {
    try {
      await fetch('/api/community/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id,
          content: post.content,
          tags: post.tags,
          category: post.category,
          likes: post.likes,
          dislikes: post.dislikes,
          likedBy: post.likedBy,
          dislikedBy: post.dislikedBy,
          comments: post.comments,
          views: post.views,
          isPinned: post.isPinned,
        }),
      })
    } catch {}
  }, [])

  useEffect(() => {
    loadFromApi()
    setLoading(false)

    // Supabase Realtime — yangi post boshqa qurilmada yozilganda darhol ko'rinadi
    const channel = supabase
      .channel(`community-feed-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => {
        loadFromApi()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadFromApi])

  // Re-sync current user on mount
  useEffect(() => {
    setCurrentUser(getCurrentUser())
  }, [])

  // ── CRUD Operations ───────────────────────────────────────────────

  const createPost = useCallback(
    (content: string, category: CommunityPost['category'], tags: string[]) => {
      const user = getCurrentUser()
      const newPost: CommunityPost = {
        id: generateId(),
        author: user,
        content,
        category,
        tags,
        likes: 0,
        dislikes: 0,
        likedBy: [],
        dislikedBy: [],
        comments: [],
        views: 0,
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      // Optimistic UI update
      setPosts(prev => [newPost, ...prev])
      // Save to DB
      fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, category, tags, author: user }),
      })
        .then(() => loadFromApi())
        .catch(() => {})
      return newPost
    },
    [posts, loadFromApi]
  )

  const updatePost = useCallback(
    (postId: string, content: string, tags: string[], category?: CommunityPost['category']) => {
      const updated = posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            content,
            tags,
            category: category || p.category,
            updatedAt: new Date().toISOString(),
          }
        }
        return p
      })
      setPosts(updated)
      syncPost(updated.find(p => p.id === postId)!)?.catch(() => {})
    },
    [posts, syncPost]
  )

  const deletePost = useCallback(
    (postId: string) => {
      setPosts(prev => prev.filter(p => p.id !== postId))
      // Try API (Supabase-ready)
      fetch(`/api/community/posts?id=${postId}`, { method: 'DELETE' }).catch(() => {})
    },
    [posts]
  )

  // ── Like / Dislike ────────────────────────────────────────────────

  const toggleLike = useCallback(
    (postId: string) => {
      const user = getCurrentUser()
      const updated = posts.map(p => {
        if (p.id !== postId) return p
        const alreadyLiked = p.likedBy.includes(user.id)
        const alreadyDisliked = p.dislikedBy.includes(user.id)
        let newLikes = p.likes
        let newDislikes = p.dislikes
        let newLikedBy = [...p.likedBy]
        let newDislikedBy = [...p.dislikedBy]

        if (alreadyLiked) {
          newLikes--
          newLikedBy = newLikedBy.filter(id => id !== user.id)
        } else {
          newLikes++
          newLikedBy.push(user.id)
          if (alreadyDisliked) {
            newDislikes--
            newDislikedBy = newDislikedBy.filter(id => id !== user.id)
          }
          addNotification('like', `${user.name} postingizni yoqtirdi`, user.name, postId)
        }
        return {
          ...p,
          likes: newLikes,
          dislikes: newDislikes,
          likedBy: newLikedBy,
          dislikedBy: newDislikedBy,
        }
      })
      setPosts(updated)
      // DB-backed — no localStorage save
      const target = updated.find(p => p.id === postId)
      if (target) syncPost(target)
    },
    [posts, syncPost]
  )

  const toggleDislike = useCallback(
    (postId: string) => {
      const user = getCurrentUser()
      const updated = posts.map(p => {
        if (p.id !== postId) return p
        const alreadyDisliked = p.dislikedBy.includes(user.id)
        const alreadyLiked = p.likedBy.includes(user.id)
        let newLikes = p.likes
        let newDislikes = p.dislikes
        let newLikedBy = [...p.likedBy]
        let newDislikedBy = [...p.dislikedBy]

        if (alreadyDisliked) {
          newDislikes--
          newDislikedBy = newDislikedBy.filter(id => id !== user.id)
        } else {
          newDislikes++
          newDislikedBy.push(user.id)
          if (alreadyLiked) {
            newLikes--
            newLikedBy = newLikedBy.filter(id => id !== user.id)
          }
        }
        return {
          ...p,
          likes: newLikes,
          dislikes: newDislikes,
          likedBy: newLikedBy,
          dislikedBy: newDislikedBy,
        }
      })
      setPosts(updated)
      // DB-backed — no localStorage save
      const target = updated.find(p => p.id === postId)
      if (target) syncPost(target)
    },
    [posts, syncPost]
  )

  // ── Comments ──────────────────────────────────────────────────────

  const addComment = useCallback(
    (postId: string, content: string, parentId?: string) => {
      const user = getCurrentUser()
      const newComment: CommunityComment = {
        id: 'cmt_' + Date.now(),
        postId,
        author: user,
        content,
        likes: 0,
        likedBy: [],
        createdAt: new Date().toISOString(),
        replies: [],
        parentId,
      }

      const updated = posts.map(p => {
        if (p.id !== postId) return p

        if (parentId) {
          // Add reply to existing comment
          const addReply = (comments: CommunityComment[]): CommunityComment[] =>
            comments.map(c => {
              if (c.id === parentId) return { ...c, replies: [...c.replies, newComment] }
              return { ...c, replies: addReply(c.replies) }
            })
          return { ...p, comments: addReply(p.comments) }
        }
        return { ...p, comments: [...p.comments, newComment] }
      })

      setPosts(updated)
      // DB-backed — no localStorage save
      addNotification('comment', `${user.name} postingizga izoh qoldirdi`, user.name, postId)
      // API'ga yuborish: izoh jadvali + post.comments JSONB
      fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content, parentId, author: user }),
      }).catch(() => {})
      const target = updated.find(p => p.id === postId)
      if (target) syncPost(target)
    },
    [posts, syncPost]
  )

  const deleteComment = useCallback(
    (postId: string, commentId: string) => {
      const updated = posts.map(p => {
        if (p.id !== postId) return p
        const removeRecursive = (comments: CommunityComment[]): CommunityComment[] =>
          comments
            .filter(c => c.id !== commentId)
            .map(c => ({ ...c, replies: removeRecursive(c.replies) }))
        return { ...p, comments: removeRecursive(p.comments) }
      })
      setPosts(updated)
      // DB-backed — no localStorage save
      fetch(`/api/community/comments?id=${commentId}&postId=${postId}`, { method: 'DELETE' }).catch(
        () => {}
      )
      const target = updated.find(p => p.id === postId)
      if (target) syncPost(target)
    },
    [posts, syncPost]
  )

  // ── Views ─────────────────────────────────────────────────────────

  const incrementView = useCallback(
    (postId: string) => {
      const updated = posts.map(p => (p.id === postId ? { ...p, views: p.views + 1 } : p))
      setPosts(updated)
      // DB-backed — no localStorage save
      const target = updated.find(p => p.id === postId)
      if (target) syncPost(target)
    },
    [posts, syncPost]
  )

  // ── Notifications ─────────────────────────────────────────────────

  const addNotification = (
    type: CommunityNotification['type'],
    message: string,
    fromUser: string,
    postId?: string
  ) => {
    const notif: CommunityNotification = {
      id: 'notif_' + Date.now(),
      type,
      message,
      fromUser,
      postId,
      read: false,
      createdAt: new Date().toISOString(),
    }
    // Community notifications are in-memory for the current session.
    // DB-backed notifications use the /api/notifications endpoint.
    setNotifications(prev => [notif, ...prev])
  }

  const markNotificationRead = useCallback((notifId: string) => {
    setNotifications(prev => prev.map(n => (n.id === notifId ? { ...n, read: true } : n)))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  // ── Search & Filter ───────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 5

  const filteredPosts = useMemo(() => {
    let result = [...posts]

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter)
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        p =>
          p.content.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q) ||
          (Array.isArray(p.tags) ? p.tags : []).some(t => t.toLowerCase().includes(q))
      )
    }

    // Sort by pinned first, then by date
    result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return result
  }, [posts, searchQuery, categoryFilter])

  const paginatedPosts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filteredPosts.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredPosts, page])

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / ITEMS_PER_PAGE))

  // Reset page when filter changes
  useEffect(() => {
    setPage(1)
  }, [searchQuery, categoryFilter])

  // ── Refresh (simulate real-time) ──────────────────────────────────
  const [paused, setPaused] = useState(false)

  const refresh = useCallback(() => {
    if (!paused) {
      loadFromApi()
      setCurrentUser(getCurrentUser())
    }
  }, [loadFromApi, paused])

  // Auto-refresh every 30 seconds (paused when user is typing/submitting)
  useEffect(() => {
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [refresh])

  const pauseRefresh = useCallback(() => setPaused(true), [])
  const resumeRefresh = useCallback(() => setPaused(false), [])

  return {
    // State
    posts: paginatedPosts,
    allPosts: filteredPosts,
    totalPosts: filteredPosts.length,
    totalPages,
    page,
    currentUser,
    notifications,
    unreadCount,
    loading,
    error,
    // CRUD
    createPost,
    updatePost,
    deletePost,
    // Interactions
    toggleLike,
    toggleDislike,
    addComment,
    deleteComment,
    incrementView,
    // Notifications
    markNotificationRead,
    clearNotifications,
    // Search & Filter
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    setPage,
    // Utility
    refresh,
    pauseRefresh,
    resumeRefresh,
    timeAgo,
  }
}
