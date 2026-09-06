'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { getAuthHeaders } from '@/lib/api-auth-client'
import { useRouter } from 'next/navigation'
import { useLimitModal } from '@/hooks/useLimitModal'
import LimitExceededModal from '@/components/ai/LimitExceededModal'
import { supabase } from '@/lib/supabase'
import {
  Gavel,
  Scale,
  Users,
  Mic,
  MicOff,
  Send,
  Clock,
  AlertTriangle,
  FileText,
  MessageCircle,
  Star,
  CheckCircle,
  AlertCircle,
  Search,
  Award,
  TrendingUp,
  Play,
  ArrowRight,
  RefreshCw,
  FolderOpen,
  Volume2,
  ChevronRight,
  Shield,
  BookOpen,
  X,
  History,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import type {
  CourtRole,
  CourtScenario,
  CourtSessionState,
  CourtStage,
  EvidenceItem,
  ParticipantPersona,
  ProcedureType,
  ScoringResult,
  SessionEvent,
} from '@/lib/court/court-types'

// SpeechRecognition tipi
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: any) => void) | null
  onend: (() => void) | null
  onerror: ((e: any) => void) | null
  start: () => void
  stop: () => void
}

export default function VirtualCourtPage() {
  const router = useRouter()
  const { modalProps, checkLimitError } = useLimitModal()

  // ── Navigation & Page State ──
  const [viewState, setViewState] = useState<'select' | 'session' | 'verdict'>('select')
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('Yuklanmoqda...')
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  // ── Scenarios & User Selection ──
  const [scenarios, setScenarios] = useState<CourtScenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<CourtScenario | null>(null)
  const [selectedRole, setSelectedRole] = useState<CourtRole>('ADVOKAT')
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureType>('trial')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // ── Active Session State ──
  const [simulationId, setSimulationId] = useState<string>('')
  const [sessionState, setSessionState] = useState<CourtSessionState | null>(null)
  const [messages, setMessages] = useState<
    Array<{ id: string; speaker: string; role: string; text: string; time: string }>
  >([])
  const [inputMessage, setInputMessage] = useState('')
  const [userName, setUserName] = useState('Foydalanuvchi')
  const [timeRemaining, setTimeRemaining] = useState(600) // 10 minutes
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null)

  // ── Modals & Drawers ──
  const [mobileTab, setMobileTab] = useState<'court' | 'participants' | 'evidence'>('court')
  const [showEvidenceModal, setShowEvidenceModal] = useState(false)
  const [selectedEvidenceForView, setSelectedEvidenceForView] = useState<EvidenceItem | null>(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyList, setHistoryList] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [scoringResults, setScoringResults] = useState<ScoringResult | null>(null)

  // ── Voice / STT ──
  const [isListening, setIsListening] = useState(false)
  const [sttSupported, setSttSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // ── Load User & Initial Data ──
  useEffect(() => {
    const initUser = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const user = data?.session?.user
        if (user) {
          const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Foydalanuvchi'
          setUserName(name)
        }
      } catch {}
    }
    initUser()

    if (typeof window !== 'undefined') {
      const hasSTT = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
      setSttSupported(hasSTT)
    }

    loadScenarios()
  }, [])

  // Auto scroll chat to bottom
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Timer countdown
  useEffect(() => {
    if (viewState !== 'session' || timeRemaining <= 0) return
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleFinishSession()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [viewState, timeRemaining])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // ── API: Load Scenarios ──
  const loadScenarios = async () => {
    setLoading(true)
    setLoadingText('Sud ishlari bazasi yuklanmoqda...')
    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ action: 'list_scenarios' }),
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.scenarios)) {
        setScenarios(data.scenarios)
        if (data.scenarios.length > 0 && !selectedScenario) {
          setSelectedScenario(data.scenarios[0])
        }
      }
    } catch {
      setErrorBanner('Ssenariylarni yuklashda xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  // ── API: Load History ──
  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ action: 'list_history' }),
      })
      const data = await res.json()
      if (data.success) {
        setHistoryList(data.history || [])
      }
    } catch {}
    setLoadingHistory(false)
  }

  // ── Sequential Message Appender ──
  const appendMessagesSequentially = async (
    speakers: Array<{ speaker: string; role: string; message: string }>
  ) => {
    for (let i = 0; i < speakers.length; i++) {
      const s = speakers[i]
      setActiveSpeaker(s.speaker)
      setMessages(prev => [
        ...prev,
        {
          id: 'msg_' + Date.now() + Math.random(),
          speaker: s.speaker,
          role: s.role,
          text: s.message,
          time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        },
      ])
      if (i < speakers.length - 1) {
        await new Promise(r => setTimeout(r, 1200))
      }
    }
    setActiveSpeaker(null)
  }

  // ── API: Start Session ──
  const handleStartSession = async (scenarioToStart?: CourtScenario) => {
    const sc = scenarioToStart || selectedScenario
    if (!sc) return

    setLoading(true)
    setLoadingText('Sud zali tayyorlanmoqda va ishtirokchilar chaqirilmoqda...')
    setErrorBanner(null)
    setMessages([])
    setTimeRemaining(sc.procedure_type === 'trial' ? 720 : 480)

    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          action: 'start',
          scenarioId: sc.id,
          userRole: selectedRole,
          userName,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429 && data.error === 'limit_reached') {
          checkLimitError(data)
          return
        }
        throw new Error(data.message || data.error || 'Simulyatsiyani boshlashda xatolik')
      }

      setSimulationId(data.simulation_id)
      setSessionState(data.session)
      setSelectedScenario(data.scenario)
      setViewState('session')

      if (data.aiResponse?.speakers) {
        await appendMessagesSequentially(data.aiResponse.speakers)
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Tarmoq xatoligi')
    } finally {
      setLoading(false)
    }
  }

  // ── API: Send User Action / Statement ──
  const handleSendUserAction = async (
    overrideText?: string,
    actionType:
      | 'speak'
      | 'question'
      | 'present_evidence'
      | 'object'
      | 'ruling'
      | 'conclude'
      | 'settle' = 'speak',
    evidenceId?: string
  ) => {
    const textToSend = (overrideText ?? inputMessage).trim()
    if (!textToSend || loading || !simulationId) return

    setInputMessage('')
    setLoading(true)
    setLoadingText('AI ishtirokchilari fikrlamoqda...')
    setErrorBanner(null)

    // Append user message immediately
    const userRoleTitle =
      selectedRole === 'SUDYA'
        ? 'Sud Raisi (Siz)'
        : selectedRole === 'PROKUROR'
          ? 'Davlat Ayblovchisi (Siz)'
          : 'Himoyachi Advokat (Siz)'

    setMessages(prev => [
      ...prev,
      {
        id: 'msg_user_' + Date.now(),
        speaker: userRoleTitle,
        role: selectedRole,
        text: textToSend,
        time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
      },
    ])

    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          action: 'user_action',
          simulationId,
          userName,
          userAction: {
            type: actionType,
            role: selectedRole,
            text: textToSend,
            evidenceId,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Harakatni yuborishda xatolik')

      if (data.session) {
        setSessionState(data.session)
      }

      if (!data.validation?.valid && data.validation?.reason) {
        setErrorBanner(`Protsessual ogohlantirish: ${data.validation.reason}`)
      }

      if (data.aiResponse?.speakers) {
        await appendMessagesSequentially(data.aiResponse.speakers)
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  // ── API: Transition Next Stage (Server Validated) ──
  const handleNextStage = async () => {
    if (!simulationId || loading) return
    setLoading(true)
    setLoadingText('Keyingi protsessual bosqichga o‘tilmoqda...')
    setErrorBanner(null)

    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          action: 'next_stage',
          simulationId,
          userName,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        if (data.error === 'transition_blocked') {
          setErrorBanner(`Bosqichni o‘zgartirish rad etildi: ${data.message}`)
          return
        }
        throw new Error(data.error || 'Bosqichni o‘zgartirishda xatolik')
      }

      if (data.isFinal) {
        handleFinishSession()
        return
      }

      if (data.session) {
        setSessionState(data.session)
      }

      if (data.aiResponse?.speakers) {
        await appendMessagesSequentially(data.aiResponse.speakers)
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Bosqichga o‘tishda xatolik')
    } finally {
      setLoading(false)
    }
  }

  // ── API: Finish Session & Score ──
  const handleFinishSession = async () => {
    if (!simulationId) return
    setLoading(true)
    setLoadingText('Sud yakunlanmoqda va baholash hisoboti tuzilmoqda...')
    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          action: 'finish_session',
          simulationId,
        }),
      })
      const data = await res.json()
      if (data.success && data.scoring) {
        setScoringResults(data.scoring)
        setViewState('verdict')
      }
    } catch (err: any) {
      setErrorBanner('Yakunlashda xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  // ── API: Judge Admit/Reject Evidence ──
  const handleJudgeEvidenceDecision = async (evidenceId: string, decision: 'admit' | 'reject') => {
    if (!simulationId || selectedRole !== 'SUDYA') return
    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          action: 'admit_evidence',
          simulationId,
          evidenceId,
          decision,
          reason:
            decision === 'admit'
              ? 'Dalil maqbul va ishga aloqador'
              : 'Dalil maqbul emas deb topildi',
        }),
      })
      const data = await res.json()
      if (data.success && sessionState) {
        setSessionState(prev => {
          if (!prev) return null
          return {
            ...prev,
            evidence_state: prev.evidence_state.map(e =>
              e.id === evidenceId
                ? { ...e, status: decision === 'admit' ? 'admitted' : 'rejected' }
                : e
            ),
          }
        })
      }
    } catch {}
  }

  // ── Voice Input (STT) ──
  const toggleSpeech = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) {
      alert(
        "Brauzeringiz ovozli kiritishni qo'llab-quvvatlamaydi (Chrome yoki Edge tavsiya etiladi)."
      )
      return
    }

    const rec = new SR()
    recognitionRef.current = rec
    rec.lang = 'uz-UZ'
    rec.continuous = false
    rec.interimResults = true

    rec.onresult = (e: any) => {
      let transcript = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript
      }
      setInputMessage(transcript)
    }

    rec.onend = () => {
      setIsListening(false)
    }

    rec.onerror = () => {
      setIsListening(false)
    }

    rec.start()
    setIsListening(true)
  }

  // ── Role POV Background Selector ──
  const courtroomBackground = useMemo(() => {
    switch (selectedRole) {
      case 'SUDYA':
        return '/images/courtroom/judge_pov.jpg'
      case 'PROKUROR':
        return '/images/courtroom/prosecutor_pov.jpg'
      case 'ADVOKAT':
      default:
        return '/images/courtroom/lawyer_pov.jpg'
    }
  }, [selectedRole])

  // Filtered cases in selection screen
  const filteredCases = useMemo(() => {
    return scenarios.filter(c => {
      const matchCategory = categoryFilter === 'all' || c.category === categoryFilter
      const matchProcedure =
        selectedProcedure === 'trial'
          ? c.procedure_type === 'trial'
          : c.procedure_type === selectedProcedure
      const matchSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCategory && matchProcedure && matchSearch
    })
  }, [scenarios, categoryFilter, selectedProcedure, searchQuery])

  // Current stage object
  const currentStageObj: CourtStage | undefined = useMemo(() => {
    if (!selectedScenario || !sessionState) return undefined
    return (
      selectedScenario.stages.find(s => s.id === sessionState.current_stage) ||
      selectedScenario.stages[0]
    )
  }, [selectedScenario, sessionState])

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER: SELECTION SCREEN
  // ═════════════════════════════════════════════════════════════════════════
  if (viewState === 'select') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
        <LimitExceededModal {...modalProps} onUpgrade={() => router.push('/premium')} />

        {/* Top Navigation */}
        <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Gavel className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                JURISTIV{' '}
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                  Virtual Sud
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Interaktiv Sud Simulyatsiyasi • O‘zbekiston Qonunchiligi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowHistoryModal(true)
                loadHistory()
              }}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition flex items-center gap-1.5"
            >
              <History size={15} className="text-blue-400" />
              <span>Mening Sudlarim</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {/* STEP 1: CHOOSE PROCEDURE TYPE */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  Simulyatsiya Turi
                </h2>
                <p className="text-xs text-slate-400">Kerakli huquqiy amaliyot formatini tanlang</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: 'trial' as ProcedureType,
                  title: 'Sud Jarayoni',
                  sub: 'JPK / FPK bo‘yicha to‘liq sud majlisi',
                  icon: Gavel,
                  gradient: 'from-blue-600/30 to-indigo-600/10 border-blue-500/40',
                  activeBorder: 'border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-600/20',
                },
                {
                  id: 'negotiation' as ProcedureType,
                  title: 'Muzokara (Mediation)',
                  sub: 'Shartnomaviy va biznes nizolarini hal etish',
                  icon: Scale,
                  gradient: 'from-emerald-600/30 to-teal-600/10 border-emerald-500/40',
                  activeBorder:
                    'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-600/20',
                },
                {
                  id: 'investigation' as ProcedureType,
                  title: 'Tergov Harakatlari',
                  sub: 'Guvohlarni so‘roq qilish va dalillarni tahlil qilish',
                  icon: Search,
                  gradient: 'from-purple-600/30 to-violet-600/10 border-purple-500/40',
                  activeBorder: 'border-purple-500 bg-purple-950/40 shadow-lg shadow-purple-600/20',
                },
              ].map(p => {
                const Icon = p.icon
                const isSelected = selectedProcedure === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProcedure(p.id)}
                    className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? p.activeBorder
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-blue-400">
                        <Icon size={20} />
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{p.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">{p.sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* STEP 2: CHOOSE USER ROLE */}
          <section>
            <div className="mb-4">
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-xs flex items-center justify-center font-bold">
                  2
                </span>
                Ishtirok Etadigan Rolingiz
              </h2>
              <p className="text-xs text-slate-400">
                Siz tanlagan rol sizning boshqaruvingizda bo‘ladi, qolgan barcha ishtirokchilar AI
                tomonidan boshqariladi
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: 'ADVOKAT' as CourtRole,
                  title: 'Advokat (Himoyachi)',
                  desc: 'Mijoz huquqlarini himoya qilish, dalillarga e’tiroz bildirish va oqlov/yengillik so‘rash',
                  icon: Shield,
                  color: 'text-amber-400',
                  border: 'border-amber-500/50 bg-amber-950/20 shadow-amber-500/10',
                },
                {
                  id: 'PROKUROR' as CourtRole,
                  title: 'Prokuror (Ayblovchi)',
                  desc: 'Davlat ayblovini qo‘llab-quvvatlash, dalillarni isbotlash va qat’iy jazo talab qilish',
                  icon: Gavel,
                  color: 'text-rose-400',
                  border: 'border-rose-500/50 bg-rose-950/20 shadow-rose-500/10',
                },
                {
                  id: 'SUDYA' as CourtRole,
                  title: 'Sud Raisi (Sudya)',
                  desc: 'Majlisni boshqarish, iltimosnomalarni hal etish, dalillarni qabul qilish va Hukm chiqarish',
                  icon: Scale,
                  color: 'text-blue-400',
                  border: 'border-blue-500/50 bg-blue-950/20 shadow-blue-500/10',
                },
              ].map(r => {
                const Icon = r.icon
                const isSelected = selectedRole === r.id
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? `border-2 ${r.border} shadow-lg`
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center ${r.color}`}
                      >
                        <Icon size={20} />
                      </div>
                      {isSelected && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-600 text-white font-semibold">
                          Tanlandi
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{r.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{r.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* STEP 3: CHOOSE SCENARIO / CASE */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  Ishni Tanlang (Case Selection)
                </h2>
                <p className="text-xs text-slate-400">
                  O‘quv amaliyoti uchun realistik sud ishlari
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Qidiruv..."
                    className="pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Barcha sohalar</option>
                  <option value="criminal">Jinoyat ishlari</option>
                  <option value="civil">Fuqarolik ishlari</option>
                  <option value="labor">Mehnat nizolari</option>
                  <option value="family">Oila nizolari</option>
                  <option value="economic">Iqtisodiy / Biznes</option>
                </select>
              </div>
            </div>

            {/* Cases Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCases.map(sc => {
                const isSelected = selectedScenario?.id === sc.id
                return (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedScenario(sc)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-500/10'
                        : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 uppercase font-semibold">
                          {sc.category}
                        </span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                            sc.difficulty === 'easy'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                              : sc.difficulty === 'medium'
                                ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                                : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                          }`}
                        >
                          {sc.difficulty === 'easy'
                            ? "Boshlang'ich"
                            : sc.difficulty === 'medium'
                              ? "O'rta"
                              : 'Murakkab'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white line-clamp-1">{sc.title}</h3>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                        {sc.description || sc.facts}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>👥 {sc.participants?.length || 4} ishtirokchi</span>
                      <span>📂 {sc.evidence?.length || 2} ta dalil</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredCases.length === 0 && (
              <div className="text-center py-12 text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800/60">
                <Scale className="mx-auto mb-2 opacity-50" size={32} />
                <p className="text-sm">Ushbu filtr bo‘yicha sud ishlari topilmadi.</p>
              </div>
            )}
          </section>

          {/* START BUTTON BANNER */}
          {selectedScenario && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900/50 via-slate-900 to-indigo-950/50 border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-blue-400" />
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                    Simulyatsiya Boshlashga Tayyor
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {selectedScenario.title} • <span className="text-blue-400">{selectedRole}</span>{' '}
                  sifatida
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  AI qatnashchilari to‘liq protsessual qonunlar asosida ish yuritadi.
                </p>
              </div>

              <button
                onClick={() => handleStartSession()}
                disabled={loading}
                className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> {loadingText}
                  </>
                ) : (
                  <>
                    <Play size={18} /> Sud Majlisini Boshlash
                  </>
                )}
              </button>
            </div>
          )}
        </main>

        {/* HISTORY MODAL */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="text-blue-400" size={20} />
                  <h3 className="text-base font-bold text-white">O‘tgan Sud Sessiyalari Tarixi</h3>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto space-y-3 flex-1">
                {loadingHistory ? (
                  <div className="text-center py-8 text-slate-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                    Yuklanmoqda...
                  </div>
                ) : historyList.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Hali yakunlangan simulyatsiyalar yo‘q.
                  </div>
                ) : (
                  historyList.map(h => (
                    <div
                      key={h.id}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300">
                            {h.user_role}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(h.created_at).toLocaleDateString('uz-UZ')}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{h.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Holat: {h.outcome || h.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-emerald-400">
                          {h.score || 0} ball
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {h.status === 'completed' ? 'Yakunlangan' : 'Jarayonda'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER: SESSION IMMERSIVE COURTROOM SCREEN
  // ═════════════════════════════════════════════════════════════════════════
  if (viewState === 'session' && sessionState && selectedScenario) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden relative selection:bg-blue-600 selection:text-white">
        <LimitExceededModal {...modalProps} onUpgrade={() => router.push('/premium')} />

        {/* IMMERSIVE COURTROOM POV BACKGROUND */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-all duration-700 opacity-25"
          style={{ backgroundImage: `url('${courtroomBackground}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/90 pointer-events-none" />

        {/* ── TOP BAR: HUD & STAGE STEPPER ── */}
        <header className="relative z-20 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-4 lg:px-6 py-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewState('select')}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/60 transition"
              >
                ← Chiqish
              </button>
              <div>
                <h2 className="text-sm font-bold text-white line-clamp-1">
                  {selectedScenario.title}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="text-blue-400 font-semibold">{selectedRole} sifatida</span>
                  <span>•</span>
                  <span>{selectedScenario.category}</span>
                </div>
              </div>
            </div>

            {/* Timer & Finish Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-amber-400">
                <Clock size={14} />
                <span>{formatTime(timeRemaining)}</span>
              </div>
              <button
                onClick={handleFinishSession}
                className="px-3 py-1 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 text-xs font-medium transition"
              >
                Sudni Yakunlash
              </button>
            </div>
          </div>

          {/* STAGE STEPPER PROGRESS */}
          <div className="overflow-x-auto pb-1 flex items-center gap-1.5 scrollbar-none">
            {selectedScenario.stages.map((st, idx) => {
              const isCurrent = st.id === sessionState.current_stage
              const isPast = st.order < (currentStageObj?.order || 1)
              return (
                <div
                  key={st.id}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                      : isPast
                        ? 'bg-slate-800 text-slate-400 line-through opacity-70'
                        : 'bg-slate-900/60 text-slate-500'
                  }`}
                >
                  <span>{idx + 1}.</span>
                  <span>{st.title}</span>
                </div>
              )
            })}
          </div>
        </header>

        {/* ERROR / FEEDBACK BANNER */}
        {errorBanner && (
          <div className="relative z-20 px-4 py-2 bg-amber-950/80 border-b border-amber-800/80 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400" />
              <span>{errorBanner}</span>
            </div>
            <button
              onClick={() => setErrorBanner(null)}
              className="text-amber-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── MOBILE TABS SWITCHER (MOBILE ONLY) ── */}
        <div className="md:hidden relative z-20 flex border-b border-slate-800 bg-slate-900/90 text-xs">
          <button
            onClick={() => setMobileTab('court')}
            className={`flex-1 py-2 font-medium text-center border-b-2 ${
              mobileTab === 'court'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400'
            }`}
          >
            🏛️ Sud Zali
          </button>
          <button
            onClick={() => setMobileTab('participants')}
            className={`flex-1 py-2 font-medium text-center border-b-2 ${
              mobileTab === 'participants'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400'
            }`}
          >
            👥 Ishtirokchilar
          </button>
          <button
            onClick={() => setMobileTab('evidence')}
            className={`flex-1 py-2 font-medium text-center border-b-2 ${
              mobileTab === 'evidence'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400'
            }`}
          >
            📂 Dalillar ({sessionState.evidence_state.length})
          </button>
        </div>

        {/* ── 3-COLUMN MAIN LAYOUT ── */}
        <div className="flex-1 relative z-10 flex overflow-hidden">
          {/* LEFT PANEL: PARTICIPANTS (DESKTOP) */}
          <aside
            className={`w-72 border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto flex-col justify-between ${
              mobileTab === 'participants'
                ? 'flex w-full absolute inset-0 z-30 bg-slate-950'
                : 'hidden md:flex'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-blue-400" /> Ishtirokchilar
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {sessionState.participant_state.length} kishi
                </span>
              </div>

              <div className="space-y-2">
                {sessionState.participant_state.map(p => {
                  const isSpeaking = activeSpeaker === p.name || activeSpeaker === p.title
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border transition-all ${
                        p.isUser
                          ? 'bg-blue-950/30 border-blue-500/40 shadow-sm'
                          : isSpeaking
                            ? 'bg-amber-950/30 border-amber-500/50 animate-pulse'
                            : 'bg-slate-900/40 border-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{p.avatarIcon || '👤'}</span> {p.name}
                        </span>
                        {p.isUser ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">
                            SIZ
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            AI
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{p.title}</div>
                      {isSpeaking && (
                        <div className="text-[10px] text-amber-400 mt-1 flex items-center gap-1 font-medium">
                          <Volume2 size={12} className="animate-bounce" /> Gapirmoqda...
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* User Info Box */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 mt-4">
              <div className="text-[11px] font-semibold text-slate-300 mb-1">Tartib Qoidasi:</div>
              <p className="text-[10px] leading-relaxed">
                Sudda so‘z berilganda yoki protsessual navbatingiz kelganda harakat qiling. Noo‘rin
                e’tirozlar ballingizni kamaytiradi.
              </p>
            </div>
          </aside>

          {/* CENTER PANEL: COURTROOM STREAM & CONVERSATION */}
          <main
            className={`flex-1 flex flex-col justify-between overflow-hidden ${
              mobileTab === 'court' ? 'flex' : 'hidden md:flex'
            }`}
          >
            {/* CURRENT STAGE INFO HEADER */}
            {currentStageObj && (
              <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <span className="text-xs font-bold text-blue-400">
                    Hozirgi Bosqich: {currentStageObj.title}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden lg:inline">
                    ({currentStageObj.legalName})
                  </span>
                </div>

                <button
                  onClick={handleNextStage}
                  disabled={loading}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition flex items-center gap-1 shadow-sm"
                >
                  <span>Keyingi Bosqich</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}

            {/* MESSAGES FEED */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map(m => {
                const isUser = m.role === selectedRole
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-2xl ${
                      isUser ? 'ml-auto' : 'mr-auto'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">{m.speaker}</span>
                      <span>•</span>
                      <span>{m.time}</span>
                    </div>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20'
                          : 'bg-slate-900/90 border border-slate-800/80 text-slate-200 rounded-tl-none backdrop-blur-md shadow-lg'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                )
              })}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-blue-400 bg-slate-900/80 px-4 py-2.5 rounded-full w-fit border border-slate-800">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{loadingText}</span>
                </div>
              )}
              <div ref={chatScrollRef} />
            </div>

            {/* ── BOTTOM USER ACTION & INPUT BAR ── */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-900/90 backdrop-blur-md space-y-3">
              {/* STAGE CONTEXTUAL ACTION BUTTONS */}
              {currentStageObj && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[11px] font-semibold text-slate-400 flex-shrink-0">
                    Harakatlar:
                  </span>
                  {currentStageObj.availableActions.map(act => (
                    <button
                      key={act.id}
                      disabled={loading}
                      onClick={() => {
                        if (act.actionType === 'present_evidence') {
                          setShowEvidenceModal(true)
                        } else {
                          handleSendUserAction(act.description, act.actionType)
                        }
                      }}
                      className="flex-shrink-0 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                    >
                      {act.label}
                    </button>
                  ))}
                  {selectedRole !== 'SUDYA' && (
                    <button
                      disabled={loading}
                      onClick={() =>
                        handleSendUserAction(
                          "Hurmatli sud raisi, qarshi tarafning argumentiga protsessual qonunchilikka binoan e'tiroz bildiraman!",
                          'object'
                        )
                      }
                      className="flex-shrink-0 px-2.5 py-1 text-xs rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition"
                    >
                      ⚠️ E'tiroz bildirish
                    </button>
                  )}
                </div>
              )}

              {/* INPUT FIELD WITH VOICE & SEND */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendUserAction()
                    }
                  }}
                  placeholder={`${selectedRole} sifatida so‘zlang yoki yozing...`}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition"
                />

                {sttSupported && (
                  <button
                    onClick={toggleSpeech}
                    disabled={loading}
                    className={`p-2.5 rounded-xl border transition ${
                      isListening
                        ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                    title="Ovozli kiritish"
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                )}

                <button
                  onClick={() => handleSendUserAction()}
                  disabled={loading || !inputMessage.trim()}
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition shadow-md shadow-blue-500/20"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </main>

          {/* RIGHT PANEL: EVIDENCE LOCKER & LEGAL BASIS (DESKTOP) */}
          <aside
            className={`w-80 border-l border-slate-800/80 bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto flex-col ${
              mobileTab === 'evidence'
                ? 'flex w-full absolute inset-0 z-30 bg-slate-950'
                : 'hidden lg:flex'
            }`}
          >
            <div className="space-y-6">
              {/* EVIDENCE SECTION */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FolderOpen size={14} className="text-amber-400" /> Dalillar Ro‘yxati
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {sessionState.evidence_state.length} ta
                  </span>
                </div>

                <div className="space-y-2.5">
                  {sessionState.evidence_state.map(ev => (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvidenceForView(ev)}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white line-clamp-1">
                          {ev.title}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                            ev.status === 'admitted'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : ev.status === 'submitted'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                                : ev.status === 'rejected'
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                                  : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {ev.status === 'admitted'
                            ? 'Qabul qilingan'
                            : ev.status === 'submitted'
                              ? 'Taqdim etilgan'
                              : ev.status === 'rejected'
                                ? 'Rad etilgan'
                                : 'Mavjud'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{ev.description}</p>

                      {/* If user is judge and evidence is submitted, show ruling buttons */}
                      {selectedRole === 'SUDYA' && ev.status === 'submitted' && (
                        <div
                          className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-800"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleJudgeEvidenceDecision(ev.id, 'admit')}
                            className="flex-1 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[10px] font-semibold"
                          >
                            ✓ Ishga qo‘shish
                          </button>
                          <button
                            onClick={() => handleJudgeEvidenceDecision(ev.id, 'reject')}
                            className="flex-1 py-1 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 text-[10px] font-semibold"
                          >
                            ✕ Rad etish
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* LEGAL BASIS & FACTS */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <BookOpen size={14} className="text-blue-400" /> Qonuniy Asoslar (LexUZ)
                </h3>
                <div className="space-y-2">
                  {selectedScenario.legal_basis.map((l, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 text-xs"
                    >
                      <div className="font-bold text-blue-400">
                        {l.code} {l.article}
                      </div>
                      <div className="text-slate-300 text-[11px] mt-0.5">{l.title}</div>
                      <div className="text-slate-500 text-[10px] mt-1">{l.relevance}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* EVIDENCE VIEW / PRESENT MODAL */}
        {selectedEvidenceForView && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="text-blue-400" size={18} />
                  <h4 className="text-sm font-bold text-white">{selectedEvidenceForView.title}</h4>
                </div>
                <button
                  onClick={() => setSelectedEvidenceForView(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400">Turi: </span>
                  <span className="text-white font-medium capitalize">
                    {selectedEvidenceForView.type}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Manbasi: </span>
                  <span className="text-white font-medium">{selectedEvidenceForView.source}</span>
                </div>
                <div>
                  <span className="text-slate-400">Tavsif: </span>
                  <p className="text-slate-200 mt-1">{selectedEvidenceForView.description}</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">Mazmuni:</span>
                  <p className="text-slate-200 leading-relaxed">
                    {selectedEvidenceForView.content}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setSelectedEvidenceForView(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Yopish
                </button>
                {selectedEvidenceForView.status === 'unsubmitted' && (
                  <button
                    onClick={() => {
                      handleSendUserAction(
                        `Sudga quyidagi dalilni taqdim etaman: "${selectedEvidenceForView.title}".`,
                        'present_evidence',
                        selectedEvidenceForView.id
                      )
                      setSelectedEvidenceForView(null)
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                  >
                    Sudga Taqdim Etish
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER: VERDICT & DETAILED SCORING SCREEN
  // ═════════════════════════════════════════════════════════════════════════
  if (viewState === 'verdict' && scoringResults && selectedScenario) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-blue-600 selection:text-white">
        <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/20 mb-2">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Sud Simulyatsiyasi Yakunlandi</h2>
            <p className="text-xs text-slate-400">
              Ish: <span className="text-slate-200 font-semibold">{selectedScenario.title}</span> •
              Rol: <span className="text-blue-400 font-semibold">{selectedRole}</span>
            </p>
          </div>

          {/* Big Total Score Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/30 text-center space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Umumiy Natija
            </div>
            <div className="text-5xl font-black text-white font-mono tracking-tight">
              {scoringResults.totalScore}{' '}
              <span className="text-lg text-slate-400 font-normal">/ 100</span>
            </div>
            <p className="text-sm text-slate-300 max-w-xl mx-auto mt-2 leading-relaxed">
              {scoringResults.feedbackSummary}
            </p>
            <div className="pt-3 flex items-center justify-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold">
                +{scoringResults.xpEarned} XP qo‘shildi
              </span>
            </div>
          </div>

          {/* Detailed Metrics Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 mb-1">Qonuniy Asoslar</div>
              <div className="text-lg font-bold text-white font-mono">
                {scoringResults.legalReasoning}%
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 mb-1">Argumentatsiya</div>
              <div className="text-lg font-bold text-white font-mono">
                {scoringResults.argumentQuality}%
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 mb-1">Dalillar bilan ishlash</div>
              <div className="text-lg font-bold text-white font-mono">
                {scoringResults.evidenceUsage}%
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-[11px] text-slate-400 mb-1">Protsessual Tartib</div>
              <div className="text-lg font-bold text-white font-mono">
                {scoringResults.proceduralCorrectness}%
              </div>
            </div>
          </div>

          {/* Achievements */}
          {scoringResults.achievements.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Qo‘lga Kiritilgan Unvonlar
              </h4>
              <div className="flex flex-wrap gap-2">
                {scoringResults.achievements.map((ach, i) => (
                  <span
                    key={i}
                    className="text-xs px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-700/60 text-amber-300 font-semibold flex items-center gap-1.5"
                  >
                    <Star size={12} className="text-amber-400" /> {ach}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1.5">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle size={14} /> Kuchli Tomonlar
              </div>
              {scoringResults.strengths.map((s, idx) => (
                <div key={idx} className="text-slate-300">
                  • {s}
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1.5">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <TrendingUp size={14} /> Rivojlantirish Kerak
              </div>
              {scoringResults.improvements.map((im, idx) => (
                <div key={idx} className="text-slate-300">
                  • {im}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setViewState('select')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-2"
            >
              <RotateCcw size={15} /> Boshqa Ishni Tanlash
            </button>
            <button
              onClick={() => handleStartSession(selectedScenario)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Play size={15} /> Qayta O‘ynash
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
