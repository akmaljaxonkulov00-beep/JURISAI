import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button, Badge, Progress, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface TreeNode {
  id: string;
  question: string;
  description?: string;
  options: Array<{
    id: string;
    text: string;
    next_node?: string;
    consequence?: string;
    probability?: number;
    legal_basis?: string;
  }>;
  category?: string;
  difficulty_level?: string;
}

interface DecisionPath {
  node_id: string;
  option_id: string;
  answer: string;
  timestamp: Date;
}

interface AnalysisResult {
  final_decision: string;
  confidence_score: number;
  legal_basis: string[];
  risks: Array<{
    type: string;
    description: string;
    probability: number;
    mitigation: string;
  }>;
  recommendations: string[];
  alternative_paths: Array<{
    description: string;
    outcome: string;
    probability: number;
  }>;
  processing_time: number;
}

const DecisionTree: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('contract_dispute');
  const [currentNodeId, setCurrentNodeId] = useState<string>('root');
  const [decisionPath, setDecisionPath] = useState<DecisionPath[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('tree');

  const scenarios = [
    {
      id: 'contract_dispute',
      name: 'Shartnoma nizosi',
      description: 'Shartnoma majburiyatlarini buzish holatida qaror qabul qilish'
    },
    {
      id: 'property_dispute',
      name: 'Mulk nizosi',
      description: 'Mulk huquqi bilan bog\'liq nizolarni hal qilish'
    },
    {
      id: 'employment_dispute',
      name: 'Mehnat nizosi',
      description: 'Ishchi va ish beruvchi o\'rtasidagi nizolarni hal qilish'
    },
    {
      id: 'family_dispute',
      name: 'Oila nizosi',
      description: 'Oila huquqiy munosabatlaridagi nizolarni hal qilish'
    }
  ];

  const decisionTrees: Record<string, TreeNode> = {
    contract_dispute: {
      id: 'root',
      question: 'Shartnoma majburiyati buzilganimi?',
      description: 'Avvalo, shartnoma shartlari buzilgani yoki yo\'qligini aniqlang',
      options: [
        {
          id: 'yes',
          text: 'Ha, buzilgan',
          next_node: 'breach_type',
          probability: 0.8,
          legal_basis: 'Fuqarolik kodeksi 330-moddasi'
        },
        {
          id: 'no',
          text: 'Yo\'q, buzilmagan',
          next_node: 'no_breach',
          probability: 0.2,
          legal_basis: 'Fuqarolik kodeksi 329-moddasi'
        }
      ]
    },
    breach_type: {
      id: 'breach_type',
      question: 'Qanday turdagi buzilish sodir bo\'ldi?',
      description: 'Shartnoma buzilishining turini aniqlang',
      options: [
        {
          id: 'payment',
          text: 'To\'lov buzilishi',
          next_node: 'payment_analysis',
          probability: 0.6,
          legal_basis: 'Fuqarolik kodeksi 367-moddasi'
        },
        {
          id: 'quality',
          text: 'Sifat buzilishi',
          next_node: 'quality_analysis',
          probability: 0.3,
          legal_basis: 'Fuqarolik kodeksi 693-moddasi'
        },
        {
          id: 'timing',
          text: 'Muddat buzilishi',
          next_node: 'timing_analysis',
          probability: 0.4,
          legal_basis: 'Fuqarolik kodeksi 331-moddasi'
        }
      ]
    },
    payment_analysis: {
      id: 'payment_analysis',
      question: 'To\'lov qachon kechiktirilgan?',
      description: 'To\'lov muddatining buzilish holatini aniqlang',
      options: [
        {
          id: 'less_than_30',
          text: '30 kundan kam',
          next_node: 'minor_delay',
          probability: 0.7,
          legal_basis: 'Fuqarolik kodeksi 367-moddasi 1-qism'
        },
        {
          id: 'more_than_30',
          text: '30 kundan ko\'p',
          next_node: 'significant_delay',
          probability: 0.9,
          legal_basis: 'Fuqarolik kodeksi 367-moddasi 2-qism'
        }
      ]
    },
    quality_analysis: {
      id: 'quality_analysis',
      question: 'Sifat buzilish darajasi qanday?',
      description: 'Xizmat yoki tovar sifatining buzilish holatini baholang',
      options: [
        {
          id: 'minor_defect',
          text: 'Kichik nuqsonlar',
          next_node: 'minor_quality',
          probability: 0.5,
          legal_basis: 'Fuqarolik kodeksi 693-moddasi'
        },
        {
          id: 'major_defect',
          text: 'Katta nuqsonlar',
          next_node: 'major_quality',
          probability: 0.8,
          legal_basis: 'Fuqarolik kodeksi 693-moddasi'
        }
      ]
    },
    timing_analysis: {
      id: 'timing_analysis',
      question: 'Muddat buzilishining oqibatlari qanday?',
      description: 'Muddat buzilishining oqibatlarini baholang',
      options: [
        {
          id: 'no_damage',
          text: 'Zarar keltirmagan',
          next_node: 'no_damage',
          probability: 0.3,
          legal_basis: 'Fuqarolik kodeksi 331-moddasi'
        },
        {
          id: 'damage_caused',
          text: 'Zarar keltirgan',
          next_node: 'damage_caused',
          probability: 0.7,
          legal_basis: 'Fuqarolik kodeksi 331-moddasi'
        }
      ]
    },
    minor_delay: {
      id: 'minor_delay',
      question: 'Kechikish sababi qonuniy emasmi?',
      description: 'Kechikishning qonuniy sabablari borligini tekshiring',
      options: [
        {
          id: 'legal_reason',
          text: 'Qonuniy sabab bor',
          next_node: 'legal_justification',
          probability: 0.2,
          legal_basis: 'Fuqarolik kodeksi 367-moddasi 3-qism'
        },
        {
          id: 'no_legal_reason',
          text: 'Qonuniy sabab yo\'q',
          next_node: 'no_legal_justification',
          probability: 0.9,
          legal_basis: 'Fuqarolik kodeksi 367-moddasi 4-qism'
        }
      ]
    },
    significant_delay: {
      id: 'significant_delay',
      question: 'Jiddiy kechikish uchun javobgarlik qanday?',
      description: 'Jiddiy kechikish uchun qonuniy javobgarlikni aniqlang',
      options: [
        {
          id: 'full_liability',
          text: 'To\'liq javobgarlik',
          next_node: 'full_responsibility',
          probability: 0.95,
          legal_basis: 'Fuqarolik kodeksi 367-moddasi 2-qism'
        },
        {
          id: 'partial_liability',
          text: 'Qisman javobgarlik',
          next_node: 'partial_responsibility',
          probability: 0.6,
          legal_basis: 'Fuqarolik kodeksi 367-moddasi 5-qism'
        }
      ]
    },
    // Terminal nodes
    legal_justification: {
      id: 'legal_justification',
      question: 'Qonuniy asoslangan kechikish',
      description: 'Kechikish qonuniy asoslangan, javobgarlik kamaytirilishi mumkin',
      options: [
        {
          id: 'conclusion',
          text: 'Xulosa',
          consequence: 'Kechikish qonuniy asoslanganligi uchun tovon puli kamaytirilishi yoki to\'lanmasligi mumkin',
          probability: 0.2,
          legal_basis: 'Fuqarolik kodeksi 367-moddasi 3-qism'
        }
      ]
    },
    no_legal_justification: {
      id: 'no_legal_justification',
      question: 'Qonuniy asossiz kechikish',
      description: 'Kechikish qonuniy asossiz, tovon puli to\'lanishi shart',
      options: [
        {
          id: 'conclusion',
          text: 'Xulosa',
          consequence: 'Kechikish uchun foizlar va asosiy summani to\'lash shart',
          probability: 0.9,
          legal_basis: 'Fuqarolik kodeksi 367-moddasi 4-qism'
        }
      ]
    },
    full_responsibility: {
      id: 'full_responsibility',
      question: 'To\'liq javobgarlik',
      description: 'Jiddiy kechikish uchun to\'liq javobgarlik',
      options: [
        {
          id: 'conclusion',
          text: 'Xulosa',
          consequence: 'Jiddiy kechikish uchun foizlar, asosiy summa va qo\'shimcha zararni to\'lash shart',
          probability: 0.95,
          legal_basis: 'Fuqarolik kodeksi 367-moddasi 2-qism'
        }
      ]
    }
  };

  const getCurrentNode = (): TreeNode => {
    return decisionTrees[currentNodeId] || decisionTrees[selectedScenario] || decisionTrees.contract_dispute;
  };

  const handleOptionSelect = async (option: any) => {
    // Add to decision path
    const newPath: DecisionPath = {
      node_id: currentNodeId,
      option_id: option.id,
      answer: option.text,
      timestamp: new Date()
    };

    setDecisionPath(prev => [...prev, newPath]);

    // Move to next node or conclude
    if (option.next_node) {
      setCurrentNodeId(option.next_node);
    } else {
      // Terminal node reached, analyze the path
      await analyzeDecisionPath([...decisionPath, newPath]);
    }
  };

  const analyzeDecisionPath = async (path: DecisionPath[]) => {
    setIsAnalyzing(true);
    setActiveTab('analysis');

    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock analysis result
      const mockResult: AnalysisResult = {
        final_decision: 'Shartnoma buzilishi uchun 30 million so\'m miqdorida tovon puli to\'lash tavsiya etiladi',
        confidence_score: 0.85,
        legal_basis: [
          'Fuqarolik kodeksi 330-moddasi - Shartnoma majburiyatlari',
          'Fuqarolik kodeksi 367-moddasi - To\'lov majburiyatining buzilishi',
          'Fuqarolik kodeksi 11-moddasi - Majburiyatlarni bajarish tartibi'
        ],
        risks: [
          {
            type: 'sud_proceedings',
            description: 'Sud jarayonining uzoq davom etishi xavfi',
            probability: 0.3,
            mitigation: 'Taraflar o\'rtasida kelishuvga erishishga harakat qiling'
          },
          {
            type: 'payment_default',
            description: 'Javobgar to\'lovni amalga oshirmaslik xavfi',
            probability: 0.2,
            mitigation: 'Garantiya yoki bank kafolati talab qiling'
          }
        ],
        recommendations: [
          'Taraflar o\'rtasida muzokaraga harakat qiling',
          'Qo\'shimcha dalillar va hujjatlarni tayyorlang',
          'Advokat maslahatini oling',
          'Sudga murojaat qilishdan oldin barcha imkoniyatlarni ko\'rib chiqing'
        ],
        alternative_paths: [
          {
            description: 'Tinchlik yo\'li bilan hal qilish',
            outcome: 'Kamroq xarajat bilan tezroq hal etish',
            probability: 0.7
          },
          {
            description: 'Sud orqali hal qilish',
            outcome: 'To\'liq huquqiy himoya, lekin uzoq vaqtni talab qiladi',
            probability: 0.9
          }
        ],
        processing_time: 2.3
      };

      setAnalysisResult(mockResult);
      toast.success('Qaror yo\'nalishi muvaffaqiyatli tahlil qilindi');

    } catch (error) {
      toast.error('Tahlil jarayonida xatolik yuz berdi');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setCurrentNodeId('root');
    setDecisionPath([]);
    setAnalysisResult(null);
    setActiveTab('tree');
  };

  const handleBack = () => {
    if (decisionPath.length > 0) {
      const newPath = decisionPath.slice(0, -1);
      setDecisionPath(newPath);
      
      if (newPath.length > 0) {
        const previousNode = newPath[newPath.length - 1];
        setCurrentNodeId(previousNode.node_id);
      } else {
        setCurrentNodeId('root');
      }
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (probability: number) => {
    if (probability >= 0.7) return 'bg-red-100 text-red-800';
    if (probability >= 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Qaror Daraxti</h1>
        <p className="text-gray-600">Huquqiy vaziyatlarda qaror qabul qilish yo\'nalishini aniqlang</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tree">Qaror daraxti</TabsTrigger>
          <TabsTrigger value="path">Yo\'nalish</TabsTrigger>
          <TabsTrigger value="analysis">Tahlil</TabsTrigger>
          <TabsTrigger value="export">Eksport</TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Senariy tanlash</CardTitle>
                <div className="flex space-x-2">
                  {decisionPath.length > 0 && (
                    <Button variant="outline" onClick={handleBack}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Orqaga
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleReset}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Qayta boshlash
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className={cn(
                      'border rounded-lg p-4 cursor-pointer transition-colors',
                      selectedScenario === scenario.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => {
                      setSelectedScenario(scenario.id);
                      handleReset();
                    }}
                  >
                    <h3 className="font-medium mb-2">{scenario.name}</h3>
                    <p className="text-sm text-gray-600">{scenario.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Decision Tree */}
          <Card>
            <CardHeader>
              <CardTitle>Qaror daraxti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Progress indicator */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Qaror yo\'nalishi</span>
                  <span className="text-sm text-gray-500">{decisionPath.length} qadam</span>
                </div>
                <Progress value={(decisionPath.length / 5) * 100} />

                {/* Current node */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-2">{getCurrentNode().question}</h3>
                  {getCurrentNode().description && (
                    <p className="text-gray-600 mb-4">{getCurrentNode().description}</p>
                  )}
                  
                  <div className="space-y-3">
                    {getCurrentNode().options.map((option) => (
                      <div
                        key={option.id}
                        className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleOptionSelect(option)}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{option.text}</h4>
                          {option.probability && (
                            <Badge variant="outline">
                              {Math.round(option.probability * 100)}%
                            </Badge>
                          )}
                        </div>
                        {option.legal_basis && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Qonuniy asos:</span> {option.legal_basis}
                          </p>
                        )}
                        {option.consequence && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                            <p className="text-sm font-medium text-yellow-900">Oqibat:</p>
                            <p className="text-sm text-yellow-700">{option.consequence}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="path" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tanlangan yo\'nalish</CardTitle>
            </CardHeader>
            <CardContent>
              {decisionPath.length > 0 ? (
                <div className="space-y-4">
                  {decisionPath.map((step, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{step.answer}</p>
                        <p className="text-sm text-gray-500">
                          {step.timestamp.toLocaleTimeString('uz-UZ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>Hali hech qanday tanlov qilinmagan</p>
                  <p className="text-sm mt-2">Qaror daraxtidan boshlang</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {isAnalyzing ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <LoadingSpinner size="lg" />
                  <p className="text-gray-600">Qaror yo\'nalishi tahlil qilinmoqda...</p>
                  <p className="text-sm text-gray-500">AI tahlili olib borilmoqda</p>
                </div>
              </CardContent>
            </Card>
          ) : analysisResult ? (
            <div className="space-y-6">
              {/* Final Decision */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Yakuniy qaror
                    <Badge variant="default" className="text-lg px-4 py-2">
                      {Math.round(analysisResult.confidence_score * 100)}% ishonch
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-900">
                        {analysisResult.final_decision}
                      </p>
                      <div className={cn("text-4xl font-bold mt-4", getConfidenceColor(analysisResult.confidence_score))}>
                        {Math.round(analysisResult.confidence_score * 100)}%
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Ishonch darajasi</p>
                    </div>
                    <Progress value={analysisResult.confidence_score * 100} className="max-w-md mx-auto" />
                  </div>
                </CardContent>
              </Card>

              {/* Legal Basis */}
              <Card>
                <CardHeader>
                  <CardTitle>Qonuniy asoslar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.legal_basis.map((basis, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span className="text-gray-700">{basis}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Risks */}
              <Card>
                <CardHeader>
                  <CardTitle>Xavf-xatolar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResult.risks.map((risk, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{risk.type}</h4>
                          <Badge className={getRiskColor(risk.probability)}>
                            {Math.round(risk.probability * 100)}%
                          </Badge>
                        </div>
                        <p className="text-gray-700 mb-2">{risk.description}</p>
                        <div className="p-2 bg-blue-50 rounded">
                          <p className="text-sm font-medium text-blue-900">Kamaytirish:</p>
                          <p className="text-sm text-blue-700">{risk.mitigation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Tavsiyalar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">→</span>
                        <span className="text-gray-700">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Alternative Paths */}
              <Card>
                <CardHeader>
                  <CardTitle>Alternative yo\'nalishlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResult.alternative_paths.map((path, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">{path.description}</h4>
                        <p className="text-gray-700 mb-2">{path.outcome}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Ehtimollik:</span>
                          <Badge variant="outline">
                            {Math.round(path.probability * 100)}%
                          </Badge>
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
                  <p>Hali tahlil qilinmagan</p>
                  <p className="text-sm mt-2">Qaror daraxtidan boshlang</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Eksport variantlari</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF Hisobot
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Word Hisobot
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  JSON Ma\'lumot
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { DecisionTree };
