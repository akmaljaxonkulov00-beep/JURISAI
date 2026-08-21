'use client'

// ═══════════════════════════════════════════════════════════════════════════
// NotificationBell — Bildirishnoma qo'ng'irog'i (dashboardda)
// To'lov holati (tasdiqlangan/rad etilgan) va boshqa tizim xabarlari
// real vaqtda ko'rinadi. 30 soniyada bir yangilanadi.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, CheckCheck, X, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { getUserIdentityPayload } from '@/lib/client-user'

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

export default function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const getUserId = useCallback((): string => {
    // Supabase session asosiy manba — eski akkaunt ma'lumoti bilan aralashmaydi
    return getUserIdentityPayload().userId || ''
  }, [])

  const loadNotifications = useCallback(async () => {
    const userId = getUserId()
    if (!userId) return
    try {
      // Identity session'dan olinadi — userId param uzatilmaydi (IDOR himoyasi)
      const res = await fetch('/api/notifications', {
        cache: 'no-cache',
      })
      const result = await res.json()
      if (result.success && Array.isArray(result.data)) {
        setNotifications(result.data)
      }
    } catch {}
  }, [getUserId])

  useEffect(() => {
    loadNotifications()

    // ── Supabase Realtime — darhol yangilanish ──
    // 1) user_notifications jadvali (INSERT/UPDATE/DELETE)
    // 2) payment_requests (status o'zgarishi) — tasdiqlash/rad etish oniy aks etadi
    const userId = getUserId()
    const channels: ReturnType<typeof supabase.channel>[] = []

    const subscribe = () => {
      if (!userId) return
      const ts = Date.now()
      const ch1 = supabase
        .channel(`notif-user-${userId}-${ts}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${userId}`,
          },
          () => loadNotifications()
        )
        .subscribe()
      channels.push(ch1)

      const ch2 = supabase
        .channel(`notif-pay-${userId}-${ts}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'payment_requests',
            filter: `user_id=eq.${userId}`,
          },
          () => loadNotifications()
        )
        .subscribe()
      channels.push(ch2)
    }

    subscribe()

    // ── Fallback poll (30s) — Realtime uzilgan yoki jadval hali mavjud bo'lmasa ──
    const timer = setInterval(loadNotifications, 30000)

    return () => {
      clearInterval(timer)
      if (channels.length) {
        for (const ch of channels) supabase.removeChannel(ch)
      }
    }
  }, [loadNotifications, getUserId])

  // Tashqariga bosilganda yopish
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = async () => {
    const userId = getUserId()
    if (!userId) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true, userId }),
      })
    } catch {}
  }

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch {}
  }

  const deleteNotif = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch {}
  }

  const typeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        title="Bildirishnomalar"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-[400px] max-h-[480px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 z-50 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
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
                onClick={() => setOpen(false)}
                className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400">Yuklanmoqda...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell className="w-10 h-10 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-zinc-400">Bildirishnomalar yo'q</p>
              </div>
            ) : (
              notifications.slice(0, 15).map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-50 dark:border-zinc-800/50 flex gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors ${
                    !n.read ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
                  }`}
                  onClick={() => {
                    markRead(n.id)
                    if (n.action_url) router.push(n.action_url)
                    setOpen(false)
                  }}
                >
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${dotColor(n.type)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className="font-medium text-[13px] text-gray-800 dark:text-white">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 whitespace-nowrap">
                        {n.created_at
                          ? new Date(n.created_at).toLocaleDateString('uz-UZ', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-600 dark:text-zinc-400 leading-relaxed">
                      {n.message}
                    </p>
                    {n.action_url && n.action_text && (
                      <button
                        className={`inline-block mt-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg ${typeColor(n.type)} hover:opacity-80 transition-opacity`}
                        onClick={e => {
                          e.stopPropagation()
                          markRead(n.id)
                          router.push(n.action_url!)
                          setOpen(false)
                        }}
                      >
                        {n.action_text}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      deleteNotif(n.id)
                    }}
                    className="self-start p-1 text-gray-300 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="O'chirish"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 dark:border-zinc-800 text-center">
              <button
                onClick={() => {
                  setOpen(false)
                  router.push('/settings')
                }}
                className="text-xs text-blue-600 hover:underline"
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
