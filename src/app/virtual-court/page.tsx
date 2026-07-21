'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Gavel, Scale, Users, Mic, Send, Clock, AlertTriangle, FileText, MessageCircle, Volume2, VolumeX, Square, Star, CheckCircle, Target } from 'lucide-react';

interface Msg {
  id: string; speaker: string;
  role: 'user' | 'judge';
  text: string; timestamp: Date;
  type: 'statement' | 'objection' | 'question' | 'ruling';
}

const ROLES = [
  { id: 'advokat',  title: 'Advokat',  sub: 'Yoqlovchi', color: '#2563EB', bg: '#DBEAFE' },
  { id: 'prokuror', title: 'Prokuror', sub: 'Ayblovchi', color: '#DC2626', bg: '#FEE2E2' },
  { id: 'sudya',    title: 'Sudya',    sub: 'Hakam',     color: '#7C3AED', bg: '#EDE9FE' },
];

const CASES = [
  { id: 'theft',    title: "O'g'irlik ishi",        desc: "Supermarketdan 450,000 so'm tovar o'g'irlash.",                    law: "JK 169-modda" },
  { id: 'contract', title: 'Shartnoma buzilishi',    desc: '6 oylik qurilish shartnomasi bajarilmagan, 50 mln so\'m zarar.',  law: 'FK 345, 395-moddalar' },
  { id: 'labor',    title: 'Mehnat nizosi',          desc: "Xodim hujjatsiz ishdan bo'shatilgan, 3 oylik ish haqi yo'q.",     law: 'MK 100, 161-moddalar' },
];

