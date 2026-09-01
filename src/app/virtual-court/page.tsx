'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getAuthHeaders } from '@/lib/api-auth-client'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserIdentityPayload } from '@/lib/client-user'
import {
  ArrowLeft,
  Gavel,
  Scale,
  Users,
  Mic,
  Send,
  Clock,
  AlertTriangle,
  FileText,
  MessageCircle,
  Star,
  CheckCircle,
  Target,
  Search,
  Award,
  TrendingUp,
  Play,
} from 'lucide-react'
import FeatureInstructions from '@/components/ui/FeatureInstructions'

interface Msg {
  id: string
  speaker: string
  role: 'user' | 'judge' | 'ai'
  text: string
  timestamp: Date
  type: 'statement' | 'objection' | 'evidence' | 'question' | 'ruling'
}

// Minimal SpeechRecognition tipi (webkit-prefixed brauzerlar uchun)
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult:
    | ((e: {
        resultIndex: number
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
      }) => void)
    | null
  onend: (() => void) | null
  onerror: ((e: { error?: string }) => void) | null
  start: () => void
  stop: () => void
  __vuCleanup?: () => void
}

interface SimResult {
  legalAccuracy: number
  ethics: number
  confidence: number
  etiquette: number
  argument: number
  evidence: number
  totalScore: number
  xpEarned: number
  achievements: string[]
}

// ── Simulation types ──
const SIM_TYPES = [
  {
    id: 'court',
    title: 'Sud Jarayoni',
    desc: 'Sudya, advokat yoki prokuror rolida ishtirok eting',
    color: '#2563EB',
    bg: '#DBEAFE',
    cases: [
      {
        id: 'theft',
        title: "O'g'irlik ishi",
        desc: "Supermarketdan 450 000 so'mlik tovar o'g'irlash.",
        law: 'JK 169-modda',
        level: "Boshlang'ich",
      },
      {
        id: 'contract',
        title: 'Shartnoma buzilishi',
        desc: "Qurilish shartnomasi bajarilmagan, 50 mln so'm zarar.",
        law: 'FK 345, 395-moddalar',
        level: "O'rta",
      },
      {
        id: 'labor',
        title: 'Mehnat nizosi',
        desc: "Xodim noqonuniy ishdan bo'shatilgan.",
        law: 'MK 100, 161-moddalar',
        level: "O'rta",
      },
      {
        id: 'divorce',
        title: 'Ajrashish ishi',
        desc: 'Er-xotin ajrashmoqda, mulk va bola taqsimoti.',
        law: 'OK 39, 41-moddalar',
        level: 'Murakkab',
      },
    ],
    roles: [
      { id: 'advokat', title: 'Advokat', sub: 'Himoyachi', icon: 'scale' },
      { id: 'prokuror', title: 'Prokuror', sub: 'Ayblovchi', icon: 'gavel' },
      { id: 'sudya', title: 'Sudya', sub: 'Hakam', icon: 'users' },
    ],
  },
  {
    id: 'negotiation',
    title: 'Muzokara',
    desc: 'AI mijoz bilan muzokara qiling va kelishuvga erishing',
    color: '#059669',
    bg: '#D1FAE5',
    cases: [
      {
        id: 'contract_dispute',
        title: 'Shartnoma kelishmovchiligi',
        desc: 'Mijoz shartnoma shartlariga rozi emas.',
        law: 'FK 354-modda',
        level: "O'rta",
      },
      {
        id: 'debt_settlement',
        title: 'Qarz kelishuvi',
        desc: "Qarzdor bilan to'lov muddatini kelishish.",
        law: 'FK 260-modda',
        level: "Boshlang'ich",
      },
    ],
    roles: [
      { id: 'consultant', title: 'Maslahatchi', sub: 'Huquqiy maslahat', icon: 'scale' },
      { id: 'mediator', title: 'Mediator', sub: 'Tomonlar kelishuvi', icon: 'users' },
    ],
  },
  {
    id: 'investigation',
    title: 'Tergov',
    desc: "Guvohlarni so'roq qiling va dalillarni tahlil qiling",
    color: '#7C3AED',
    bg: '#EDE9FE',
    cases: [
      {
        id: 'burglary',
        title: "O'g'irlik tergovi",
        desc: "Kvartira o'g'irlangan, guvohlar so'roq qilinadi.",
        law: 'JK 169-modda',
        level: "O'rta",
      },
      {
        id: 'fraud',
        title: 'Firibgarlik ishi',
        desc: "Bank hisobidan pul o'g'irlangan, dalillar tahlili.",
        law: 'JK 168-modda',
        level: 'Murakkab',
      },
    ],
    roles: [
      { id: 'detective', title: 'Detektiv', sub: 'Jinoyatni ochish', icon: 'search' },
      { id: 'investigator', title: 'Tergovchi', sub: 'Dalillar tahlili', icon: 'scale' },
    ],
  },
]

