'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useAuth } from '@/services/auth';
import { aiClient } from '@/lib/ai-client';

interface Scenario {
  id: string;
  scenario_type: string;
  title: string;
  description: string;
  difficulty_level: string;
  complexity: string;
  participants: Array<{
    id: string;
    name: string;
    role: string;
    description: string;
    objectives: string[];
    background: string;
    personality_traits: string[];
  }>;
  case_data: {
    subject: string;
    background: string;
    key_issue: string;
    additional_facts?: string[];
    complications?: string[];
  };
  objectives: Array<{
    id: string;
    description: string;
    priority: string;
    success_criteria: string[];
    legal_references: string[];
  }>;
  legal_references: string[];
  estimated_duration: number;
  ai_generated: boolean;
  status: string;
  created_at: string;
}

interface CreateScenarioRequest {
  scenario_type: string;
  difficulty_level: string;
  complexity: string;
  participants_count: number;
  focus_areas: string[];
  duration_minutes: number;
}

export default function ScenarioGenerator() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('create');
  const [scenarioType, setScenarioType] = useState('civil');
  const [difficultyLevel, setDifficultyLevel] = useState('intermediate');
  const [complexity, setComplexity] = useState('standard');
  const [participantsCount, setParticipantsCount] = useState(3);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [duration, setDuration] = useState(45);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [templates] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadScenarios();
    }
  }, [user]);

  const loadScenarios = () => {
    try {
      const stored = localStorage.getItem('generated_scenarios');
      if (stored) {
        setScenarios(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Scenarios loading error:', error);
    }
  };

  const saveScenario = (scenario: Scenario) => {
    const updated = [scenario, ...scenarios];
    setScenarios(updated);
    localStorage.setItem('generated_scenarios', JSON.stringify(updated));
  };

  const parseScenarioResponse = (text: string, scenarioType: string, difficultyLevel: string, complexity: string): Scenario => {
    // Simple parsing - extract title and description
    const lines = text.split('\n').filter(line => line.trim());
    
    // Try to find title
    let title = `${scenarioType.charAt(0).toUpperCase() + scenarioType.slice(1)} Senariyo`;
    let description = text.substring(0, 200) + '...';
    
    // Parse participants
    const participants = [
      {
        id: 'p1',
        name: 'Tomon A',
        role: 'Da\'vogar',
        description: 'Birinchi tomon',
        objectives: ['Maqsad 1', 'Maqsad 2'],
        background: 'Tomon A tarixi',
        personality_traits: ['Professional', 'Tajribali']
      },
      {
        id: 'p2',
        name: 'Tomon B',
        role: 'Javobgar',
        description: 'Ikkinchi tomon',
        objectives: ['Maqsad 1', 'Maqsad 2'],
        background: 'Tomon B tarixi',
        personality_traits: ['Ehtiyotkor', 'Mulohazali']
      }
    ];

    return {
      id: 'scenario_' + Date.now(),
      scenario_type: scenarioType,
      title,
      description,
      difficulty_level: difficultyLevel,
      complexity,
      participants,
      case_data: {
        subject: 'Asosiy mavzu',
        background: text.substring(0, 300),
        key_issue: 'Asosiy muammo',
        additional_facts: ['Fakt 1', 'Fakt 2'],
        complications: ['Murakkablik 1']
      },
      objectives: [
        {
          id: 'obj1',
          description: 'Birinchi maqsad',
          priority: 'high',
          success_criteria: ['Mezon 1', 'Mezon 2'],
          legal_references: []
        }
      ],
      legal_references: ['O\'zbekiston Respublikasi qonunlari'],
      estimated_duration: 45,
      ai_generated: true,
      status: 'completed',
      created_at: new Date().toISOString()
    };
  };

  const handleGenerateScenario = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const topic = `${scenarioType} huquq bo'yicha`;
      const response = await aiClient.generateScenario(topic, difficultyLevel);
      
      const scenario = parseScenarioResponse(response.text, scenarioType, difficultyLevel, complexity);
      
      setCurrentScenario(scenario);
      saveScenario(scenario);
      setActiveTab('scenario');
    } catch (err) {
      console.error('Scenario generation error:', err);
      setError(err instanceof Error ? err.message : 'Senariyo yaratishda xatolik yuz berdi');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'simple': return 'bg-blue-100 text-blue-800';
      case 'standard': return 'bg-purple-100 text-purple-800';
      case 'complex': return 'bg-indigo-100 text-indigo-800';
      case 'expert': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScenarioTypeIcon = (type: string) => {
    switch (type) {
      case 'civil': return '📄';
      case 'criminal': return '⚖️';
      case 'family': return '👨‍👩‍👧‍👦';
      case 'labor': return '💼';
      case 'administrative': return '🏛️';
      default: return '📋';
    }
  };

  const renderParticipant = (participant: any) => (
    <Card key={participant.id} className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-blue-900 text-lg">{participant.name}</CardTitle>
          <Badge className="bg-blue-100 text-blue-800">
            {participant.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-4">{participant.description}</p>
        
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-blue-700 mb-2">Maqsadlar:</p>
            <div className="space-y-1">
              {participant.objectives.map((obj: string, index: number) => (
                <div key={index} className="text-sm text-gray-600">• {obj}</div>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-blue-700 mb-1">Tarix:</p>
            <p className="text-sm text-gray-600">{participant.background}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-blue-700 mb-2">Xususiyatlar:</p>
            <div className="flex flex-wrap gap-1">
              {participant.personality_traits.map((trait: string, index: number) => (
                <Badge key={index} className="bg-gray-100 text-gray-800 text-xs">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Scenario Generator</h1>
          <p className="text-blue-700">O'zbekiston qonunchiligiga moslashgan huquqiy senariylar yaratish</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm rounded-2xl p-1">
            <TabsTrigger value="create" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Yaratish
            </TabsTrigger>
            <TabsTrigger value="scenario" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Senariyo
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Shablonlar
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Tarix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
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
                          onChange={(e) => setScenarioType(e.target.value)}
                          options={[
                            { value: "civil", label: "📄 Fuqarolik" },
                            { value: "criminal", label: "⚖️ Jinoyat" },
                            { value: "family", label: "👨‍👩‍👧‍👦 Oilaviy" },
                            { value: "labor", label: "💼 Mehnat" },
                            { value: "administrative", label: "🏛️ Ma'muriy" }
                          ]}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                          Qiyinlik darajasi
                        </label>
                        <Select 
                          value={difficultyLevel} 
                          onChange={(e) => setDifficultyLevel(e.target.value)}
                          options={[
                            { value: "beginner", label: "Boshlang'ich" },
                            { value: "intermediate", label: "O'rta" },
                            { value: "advanced", label: "Yuqori" },
                            { value: "expert", label: "Ekspert" }
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
                          onChange={(e) => setComplexity(e.target.value)}
                          options={[
                            { value: "simple", label: "Oddiy" },
                            { value: "standard", label: "Standart" },
                            { value: "complex", label: "Murakkab" },
                            { value: "expert", label: "Ekspert" }
                          ]}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                          Ishtirokchilar soni
                        </label>
                        <Select 
                          value={participantsCount.toString()} 
                          onChange={(e) => setParticipantsCount(parseInt(e.target.value))}
                          options={[
                            { value: "2", label: "2 kishi" },
                            { value: "3", label: "3 kishi" },
                            { value: "4", label: "4 kishi" },
                            { value: "5", label: "5 kishi" }
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
                        onChange={(e) => setDuration(parseInt(e.target.value))}
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
                        onChange={(e) => setFocusAreas(e.target.value.split(',').map(s => s.trim()).filter(s => s))}
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
                <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Senariyo Turlari</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <h4 className="font-semibold text-blue-900 mb-2">📄 Fuqarolik</h4>
                      <p className="text-sm text-blue-700">Shartnoma, mulkiy nizolar, to'lovlar</p>
                    </div>
                    
                    <div className="p-4 bg-red-50 rounded-xl">
                      <h4 className="font-semibold text-red-900 mb-2">⚖️ Jinoyat</h4>
                      <p className="text-sm text-red-700">Jinoyat ishlari, tergov, sud protsessi</p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-xl">
                      <h4 className="font-semibold text-green-900 mb-2">👨‍👩‍👧‍👦 Oilaviy</h4>
                      <p className="text-sm text-green-700">Ajralish, aliment, vorislik</p>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <h4 className="font-semibold text-purple-900 mb-2">💼 Mehnat</h4>
                      <p className="text-sm text-purple-700">Ishdan bo'shatish, ish haqi, mehnat shartnomasi</p>
                    </div>
                    
                    <div className="p-4 bg-orange-50 rounded-xl">
                      <h4 className="font-semibold text-orange-900 mb-2">🏛️ Ma'muriy</h4>
                      <p className="text-sm text-orange-700">Jarimalar, litsenziyalar, protsedura</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scenario" className="mt-6">
            {currentScenario ? (
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-blue-900 text-2xl">{currentScenario.title}</CardTitle>
                        <p className="text-gray-600 mt-2">{currentScenario.description}</p>
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
                    <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                      <CardContent className="space-y-4 p-6">
                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-1">Mavzu:</p>
                          <p className="text-gray-800">{currentScenario.case_data.subject}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-1">Tarix:</p>
                          <p className="text-gray-800">{currentScenario.case_data.background}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-1">Asosiy muammo:</p>
                          <p className="text-gray-800">{currentScenario.case_data.key_issue}</p>
                        </div>
                        
                        {currentScenario.case_data.additional_facts && (
                          <div>
                            <p className="text-sm font-medium text-blue-700 mb-2">Qo'shimcha faktlar:</p>
                            <div className="space-y-1">
                              {currentScenario.case_data.additional_facts.map((fact: string, index: number) => (
                                <div key={index} className="text-sm text-gray-600">• {fact}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {currentScenario.case_data.complications && (
                          <div>
                            <p className="text-sm font-medium text-blue-700 mb-2">Murakkabliklar:</p>
                            <div className="space-y-1">
                              {currentScenario.case_data.complications.map((comp: string, index: number) => (
                                <div key={index} className="text-sm text-red-600">• {comp}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-2">Huquqiy havolalar:</p>
                          <div className="space-y-1">
                            {currentScenario.legal_references.map((ref: string, index: number) => (
                              <div key={index} className="text-sm text-blue-600">• {ref}</div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-blue-900 mb-4">Maqsadlar</h3>
                    <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                      <CardContent className="space-y-4 p-6">
                        {currentScenario.objectives.map((objective) => (
                          <div key={objective.id} className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium text-blue-900">{objective.description}</p>
                              <Badge className={objective.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                                {objective.priority}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-blue-700">Muvaffaqiyat mezonlari:</p>
                              <div className="space-y-1">
                                {objective.success_criteria.map((criteria: string, index: number) => (
                                  <div key={index} className="text-sm text-gray-600">✓ {criteria}</div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-blue-900 mb-4">Ishtirokchilar ({currentScenario.participants.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentScenario.participants.map(renderParticipant)}
                  </div>
                </div>
              </div>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 mb-4">Hali hech qanday senariyo yaratilmagan</p>
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
              {templates.map((template) => (
                <Card key={template.id} className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl hover:shadow-2xl transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-blue-900 text-lg">{template.title}</CardTitle>
                      <span className="text-2xl">{getScenarioTypeIcon(template.scenario_type)}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{template.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Turi:</span>
                        <span className="font-medium capitalize">{template.scenario_type}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Qiyinlik:</span>
                        <Badge className={getDifficultyColor(template.difficulty_level)}>
                          {template.difficulty_level}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Murakkablik:</span>
                        <Badge className={getComplexityColor(template.complexity)}>
                          {template.complexity}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Davomiyligi:</span>
                        <span className="font-medium">{template.estimated_duration} daqiqa</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ishtirokchilar:</span>
                        <span className="font-medium">{template.participants_count} kishi</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {templates.length === 0 && (
                <div className="col-span-full">
                  <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                    <CardContent className="text-center py-12">
                      <p className="text-gray-500">Shablonlar yuklanmoqda...</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenarios.map((scenario) => (
                <Card 
                  key={scenario.id} 
                  className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
                  onClick={() => {
                    setCurrentScenario(scenario);
                    setActiveTab('scenario');
                  }}
                >
                  <CardHeader>
                    <div className="flex flex-row items-center justify-between">
                      <CardTitle className="text-blue-900 text-lg">
                        {scenario.title}
                      </CardTitle>
                      <span className="text-2xl">{getScenarioTypeIcon(scenario.scenario_type)}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">{scenario.description}</p>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Turi:</span>
                        <span className="font-medium capitalize">{scenario.scenario_type}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ishtirokchilar:</span>
                        <span className="font-medium">{scenario.participants.length} kishi</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Davomiyligi:</span>
                        <span className="font-medium">{scenario.estimated_duration} daqiqa</span>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          {new Date(scenario.created_at).toLocaleDateString('uz-UZ')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {scenarios.length === 0 && (
                <div className="col-span-full">
                  <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                    <CardContent className="text-center py-12">
                      <p className="text-gray-500 mb-4">Hali hech qanday senariylar mavjud emas</p>
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
  );
}