export default function VirtualCourt() {
  const [page, setPage] = useState<'select' | 'session' | 'verdict'>('select');
  const [role, setRole] = useState(ROLES[0]);
  const [caseItem, setCase] = useState(CASES[0]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(600);
  const [score, setScore] = useState({ etiquette: 100, argumentation: 0, evidence: 0 });
  const [speechReady, setSpeechReady] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Speech API availability — localhost HTTP da ham ishlaydi
    if (typeof window === 'undefined') return;
    const tts = 'speechSynthesis' in window;
    const stt = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    // Chrome'da localhost uchun speech ruxsat berilgan, shuning uchun true qilamiz
    setSpeechReady(tts || stt || true);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  useEffect(() => {
    if (page !== 'session') return;
    if (time <= 0) { endSession(); return; }
    const t = setTimeout(() => setTime(p => p - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, time]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ── TTS ──────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    const clean = text.replace(/[•]\s*/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
    if (!clean) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'ru-RU'; u.rate = 0.88; u.pitch = 1; u.volume = 1;
    const rv = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('ru'));
    if (rv) u.voice = rv;
    u.onstart = () => setSpeaking(true);
    u.onend = u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    const doIt = () => window.speechSynthesis.speak(u);
    if (window.speechSynthesis.getVoices().length > 0) doIt();
    else { window.speechSynthesis.onvoiceschanged = doIt; setTimeout(doIt, 400); }
  }, []);

  const stopSpeak = () => { window.speechSynthesis?.cancel(); setSpeaking(false); };

  // ── STT ──────────────────────────────────────────────────
  const startMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Ovozli kiritish faqat Chrome yoki Edge brauzerida ishlaydi.'); return; }
    const r = new SR();
    recognitionRef.current = r;
    r.lang = 'ru-RU'; r.continuous = false; r.interimResults = true;
    setListening(true);
    let buf = '';
    r.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) { buf = t; setInput(t); }
        else setInput(buf + t);
      }
    };
    r.onend = () => setListening(false);
    r.onerror = (e: any) => {
      setListening(false);
      if (e.error !== 'no-speech') alert({ 'not-allowed': 'Mikrofon ruxsati yo\'q.', 'audio-capture': 'Mikrofon topilmadi.' }[e.error as string] || 'Xato: ' + e.error);
    };
    r.start();
  };
  const stopMic = () => { recognitionRef.current?.stop(); setListening(false); };

  const addMsg = (text: string, role: Msg['role'], speaker: string, type: Msg['type']) => {
    setMsgs(p => [...p, { id: Date.now().toString() + Math.random(), speaker, role, text, timestamp: new Date(), type }]);
  };

  // ── Sud boshlash ──────────────────────────────────────────
  const startSession = async () => {
    setPage('session'); setMsgs([]); setScore({ etiquette: 100, argumentation: 0, evidence: 0 }); setTime(600);
    setLoading(true);
    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', caseDetails: `${caseItem.title}: ${caseItem.desc} Qonun: ${caseItem.law}. Rol: ${role.title}.` })
      });
      const data = await res.json();
      const txt = data.transcript?.[0]?.content || data.ai_response || 'Sud majlisi ochildi. So\'zingiz.';
      addMsg(txt, 'judge', 'Sudya', 'ruling');
      if (autoSpeak) speak(txt);
    } catch {
      const txt = 'Sud majlisi ochildi. So\'zingizni eshitishga tayyormiz.';
      addMsg(txt, 'judge', 'Sudya', 'ruling');
      if (autoSpeak) speak(txt);
    } finally { setLoading(false); }
  };

  // ── Argument yuborish ──────────────────────────────────────
  const submit = useCallback(async (override?: string) => {
    const txt = (override ?? input).trim();
    if (!txt || loading) return;
    addMsg(txt, 'user', role.title, 'statement');
    setInput('');
    setScore(s => ({ ...s, argumentation: Math.min(100, s.argumentation + 12) }));
    setLoading(true);
    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit_argument', simulationId: 'vc', argument: `${role.title}: ${txt}` })
      });
      const data = await res.json();
      const reply = data.transcript?.content || data.ai_response || 'Sud javobini belgilaydi.';
      addMsg(reply, 'judge', 'Sudya', 'ruling');
      if (autoSpeak) speak(reply);
    } catch {
      addMsg('Texnik nosozlik. Qaytadan urinib ko\'ring.', 'judge', 'Sudya', 'ruling');
    } finally { setLoading(false); }
  }, [input, loading, role, autoSpeak, speak]);

  // ── Tugatish ──────────────────────────────────────────────
  const endSession = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_verdict', simulationId: 'vc' })
      });
      const data = await res.json();
      const verdict = data.verdict || 'Sud majlisi yakunlandi.';
      addMsg(verdict, 'judge', 'Sudya', 'ruling');
      if (autoSpeak) speak(verdict);
    } catch { /* ignore */ } finally { setLoading(false); }
    setTimeout(() => setPage('verdict'), 1800);
  };

  const total = Math.round((score.etiquette + score.argumentation + score.evidence) / 3);

  // ════════════════════════════════════════════════════════
  // ROL TANLASH SAHIFASI
  // ════════════════════════════════════════════════════════
  if (page === 'select') return (
    <div style={{ minHeight: '100vh', background: '#F8FAFF' }}>
      <div style={{ display: 'flex' }}>
        <aside className="desktop-sidebar" style={{ width: 240, background: '#fff', borderRight: '1px solid #F1F5F9', minHeight: '100vh', padding: '24px 16px', flexShrink: 0 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', textDecoration: 'none', fontSize: 14, marginBottom: 24 }}>
            <ArrowLeft size={16} /> Orqaga
          </a>
          <div style={{ background: '#FFF7ED', borderRadius: 12, padding: 14, border: '1px solid #FED7AA' }}>
            <p style={{ fontWeight: 700, color: '#C2410C', fontSize: 14, margin: '0 0 4px' }}>Virtual Sud</p>
            <p style={{ fontSize: 12, color: '#9A3412', margin: 0 }}>AI sudya bilan real sud jarayoni</p>
          </div>
          {speechReady && (
            <div style={{ marginTop: 16, background: '#F0FDF4', borderRadius: 12, padding: 12, border: '1px solid #BBF7D0' }}>
              <p style={{ fontSize: 12, color: '#15803D', fontWeight: 600, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 4 }}><Volume2 size={14} /> Ovoz</p>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: '#374151', cursor: 'pointer' }}>
                <input type="checkbox" checked={autoSpeak} onChange={e => setAutoSpeak(e.target.checked)} />
                Sudya ovozini eshit
              </label>
            </div>
          )}
        </aside>

        <div style={{ flex: 1, padding: 40 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>Virtual Sud Majlisi</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 32px' }}>Rol va ishni tanlang</p>

          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>1. Rolingizni tanlang</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
            {ROLES.map(r => (
              <button key={r.id} onClick={() => setRole(r)}
                style={{ padding: 18, borderRadius: 14, border: `2px solid ${role.id === r.id ? r.color : '#E5E7EB'}`, background: role.id === r.id ? r.bg : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '0 0 4px' }}>{r.title}</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{r.sub}</p>
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>2. Ishni tanlang</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 32 }}>
            {CASES.map(c => (
              <button key={c.id} onClick={() => setCase(c)}
                style={{ padding: 16, borderRadius: 14, border: `2px solid ${caseItem.id === c.id ? '#2563EB' : '#E5E7EB'}`, background: caseItem.id === c.id ? '#EFF6FF' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', margin: '0 0 5px' }}>{c.title}</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 8px' }}>{c.desc}</p>
                <span style={{ fontSize: 11, background: '#DBEAFE', color: '#1D4ED8', padding: '2px 8px', borderRadius: 20 }}>{c.law}</span>
              </button>
            ))}
          </div>

          <button onClick={startSession}
            style={{ padding: '13px 36px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Gavel size={18} /> Sud majlisini boshlash
          </button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════
  // SUD JARAYONI SAHIFASI
  // ════════════════════════════════════════════════════════
  if (page === 'session') return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => setPage('select')} style={{ padding: 8, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{caseItem.title}</p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{role.title} · {role.sub}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {speechReady && (
            <>
              <button onClick={() => setAutoSpeak(p => !p)}
                style={{ padding: '5px 12px', background: autoSpeak ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${autoSpeak ? '#22C55E' : 'rgba(255,255,255,0.15)'}`, borderRadius: 20, color: autoSpeak ? '#4ADE80' : '#94A3B8', fontSize: 12, cursor: 'pointer' }}>
                {autoSpeak ? <><Volume2 className="w-3.5 h-3.5" /> Ovoz ON</> : <><VolumeX className="w-3.5 h-3.5" /> Ovoz OFF</>}
              </button>
              {speaking && (
                <button onClick={stopSpeak}
                  style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.2)', border: '1px solid #EF4444', borderRadius: 20, color: '#F87171', fontSize: 12, cursor: 'pointer' }}>
                  <Square className="w-3.5 h-3.5" /> To'xtat
                </button>
              )}
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: time < 60 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)' }}>
            <Clock size={14} color={time < 60 ? '#F87171' : '#94A3B8'} />
            <span style={{ fontWeight: 700, fontSize: 14, color: time < 60 ? '#F87171' : '#fff' }}>{fmt(time)}</span>
          </div>
          <button onClick={endSession} style={{ padding: '7px 16px', background: 'rgba(239,68,68,0.7)', border: '1px solid #EF4444', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Tugatish
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Ball paneli */}
        <aside className="desktop-sidebar" style={{ width: 200, background: 'rgba(0,0,0,0.4)', borderRight: '1px solid rgba(255,255,255,0.07)', padding: 18, flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Ballar</p>
          {[
            { l: 'Etika', v: score.etiquette, c: '#22C55E' },
            { l: 'Argument', v: score.argumentation, c: '#3B82F6' },
            { l: 'Dalillar', v: score.evidence, c: '#A855F7' },
          ].map(b => (
            <div key={b.l} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: '#CBD5E1' }}>{b.l}</span>
                <span style={{ fontWeight: 700, color: b.c }}>{b.v}%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <div style={{ height: 4, width: `${b.v}%`, background: b.c, borderRadius: 2, transition: 'width 0.4s' }} />
              </div>
            </div>
          ))}
        </aside>

        {/* Transkript + kiritish */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Xabarlar */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {msgs.map(m => {
                const isUser = m.role === 'user';
                const bg = { ruling: 'rgba(124,58,237,0.12)', objection: 'rgba(239,68,68,0.12)', question: 'rgba(59,130,246,0.12)', statement: 'rgba(255,255,255,0.05)' }[m.type];
                const bd = { ruling: 'rgba(124,58,237,0.35)', objection: 'rgba(239,68,68,0.35)', question: 'rgba(59,130,246,0.35)', statement: 'rgba(255,255,255,0.1)' }[m.type];
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '78%', padding: '11px 15px', borderRadius: isUser ? '14px 14px 3px 14px' : '3px 14px 14px 14px', background: isUser ? 'rgba(37,99,235,0.4)' : bg, border: `1px solid ${isUser ? 'rgba(37,99,235,0.5)' : bd}` }}>
                      <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 4px', fontWeight: 600 }}>{m.speaker}</p>
                      <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{m.text}</p>
                      {speechReady && !isUser && (
                        <button onClick={() => speak(m.text)}
                          style={{ marginTop: 7, padding: '2px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: '#94A3B8', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Volume2 size={10} /> Eshit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '12px 16px', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '3px 14px 14px 14px', display: 'flex', gap: 5 }}>
                    {[0, 150, 300].map(d => (
                      <div key={d} style={{ width: 8, height: 8, background: '#A78BFA', borderRadius: '50%', animation: `bob 1s ${d}ms infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Kiritish */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', padding: '14px 24px' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              {/* Tezkor amallar */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {[
                  { icon: <AlertTriangle size={12} />, label: "E'tiroz!",    txt: "E'tiroz bildiraman! Bu dalil qonunga zid." },
                  { icon: <FileText size={12} />,      label: 'Dalil keltir', txt: 'Hujjatli dalil taqdim etaman.' },
                  { icon: <MessageCircle size={12} />, label: 'Savol ber',   txt: 'Guvohga savol: voqeani batafsil tushuntirib bering.' },
                ].map((a, i) => (
                  <button key={i} onClick={() => submit(a.txt)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 20, color: '#CBD5E1', fontSize: 12, cursor: 'pointer' }}>
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>

              {listening && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, background: '#EF4444', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                  <span style={{ fontSize: 13, color: '#FCA5A5' }}>Tinglanmoqda... gapiring</span>
                  <button onClick={stopMic} style={{ marginLeft: 'auto', padding: '2px 10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>To'xtat</button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
                  disabled={loading} rows={2}
                  placeholder={`${role.title} sifatida nutq yoki argument kiriting...`}
                  style={{ flex: 1, padding: '11px 15px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 12, color: '#F1F5F9', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit' }}
                />
                {speechReady && (
                  <button onClick={listening ? stopMic : startMic}
                    style={{ padding: '0 15px', borderRadius: 12, border: 'none', cursor: 'pointer', background: listening ? '#EF4444' : 'rgba(255,255,255,0.1)', color: '#fff' }}
                    title={listening ? "To'xtatish" : 'Ovozli kiritish'}>
                    <Mic size={17} />
                  </button>
                )}
                <button onClick={() => submit()} disabled={loading || !input.trim()}
                  style={{ padding: '0 18px', borderRadius: 12, border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', background: loading || !input.trim() ? 'rgba(37,99,235,0.3)' : '#2563EB', color: '#fff', display: 'flex', alignItems: 'center' }}>
                  {loading
                    ? <div style={{ width: 17, height: 17, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    : <Send size={17} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes bob  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );

  // ════════════════════════════════════════════════════════
  // NATIJALAR SAHIFASI
  // ════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 22, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', maxWidth: 520, width: '100%', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#1D4ED8,#7C3AED)', padding: '36px 28px', textAlign: 'center' }}>
          <Gavel size={48} color="#fff" />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '12px 0 6px' }}>Sud Majlisi Yakunlandi</h1>
          <p style={{ fontSize: 13, color: '#BFDBFE', margin: 0 }}>{role.title} · {caseItem.title}</p>
        </div>
        <div style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { l: 'Etika', v: score.etiquette, c: '#22C55E' },
              { l: 'Argument', v: score.argumentation, c: '#3B82F6' },
              { l: 'Dalillar', v: score.evidence, c: '#A855F7' },
            ].map(b => (
              <div key={b.l} style={{ background: '#F8FAFF', borderRadius: 12, padding: 14, textAlign: 'center', border: '1px solid #E5E7EB' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: b.c, margin: '0 0 4px' }}>{b.v}%</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{b.l}</p>
              </div>
            ))}
          </div>
          <div style={{ background: 'linear-gradient(135deg,#EFF6FF,#F5F3FF)', borderRadius: 14, padding: 18, textAlign: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px' }}>Umumiy ball</p>
            <p style={{ fontSize: 42, fontWeight: 900, color: '#2563EB', margin: '0 0 8px' }}>{total}/100</p>
            <div style={{ background: '#E5E7EB', borderRadius: 4, height: 7 }}>
              <div style={{ height: 7, width: `${total}%`, background: 'linear-gradient(90deg,#2563EB,#7C3AED)', borderRadius: 4 }} />
            </div>
            <p style={{ fontSize: 13, color: '#374151', margin: '10px 0 0', fontWeight: 600 }}>
              {total >= 80 ? <><Star className="w-4 h-4 text-yellow-500 fill-yellow-500 inline mr-1" />A'lo! Professional darajasi.</> : total >= 60 ? <><CheckCircle className="w-4 h-4 text-green-500 inline mr-1" />Yaxshi. Davom eting.</> : <><Target className="w-4 h-4 text-blue-500 inline mr-1" />Mashq qiling.</>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setPage('select'); setMsgs([]); }}
              style={{ flex: 1, padding: 12, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Qayta boshlash
            </button>
            <a href="/"
              style={{ flex: 1, padding: 12, background: '#F3F4F6', color: '#374151', borderRadius: 11, fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Bosh sahifa
            </a>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
