'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PlatformRoleNav from '@/components/layout/PlatformRoleNav'
import { useAuth } from '@/app/providers'
import {
  MessageSquare,
  Send,
  Paperclip,
  Shield,
  Check,
  CheckCheck,
  User,
  AlertCircle,
  FileText,
} from 'lucide-react'

function CitizenMessagesContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const advocateId = searchParams.get('advocateId') || 'sample-advocate-1'

  const [messages, setMessages] = useState<any[]>([])
  const [advocate, setAdvocate] = useState<any>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadMessages = async () => {
    if (!user?.id) return
    try {
      const [mRes, aRes] = await Promise.all([
        fetch(`/api/messages?citizenId=${user.id}&advocateId=${advocateId}`).then(r => r.json()),
        fetch(`/api/advocates/${advocateId}`).then(r => r.json()),
      ])
      if (mRes.success && mRes.data) setMessages(mRes.data)
      if (aRes.success && aRes.data) setAdvocate(aRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
    const timer = setInterval(loadMessages, 5000) // Poll for new replies
    return () => clearInterval(timer)
  }, [user?.id, advocateId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user?.id) return

    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenId: user.id,
          advocateId,
          messageText: newMessage,
        }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setMessages(prev => [...prev, json.data])
        setNewMessage('')
      }
    } catch {
      alert('Xabar yuborishda xatolik yuz berdi')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <PlatformRoleNav currentRole="citizen" />

      <main className="max-w-4xl mx-auto px-4 py-6 w-full flex-1 flex flex-col space-y-4">
        {/* Chat Header Card */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 font-bold text-base">
              {advocate?.full_name?.[0] || 'A'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {advocate?.full_name || 'Advokat Rustam Rahmonov'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Litsenziyalangan
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {advocate?.specialties?.[0] || 'Fuqarolik va mehnat huquqi'} • {advocate?.location_city || 'Toshkent'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
            <Shield className="w-4 h-4" />
            <span className="font-semibold">Himoyalangan kanal</span>
          </div>
        </div>

        {/* Confidentiality Warning */}
        <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2">
          <Shield className="w-4 h-4 flex-shrink-0" />
          <span>
            Ushbu suhbat advokatlik siri bilan himoyalangan. Faqat siz va tayinlangan advokatingiz
            uchun ochiq. Boshqa foydalanuvchilar va talabalar kirishi qat’iyan taqiqlangan.
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 overflow-y-auto space-y-4 min-h-[400px] max-h-[550px]">
          {loading ? (
            <div className="text-center text-xs text-gray-400 py-12">Xabarlar yuklanmoqda...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-16 space-y-2">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="font-medium text-gray-600 dark:text-gray-300">
                Advokat bilan suhbatni boshlang
              </p>
              <p className="text-[11px] text-gray-400">
                Savollaringizni yozing yoki kerakli hujjatlar nusxasini yuboring.
              </p>
            </div>
          ) : (
            messages.map(m => {
              const isMine = m.sender_role === 'citizen'
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isMine
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.message_text}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1 px-1">
                    <span>
                      {new Date(m.created_at).toLocaleTimeString('uz-UZ', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMine && (
                      m.is_read ? (
                        <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-gray-400" />
                      )
                    )}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Form */}
        <form
          onSubmit={handleSend}
          className="bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Advokatga xabar yozing..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Yuborish</span>
          </button>
        </form>
      </main>
    </div>
  )
}

export default function CitizenMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center text-sm text-gray-500">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
          Yuklanmoqda...
        </div>
      }
    >
      <CitizenMessagesContent />
    </Suspense>
  )
}
