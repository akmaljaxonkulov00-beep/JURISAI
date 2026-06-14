'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { api } from '@/services/api';
import { tts, stt, isSpeechSupported } from '@/lib/speech';

interface CaseScenario {
  id: string;
  title: string;
  case_type: string;
  description: string;
  difficulty_level: string;
  estimated_duration: number;
  key_issues: string[];
}

interface SimulationStatus {
  simulation_id: string;
  status: string;
  current_phase: string;
  elapsed_time: number;
  remaining_time?: number;
  participants: Record<string, any>;
  current_speaker?: string;
  last_action?: string;
}

interface EvidenceItem {
  id: string;
  type: string;
  title: string;
  description: string;
  credibility_score: number;
  relevance_score: number;
  authenticity_score: number;
  presented_by: string;
}

interface SimulationResult {
  simulation_id: string;
  outcome: string;
  verdict?: string;
  score: number;
  feedback: Record<string, any>;
  performance_metrics: Record<string, number>;
  recommendations: string[];
  learning_points: string[];
}

export default function CourtSimulator() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cases' | 'simulation' | 'history' | 'leaderboard'>('dashboard');
  const [selectedCase, setSelectedCase] = useState<CaseScenario | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus | null>(null);
  const [userRole, setUserRole] = useState('prosecution');
  const [difficultyLevel, setDifficultyLevel] = useState('beginner');
  const [simulationType, setSimulationType] = useState('full_trial');
  const [argumentContent, setArgumentContent] = useState('');
  const [argumentType, setArgumentType] = useState('opening');
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [simulationHistory, setSimulationHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Speech states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  useEffect(() => {
    loadUserStats();
    loadHistory();
    loadLeaderboard();
    
    // Check speech support
    if (isSpeechSupported()) {
      setSpeechEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (simulationStatus && simulationStatus.status === 'active') {
      const interval = setInterval(() => {
        loadSimulationStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [simulationStatus]);

  const loadUserStats = async () => {
    try {
      const stored = localStorage.getItem('court_sim_stats');
      if (stored) {
        setUserStats(JSON.parse(stored));
      } else {
        // Default stats
        const defaultStats = {
          total_simulations: 0,
          completed_simulations: 0,
          average_score: 0,
          highest_score: 0,
          success_rate: 0
        };
        setUserStats(defaultStats);
        localStorage.setItem('court_sim_stats', JSON.stringify(defaultStats));
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const stored = localStorage.getItem('court_sim_history');
      if (stored) {
        setSimulationHistory(JSON.parse(stored));
      } else {
        setSimulationHistory([]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      // Leaderboard - bu yerda hamma foydalanuvchilar statistikasi bo'lishi kerak
      // Hozircha faqat joriy foydalanuvchi statistikasini ko'rsatamiz
      setLeaderboard([]);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const loadSimulationStatus = async () => {
    if (!simulationStatus) return;
    
    try {
      // Update elapsed time
      const updatedStatus: SimulationStatus = {
        ...simulationStatus,
        elapsed_time: simulationStatus.elapsed_time + 5,
        remaining_time: Math.max(0, (simulationStatus.remaining_time || 1800) - 5)
      };
      setSimulationStatus(updatedStatus);
    } catch (error) {
      console.error('Error loading simulation status:', error);
    }
  };

  const startSimulation = async () => {
    if (!selectedCase || !userRole) return;
    
    setLoading(true);
    try {
      // Real API call to start simulation
      const response = await fetch('/api/court-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          caseDetails: `${selectedCase.title}: ${selectedCase.description}. Mening rolim: ${userRole}. Qiyinlik: ${difficultyLevel}. Tur: ${simulationType}.`
        })
      });

      if (!response.ok) {
        throw new Error('Simulyatsiya boshlanmadi');
      }

      const data = await response.json();
      
      const newStatus: SimulationStatus = {
        simulation_id: data.simulation_id,
        status: 'active',
        current_phase: data.current_phase,
        elapsed_time: 0,
        remaining_time: 1800,
        participants: {
          plaintiff: { name: 'Da\'vogar', role: 'Plaintiff' },
          defendant: { name: 'Javobgar', role: 'Defendant' },
          judge: { name: 'Sudya', role: 'Judge' }
        },
        current_speaker: userRole,
        last_action: 'Simulyatsiya boshlandi'
      };
      
      setSimulationStatus(newStatus);
      setEvidence(data.evidence || []);
      setTranscript(data.transcript || []);

      // Update stats
      if (userStats) {
        const updatedStats = {
          ...userStats,
          total_simulations: userStats.total_simulations + 1
        };
        setUserStats(updatedStats);
        localStorage.setItem('court_sim_stats', JSON.stringify(updatedStats));
      }
    } catch (error) {
      console.error('Error starting simulation:', error);
      alert('Simulyatsiya boshlanmadi. Iltimos, qaytadan urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  const loadEvidence = async (simulationId: string) => {
    // Evidence comes from API response, no need for separate load
    try {
      // Evidence is already loaded in startSimulation
      console.log('Evidence loaded:', evidence);
    } catch (error) {
      console.error('Error loading evidence:', error);
    }
  };

  const submitArgument = async () => {
    if (!argumentContent.trim() || !simulationStatus) return;
    
    setLoading(true);
    try {
      // Real API call to submit argument
      const response = await fetch('/api/court-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_argument',
          simulationId: simulationStatus.simulation_id,
          argument: `${argumentType}: ${argumentContent}`
        })
      });

      if (!response.ok) {
        throw new Error('Argument yuborilmadi');
      }

      const data = await response.json();
      
      // Add user's argument to transcript
      const userTranscript = {
        id: 'user_' + Date.now(),
        speaker: userRole,
        content: argumentContent,
        timestamp: new Date().toISOString(),
        evidence_references: selectedEvidence
      };

      // Add AI response to transcript
      const aiTranscript = {
        ...data.transcript,
        id: 'ai_' + Date.now()
      };
      
      setTranscript(prev => [...prev, userTranscript, aiTranscript]);
      
      // Auto-speak AI response if enabled
      if (autoSpeak && speechEnabled && data.transcript.content) {
        speakText(data.transcript.content);
      }
      
      setArgumentContent('');
      setSelectedEvidence([]);
    } catch (error) {
      console.error('Error submitting argument:', error);
      alert('Argument yuborishda xatolik. Qaytadan urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  // Speech functions - TO'LIQ MUKAMMAL VERSIYA
  const speakText = (text: string) => {
    if (!speechEnabled) {
      console.log('⚠️ Speech not enabled');
      return;
    }
    
    console.log('🔊 Speaking text:', text.substring(0, 50) + '...');
    setIsSpeaking(true);
    
    tts.speak(text, {
      lang: 'ru-RU',
      rate: 0.9, // Slightly slower for better comprehension
      pitch: 1.0,
      volume: 1.0,
      onStart: () => {
        console.log('✅ Speech started');
        setIsSpeaking(true);
      },
      onEnd: () => {
        console.log('✅ Speech ended');
        setIsSpeaking(false);
      },
      onError: (error) => {
        console.error('❌ TTS error:', error);
        setIsSpeaking(false);
        alert('Ovozni aytishda xatolik yuz berdi. Qaytadan urinib ko\'ring.');
      }
    });
  };

  const startListening = () => {
    if (!speechEnabled) {
      alert('Ovozni tanib olish qurilmangizda qo\'llab-quvvatlanmaydi. Chrome yoki Edge browserdan foydalaning.');
      return;
    }
    
    console.log('🎤 Starting to listen...');
    setIsListening(true);
    setArgumentContent(''); // Clear previous content
    
    let fullTranscript = '';
    
    stt.startListening({
      continuous: true, // Keep listening
      onStart: () => {
        console.log('✅ Listening started');
        setIsListening(true);
      },
      onResult: (text, isFinal) => {
        console.log('📝 Recognized:', text, 'Final:', isFinal);
        
        if (isFinal) {
          // Add to full transcript
          fullTranscript += text + ' ';
          setArgumentContent(fullTranscript.trim());
        } else {
          // Show interim result
          setArgumentContent(fullTranscript + text);
        }
      },
      onError: (error) => {
        console.error('❌ STT error:', error);
        setIsListening(false);
        
        const errorMessages: Record<string, string> = {
          'not-allowed': 'Mikrofon ruxsati berilmagan. Brauzer sozlamalaridan mikrofonni yoqing.',
          'no-speech': 'Ovoz aniqlanmadi. Iltimos, qaytadan gapiring.',
          'audio-capture': 'Mikrofon topilmadi. Mikrofoningiz ulanganligini tekshiring.',
          'network': 'Internet ulanishi yo\'q. Internetni tekshiring.',
          'aborted': 'Ovozni tanib olish to\'xtatildi.'
        };
        
        const message = errorMessages[error.error] || error.message || `Ovozni tanib olishda xatolik: ${error.error}`;
        alert(message);
      },
      onEnd: () => {
        console.log('🔴 Listening ended');
        setIsListening(false);
      }
    });
  };

  const stopListening = () => {
    console.log('⏹️ Stopping listening...');
    stt.stopListening();
    setIsListening(false);
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      console.log('⏹️ Stopping speech...');
      tts.stop();
      setIsSpeaking(false);
    }
  };

  const pauseSimulation = async () => {
    if (!simulationStatus) return;

    try {
      const pausedStatus = { ...simulationStatus, status: 'paused' as const };
      setSimulationStatus(pausedStatus);
    } catch (error) {
      console.error('Error pausing simulation:', error);
    }
  };

  const resumeSimulation = async () => {
    if (!simulationStatus) return;

    try {
      const resumedStatus = { ...simulationStatus, status: 'active' as const };
      setSimulationStatus(resumedStatus);
    } catch (error) {
      console.error('Error resuming simulation:', error);
    }
  };

  const endSimulation = async () => {
    if (!simulationStatus) return;

    setLoading(true);
    try {
      // Real API call to get verdict
      const response = await fetch('/api/court-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_verdict',
          simulationId: simulationStatus.simulation_id
        })
      });

      if (!response.ok) {
        throw new Error('Hukm olinmadi');
      }

      const data = await response.json();
      
      // Save to history
      const historyItem = {
        id: simulationStatus.simulation_id,
        case_title: selectedCase?.title || 'Noma\'lum ish',
        user_role: userRole,
        difficulty_level: difficultyLevel,
        simulation_type: simulationType,
        score: data.score,
        outcome: data.outcome,
        verdict: data.verdict,
        feedback: data.feedback,
        created_at: new Date().toISOString()
      };

      const history = [...simulationHistory, historyItem];
      setSimulationHistory(history);
      localStorage.setItem('court_sim_history', JSON.stringify(history));

      // Update stats
      if (userStats) {
        const updatedStats = {
          total_simulations: userStats.total_simulations,
          completed_simulations: userStats.completed_simulations + 1,
          average_score: ((userStats.average_score * userStats.completed_simulations) + data.score) / (userStats.completed_simulations + 1),
          highest_score: Math.max(userStats.highest_score, data.score),
          success_rate: ((userStats.completed_simulations) / userStats.total_simulations) * 100
        };
        setUserStats(updatedStats);
        localStorage.setItem('court_sim_stats', JSON.stringify(updatedStats));
      }
      
      alert(`Simulyatsiya yakunlandi!\n\nBall: ${data.score}\nNatija: ${data.outcome}\n\nHukm:\n${data.verdict.substring(0, 200)}...`);
      
      setSimulationStatus(null);
      setTranscript([]);
      setEvidence([]);
      setSelectedCase(null);
    } catch (error) {
      console.error('Error ending simulation:', error);
      alert('Simulyatsiyani yakunlashda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  const renderDashboardTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-900 mb-2">
              {userStats?.total_simulations || 0}
            </div>
            <div className="text-sm text-gray-600">Jami simulyatsiyalar</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-900 mb-2">
              {userStats?.completed_simulations || 0}
            </div>
            <div className="text-sm text-gray-600">Tugallangan</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-purple-900 mb-2">
              {userStats?.average_score || 0}
            </div>
            <div className="text-sm text-gray-600">O'rtacha ball</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-orange-900 mb-2">
              {userStats?.highest_score || 0}
            </div>
            <div className="text-sm text-gray-600">Eng yuqori ball</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-blue-900">Tezkor harakatlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => setActiveTab('cases')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              🏛️ Yangi simulyatsiya boshlash
            </Button>
            <Button
              onClick={() => setActiveTab('history')}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              📊 Tarixni ko'rish
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-blue-900">So'nggi faoliyat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {simulationHistory.slice(0, 5).map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{item.case_title}</div>
                  <div className="text-sm text-gray-600">{item.user_role} • {item.difficulty_level}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-blue-900">{item.score} ball</div>
                  <div className="text-sm text-gray-600">{item.outcome}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCasesTab = () => (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-blue-900">Mavjud holatlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                id: 'criminal_theft',
                title: 'O\'g\'irlik holati',
                case_type: 'criminal',
                description: 'Mulkni o\'g\'rilash holati bo\'yicha jinoyat ishi',
                difficulty_level: 'beginner',
                estimated_duration: 45,
                key_issues: ['dalil etishmasligi', 'shubhali guvoh', 'moddiy dalillar']
              },
              {
                id: 'civil_contract',
                title: 'Shartnoma buzilishi',
                case_type: 'civil',
                description: 'Tijorat shartnomasini buzish holati',
                difficulty_level: 'intermediate',
                estimated_duration: 60,
                key_issues: ['shartnoma shartlari', 'zarar miqdori', 'neustoyka']
              },
              {
                id: 'administrative_violation',
                title: 'Ma\'muriy huquqbuzarlik',
                case_type: 'administrative',
                description: 'Soliq to\'lamaslik holati',
                difficulty_level: 'advanced',
                estimated_duration: 90,
                key_issues: ['soliq qonuni', 'jarima miqdori', 'murojaat muddati']
              }
            ].map((caseItem) => (
              <div
                key={caseItem.id}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedCase?.id === caseItem.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
                onClick={() => setSelectedCase(caseItem)}
              >
                <h3 className="font-semibold text-blue-900 mb-2">{caseItem.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{caseItem.description}</p>
                <div className="flex gap-2 mb-3">
                  <Badge className="bg-green-100 text-green-800">
                    {caseItem.case_type}
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800">
                    {caseItem.difficulty_level}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  ⏱️ {caseItem.estimated_duration} daqiqa
                </div>
                <div className="text-xs text-gray-500">
                  <strong>Asosiy masalalar:</strong>
                  <ul className="mt-1">
                    {caseItem.key_issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCase && (
        <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-blue-900">Simulyatsiya sozlamalari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sizning rolingiz
                </label>
                <Select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  options={[
                    { value: 'prosecution', label: 'Ayblovchi' },
                    { value: 'defense', label: 'Himoyachi' },
                    { value: 'judge', label: 'Hakam' }
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qiyinlik darajasi
                </label>
                <Select
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(e.target.value)}
                  options={[
                    { value: 'beginner', label: 'Boshlang\'ich' },
                    { value: 'intermediate', label: 'O\'rta' },
                    { value: 'advanced', label: 'Murakkab' }
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Simulyatsiya turi
                </label>
                <Select
                  value={simulationType}
                  onChange={(e) => setSimulationType(e.target.value)}
                  options={[
                    { value: 'full_trial', label: 'To\'liq sud jarayoni' },
                    { value: 'hearing', label: 'Eshitish' },
                    { value: 'argument_practice', label: 'Argument mashqi' }
                  ]}
                />
              </div>
            </div>
            
            <Button
              onClick={startSimulation}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Boshlanmoqda...' : '🏛️ Simulyatsiyani boshlash'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSimulationTab = () => {
    if (!simulationStatus) {
      return (
        <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Faol simulyatsiya yo'q</h3>
            <p className="text-gray-600 mb-6">Yangi simulyatsiya boshlash uchun "Holatlar" bo'limiga o'ting</p>
            <Button
              onClick={() => setActiveTab('cases')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Holatlarni ko'rish
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Status Bar */}
        <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-blue-900">Simulyatsiya holati</h3>
                <p className="text-sm text-gray-600">
                  Bosqich: {simulationStatus.current_phase} • 
                  Vaqt: {Math.floor(simulationStatus.elapsed_time / 60)}:{(simulationStatus.elapsed_time % 60).toString().padStart(2, '0')}
                </p>
              </div>
              <div className="flex gap-2">
                {simulationStatus.status === 'active' ? (
                  <Button
                    onClick={pauseSimulation}
                    variant="outline"
                    className="border-orange-600 text-orange-600 hover:bg-orange-50"
                  >
                    ⏸️ To'xtatish
                  </Button>
                ) : (
                  <Button
                    onClick={resumeSimulation}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    ▶️ Davom ettirish
                  </Button>
                )}
                <Button
                  onClick={endSimulation}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  ⏹️ Tugatish
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Court Room */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Court Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Argument Input */}
            <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-blue-900">Argument kiritish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Argument turi
                    </label>
                    <Select
                      value={argumentType}
                      onChange={(e) => setArgumentType(e.target.value)}
                      options={[
                        { value: 'opening', label: 'Kirish so\'zlari' },
                        { value: 'closing', label: 'Yakunlovchi so\'zlari' },
                        { value: 'objection', label: 'E\'tiroz' },
                        { value: 'question', label: 'Savol' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rol
                    </label>
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {userRole === 'prosecution' ? '🏛️ Ayblovchi' : 
                       userRole === 'defense' ? '🛡️ Himoyachi' : '⚖️ Hakam'}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Argument mazmuni
                    </label>
                    <div className="flex gap-2">
                      {speechEnabled && (
                        <>
                          <button
                            onClick={isListening ? stopListening : startListening}
                            className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${
                              isListening 
                                ? 'bg-red-600 text-white animate-pulse' 
                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            }`}
                            title={isListening ? 'To\'xtatish' : 'Ovoz bilan kiritish'}
                          >
                            {isListening ? '🔴 Tinglanmoqda...' : '🎤 Gapiring'}
                          </button>
                          <button
                            onClick={() => setAutoSpeak(!autoSpeak)}
                            className={`px-3 py-1 rounded-lg text-sm ${
                              autoSpeak 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                            title={autoSpeak ? 'Avto gapirish yoqilgan' : 'Avto gapirish o\'chirilgan'}
                          >
                            {autoSpeak ? '🔊 Eshitish ON' : '🔇 Eshitish OFF'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={argumentContent}
                    onChange={(e) => setArgumentContent(e.target.value)}
                    placeholder="Argumentingizni bu yerga yozing yoki 🎤 tugmasini bosib gapiring..."
                    className="w-full h-32 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isListening}
                  />
                  {isListening && (
                    <div className="mt-2 text-sm text-red-600 animate-pulse">
                      🎤 Tinglanmoqda... Gapiring
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={submitArgument}
                  disabled={loading || !argumentContent.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? 'Yuborilmoqda...' : '📤 Argumentni yuborish'}
                </Button>
              </CardContent>
            </Card>

            {/* Transcript */}
            <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-blue-900">Transkript</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transcript.map((entry, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-blue-900">
                          {entry.speaker === 'prosecution' ? '🏛️ Ayblovchi' :
                           entry.speaker === 'defense' ? '🛡️ Himoyachi' : '⚖️ Hakam'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{entry.content}</p>
                      {entry.evidence_references && entry.evidence_references.length > 0 && (
                        <div className="mt-2 text-sm text-blue-600">
                          Dalillar: {entry.evidence_references.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Evidence */}
            <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-blue-900">Dalillar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {evidence.map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <input
                          type="checkbox"
                          checked={selectedEvidence.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEvidence(prev => [...prev, item.id]);
                            } else {
                              setSelectedEvidence(prev => prev.filter(id => id !== item.id));
                            }
                          }}
                          className="mt-1"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <div className="flex gap-2 text-xs">
                        <Badge className="bg-green-100 text-green-800">
                          Ishonchlilik: {item.credibility_score}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                          Relevansi: {item.relevance_score}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Participants */}
            <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-blue-900">Ishtirokchilar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">⚖️ Hakam</div>
                    <div className="text-sm text-gray-600">Tajriba: 15 yil</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">🏛️ Ayblovchi</div>
                    <div className="text-sm text-gray-600">Tajriba: 8 yil</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">🛡️ Himoyachi</div>
                    <div className="text-sm text-gray-600">Tajriba: 10 yil</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-blue-900">Simulyatsiya tarixi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {simulationHistory.map((item, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.case_title}</h3>
                    <p className="text-sm text-gray-600">
                      {item.user_role} • {item.difficulty_level} • {item.simulation_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-blue-900">{item.score} ball</div>
                    <Badge className={
                      item.outcome === 'g\'alaba' ? 'bg-green-100 text-green-800' :
                      item.outcome === 'qoniqarli' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {item.outcome}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLeaderboardTab = () => (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-blue-900">Eng yaxshi natijalar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboard.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Foydalanuvchi #{item.user_id}</div>
                    <div className="text-sm text-gray-600">
                      {item.total_simulations} simulyatsiya • Eng yuqori: {item.highest_score}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-blue-900">{item.average_score.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">o'rtacha ball</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-blue-900">Court Simulator</h1>
          <p className="text-blue-700">O'zbekiston sud simulyatsiyasi</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/80 backdrop-blur-sm rounded-xl p-1">
          {[
            { id: 'dashboard', label: '📊 Boshqaruv paneli', icon: '📊' },
            { id: 'cases', label: '🏛️ Holatlar', icon: '🏛️' },
            { id: 'simulation', label: '⚖️ Simulyatsiya', icon: '⚖️' },
            { id: 'history', label: '📚 Tarix', icon: '📚' },
            { id: 'leaderboard', label: '🏆 Reyting', icon: '🏆' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'cases' && renderCasesTab()}
        {activeTab === 'simulation' && renderSimulationTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'leaderboard' && renderLeaderboardTab()}
      </div>
    </div>
  );
}
