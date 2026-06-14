import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button, Textarea, Badge, Progress, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface CourtRole {
  name: string;
  description: string;
  responsibilities: string[];
  objectives: string[];
}

interface SimulationScenario {
  id: string;
  title: string;
  case_type: string;
  difficulty: string;
  background: string;
  parties: Record<string, string>;
  legal_issues: string[];
  evidence: Array<{
    id: string;
    type: string;
    description: string;
    relevance: number;
    credibility: number;
  }>;
  roles: CourtRole[];
  estimated_time: number;
}

interface SimulationResult {
  role_performance: Record<string, {
    score: number;
    strengths: string[];
    weaknesses: string[];
    feedback: string;
  }>;
  overall_score: number;
  decision: string;
  reasoning: string;
  learning_points: string[];
  timestamp: Date;
}

const CourtSimulator: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [userArguments, setUserArguments] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [activeTab, setActiveTab] = useState('scenarios');

  const scenarios: SimulationScenario[] = [
    {
      id: 'civil_dispute',
      title: 'Shartnoma nizosi',
      case_type: 'Fuqarolik ishi',
      difficulty: 'O\'rta',
      background: 'A kompaniyasi B kompaniyasidan marketing xizmatlarini olgan, ammo to\'lov muddati kechikishi sababli sudga murojaat qilgan. B kompaniyasi xizmat sifati pastligini da\'vo qilmoqda.',
      parties: {
        'Da\'vogar': 'A kompaniyasi - Xizmat ko\'rsatuvchi',
        'Javobgar': 'B kompaniyasi - Xizmat oluvchi'
      },
      legal_issues: [
        'Shartnoma majburiyatlarining buzilishi',
        'Xizmat sifatiga oid da\'volar',
        'Zarar miqdorini belgilash'
      ],
      evidence: [
        {
          id: '1',
          type: 'Shartnoma',
          description: 'Xizmat shartnomasi (2023-yil 15-yanvar)',
          relevance: 0.9,
          credibility: 0.95
        },
        {
          id: '2',
          type: 'Hisob-faktura',
          description: 'To\'lov hisob-fakturalari',
          relevance: 0.8,
          credibility: 0.9
        },
        {
          id: '3',
          type: 'Ekspert xulosasi',
          description: 'Xizmat sifati bo\'yicha ekspert xulosasi',
          relevance: 0.7,
          credibility: 0.85
        }
      ],
      roles: [
        {
          name: 'hakam',
          description: 'Sud hakami sifatida ishni ko\'rib chiqish',
          responsibilities: [
            'Dalillarni ob\'ektiv baholash',
            'Qonunlarni to\'g\'ri qo\'llash',
            'Adolatli qaror qabul qilish'
          ],
          objectives: [
            'Haqiqatni aniqlash',
            'Adolatli qaror qabul qilish',
            'Ikkala tomon manfaatini himoya qilish'
          ]
        },
        {
          name: 'da\'vogar_advokat',
          description: 'Da\'vogar advokati sifatida himoya qilish',
          responsibilities: [
            'Da\'vogar huquqlarini himoya qilish',
            'Dalillarni taqdim etish',
            'Qonuniy asoslarni keltirish'
          ],
          objectives: [
            'Da\'vogar talablarini qo\'llab-quvvatlash',
            'Sudni da\'vogar foydasiga ishontirish',
            'Eng yaxshi natijaga erishish'
          ]
        },
        {
          name: 'javobgar_advokat',
          description: 'Javobgar advokati sifatida himoya qilish',
          responsibilities: [
            'Javobgar huquqlarini himoya qilish',
            'Qarshi dalillarni keltirish',
            'Da\'voni rad etish asoslarini ko\'rsatish'
          ],
          objectives: [
            'Javobgar manfaatini himoya qilish',
            'Da\'voni rad etish yoki kamaytirish',
            'Qonuniy himoyani ta\'minlash'
          ]
        }
      ],
      estimated_time: 45
    },
    {
      id: 'criminal_case',
      title: 'O\'g\'irlik ishi',
      case_type: 'Jinoyat ishi',
      difficulty: 'Yuqori',
      background: 'Sudlanuvchi do\'kondan mahsulot o\'g\'irlashda ayblanmoqda. Ayblov asosida xavfsizlik kameralari yozuvi va guvohlar ifodalari mavjud.',
      parties: {
        'Ayblanuvchi': 'Sudlanuvchi F.I.O.',
        'Jamiyat': 'Davlat tomonidan'
      },
      legal_issues: [
        'O\'g\'irlik tarkibining aniqlanishi',
        'Aybning isboti',
        'Jazo miqdori'
      ],
      evidence: [
        {
          id: '1',
          type: 'Video yozuv',
          description: 'Xavfsizlik kamerasi yozuvi',
          relevance: 0.95,
          credibility: 0.9
        },
        {
          id: '2',
          type: 'Guvox ifodasi',
          description: 'Do\'kon xodimi guvoxlik bayoni',
          relevance: 0.8,
          credibility: 0.85
        },
        {
          id: '3',
          type: 'Ekspertiza',
          description: 'Tergov ekspertizasi xulosasi',
          relevance: 0.7,
          credibility: 0.95
        }
      ],
      roles: [
        {
          name: 'prokuror',
          description: 'Prokuror sifatida ayblov isbotlash',
          responsibilities: [
            'Ayblov isbotlash',
            'Dalillarni taqdim etish',
            'Jazo taklif qilish'
          ],
          objectives: [
            'Aybni isbotlash',
            'Jamoat xavfsizligini ta\'minlash',
            'Adolatli jazoni ta\'minlash'
          ]
        },
        {
          name: 'himoyachi',
          description: 'Himoyachi advokat sifatida himoya qilish',
          responsibilities: [
            'Ayblanuvchi huquqlarini himoya qilish',
            'Aybni rad etish dalillari',
            'Yengillashtiruvchi holatlarni ko\'rsatish'
          ],
          objectives: [
            'Ayblanuvchini himoya qilish',
            'Aybni rad etish yoki kamaytirish',
            'Eng yengil jazoga erishish'
          ]
        },
        {
          name: 'sudya',
          description: 'Sudya sifatida qaror qabul qilish',
          responsibilities: [
            'Ilni adolatli ko\'rib chiqish',
            'Qonunlarni qo\'llash',
            'Qaror qabul qilish'
          ],
          objectives: [
            'Haqiqatni aniqlash',
            'Qonunga rioya etish',
            'Adolatli qaror qabul qilish'
          ]
        }
      ],
      estimated_time: 60
    }
  ];

  const handleStartSimulation = async () => {
    if (!selectedScenario || !selectedRole || !userArguments.trim()) {
      toast.error('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }

    setIsSimulating(true);
    setActiveTab('simulation');

    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mock simulation result
      const mockResult: SimulationResult = {
        role_performance: {
          [selectedRole]: {
            score: selectedRole === 'hakam' ? 85 : selectedRole === 'da\'vogar_advokat' ? 78 : 82,
            strengths: selectedRole === 'hakam' ? [
              'Dalillarni ob\'ektiv baholash',
              'Qonunlarni to\'g\'ri qo\'llash',
              'Mantiqiy xulosa chiqarish'
            ] : [
              'Argumentlarni aniq ifodalash',
              'Dalillarni samarali ishlatish',
              'Qonuniy asoslarni keltirish'
            ],
            weaknesses: selectedRole === 'hakam' ? [
              'Bazi dalillarni etarlicha baholamadi',
              'Qaror qabul qilishda shoshqinchilik'
            ] : [
              'Qo\'shimcha dalillar keltirish kerak',
              'Argumentlarni kuchaytirish lozim'
            ],
            feedback: selectedRole === 'hakam' 
              ? 'Sizning qaroringiz asosli va mantiqiy, biroq ba\'zi dalillarni chuqurroq tahlil qilishingiz tavsiya etiladi.'
              : 'Argumentlaringiz yaxshi tuzilgan, biroq qo\'shimcha dalillar va qonuniy asoslarni keltirish orqali kuchaytirishingiz mumkin.'
          }
        },
        overall_score: selectedRole === 'hakam' ? 85 : selectedRole === 'da\'vogar_advokat' ? 78 : 82,
        decision: selectedScenario.id === 'civil_dispute' 
          ? 'B kompaniyasi A kompaniyasiga 30 million so\'m miqdorida tovon puli to\'lashi shart.'
          : 'Ayblanuvchi 3 yil ozodlikdan mahrum etish jazosiga hukm qilindi.',
        reasoning: selectedScenario.id === 'civil_dispute'
          ? 'Shartnoma shartlari buzilgani, ammo xizmat sifatidagi kamchiliklar hisobga olinib, tovon puli miqdori kamaytirildi.'
          : 'Xavfsizlik kamerasi yozuvi va guvox ifodalari aybni isbotlash uchun etarli asos bo\'ldi.',
        learning_points: [
          'Dalillarni to\'liq va sistemali tahlil qilish',
          'Qonun hujjatlarini to\'g\'ri talqin qilish',
          'Argumentlarni mantiqiy tuzish',
          'Sud protsessida to\'g\'ri xulq-atvor'
        ],
        timestamp: new Date()
      };

      setSimulationResult(mockResult);
      toast.success('Simulyatsiya muvaffaqiyatli yakunlandi');
      setActiveTab('results');

    } catch (error) {
      toast.error('Simulyatsiya jarayonida xatolik yuz berdi');
      console.error('Simulation error:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Boshlang\'ich': return 'bg-green-100 text-green-800';
      case 'O\'rta': return 'bg-blue-100 text-blue-800';
      case 'Yuqori': return 'bg-orange-100 text-orange-800';
      case 'Ekspert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'hakam': return 'Hakam';
      case 'da\'vogar_advokat': return 'Da\'vogar advokati';
      case 'javobgar_advokat': return 'Javobgar advokati';
      case 'prokuror': return 'Prokuror';
      case 'himoyachi': return 'Himoyachi';
      case 'sudya': return 'Sudya';
      default: return role;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Sud Simulyatori</h1>
        <p className="text-gray-600">Sud jarayonini simulyatsiya qiling</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scenarios">Senariylar</TabsTrigger>
          <TabsTrigger value="preparation">Tayyorgarlik</TabsTrigger>
          <TabsTrigger value="simulation">Simulyatsiya</TabsTrigger>
          <TabsTrigger value="results">Natijalar</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scenarios.map((scenario) => (
              <Card key={scenario.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{scenario.title}</CardTitle>
                    <Badge className={getDifficultyColor(scenario.difficulty)}>
                      {scenario.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-gray-500">Ish turi:</span>
                      <p className="font-medium">{scenario.case_type}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Taxminiyot vaqt:</span>
                      <p className="font-medium">{scenario.estimated_time} daqiqa</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Fon:</span>
                      <p className="text-gray-700 text-sm">{scenario.background}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Rollar:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {scenario.roles.map((role) => (
                          <Badge key={role.name} variant="outline" className="text-xs">
                            {getRoleName(role.name)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedScenario(scenario);
                        setActiveTab('preparation');
                      }}
                      className="w-full"
                    >
                      Tanlash
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preparation" className="space-y-6">
          {selectedScenario ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedScenario.title} - Tayyorgarlik</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Ish to'g'risida ma'lumot</h4>
                      <p className="text-gray-700">{selectedScenario.background}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Tomonlar</h4>
                      <div className="space-y-1">
                        {Object.entries(selectedScenario.parties).map(([party, description]) => (
                          <div key={party} className="flex justify-between">
                            <span className="font-medium">{party}:</span>
                            <span className="text-gray-700">{description}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Huquqiy masalalar</h4>
                      <ul className="space-y-1">
                        {selectedScenario.legal_issues.map((issue, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span className="text-gray-700">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Dalillar</h4>
                      <div className="space-y-2">
                        {selectedScenario.evidence.map((evidence) => (
                          <div key={evidence.id} className="border rounded p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{evidence.type}</p>
                                <p className="text-sm text-gray-600">{evidence.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Ahamiyat: {evidence.relevance}</p>
                                <p className="text-xs text-gray-500">Ishonch: {evidence.credibility}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rolni tanlang</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedScenario.roles.map((role) => (
                      <div
                        key={role.name}
                        className={cn(
                          'border rounded-lg p-4 cursor-pointer transition-colors',
                          selectedRole === role.name
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                        onClick={() => setSelectedRole(role.name)}
                      >
                        <h4 className="font-medium mb-2">{getRoleName(role.name)}</h4>
                        <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                        <div>
                          <p className="text-sm font-medium mb-1">Mas'uliyatlar:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {role.responsibilities.slice(0, 2).map((resp, index) => (
                              <li key={index}>• {resp}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedRole && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sizning argumentlaringiz ({getRoleName(selectedRole)} sifatida)
                      </label>
                      <Textarea
                        placeholder="Sizning rolizga oid argumentlarni, dalillarni va pozitsiyangizni bu yerga yozing..."
                        value={userArguments}
                        onChange={(e) => setUserArguments(e.target.value)}
                        rows={6}
                        className="w-full"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleStartSimulation}
                    disabled={!selectedRole || !userArguments.trim() || isSimulating}
                    className="w-full mt-6"
                    size="lg"
                  >
                    {isSimulating ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Simulyatsiya qilinmoqda...
                      </>
                    ) : (
                      'Simulyatsiyani boshlash'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <p>Senariy tanlanmagan</p>
                  <p className="text-sm mt-2">Avval senariy tanlang</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="simulation" className="space-y-6">
          {isSimulating ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <LoadingSpinner size="lg" />
                  <p className="text-gray-600">Simulyatsiya jarayoni davom etmoqda...</p>
                  <p className="text-sm text-gray-500">AI tahlili olib borilmoqda</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <p>Simulyatsiya boshlanmagan</p>
                  <p className="text-sm mt-2">Tayyorgarlik bosqichidan boshlang</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {simulationResult ? (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Simulyatsiya natijalari
                    <Badge variant="default" className="text-lg px-4 py-2">
                      {simulationResult.overall_score} ball
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className={cn("text-6xl font-bold", getScoreColor(simulationResult.overall_score))}>
                      {simulationResult.overall_score}
                    </div>
                    <p className="text-sm text-gray-500">
                      {simulationResult.overall_score >= 90 && 'A\'lo'}
                      {simulationResult.overall_score >= 80 && simulationResult.overall_score < 90 && 'Yaxshi'}
                      {simulationResult.overall_score >= 70 && simulationResult.overall_score < 80 && 'Qoniqarli'}
                      {simulationResult.overall_score < 70 && 'Qoniqarsiz'}
                    </p>
                    <Progress value={simulationResult.overall_score} className="max-w-md mx-auto" />
                  </div>
                </CardContent>
              </Card>

              {/* Role Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Rol bo'yicha baholash</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.entries(simulationResult.role_performance).map(([role, performance]) => (
                    <div key={role} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{getRoleName(role)}</h4>
                        <span className={cn("font-bold", getScoreColor(performance.score))}>
                          {performance.score} ball
                        </span>
                      </div>
                      <Progress value={performance.score} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-green-600 mb-2">Kuchli tomonlar:</p>
                          <ul className="space-y-1">
                            {performance.strengths.map((strength, index) => (
                              <li key={index} className="text-sm text-gray-700">• {strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-orange-600 mb-2">Kamchiliklar:</p>
                          <ul className="space-y-1">
                            {performance.weaknesses.map((weakness, index) => (
                              <li key={index} className="text-sm text-gray-700">• {weakness}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-md">
                        <p className="text-sm font-medium text-blue-900 mb-1">Fikr-mulohaza:</p>
                        <p className="text-sm text-blue-700">{performance.feedback}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Court Decision */}
              <Card>
                <CardHeader>
                  <CardTitle>Sud qarori</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Qaror:</p>
                      <p className="text-lg font-medium">{simulationResult.decision}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Izoh:</p>
                      <p className="text-gray-700">{simulationResult.reasoning}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Points */}
              <Card>
                <CardHeader>
                  <CardTitle>O\'rganish nuqtalari</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {simulationResult.learning_points.map((point, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">→</span>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <p>Hali natijalar yo'q</p>
                  <p className="text-sm mt-2">Avval simulyatsiyani o'tkazing</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { CourtSimulator };
