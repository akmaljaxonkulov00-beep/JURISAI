'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, X, Trash2, ChevronRight, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

interface AppNotification {
  id: string
  type: string
  category: string
  title: string
  message: string
  read: boolean
  action_url?: string
  action_text?: string
  created_at: string
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) return { Authorization: `Bearer ${session.access_token}` }
  } catch {}
  return {}
}

export default function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadNotifications = useCallback(async () => {
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/notifications', { cache: 'no-cache', headers: authHeaders })
      const result = await res.json()
      if (result.success && Array.isArray(result.data)) {
        setNotifications(result.data)
      }
    } catch {}
  }, [])

  useEffect(() => {
    loadNotifications()

    // Realtime subscription
    const userId = (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      return session?.user?.id || ''
    })()

    let channel: ReturnType<typeof supabase.channel> | null = null

    userId.then(id => {
      if (!id) return
      channel = supabase
        .channel(`notif-${id}-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${id}` },
          () => loadNotifications()
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'payment_requests',
            filter: `user_id=eq.${id}`,
          },
          () => loadNotifications()
        )
        .subscribe()
    })

    const timer = setInterval(loadNotifications, 30000)
    return () => {
      clearInterval(timer)
      if (channel) supabase.removeChannel(channel)
    }
  }, [loadNotifications])

  // Outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSelectedNotif(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setSelectedNotif(null)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    try {
      const authHeaders = await getAuthHeaders()
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ markAll: true }),
      })
    } catch {}
  }

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
    try {
      const authHeaders = await getAuthHeaders()
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ id }),
      })
    } catch {}
  }

  const deleteNotif = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (selectedNotif?.id === id) setSelectedNotif(null)
    try {
      const authHeaders = await getAuthHeaders()
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ id }),
      })
    } catch {}
  }

  const typeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600'
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600'
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
    }
  }

  const dotColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'warning':
        return 'bg-yellow-500'
      default:
        return 'bg-blue-500'
    }
  }

  const formatTime = (ts: string) => {
    if (!ts) return ''
    return new Date(ts).toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Bildirishnomalar"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-[400px] max-h-[80vh] sm:max-h-[500px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 z-[9999] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex-shrink-0">
            <h3 className="font-semibold text-sm text-gray-800 dark:text-white">
              Bildirishnomalar
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="p-1.5 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg flex items-center gap-1"
                  title="Barchasini o'qildi deb belgilash"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => {
                  setOpen(false)
                  setSelectedNotif(null)
                }}
                className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 overscroll-contain">
            {selectedNotif ? (
              /* Detail view */
              <div className="p-4">
                <button
                  onClick={() => setSelectedNotif(null)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mb-3"
                >
                  ← Orqaga
                </button>
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mb-3 ${typeColor(selectedNotif.type)}`}
                >
                  <span className={`w-2 h-2 rounded-full ${dotColor(selectedNotif.type)}`} />
                  {selectedNotif.category || selectedNotif.type}
                </div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 leading-snug">
                  {selectedNotif.title}
                </h4>
                <p className="text-[13px] text-gray-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                  {selectedNotif.message}
                </p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <span className="text-xs text-gray-400">
                    {formatTime(selectedNotif.created_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedNotif.action_url && (
                      <button
                        onClick={() => {
                          markRead(selectedNotif.id)
                          router.push(selectedNotif.action_url!)
                          setOpen(false)
                          setSelectedNotif(null)
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {selectedNotif.action_text || "Ko'rish"}{' '}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotif(selectedNotif.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      title="O'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* List view */
              <>
                {loading && notifications.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-400">Yuklanmoqda...</div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-10">
                    <Bell className="w-10 h-10 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                      Bildirishnomalar yo'q
                    </p>
                  </div>
                ) : (
                  notifications.slice(0, 15).map(n => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-gray-50 dark:border-zinc-800/50 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${!n.read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                      onClick={() => {
                        markRead(n.id)
                        setSelectedNotif(n)
                      }}
                    >
                      <div
                        className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dotColor(n.type)}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-[13px] text-gray-800 dark:text-white leading-snug line-clamp-2">
                            {n.title}
                          </h4>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-zinc-600 flex-shrink-0 mt-0.5" />
                        </div>
                        <p className="text-[12px] text-gray-500 dark:text-zinc-400 leading-relaxed line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {formatTime(n.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && !selectedNotif && (
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-zinc-800 text-center flex-shrink-0">
              <button
                onClick={() => {
                  setOpen(false)
                  router.push('/settings')
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Barcha bildirishnomalar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
