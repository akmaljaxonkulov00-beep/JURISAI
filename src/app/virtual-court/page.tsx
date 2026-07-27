'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Gavel, Scale, Users, Mic, Send, Clock, AlertTriangle, FileText, MessageCircle, Volume2, VolumeX, Square, Star, CheckCircle, Target, Search, Award, TrendingUp, Play } from 'lucide-react';

interface Msg {
  id: string; speaker: string;
  role: 'user' | 'judge' | 'ai';
  text: string; timestamp: Date;
  type: 'statement' | 'objection' | 'evidence' | 'question' | 'ruling';
}

interface SimResult {
  legalAccuracy: number;
  ethics: number;
  confidence: number;
  etiquette: number;
  argument: number;
  evidence: number;
  totalScore: number;
  xpEarned: number;
  achievements: string[];
}

// ── Simulation types ──
const SIM_TYPES = [
  {
    id: 'court', title: 'Sud Jarayoni', desc: 'Sudya, advokat yoki prokuror rolida ishtirok eting',
    color: '#2563EB', bg: '#DBEAFE',
    cases: [
      { id: 'theft', title: "O'g'irlik ishi", desc: "Supermarketdan 450 000 so'mlik tovar o'g'irlash.", law: 'JK 169-modda', level: "Boshlang'ich" },
      { id: 'contract', title: 'Shartnoma buzilishi', desc: "Qurilish shartnomasi bajarilmagan, 50 mln so'm zarar.", law: 'FK 345, 395-moddalar', level: "O'rta" },
      { id: 'labor', title: 'Mehnat nizosi', desc: "Xodim noqonuniy ishdan bo'shatilgan.", law: 'MK 100, 161-moddalar', level: "O'rta" },
      { id: 'divorce', title: 'Ajrashish ishi', desc: "Er-xotin ajrashmoqda, mulk va bola taqsimoti.", law: 'OK 39, 41-moddalar', level: 'Murakkab' },
    ],
    roles: [
      { id: 'advokat', title: 'Advokat', sub: 'Himoyachi', icon: 'scale' },
      { id: 'prokuror', title: 'Prokuror', sub: 'Ayblovchi', icon: 'gavel' },
      { id: 'sudya', title: 'Sudya', sub: 'Hakam', icon: 'users' },
    ],
  },
  {
    id: 'negotiation', title: 'Muzokara', desc: 'AI mijoz bilan muzokara qiling va kelishuvga erishing',
    color: '#059669', bg: '#D1FAE5',
    cases: [
      { id: 'contract_dispute', title: 'Shartnoma kelishmovchiligi', desc: "Mijoz shartnoma shartlariga rozi emas.", law: 'FK 354-modda', level: "O'rta" },
      { id: 'debt_settlement', title: 'Qarz kelishuvi', desc: "Qarzdor bilan to'lov muddatini kelishish.", law: 'FK 260-modda', level: "Boshlang'ich" },
    ],
    roles: [
      { id: 'consultant', title: 'Maslahatchi', sub: 'Huquqiy maslahat', icon: 'scale' },
      { id: 'mediator', title: 'Mediator', sub: 'Tomonlar kelishuvi', icon: 'users' },
    ],
  },
  {
    id: 'investigation', title: 'Tergov', desc: 'Guvohlarni so\'roq qiling va dalillarni tahlil qiling',
    color: '#7C3AED', bg: '#EDE9FE',
    cases: [
      { id: 'burglary', title: "O'g'irlik tergovi", desc: "Kvartira o'g'irlangan, guvohlar so'roq qilinadi.", law: 'JK 169-modda', level: "O'rta" },
      { id: 'fraud', title: 'Firibgarlik ishi', desc: "Bank hisobidan pul o'g'irlangan, dalillar tahlili.", law: 'JK 168-modda', level: 'Murakkab' },
    ],
    roles: [
      { id: 'detective', title: 'Detektiv', sub: 'Jinoyatni ochish', icon: 'search' },
      { id: 'investigator', title: 'Tergovchi', sub: 'Dalillar tahlili', icon: 'scale' },
    ],
  },
];

