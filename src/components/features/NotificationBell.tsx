'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  CheckCheck,
  X,
  Trash2,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  CreditCard,
  Layers,
  ArrowLeft,
} from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useLanguage } from '@/context/LanguageContext'

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
  const { t } = useLanguage()

  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-cache' })
      if (res.ok) {
        const result = await res.json()
        if (result.success && Array.isArray(result.data)) {
          // Deduplicate by ID
          const seen = new Set<string>()
          const unique: AppNotification[] = []
          for (const item of result.data) {
            if (!seen.has(item.id)) {
              seen.add(item.id)
              unique.push(item)
            }
          }
          setNotifications(unique)
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    loadNotifications()

    // Realtime listener
    let channel: ReturnType<typeof supabase.channel> | null = null

    supabase.auth.getSession().then(({ data: { session } }) => {
      const id = session?.user?.id
      if (!id) return

      channel = supabase
        .channel(`notif_stream_${id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${id}` },
          () => loadNotifications()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'payment_requests', filter: `user_id=eq.${id}` },
          () => loadNotifications()
        )
        .subscribe()
    })

    const interval = setInterval(loadNotifications, 30000)
    return () => {
      clearInterval(interval)
      if (channel) supabase.removeChannel(channel)
    }
  }, [loadNotifications])

  // Click outside to close
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

  // ESC key to close
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
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
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
    if (selectedNotif?.id === id) setSelectedNotif(null)
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch {}
  }

  const typeBg = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500'
      case 'error':
        return 'bg-rose-500'
      case 'warning':
        return 'bg-amber-500'
      default:
        return 'bg-blue-500'
    }
  }

  const formatTimestamp = (ts?: string) => {
    if (!ts) return ''
    try {
      const d = new Date(ts)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMin = Math.floor(diffMs / 60000)
      const diffHour = Math.floor(diffMin / 60)
      const diffDay = Math.floor(diffHour / 24)

      if (diffMin < 2) return t('todayTime', 'Hozirgina')
      if (diffMin < 60) return `${diffMin} min oldin`
      if (diffHour < 24) return `${diffHour} soat oldin`
      if (diffDay === 1) return t('yesterdayTime', 'Kecha')
      return d.toLocaleDateString()
    } catch {
      return ''
    }
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={t('settingsTabNotifications', 'Bildirishnomalar')}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Responsive Dropdown Viewport */}
      {open && (
        <div
          className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-[380px] max-h-[calc(100vh-5.5rem)] sm:max-h-[480px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-zinc-800 z-50 overflow-hidden flex flex-col animate-fade-in"
          style={{ transformOrigin: 'top right' }}
        >
          {/* Top Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex-shrink-0 bg-gray-50/70 dark:bg-zinc-900/90">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                {t('settingsTabNotifications', 'Bildirishnomalar')}
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="p-1.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg flex items-center gap-1 transition-colors"
                  title="Barchasini o'qildi deb belgilash"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px] font-medium">Barchasi o‘qildi</span>
                </button>
              )}
              <button
                onClick={() => {
                  setOpen(false)
                  setSelectedNotif(null)
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="overflow-y-auto flex-1 overscroll-contain divide-y divide-gray-100 dark:divide-zinc-800/80">
            {selectedNotif ? (
              /* Detail View */
              <div className="p-4 space-y-3">
                <button
                  onClick={() => setSelectedNotif(null)}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t('settingsBack', 'Orqaga')}</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${typeBg(selectedNotif.type)}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                    {selectedNotif.category}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-snug break-words">
                  {selectedNotif.title}
                </h4>

                <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
                  {selectedNotif.message}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <span className="text-[11px] text-gray-400 dark:text-zinc-500">
                    {formatTimestamp(selectedNotif.created_at)}
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-xs"
                      >
                        <span>{selectedNotif.action_text || t('details', 'Ko‘rish')}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      onClick={() => deleteNotif(selectedNotif.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title={t('delete', 'O‘chirish')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* List View */
              <>
                {notifications.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Bell className="w-10 h-10 text-gray-300 dark:text-zinc-700 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
                      {t('noData', 'Hozircha bildirishnomalar mavjud emas')}
                    </p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markRead(n.id)
                        setSelectedNotif(n)
                      }}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors ${
                        !n.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div
                        className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${typeBg(n.type)}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-semibold text-xs text-gray-900 dark:text-white leading-snug break-words line-clamp-2">
                            {n.title}
                          </h4>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 line-clamp-2 mt-0.5 break-words">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 block">
                          {formatTimestamp(n.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>

          {/* Footer Link */}
          {notifications.length > 0 && !selectedNotif && (
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-zinc-800 text-center flex-shrink-0 bg-gray-50/40 dark:bg-zinc-900/40">
              <button
                onClick={() => {
                  setOpen(false)
                  router.push('/settings?tab=notifications')
                }}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
              >
                {t('notificationsTitle', 'Barcha bildirishnomalar')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
