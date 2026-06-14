import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button, Select, Badge, Progress, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface LegalScenario {
  id: string;
  title: string;
  scenario_type: string;
  difficulty_level: string;
  complexity: string;
  background: string;
  facts: string[];
  parties: Record<string, string>;
  legal_issues: string[];
  applicable_law: string[];
  discussion_questions: string[];
  learning_objectives: string[];
  estimated_time: number;
  tags: string[];
  created_at: Date;
}

interface ScenarioGenerationRequest {
  scenario_type: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  focus_area?: string;
  learning_objectives?: string[];
  estimated_time?: number;
}

const ScenarioGenerator: React.FC = () => {
  const [request, setRequest] = useState<ScenarioGenerationRequest>({
    scenario_type: 'contract_dispute',
    difficulty_level: 'intermediate',
    complexity: 'moderate'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScenarios, setGeneratedScenarios] = useState<LegalScenario[]>([]);
  const [activeTab, setActiveTab] = useState('generator');

  const scenarioTypes = [
    { value: 'contract_dispute', label: 'Shartnoma nizolari' },
    { value: 'property_dispute', label: 'Mulk nizolari' },
    { value: 'tort_claim', label: 'Tort da\'volari' },
    { value: 'family_law', label: 'Oila huquqi' },
    { value: 'criminal_case', label: 'Jinoyat ishlari' },
    { value: 'administrative_law', label: 'Ma\'muriy huquq' },
    { value: 'business_law', label: 'Biznes huquqi' },
    { value: 'employment_law', label: 'Mehnat huquqi' }
  ];

  const difficultyLevels = [
    { value: 'beginner', label: 'Boshlang\'ich' },
    { value: 'intermediate', label: 'O\'rta' },
    { value: 'advanced', label: 'Yuqori' },
    { value: 'expert', label: 'Ekspert' }
  ];

  const complexityLevels = [
    { value: 'simple', label: 'Oddiy' },
    { value: 'moderate', label: 'O\'rtacha' },
    { value: 'complex', label: 'Murakkab' },
    { value: 'very_complex', label: 'Juda murakkab' }
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate scenario based on request
      const scenario = await generateScenario(request);
      setGeneratedScenarios(prev => [scenario, ...prev]);
      setActiveTab('scenarios');
      toast.success('Senariy muvaffaqiyatli yaratildi');

    } catch (error) {
      toast.error('Senariy yaratishda xatolik yuz berdi');
      console.error('Scenario generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateScenario = async (req: ScenarioGenerationRequest): Promise<LegalScenario> => {
    // Mock scenario generation based on type and complexity
    const scenarioData = {
      contract_dispute: {
        title: 'Xizmat shartnomasini buzish holati',
        background: 'A kompaniyasi B kompaniyasidan marketing xizmatlarini olgan, ammo to\'lov muddati kechikishi sababli shartnoma buzilgan.',
        facts: [
          '2023-yil 1-yanvarda xizmat shartnomasi tuzilgan',
          'Xizmat muddati 6 oy, to\'lov summasi 50 million so\'m',
          'A kompaniyasi xizmatni to\'liq bajargan',
          'B kompaniyasi to\'lovni 2 oy kechiktirgan'
        ],
        parties: {
          'Kompaniya A': 'Xizmat ko\'rsatuvchi',
          'Kompaniya B': 'Xizmat oluvchi'
        },
        legal_issues: [
          'Shartnoma buzilishining qonuniy sabablari bormi?',
          'B kompaniyasining kechikish uchun javobgarligi qanday?',
          'Zarar miqdorini qanday belgilash mumkin?'
        ],
        applicable_law: [
          'Fuqarolik kodeksi 330-moddasi',
          'Fuqarolik kodeksi 367-moddasi',
          'Shartnoma huquqi to\'g\'risidagi qonun'
        ],
        discussion_questions: [
          'Shartnomada to\'lov muddatlari aniq belgilanganmi?',
          'Kechikishning sabablari qonuniy hisoblanadimi?',
          'B kompaniyasi qo\'shimcha zarar undirishi mumkinmi?'
        ],
        learning_objectives: [
          'Shartnoma huquqini tushunish',
          'Javobgarlik shartlarini o\'rganish',
          'Zararni hisoblash usullarini bilish'
        ]
      },
      property_dispute: {
        title: 'Uy-joy mulki nizosi',
        background: 'Ikki aka-uka ota meros qoldan uy-joyga egalik huquqini belgilash uchun sudga murojaat qilishdi.',
        facts: [
          'Ota 2020-yilda vafot etgan',
          'Vasiyatnomasida uy-joy kichik o\'g\'liga qoldirilgan',
          'Katta o\'g\'li vasiyatnomani tan olmagan',
          'Kichik o\'g\'li uyda yashab, xarajatlarni qoplagan'
        ],
        parties: {
          'Kichik o\'g\'li': 'Da\'vogar',
          'Katta o\'g\'li': 'Javobgar'
        },
        legal_issues: [
          'Vasiyatnoma qarshi da\'vo qilish asoslari bormi?',
          'Kichik o\'g\'lining mulk huquqi qanday himoyalangan?',
          'Katta o\'g\'lining huquqlari nimadir?'
        ],
        applicable_law: [
          'Fuqarolik kodeksi 1117-1135-moddalar',
          'Meros huquqi to\'g\'risidagi qonun',
          'Oila kodeksi'
        ],
        discussion_questions: [
          'Vasiyatnoma qarshi da\'vo qilish muddati qancha?',
          'Kichik o\'g\'lining mulkni egallash uchun qanday harakatlar qilgan?',
          'Sud qanday qaror qabul qilishi mumkin?'
        ],
        learning_objectives: [
          'Meros huquqini tushunish',
          'Vasiyatnoma oid qonunlarni o\'rganish',
          'Mulk nizolari bo\'yicha amaliyotni bilish'
        ]
      }
    };

    const typeData = scenarioData[req.scenario_type as keyof typeof scenarioData] || scenarioData.contract_dispute;

    const scenario: LegalScenario = {
      id: `SCN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: typeData.title,
      scenario_type: req.scenario_type,
      difficulty_level: req.difficulty_level,
      complexity: req.complexity,
      background: typeData.background,
      facts: typeData.facts,
      parties: typeData.parties,
      legal_issues: typeData.legal_issues,
      applicable_law: typeData.applicable_law,
      discussion_questions: typeData.discussion_questions,
      learning_objectives: typeData.learning_objectives,
      estimated_time: req.estimated_time || 45,
      tags: [req.scenario_type, req.difficulty_level, req.complexity],
      created_at: new Date()
    };

    return scenario;
  };

  const handleExport = (scenario: LegalScenario, format: 'pdf' | 'word' | 'txt') => {
    toast.success(`Senariy ${format.toUpperCase()} formatda eksport qilinmoqda`);
    // Implement actual export logic here
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'contract_dispute': return 'bg-blue-100 text-blue-800';
      case 'property_dispute': return 'bg-green-100 text-green-800';
      case 'tort_claim': return 'bg-purple-100 text-purple-800';
      case 'family_law': return 'bg-pink-100 text-pink-800';
      case 'criminal_case': return 'bg-red-100 text-red-800';
      case 'administrative_law': return 'bg-orange-100 text-orange-800';
      case 'business_law': return 'bg-indigo-100 text-indigo-800';
      case 'employment_law': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'contract_dispute': return 'Shartnoma nizolari';
      case 'property_dispute': return 'Mulk nizolari';
      case 'tort_claim': return 'Tort da\'volari';
      case 'family_law': return 'Oila huquqi';
      case 'criminal_case': return 'Jinoyat ishlari';
      case 'administrative_law': return 'Ma\'muriy huquq';
      case 'business_law': return 'Biznes huquqi';
      case 'employment_law': return 'Mehnat huquqi';
      default: return type;
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyName = (level: string) => {
    switch (level) {
      case 'beginner': return 'Boshlang\'ich';
      case 'intermediate': return 'O\'rta';
      case 'advanced': return 'Yuqori';
      case 'expert': return 'Ekspert';
      default: return level;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-orange-100 text-orange-800';
      case 'very_complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityName = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'Oddiy';
      case 'moderate': return 'O\'rtacha';
      case 'complex': return 'Murakkab';
      case 'very_complex': return 'Juda murakkab';
      default: return complexity;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Senariy Generatori</h1>
        <p className="text-gray-600">Huquqiy ta\'lim senariylarini yarating</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generator">Yaratish</TabsTrigger>
          <TabsTrigger value="scenarios">Yaratilgan senariylar</TabsTrigger>
          <TabsTrigger value="export">Eksport</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Senariy parametrlari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senariy turi
                  </label>
                  <select
                    value={request.scenario_type}
                    onChange={(e) => setRequest(prev => ({ ...prev, scenario_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {scenarioTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qiyinlik darajasi
                  </label>
                  <select
                    value={request.difficulty_level}
                    onChange={(e) => setRequest(prev => ({ ...prev, difficulty_level: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {difficultyLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Murakkablik darajasi
                  </label>
                  <select
                    value={request.complexity}
                    onChange={(e) => setRequest(prev => ({ ...prev, complexity: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {complexityLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fokus yo\'nalishi (ixtiyoriy)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masalan: to\'lov masalasi, mulk huquqi..."
                  value={request.focus_area || ''}
                  onChange={(e) => setRequest(prev => ({ ...prev, focus_area: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taxminiyot vaqt (daqiqa)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="45"
                  value={request.estimated_time || ''}
                  onChange={(e) => setRequest(prev => ({ ...prev, estimated_time: parseInt(e.target.value) }))}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Senariy yaratilmoqda...
                  </>
                ) : (
                  'Senariy yaratish'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          {generatedScenarios.length > 0 ? (
            <div className="space-y-6">
              {generatedScenarios.map((scenario) => (
                <Card key={scenario.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{scenario.title}</CardTitle>
                      <div className="flex space-x-2">
                        <Badge className={getTypeColor(scenario.scenario_type)}>
                          {getTypeName(scenario.scenario_type)}
                        </Badge>
                        <Badge className={getDifficultyColor(scenario.difficulty_level)}>
                          {getDifficultyName(scenario.difficulty_level)}
                        </Badge>
                        <Badge className={getComplexityColor(scenario.complexity)}>
                          {getComplexityName(scenario.complexity)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Fon</h4>
                        <p className="text-gray-700">{scenario.background}</p>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Faktlar</h4>
                        <ul className="space-y-1">
                          {scenario.facts.map((fact, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span className="text-gray-700">{fact}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Tomonlar</h4>
                        <div className="space-y-1">
                          {Object.entries(scenario.parties).map(([party, description]) => (
                            <div key={party} className="flex justify-between">
                              <span className="font-medium">{party}:</span>
                              <span className="text-gray-700">{description}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Huquqiy masalalar</h4>
                        <ul className="space-y-1">
                          {scenario.legal_issues.map((issue, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-green-500 mt-1">?</span>
                              <span className="text-gray-700">{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Taxminiyot vaqt: {scenario.estimated_time} daqiqa</span>
                        <span>{scenario.created_at.toLocaleDateString('uz-UZ')}</span>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport(scenario, 'pdf')}
                        >
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport(scenario, 'word')}
                        >
                          Word
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport(scenario, 'txt')}
                        >
                          TXT
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <p>Hali senariylar yaratilmagan</p>
                  <p className="text-sm mt-2">Birinchi senariyni yarating</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Barcha eksport</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Barcha PDF
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Barcha Word
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Barcha JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { ScenarioGenerator };