export default function VirtualCourt() {
  const [page, setPage] = useState<'select' | 'session' | 'verdict'>('select');
  const [simType, setSimType] = useState(SIM_TYPES[0]);
  const [role, setRole] = useState(SIM_TYPES[0].roles[0]);
  const [caseItem, setCase] = useState(SIM_TYPES[0].cases[0]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(600);
  const [score, setScore] = useState({ etiquette: 100, argument: 0, evidence: 0 });
  const [stressLevel, setStressLevel] = useState(0);
  const [speechReady, setSpeechReady] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [simId, setSimId] = useState('');
  const [results, setResults] = useState<SimResult | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const listeningRef = useRef(false);
  const silenceTimerRef = useRef<any>(null);

  // Load XP from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('virtual_court_xp');
      if (saved) setTotalXp(parseInt(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tts = 'speechSynthesis' in window;
    const stt = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
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

  // ── TTS ──
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

  // ── STT ──
  const SILENCE_TIMEOUT_MS = 3000;
  const startMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Ovozli kiritish faqat Chrome yoki Edge brauzerida ishlaydi.'); return; }
    const r = new SR();
    recognitionRef.current = r;
    r.lang = 'uz-UZ';
    r.continuous = true;
    r.interimResults = true;
    listeningRef.current = true;
    setListening(true);
    let buf = '';
    r.onresult = (e: any) => {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          buf = t;
          setInput(t.charAt(0).toUpperCase() + t.slice(1));
          silenceTimerRef.current = setTimeout(() => {}, SILENCE_TIMEOUT_MS);
        } else { setInput(buf + t); }
      }
    };
    r.onend = () => { if (listeningRef.current) { try { r.start(); } catch {} } else { setListening(false); } };
    r.onerror = (e: any) => {
      if (e.error === 'no-speech') { if (listeningRef.current) setTimeout(() => { try { r.start(); } catch {} }, 500); return; }
      setListening(false);
      const msg: Record<string, string> = { 'not-allowed': "Mikrofon ruxsati yo'q.", 'audio-capture': 'Mikrofon topilmadi.' };
      if (msg[e.error]) alert(msg[e.error]);
    };
    r.start();
  };
  const stopMic = () => {
    listeningRef.current = false;
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    setListening(false);
    recognitionRef.current?.stop();
  };

  const addMsg = (text: string, role: Msg['role'], speaker: string, type: Msg['type']) => {
    setMsgs(p => [...p, { id: Date.now().toString() + Math.random(), speaker, role, text, timestamp: new Date(), type }]);
  };

  // ── Get case description for API ──
  const getCasePrompt = () => {
    return `${caseItem.title}: ${caseItem.desc} Qonun: ${caseItem.law}. Simulyatsiya: ${simType.title}. Foydalanuvchi roli: ${role.title} (${role.sub}).`;
  };

  // ── Start ──
  const startSession = async () => {
    setPage('session'); setMsgs([]);
    setScore({ etiquette: 100, argument: 0, evidence: 0 });
    setStressLevel(0);
    setTime(simType.id === 'court' ? 600 : 300);
    setLoading(true);
    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', caseDetails: getCasePrompt() })
      });
      const data = await res.json();
      setSimId(data.simulation_id || 'vc_' + Date.now());
      const txt = data.transcript?.[0]?.content || data.ai_response || 'Simulyatsiya boshlandi. Sizning so\'zingizni eshitaman.';
      addMsg(txt, 'judge', simType.id === 'court' ? 'Sudya' : 'AI', 'ruling');
      if (autoSpeak) speak(txt);
    } catch {
      const txt = simType.id === 'court' ? 'Sud majlisi ochiq deb e\'lon qilinadi.' : 'Simulyatsiya boshlandi. Sizning so\'zingizni eshitaman.';
      addMsg(txt, 'judge', simType.id === 'court' ? 'Sudya' : 'AI', 'ruling');
      if (autoSpeak) speak(txt);
    } finally { setLoading(false); }
  };

  // ── Submit ──
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
    // Reduce stress
    setStressLevel(s => Math.max(0, s - 5));
    setLoading(true);
    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit_argument', simulationId: simId, argument: `${role.title} (${type}): ${txt}` })
      });
      const data = await res.json();
      const reply = data.transcript?.content || data.ai_response || 'Qabul qilindi.';
      addMsg(reply, 'judge', simType.id === 'court' ? 'Sudya' : 'AI', 'ruling');
      // Check if AI response is critical -> increase stress
      if (reply.toLowerCase().includes('xato') || reply.toLowerCase().includes('e\'tiroz')) {
        setStressLevel(s => Math.min(100, s + 15));
      }
      if (autoSpeak) speak(reply);
    } catch {
      addMsg('Xatolik yuz berdi. Qaytadan urinib ko\'ring.', 'judge', 'AI', 'ruling');
    } finally { setLoading(false); }
  }, [input, loading, role, simId, simType, autoSpeak, speak]);

  // ── End ──
  const endSession = async () => {
    setLoading(true);
    const total = Math.round((score.etiquette + score.argument + score.evidence) / 3);
    const xpGain = Math.round(total * 1.5 + Math.max(0, 100 - stressLevel) * 0.5);
    const newXp = totalXp + xpGain;
    setTotalXp(newXp);
    try { localStorage.setItem('virtual_court_xp', String(newXp)); } catch {}

    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_verdict', simulationId: simId })
      });
      const data = await res.json();
      const verdict = data.verdict || 'Simulyatsiya yakunlandi.';
      addMsg(verdict, 'judge', simType.id === 'court' ? 'Sudya' : 'AI', 'ruling');
      if (autoSpeak) speak(verdict);
    } catch { /* ignore */ } finally { setLoading(false); }

    let achievements: string[] = [];
    if (total >= 80) achievements = ['Yuridik aniqlik', 'Professional', 'Mukammal nutq'];
    else if (total >= 60) achievements = ['Yaxshi urinish', 'Bilimli'];
    else if (total >= 40) achievements = ['Qatnashchi'];
    else achievements = ['Yangi boshlovchi'];
    if (stressLevel < 30) achievements.push('Sovuq qonli');
    if (score.evidence >= 70) achievements.push('Dalil ustasi');
    if (score.argument >= 70) achievements.push('Argument ustasi');
    if (xpGain >= 100) achievements.push('XP rekordi');

    setResults({
      legalAccuracy: Math.min(100, total + 5),
      ethics: Math.min(100, Math.round((score.etiquette + (100 - stressLevel)) / 2)),
      confidence: Math.min(100, Math.round(total * 0.8 + 20)),
      etiquette: score.etiquette,
      argument: score.argument,
      evidence: score.evidence,
      totalScore: total,
      xpEarned: xpGain,
      achievements: [...new Set(achievements)],
    });
    setTimeout(() => setPage('verdict'), 1500);
  };

  const total = Math.round((score.etiquette + score.argument + score.evidence) / 3);

  // ════════════════════════════════════════════════════════
  // SELECTION SCREEN
  // ════════════════════════════════════════════════════════
  if (page === 'select') return (
    <div className="mobile-safe-top" style={{ minHeight: '100vh', background: '#F8FAFF' }}>
      <div className="flex-col md:flex-row" style={{ display: 'flex' }}>
        <aside className="hidden lg:block" style={{ width: 240, background: '#fff', borderRight: '1px solid #F1F5F9', minHeight: '100vh', padding: '24px 16px', flexShrink: 0 }}>
          <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', textDecoration: 'none', fontSize: 14, marginBottom: 24 }}>
            <ArrowLeft size={16} /> Orqaga
          </a>
          <div style={{ background: '#EDE9FE', borderRadius: 12, padding: 14, border: '1px solid #DDD6FE' }}>
            <p style={{ fontWeight: 700, color: '#6D28D9', fontSize: 14, margin: '0 0 4px' }}>Virtual Sud</p>
            <p style={{ fontSize: 12, color: '#7C3AED', margin: 0 }}>AI bilan ovozli simulyatsiya</p>
          </div>
          <div style={{ marginTop: 16, padding: '14px 12px', background: '#FFFBEB', borderRadius: 12, border: '1px solid #FDE68A', textAlign: 'center' }}>
            {/* Display total XP */}
            <p style={{ fontSize: 10, color: '#92400E', margin: '0 0 4px' }}>Umumiy XP</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B', margin: 0 }}>{totalXp}</p>
          </div>
          {speechReady && (
            <div style={{ marginTop: 16, background: '#F0FDF4', borderRadius: 12, padding: 12, border: '1px solid #BBF7D0' }}>
              <p style={{ fontSize: 12, color: '#15803D', fontWeight: 600, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 4 }}><Volume2 size={14} /> Ovoz</p>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: '#374151', cursor: 'pointer' }}>
                <input type="checkbox" checked={autoSpeak} onChange={e => setAutoSpeak(e.target.checked)} />
                AI ovozini eshit
              </label>
              <p style={{ fontSize: 11, color: '#16A34A', marginTop: 8 }}>Mikrofon orqali gapirishingiz mumkin (Chrome/Edge).</p>
            </div>
          )}
          <div style={{ marginTop: 16, background: '#FEF2F2', borderRadius: 12, padding: 12, border: '1px solid #FECACA' }}>
            <p style={{ fontSize: 12, color: '#991B1B', fontWeight: 600, margin: '0 0 4px' }}>XP tizimi</p>
            <p style={{ fontSize: 11, color: '#B91C1C', margin: 0 }}>Har bir simulyatsiya uchun XP olasiz. Yutuqlar to'plang!</p>
          </div>
        </aside>

        <div className="p-6 md:p-10" style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>Virtual Sud Simulyatori</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 32px' }}>Simulyatsiya turi, roli va ishni tanlang — AI bilan interaktiv huquqiy amaliyot</p>

          <style>{`@media(min-width:768px){.vc-grid-types{grid-template-columns:repeat(3,1fr)!important}.vc-grid-roles{grid-template-columns:repeat(3,1fr)!important}.vc-grid-cases{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:639px){.vc-grid-types{grid-template-columns:1fr!important}.vc-grid-roles{grid-template-columns:1fr!important}.vc-grid-cases{grid-template-columns:1fr!important}}`}</style>

          {/* 1. Sim type */}
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>1. Simulyatsiya turini tanlang</h2>
          <div className="vc-grid-types" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 28 }}>
            {SIM_TYPES.map(st => {
              const isActive = simType.id === st.id;
              const icons: Record<string, JSX.Element> = {
                court: <Gavel size={20} />, negotiation: <MessageCircle size={20} />, investigation: <Search size={20} />,
              };
              return (
                <button key={st.id} onClick={() => { setSimType(st); setRole(st.roles[0]); setCase(st.cases[0]); }}
                  style={{ padding: 18, borderRadius: 14, border: `2px solid ${isActive ? st.color : '#E5E7EB'}`, background: isActive ? st.bg : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 40, height: 40, background: st.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: st.color, marginBottom: 8 }}>
                    {icons[st.id]}
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '0 0 2px' }}>{st.title}</p>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{st.desc}</p>
                </button>
              );
            })}
          </div>

          {/* 2. Role */}
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>2. Rolingizni tanlang</h2>
          <div className="vc-grid-roles" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 28 }}>
            {simType.roles.map(r => {
              const isActive = role.id === r.id;
              const roleIcons: Record<string, JSX.Element> = {
                advokat: <Scale size={20} />, prokuror: <Gavel size={20} />, sudya: <Users size={20} />,
                consultant: <Scale size={20} />, mediator: <Users size={20} />,
                detective: <Search size={20} />, investigator: <Scale size={20} />,
              };
              return (
                <button key={r.id} onClick={() => setRole(r)}
                  style={{ padding: 14, borderRadius: 14, border: `2px solid ${isActive ? simType.color : '#E5E7EB'}`, background: isActive ? simType.bg : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: 36, height: 36, background: simType.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: simType.color, marginBottom: 6 }}>
                    {roleIcons[r.id] || <Users size={18} />}
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: '0 0 2px' }}>{r.title}</p>
                  <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{r.sub}</p>
                </button>
              );
            })}
          </div>

          {/* 3. Case */}
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>3. Ishni tanlang</h2>
          <div className="vc-grid-cases" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 32 }}>
            {simType.cases.map(c => (
              <button key={c.id} onClick={() => setCase(c)}
                style={{ padding: 16, borderRadius: 14, border: `2px solid ${caseItem.id === c.id ? '#2563EB' : '#E5E7EB'}`, background: caseItem.id === c.id ? '#EFF6FF' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0 }}>{c.title}</p>
                  <span style={{ fontSize: 10, background: simType.bg, color: simType.color, padding: '2px 8px', borderRadius: 20 }}>{c.level}</span>
                </div>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 8px' }}>{c.desc}</p>
                <span style={{ fontSize: 11, background: '#DBEAFE', color: '#1D4ED8', padding: '2px 8px', borderRadius: 20 }}>{c.law}</span>
              </button>
            ))}
          </div>

          {/* Features section from simulator */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #E5E7EB', marginBottom: 32 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#374151', margin: '0 0 16px' }}>Xususiyatlar</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
              {[
                { icon: <Users size={16} color="#2563EB" />, title: 'AI Personajlar', desc: 'Real AI javoblar' },
                { icon: <Clock size={16} color="#059669" />, title: "Vaqt chegarasi", desc: '5-10 daqiqa' },
                { icon: <AlertTriangle size={16} color="#D97706" />, title: 'Stress metr', desc: "Hissiy intellekt" },
                { icon: <Award size={16} color="#7C3AED" />, title: 'XP va yutuqlar', desc: 'Har bir session uchun' },
                { icon: <Volume2 size={16} color="#0891B2" />, title: 'Ovozli kiritish', desc: "uz-UZ tilida" },
                { icon: <Star size={16} color="#DC2626" />, title: 'Baholash', desc: '3 mezonda' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#F9FAFB', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ width: 32, height: 32, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>{f.icon}</div>
                  <div><p style={{ fontWeight: 600, fontSize: 12, color: '#111827', margin: 0 }}>{f.title}</p><p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{f.desc}</p></div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={startSession}
            style={{ padding: '13px 36px', background: simType.color, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, minHeight: 48 }}>
            <Play size={18} /> Simulyatsiyani boshlash
          </button>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════
  // SESSION SCREEN
  // ════════════════════════════════════════════════════════
  if (page === 'session') return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => setPage('select')} style={{ padding: 8, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{simType.title}: {caseItem.title}</p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{role.title} · {role.sub}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {speechReady && (
            <>
              <button onClick={() => setAutoSpeak(p => !p)}
                style={{ padding: '5px 12px', background: autoSpeak ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${autoSpeak ? '#22C55E' : 'rgba(255,255,255,0.15)'}`, borderRadius: 20, color: autoSpeak ? '#4ADE80' : '#94A3B8', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {autoSpeak ? <><Volume2 size={12} /> Ovoz</> : <><VolumeX size={12} /> Ovozsiz</>}
              </button>
              {speaking && (
                <button onClick={stopSpeak} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.2)', border: '1px solid #EF4444', borderRadius: 20, color: '#F87171', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Square size={12} /> To'xtat
                </button>
              )}
            </>
          )}
          {/* Stress Meter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: stressLevel > 60 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)' }}>
            <AlertTriangle size={12} color={stressLevel > 60 ? '#F87171' : '#FBBF24'} />
            <span style={{ fontSize: 12, color: stressLevel > 60 ? '#F87171' : '#FBBF24' }}>Stress: {stressLevel}%</span>
          </div>
          {/* Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: time < 60 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)' }}>
            <Clock size={14} color={time < 60 ? '#F87171' : '#94A3B8'} />
            <span style={{ fontWeight: 700, fontSize: 14, color: time < 60 ? '#F87171' : '#fff' }}>{fmt(time)}</span>
          </div>
          <button onClick={endSession} style={{ padding: '7px 16px', background: 'rgba(239,68,68,0.7)', border: '1px solid #EF4444', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Tugatish
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'row' }}>
        {/* Score panel */}
        <aside className="hidden md:block" style={{ width: 200, background: 'rgba(0,0,0,0.4)', borderRight: '1px solid rgba(255,255,255,0.07)', padding: 18, flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Baholash</p>
          {[
            { l: 'Sud etikasi', v: score.etiquette, c: '#22C55E' },
            { l: 'Argument', v: score.argument, c: '#3B82F6' },
            { l: 'Dalillar', v: score.evidence, c: '#A855F7' },
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
          {/* Stress bar */}
          <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 12px' }}>Stress</p>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#CBD5E1' }}>Daraja</span>
              <span style={{ fontWeight: 700, color: stressLevel > 60 ? '#EF4444' : '#FBBF24' }}>{stressLevel}%</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
              <div style={{ height: 5, width: `${stressLevel}%`, background: stressLevel > 60 ? '#EF4444' : '#FBBF24', borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
          </div>
          {/* Total */}
          <div style={{ marginTop: 16, padding: 14, background: 'rgba(124,58,237,0.15)', borderRadius: 12, border: '1px solid rgba(124,58,237,0.3)', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#A78BFA', margin: '0 0 4px' }}>Umumiy</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0 }}>{total}</p>
          </div>
        </aside>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {msgs.map(m => {
                const isUser = m.role === 'user';
                const bg: Record<string, string> = { ruling: 'rgba(124,58,237,0.12)', objection: 'rgba(239,68,68,0.12)', evidence: 'rgba(168,85,247,0.12)', question: 'rgba(59,130,246,0.12)', statement: 'rgba(255,255,255,0.05)' };
                const bd: Record<string, string> = { ruling: 'rgba(124,58,237,0.35)', objection: 'rgba(239,68,68,0.35)', evidence: 'rgba(168,85,247,0.35)', question: 'rgba(59,130,246,0.35)', statement: 'rgba(255,255,255,0.1)' };
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '78%', padding: '11px 15px', borderRadius: isUser ? '14px 14px 3px 14px' : '3px 14px 14px 14px', background: isUser ? 'rgba(37,99,235,0.4)' : (bg[m.type] || bg.statement), border: `1px solid ${isUser ? 'rgba(37,99,235,0.5)' : (bd[m.type] || bd.statement)}` }}>
                      <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 4px', fontWeight: 600 }}>{m.speaker}</p>
                      <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{m.text}</p>
                      {!isUser && speechReady && (
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

          {/* Input */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', padding: '14px 24px' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {[
                  { icon: <AlertTriangle size={12} />, label: "E'tiroz", txt: "E'tiroz bildiraman! Bu dalil qonunga zid.", type: 'objection' as const },
                  { icon: <FileText size={12} />, label: 'Dalil', txt: 'Hujjatli dalil taqdim etaman.', type: 'evidence' as const },
                  { icon: <MessageCircle size={12} />, label: 'Savol', txt: 'Aniq savol: voqeani tushuntirib bering.', type: 'question' as const },
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
        @keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );

  // ════════════════════════════════════════════════════════
  // VERDICT SCREEN — merged Virtual Court + Simulator styles
  // ════════════════════════════════════════════════════════
  if (!results) return null;
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 22, boxShadow: '0 8px 40px rgba(0,0,0,0.1)', maxWidth: 560, width: '100%', overflow: 'hidden' }}>
        <div style={{ background: `linear-gradient(135deg,${simType.color},#7C3AED)`, padding: '32px 28px', textAlign: 'center' }}>
          <Award size={48} color="#fff" />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '12px 0 4px' }}>Simulyatsiya Yakunlandi</h1>
          <p style={{ fontSize: 13, color: '#BFDBFE', margin: 0 }}>{role.title} · {caseItem.title}</p>
        </div>
        <div style={{ padding: 28 }}>
          {/* Score grid — 3 columns from Virtual Court + 3 from Simulator */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { l: 'Sud etikasi', v: results.etiquette, c: '#22C55E' },
              { l: 'Argument', v: results.argument, c: '#3B82F6' },
              { l: 'Dalillar', v: results.evidence, c: '#A855F7' },
            ].map(b => (
              <div key={b.l} style={{ background: '#F8FAFF', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #E5E7EB' }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: b.c, margin: '0 0 2px' }}>{b.v}%</p>
                <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{b.l}</p>
              </div>
            ))}
          </div>
          {/* Simulator-style score grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { l: 'Yuridik aniqlik', v: results.legalAccuracy, c: '#2563EB' },
              { l: 'Etika', v: results.ethics, c: '#059669' },
              { l: 'Ishonch', v: results.confidence, c: '#7C3AED' },
            ].map(b => (
              <div key={b.l} style={{ background: '#F9FAFB', borderRadius: 12, padding: 12, textAlign: 'center', border: '1px solid #E5E7EB' }}>
                <TrendingUp size={16} color={b.c} style={{ margin: '0 auto 4px' }} />
                <p style={{ fontSize: 18, fontWeight: 800, color: b.c, margin: 0 }}>{Math.round(b.v)}%</p>
                <p style={{ fontSize: 10, color: '#6B7280', margin: 0 }}>{b.l}</p>
              </div>
            ))}
          </div>
          {/* Total score + XP */}
          <div style={{ background: 'linear-gradient(135deg,#EFF6FF,#F5F3FF)', borderRadius: 14, padding: 18, textAlign: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px' }}>Umumiy ball</p>
            <p style={{ fontSize: 42, fontWeight: 900, color: simType.color, margin: '0 0 8px' }}>{results.totalScore}/100</p>
            <div style={{ background: '#E5E7EB', borderRadius: 4, height: 7 }}>
              <div style={{ height: 7, width: `${results.totalScore}%`, background: `linear-gradient(90deg,${simType.color},#7C3AED)`, borderRadius: 4 }} />
            </div>
            <p style={{ fontSize: 13, color: '#374151', margin: '8px 0 0', fontWeight: 600 }}>
              {results.totalScore >= 80 ? <><Star className="w-4 h-4 text-yellow-500 fill-yellow-500 inline mr-1" />A'lo! Professional darajasi.</> : results.totalScore >= 60 ? <><CheckCircle className="w-4 h-4 text-green-500 inline mr-1" />Yaxshi. Davom eting.</> : <><Target className="w-4 h-4 text-blue-500 inline mr-1" />Mashq qiling.</>}
            </p>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 16 }}>
              <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '6px 16px' }}>
                <span style={{ fontSize: 11, color: '#92400E' }}>XP qo'shildi: </span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>+{results.xpEarned}</span>
              </div>
              <div style={{ background: '#EDE9FE', borderRadius: 10, padding: '6px 16px' }}>
                <span style={{ fontSize: 11, color: '#6D28D9' }}>Jami XP: </span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#7C3AED' }}>{totalXp}</span>
              </div>
            </div>
          </div>
          {/* Achievements */}
          {results.achievements.length > 0 && (
            <div style={{ background: '#FFFBEB', borderRadius: 12, padding: 14, marginBottom: 20, border: '1px solid #FDE68A' }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#92400E', margin: '0 0 8px' }}>⭐ Yutuqlar</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {results.achievements.map((a, i) => (
                  <span key={i} style={{ padding: '4px 12px', background: '#FDE68A', color: '#92400E', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{a}</span>
                ))}
              </div>
            </div>
          )}
          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setPage('select'); setMsgs([]); setResults(null); }}
              style={{ flex: 1, padding: 12, background: simType.color, color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 48 }}>
              Yangi simulyatsiya
            </button>
            <a href="/dashboard" style={{ flex: 1, padding: 12, background: '#F3F4F6', color: '#374151', borderRadius: 11, fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 48 }}>
              Bosh sahifa
            </a>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:639px){.vc-grid-types,.vc-grid-roles,.vc-grid-cases{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
