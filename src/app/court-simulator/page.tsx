'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Gavel, Scale, Users, Mic, Send, Clock, AlertTriangle, FileText, MessageCircle, Trophy } from 'lucide-react';

interface Msg {
  id: string;
  speaker: string;
  side: 'user' | 'judge';
  text: string;
  time: Date;
  type: 'statement' | 'objection' | 'evidence' | 'question' | 'ruling';
}

const ROLES = [
  { id: 'advokat',  title: 'Advokat',  sub: 'Himoyachi',  color: '#2563EB', bg: '#DBEAFE' },
  { id: 'prokuror', title: 'Prokuror', sub: 'Ayblovchi',  color: '#DC2626', bg: '#FEE2E2' },
  { id: 'sudya',    title: 'Sudya',    sub: 'Hakam',      color: '#7C3AED', bg: '#EDE9FE' },
];

const CASES = [
  { id: 'theft',    title: "O'g'irlik ishi",     desc: "Supermarketdan 450 000 so'mlik tovar o'g'irlash.",              law: 'JK 169-modda',          level: "Boshlang'ich" },
  { id: 'contract', title: 'Shartnoma buzilishi', desc: "Qurilish shartnomasi bajarilmagan, 50 mln so'm zarar.",          law: 'FK 345, 395-moddalar',  level: "O'rta" },
  { id: 'labor',    title: 'Mehnat nizosi',       desc: "Xodim noqonuniy ishdan bo'shatilgan, ish haqi to'lanmagan.",     law: 'MK 100, 161-moddalar',  level: "O'rta" },
  { id: 'divorce',  title: 'Ajrashish ishi',      desc: "Er-xotin ajrashmoqda, bola va mol-mulk taqsimoti nizosi.",       law: 'OK 39, 41-moddalar',    level: 'Murakkab' },
];

