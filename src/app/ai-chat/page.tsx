'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import PageHeader from '@/components/layout/PageHeader'
import AppSidebar from '@/components/layout/AppSidebar'
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Scale,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  FileText,
  Clock,
  HelpCircle,
} from 'lucide-react'
import { getUserIdentityPayload } from '@/lib/client-user'

interface ChatSource {
  title: string
  article?: string
  url?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: ChatSource[]
  isStreaming?: boolean
}

const SAMPLE_QUESTIONS = [
  {
    category: 'Mehnat huquqi',
    text: 'Yangi Mehnat kodeksiga ko‘ra sinov muddati qancha muddatga va qanday shartlar bilan belgilanadi?',
  },
  {
    category: 'Oila huquqi',
    text: 'Aliment undirish tartibi qanday va 2 ta farzand uchun oylik daromadning necha foizi ushlab qolinadi?',
  },
  {
    category: 'Jinoyat huquqi',
    text: 'Firibgarlik (JK 168-modda) va o‘g‘rilik (JK 169-modda) jinoyatlarining asosiy huquqiy farqlari nimalardan iborat?',
  },
  {
    category: 'Fuqarolik huquqi',
    text: 'Ko‘chmas mulk oldi-sotdi shartnomasini notarial tasdiqlash va mulk huquqini davlat ro‘yxatidan o‘tkazish tartibi qanday?',
  },
  {
    category: 'Meros huquqi',
    text: 'Vasiyatnoma mavjud bo‘lmaganda meros qanday navbatda taqsimlanadi va majburiy ulush kimlarga tegishli?',
  },
  {
    category: 'Ma’muriy huquq',
    text: 'Yo‘l harakati qoidalarini buzganlik uchun jarimani 15 kun ichida 50% chegirma bilan to‘lash qoidalari qanday ishlaydi?',
  },
]

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Load chat history from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jurisai_legal_chat_history')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
        }
      }
    } catch {}
  }, [])

  // Save history to localStorage
  const saveChatHistory = (newMessages: Message[]) => {
    try {
      localStorage.setItem('jurisai_legal_chat_history', JSON.stringify(newMessages.slice(-20)))
    } catch {}
  }

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim()
    if (!textToSend || loading) return

    setErrorText(null)
    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
    }

    const updated = [...messages, userMsg]
    setMessages(updated)
    setInputMessage('')
    setLoading(true)

    // Build context
    const context = messages.slice(-4).map(m => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const res = await fetch('/api/ai/legal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          context,
          ...getUserIdentityPayload(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Serverdan javob olishda xatolik yuz berdi')
      }

      const assistantMsg: Message = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: data.answer || data.content || "Kechirasiz, ma'lumot topilmadi.",
        timestamp: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources || [],
      }

      const finalMessages = [...updated, assistantMsg]
      setMessages(finalMessages)
      saveChatHistory(finalMessages)
    } catch (err: any) {
      console.error('Chat error:', err)
      setErrorText(err.message || 'Xatolik yuz berdi. Qaytadan urinib ko‘ring.')
    } finally {
      setLoading(false)
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleClear = () => {
    if (confirm('Barcha yozishmalarni tozalashni xohlaysizmi?')) {
      setMessages([])
      localStorage.removeItem('jurisai_legal_chat_history')
      setErrorText(null)
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-hidden">
      <AppSidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-50">AI Yuridik Konsultant</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-full">
                  Gemini 3 Pro + RAG
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                O‘zbekiston Respublikasining 11 ta kodeksi va 5000+ moddalari asosida
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition"
                title="Suhbatni tozalash"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tozalash</span>
              </button>
            )}
            <Link
              href="/citizen/ask"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm"
            >
              <span>Advokatga savol berish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="max-w-3xl mx-auto py-8">
              {/* Welcome Card */}
              <div className="text-center space-y-3 mb-8">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  <Scale className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                  Assalomu alaykum! Sizga qanday yuridik yordam kerak?
                </h2>
                <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-xl mx-auto">
                  Savolingizni kiriting va O‘zbekiston Respublikasi amaldagi qonunchiligi asosida rasmiy moddalar, huquqiy izoh va amaliy tavsiyalarni oling.
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Ko‘p beriladigan huquqiy savollar</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SAMPLE_QUESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(item.text)}
                      className="p-3.5 text-left bg-white dark:bg-zinc-900 hover:bg-blue-50/70 dark:hover:bg-zinc-800/80 border border-slate-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl transition group shadow-sm flex flex-col justify-between"
                    >
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                        {item.category}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-zinc-100 line-clamp-2">
                        {item.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notice */}
              <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start space-x-3 text-xs text-amber-800 dark:text-amber-300">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Muhim eslatma:</span> AI taqdim etgan javoblar amaldagi qonun normalariga asoslangan axborot xarakteriga ega. Huquqiy ahamiyatga ega rasmiy arizalar yoki sud da’volari uchun platformadagi tasdiqlangan advokatlar bilan maslahatlashish tavsiya etiladi.
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6 pb-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 sm:p-5 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-tl-none text-slate-800 dark:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100 dark:border-zinc-800/80 text-xs opacity-75">
                      <span className="font-medium">
                        {msg.role === 'user' ? 'Sizning savolingiz' : 'JURISAI Huquqiy Tahlil'}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Content */}
                    <div className="whitespace-pre-wrap text-sm leading-relaxed space-y-2">
                      {msg.content}
                    </div>

                    {/* Sources (if any) */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
                        <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-2 flex items-center space-x-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Asos qilib olingan qonun hujjatlari:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((src, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center space-x-1 text-xs px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-md border border-slate-200 dark:border-zinc-700"
                            >
                              <span>{src.title}</span>
                              {src.article && <span className="font-medium text-blue-600">({src.article})</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions for assistant message */}
                    {msg.role === 'assistant' && (
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-green-600 font-medium">Nusxa olindi</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Nusxa olish</span>
                            </>
                          )}
                        </button>

                        <Link
                          href={`/citizen/ask?initial=${encodeURIComponent(
                            messages[messages.indexOf(msg) - 1]?.content || ''
                          )}`}
                          className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <span>Advokatga tekshirtirish</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-start space-x-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                    <span className="text-xs text-slate-500 dark:text-zinc-400 ml-2">
                      O‘zbekiston qonunchilik bazasidan moddalar qidirilmoqda...
                    </span>
                  </div>
                </div>
              )}

              {errorText && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
                  <span>{errorText}</span>
                  <button
                    onClick={() => handleSend()}
                    className="font-medium underline hover:text-red-800"
                  >
                    Qaytadan urinish
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 p-4 shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end bg-slate-50 dark:bg-zinc-800/80 border border-slate-300 dark:border-zinc-700 rounded-2xl p-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Yuridik savolingizni yoki huquqiy vaziyatingizni yozing... (Enter bosib yuboring)"
                rows={2}
                disabled={loading}
                className="w-full bg-transparent resize-none border-none focus:outline-none text-sm text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 px-2 py-1 max-h-32"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputMessage.trim() || loading}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-zinc-700 text-white rounded-xl transition shrink-0 ml-2 shadow-sm"
                title="Xabarni yuborish"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-500 mt-2 px-1">
              <span>Shift + Enter yangi qatorga o‘tadi</span>
              <span>11 ta Kodeks &bull; 5 000+ modda &bull; Lex.uz integratsiyasi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
