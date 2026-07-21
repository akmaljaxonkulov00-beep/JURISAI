'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, MessageCircle, FileText, Mic, Send, BookOpen, Scale, 
  HelpCircle, Volume2, Lightbulb, Copy, History, Trash2, X, Clock 
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  type: 'user' | 'assistant';
  timestamp: Date;
  suggestions?: string[];
}

interface SavedChat {
  id: string;
  title: string;
  date: string;
  messages: { id: string; text: string; type: string; timestamp: string; suggestions?: string[] }[];
}

// ── AI response formatter ──
function AIResponse({ text }: { text: string }) {
  const sections = [
    { key: 'QISQA JAVOB',     bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' },
    { key: "ASOSIY MA'LUMOT", bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D' },
    { key: 'QONUN',            bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB' },
    { key: 'MASLAHAT',         bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C' },
  ];

  const found = sections.filter(s => text.includes(s.key));
  
  if (found.length === 0) {
    return <div style={{ color: '#374151', fontSize: 14, lineHeight: 1.7 }}>{text}</div>;
  }

  const positions = found.map(s => ({ sec: s, start: text.indexOf(s.key), end: -1 }))
    .sort((a, b) => a.start - b.start);
  positions.forEach((p, i) => { p.end = positions[i + 1]?.start ?? text.length; });

  return (
    <>
      {positions.map(({ sec, start, end }) => {
        const content = text.slice(start, end).replace(sec.key + ':', '').replace(sec.key, '').trim();
        return (
          <div key={sec.key} style={{ background: sec.bg, border: `1px solid ${sec.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: sec.color, marginBottom: 6 }}>{sec.key}</div>
            <div style={{ color: '#374151', fontSize: 13, lineHeight: 1.6 }}>{content}</div>
          </div>
        );
      })}
    </>
  );
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechReady, setSpeechReady] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'document'>('chat');
  const [historyOpen, setHistoryOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load saved chats on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ai_chats');
      if (raw) setSavedChats(JSON.parse(raw));
    } catch {}
    const tts = 'speechSynthesis' in window;
    const stt = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setSpeechReady(tts || stt || true);
  }, []);

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (messages.length === 0 || !currentChatId) return;
    const title = messages.find(m => m.type === 'user')?.text?.slice(0, 40) || 'Suhbat';
    const chat: SavedChat = {
      id: currentChatId,
      title,
      date: new Date().toISOString(),
      messages: messages.slice(-50).map(m => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp)
      }))
    };
    setSavedChats(prev => {
      const filtered = prev.filter(c => c.id !== chat.id);
      const updated = [chat, ...filtered].slice(0, 20);
      try { localStorage.setItem('ai_chats', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [messages, currentChatId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // ── Send message ──
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const chatId = currentChatId || 'chat-' + Date.now();
    if (!currentChatId) setCurrentChatId(chatId);

    setMessages(p => [...p, { id: 'u-' + Date.now(), text: msg, type: 'user', timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/legal-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      const reply = data.response || data.text || 'Javob olinmadi';
      setMessages(p => [...p, { id: 'a-' + Date.now(), text: reply, type: 'assistant', timestamp: new Date(), suggestions: data.suggestions || [] }]);
      if (autoSpeak && speechReady) speakText(reply);
    } catch {
      setMessages(p => [...p, { id: 'a-' + Date.now(), text: 'Xatolik yuz berdi', type: 'assistant', timestamp: new Date() }]);
    } finally { setLoading(false); }
  }, [input, loading, autoSpeak, speechReady, currentChatId]);

  // ── TTS ──
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const clean = text.replace(/[•]\s*/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
    if (!clean) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'ru-RU'; u.rate = 0.88;
    u.onstart = () => setIsSpeaking(true);
    u.onend = u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  };
  const stopSpeak = () => { window.speechSynthesis?.cancel(); setIsSpeaking(false); };

  // ── STT ──
  const startMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Ovozli kiritish faqat Chrome yoki Edge da ishlaydi.'); return; }
    const r = new SR(); recognitionRef.current = r;
    r.lang = 'ru-RU'; r.continuous = false; r.interimResults = true;
    setIsListening(true);
    let buf = '';
    r.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) { buf = t; setInput(t); } else setInput(buf + t);
      }
    };
    r.onend = () => setIsListening(false);
    r.start();
  };
  const stopMic = () => { recognitionRef.current?.stop(); setIsListening(false); };

  // ── History management ──
  const loadChat = (chat: SavedChat) => {
    setMessages(chat.messages.map(m => ({ ...m, type: m.type as 'user' | 'assistant', timestamp: new Date(m.timestamp) })));
    setCurrentChatId(chat.id);
    setHistoryOpen(false);
  };
  const newChat = () => { setMessages([]); setCurrentChatId(null); setHistoryOpen(false); };
  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedChats(prev => { const u = prev.filter(c => c.id !== id); try { localStorage.setItem('ai_chats', JSON.stringify(u)); } catch {} return u; });
    if (currentChatId === id) { setMessages([]); setCurrentChatId(null); }
  };
  const clearAll = () => {
    if (confirm('Barcha suhbatlarni o\'chirish?')) { setSavedChats([]); setMessages([]); setCurrentChatId(null); try { localStorage.removeItem('ai_chats'); } catch {} }
  };

  const formatDate = (d: string) => {
    const date = new Date(d); const now = new Date(); const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return 'Bugun'; if (diff < 172800000) return 'Kecha';
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
  };

  const templates = [
    { name: 'Shartnoma', prompt: 'Tijorat shartnomasi namunasini yoz.' },
    { name: "Da'vo arizasi", prompt: "Sudga da'vo arizasi namunasini yoz." },
    { name: 'Ogohlantirish xati', prompt: 'Rasmiy ogohlantirish xati yoz.' },
    { name: 'Vakolatnoma', prompt: 'Vakolatnoma hujjati yoz.' },
  ];

  return (
    <div style={{ height: '100vh', background: '#F8FAFF', display: 'flex' }}>
      {/* ── Left Sidebar ── */}
      <aside className="desktop-sidebar" style={{ width: 220, background: '#fff', borderRight: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 14px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', textDecoration: 'none', fontSize: 13 }}>
            <ArrowLeft size={16} /> Orqaga
          </a>
          <button onClick={newChat} style={{ padding: '5px 10px', background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            + Yangi
          </button>
        </div>
        <div style={{ padding: '12px 14px' }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6 }}>Tezkor</p>
          {[
            { icon: <BookOpen size={14} />, label: 'Qonunni top', prompt: 'Qaysi qonun yoki modda haqida?' },
            { icon: <Scale size={14} />, label: 'Keys tahlili', prompt: 'Huquqiy vaziyatingizni yozing.' },
            { icon: <FileText size={14} />, label: 'Hujjat yaratish', cb: () => setActiveMode('document') },
          ].map((a, i) => (
            <button key={i} onClick={() => { if (a.cb) a.cb(); else { setInput(a.prompt!); inputRef.current?.focus(); } }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', border: 'none', cursor: 'pointer', fontSize: 12, marginBottom: 4 }}>
              {a.icon} {a.label}
            </button>
          ))}
          {activeMode === 'document' && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6 }}>Namunalar</p>
              {templates.map(t => (
                <button key={t.name} onClick={() => { sendMessage(t.prompt); setActiveMode('chat'); }}
                  style={{ width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', cursor: 'pointer', marginBottom: 4, fontSize: 12, color: '#374151' }}>
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {speechReady && (
          <div style={{ marginTop: 'auto', padding: '12px 14px', borderTop: '1px solid #F1F5F9' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={autoSpeak} onChange={e => setAutoSpeak(e.target.checked)} />
              <Volume2 size={14} /> Ovozli javob
            </label>
          </div>
        )}
      </aside>

      {/* ── Main chat area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={16} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>AI Huquqiy Yordamchi</h1>
              <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>Groq · llama-3.1-8b-instant</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setHistoryOpen(!historyOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500, background: historyOpen ? '#EFF6FF' : '#F3F4F6', color: historyOpen ? '#2563EB' : '#4B5563', border: historyOpen ? '1px solid #BFDBFE' : '1px solid #E5E7EB' }}>
              <History size={16} />
              <span>Tarix</span>
              {savedChats.length > 0 && (
                <span style={{ background: '#2563EB', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                  {savedChats.length}
                </span>
              )}
            </button>
            {isSpeaking && (<button onClick={stopSpeak} style={{ padding: '5px 10px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 16, fontSize: 11, color: '#92400E', cursor: 'pointer' }}><Volume2 size={12} /> To'xtat</button>)}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#DCFCE7', borderRadius: 16 }}>
              <div style={{ width: 6, height: 6, background: '#22C55E', borderRadius: '50%' }} />
              <span style={{ fontSize: 11, color: '#15803D', fontWeight: 600 }}>Online</span>
            </div>
          </div>
        </header>

        {/* Messages + History */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: 60 }}>
                  <div style={{ width: 56, height: 56, background: '#DBEAFE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <HelpCircle size={24} color="#2563EB" />
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Qanday yordam bera olaman?</h2>
                  <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>Huquqiy savol bering, hujjat yarataman, keys tahlil qilaman</p>
                  {savedChats.length > 0 && (
                    <button onClick={() => setHistoryOpen(true)} style={{ padding: '10px 24px', background: '#EFF6FF', color: '#2563EB', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                      📋 {savedChats.length} ta suhbat tarixi
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {messages.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: m.type === 'user' ? 'flex-end' : 'flex-start' }}>
                      {m.type === 'user' ? (
                        <div style={{ background: '#2563EB', color: '#fff', padding: '10px 16px', borderRadius: '16px 16px 4px 16px', maxWidth: '70%', fontSize: 14, lineHeight: 1.5 }}>{m.text}</div>
                      ) : (
                        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '4px 16px 16px 16px', padding: '14px 16px', maxWidth: '85%', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                          <AIResponse text={m.text} />
                          <div style={{ display: 'flex', gap: 6, marginTop: 8, paddingTop: 8, borderTop: '1px solid #F3F4F6', flexWrap: 'wrap' }}>
                            <button onClick={() => navigator.clipboard.writeText(m.text)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 11, color: '#6B7280', cursor: 'pointer' }}><Copy size={12} /> Nusxa</button>
                            {speechReady && <button onClick={() => speakText(m.text)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 11, color: '#6B7280', cursor: 'pointer' }}><Volume2 size={12} /> Eshit</button>}
                          </div>
                          {m.suggestions && m.suggestions.length > 0 && (
                            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              <span style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 2 }}><Lightbulb size={11} /> Keyingi:</span>
                              {m.suggestions.map((s, i) => (
                                <button key={i} onClick={() => sendMessage(s)} style={{ padding: '3px 10px', background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 16, fontSize: 11, color: '#92400E', cursor: 'pointer' }}>{s}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>{[0, 200, 400].map(d => <div key={d} style={{ width: 7, height: 7, background: '#93C5FD', borderRadius: '50%', animation: `bounce 1s ${d}ms infinite` }} />)}</div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
          </div>

          {/* ── History panel ── */}
          {historyOpen && (
            <div style={{ width: 280, background: '#fff', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Suhbat tarixi</span>
                <button onClick={() => setHistoryOpen(false)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18} /></button>
              </div>
              {savedChats.length > 0 && (
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #E5E7EB' }}>
                  <button onClick={clearAll} style={{ width: '100%', padding: '6px 12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                    <Trash2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Barchasini o'chirish
                  </button>
                </div>
              )}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                {savedChats.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
                    <Clock size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <p style={{ fontSize: 13, margin: 0 }}>Suhbatlar yo'q</p>
                  </div>
                ) : (
                  savedChats.map(chat => (
                    <div key={chat.id} onClick={() => loadChat(chat)}
                      style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, background: chat.id === currentChatId ? '#EFF6FF' : 'transparent', border: chat.id === currentChatId ? '1px solid #BFDBFE' : '1px solid transparent' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>{chat.messages.length} ta · {formatDate(chat.date)}</span>
                        <button onClick={(e) => deleteChat(e, chat.id)} style={{ padding: 2, background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: 12 }}>✕</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Input ── */}
        <div style={{ background: '#fff', borderTop: '1px solid #F1F5F9', padding: '12px 24px', flexShrink: 0 }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {isListening && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, background: '#EF4444', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                <span style={{ fontSize: 12, color: '#DC2626' }}>Tinglanmoqda...</span>
                <button onClick={stopMic} style={{ marginLeft: 'auto', padding: '2px 8px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>To'xtat</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                disabled={loading} placeholder="Huquqiy savol yozing... (Enter = yuborish)"
                rows={1} style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10, resize: 'none', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              {speechReady && (
                <button onClick={isListening ? stopMic : startMic}
                  style={{ padding: '0 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: isListening ? '#EF4444' : '#F3F4F6', color: isListening ? '#fff' : '#4B5563' }}>
                  <Mic size={18} />
                </button>
              )}
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
                style={{ padding: '0 20px', borderRadius: 10, border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', background: loading || !input.trim() ? '#93C5FD' : '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {loading ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 768px) { .desktop-sidebar { display: none !important; } }
      `}</style>
    </div>
  );
}
