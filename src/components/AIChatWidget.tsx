'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, History, Trash2, Sparkles, ChevronDown, Plus, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

function AIResponse({ text }: { text: string }) {
  return (
    <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({children}) => <h3 style={{fontSize:12,fontWeight:700,color:'var(--text-primary)',marginTop:8,marginBottom:4}}>{children}</h3>,
          h3: ({children}) => <h4 style={{fontSize:11,fontWeight:600,color:'var(--text-primary)',marginTop:6,marginBottom:3}}>{children}</h4>,
          strong: ({children}) => <strong style={{color:'var(--text-primary)',fontWeight:600}}>{children}</strong>,
          ul: ({children}) => <ul style={{paddingLeft:16,margin:'3px 0'}}>{children}</ul>,
          ol: ({children}) => <ol style={{paddingLeft:16,margin:'3px 0'}}>{children}</ol>,
          li: ({children}) => <li style={{marginBottom:2,lineHeight:1.5}}>{children}</li>,
          p: ({children}) => <p style={{margin:'3px 0'}}>{children}</p>,
          code: ({children}) => <code style={{background:'var(--hover-bg)',padding:'1px 4px',borderRadius:4,fontSize:11}}>{children}</code>,
        }}
      >{text}</ReactMarkdown>
    </div>
  );
}

