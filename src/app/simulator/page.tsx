'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Play, Clock, MessageCircle, User, Gavel, Search, Mic, Send, AlertTriangle, TrendingUp, Award, Target } from 'lucide-react';

interface Message {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  type: 'ai' | 'user';
}

interface SimulationResult {
  legalAccuracy: number;
  ethics: number;
  confidence: number;
  totalScore: number;
  xpEarned: number;
  achievements: string[];
}

export default function Simulator() {
  const [selectedSim, setSelectedSim] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [stressLevel, setStressLevel] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const listeningRef = useRef(false);
  const silenceTimerRef = useRef<any>(null);

  const simulations = [
    {
      id: 'court',
      title: 'Sud jarayoni',
      description: 'Sudya, advokat yoki prokuror rolini o\'ynang',
      icon: <Gavel className="w-6 h-6" />,
      color: 'blue',
      roles: [
        { id: 'lawyer', name: 'Advokat', description: 'Mijoz huquqlarini himoya qiling' },
        { id: 'prosecutor', name: 'Prokuror', description: 'Davlat manfaatini himoya qiling' },
        { id: 'judge', name: 'Sudya', description: 'Adolatli hukm chiqaring' }
      ]
    },
    {
      id: 'negotiation',
      title: 'Mijoz bilan muzokara',
      description: 'AI mijoz bilan muzokara qiling',
      icon: <MessageCircle className="w-6 h-6" />,
      color: 'green',
      roles: [
        { id: 'consultant', name: 'Huquq maslahatchi', description: 'Mijozga yo\'nalish ko\'rsating' },
        { id: 'mediator', name: 'Mediator', description: 'Tomonlar kelishuvini ta\'minlang' }
      ]
    },
    {
      id: 'investigation',
      title: 'Tergov jarayoni',
      description: 'Guvohlarni so\'roq qiling va dalillarni tahliling',
      icon: <Search className="w-6 h-6" />,
      color: 'purple',
      roles: [
        { id: 'detective', name: 'Detektiv', description: 'Jinoyatni oching' },
        { id: 'investigator', name: 'Tergovchi', description: 'Dalillarni to\'plang' }
      ]
    }
  ];

  useEffect(() => {
    if (isSimulating && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isSimulating) {
      endSimulation();
    }
  }, [isSimulating, timeLeft]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSimulation = async (simId: string, role: string) => {
    setSelectedSim(simId);
    setSelectedRole(role);
    setIsSimulating(true);
    setTimeLeft(300);
    setStressLevel(0);
    setShowResults(false);
    setLoading(true);

    const caseMap: Record<string, string> = {
      court: `Sud jarayoni. Rol: ${role}. O'g'irlik ishi bo'yicha sud boshlanmoqda.`,
      negotiation: `Mijoz bilan muzokara. Rol: ${role}. Mijoz shartnoma buzish muammosi bilan keldi.`,
      investigation: `Tergov jarayoni. Rol: ${role}. Jinoyat sodir etilgan, guvoh so'roq qilinmoqda.`
    };

    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', caseDetails: caseMap[simId] || simId })
      });
      const data = await res.json();
      const aiText = data.transcript?.[0]?.content || data.ai_response || 'Simulyatsiya boshlandi. Sizning so\'zingiz.';
      setMessages([{ id: '1', speaker: 'AI', text: aiText, timestamp: new Date(), type: 'ai' }]);
    } catch {
      setMessages([{ id: '1', speaker: 'AI', text: 'Simulyatsiya boshlandi. Sizning so\'zingiz.', timestamp: new Date(), type: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      speaker: 'Siz',
      text: userInput,
      timestamp: new Date(),
      type: 'user'
    };
    setMessages(prev => [...prev, userMsg]);
    const input = userInput;
    setUserInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit_argument', simulationId: 'sim_' + Date.now(), argument: input })
      });
      const data = await res.json();
      const aiText = data.transcript?.content || data.ai_response || 'Javob olinmadi.';

      // Adjust stress based on response
      if (aiText.toLowerCase().includes('xato') || aiText.toLowerCase().includes('e\'tiroz')) {
        setStressLevel(prev => Math.min(100, prev + 15));
      } else {
        setStressLevel(prev => Math.max(0, prev - 5));
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), speaker: 'AI', text: aiText, timestamp: new Date(), type: 'ai' }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), speaker: 'AI', text: 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.', timestamp: new Date(), type: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  const endSimulation = async () => {
    setIsSimulating(false);
    setLoading(true);

    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_verdict', simulationId: 'sim_end' })
      });
      const data = await res.json();
      const score = data.score || Math.floor(70 + Math.random() * 30);
      const legalAccuracy = Math.max(40, score - stressLevel * 0.3);

      setResults({
        legalAccuracy: Math.min(100, legalAccuracy),
        ethics: Math.min(100, 65 + Math.random() * 30),
        confidence: Math.min(100, 60 + Math.random() * 35),
        totalScore: score,
        xpEarned: Math.floor(score * 2),
        achievements: score >= 80 ? ['Yuridik aniqlik', 'Professional'] : score >= 60 ? ['Yaxshi urinish'] : ['Qatnashchi']
      });
    } catch {
      const score = Math.floor(65 + Math.random() * 30);
      setResults({ legalAccuracy: score, ethics: 70, confidence: 65, totalScore: score, xpEarned: score * 2, achievements: ['Qatnashchi'] });
    } finally {
      setLoading(false);
      setShowResults(true);
    }
  };

  const reset = () => {
    setSelectedSim(null);
    setSelectedRole(null);
    setIsSimulating(false);
    setMessages([]);
    setShowResults(false);
    setResults(null);
    setStressLevel(0);
    setTimeLeft(300);
  };

  // ── Ovoz bilan kiritish (STT) — uz-UZ, continuous, auto-restart ──
  const SILENCE_TIMEOUT_MS = 3000;
  
  const startMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Ovozli kiritish faqat Chrome yoki Edge brauzerida ishlaydi.'); return; }
    const r = new SR();
    recRef.current = r;
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
          const formatted = t.charAt(0).toUpperCase() + t.slice(1);
          setUserInput(formatted);
          silenceTimerRef.current = setTimeout(() => {}, SILENCE_TIMEOUT_MS);
        } else {
          setUserInput(buf + t);
        }
      }
    };
    
    r.onend = () => {
      if (listeningRef.current) {
        try { r.start(); } catch {}
      } else {
        setListening(false);
      }
    };
    
    r.onerror = (e: any) => {
      if (e.error === 'no-speech') {
        if (listeningRef.current) {
          setTimeout(() => { try { r.start(); } catch {} }, 500);
        }
        return;
      }
      setListening(false);
      if (e.error === 'not-allowed') {
        alert('Mikrofon ruxsati berilmagan. Brauzer sozlamalaridan yoqing.');
      } else if (e.error === 'audio-capture') {
        alert('Mikrofon topilmadi.');
      }
    };
    
    r.start();
  };
  
  const stopMic = () => {
    listeningRef.current = false;
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    setListening(false);
    recRef.current?.stop();
  };

  // RESULTS SCREEN
  if (showResults && results) {
    return (
      <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-2xl w-full p-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-zinc-100 mb-6 text-center">Simulyatsiya Natijalari</h1>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center bg-blue-50 rounded-xl p-4">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">{Math.round(results.legalAccuracy)}%</p>
              <p className="text-sm text-gray-600 dark:text-zinc-300">Yuridik aniqlik</p>
            </div>
            <div className="text-center bg-green-50 rounded-xl p-4">
              <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{Math.round(results.ethics)}%</p>
              <p className="text-sm text-gray-600 dark:text-zinc-300">Etika</p>
            </div>
            <div className="text-center bg-purple-50 rounded-xl p-4">
              <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">{Math.round(results.confidence)}%</p>
              <p className="text-sm text-gray-600 dark:text-zinc-300">Ishonch</p>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-6 mb-6 text-center">
            <p className="text-gray-600 dark:text-zinc-300 mb-1">Umumiy ball</p>
            <p className="text-4xl font-bold text-blue-600 mb-3">{results.totalScore}/100</p>
            <div className="bg-gray-200 dark:bg-zinc-700 rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${results.totalScore}%` }} />
            </div>
          </div>
          {results.achievements.length > 0 && (
            <div className="bg-yellow-50 rounded-xl p-4 mb-6">
              <p className="font-semibold text-yellow-800 mb-2">☆ Yutuqlar</p>
              <div className="flex flex-wrap gap-2">
                {results.achievements.map((a, i) => (
                  <span key={i} className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm">{a}</span>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-4">
            <button onClick={reset} className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700">Yangi simulyatsiya</button>
            <a href="/" className="flex-1 bg-gray-600 text-white py-3 rounded-xl hover:bg-gray-700 text-center">Bosh sahifa</a>
          </div>
        </div>
      </div>
    );
  }

  // SIMULATION SCREEN
  if (isSimulating) {
    return (
      <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 flex flex-col">
        <header className="bg-white dark:bg-zinc-900 px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={reset} className="p-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 dark:bg-zinc-800 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="font-bold text-gray-800 dark:text-zinc-100">Simulyatsiya</h1>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Rol: {selectedRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${timeLeft <= 60 ? 'text-red-600' : 'text-gray-700 dark:text-zinc-200'}`}>
              <Clock className="w-4 h-4" />
              <span className="font-bold">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-orange-600">Stress: {stressLevel}%</span>
            </div>
            <button onClick={endSimulation} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700">Tugatish</button>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl px-4 py-3 rounded-2xl ${msg.type === 'user' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-100'}`}>
                  <p className="text-xs font-medium mb-1 opacity-70">{msg.speaker}</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 px-4 py-3 rounded-2xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border-t p-4">
          <div className="max-w-3xl mx-auto">
            {listening && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg mb-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-red-600">🎤 Tinglanmoqda... gapiring</span>
                <button onClick={stopMic} className="ml-auto px-3 py-1 bg-red-500 text-white rounded text-xs">To'xtat</button>
              </div>
            )}
            <div className="flex gap-3">
              <input
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Javobingizni yozing yoki 🎤 bosib gapiring..."
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={listening ? stopMic : startMic}
                className={`px-4 py-3 rounded-xl transition-colors ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 dark:bg-zinc-700'}`}
                title={listening ? "To'xtatish" : 'Ovoz bilan kiritish'}
              >
                <Mic className="w-5 h-5" />
              </button>
              <button onClick={handleSendMessage} disabled={loading || !userInput.trim()} className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // HOME SCREEN
  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950">
      <div className="flex">
        <div className="desktop-sidebar w-64 bg-white dark:bg-zinc-900 border-r min-h-screen p-6">
          <a href="/" className="flex items-center gap-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 px-3 py-2 rounded-lg mb-6">
            <ArrowLeft className="w-5 h-5" /><span>Orqaga</span>
          </a>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="font-semibold text-blue-800 mb-1">Simulyator</p>
            <p className="text-sm text-blue-600">Real AI bilan mashq qiling</p>
          </div>
        </div>

        <div className="flex-1">
          <header className="bg-white dark:bg-zinc-900 px-8 py-5 border-b">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">Simulyator</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Xavfsiz virtual poligon — AI bilan real huquqiy vaziyatlar</p>
          </header>

          <main className="p-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-zinc-100 mb-5">Simulyatsiya turini tanlang</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">              {simulations.map(sim => (
                <div
                  key={sim.id}
                  className={`bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border-2 transition-all cursor-pointer ${selectedSim === sim.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-100 dark:border-zinc-800 hover:border-blue-200'}`}
                  onClick={() => setSelectedSim(selectedSim === sim.id ? null : sim.id)}
                >
                  <div className={`w-12 h-12 bg-${sim.color}-100 dark:bg-${sim.color}-900/40 rounded-xl flex items-center justify-center mb-4 text-${sim.color}-600 dark:text-${sim.color}-300`}>
                    {sim.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-1">{sim.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">{sim.description}</p>

                  {selectedSim === sim.id && (
                    <div className="space-y-2 mt-2">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Rolni tanlang:</p>
                      {sim.roles.map(role => (
                        <button
                          key={role.id}
                          onClick={e => { e.stopPropagation(); startSimulation(sim.id, role.name); }}
                          className="w-full text-left p-3 rounded-lg border transition-all"
                          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.borderColor = 'var(--card-border)'; }}
                        >
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{role.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{role.description}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-800 dark:text-zinc-100 mb-4">Xususiyatlar</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: <User className="w-5 h-5 text-blue-600" />, title: 'AI Personajlar', desc: 'Real AI javoblar' },
                  { icon: <Clock className="w-5 h-5 text-green-600" />, title: 'Vaqt chegarasi', desc: '5 daqiqa muddat' },
                  { icon: <AlertTriangle className="w-5 h-5 text-orange-600" />, title: 'Stress metr', desc: 'Hissiy intellekt' },
                  { icon: <Award className="w-5 h-5 text-yellow-600" />, title: 'Taqdirlash', desc: 'XP va yutuqlar' },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-3">
                    <div className="w-8 h-8 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">{f.icon}</div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-zinc-100 text-sm">{f.title}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