export default function VirtualCourt() {
  const router = useRouter()
  const [page, setPage] = useState<'select' | 'session' | 'verdict'>('select')
  const [simType, setSimType] = useState(SIM_TYPES[0])
  const [role, setRole] = useState(SIM_TYPES[0].roles[0])
  const [caseItem, setCase] = useState(SIM_TYPES[0].cases[0])
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState(600)
  const [score, setScore] = useState({ etiquette: 100, argument: 0, evidence: 0 })
  const [stressLevel, setStressLevel] = useState(0)
  const [speechReady, setSpeechReady] = useState(false)
  const [listening, setListening] = useState(false)
  const [simId, setSimId] = useState('')
  const [results, setResults] = useState<SimResult | null>(null)
  const [totalXp, setTotalXp] = useState(0)
  const [userName, setUserName] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const listeningRef = useRef(false)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const voiceModeRef = useRef(false) // Track if user was using voice

  // Load user info from Supabase
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const user = data?.session?.user
        if (user) {
          const name =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            ''
          if (name) setUserName(name)
        }
      } catch {}
    }
    loadUser()
  }, [])

  // Load XP from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('virtual_court_xp')
      if (saved) setTotalXp(parseInt(saved))
    } catch {}
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stt = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    setSpeechReady(stt)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  useEffect(() => {
    if (page !== 'session') return
    if (time <= 0) {
      endSession()
      return
    }
    const t = setTimeout(() => setTime(p => p - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, time])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // ── STT (Speech-to-Text) — faqat foydalanuvchi ovozi ──
  const SILENCE_TIMEOUT_MS = 3000
  const startMic = async () => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike
      webkitSpeechRecognition?: new () => SpeechRecognitionLike
    }
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) {
      alert('Ovozli kiritish faqat Chrome yoki Edge brauzerida ishlaydi.')
      return
    }
    const r = new SR()
    recognitionRef.current = r
    r.lang = 'uz-UZ'
    r.continuous = true
    r.interimResults = true
    voiceModeRef.current = true
    listeningRef.current = true
    setListening(true)

    // fullTranscript — barcha final natijalarni yig'ib boradi
    let fullTranscript = ''

    r.onresult = e => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }

      // currentFinal — shu batchdagi barcha yangi final transkriptlar
      let currentFinal = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          // Final natijalarni yig'amiz (bir nechta bo'lishi mumkin)
          currentFinal += (currentFinal ? ' ' : '') + t
        } else {
          // Interim natijani to'liq matn bilan ko'rsatamiz
          const display = fullTranscript + (fullTranscript && t ? ' ' : '') + t
          setInput(display.charAt(0).toUpperCase() + display.slice(1))
        }
      }

      // Agar yangi final natijalar bo'lsa, ularni to'liq transkriptga qo'shamiz
      if (currentFinal) {
        fullTranscript += (fullTranscript ? ' ' : '') + currentFinal
        setInput(fullTranscript.charAt(0).toUpperCase() + fullTranscript.slice(1))

        // Jimlik taymerini qayta ishga tushirish
        silenceTimerRef.current = setTimeout(() => {
          // 3 soniya jimlikdan keyin ovoz yozishni to'xtatamiz
          // va to'plangan matn inputda qoladi
          listeningRef.current = false
          try {
            r.stop()
          } catch {}
          setListening(false)
        }, SILENCE_TIMEOUT_MS)
      }
    }

    r.onend = () => {
      if (listeningRef.current) {
        try {
          r.start()
        } catch {}
      } else {
        setListening(false)
      }
    }

    r.onerror = e => {
      if (e.error === 'no-speech') {
        if (listeningRef.current)
          setTimeout(() => {
            try {
              r.start()
            } catch {}
          }, 500)
        return
      }
      setListening(false)
      const msg: Record<string, string> = {
        'not-allowed': "Mikrofon ruxsati yo'q.",
        'audio-capture': 'Mikrofon topilmadi.',
      }
      if (e.error && msg[e.error]) alert(msg[e.error])
    }
    // Start real audio level visualization via getUserMedia + AnalyserNode
    let audioCtx: AudioContext | null = null
    let analyser: AnalyserNode | null = null
    let source: MediaStreamAudioSourceNode | null = null
    let stream: MediaStream | null = null
    let animFrame: number = 0

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioCtx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      )()
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const updateLevel = () => {
        if (!analyser || !listeningRef.current) return
        analyser.getByteFrequencyData(dataArray)
        const avg = Array.from(dataArray).reduce((a, b) => a + b, 0) / dataArray.length
        const level = Math.min(100, Math.round(avg * 1.5))
        setAudioLevel(level)
        animFrame = requestAnimationFrame(updateLevel)
      }
      updateLevel()
    } catch {
      /* Audio viz fallback — CSS bars still show */
    }

    r.start()

    // Store cleanup
    const cleanup = () => {
      if (animFrame) cancelAnimationFrame(animFrame)
      if (stream) stream.getTracks().forEach(t => t.stop())
      if (audioCtx) audioCtx.close().catch(() => {})
    }
    ;(r as SpeechRecognitionLike).__vuCleanup = cleanup
  }
  const stopMic = () => {
    listeningRef.current = false
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    setListening(false)
    setAudioLevel(0)
    const r = recognitionRef.current
    if (r) {
      try {
        if (r.__vuCleanup) r.__vuCleanup()
      } catch {}
      try {
        r.stop()
      } catch {}
    }
  }

  const [participants, setParticipants] = useState<
    { role: string; title: string; icon: string; isUser: boolean; active: boolean }[]
  >([])
  const [audioLevel, setAudioLevel] = useState(0)

  const addMsg = (text: string, role: Msg['role'], speaker: string, type: Msg['type']) => {
    setMsgs(p => [
      ...p,
      {
        id: Date.now().toString() + Math.random(),
        speaker,
        role,
        text,
        timestamp: new Date(),
        type,
      },
    ])
  }

  // ── Get court participants based on sim type and chosen role ──
  const getParticipants = () => {
    const allRoles = [
      { role: 'SUDYA', title: 'Sudya', icon: '⚖️' },
      { role: 'KOTIBA', title: 'Kotiba', icon: '📋' },
    ]
    if (simType.id === 'court') {
      return [
        ...allRoles,
        { role: 'PROKUROR', title: 'Prokuror', icon: '⚡' },
        { role: 'ADVOKAT', title: 'Advokat', icon: '🛡️' },
        { role: 'SUDLANUVCHI', title: 'Sudlanuvchi', icon: '👤' },
      ].map(r => ({
        ...r,
        isUser: r.role === role.id.toUpperCase(),
        active: false,
      }))
    }
    if (simType.id === 'negotiation') {
      return [
        ...allRoles,
        { role: "DA'VOGAR", title: "Da'vogar", icon: '📄' },
        { role: 'JAVOBGAR', title: 'Javobgar', icon: '📑' },
      ].map(r => ({
        ...r,
        isUser: r.role === role.id.toUpperCase(),
        active: false,
      }))
    }
    return allRoles.map(r => ({ ...r, isUser: false, active: false }))
  }

  // ── Get case description for API ──
  const getCasePrompt = () => {
    return `${caseItem.title}: ${caseItem.desc} Qonun: ${caseItem.law}. Simulyatsiya: ${simType.title}. Foydalanuvchi roli: ${role.title} (${role.sub}).`
  }

  // ── Role-specific briefing — har bir rolga o'ziga kerakli ma'lumot ──
  const getRoleBriefing = () => {
    const roleUpper = role.id.toUpperCase()
    const briefings: Record<string, string> = {
      SUDYA: `SIZNING ROLINGIZ: SUDBYA\n\nVazifangiz:\n• Sud majlisini boshqarish\n• Protsessual qoidalarga rioya etilishini nazorat qilish\n• Tomonlarning argumentlarini tinglash\n• Dalillarni baholash\n• Yakuniy qaror (hukm) chiqarish\n\nIsh haqida ma'lumot:\n• ${caseItem.title}\n• ${caseItem.desc}\n• Qonun: ${caseItem.law}\n\nSiz mustaqil sudya sifatida ish yuritishingiz kerak. Tomonlarni o'zingiz aniqlang va ismlarni o'zingiz qo'ying.\n\nEslatma: Sud majlisini oching, taraflarni tanishtiring, so'z bering va jarayonni boshqaring.`,
      PROKUROR: `SIZNING ROLINGIZ: PROKUROR

Vazifangiz:
• Ayblovni asoslash
• Dalillarni taqdim etish
• Sudlanuvchining aybini isbotlash
• Jazo chorasini talab qilish

Ish haqida ma'lumot:
• ${caseItem.title}
• ${caseItem.desc}
• Qonun: ${caseItem.law}

Sizning pozitsiyangiz:
• Sudlanuvchi aybdor deb hisoblang
• Mavjud dalillar sudlanuvchining aybini tasdiqlaydi
• Jinoyat kodeksining tegishli moddasi bo'yicha jazo talab qiling

Eslatma: Ayblov xulosasini taqdim eting, dalillarni keltiring va davlat ayblovini asoslang.`,
      ADVOKAT: `SIZNING ROLINGIZ: ADVOKAT (Himoyachi)

Vazifangiz:
• Sudlanuvchining huquqlarini himoya qilish
• Dalillarni shubha ostiga olish
• Sudlanuvchining aybsizligini isbotlashga harakat qilish
• Yengilroq jazo talab qilish yoki oqlash

Ish haqida ma'lumot:
• ${caseItem.title}
• ${caseItem.desc}
• Qonun: ${caseItem.law}

Sizning pozitsiyangiz:
• Sudlanuvchi himoyasiga muhtoj
• Dalillarni sinchiklab tekshirish kerak
• Protsessual qoidalarga rioya qilinishini kuzating

Eslatma: Himoya nutqini tayyorlang, dalillarni tahlil qiling va sudlanuvchi manfaatlarini himoya qiling.`,
      SUDLANUVCHI: `SIZNING ROLINGIZ: SUDLANUVCHI

Huquqlaringiz:
• Aybingizga iqror bo'lish yoki rad etish huquqi
• O'z fikringizni bildirish huquqi
• Oxirgi so'z huquqi
• Himoyadan foydalanish huquqi

Ish haqida ma'lumot:
• ${caseItem.title}
• ${caseItem.desc}
• Qonun: ${caseItem.law}

Eslatma: Siz ayblanayotgan modda bo'yicha javob berishingiz kerak. Rostini ayting, savollarga javob bering va o'z pozitsiyangizni himoya qiling. Yolg'on guvohlik berish javobgarlikka tortiladi.`,
      "DA'VOGAR": `SIZNING ROLINGIZ: DA'VOGAR

Vazifangiz:
• O'z talablaringizni asoslash
• Dalillarni taqdim etish
• Javobgarning javobgarligini isbotlash

Ish haqida ma'lumot:
• ${caseItem.title}
• ${caseItem.desc}
• Qonun: ${caseItem.law}

Eslatma: Da'vo arizasini asoslang, dalillarni keltiring va talablaringizni himoya qiling.`,
      JAVOBGAR: `SIZNING ROLINGIZ: JAVOBGAR

Vazifangiz:
• Da'voga qarshi pozitsiya bildirish
• O'z dalillaringizni taqdim etish
• Da'vogar talablarini rad etish yoki qisman tan olish

Ish haqida ma'lumot:
• ${caseItem.title}
• ${caseItem.desc}
• Qonun: ${caseItem.law}

Eslatma: Da'voga javob bering, qarshi dalillar keltiring va o'z pozitsiyangizni himoya qiling.`,
      DETECTIVE: `SIZNING ROLINGIZ: DETEXTIV

Vazifangiz:
• Jinoyatni ochish
• Dalillarni to'plash
• Gumonlanuvchini aniqlash

Ish haqida ma'lumot:
• ${caseItem.title}
• ${caseItem.desc}
• Qonun: ${caseItem.law}

Eslatma: Jinoyatni oching, guvohlarni so'roq qiling va dalillarni tahlil qiling.`,
      INVESTIGATOR: `SIZNING ROLINGIZ: TERGOVCHI

Vazifangiz:
• Tergov harakatlarini olib borish
• Dalillarni sinchiklab tekshirish
• Jinoyatning to'liq manzarasini tiklash

Ish haqida ma'lumot:
• ${caseItem.title}
• ${caseItem.desc}
• Qonun: ${caseItem.law}

Eslatma: Tergovni olib boring, dalillarni tahlil qiling va jinoyatni to'liq oching.`,
      MASLAHATCHI: `SIZNING ROLINGIZ: HUQUQIY MASLAHATCHI

Vazifangiz:
• Mijozga huquqiy maslahat berish
• Shartnoma shartlarini tahlil qilish
• Kelishuvga erishishga yordam berish

Ish haqida ma'lumot:
• ${caseItem.title}
• ${caseItem.desc}
• Qonun: ${caseItem.law}

Eslatma: Mijoz bilan muzokara qiling, huquqiy maslahat bering va kelishuvga erishing.`,
      MEDIATOR: `SIZNING ROLINGIZ: MEDIATOR

Vazifangiz:
• Tomonlar o'rtasida kelishuvga erishish
• Muzokaralarni boshqarish
• O'zaro manfaatli yechim topish

Ish haqida ma'lumot:
• ${caseItem.title}
• ${caseItem.desc}
• Qonun: ${caseItem.law}

Eslatma: Tomonlarni tinglang, ularga kelishuvga erishishga yordam bering va nizoni hal qiling.`,
    }
    return briefings[roleUpper] || `Sizning rolingiz: ${role.title}. Ish: ${caseItem.title}.`
  }

  // ── Show AI roles SEQUENTIALLY (one by one with delay) ──
  const addMultiRoleMessages = async (
    rolesData: { speaker: string; role: string; text: string }[]
  ) => {
    const titleMap: Record<string, string> = {
      SUDYA: 'Sudya',
      PROKUROR: 'Prokuror',
      ADVOKAT: 'Advokat',
      SUDLANUVCHI: 'Sudlanuvchi',
      KOTIBA: 'Kotiba',
      "DA'VOGAR": "Da'vogar",
      JAVOBGAR: 'Javobgar',
    }

    // Show each role one at a time with a delay
    for (let i = 0; i < rolesData.length; i++) {
      const r = rolesData[i]
      const normalizedRole = r.role === role.id.toUpperCase() ? 'user' : 'judge'
      addMsg(r.text, normalizedRole as Msg['role'], titleMap[r.role] || r.role, 'ruling')

      // Update active participant
      setParticipants(prev => prev.map(p => ({ ...p, active: p.role === r.role })))

      // Delay between roles (2 seconds, except for last one)
      if (i < rolesData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }

  // ── Start ──
  const startSession = async () => {
    setPage('session')
    setMsgs([])
    setScore({ etiquette: 100, argument: 0, evidence: 0 })
    setStressLevel(0)
    setTime(simType.id === 'court' ? 600 : 300)
    setLoading(true)
    setParticipants(getParticipants())
    // Show role briefing as first message
    addMsg(getRoleBriefing(), 'judge', '📋 Brifing', 'ruling')
    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          action: 'start',
          caseDetails: getCasePrompt(),
          userRole: role.id.toUpperCase(),
          userName: userName || role.title,
          ...getUserIdentityPayload(),
        }),
      })
      const data = await res.json()
      setSimId(data.simulation_id || 'vc_' + Date.now())
      const roles = data.roles || []
      if (roles.length > 0) {
        await addMultiRoleMessages(roles)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Tarmoq xatoligi'
      addMsg(
        'Xatolik yuz berdi: ' +
          errorMsg +
          ". Iltimos, internet ulanishini tekshirib, qayta urinib ko'ring.",
        'judge',
        'AI',
        'ruling'
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Submit ──
  const submit = useCallback(
    async (override?: string, type: Msg['type'] = 'statement') => {
      const txt = (override ?? input).trim()
      if (!txt || loading) return
      addMsg(txt, 'user', role.title, type)
      setInput('')
      setScore(s => ({
        ...s,
        argument: Math.min(100, s.argument + 12),
        evidence: type === 'evidence' ? Math.min(100, s.evidence + 15) : s.evidence,
      }))
      // Reduce stress
      setStressLevel(s => Math.max(0, s - 5))
      setLoading(true)

      try {
        const res = await fetch('/api/court-simulator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
          body: JSON.stringify({
            action: 'submit_argument',
            simulationId: simId,
            argument: `${role.title} (${type}): ${txt}`,
            userRole: role.id.toUpperCase(),
            userName: userName || role.title,
            ...getUserIdentityPayload(),
          }),
        })
        const data = await res.json()
        const roles = data.roles || []
        if (roles.length > 0) {
          await addMultiRoleMessages(roles)
          const allText = roles.map((r: { text?: string }) => r.text).join(' ')
          if (allText.toLowerCase().includes('xato') || allText.toLowerCase().includes("e'tiroz")) {
            setStressLevel(s => Math.min(100, s + 15))
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Tarmoq xatoligi'
        addMsg('Xatolik: ' + errorMsg, 'judge', 'AI', 'ruling')
      } finally {
        setLoading(false)
        // Voice loop: if was using voice, restart mic after AI responds
        if (voiceModeRef.current && !override) {
          setTimeout(() => {
            if (!loading && !listening) {
              startMic()
            }
          }, 500)
        }
      }
    },
    [input, loading, role, simId, simType, msgs, userName, listening, startMic]
  )

  // ── End ──
  const endSession = async () => {
    setLoading(true)
    const total = Math.round((score.etiquette + score.argument + score.evidence) / 3)
    const xpGain = Math.round(total * 1.5 + Math.max(0, 100 - stressLevel) * 0.5)
    const newXp = totalXp + xpGain
    setTotalXp(newXp)
    try {
      localStorage.setItem('virtual_court_xp', String(newXp))
    } catch {}

    try {
      const res = await fetch('/api/court-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({
          action: 'get_verdict',
          simulationId: simId,
          userRole: role.id.toUpperCase(),
          ...getUserIdentityPayload(),
        }),
      })
      const data = await res.json()
      const roles = data.roles || []
      if (roles.length > 0) {
        await addMultiRoleMessages(roles)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Tarmoq xatoligi'
      console.error('Verdict error:', errorMsg)
    } finally {
      setLoading(false)
    }

    let achievements: string[] = []
    if (total >= 80) achievements = ['Yuridik aniqlik', 'Professional', 'Mukammal nutq']
    else if (total >= 60) achievements = ['Yaxshi urinish', 'Bilimli']
    else if (total >= 40) achievements = ['Qatnashchi']
    else achievements = ['Yangi boshlovchi']
    if (stressLevel < 30) achievements.push('Sovuq qonli')
    if (score.evidence >= 70) achievements.push('Dalil ustasi')
    if (score.argument >= 70) achievements.push('Argument ustasi')
    if (xpGain >= 100) achievements.push('XP rekordi')

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
    })
    setTimeout(() => setPage('verdict'), 1500)
  }

  const total = Math.round((score.etiquette + score.argument + score.evidence) / 3)

  // ════════════════════════════════════════════════════════
  // SELECTION SCREEN
  // ════════════════════════════════════════════════════════
  if (page === 'select')
    return (
      <div className="mobile-safe-top min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="flex-col md:flex-row" style={{ display: 'flex' }}>
          <aside
            className="hidden lg:block"
            style={{
              width: 240,
              background: 'var(--card-bg)',
              borderRight: '1px solid var(--card-border)',
              minHeight: '100vh',
              padding: '24px 16px',
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#6B7280',
                textDecoration: 'none',
                fontSize: 14,
                marginBottom: 24,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <ArrowLeft size={16} /> Orqaga
            </button>
            <FeatureInstructions
              featureName="Virtual Sud"
              steps={[
                {
                  title: 'Ishni tanlang',
                  description:
                    "Tayyor ish shablonlaridan birini tanlang yoki o'zingizning ishingizni kiriting.",
                  icon: '📋',
                },
                {
                  title: 'Rolni tanlang',
                  description:
                    'Sudya, prokuror, advokat yoki sudlanuvchi rolini tanlang. Siz tanlagan roldan foydalaning.',
                  icon: '👤',
                },
                {
                  title: 'Ovoz bilan gapiring',
                  description:
                    'Mikrofon tugmasini bosib ovozli gapiring. AI barcha rollar nomidan javob beradi.',
                  icon: '🎙️',
                },
                {
                  title: 'Hukm chiqaring',
                  description:
                    "Sud jarayoni tugagach, hukm chiqaring yoki AI tomonidan baholashni so'ring.",
                  icon: '⚖️',
                },
              ]}
              tips={[
                "Har bir foydalanuvchi o'z roli bilan gaplashadi",
                'AI boshqa rollar nomidan real javob beradi',
                'Sessiya tugagach ball va tahlil olishingiz mumkin',
              ]}
            />
            <div
              style={{
                background: '#EDE9FE',
                borderRadius: 12,
                padding: 14,
                border: '1px solid #DDD6FE',
              }}
            >
              <p style={{ fontWeight: 700, color: '#6D28D9', fontSize: 14, margin: '0 0 4px' }}>
                Virtual Sud
              </p>
              <p style={{ fontSize: 12, color: '#7C3AED', margin: 0 }}>
                AI bilan ovozli simulyatsiya
              </p>
            </div>
            <div
              style={{
                marginTop: 16,
                padding: '14px 12px',
                background: '#FFFBEB',
                borderRadius: 12,
                border: '1px solid #FDE68A',
                textAlign: 'center',
              }}
            >
              {/* Display total XP */}
              <p style={{ fontSize: 10, color: '#92400E', margin: '0 0 4px' }}>Umumiy XP</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B', margin: 0 }}>
                {totalXp}
              </p>
            </div>
            {speechReady && (
              <div
                style={{
                  marginTop: 16,
                  background: '#F0FDF4',
                  borderRadius: 12,
                  padding: 12,
                  border: '1px solid #BBF7D0',
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: '#15803D',
                    fontWeight: 600,
                    margin: '0 0 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Mic size={14} /> Mikrofon
                </p>
                <p style={{ fontSize: 11, color: '#16A34A', margin: 0 }}>
                  Mikrofon orqali gapirishingiz mumkin (Chrome/Edge). Ovozli kiritish uchun pastdagi
                  mikrofon belgisini bosing.
                </p>
              </div>
            )}
            <div
              style={{
                marginTop: 16,
                background: '#FEF2F2',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #FECACA',
              }}
            >
              <p style={{ fontSize: 12, color: '#991B1B', fontWeight: 600, margin: '0 0 4px' }}>
                XP tizimi
              </p>
              <p style={{ fontSize: 11, color: '#B91C1C', margin: 0 }}>
                Har bir simulyatsiya uchun XP olasiz. Yutuqlar to'plang!
              </p>
            </div>
          </aside>

          <div className="p-6 md:p-10" style={{ flex: 1 }}>
            <h1
              className="text-gray-900 dark:text-white"
              style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}
            >
              Virtual Sud Simulyatori
            </h1>
            <p
              className="text-gray-500 dark:text-zinc-400"
              style={{ fontSize: 14, margin: '0 0 32px' }}
            >
              Simulyatsiya turi, roli va ishni tanlang — AI bilan interaktiv huquqiy amaliyot
            </p>

            <style>{`@media(min-width:768px){.vc-grid-types{grid-template-columns:repeat(3,1fr)!important}.vc-grid-roles{grid-template-columns:repeat(3,1fr)!important}.vc-grid-cases{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:639px){.vc-grid-types{grid-template-columns:1fr!important}.vc-grid-roles{grid-template-columns:1fr!important}.vc-grid-cases{grid-template-columns:1fr!important}}`}</style>

            {/* 1. Sim type */}
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>
              1. Simulyatsiya turini tanlang
            </h2>
            <div
              className="vc-grid-types"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2,1fr)',
                gap: 12,
                marginBottom: 28,
              }}
            >
              {SIM_TYPES.map(st => {
                const isActive = simType.id === st.id
                const icons: Record<string, React.ReactNode> = {
                  court: <Gavel size={20} />,
                  negotiation: <MessageCircle size={20} />,
                  investigation: <Search size={20} />,
                }
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      setSimType(st)
                      setRole(st.roles[0])
                      setCase(st.cases[0])
                    }}
                    style={{
                      padding: 18,
                      borderRadius: 14,
                      border: `2px solid ${isActive ? st.color : '#E5E7EB'}`,
                      background: isActive ? st.bg : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        background: st.bg,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: st.color,
                        marginBottom: 8,
                      }}
                    >
                      {icons[st.id]}
                    </div>
                    <p
                      className="text-gray-900 dark:text-white"
                      style={{ fontWeight: 700, fontSize: 15, margin: '0 0 2px' }}
                    >
                      {st.title}
                    </p>
                    <p
                      className="text-gray-500 dark:text-zinc-400"
                      style={{ fontSize: 12, margin: 0 }}
                    >
                      {st.desc}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* 2. Role */}
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>
              2. Rolingizni tanlang
            </h2>
            <div
              className="vc-grid-roles"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2,1fr)',
                gap: 12,
                marginBottom: 28,
              }}
            >
              {simType.roles.map(r => {
                const isActive = role.id === r.id
                const roleIcons: Record<string, React.ReactNode> = {
                  advokat: <Scale size={20} />,
                  prokuror: <Gavel size={20} />,
                  sudya: <Users size={20} />,
                  consultant: <Scale size={20} />,
                  mediator: <Users size={20} />,
                  detective: <Search size={20} />,
                  investigator: <Scale size={20} />,
                }
                return (
                  <button
                    key={r.id}
                    onClick={() => setRole(r)}
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      border: `2px solid ${isActive ? simType.color : '#E5E7EB'}`,
                      background: isActive ? simType.bg : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        background: simType.bg,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: simType.color,
                        marginBottom: 6,
                      }}
                    >
                      {roleIcons[r.id] || <Users size={18} />}
                    </div>
                    <p
                      style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: '0 0 2px' }}
                    >
                      {r.title}
                    </p>
                    <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{r.sub}</p>
                  </button>
                )
              })}
            </div>

            {/* 3. Case */}
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>
              3. Ishni tanlang
            </h2>
            <div
              className="vc-grid-cases"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2,1fr)',
                gap: 12,
                marginBottom: 32,
              }}
            >
              {simType.cases.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCase(c)}
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    border: `2px solid ${caseItem.id === c.id ? '#2563EB' : '#E5E7EB'}`,
                    background: caseItem.id === c.id ? '#EFF6FF' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 5,
                    }}
                  >
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0 }}>
                      {c.title}
                    </p>
                    <span
                      style={{
                        fontSize: 10,
                        background: simType.bg,
                        color: simType.color,
                        padding: '2px 8px',
                        borderRadius: 20,
                      }}
                    >
                      {c.level}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 8px' }}>{c.desc}</p>
                  <span
                    style={{
                      fontSize: 11,
                      background: '#DBEAFE',
                      color: '#1D4ED8',
                      padding: '2px 8px',
                      borderRadius: 20,
                    }}
                  >
                    {c.law}
                  </span>
                </button>
              ))}
            </div>

            {/* Features section from simulator */}
            <div
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 20,
                border: '1px solid #E5E7EB',
                marginBottom: 32,
              }}
            >
              <p style={{ fontWeight: 700, fontSize: 14, color: '#374151', margin: '0 0 16px' }}>
                Xususiyatlar
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                {[
                  {
                    icon: <Users size={16} color="#2563EB" />,
                    title: 'AI Personajlar',
                    desc: 'Real AI javoblar',
                  },
                  {
                    icon: <Clock size={16} color="#059669" />,
                    title: 'Vaqt chegarasi',
                    desc: '5-10 daqiqa',
                  },
                  {
                    icon: <AlertTriangle size={16} color="#D97706" />,
                    title: 'Stress metr',
                    desc: 'Hissiy intellekt',
                  },
                  {
                    icon: <Award size={16} color="#7C3AED" />,
                    title: 'XP va yutuqlar',
                    desc: 'Har bir session uchun',
                  },
                  {
                    icon: <Mic size={16} color="#0891B2" />,
                    title: 'Ovozli kiritish',
                    desc: 'uz-UZ tilida',
                  },
                  {
                    icon: <Star size={16} color="#DC2626" />,
                    title: 'Baholash',
                    desc: '3 mezonda',
                  },
                ].map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      background: '#F9FAFB',
                      borderRadius: 10,
                      padding: '10px 12px',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        background: '#fff',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      }}
                    >
                      {f.icon}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 12, color: '#111827', margin: 0 }}>
                        {f.title}
                      </p>
                      <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={startSession}
              style={{
                padding: '13px 36px',
                background: simType.color,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minHeight: 48,
              }}
            >
              <Play size={18} /> Simulyatsiyani boshlash
            </button>
          </div>
        </div>
      </div>
    )

  // ════════════════════════════════════════════════════════
  // SESSION SCREEN
  // ════════════════════════════════════════════════════════
  if (page === 'session')
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0F172A',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <header
          style={{
            background: 'rgba(0,0,0,0.6)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => setPage('select')}
              style={{
                padding: 8,
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>
                {simType.title}: {caseItem.title}
              </p>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                {role.title} · {role.sub}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Stress Meter */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 10px',
                background: stressLevel > 60 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <AlertTriangle size={12} color={stressLevel > 60 ? '#F87171' : '#FBBF24'} />
              <span style={{ fontSize: 12, color: stressLevel > 60 ? '#F87171' : '#FBBF24' }}>
                Stress: {stressLevel}%
              </span>
            </div>
            {/* Timer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                background: time < 60 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <Clock size={14} color={time < 60 ? '#F87171' : '#94A3B8'} />
              <span
                style={{ fontWeight: 700, fontSize: 14, color: time < 60 ? '#F87171' : '#fff' }}
              >
                {fmt(time)}
              </span>
            </div>
            <button
              onClick={endSession}
              style={{
                padding: '7px 16px',
                background: 'rgba(239,68,68,0.7)',
                border: '1px solid #EF4444',
                borderRadius: 10,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Tugatish
            </button>
          </div>
        </header>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'row' }}>
          {/* Score panel */}
          <aside
            className="hidden md:block"
            style={{
              width: 180,
              background: 'rgba(0,0,0,0.4)',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              padding: 14,
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 10px',
              }}
            >
              Baholash
            </p>
            {[
              { l: 'Etika', v: score.etiquette, c: '#22C55E' },
              { l: 'Argument', v: score.argument, c: '#3B82F6' },
              { l: 'Dalillar', v: score.evidence, c: '#A855F7' },
            ].map(b => (
              <div key={b.l} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    marginBottom: 3,
                  }}
                >
                  <span style={{ color: '#CBD5E1' }}>{b.l}</span>
                  <span style={{ fontWeight: 700, color: b.c }}>{b.v}%</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                  <div
                    style={{
                      height: 4,
                      width: `${b.v}%`,
                      background: b.c,
                      borderRadius: 2,
                      transition: 'width 0.4s',
                    }}
                  />
                </div>
              </div>
            ))}
            {/* Stress bar */}
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '12px 0 10px',
              }}
            >
              Stress
            </p>
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  marginBottom: 3,
                }}
              >
                <span style={{ color: '#CBD5E1' }}>Daraja</span>
                <span style={{ fontWeight: 700, color: stressLevel > 60 ? '#EF4444' : '#FBBF24' }}>
                  {stressLevel}%
                </span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <div
                  style={{
                    height: 4,
                    width: `${stressLevel}%`,
                    background: stressLevel > 60 ? '#EF4444' : '#FBBF24',
                    borderRadius: 2,
                    transition: 'width 0.4s',
                  }}
                />
              </div>
            </div>
            {/* Total */}
            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: 'rgba(124,58,237,0.15)',
                borderRadius: 12,
                border: '1px solid rgba(124,58,237,0.3)',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 10, color: '#A78BFA', margin: '0 0 2px' }}>Umumiy</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>{total}</p>
            </div>
          </aside>

          {/* Participants panel */}
          <aside
            className="hidden sm:block"
            style={{
              width: 130,
              background: 'rgba(0,0,0,0.3)',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              padding: '14px 10px',
              flexShrink: 0,
              overflowY: 'auto',
            }}
          >
            <p
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 10px',
                textAlign: 'center',
              }}
            >
              Qatnashchilar
            </p>
            {participants.map(p => {
              const colors: Record<string, string> = {
                SUDYA: '#A78BFA',
                PROKUROR: '#F87171',
                ADVOKAT: '#60A5FA',
                SUDLANUVCHI: '#FBBF24',
                KOTIBA: '#34D399',
                "DA'VOGAR": '#818CF8',
                JAVOBGAR: '#FB923C',
              }
              return (
                <div
                  key={p.role}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    padding: '8px 4px',
                    marginBottom: 4,
                    borderRadius: 10,
                    background: p.isUser
                      ? 'rgba(37,99,235,0.25)'
                      : p.active
                        ? 'rgba(255,255,255,0.08)'
                        : 'transparent',
                    border: p.isUser
                      ? '1px solid rgba(37,99,235,0.5)'
                      : p.active
                        ? '1px solid rgba(255,255,255,0.15)'
                        : '1px solid transparent',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: p.isUser ? 700 : 500,
                      color: p.active
                        ? colors[p.role] || '#CBD5E1'
                        : p.isUser
                          ? '#93C5FD'
                          : '#64748B',
                      textAlign: 'center',
                    }}
                  >
                    {p.title}
                  </span>
                  {p.isUser && (
                    <span
                      style={{
                        fontSize: 7,
                        background: '#2563EB',
                        color: '#fff',
                        padding: '1px 6px',
                        borderRadius: 8,
                      }}
                    >
                      Siz
                    </span>
                  )}
                </div>
              )
            })}
          </aside>

          {/* Chat area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              <div
                style={{
                  maxWidth: 760,
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {msgs.map(m => {
                  const isUser = m.role === 'user'
                  const bg: Record<string, string> = {
                    ruling: 'rgba(124,58,237,0.12)',
                    objection: 'rgba(239,68,68,0.12)',
                    evidence: 'rgba(168,85,247,0.12)',
                    question: 'rgba(59,130,246,0.12)',
                    statement: 'rgba(255,255,255,0.05)',
                  }
                  const bd: Record<string, string> = {
                    ruling: 'rgba(124,58,237,0.35)',
                    objection: 'rgba(239,68,68,0.35)',
                    evidence: 'rgba(168,85,247,0.35)',
                    question: 'rgba(59,130,246,0.35)',
                    statement: 'rgba(255,255,255,0.1)',
                  }
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        justifyContent: isUser ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '78%',
                          padding: '11px 15px',
                          borderRadius: isUser ? '14px 14px 3px 14px' : '3px 14px 14px 14px',
                          background: isUser ? 'rgba(37,99,235,0.4)' : bg[m.type] || bg.statement,
                          border: `1px solid ${isUser ? 'rgba(37,99,235,0.5)' : bd[m.type] || bd.statement}`,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 11,
                            color: '#94A3B8',
                            margin: '0 0 4px',
                            fontWeight: 600,
                          }}
                        >
                          {m.speaker}
                        </p>
                        <p
                          style={{
                            fontSize: 14,
                            lineHeight: 1.6,
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {m.text}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {loading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(124,58,237,0.12)',
                        border: '1px solid rgba(124,58,237,0.3)',
                        borderRadius: '3px 14px 14px 14px',
                        display: 'flex',
                        gap: 5,
                      }}
                    >
                      {[0, 150, 300].map(d => (
                        <div
                          key={d}
                          style={{
                            width: 8,
                            height: 8,
                            background: '#A78BFA',
                            borderRadius: '50%',
                            animation: `bob 1s ${d}ms infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Input */}
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.4)',
                padding: '14px 24px',
              }}
            >
              <div style={{ maxWidth: 760, margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  {[
                    {
                      icon: <AlertTriangle size={12} />,
                      label: "E'tiroz",
                      txt: "E'tiroz bildiraman! Bu dalil qonunga zid.",
                      type: 'objection' as const,
                    },
                    {
                      icon: <FileText size={12} />,
                      label: 'Dalil',
                      txt: 'Hujjatli dalil taqdim etaman.',
                      type: 'evidence' as const,
                    },
                    {
                      icon: <MessageCircle size={12} />,
                      label: 'Savol',
                      txt: 'Aniq savol: voqeani tushuntirib bering.',
                      type: 'question' as const,
                    },
                  ].map((a, i) => (
                    <button
                      key={i}
                      onClick={() => submit(a.txt, a.type)}
                      disabled={loading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '6px 13px',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.13)',
                        borderRadius: 20,
                        color: '#CBD5E1',
                        fontSize: 12,
                        cursor: loading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {a.icon} {a.label}
                    </button>
                  ))}
                </div>

                {listening && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 14px',
                      background: 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.4)',
                      borderRadius: 10,
                      marginBottom: 10,
                    }}
                  >
                    {/* Voice visualization bars — real VU meter via audioLevel */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24 }}>
                      {Array.from({ length: 7 }).map((_, i) => {
                        // Har bir bar uchun individual balandlik — audioLevel asosida
                        const center = (audioLevel / 100) * 20
                        const spread = (audioLevel / 100) * 8
                        const barH = Math.max(
                          3,
                          Math.min(
                            22,
                            center + spread * Math.sin((i * Math.PI) / 3 + Date.now() / 300)
                          )
                        )
                        const opacity = Math.max(0.3, audioLevel / 100 + 0.2)
                        return (
                          <div
                            key={i}
                            style={{
                              width: 4,
                              height: barH,
                              background:
                                audioLevel > 60
                                  ? '#EF4444'
                                  : audioLevel > 30
                                    ? '#FBBF24'
                                    : '#60A5FA',
                              borderRadius: 3,
                              opacity,
                              transition: 'height 0.08s ease, opacity 0.15s ease',
                              boxShadow: `0 0 ${audioLevel > 50 ? '4px' : '1px'} ${audioLevel > 60 ? 'rgba(239,68,68,0.5)' : 'rgba(96,165,250,0.3)'}`,
                            }}
                          />
                        )
                      })}
                    </div>
                    <span style={{ fontSize: 13, color: '#FCA5A5' }}>Tinglanmoqda... gapiring</span>
                    <button
                      onClick={stopMic}
                      style={{
                        marginLeft: 'auto',
                        padding: '2px 10px',
                        background: '#EF4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      To'xtat
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        submit()
                      }
                    }}
                    disabled={loading}
                    rows={2}
                    placeholder={`${role.title} sifatida nutq yoki argument kiriting...`}
                    style={{
                      flex: 1,
                      padding: '11px 15px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.13)',
                      borderRadius: 12,
                      color: '#F1F5F9',
                      fontSize: 14,
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                  {speechReady && (
                    <button
                      onClick={listening ? stopMic : startMic}
                      style={{
                        padding: '0 15px',
                        borderRadius: 12,
                        border: 'none',
                        cursor: 'pointer',
                        background: listening ? '#EF4444' : 'rgba(255,255,255,0.1)',
                        color: '#fff',
                      }}
                      title={listening ? "To'xtatish" : 'Ovozli kiritish'}
                    >
                      <Mic size={17} />
                    </button>
                  )}
                  <button
                    onClick={() => submit()}
                    disabled={loading || !input.trim()}
                    style={{
                      padding: '0 18px',
                      borderRadius: 12,
                      border: 'none',
                      cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                      background: loading || !input.trim() ? 'rgba(37,99,235,0.3)' : '#2563EB',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {loading ? (
                      <div
                        style={{
                          width: 17,
                          height: 17,
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTop: '2px solid #fff',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                    ) : (
                      <Send size={17} />
                    )}
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
    )

  // ════════════════════════════════════════════════════════
  // VERDICT SCREEN — merged Virtual Court + Simulator styles
  // ════════════════════════════════════════════════════════
  if (!results) return null
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FAFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 22,
          boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
          maxWidth: 560,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg,${simType.color},#7C3AED)`,
            padding: '32px 28px',
            textAlign: 'center',
          }}
        >
          <Award size={48} color="#fff" />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '12px 0 4px' }}>
            Simulyatsiya Yakunlandi
          </h1>
          <p style={{ fontSize: 13, color: '#BFDBFE', margin: 0 }}>
            {role.title} · {caseItem.title}
          </p>
        </div>
        <div style={{ padding: 28 }}>
          {/* Score grid — 3 columns from Virtual Court + 3 from Simulator */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 10,
              marginBottom: 16,
            }}
          >
            {[
              { l: 'Sud etikasi', v: results.etiquette, c: '#22C55E' },
              { l: 'Argument', v: results.argument, c: '#3B82F6' },
              { l: 'Dalillar', v: results.evidence, c: '#A855F7' },
            ].map(b => (
              <div
                key={b.l}
                style={{
                  background: '#F8FAFF',
                  borderRadius: 12,
                  padding: 12,
                  textAlign: 'center',
                  border: '1px solid #E5E7EB',
                }}
              >
                <p style={{ fontSize: 20, fontWeight: 800, color: b.c, margin: '0 0 2px' }}>
                  {b.v}%
                </p>
                <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{b.l}</p>
              </div>
            ))}
          </div>
          {/* Simulator-style score grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3,1fr)',
              gap: 10,
              marginBottom: 20,
            }}
          >
            {[
              { l: 'Yuridik aniqlik', v: results.legalAccuracy, c: '#2563EB' },
              { l: 'Etika', v: results.ethics, c: '#059669' },
              { l: 'Ishonch', v: results.confidence, c: '#7C3AED' },
            ].map(b => (
              <div
                key={b.l}
                style={{
                  background: '#F9FAFB',
                  borderRadius: 12,
                  padding: 12,
                  textAlign: 'center',
                  border: '1px solid #E5E7EB',
                }}
              >
                <TrendingUp size={16} color={b.c} style={{ margin: '0 auto 4px' }} />
                <p style={{ fontSize: 18, fontWeight: 800, color: b.c, margin: 0 }}>
                  {Math.round(b.v)}%
                </p>
                <p style={{ fontSize: 10, color: '#6B7280', margin: 0 }}>{b.l}</p>
              </div>
            ))}
          </div>
          {/* Total score + XP */}
          <div
            style={{
              background: 'linear-gradient(135deg,#EFF6FF,#F5F3FF)',
              borderRadius: 14,
              padding: 18,
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px' }}>Umumiy ball</p>
            <p style={{ fontSize: 42, fontWeight: 900, color: simType.color, margin: '0 0 8px' }}>
              {results.totalScore}/100
            </p>
            <div style={{ background: '#E5E7EB', borderRadius: 4, height: 7 }}>
              <div
                style={{
                  height: 7,
                  width: `${results.totalScore}%`,
                  background: `linear-gradient(90deg,${simType.color},#7C3AED)`,
                  borderRadius: 4,
                }}
              />
            </div>
            <p style={{ fontSize: 13, color: '#374151', margin: '8px 0 0', fontWeight: 600 }}>
              {results.totalScore >= 80 ? (
                <>
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 inline mr-1" />
                  A'lo! Professional darajasi.
                </>
              ) : results.totalScore >= 60 ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500 inline mr-1" />
                  Yaxshi. Davom eting.
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 text-blue-500 inline mr-1" />
                  Mashq qiling.
                </>
              )}
            </p>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 16 }}>
              <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '6px 16px' }}>
                <span style={{ fontSize: 11, color: '#92400E' }}>XP qo'shildi: </span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>
                  +{results.xpEarned}
                </span>
              </div>
              <div style={{ background: '#EDE9FE', borderRadius: 10, padding: '6px 16px' }}>
                <span style={{ fontSize: 11, color: '#6D28D9' }}>Jami XP: </span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#7C3AED' }}>{totalXp}</span>
              </div>
            </div>
          </div>
          {/* Achievements */}
          {results.achievements.length > 0 && (
            <div
              style={{
                background: '#FFFBEB',
                borderRadius: 12,
                padding: 14,
                marginBottom: 20,
                border: '1px solid #FDE68A',
              }}
            >
              <p style={{ fontWeight: 700, fontSize: 13, color: '#92400E', margin: '0 0 8px' }}>
                ⭐ Yutuqlar
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {results.achievements.map((a, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '4px 12px',
                      background: '#FDE68A',
                      color: '#92400E',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                // Export transcript as .txt
                const header = `=== VIRTUAL SUD SIMULYATSIYASI ===\nIsh: ${caseItem.title}\nRol: ${role.title}\nSana: ${new Date().toLocaleDateString('uz-UZ')}\n\n`
                const body = msgs
                  .map(
                    m =>
                      `[${m.speaker.toUpperCase()}] (${new Date(m.timestamp).toLocaleTimeString('uz-UZ')}): ${m.text}`
                  )
                  .join('\n\n')
                const footer = `\n\n=== XULOSA ===\nUmumiy ball: ${results?.totalScore}/100\nXP: +${results?.xpEarned}\n`
                const blob = new Blob([header + body + footer], {
                  type: 'text/plain;charset=utf-8',
                })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `virtual-sud-${Date.now()}.txt`
                a.click()
                URL.revokeObjectURL(url)
              }}
              style={{
                padding: '12px 16px',
                background: '#059669',
                color: '#fff',
                border: 'none',
                borderRadius: 11,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: 48,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              📥 Yuklab olish
            </button>
            <button
              onClick={() => {
                setPage('select')
                setMsgs([])
                setResults(null)
              }}
              style={{
                flex: 1,
                padding: 12,
                background: simType.color,
                color: '#fff',
                border: 'none',
                borderRadius: 11,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: 48,
              }}
            >
              Yangi simulyatsiya
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                flex: 1,
                padding: 12,
                background: '#F3F4F6',
                color: '#374151',
                borderRadius: 11,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                textAlign: 'center',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 48,
              }}
            >
              Bosh sahifa
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:639px){.vc-grid-types,.vc-grid-roles,.vc-grid-cases{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}