export default function AIChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(400);
  const [windowHeight, setWindowHeight] = useState(560);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setWindowWidth(window.innerWidth - 32);
    setWindowHeight(window.innerHeight - 120);
  }, []);

  // Only show on dashboard
  if (pathname !== '/dashboard') return null;

  // Load saved chats
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ai_chats');
      if (raw) setSavedChats(JSON.parse(raw));
    } catch {}
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length === 0 || !currentChatId) return;
    const title = messages.find(m => m.type === 'user')?.text?.slice(0, 30) || 'Suhbat';
    const chat: SavedChat = {
      id: currentChatId,
      title,
      date: new Date().toISOString(),
      messages: messages.slice(-30).map(m => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp)
      }))
    };
    setSavedChats(prev => {
      const filtered = prev.filter(c => c.id !== chat.id);
      const updated = [chat, ...filtered].slice(0, 15);
      try { localStorage.setItem('ai_chats', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [messages, currentChatId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const chatId = currentChatId || 'chat-' + Date.now();
    if (!currentChatId) setCurrentChatId(chatId);

    setMessages(p => [...p, { id: 'u-' + Date.now(), text: msg, type: 'user', timestamp: new Date() }]);
    setInput('');
    setLoading(true);
    setMinimized(false);

    try {
      const res = await fetch('/api/ai/legal-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      const reply = data.response || data.text || 'Javob olinmadi';
      setMessages(p => [...p, { id: 'a-' + Date.now(), text: reply, type: 'assistant', timestamp: new Date(), suggestions: data.suggestions || [] }]);
    } catch {
      setMessages(p => [...p, { id: 'a-' + Date.now(), text: 'Xatolik yuz berdi', type: 'assistant', timestamp: new Date() }]);
    } finally { setLoading(false); }
  }, [input, loading, currentChatId]);

  const newChat = () => { setMessages([]); setCurrentChatId(null); setHistoryOpen(false); };

  const loadChat = (chat: SavedChat) => {
    setMessages(chat.messages.map(m => ({ ...m, type: m.type as 'user' | 'assistant', timestamp: new Date(m.timestamp) })));
    setCurrentChatId(chat.id);
    setHistoryOpen(false);
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedChats(prev => { const u = prev.filter(c => c.id !== id); try { localStorage.setItem('ai_chats', JSON.stringify(u)); } catch {} return u; });
    if (currentChatId === id) { setMessages([]); setCurrentChatId(null); }
  };

  const formatDate = (d: string) => {
    const date = new Date(d); const now = new Date(); const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return 'Bugun'; if (diff < 172800000) return 'Kecha';
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
  };

  const isFullscreenMode = fullscreen;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => { setOpen(!open); if (!open) { setMinimized(false); setFullscreen(false); } }}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #10b981 100%)',
          color: '#fff', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: open ? 'rotate(45deg) scale(0.95)' : 'scale(1)',
          animation: open ? 'none' : 'widgetPulse 2s ease-in-out infinite',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = open ? 'rotate(45deg) scale(1.05)' : 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(37, 99, 235, 0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = open ? 'rotate(45deg) scale(0.95)' : 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(37, 99, 235, 0.4)'; }}
      >
        {open ? <X size={24} /> : <Sparkles size={24} />}
      </button>

      {/* Chat Panel Overlay */}
      {open && (
        <div style={{
          position: 'fixed', zIndex: 9998,
          ...(isFullscreenMode
            ? { inset: 16, width: 'calc(100vw - 32px)', height: 'calc(100vh - 32px)' }
            : { bottom: 92, right: 24, width: Math.min(400, windowWidth), height: Math.min(560, windowHeight) }
          ),
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: isFullscreenMode ? 12 : 16,
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.15)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s ease-out',
          transition: minimized ? 'height 0.3s ease' : undefined,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderBottom: '1px solid var(--card-border)',
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', color: '#fff',
            flexShrink: 0, borderRadius: isFullscreenMode ? '12px 12px 0 0' : '16px 16px 0 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageCircle size={16} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>AI Yordamchi</span>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.6)' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Fullscreen Toggle */}
              <button onClick={() => setFullscreen(!fullscreen)}
                title={fullscreen ? 'Kichik rejim' : 'To\'liq ekran'}
                style={{ padding: 4, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button onClick={() => setMinimized(!minimized)}
                style={{ padding: 4, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                <ChevronDown size={14} style={{ transform: minimized ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              <button onClick={newChat}
                style={{ padding: 4, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                <Plus size={14} />
              </button>
              <button onClick={() => setHistoryOpen(!historyOpen)}
                style={{ padding: 4, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                <History size={14} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Body - Messages + History */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Messages Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', paddingTop: 40 }}>
                      <div style={{ width: 40, height: 40, background: 'var(--hover-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                        <Sparkles size={18} color="var(--primary)" />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>Qanday yordam bera olaman?</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 14px' }}>Huquqiy savolingizni yozing</p>
                      {savedChats.length > 0 && (
                        <button onClick={() => setHistoryOpen(true)}
                          style={{ padding: '6px 16px', background: 'var(--hover-bg)', color: 'var(--primary)', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          📋 {savedChats.length} ta suhbat
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {messages.map(m => (
                        <div key={m.id} style={{ display: 'flex', justifyContent: m.type === 'user' ? 'flex-end' : 'flex-start' }}>
                          {m.type === 'user' ? (
                            <div style={{ background: 'var(--primary)', color: '#fff', padding: '8px 14px', borderRadius: '14px 14px 4px 14px', maxWidth: '80%', fontSize: 13, lineHeight: 1.5 }}>{m.text}</div>
                          ) : (
                            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '4px 14px 14px 14px', padding: '10px 12px', maxWidth: '90%' }}>
                              <AIResponse text={m.text} />
                              {m.suggestions && m.suggestions.length > 0 && (
                                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                  {m.suggestions.slice(0, 2).map((s, i) => (
                                    <button key={i} onClick={() => sendMessage(s)}
                                      style={{ padding: '2px 8px', background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 12, fontSize: 10, color: '#92400E', cursor: 'pointer' }}>{s}</button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {loading && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '10px 14px' }}>
                            <div style={{ display: 'flex', gap: 4 }}>{[0, 200, 400].map(d => <div key={d} style={{ width: 6, height: 6, background: 'var(--primary)', borderRadius: '50%', animation: `bounce 1s ${d}ms infinite` }} />)}</div>
                          </div>
                        </div>
                      )}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                {/* History Panel */}
                {historyOpen && (
                  <div style={{ width: 180, background: 'var(--sidebar-bg)', borderLeft: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>Tarix</span>
                      <button onClick={() => setHistoryOpen(false)} style={{ padding: 2, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
                      {savedChats.length === 0 ? (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Suhbatlar yo'q</p>
                      ) : (
                        savedChats.map(chat => (
                          <div key={chat.id} onClick={() => loadChat(chat)}
                            style={{ padding: '6px 8px', borderRadius: 6, cursor: 'pointer', marginBottom: 3, background: chat.id === currentChatId ? 'var(--hover-bg)' : 'transparent' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatDate(chat.date)}</span>
                              <button onClick={(e) => deleteChat(e, chat.id)} style={{ padding: 1, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 10 }}>✕</button>
                            </div>
                          </div>
                        ))
                      )}
                      {savedChats.length > 0 && (
                        <button onClick={() => { if (confirm("Barcha suhbatlarni o'chirish?")) { setSavedChats([]); setMessages([]); setCurrentChatId(null); try { localStorage.removeItem('ai_chats'); } catch {} } }}
                          style={{ width: '100%', padding: '4px 8px', marginTop: 4, background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 10, opacity: 0.85 }}>
                          <Trash2 size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} /> Tozalash
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{ borderTop: '1px solid var(--card-border)', padding: '8px 10px', background: 'var(--sidebar-bg)', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    disabled={loading} placeholder="Huquqiy savol..."
                    rows={1} style={{
                      flex: 1, padding: '7px 10px', border: '1.5px solid var(--card-border)', borderRadius: 8,
                      resize: 'none', fontSize: 12, outline: 'none', fontFamily: 'inherit',
                      background: 'var(--input-bg)', color: 'var(--text-primary)',
                    }} />
                  <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
                    style={{
                      padding: '0 12px', borderRadius: 8, border: 'none',
                      cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                      background: loading || !input.trim() ? 'var(--text-muted)' : 'var(--primary)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {loading ? <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Send size={14} />}
                  </button>
                </div>
              </div>
            </>
          )}

          <style>{`
            @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
            @keyframes widgetPulse { 0%,100% { box-shadow:0 4px 20px rgba(37,99,235,0.4); } 50% { box-shadow:0 4px 28px rgba(37,99,235,0.55); } }
            @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
            @keyframes spin { to{transform:rotate(360deg)} }
          `}</style>
        </div>
      )}
    </>
  );
}
