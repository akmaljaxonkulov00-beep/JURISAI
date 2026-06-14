import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button, Badge, Progress, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface CourtSession {
  id: string;
  case_number: string;
  case_type: string;
  judge: string;
  prosecutor?: string;
  defense_attorney?: string;
  plaintiff?: string;
  defendant?: string;
  witnesses: Array<{
    name: string;
    role: string;
    testimony: string;
    credibility: number;
  }>;
  evidence: Array<{
    id: string;
    description: string;
    type: string;
    relevance: number;
    authenticity: number;
  }>;
  proceedings: Array<{
    stage: string;
    speaker: string;
    content: string;
    timestamp: Date;
  }>;
  verdict?: {
    decision: string;
    reasoning: string;
    sentence?: string;
    confidence: number;
  };
  status: 'preparing' | 'in_progress' | 'deliberating' | 'concluded';
}

interface VirtualCourtProps {
  className?: string;
}

const VirtualCourt: React.FC<VirtualCourtProps> = ({ className }) => {
  const [selectedCase, setSelectedCase] = useState<string>('civil_dispute');
  const [session, setSession] = useState<CourtSession | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [userRole, setUserRole] = useState<'observer' | 'judge' | 'prosecutor' | 'defense'>('observer');
  const [userInput, setUserInput] = useState('');
  const [activeTab, setActiveTab] = useState('setup');

  const caseTypes = [
    {
      id: 'civil_dispute',
      name: 'Fuqarolik nizosi',
      description: 'Shartnoma nizosi bo\'yicha sud jarayoni',
      participants: ['judge', 'plaintiff', 'defendant', 'plaintiff_attorney', 'defendant_attorney'],
      estimated_duration: '45-60 daqiqa'
    },
    {
      id: 'criminal_case',
      name: 'Jinoyat ishi',
      description: 'O\'g\'irlik ishi bo\'yicha sud jarayoni',
      participants: ['judge', 'prosecutor', 'defendant', 'defense_attorney'],
      estimated_duration: '60-90 daqiqa'
    },
    {
      id: 'family_law',
      name: 'Oila huquqi',
      description: 'Nikoh buzilishi bo\'yicha sud jarayoni',
      participants: ['judge', 'plaintiff', 'defendant', 'plaintiff_attorney', 'defendant_attorney'],
      estimated_duration: '30-45 daqiqa'
    },
    {
      id: 'administrative',
      name: 'Ma\'muriy ish',
      description: 'Ma\'muriy huquqbuzarlik ishi',
      participants: ['judge', 'prosecutor', 'defendant', 'defense_attorney'],
      estimated_duration: '30-45 daqiqa'
    }
  ];

  const handleStartSession = async () => {
    setIsSimulating(true);
    setActiveTab('courtroom');

    try {
      // Simulate session creation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockSession: CourtSession = {
        id: `SESSION-${Date.now()}`,
        case_number: `${selectedCase.toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
        case_type: caseTypes.find(c => c.id === selectedCase)?.name || '',
        judge: 'Hakam Karimov A.A.',
        prosecutor: selectedCase === 'criminal_case' ? 'Prokuror Toshmatov B.B.' : undefined,
        defense_attorney: 'Himoyachi Azizova D.D.',
        plaintiff: selectedCase !== 'criminal_case' ? 'Da\'vogar Rahimov N.N.' : undefined,
        defendant: 'Javobgar Umarov K.K.',
        witnesses: [
          {
            name: 'Guvoh 1',
            role: 'Ko\'rsatuvchi',
            testimony: 'Men hodisani o\'z ko\'zim bilan ko\'rdim...',
            credibility: 0.85
          },
          {
            name: 'Ekspert',
            role: 'Ekspert',
            testimony: 'Ekspert xulosasiga ko\'ra...',
            credibility: 0.95
          }
        ],
        evidence: [
          {
            id: '1',
            description: 'Shartnoma',
            type: 'Hujjat',
            relevance: 0.9,
            authenticity: 0.95
          },
          {
            id: '2',
            description: 'Video yozuv',
            type: 'Media',
            relevance: 0.85,
            authenticity: 0.9
          }
        ],
        proceedings: [
          {
            stage: 'opening',
            speaker: 'Hakam',
            content: 'Sud majlisi ochiladi. Ish raqami: ' + `${selectedCase.toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
            timestamp: new Date()
          }
        ],
        status: 'in_progress'
      };

      setSession(mockSession);
      toast.success('Sud majlisi boshlandi');

      // Start simulation
      await simulateCourtProceedings(mockSession);

    } catch (error) {
      toast.error('Sud majlisini boshlashda xatolik');
      console.error('Session error:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const simulateCourtProceedings = async (sessionData: CourtSession) => {
    const proceedings = [
      {
        stage: 'opening',
        speaker: 'Hakam',
        content: 'Ish bo\'yicha ishtirokchilarning to\'liqmi? Tomonlar tomonlarida advokatlar bormi?',
        timestamp: new Date()
      },
      {
        stage: 'prosecution',
        speaker: 'Prokuror',
        content: 'Hurmatli hakam, ayblanuvchi jinoyat sodir etgani to\'g\'risida dalillar keltiraman...',
        timestamp: new Date()
      },
      {
        stage: 'defense',
        speaker: 'Himoyachi',
        content: 'Hurmatli hakam, ayblanuvchi aybsiz ekanligini isbotlayman...',
        timestamp: new Date()
      },
      {
        stage: 'witness_testimony',
        speaker: 'Guvoh 1',
        content: 'Men hodisani aniq vaqtda ko\'rdim. Ayblanuvchi joyda edi...',
        timestamp: new Date()
      },
      {
        stage: 'evidence_presentation',
        speaker: 'Prokuror',
        content: 'Xavfsizlik kamerasi yozuvini sudga taqdim etaman...',
        timestamp: new Date()
      },
      {
        stage: 'cross_examination',
        speaker: 'Himoyachi',
        content: 'Guvohga savol: Siz hodisani to\'g\'ri ko\'rdingizmi?',
        timestamp: new Date()
      },
      {
        stage: 'closing_arguments',
        speaker: 'Prokuror',
        content: 'Ayblanuvchi aybdor ekanligini dalillar isbotlaydi...',
        timestamp: new Date()
      },
      {
        stage: 'closing_arguments',
        speaker: 'Himoyachi',
        content: 'Ayblanuvchi aybsiz, dalillar yetarli emas...',
        timestamp: new Date()
      },
      {
        stage: 'deliberation',
        speaker: 'Hakam',
        content: 'Sud maslahatxonasiga o\'tilamiz...',
        timestamp: new Date()
      }
    ];

    for (let i = 0; i < proceedings.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const proceeding = proceedings[i];
      
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          proceedings: [...prev.proceedings, proceeding],
          status: i === proceedings.length - 1 ? 'deliberating' : 'in_progress'
        };
      });
    }

    // Final verdict
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        verdict: {
          decision: 'Ayblanuvchi aybdor deb topildi',
          reasoning: 'Xavfsizlik kamerasi yozuvi va guvoh ifodalari aybni isbotlash uchun etarli asos bo\'ldi',
          sentence: '2 yil ozodlikdan mahrum etish',
          confidence: 0.85
        },
        status: 'concluded'
      };
    });

    toast.success('Sud jarayoni yakunlandi');
  };

  const handleUserInput = async () => {
    if (!userInput.trim() || !session) return;

    const userProceeding = {
      stage: 'user_input' as const,
      speaker: userRole === 'judge' ? 'Hakam' : userRole === 'prosecutor' ? 'Prokuror' : 'Himoyachi',
      content: userInput,
      timestamp: new Date()
    };

    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        proceedings: [...prev.proceedings, userProceeding]
      };
    });

    setUserInput('');

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const aiResponse = {
      stage: 'ai_response' as const,
      speaker: userRole === 'judge' ? 'Prokuror' : userRole === 'prosecutor' ? 'Himoyachi' : 'Hakam',
      content: 'Sizning argumentlaringizni qabul qildim. Batafsilroq ma\'lumot berishingiz mumkin.',
      timestamp: new Date()
    };

    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        proceedings: [...prev.proceedings, aiResponse]
      };
    });
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'judge': return 'Hakam';
      case 'prosecutor': return 'Prokuror';
      case 'defense': return 'Himoyachi';
      case 'plaintiff': return 'Da\'vogar';
      case 'defendant': return 'Javobgar';
      default: return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'deliberating': return 'bg-purple-100 text-purple-800';
      case 'concluded': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'preparing': return 'Tayyorlanmoqda';
      case 'in_progress': return 'Jarayonda';
      case 'deliberating': return 'Muzokara';
      case 'concluded': return 'Yakunlangan';
      default: return status;
    }
  };

  return (
    <div className={cn('max-w-6xl mx-auto space-y-6', className)}>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Virtual Sud</h1>
        <p className="text-gray-600">Sud jarayonini virtual tarzda kuzating</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Sozlash</TabsTrigger>
          <TabsTrigger value="courtroom">Sud zali</TabsTrigger>
          <TabsTrigger value="evidence">Dalillar</TabsTrigger>
          <TabsTrigger value="verdict">Qaror</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ish turini tanlang</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {caseTypes.map((caseType) => (
                  <div
                    key={caseType.id}
                    className={cn(
                      'border rounded-lg p-4 cursor-pointer transition-colors',
                      selectedCase === caseType.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => setSelectedCase(caseType.id)}
                  >
                    <h3 className="font-medium mb-2">{caseType.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{caseType.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Davomiyligi: {caseType.estimated_duration}</span>
                      <Badge variant="outline">
                        {caseType.participants.length} ishtirokchi
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rolni tanlang</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'observer', name: 'Kuzatuvchi', description: 'Jarayonni tomosha qilish' },
                  { id: 'judge', name: 'Hakam', description: 'Qaror qabul qilish' },
                  { id: 'prosecutor', name: 'Prokuror', description: 'Ayblov isbotlash' },
                  { id: 'defense', name: 'Himoyachi', description: 'Himoya qilish' }
                ].map((role) => (
                  <div
                    key={role.id}
                    className={cn(
                      'border rounded-lg p-4 cursor-pointer transition-colors',
                      userRole === role.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => setUserRole(role.id as any)}
                  >
                    <h4 className="font-medium mb-1">{role.name}</h4>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleStartSession}
            disabled={isSimulating}
            className="w-full"
            size="lg"
          >
            {isSimulating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Sud majlisi tayyorlanmoqda...
              </>
            ) : (
              'Sud majlisini boshlash'
            )}
          </Button>
        </TabsContent>

        <TabsContent value="courtroom" className="space-y-6">
          {session ? (
            <div className="space-y-6">
              {/* Session Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{session.case_number}</h3>
                      <p className="text-sm text-gray-600">{session.case_type}</p>
                    </div>
                    <Badge className={getStatusColor(session.status)}>
                      {getStatusName(session.status)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Courtroom */}
              <Card>
                <CardHeader>
                  <CardTitle>Sud zali</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Participants */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">Hakam</h4>
                        <p className="text-sm">{session.judge}</p>
                      </div>
                      {session.prosecutor && (
                        <div className="border rounded-lg p-3">
                          <h4 className="font-medium mb-2">Prokuror</h4>
                          <p className="text-sm">{session.prosecutor}</p>
                        </div>
                      )}
                      <div className="border rounded-lg p-3">
                        <h4 className="font-medium mb-2">Himoyachi</h4>
                        <p className="text-sm">{session.defense_attorney}</p>
                      </div>
                    </div>

                    {/* Proceedings */}
                    <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50">
                      <h4 className="font-medium mb-4">Sud jarayoni</h4>
                      <div className="space-y-3">
                        {session.proceedings.map((proceeding, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{proceeding.speaker}</span>
                                <span className="text-xs text-gray-500">
                                  {proceeding.timestamp.toLocaleTimeString('uz-UZ')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{proceeding.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* User Input */}
                    {userRole !== 'observer' && session.status === 'in_progress' && (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          placeholder={`${getRoleName(userRole)} sifatida gapiring...`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && handleUserInput()}
                        />
                        <Button onClick={handleUserInput}>
                          Gapirish
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <p>Sud majlisi boshlanmagan</p>
                  <p className="text-sm mt-2">Avval sozlash bosqichidan boshlang</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="evidence" className="space-y-6">
          {session ? (
            <div className="space-y-6">
              {/* Evidence */}
              <Card>
                <CardHeader>
                  <CardTitle>Dalillar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {session.evidence.map((evidence) => (
                      <div key={evidence.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{evidence.description}</h4>
                          <Badge variant="outline">{evidence.type}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Ahamiyat:</span>
                            <Progress value={evidence.relevance * 100} className="mt-1" />
                          </div>
                          <div>
                            <span className="text-gray-500">Asoslilik:</span>
                            <Progress value={evidence.authenticity * 100} className="mt-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Witnesses */}
              <Card>
                <CardHeader>
                  <CardTitle>Guvoxlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {session.witnesses.map((witness, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{witness.name}</h4>
                          <Badge variant="outline">{witness.role}</Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{witness.testimony}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Ishonch darajasi:</span>
                          <Progress value={witness.credibility * 100} className="w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <p>Dalillar yo'q</p>
                  <p className="text-sm mt-2">Sud majlisini boshlang</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="verdict" className="space-y-6">
          {session?.verdict ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Sud qarori
                  <Badge variant="default" className="text-lg px-4 py-2">
                    {Math.round(session.verdict.confidence * 100)}% ishonch
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900 mb-4">
                      {session.verdict.decision}
                    </p>
                    {session.verdict.sentence && (
                      <p className="text-lg text-gray-700 mb-4">
                        Jazo: {session.verdict.sentence}
                      </p>
                    )}
                    <div className="text-4xl font-bold text-blue-600">
                      {Math.round(session.verdict.confidence * 100)}%
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Ishonch darajasi</p>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Qaror asoslari:</h4>
                    <p className="text-gray-700">{session.verdict.reasoning}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <p>Qaror hali chiqarilmagan</p>
                  <p className="text-sm mt-2">Sud jarayoni tugagandan so'ng qaror e'lon qilinadi</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { VirtualCourt };
