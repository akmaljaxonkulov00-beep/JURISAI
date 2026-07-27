'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, History, Trash2, Sparkles, Plus, Mic, MicOff, Volume2, Maximize2, Minimize2 } from 'lucide-react';
import { useSpeechToText } from '@/hooks/useSpeechToText';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'ai_chat_sessions';

function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {}
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return 'Kecha ' + d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
}

function groupSessions(sessions: ChatSession[]) {
  const now = new Date();
  const today = now.setHours(0, 0, 0, 0);
  const yesterday = today - 86400000;
  const thisWeek = today - 604800000;

  const groups: { label: string; sessions: ChatSession[] }[] = [
    { label: 'Bugun', sessions: [] },
    { label: 'Kecha', sessions: [] },
    { label: 'Bu hafta', sessions: [] },
    { label: 'Eski', sessions: [] },
  ];

  sessions.forEach(s => {
    const date = s.updatedAt;
    if (date >= today) groups[0].sessions.push(s);
    else if (date >= yesterday) groups[1].sessions.push(s);
    else if (date >= thisWeek) groups[2].sessions.push(s);
    else groups[3].sessions.push(s);
  });

  return groups.filter(g => g.sessions.length > 0);
}

// Simple markdown-like renderer for AI responses
function renderMarkdown(text: string): React.ReactNode {
  // Split by double newlines for paragraphs
  const blocks = text.split('\n\n').filter(Boolean);
  
  return blocks.map((block, bi) => {
    const trimmed = block.trim();
    
    // Heading: ## Title
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={bi} className="font-bold text-sm text-blue-700 dark:text-blue-400 mt-3 mb-1">
          {trimmed.replace('## ', '')}
        </h3>
      );
    }
    
    // Bullet list: • item
    if (trimmed.startsWith('• ')) {
      const lines = trimmed.split('\n').filter(l => l.trim());
      return (
        <ul key={bi} className="list-disc list-inside space-y-0.5 my-1">
          {lines.map((line, li) => (
            <li key={li} className="text-xs text-gray-700 dark:text-zinc-300">
              {renderInline(line.replace(/^•\s*/, ''))}
            </li>
          ))}
        </ul>
      );
    }
    
    // Bold list: **text** — description
    if (trimmed.startsWith('**')) {
      return (
        <p key={bi} className="text-xs text-gray-700 dark:text-zinc-300 my-1">
          {renderInline(trimmed)}
        </p>
      );
    }
    
    // Regular paragraph
    return (
      <p key={bi} className="text-xs text-gray-700 dark:text-zinc-300 my-1">
        {renderInline(trimmed)}
      </p>
    );
  });
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900 dark:text-zinc-100">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function AIChatFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  // Load sessions on mount
  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  // Save sessions on change
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create new session
  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Yangi suhbat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setShowHistory(false);
  }, []);

  // Speech-to-Text hook
  const stt = useSpeechToText({
    lang: 'uz-UZ',
    onResult: (text) => {
      setInput(prev => (prev ? prev + ' ' : '') + text);
    },
  });

  // Auto-create first session
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
    if (sessions.length === 0) {
      createNewSession();
    }
  }, [sessions, activeSessionId, createNewSession]);

  // Delete session
  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Clear all history
  const clearAllHistory = () => {
    if (!confirm('Barcha tarixni o\'chirishni tasdiqlaysizmi?')) return;
    setSessions([]);
    setActiveSessionId(null);
    setShowHistory(false);
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || loading || !activeSessionId) return;
    setError('');

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    // Update session with user message
    setSessions(prev => prev.map(s => {
      if (s.id !== activeSessionId) return s;
      const title = s.messages.length === 0 ? input.trim().slice(0, 40) + '...' : s.title;
      return {
        ...s,
        title,
        messages: [...s.messages, userMsg],
        updatedAt: Date.now(),
      };
    }));

    const userText = input.trim();
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/legal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });

      const data = await res.json();
      const assistantText = data.answer || data.response || 'Kechirasiz, javob olishda xatolik yuz berdi.';

      const assistantMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: assistantText,
        timestamp: Date.now(),
      };

      setSessions(prev => prev.map(s => {
        if (s.id !== activeSessionId) return s;
        return { ...s, messages: [...s.messages, assistantMsg], updatedAt: Date.now() };
      }));
    } catch {
      setError('Javob olishda xatolik. Qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  // ── Voice Input (STT) — delegated to hook ──

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        aria-label="AI Yordamchi"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className={`fixed z-50 overflow-hidden flex flex-col backdrop-blur-xl bg-white/95 dark:bg-zinc-900/95 animate-in slide-in-from-bottom-4 duration-300 ${
          fullScreen
            ? 'inset-4 w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] rounded-2xl shadow-2xl'
            : 'bottom-24 right-6 w-[380px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-8rem)] rounded-2xl shadow-2xl border border-white/20 dark:border-zinc-700/50'
        }`}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-700 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-sm text-gray-800 dark:text-white">AI Yordamchi</span>
              {/* Full-screen indicator */}
              {fullScreen && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                  To'liq ekran
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFullScreen(!fullScreen)}
                className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all"
                title={fullScreen ? 'Kichik oyna' : "To'liq ekran"}
              >
                {fullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-1.5 rounded-lg transition-all ${showHistory ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                title="Tarix"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setFullScreen(false); setIsOpen(false); }}
                className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all"
                title="Yopish"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={createNewSession}
                className="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all"
                title="Yangi suhbat"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* History Drawer */}
          {showHistory && (
            <div className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 max-h-[240px] overflow-y-auto shrink-0">
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">Suhbatlar tarixi</span>
                  <button
                    onClick={clearAllHistory}
                    className="text-[10px] text-red-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Tozalash
                  </button>
                </div>
                {sessions.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-4">Hali suhbatlar yo'q</p>
                ) : (
                  groupSessions(sessions).map(group => (
                    <div key={group.label}>
                      <p className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 px-1 mb-1">{group.label}</p>
                      {group.sessions.map(s => (
                        <button
                          key={s.id}
                          onClick={() => { setActiveSessionId(s.id); setShowHistory(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between group ${
                            s.id === activeSessionId
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300'
                          }`}
                        >
                          <span className="truncate flex-1">{s.title}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500">{formatTime(s.updatedAt)}</span>
                            <button onClick={(e) => deleteSession(s.id, e)} className="p-0.5 text-red-400 hover:text-red-600">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="w-10 h-10 text-blue-300 dark:text-blue-600 mb-3" />
                <p className="text-sm font-medium text-gray-600 dark:text-zinc-300">Huquqiy AI Yordamchi</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 max-w-[200px]">
                  O'zbekiston qonunchiligi bo'yicha savollaringizga javob oling
                </p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {["Shartnoma tuzish", "Ish haqi", "Ajralish", "Meros", "Jinoyat kodeksi"].map(q => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="px-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:border-blue-300 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 rounded-bl-md'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                    <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400 dark:text-zinc-500'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-zinc-800 px-3.5 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-blue-50 dark:bg-blue-900/20 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-50 dark:bg-blue-900/20 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-50 dark:bg-blue-900/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-zinc-700 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={stt.isListening ? 'Gapiryapsiz...' : 'Savolingizni yozing...'}
                rows={1}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none max-h-24"
                disabled={loading}
              />
              {stt.isSupported && (
                <div className="relative">
                  <button
                    onClick={stt.toggleListening}
                    disabled={loading}
                    className={`p-2.5 rounded-xl transition-all active:scale-95 relative ${
                      stt.isListening
                        ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30'
                        : 'bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600'
                    }`}
                    title={stt.isListening ? "Yozishni to'xtatish" : 'Ovozli kiritish (STT)'}
                  >
                    <div className="relative z-10">
                      {stt.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </div>
                    {/* Pulse ring */}
                    {stt.isListening && (
                      <span className="absolute inset-0 rounded-xl animate-ping bg-red-400/40" />
                    )}
                  </button>
                  {/* Audio wave visualization */}
                  {stt.isListening && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-end gap-[2px] h-6">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className="w-[3px] bg-gradient-to-t from-red-400 to-rose-300 rounded-full transition-all duration-150"
                          style={{
                            height: `${Math.max(4, (stt.audioLevel / 100) * (16 + i * 6))}px`,
                            opacity: 0.7 + (stt.audioLevel / 100) * 0.3,
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {/* Interim transcription tooltip */}
                  {stt.isListening && stt.interimText && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-10 min-w-[200px] max-w-[280px] px-3 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-800 text-white text-xs text-center shadow-xl border border-zinc-700">
                      <p className="italic">{stt.interimText}</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 dark:bg-zinc-800 rotate-45 -mt-1 border-r border-b border-zinc-700" />
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white disabled:opacity-40 hover:shadow-md transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
