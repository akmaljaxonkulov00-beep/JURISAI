'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useAuth } from '@/services/auth'
import { getUserIdentityPayload } from '@/lib/client-user'

interface Scenario {
  id: string
  scenario_type: string
  title: string
  description: string
  difficulty_level: string
  complexity: string
  participants: Array<{
    id: string
    name: string
    role: string
    description: string
    objectives: string[]
    background: string
    personality_traits: string[]
  }>
  case_data: {
    subject: string
    background: string
    key_issue: string
    additional_facts?: string[]
    complications?: string[]
  }
  objectives: Array<{
    id: string
    description: string
    priority: string
    success_criteria: string[]
    legal_references: string[]
  }>
  legal_references: string[]
  estimated_duration: number
  ai_generated: boolean
  status: string
  created_at: string
}

interface CreateScenarioRequest {
  scenario_type: string
  difficulty_level: string
  complexity: string
  participants_count: number
  focus_areas: string[]
  duration_minutes: number
}

export default function ScenarioGenerator() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('create')
  const [scenarioType, setScenarioType] = useState('civil')
  const [difficultyLevel, setDifficultyLevel] = useState('intermediate')
  const [complexity, setComplexity] = useState('standard')
  const [participantsCount, setParticipantsCount] = useState(3)
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [duration, setDuration] = useState(45)
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  interface ScenarioTemplateRow {
    id: string
    title: string
    description: string
    scenario_type: string
    difficulty_level: string
    complexity?: string
    estimated_duration?: number
    participants_count?: number
  }
  const [templates, setTemplates] = useState<ScenarioTemplateRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadScenarios()
    }
    loadTemplates()
  }, [user])

  const typeLabel = (t: string): string => {
    switch (t) {
      case 'civil':
        return "Fuqarolik huquqi (shartnoma, mulk, to'lov nizolari)"
      case 'criminal':
        return "Jinoyat huquqi (o'g'irlik, firibgarlik, jinoyat ishi)"
      case 'family':
        return 'Oila huquqi (ajralish, aliment, vorislik)'
      case 'labor':
        return "Mehnat huquqi (ishdan bo'shatish, ish haqi, mehnat shartnomasi)"
      case 'administrative':
        return "Ma'muriy javobgarlik (jarimalar, litsenziyalar)"
      default:
        return 'Huquqiy masala'
    }
  }

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/scenario-generator/templates')
      const data = await res.json()
      if (data && Array.isArray(data.templates)) {
        const mapped = data.templates.map(
          (t: {
            id?: string
            name?: string
            description?: string
            scenario_type?: string
            difficulty_level?: string
            complexity?: string
            duration_minutes?: number
            participants_count?: number
          }) => ({
            id: t.id || 'template_' + Math.random().toString(36).slice(2, 8),
            title: t.name || 'Senariy shabloni',
            description: t.description || '',
            scenario_type: t.scenario_type || 'civil',
            difficulty_level:
              t.difficulty_level === 'easy'
                ? 'beginner'
                : t.difficulty_level === 'medium'
                  ? 'intermediate'
                  : t.difficulty_level === 'hard'
                    ? 'advanced'
                    : t.difficulty_level || 'intermediate',
            complexity: t.complexity || 'standard',
            estimated_duration: t.duration_minutes || 45,
            participants_count: t.participants_count || 3,
          })
        )
        setTemplates(mapped)
      }
    } catch (err) {
      console.error('Templates loading error:', err)
    }
  }

  const loadScenarios = async () => {
    // 1) Supabase'dan REAL saqlangan senariylar (boshqa qurilmada ham ko'rinadi)
    try {
      const res = await fetch('/api/scenario-generator/scenarios')
      if (res.ok) {
        const json = await res.json()
        if (Array.isArray(json.scenarios)) {
          setScenarios(json.scenarios)
          return
        }
      }
    } catch (err) {
      console.error('Scenarios API loading error:', err)
    }
    // 2) Fallback: localStorage
    try {
      const stored = localStorage.getItem('generated_scenarios')
      if (stored) {
        setScenarios(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Scenarios loading error:', error)
    }
  }

  const saveScenario = async (scenario: Scenario) => {
    const updated = [scenario, ...scenarios]
    setScenarios(updated)
    localStorage.setItem('generated_scenarios', JSON.stringify(updated))
    // Supabase'ga saqlash (session mavjud bo'lsa)
    try {
      await fetch('/api/scenario-generator/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: scenario }),
      })
    } catch (err) {
      console.error('Scenario API save error:', err)
    }
  }

  const parseScenarioResponse = (
    text: string,
    scenarioType: string,
    difficultyLevel: string,
    complexity: string,
    durationMinutes: number
  ): Scenario => {
    // AI qaytargan struktur javobni bo'limlarga ajratish:
    // **SENARIY NOMI:** / **KONTEKST:** / **TOMONLAR:** / **ASOSIY MUAMMO:**
    // **QO'SHIMCHA FAKTLAR:** / **QONUNIY ASOS:** / **MAQSADLAR:**
    const sections: Record<string, string> = {}
    let currentKey = ''
    text.split('\n').forEach(line => {
      const match = line.trim().match(/^\*\*(.+?)\*\*:?\s*$/)
      if (match) {
        currentKey = match[1].trim().toUpperCase()
        sections[currentKey] = ''
      } else if (currentKey) {
        sections[currentKey] += (sections[currentKey] ? '\n' : '') + line
      }
    })

    const getSection = (name: string): string =>
      Object.entries(sections)
        .find(([key]) => key.includes(name))?.[1]
        ?.trim() || ''

    const listItems = (section: string): string[] =>
      section
        .split('\n')
        .map(l => l.replace(/^[-•*\d.)]\s*/, '').trim())
        .filter(Boolean)

    // ── TOMONLAR: "- Prokuror: Akbar Toshmatov — ayblovni taqdim etadi" ──
    // yoki "- **Xurshid**: Biznesmen, mahsulot yetkazib beruvchi"
    const participants = listItems(getSection('TOMONLAR')).map((item, i) => {
      let role = ''
      let name = ''
      let desc = ''
      const boldMatch = item.match(/^\*\*(.+?)\*\*\s*:\s*(.*)$/)
      if (boldMatch) {
        name = boldMatch[1].trim()
        desc = boldMatch[2].trim()
      } else {
        const colonIdx = item.indexOf(':')
        if (colonIdx > 0) {
          role = item.slice(0, colonIdx).trim()
          const rest = item.slice(colonIdx + 1).trim()
          const [n, ...d] = rest.split(/[—–-]/)
          name = (n || '').trim()
          desc = d.join(' — ').trim() || rest
        } else {
          const [n, ...d] = item.split(/[—–-]/)
          name = (n || '').trim()
          desc = d.join(' — ').trim()
        }
      }
      return {
        id: 'p' + (i + 1),
        name: name || `Tomon ${i + 1}`,
        role: role || 'Ishtirokchi',
        description: desc,
        objectives: desc ? [desc] : [`${name || 'Ishtirokchi'} maqsadi`],
        background: '',
        personality_traits: [],
      }
    })

    const facts = listItems(getSection("QO'SHIMCHA FAKTLAR"))
    const refs = listItems(getSection('QONUNIY ASOS'))
    const objectives = listItems(getSection('MAQSADLAR'))
    const title = getSection('SENARIY NOMI') || `${typeLabel(scenarioType)} bo'yicha senariy`
    const kontekst = getSection('KONTEKST')
    const muammo = getSection('ASOSIY MUAMMO')

    return {
      id: 'scenario_' + Date.now(),
      scenario_type: scenarioType,
      title,
      description: (kontekst || text).slice(0, 300),
      difficulty_level: difficultyLevel,
      complexity,
      participants:
        participants.length > 0
          ? participants
          : [
              {
                id: 'p1',
                name: 'Tomon A',
                role: "Da'vogar",
                description: 'Ishtirokchi',
                objectives: ["O'z manfaatini himoya qilish"],
                background: '',
                personality_traits: [],
              },
              {
                id: 'p2',
                name: 'Tomon B',
                role: 'Javobgar',
                description: 'Ishtirokchi',
                objectives: ["O'z manfaatini himoya qilish"],
                background: '',
                personality_traits: [],
              },
            ],
      case_data: {
        subject: title,
        background: kontekst || text,
        key_issue: muammo || 'Asosiy huquqiy masala',
        additional_facts: facts,
        complications: facts.slice(0, 2),
      },
      objectives:
        objectives.length > 0
          ? objectives.map((desc, i) => ({
              id: 'obj' + (i + 1),
              description: desc,
              priority: i === 0 ? 'high' : 'medium',
              success_criteria: [desc + ' — amalga oshganini baholash'],
              legal_references: refs,
            }))
          : [
              {
                id: 'obj1',
                description: muammo || 'Asosiy masalani hal qilish',
                priority: 'high',
                success_criteria: ['Qonuniy yechim topilgan'],
                legal_references: refs,
              },
            ],
      legal_references: refs.length > 0 ? refs : ["O'zbekiston Respublikasi qonunlari"],
      estimated_duration: durationMinutes,
      ai_generated: true,
      status: 'completed',
      created_at: new Date().toISOString(),
    }
  }

  const handleGenerateScenario = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const topic = `${typeLabel(scenarioType)} mavzusida real hayotga mos huquqiy senariy`
      const res = await fetch('/api/scenario-generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          difficulty: difficultyLevel,
          focus_areas: focusAreas,
          ...getUserIdentityPayload(),
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Senariyo yaratishda xatolik yuz berdi')
      }

      const scenario = parseScenarioResponse(
        data.text || '',
        scenarioType,
        difficultyLevel,
        complexity,
        duration
      )

      setCurrentScenario(scenario)
      saveScenario(scenario)
      setActiveTab('scenario')
    } catch (err) {
      console.error('Scenario generation error:', err)
      setError(err instanceof Error ? err.message : 'Senariyo yaratishda xatolik yuz berdi')
    } finally {
      setIsGenerating(false)
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-orange-100 text-orange-800'
      case 'expert':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 dark:bg-zinc-800/30 text-gray-800 dark:text-zinc-200'
    }
  }

  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'simple':
        return 'bg-blue-100 text-blue-800'
      case 'standard':
        return 'bg-purple-100 text-purple-800'
      case 'complex':
        return 'bg-indigo-100 text-indigo-800'
      case 'expert':
        return 'bg-pink-100 text-pink-800'
      default:
        return 'bg-gray-100 dark:bg-zinc-800/30 text-gray-800 dark:text-zinc-200'
    }
  }

  const getScenarioTypeIcon = (type: string) => {
    switch (type) {
      case 'civil':
        return '▢'
      case 'criminal':
        return '═'
      case 'family':
        return '◉◉◉'
      case 'labor':
        return '▣'
      case 'administrative':
        return '◇'
      default:
        return '▣'
    }
  }

  const renderParticipant = (participant: {
    id: string
    name?: string
    role?: string
    description?: string
    objectives?: string[]
    background?: string
    personality_traits?: string[]
  }) => (
    <Card
      key={participant.id}
      className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl"
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-blue-900 text-lg">{participant.name}</CardTitle>
          <Badge className="bg-blue-100 text-blue-800">{participant.role}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 dark:text-zinc-300 mb-4">{participant.description}</p>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-2">Maqsadlar:</p>
            <div className="space-y-1">
              {(participant.objectives || []).map((obj: string, index: number) => (
                <div key={index} className="text-sm text-gray-600 dark:text-zinc-400">
                  • {obj}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Tarix:</p>
            <p className="text-sm text-gray-600 dark:text-zinc-400">{participant.background}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-blue-700 mb-2">Xususiyatlar:</p>
            <div className="flex flex-wrap gap-1">
              {(participant.personality_traits || []).map((trait: string, index: number) => (
                <Badge
                  key={index}
                  className="bg-gray-100 dark:bg-zinc-800/30 text-gray-800 dark:text-zinc-200 text-xs"
                >
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Senariy Generator
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            O'zbekiston qonunchiligiga moslashgan huquqiy senariylar yaratish
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl p-1">
            <TabsTrigger
              value="create"
              className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Yaratish
            </TabsTrigger>
            <TabsTrigger
              value="scenario"
              className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Senariyo
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Shablonlar
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Tarix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Senariyo Parametrlari</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                          Senariyo turi
                        </label>
                        <Select
                          value={scenarioType}
                          onChange={e => setScenarioType(e.target.value)}
                          options={[
                            { value: 'civil', label: '▢ Fuqarolik' },
                            { value: 'criminal', label: '═ Jinoyat' },
                            { value: 'family', label: '◉◉◉ Oilaviy' },
                            { value: 'labor', label: '▣ Mehnat' },
                            { value: 'administrative', label: "◇ Ma'muriy" },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                          Qiyinlik darajasi
                        </label>
                        <Select
                          value={difficultyLevel}
                          onChange={e => setDifficultyLevel(e.target.value)}
                          options={[
                            { value: 'beginner', label: "Boshlang'ich" },
                            { value: 'intermediate', label: "O'rta" },
                            { value: 'advanced', label: 'Yuqori' },
                            { value: 'expert', label: 'Ekspert' },
                          ]}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                          Murakkablik
                        </label>
                        <Select
                          value={complexity}
                          onChange={e => setComplexity(e.target.value)}
                          options={[
                            { value: 'simple', label: 'Oddiy' },
                            { value: 'standard', label: 'Standart' },
                            { value: 'complex', label: 'Murakkab' },
                            { value: 'expert', label: 'Ekspert' },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                          Ishtirokchilar soni
                        </label>
                        <Select
                          value={participantsCount.toString()}
                          onChange={e => setParticipantsCount(parseInt(e.target.value))}
                          options={[
                            { value: '2', label: '2 kishi' },
                            { value: '3', label: '3 kishi' },
                            { value: '4', label: '4 kishi' },
                            { value: '5', label: '5 kishi' },
                          ]}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Davomiyligi (daqiqa)
                      </label>
                      <input
                        type="number"
                        min="15"
                        max="120"
                        value={duration}
                        onChange={e => setDuration(parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-white/50 rounded-xl border-blue-200 focus:border-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Diqqat markazlari (ixtiyoriy)
                      </label>
                      <Textarea
                        placeholder="Masalan: shartnoma shartlari, to'lov, muddatlar"
                        value={focusAreas.join(', ')}
                        onChange={e =>
                          setFocusAreas(
                            e.target.value
                              .split(',')
                              .map(s => s.trim())
                              .filter(s => s)
                          )
                        }
                        className="min-h-[80px] bg-white/50 rounded-xl border-blue-200 focus:border-blue-400"
                      />
                    </div>

                    <Button
                      onClick={handleGenerateScenario}
                      disabled={isGenerating}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold"
                    >
                      {isGenerating ? 'Yaratilmoqda...' : 'Senariyoni Yaratish'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Senariyo Turlari</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <h4 className="font-semibold text-blue-900 mb-2">▢ Fuqarolik</h4>
                      <p className="text-sm text-blue-700">Shartnoma, mulkiy nizolar, to'lovlar</p>
                    </div>

                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                      <h4 className="font-semibold text-red-900 mb-2">═ Jinoyat</h4>
                      <p className="text-sm text-red-700">Jinoyat ishlari, tergov, sud protsessi</p>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <h4 className="font-semibold text-green-900 mb-2">◉◉◉ Oilaviy</h4>
                      <p className="text-sm text-green-700">Ajralish, aliment, vorislik</p>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <h4 className="font-semibold text-purple-900 mb-2">▣ Mehnat</h4>
                      <p className="text-sm text-purple-700">
                        Ishdan bo'shatish, ish haqi, mehnat shartnomasi
                      </p>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-xl">
                      <h4 className="font-semibold text-orange-900 mb-2">◇ Ma'muriy</h4>
                      <p className="text-sm text-orange-700">
                        Jarimalar, litsenziyalar, protsedura
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scenario" className="mt-6">
            {currentScenario ? (
              <div className="space-y-6">
                <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-blue-900 text-2xl">
                          {currentScenario.title}
                        </CardTitle>
                        <p className="text-gray-600 dark:text-zinc-400 mt-2">
                          {currentScenario.description}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={getDifficultyColor(currentScenario.difficulty_level)}>
                          {currentScenario.difficulty_level}
                        </Badge>
                        <Badge className={getComplexityColor(currentScenario.complexity)}>
                          {currentScenario.complexity}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-blue-900 mb-4">Case Ma'lumotlari</h3>
                    <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                      <CardContent className="space-y-4 p-6">
                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-1">Mavzu:</p>
                          <p className="text-gray-800 dark:text-zinc-200">
                            {currentScenario.case_data.subject}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-1">Tarix:</p>
                          <p className="text-gray-800 dark:text-zinc-200">
                            {currentScenario.case_data.background}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-1">Asosiy muammo:</p>
                          <p className="text-gray-800 dark:text-zinc-200">
                            {currentScenario.case_data.key_issue}
                          </p>
                        </div>

                        {currentScenario.case_data.additional_facts && (
                          <div>
                            <p className="text-sm font-medium text-blue-700 mb-2">
                              Qo'shimcha faktlar:
                            </p>
                            <div className="space-y-1">
                              {currentScenario.case_data.additional_facts.map(
                                (fact: string, index: number) => (
                                  <div
                                    key={index}
                                    className="text-sm text-gray-600 dark:text-zinc-400"
                                  >
                                    • {fact}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {currentScenario.case_data.complications && (
                          <div>
                            <p className="text-sm font-medium text-blue-700 mb-2">
                              Murakkabliklar:
                            </p>
                            <div className="space-y-1">
                              {currentScenario.case_data.complications.map(
                                (comp: string, index: number) => (
                                  <div key={index} className="text-sm text-red-600">
                                    • {comp}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-2">
                            Huquqiy havolalar:
                          </p>
                          <div className="space-y-1">
                            {currentScenario.legal_references.map((ref: string, index: number) => (
                              <div key={index} className="text-sm text-blue-600">
                                • {ref}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-blue-900 mb-4">Maqsadlar</h3>
                    <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                      <CardContent className="space-y-4 p-6">
                        {currentScenario.objectives.map(objective => (
                          <div
                            key={objective.id}
                            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium text-blue-900">{objective.description}</p>
                              <Badge
                                className={
                                  objective.priority === 'high'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {objective.priority}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-blue-700">
                                Muvaffaqiyat mezonlari:
                              </p>
                              <div className="space-y-1">
                                {objective.success_criteria.map(
                                  (criteria: string, index: number) => (
                                    <div
                                      key={index}
                                      className="text-sm text-gray-600 dark:text-zinc-400"
                                    >
                                      [OK] {criteria}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-blue-900 mb-4">
                    Ishtirokchilar ({currentScenario.participants.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentScenario.participants.map(renderParticipant)}
                  </div>
                </div>
              </div>
            ) : (
              <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 dark:text-zinc-500 mb-4">
                    Hali hech qanday senariyo yaratilmagan
                  </p>
                  <Button
                    onClick={() => setActiveTab('create')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Birinchi Senariyoni Yaratish
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(template => (
                <Card
                  key={template.id}
                  className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl hover:shadow-2xl transition-shadow"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-blue-900 text-lg">{template.title}</CardTitle>
                      <span className="text-2xl">
                        {getScenarioTypeIcon(template.scenario_type)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 dark:text-zinc-300 mb-4">{template.description}</p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-zinc-400">Turi:</span>
                        <span className="font-medium capitalize">{template.scenario_type}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-zinc-400">Qiyinlik:</span>
                        <Badge className={getDifficultyColor(template.difficulty_level)}>
                          {template.difficulty_level}
                        </Badge>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-zinc-400">Murakkablik:</span>
                        <Badge className={getComplexityColor(template.complexity || 'standard')}>
                          {template.complexity}
                        </Badge>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-zinc-400">Davomiyligi:</span>
                        <span className="font-medium">{template.estimated_duration} daqiqa</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-zinc-400">Ishtirokchilar:</span>
                        <span className="font-medium">{template.participants_count} kishi</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        // Shablon parametrlarini qo'llash
                        const typeMap: Record<string, string> = {
                          tergov: 'criminal',
                          sud: 'criminal',
                          muzokara: 'civil',
                          mehnat: 'labor',
                          oila: 'family',
                          jinoyat: 'criminal',
                          fuqarolik: 'civil',
                        }
                        const diffMap: Record<string, string> = {
                          "boshlang'ich": 'beginner',
                          "o'rta": 'intermediate',
                          murakkab: 'advanced',
                          beginner: 'beginner',
                          intermediate: 'intermediate',
                          advanced: 'advanced',
                        }
                        setScenarioType(
                          typeMap[template.scenario_type] || template.scenario_type || 'civil'
                        )
                        setDifficultyLevel(
                          diffMap[template.difficulty_level] ||
                            template.difficulty_level ||
                            'intermediate'
                        )
                        setComplexity(template.complexity || 'standard')
                        setParticipantsCount(template.participants_count || 3)
                        setDuration(template.estimated_duration || 45)
                        setActiveTab('create')
                        // Avtomatik generatsiya
                        setTimeout(() => handleGenerateScenario(), 100)
                      }}
                      disabled={isGenerating}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isGenerating ? 'Yaratilmoqda...' : 'Ishlatish'}
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {templates.length === 0 && (
                <div className="col-span-full">
                  <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                    <CardContent className="text-center py-12">
                      <p className="text-gray-500 dark:text-zinc-500">Shablonlar yuklanmoqda...</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenarios.map(scenario => (
                <Card
                  key={scenario.id}
                  className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
                  onClick={() => {
                    setCurrentScenario(scenario)
                    setActiveTab('scenario')
                  }}
                >
                  <CardHeader>
                    <div className="flex flex-row items-center justify-between">
                      <CardTitle className="text-blue-900 text-lg">{scenario.title}</CardTitle>
                      <span className="text-2xl">
                        {getScenarioTypeIcon(scenario.scenario_type)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-zinc-400">
                        {scenario.description}
                      </p>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-zinc-400">Turi:</span>
                        <span className="font-medium capitalize">{scenario.scenario_type}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-zinc-400">Ishtirokchilar:</span>
                        <span className="font-medium">{scenario.participants.length} kishi</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-zinc-400">Davomiyligi:</span>
                        <span className="font-medium">{scenario.estimated_duration} daqiqa</span>
                      </div>

                      <div className="pt-2 border-t border-gray-200 dark:border-zinc-800">
                        <p className="text-xs text-gray-500 dark:text-zinc-500">
                          {new Date(scenario.created_at).toLocaleDateString('uz-UZ')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {scenarios.length === 0 && (
                <div className="col-span-full">
                  <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                    <CardContent className="text-center py-12">
                      <p className="text-gray-500 dark:text-zinc-500 mb-4">
                        Hali hech qanday senariylar mavjud emas
                      </p>
                      <Button
                        onClick={() => setActiveTab('create')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Birinchi Senariyoni Yaratish
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
