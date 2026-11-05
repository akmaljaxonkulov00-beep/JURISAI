'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import { useAuth } from '@/app/providers'
import { getAuthHeaders } from '@/lib/api-auth-client'
import {
  MessageSquare,
  Send,
  Paperclip,
  Shield,
  Check,
  CheckCheck,
  User,
  Users,
  Search,
  Lock,
  Circle,
} from 'lucide-react'

function AdvocateMessagesContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const citizenIdParam = searchParams.get('citizenId')

  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [selectedPartner, setSelectedPartner] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Advokatning barcha mijoz suhbatlarini yuklash
  const loadConversations = async () => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/messages', { headers, credentials: 'include' })
      const data = await res.json()
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations)

        if (citizenIdParam && !selectedConvId) {
          const matched = data.conversations.find((c: any) => c.partnerId === citizenIdParam)
          if (matched) {
            setSelectedConvId(matched.id)
            setSelectedPartner({
              name: matched.partnerName,
              avatar: matched.partnerAvatar,
            })
          }
        } else if (!selectedConvId && data.conversations.length > 0) {
          setSelectedConvId(data.conversations[0].id)
          setSelectedPartner({
            name: data.conversations[0].partnerName,
            avatar: data.conversations[0].partnerAvatar,
          })
        }
      }
    } catch (e) {
      console.warn('Load conversations error:', e)
    } finally {
      setLoading(false)
    }
  }

  // 2. Tanlangan suhbat xabarlarini yuklash
  const loadActiveMessages = async () => {
    if (!selectedConvId) return
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`/api/messages?conversationId=${selectedConvId}`, {
        headers,
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data)
        if (data.partner) setSelectedPartner(data.partner)
      }
    } catch (e) {
      console.warn('Load messages error:', e)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [user?.id, citizenIdParam])

  useEffect(() => {
    loadActiveMessages()
    const interval = setInterval(loadActiveMessages, 3500)
    return () => clearInterval(interval)
  }, [selectedConvId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Xabar yuborish
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    const textToSend = newMessage.trim()
    setNewMessage('')
    setSending(true)

    const optimisticMsg = {
      id: `temp_${Date.now()}`,
      senderRole: 'advocate',
      messageText: textToSend,
      createdAt: new Date().toISOString(),
      isRead: false,
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: selectedConvId,
          partnerId: selectedPartner?.id,
          messageText: textToSend,
        }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setMessages(prev => prev.map(m => (m.id === optimisticMsg.id ? data.data : m)))
        loadConversations()
      }
    } catch {
      alert("Xabarni yuborishda xatolik yuz berdi")
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter(c =>
    c.partnerName.toLowerCase().includes(searchFilter.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <PlatformRoleNav currentRole="advocate" />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Telegram-style Container */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-xl overflow-hidden flex flex-col md:flex-row h-[78vh]">
          {/* Chap ustun: Mijozlar suhbatlari */}
          <div className="w-full md:w-80 lg:w-96 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Mijozlar bilan Chat
                </h2>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Maxfiy
                </span>
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Mijozlarni qidirish..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <div className="p-6 text-center text-xs text-gray-400">Yuklanmoqda...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 space-y-1">
                  <p>Hozircha mijozlar bilan suhbat yo‘q.</p>
                  <p className="text-[11px]">Mijozlar konsultatsiya so‘raganda bu yerda ko‘rinadi.</p>
                </div>
              ) : (
                filteredConversations.map(c => {
                  const isSelected = selectedConvId === c.id
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedConvId(c.id)
                        setSelectedPartner({
                          name: c.partnerName,
                          avatar: c.partnerAvatar,
                        })
                      }}
                      className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-600'
                          : 'hover:bg-gray-100/60 dark:hover:bg-gray-800/40'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300 flex-shrink-0">
                        {c.partnerName?.charAt(0) || 'M'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {c.partnerName}
                          </h3>
                          <span className="text-[10px] text-gray-400">
                            {new Date(c.lastMessageAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {c.lastMessageText || 'Yangi suhbat'}
                        </p>
                      </div>

                      {c.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* O'ng ustun: Xabarlar oqimi */}
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
            {selectedConvId ? (
              <>
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">
                      {selectedPartner?.name?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {selectedPartner?.name || 'Mijoz'}
                      </h3>
                      <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                        <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
                        Online • Advokat-Mijoz maxfiy kanali
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    Kasbiy sir bilan himoyalangan
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#f8f9fc] dark:bg-[#0B101B]">
                  {messages.map((m, idx) => {
                    const isMe = m.senderRole === 'advocate'
                    return (
                      <div
                        key={m.id || idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none border border-gray-100 dark:border-gray-700'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.messageText}</p>
                          <div
                            className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 ${
                              isMe ? 'text-blue-100' : 'text-gray-400'
                            }`}
                          >
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              m.isRead ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-blue-200" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={handleSend}
                  className="p-3.5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2"
                >
                  <button
                    type="button"
                    title="Fayl yoki hujjat biriktirish"
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Advokatlik javobini yozing..."
                    className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-800 border-0 rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-full transition-colors flex items-center justify-center shadow-md cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Mijoz suhbati tanlanmagan
                </h3>
                <p className="text-xs text-gray-500 max-w-sm">
                  Yozishmani ochish uchun chap tarafdagi mijozlardan birini tanlang.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AdvocateMessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Yuklanmoqda...</div>}>
      <AdvocateMessagesContent />
    </Suspense>
  )
}
