'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, MessageCircle, FileText, Mic, Send, BookOpen, Scale, HelpCircle, Volume2, Lightbulb, Copy } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  type: 'user' | 'assistant';
  timestamp: Date;
  suggestions?: string[];
}

// ── AI javobini rangli bo'limlarda ko'rsatuvchi komponent ──────────────────
function AIResponse({ text }: { text: string }) {
  // ⚖️ = U+2696 U+FE0F — ba'zi LLM lar U+FE0F ni tushirib qoldiradi, shuning uchun ikkisini ham qabul qilamiz
  const SECTIONS = [
    { emojis: ['📋'], key: 'QISQA JAVOB',     bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' },
    { emojis: ['📖'], key: "ASOSIY MA'LUMOT", bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D' },
    { emojis: ['⚖️', '⚖'],  key: 'QONUN',    bg: '#F5F3FF', border: '#DDD6FE', color: '#7C3AED' },
    { emojis: ['💡'], key: 'MASLAHAT',         bg: '#FFF7ED', border: '#FED7AA', color: '#C2410C' },
  ];

  // Matnda qaysi emoji borligini topamiz
  const findEmoji = (t: string, emojis: string[]) => emojis.find(e => t.includes(e));
  const hasAnySection = SECTIONS.some(s => findEmoji(text, s.emojis));

  const renderLines = (content: string, color: string) =>
    content.split('\n').filter(l => l.trim()).map((line, i) => {
      const t = line.trim().replace(/^[•\-*]\s*/, '');
      const isBullet = /^[•\-*]/.test(line.trim());
      if (!t) return null;
      return isBullet ? (
        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px' }}>
          <span style={{ color, fontWeight: 700, flexShrink: 0 }}>•</span>
          <span style={{ fontSize: '14px', lineHeight: 1.6 }}>{t}</span>
        </div>
      ) : (
        <p key={i} style={{ fontSize: '14px', lineHeight: 1.6, marginBottom: '4px' }}>{t}</p>
      );
    });

  if (!hasAnySection) {
    return (
      <div style={{ color: '#374151' }}>
        {renderLines(text, '#3B82F6')}
      </div>
    );
  }

  // Bo'limlarga bo'lamiz — har bir bo'limni alohida qidirish
  const result: React.ReactNode[] = [];

  // Har bir bo'limning pozitsiyasini topamiz
  type SecPos = { sec: typeof SECTIONS[0]; emoji: string; start: number; end: number };
  const positions: SecPos[] = [];

  SECTIONS.forEach(sec => {
    const emoji = findEmoji(text, sec.emojis);
    if (!emoji) return;
    const start = text.indexOf(emoji);
    if (start === -1) return;
    positions.push({ sec, emoji, start, end: -1 });
  });

  // end pozitsiyalarini belgilaymiz
  positions.sort((a, b) => a.start - b.start);
  positions.forEach((p, i) => {
    p.end = positions[i + 1]?.start ?? text.length;
  });

  // Birinchi bo'limdan oldingi matn
  if (positions.length > 0 && positions[0].start > 0) {
    const before = text.slice(0, positions[0].start).trim();
    if (before) {
      result.push(<div key="pre" style={{ color: '#374151', marginBottom: 8 }}>{renderLines(before, '#3B82F6')}</div>);
    }
  }

  // Har bir bo'limni render qilamiz
  positions.forEach(({ sec, emoji, start, end }) => {
    const raw = text.slice(start, end);
    // Sarlavhani olib tashlaymiz
    const content = raw
      .replace(new RegExp(`[${sec.emojis.join('')}]`), '')
      .replace(sec.key + ':', '')
      .replace(sec.key, '')
      .trim();

    result.push(
      <div key={sec.key} style={{
        background: sec.bg, border: `1px solid ${sec.border}`,
        borderRadius: 12, padding: '12px 16px', marginBottom: 10
      }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: sec.color, marginBottom: 8 }}>
          {emoji} {sec.key}
        </div>
        <div style={{ color: '#1F2937' }}>{renderLines(content, sec.color)}</div>
      </div>
    );
  });

  return <>{result}</>;
}

// ── Asosiy komponent ───────────────────────────────────────────────────────
export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechReady, setSpeechReady] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'document'>('chat');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Speech qo'llab-quvvatlashini tekshirish
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tts = 'speechSynthesis' in window;
    const stt = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setSpeechReady(tts || stt || true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── API ga savol yuborish ─────────────────────────────────────
  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setMessages(p => [...p, { id: Date.now().toString(), text: msg, type: 'user', timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/legal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      const reply = data.response || data.text || 'Javob olinmadi';

      setMessages(p => [...p, {
        id: (Date.now() + 1).toString(),
        text: reply, type: 'assistant', timestamp: new Date(),
        suggestions: data.suggestions || []
      }]);

      if (autoSpeak && speechReady) speakText(reply);
    } catch {
      setMessages(p => [...p, {
        id: (Date.now() + 1).toString(),
        text: 'Xatolik yuz berdi. Serverni tekshiring.',
        type: 'assistant', timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, autoSpeak, speechReady]);

  // ── TTS ──────────────────────────────────────────────────────
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const clean = text.replace(/[📋📖⚖️💡🏛️•]\s*/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
    if (!clean) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'ru-RU'; u.rate = 0.88; u.pitch = 1; u.volume = 1;
    const rv = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('ru'));
    if (rv) u.voice = rv;
    u.onstart = () => setIsSpeaking(true);
    u.onend = u.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    if (window.speechSynthesis.getVoices().length > 0) {
      window.speechSynthesis.speak(u);
    } else {
      window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.speak(u); };
      setTimeout(() => window.speechSynthesis.speak(u), 300);
    }
  };

  const stopSpeak = () => { window.speechSynthesis?.cancel(); setIsSpeaking(false); };

  // ── STT ──────────────────────────────────────────────────────
  const startMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Ovozli kiritish faqat Chrome yoki Edge da ishlaydi.'); return; }
    const r = new SR();
    recognitionRef.current = r;
    r.lang = 'ru-RU'; r.continuous = false; r.interimResults = true;
    setIsListening(true);
    let buf = '';
    r.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) { buf = t; setInput(t); }
        else setInput(buf + t);
      }
    };
    r.onend = () => setIsListening(false);
    r.onerror = (e: any) => {
      setIsListening(false);
      if (e.error !== 'no-speech') alert({ 'not-allowed': 'Mikrofon ruxsati yo\'q.', 'audio-capture': 'Mikrofon topilmadi.' }[e.error as string] || 'Xato: ' + e.error);
    };
    r.start();
  };

  const stopMic = () => { recognitionRef.current?.stop(); setIsListening(false); };

  const templates = [
    { name: 'Shartnoma',         prompt: 'Tijorat shartnomasi namunasini yoz.' },
    { name: "Da'vo arizasi",     prompt: "Sudga da'vo arizasi namunasini yoz." },
    { name: 'Ogohlantirish xati', prompt: 'Rasmiy ogohlantirish xati yoz.' },
    { name: 'Vakolatnoma',        prompt: 'Vakolatnoma hujjati yoz.' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFF', display: 'flex' }}>
      {/* ── Sidebar — faqat desktop da ko'rinadi ── */}
      <aside className="desktop-sidebar" style={{ width: 256, background: '#fff', borderRight: '1px solid #F1F5F9', minHeight: '100vh', padding: '24px 16px', flexShrink: 0 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', textDecoration: 'none', fontSize: 14, marginBottom: 24 }}>
          <ArrowLeft size={16} /> Orqaga
        </a>

        <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Tezkor</p>
        {[
          { icon: <BookOpen size={14} />, label: 'Qonunni top',     prompt: 'Qaysi qonun yoki modda haqida bilmoqchisiz?' },
          { icon: <Scale size={14} />,    label: 'Keys tahlili',    prompt: 'Huquqiy vaziyatingizni tushuntiring.' },
          { icon: <FileText size={14} />, label: 'Hujjat yaratish', cb: () => setActiveMode('document') },
        ].map((a, i) => (
          <button key={i} onClick={() => { if (a.cb) a.cb(); else { setInput(a.prompt!); inputRef.current?.focus(); } }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, background: '#EFF6FF', color: '#1D4ED8', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
            {a.icon} {a.label}
          </button>
        ))}

        {activeMode === 'document' && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Namunalar</p>
            {templates.map(t => (
              <button key={t.name} onClick={() => { send(t.prompt); setActiveMode('chat'); }}
                style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB', cursor: 'pointer', marginBottom: 6, fontSize: 13, color: '#374151' }}>
                {t.name}
              </button>
            ))}
          </div>
        )}

        {speechReady && (
          <div style={{ marginTop: 20, padding: 12, background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#15803D', margin: '0 0 8px' }}>🔊 Ovoz</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={autoSpeak} onChange={e => setAutoSpeak(e.target.checked)} />
              AI javobini ovozda eshit
            </label>
          </div>
        )}
      </aside>

      {/* ── Chat maydon ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={18} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: 0 }}>AI Huquqiy Yordamchi</h1>
              <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Groq · llama-3.1-8b-instant</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isSpeaking && (
              <button onClick={stopSpeak} style={{ padding: '5px 12px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 20, fontSize: 12, color: '#92400E', cursor: 'pointer' }}>
                ⏹ To'xtat
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#DCFCE7', borderRadius: 20 }}>
              <div style={{ width: 7, height: 7, background: '#22C55E', borderRadius: '50%' }} />
              <span style={{ fontSize: 12, color: '#15803D', fontWeight: 600 }}>Online</span>
            </div>
          </div>
        </header>

        {/* Xabarlar */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>

            {/* Bo'sh holat */}
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: 48 }}>
                <div style={{ width: 64, height: 64, background: '#DBEAFE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <HelpCircle size={28} color="#2563EB" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Qanday yordam bera olaman?</h2>
                <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 32px' }}>Huquqiy savol bering, hujjat yarataman, keys tahlil qilaman</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, maxWidth: 600, margin: '0 auto' }}>
                  {[
                    { icon: <BookOpen size={20} color="#2563EB" />, title: 'Qonun tahlili', bg: '#DBEAFE' },
                    { icon: <Scale size={20} color="#16A34A" />,    title: 'Keys yechimi',  bg: '#DCFCE7' },
                    { icon: <FileText size={20} color="#7C3AED" />, title: 'Hujjatlar',    bg: '#EDE9FE' },
                  ].map((c, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                      <div style={{ width: 40, height: 40, background: c.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>{c.icon}</div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: '#111827', margin: 0 }}>{c.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Xabarlar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.type === 'user' ? 'flex-end' : 'flex-start' }}>
                  {m.type === 'user' ? (
                    <div style={{ background: '#2563EB', color: '#fff', padding: '11px 18px', borderRadius: '18px 18px 4px 18px', maxWidth: '72%', fontSize: 14, lineHeight: 1.6 }}>
                      {m.text}
                    </div>
                  ) : (
                    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '4px 18px 18px 18px', padding: '16px 18px', maxWidth: '88%', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                      <AIResponse text={m.text} />

                      {/* Amal tugmalari */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid #F3F4F6', flexWrap: 'wrap' }}>
                        <button onClick={() => navigator.clipboard.writeText(m.text)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, color: '#6B7280', cursor: 'pointer' }}>
                          <Copy size={12} /> Nusxa
                        </button>
                        {speechReady && (
                          <button onClick={() => speakText(m.text)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, color: '#6B7280', cursor: 'pointer' }}>
                            <Volume2 size={12} /> Eshit
                          </button>
                        )}
                      </div>

                      {/* Taklif savollar */}
                      {m.suggestions && m.suggestions.length > 0 && (
                        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          <span style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Lightbulb size={11} /> Keyingi:
                          </span>
                          {m.suggestions.map((s, i) => (
                            <button key={i} onClick={() => send(s)}
                              style={{ padding: '3px 10px', background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 20, fontSize: 11, color: '#92400E', cursor: 'pointer' }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading animatsiya */}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '4px 18px 18px 18px', padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {[0, 160, 320].map(d => (
                        <div key={d} style={{ width: 8, height: 8, background: '#93C5FD', borderRadius: '50%', animation: `bob 1s ${d}ms infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        {/* Kiritish maydoni */}
        <div style={{ background: '#fff', borderTop: '1px solid #F1F5F9', padding: '14px 32px' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            {isListening && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, background: '#EF4444', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                <span style={{ fontSize: 13, color: '#DC2626' }}>Tinglanmoqda... gapiring</span>
                <button onClick={stopMic} style={{ marginLeft: 'auto', padding: '3px 10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>To'xtat</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                disabled={loading}
                placeholder="Huquqiy savol yozing... (Enter = yuborish, Shift+Enter = yangi qator)"
                rows={2}
                style={{ flex: 1, padding: '12px 16px', border: '1.5px solid #E5E7EB', borderRadius: 14, resize: 'none', fontSize: 14, lineHeight: 1.5, outline: 'none', fontFamily: 'inherit', background: loading ? '#F9FAFB' : '#fff', transition: 'border-color 0.15s' }}
                onFocus={e => (e.target.style.borderColor = '#3B82F6')}
                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
              />
              {speechReady && (
                <button onClick={isListening ? stopMic : startMic}
                  style={{ padding: '0 16px', borderRadius: 14, border: 'none', cursor: 'pointer', background: isListening ? '#EF4444' : '#F3F4F6', color: isListening ? '#fff' : '#4B5563', transition: 'all 0.15s' }}
                  title={isListening ? "To'xtatish" : 'Ovozli kiritish'}>
                  <Mic size={18} />
                </button>
              )}
              <button onClick={() => send()} disabled={loading || !input.trim()}
                style={{ padding: '0 20px', borderRadius: 14, border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', background: loading || !input.trim() ? '#93C5FD' : '#2563EB', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                {loading
                  ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bob  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