export default function CourtSimulatorPage() {
  const [page, setPage] = useState<'setup' | 'court' | 'result'>('setup');
  const [role, setRole] = useState(ROLES[0]);
  const [caseItem, setCaseItem] = useState(CASES[0]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(600);
  const [score, setScore] = useState({ etiquette: 100, argument: 0, evidence: 0 });
  const [simId, setSimId] = useState('');

  // Ovoz (faqat foydalanuvchi gapiradi — STT)
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  useEffect(() => {
    if (page !== 'court') return;
    if (time <= 0) { finish(); return; }
    const t = setTimeout(() => setTime(p => p - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, time]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ── STT — ovoz bilan kiritish (faqat foydalanuvchi gapiradi) ──
  const startMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Ovozli kiritish faqat Chrome yoki Edge brauzerida ishlaydi.'); return; }
    const r = new SR();
    recRef.current = r;
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
      if (e.error !== 'no-speech') {
        alert({ 'not-allowed': "Mikrofon ruxsati berilmagan. Brauzer sozlamalaridan yoqing.", 'audio-capture': 'Mikrofon topilmadi.' }[e.error as string] || 'Mikrofon xatosi: ' + e.error);
      }
    };
    r.start();
  };
  const stopMic = () => { recRef.current?.stop(); setListening(false); };

  const addMsg = (text: string, side: Msg['side'], speaker: string, type: Msg['type']) =>
    setMsgs(p => [...p, { id: Date.now() + '' + Math.random(), speaker, side, text, time: new Date(), type }]);

  // ── Sudni boshlash ────────────────────────────────────────
  const startCourt = async () => {
    setPage('court'); setMsgs([]); setScore({ etiquette: 100, argument: 0, evidence: 0 }); setTime(600);
    setLoading(true);
    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', caseDetails: `${caseItem.title}: ${caseItem.desc} Qonun: ${caseItem.law}. Foydalanuvchi roli: ${role.title} (${role.sub}).` })
      });
      const data = await res.json();
      setSimId(data.simulation_id || 'sim');
      const txt = data.transcript?.[0]?.content || data.ai_response || 'Sud majlisi ochiq deb e\'lon qilinadi. Tomonlar, so\'zingizni eshitaman.';
      addMsg(txt, 'judge', 'Sudya', 'ruling');
    } catch {
      const txt = 'Sud majlisi ochiq deb e\'lon qilinadi. So\'zingizni eshitaman.';
      addMsg(txt, 'judge', 'Sudya', 'ruling');
    } finally { setLoading(false); }
  };

  // ── Argument / amal yuborish ──────────────────────────────
  const submit = useCallback(async (override?: string, type: Msg['type'] = 'statement') => {
    const txt = (override ?? input).trim();
    if (!txt || loading) return;
    addMsg(txt, 'user', role.title, type);
    setInput('');
    setScore(s => ({
      ...s,
      argument: Math.min(100, s.argument + 12),
      evidence: type === 'evidence' ? Math.min(100, s.evidence + 15) : s.evidence,
    }));
    setLoading(true);
    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit_argument', simulationId: simId, argument: `${role.title} (${type}): ${txt}` })
      });
      const data = await res.json();
      const reply = data.transcript?.content || data.ai_response || 'Sud e\'tiborga oldi.';
      addMsg(reply, 'judge', 'Sudya', 'ruling');
    } catch {
      addMsg('Texnik nosozlik. Qaytadan urinib ko\'ring.', 'judge', 'Sudya', 'ruling');
    } finally { setLoading(false); }
  }, [input, loading, role, simId]);

  // ── Sudni yakunlash ───────────────────────────────────────
  const finish = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_verdict', simulationId: simId })
      });
      const data = await res.json();
      const verdict = data.verdict || 'Sud majlisi yakunlandi.';
      addMsg(verdict, 'judge', 'Sudya', 'ruling');
    } catch { /* ignore */ } finally { setLoading(false); }
    setTimeout(() => setPage('result'), 2200);
  };

  const total = Math.round((score.etiquette + score.argument + score.evidence) / 3);

  // ════════════════════════════ SETUP ════════════════════════════
  if (page === 'setup') return (
    <div style={{ minHeight: '100vh', background: '#F8FAFF', display: 'flex' }}>
      <aside className="desktop-sidebar" style={{ width: 240, background: '#fff', borderRight: '1px solid #F1F5F9', minHeight: '100vh', padding: '24px 16px', flexShrink: 0 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', textDecoration: 'none', fontSize: 14, marginBottom: 24 }}>
          <ArrowLeft size={16} /> Orqaga
        </a>
        <div style={{ background: '#EDE9FE', borderRadius: 12, padding: 14, border: '1px solid #DDD6FE' }}>
          <p style={{ fontWeight: 700, color: '#6D28D9', fontSize: 14, margin: '0 0 4px' }}>🏛️ Sud Simulyatori</p>
          <p style={{ fontSize: 12, color: '#7C3AED', margin: 0 }}>AI bilan ovozli sud jarayoni</p>
        </div>
        <div style={{ marginTop: 16, background: '#F0FDF4', borderRadius: 12, padding: 12, border: '1px solid #BBF7D0' }}>
          <p style={{ fontSize: 12, color: '#15803D', fontWeight: 600, margin: '0 0 6px' }}>🎤 Ovozli kiritish</p>
          <p style={{ fontSize: 11, color: '#16A34A', margin: 0 }}>Mikrofon orqali gapirib argument bera olasiz (Chrome/Edge). Sudya matnda javob beradi.</p>
        </div>
      </aside>

      <div style={{ flex: 1, padding: 40, overflowY: 'auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>Sud Simulyatori</h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 32px' }}>Rol va ishni tanlang — AI sudya bilan ovozli sud jarayonini boshlang</p>

        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>1. Rolingizni tanlang</h2>
        <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
          {ROLES.map(r => (
            <button key={r.id} onClick={() => setRole(r)}
              style={{ padding: 18, borderRadius: 14, border: `2px solid ${role.id === r.id ? r.color : '#E5E7EB'}`, background: role.id === r.id ? r.bg : '#fff', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 40, height: 40, background: r.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.color, marginBottom: 10 }}>
                {r.id === 'advokat' ? <Scale size={20} /> : r.id === 'prokuror' ? <Gavel size={20} /> : <Users size={20} />}
              </div>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '0 0 3px' }}>{r.title}</p>
              <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{r.sub}</p>
            </button>
          ))}
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>2. Ishni tanlang</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 32, maxWidth: 700 }}>
          {CASES.map(c => (
            <button key={c.id} onClick={() => setCaseItem(c)}
              style={{ padding: 16, borderRadius: 14, border: `2px solid ${caseItem.id === c.id ? '#7C3AED' : '#E5E7EB'}`, background: caseItem.id === c.id ? '#F5F3FF' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0 }}>{c.title}</p>
                <span style={{ fontSize: 10, background: '#EDE9FE', color: '#6D28D9', padding: '2px 8px', borderRadius: 20 }}>{c.level}</span>
              </div>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 8px' }}>{c.desc}</p>
              <span style={{ fontSize: 11, background: '#DBEAFE', color: '#1D4ED8', padding: '2px 8px', borderRadius: 20 }}>{c.law}</span>
            </button>
          ))}
        </div>

        <button onClick={startCourt}
          style={{ padding: '14px 38px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Gavel size={18} /> Sud majlisini boshlash
        </button>
      </div>
    </div>
  );

  // ════════════════════════════ COURT ════════════════════════════
  if (page === 'court') return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => setPage('setup')} style={{ padding: 8, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>🏛️ {caseItem.title}</p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{role.title} · {role.sub}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: time < 60 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)' }}>
            <Clock size={14} color={time < 60 ? '#F87171' : '#94A3B8'} />
            <span style={{ fontWeight: 700, fontSize: 14, color: time < 60 ? '#F87171' : '#fff' }}>{fmt(time)}</span>
          </div>
          <button onClick={finish} style={{ padding: '7px 16px', background: 'rgba(239,68,68,0.7)', border: '1px solid #EF4444', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Tugatish
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Ballar paneli — faqat desktop */}
        <aside className="desktop-sidebar" style={{ width: 200, background: 'rgba(0,0,0,0.4)', borderRight: '1px solid rgba(255,255,255,0.07)', padding: 18, flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Baholash</p>
          {[
            { l: 'Sud etikasi', v: score.etiquette, c: '#22C55E' },
            { l: 'Argument',    v: score.argument,  c: '#3B82F6' },
            { l: 'Dalillar',    v: score.evidence,  c: '#A855F7' },
          ].map(b => (
            <div key={b.l} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#CBD5E1' }}>{b.l}</span>
                <span style={{ fontWeight: 700, color: b.c }}>{b.v}%</span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
                <div style={{ height: 5, width: `${b.v}%`, background: b.c, borderRadius: 3, transition: 'width 0.4s' }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 20, padding: 14, background: 'rgba(124,58,237,0.15)', borderRadius: 12, border: '1px solid rgba(124,58,237,0.3)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#A78BFA', margin: '0 0 4px' }}>Umumiy</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0 }}>{total}</p>
          </div>
        </aside>

        {/* Transkript */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {msgs.map(m => {
                const isUser = m.side === 'user';
                const bg = { ruling: 'rgba(124,58,237,0.12)', objection: 'rgba(239,68,68,0.12)', evidence: 'rgba(168,85,247,0.12)', question: 'rgba(59,130,246,0.12)', statement: 'rgba(255,255,255,0.05)' }[m.type];
                const bd = { ruling: 'rgba(124,58,237,0.35)', objection: 'rgba(239,68,68,0.35)', evidence: 'rgba(168,85,247,0.35)', question: 'rgba(59,130,246,0.35)', statement: 'rgba(255,255,255,0.1)' }[m.type];
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', padding: '11px 15px', borderRadius: isUser ? '14px 14px 3px 14px' : '3px 14px 14px 14px', background: isUser ? 'rgba(37,99,235,0.4)' : bg, border: `1px solid ${isUser ? 'rgba(37,99,235,0.5)' : bd}` }}>
                      <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 4px', fontWeight: 600 }}>
                        {isUser ? '👤 ' : '👨‍⚖️ '}{m.speaker}
                      </p>
                      <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{m.text}</p>
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '12px 16px', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '3px 14px 14px 14px', display: 'flex', gap: 5 }}>
                    {[0, 150, 300].map(d => <div key={d} style={{ width: 8, height: 8, background: '#A78BFA', borderRadius: '50%', animation: `bob 1s ${d}ms infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Kiritish */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', padding: '14px 24px' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {[
                  { icon: <AlertTriangle size={12} />, label: "E'tiroz", txt: "E'tiroz bildiraman! Bu dalil qonunga zid.", type: 'objection' as const },
                  { icon: <FileText size={12} />,      label: 'Dalil',   txt: 'Hujjatli dalil taqdim etaman.', type: 'evidence' as const },
                  { icon: <MessageCircle size={12} />, label: 'Savol',   txt: 'Guvohga savol beraman: voqeani tasvirlab bering.', type: 'question' as const },
                ].map((a, i) => (
                  <button key={i} onClick={() => submit(a.txt, a.type)} disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 13px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 20, color: '#CBD5E1', fontSize: 12, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>

              {listening && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, background: '#EF4444', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                  <span style={{ fontSize: 13, color: '#FCA5A5' }}>🎤 Tinglanmoqda... gapiring</span>
                  <button onClick={stopMic} style={{ marginLeft: 'auto', padding: '2px 10px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>To'xtat</button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
                  disabled={loading} rows={2}
                  placeholder={`${role.title} sifatida nutqingizni yozing yoki 🎤 bosib gapiring...`}
                  style={{ flex: 1, padding: '11px 15px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 12, color: '#F1F5F9', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit' }}
                />
                <button onClick={listening ? stopMic : startMic}
                  style={{ padding: '0 16px', borderRadius: 12, border: 'none', cursor: 'pointer', background: listening ? '#EF4444' : 'rgba(255,255,255,0.12)', color: '#fff', animation: listening ? 'pulse 1s infinite' : 'none' }}
                  title={listening ? "To'xtatish" : 'Ovoz bilan kiritish'}>
                  <Mic size={18} />
                </button>
                <button onClick={() => submit()} disabled={loading || !input.trim()}
                  style={{ padding: '0 18px', borderRadius: 12, border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', background: loading || !input.trim() ? 'rgba(124,58,237,0.3)' : '#7C3AED', color: '#fff', display: 'flex', alignItems: 'center' }}>
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

  // ════════════════════════════ RESULT ════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 22, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', maxWidth: 520, width: '100%', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#7C3AED,#2563EB)', padding: '36px 28px', textAlign: 'center' }}>
          <Trophy size={48} color="#fff" />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '12px 0 6px' }}>Sud Yakunlandi</h1>
          <p style={{ fontSize: 13, color: '#DDD6FE', margin: 0 }}>{role.title} · {caseItem.title}</p>
        </div>
        <div style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { l: 'Etika',    v: score.etiquette, c: '#22C55E' },
              { l: 'Argument', v: score.argument,  c: '#3B82F6' },
              { l: 'Dalillar', v: score.evidence,  c: '#A855F7' },
            ].map(b => (
              <div key={b.l} style={{ background: '#F8FAFF', borderRadius: 12, padding: 14, textAlign: 'center', border: '1px solid #E5E7EB' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: b.c, margin: '0 0 4px' }}>{b.v}%</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{b.l}</p>
              </div>
            ))}
          </div>
          <div style={{ background: 'linear-gradient(135deg,#F5F3FF,#EFF6FF)', borderRadius: 14, padding: 18, textAlign: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px' }}>Umumiy ball</p>
            <p style={{ fontSize: 42, fontWeight: 900, color: '#7C3AED', margin: '0 0 8px' }}>{total}/100</p>
            <div style={{ background: '#E5E7EB', borderRadius: 4, height: 7 }}>
              <div style={{ height: 7, width: `${total}%`, background: 'linear-gradient(90deg,#7C3AED,#2563EB)', borderRadius: 4 }} />
            </div>
            <p style={{ fontSize: 13, color: '#374151', margin: '10px 0 0', fontWeight: 600 }}>
              {total >= 80 ? "🏆 A'lo! Professional yurist darajasi." : total >= 60 ? '👍 Yaxshi natija. Davom eting.' : '💪 Mashq qiling, natija yaxshilanadi.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setPage('setup'); setMsgs([]); }}
              style={{ flex: 1, padding: 12, background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Qayta boshlash
            </button>
            <a href="/" style={{ flex: 1, padding: 12, background: '#F3F4F6', color: '#374151', borderRadius: 11, fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Bosh sahifa
            </a>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
