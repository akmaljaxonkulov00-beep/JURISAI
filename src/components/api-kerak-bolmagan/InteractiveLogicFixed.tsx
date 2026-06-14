'use client';

import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, Lightbulb, Send, Target, Scale, FileText, Award, BookOpen, GitBranch, Play, MessageCircle, Users, TrendingUp, Shield, Clock, Zap, Star, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';

// ==================== CASE SOLVER ====================
interface CaseStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  question: string;
  placeholder: string;
}

interface CaseData {
  id: string;
  title: string;
  description: string;
  difficulty: 'Boshlang\'ich' | 'O\'rta' | 'Yuqori';
  category: string;
  facts: string;
}

export function CaseSolver() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [showAdvice, setShowAdvice] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);

  const currentCase: CaseData = {
    id: 'case_001',
    title: 'Jinoyat ishi №245',
    description: 'O\'g\'irlik holati bo\'yicha',
    difficulty: 'O\'rta',
    category: 'Jinoyat huquqi',
    facts: '2024-yil 15-mart kuni Toshkent shahar, Yunusobod tumanida yashovchi 25 yoshli A.A. Karimov, "Mega Market" do\'koniga kirib, 10 million so\'m miqdoridagi naqd pulni olib qochib ketgan. Do\'kon xodimlari politsiyaga xabar bergan. Karimov 2 kundan keyin qo\'lga olingan. U jinoyatni tan olgan va o\'g\'rilagan pulning 7 million so\'mini qaytarib bergan.'
  };

  const steps: CaseStep[] = [
    {
      id: 'issue',
      title: 'Issue (Muammo)',
      description: 'Asosiy huquqiy nizoni aniqlang',
      icon: <Target className="w-5 h-5" />,
      question: 'Ushbu holatdagi asosiy huquqiy muammo nimadan iborat?',
      placeholder: 'Bu yerda asosiy huquqiy nizo - bu ...'
    },
    {
      id: 'rule',
      title: 'Rule (Qoida)',
      description: 'Tegishli qonun normasini ko\'rsating',
      icon: <Scale className="w-5 h-5" />,
      question: 'Ushbu muammoni hal qilish uchun qaysi qonun, kodeks yoki modda ishlatiladi?',
      placeholder: 'O\'zbekiston Respublikasi Jinoyat kodeksining ... moddasiga ko\'ra ...'
    },
    {
      id: 'application',
      title: 'Application (Tatbiq)',
      description: 'Qonunni faktlarga bog\'lang',
      icon: <FileText className="w-5 h-5" />,
      question: 'Nega aynan bu qonun berilgan vaziyatga to\'g\'ri keladi?',
      placeholder: 'Berilgan holatda ... moddasi qo\'llaniladi, chunki ...'
    },
    {
      id: 'conclusion',
      title: 'Conclusion (Xulosa)',
      description: 'Yakuniy hukm chiqaring',
      icon: <Award className="w-5 h-5" />,
      question: 'Tahlilingiz asosida yakuniy xulosani yozing',
      placeholder: 'Shu sabablarga ko\'ra, A.A. Karimov ... moddasi bo\'yicha javobgarlikka tortilishi kerak...'
    }
  ];

  const adviceHints = {
    issue: [
      'Jinoyat tarkibining to\'rt elementini tekshiring: obyekt, obyektiv tomon, subyekt, subyektiv tomon',
      'O\'g\'irlikning mol-mulkka nisbatan qasddan sodir etilganligiga e\'tibor bering',
      'Karimovning harakatlarining qonunga zid ekanligini ko\'rsating'
    ],
    rule: [
      'Jinoyat kodeksining 169-moddasi (O\'g\'irlik) asosiy qoida',
      'Jinoyat tarkibiga oid umumiy qoidalar (3-modda)',
      'Javobgarlikka tortish shartlari (11-modda)'
    ],
    application: [
      'Karimovning 25 yoshda ekanligi - voyaga yetganligini ko\'rsating',
      '10 million so\'m miqdorini aniqlang - bu katta miqdor',
      'Pulning qisman qaytarilishi javobgarlikka ta\'sir etmasligini izohlang'
    ],
    conclusion: [
      'Jinoyat to\'liq tarkibga ega ekanligini ta\'kidlang',
      'Qattiqroq jazolash omillari yo\'qligini ko\'rsating',
      'Jinoyat kodeksining 59-moddasiga ko\'ra jazoni belgilang'
    ]
  };

  const handleStepChange = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
      setShowAdvice(false);
    }
  };

  const handleAnswerChange = (stepId: string, value: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [stepId]: value
    }));
  };

  const handleGetAdvice = () => {
    setShowAdvice(!showAdvice);
  };

  const handleCheckAnswer = () => {
    // Simulate AI checking
    const currentStepId = steps[currentStep].id;
    const userAnswer = userAnswers[currentStepId] || '';
    
    // Simple scoring logic (in real app, this would be AI-powered)
    let calculatedScore = 0;
    const stepErrors: string[] = [];
    
    if (userAnswer.length < 50) {
      stepErrors.push('Javob juda qisqa. Batafsilroq yozing.');
      calculatedScore += 20;
    } else if (userAnswer.length > 200) {
      calculatedScore += 40;
    } else {
      calculatedScore += 60;
    }
    
    // Check for key terms
    const keyTerms = {
      issue: ['huquqiy', 'nizo', 'og\'irlik', 'mol-mulk'],
      rule: ['modda', 'kodeks', 'qonun', '169'],
      application: ['chunki', 'sabab', 'holat', 'qo\'llaniladi'],
      conclusion: ['shu sababga ko\'ra', 'xulosa', 'javobgarlik', 'jazolanadi']
    };
    
    const terms = keyTerms[currentStepId as keyof typeof keyTerms] || [];
    const foundTerms = terms.filter(term => userAnswer.toLowerCase().includes(term));
    calculatedScore += foundTerms.length * 10;
    
    setScore(Math.min(calculatedScore, 100));
    setErrors(stepErrors);
    setFeedback(
      calculatedScore >= 80 ? 'A\'lo! To\'g\'ri yo\'nalishdasiz.' :
      calculatedScore >= 60 ? 'Yaxshi. Biroq ba\'zi jihatlarni takomillashtirishingiz mumkin.' :
      calculatedScore >= 40 ? 'Qoniqarli. Ko\'proq tahlil qiling.' :
      'Qayta urinib ko\'ring. Maslahatdan foydalaning.'
    );
  };

  const handleReset = () => {
    setCurrentStep(0);
    setUserAnswers({});
    setScore(null);
    setFeedback('');
    setErrors([]);
    setShowAdvice(false);
  };

  const getStepProgress = () => {
    const completedSteps = Object.keys(userAnswers).filter(key => userAnswers[key].trim().length > 0).length;
    return (completedSteps / steps.length) * 100;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Boshlang\'ich': return 'bg-green-100 text-green-700';
      case 'O\'rta': return 'bg-yellow-100 text-yellow-700';
      case 'Yuqori': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-100 min-h-screen">
          <div className="p-6">
            <a href="/" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>Orqaga</span>
            </a>
            
            {/* Case Info */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">{currentCase.title}</h3>
                <Scale className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Toifa:</span>
                  <span className="text-sm font-medium">{currentCase.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Qiyinlik:</span>
                  <Badge className={getDifficultyColor(currentCase.difficulty)}>
                    {currentCase.difficulty}
                  </Badge>
                </div>
              </div>
              
              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{Math.round(getStepProgress())}%</span>
                </div>
                <Progress value={getStepProgress()} className="h-2" />
              </div>
            </div>
            
            {/* Steps Navigation */}
            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                <Scale className="w-5 h-5" />
                <span className="font-medium">Case Solver</span>
              </div>
              
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepChange(index)}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors ${
                    currentStep === index
                      ? 'bg-blue-50 text-blue-600'
                      : userAnswers[step.id]?.trim()
                      ? 'bg-green-50 text-green-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {userAnswers[step.id]?.trim() ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                    )}
                    {step.icon}
                  </div>
                  <span className="text-sm font-medium">{step.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white px-8 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Case Solver</h1>
                <p className="text-sm text-gray-600">IRAC metodi bilan huquqiy tahlil</p>
              </div>
              
              <div className="flex items-center gap-4">
                {score !== null && (
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    <span className="font-bold text-gray-800">{score}%</span>
                  </div>
                )}
                
                <Button variant="outline" onClick={handleReset}>
                  Qayta boshlash
                </Button>
              </div>
            </div>
          </header>

          {/* Case Content */}
          <main className="p-8">
            <div className="max-w-4xl mx-auto">
              {/* Case Facts */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Ish faktlari
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{currentCase.facts}</p>
                </CardContent>
              </Card>

              {/* Current Step */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {steps[currentStep].icon}
                      <CardTitle>{steps[currentStep].title}</CardTitle>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleGetAdvice}
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Maslahat
                    </Button>
                  </div>
                  <p className="text-gray-600">{steps[currentStep].description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Question */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">{steps[currentStep].question}</h4>
                    <textarea
                      value={userAnswers[steps[currentStep].id] || ''}
                      onChange={(e) => handleAnswerChange(steps[currentStep].id, e.target.value)}
                      placeholder={steps[currentStep].placeholder}
                      className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Advice */}
                  {showAdvice && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-blue-600" />
                        <h4 className="font-medium text-blue-800">Maslahat</h4>
                      </div>
                      <ul className="space-y-1">
                        {adviceHints[steps[currentStep].id as keyof typeof adviceHints].map((hint, index) => (
                          <li key={index} className="text-sm text-blue-700">
                            • {hint}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Feedback */}
                  {feedback && (
                    <div className={`rounded-lg p-4 ${
                      score !== null && score >= 80 ? 'bg-green-50 border border-green-200' :
                      score !== null && score >= 60 ? 'bg-yellow-50 border border-yellow-200' :
                      score !== null && score >= 40 ? 'bg-orange-50 border border-orange-200' :
                      'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {score !== null && score >= 80 ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                        )}
                        <h4 className={`font-medium ${
                          score !== null && score >= 80 ? 'text-green-800' :
                          score !== null && score >= 60 ? 'text-yellow-800' :
                          'text-orange-800'
                        }`}>
                          {score !== null && score >= 80 ? 'A\'lo!' : score !== null && score >= 60 ? 'Yaxshi' : 'Qoniqarli'}
                        </h4>
                      </div>
                      <p className={`text-sm ${
                        score !== null && score >= 80 ? 'text-green-700' :
                        score !== null && score >= 60 ? 'text-yellow-700' :
                        'text-orange-700'
                      }`}>
                        {feedback}
                      </p>
                      
                      {errors.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {errors.map((error, index) => (
                            <li key={index} className="text-sm text-orange-700">
                              • {error}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between">
                    <div className="flex gap-2">
                      {currentStep > 0 && (
                        <Button 
                          variant="outline"
                          onClick={() => handleStepChange(currentStep - 1)}
                        >
                          Oldingi
                        </Button>
                      )}
                      
                      {currentStep < steps.length - 1 && (
                        <Button 
                          onClick={() => handleStepChange(currentStep + 1)}
                          disabled={!userAnswers[steps[currentStep].id]?.trim()}
                        >
                          Keyingi
                        </Button>
                      )}
                    </div>
                    
                    <Button onClick={handleCheckAnswer}>
                      Tekshirish
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ==================== DECISION TREE ====================
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

export function DecisionTree() {
  const [currentNode, setCurrentNode] = useState('root');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [startTime] = useState(Date.now());

  // Static tree data
  const mockTreeData: TreeNode[] = [
    {
      id: 'root',
      question: 'Siz qanday turdagi huquqiy masalaga duch keldingiz?',
      options: [
        {
          id: 'civil',
          text: 'Fuqarolik huquqi',
          next_node: 'civil_branch',
          legal_basis: 'O\'zbekiston Respublikasi Fuqarolik kodeksi'
        },
        {
          id: 'criminal',
          text: 'Jinoyat huquqi',
          next_node: 'criminal_branch',
          legal_basis: 'O\'zbekiston Respublikasi Jinoyat kodeksi'
        },
        {
          id: 'labor',
          text: 'Mehnat huquqi',
          next_node: 'labor_branch',
          legal_basis: 'O\'zbekiston Respublikasi Mehnat kodeksi'
        },
        {
          id: 'family',
          text: 'Oilaviy huquq',
          next_node: 'family_branch',
          legal_basis: 'O\'zbekiston Respublikasi Oilaviy kodeksi'
        }
      ]
    },
    {
      id: 'civil_branch',
      question: 'Fuqarolik huquqiy masalangiz qaysi sohaga oid?',
      options: [
        {
          id: 'contract',
          text: 'Shartnoma munosabatlari',
          next_node: 'contract_node',
          legal_basis: 'FK 330-351-moddalar'
        },
        {
          id: 'property',
          text: 'Mulk huquqi',
          next_node: 'property_node',
          legal_basis: 'FK 164-224-moddalar'
        },
        {
          id: 'torts',
          text: 'Zarar yetkazish masalalari',
          next_node: 'torts_node',
          legal_basis: 'FK 569-705-moddalar'
        }
      ]
    },
    {
      id: 'contract_node',
      question: 'Shartnoma bilan bog\'liq qanday muammo mavjud?',
      options: [
        {
          id: 'breach',
          text: 'Shartnoma buzilishi',
          next_node: 'breach_analysis',
          consequence: 'Shartnoma shartlariga rioya etilmagani uchun javobgarlik',
          legal_basis: 'FK 378-modda'
        },
        {
          id: 'invalid',
          text: 'Shartnomaning amal qilmasligi',
          next_node: 'invalid_analysis',
          consequence: 'Shartnoma kuchga kirmaydi',
          legal_basis: 'FK 162-modda'
        },
        {
          id: 'termination',
          text: 'Shartnomani bekor qilish',
          next_node: 'termination_analysis',
          consequence: 'Shartnoma to\'xtatiladi',
          legal_basis: 'FK 351-modda'
        }
      ]
    },
    {
      id: 'breach_analysis',
      question: 'Shartnoma qaysi sharti buzilgan?',
      options: [
        {
          id: 'payment',
          text: 'To\'lov sharti',
          consequence: 'Qarzdorlikni to\'lash majburiyati',
          legal_basis: 'FK 378-modda'
        },
        {
          id: 'delivery',
          text: 'Yetkazib berish sharti',
          consequence: 'Mahsulotni yetkazib berish majburiyati',
          legal_basis: 'FK 378-modda'
        },
        {
          id: 'quality',
          text: 'Sifat sharti',
          consequence: 'Sifatli mahsulot taqdim etish majburiyati',
          legal_basis: 'FK 378-modda'
        }
      ]
    }
  ];

  const getCurrentNode = () => {
    return mockTreeData.find(node => node.id === currentNode);
  };

  const handleOptionSelect = (optionId: string) => {
    const currentNodeData = getCurrentNode();
    if (!currentNodeData) return;

    const selectedOption = currentNodeData.options.find(opt => opt.id === optionId);
    if (!selectedOption) return;

    setSelectedOptions([...selectedOptions, optionId]);

    if (selectedOption.next_node) {
      setCurrentNode(selectedOption.next_node);
    } else {
      // Reached end of tree, analyze the path
      analyzeDecisionPath();
    }
  };

  const analyzeDecisionPath = () => {
    setIsAnalyzing(true);
    
    // Simulate analysis
    setTimeout(() => {
      const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%
      const risks = generateRiskAssessment(selectedOptions);
      const recommendations = generateRecommendations(selectedOptions);
      const legalBasis = extractLegalBasis(selectedOptions);
      
      setAnalysisResult({
        final_decision: generateFinalDecision(selectedOptions),
        confidence_score: confidence,
        legal_basis: legalBasis,
        risks,
        recommendations,
        alternative_paths: generateAlternativePaths(selectedOptions),
        processing_time: Date.now() - startTime
      });
      
      setIsAnalyzing(false);
    }, 2000);
  };

  const generateFinalDecision = (options: string[]): string => {
    const decisions = [
      'Shartnoma buzilishi holatida, da\'vogar majburiyatlarni to\'lash yoki shartnomani bekor qilishni talab qilishi mumkin.',
      'Mulk huquqi masalasida, mulk egasi huquqlarini himoya qilish va tegishli dalillarni taqdim etish zarur.',
      'Mehnat munosabatlarida, ish haqi to\'lanmagan holatda mehnat inspektsiyasiga murojaat qilish tavsiya etiladi.',
      'Oilaviy masalalarda, bolalarning manfaatlarini birinchi o\'ringa qo\'yish va qonuniy asoslarga amal qilish muhim.'
    ];
    
    return decisions[Math.floor(Math.random() * decisions.length)];
  };

  const generateRiskAssessment = (options: string[]) => {
    return [
      {
        type: 'Qonuniy xavf',
        description: 'Dalillarning yetarli emasligi',
        probability: Math.floor(Math.random() * 30) + 20,
        mitigation: 'Qo\'shimcha dalillar yig\'ing'
      },
      {
        type: 'Moliyaviy xavf',
        description: 'Sud xarajatlari',
        probability: Math.floor(Math.random() * 20) + 10,
        mitigation: 'Yurist bilan maslahatlashing'
      },
      {
        type: 'Vaqt xavf',
        description: 'Jarayonning uzoq davom etishi',
        probability: Math.floor(Math.random() * 25) + 15,
        mitigation: 'Tezkor harakat qiling'
      }
    ];
  };

  const generateRecommendations = (options: string[]): string[] => {
    return [
      'Yuridik maslahat oling',
      'Barcha hujjatlarni to\'plang',
      'Dalillarni saqlab qoling',
      'Munosabatlarni yozuvda olib boring',
      'Muqobil yechimlarni ko\'rib chiqing'
    ];
  };

  const extractLegalBasis = (options: string[]): string[] => {
    return [
      'O\'zbekiston Respublikasi Fuqarolik kodeksi',
      'O\'zbekiston Respublikasi Jinoyat kodeksi',
      'O\'zbekiston Respublikasi Mehnat kodeksi',
      'O\'zbekiston Respublikasi Oilaviy kodeksi'
    ];
  };

  const generateAlternativePaths = (options: string[]) => {
    return [
      {
        description: 'Tinchlik yo\'li bilan hal etish',
        outcome: 'Tezkor va arzon yechim',
        probability: 75
      },
      {
        description: 'Sud yo\'li bilan hal etish',
        outcome: 'Uzoq ammo kuchli yechim',
        probability: 85
      },
      {
        description: 'Taqdimot orqali hal etish',
        outcome: 'O\'rta davomiylik va xarajat',
        probability: 60
      }
    ];
  };

  const resetTree = () => {
    setCurrentNode('root');
    setSelectedOptions([]);
    setAnalysisResult(null);
  };

  const goBack = () => {
    if (selectedOptions.length > 0) {
      const newOptions = [...selectedOptions];
      newOptions.pop();
      setSelectedOptions(newOptions);
      
      // Find previous node
      if (newOptions.length === 0) {
        setCurrentNode('root');
      } else {
        // Find the node that leads to the current option
        const previousOption = newOptions[newOptions.length - 1];
        const previousNode = mockTreeData.find(node => 
          node.options.some(opt => opt.id === previousOption)
        );
        if (previousNode) {
          setCurrentNode(previousNode.id);
        }
      }
    }
  };

  const currentNodeData = getCurrentNode();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-100 min-h-screen">
          <div className="p-6">
            <a href="/" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>Orqaga</span>
            </a>
            
            {/* Tree Info */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">Qaror daraxti</h3>
                <GitBranch className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Joriy tugun:</span>
                  <span className="text-sm font-medium">{currentNode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tanlangan variantlar:</span>
                  <span className="text-sm font-medium">{selectedOptions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Holat:</span>
                  <span className="text-sm font-medium">
                    {isAnalyzing ? 'Tahlil qilinmoqda' : analysisResult ? 'Tugallandi' : 'Jarayonda'}
                  </span>
                </div>
              </div>
              
              {/* Progress */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">
                    {analysisResult ? '100%' : `${Math.round((selectedOptions.length / 5) * 100)}%`}
                  </span>
                </div>
                <Progress value={analysisResult ? 100 : (selectedOptions.length / 5) * 100} className="h-2" />
              </div>
            </div>
            
            {/* Actions */}
            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                <GitBranch className="w-5 h-5" />
                <span className="font-medium">Decision Tree</span>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={goBack}
                disabled={selectedOptions.length === 0}
              >
                Orqaga
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={resetTree}
              >
                Qayta boshlash
              </Button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white px-8 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Decision Tree</h1>
                <p className="text-sm text-gray-600">Qaror qabul qilish yo\'nalishini aniqlash</p>
              </div>
              
              {analysisResult && (
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <span className="font-bold text-gray-800">{analysisResult.confidence_score}% ishonch</span>
                </div>
              )}
            </div>
          </header>

          {/* Tree Content */}
          <main className="p-8">
            <div className="max-w-4xl mx-auto">
              {isAnalyzing ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
                    <GitBranch className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Tahlil qilinmoqda...</h3>
                  <p className="text-gray-600">Sizning tanlovingiz asosida qaror tahlil qilinmoqda</p>
                </div>
              ) : analysisResult ? (
                /* Results */
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-600" />
                        Tahlil natijalari
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Final Decision */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Yakuniy qaror</h4>
                        <p className="text-gray-700">{analysisResult.final_decision}</p>
                      </div>
                      
                      {/* Confidence Score */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-800">Ishonch darajasi</h4>
                          <span className="font-bold text-green-600">{analysisResult.confidence_score}%</span>
                        </div>
                        <Progress value={analysisResult.confidence_score} className="h-2" />
                      </div>
                      
                      {/* Legal Basis */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Qonuniy asos</h4>
                        <div className="space-y-1">
                          {analysisResult.legal_basis.map((basis, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-700">{basis}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Risks */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Xavflar</h4>
                        <div className="space-y-2">
                          {analysisResult.risks.map((risk, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-gray-800">{risk.type}</span>
                                <span className="text-sm text-orange-600">{risk.probability}%</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{risk.description}</p>
                              <p className="text-sm text-blue-600">
                                <strong>Kamaytirish:</strong> {risk.mitigation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Recommendations */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Tavsiyalar</h4>
                        <div className="space-y-1">
                          {analysisResult.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm text-gray-700">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Alternative Paths */}
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Muqobil yo\'llar</h4>
                        <div className="space-y-2">
                          {analysisResult.alternative_paths.map((path, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-gray-800">{path.description}</span>
                                <span className="text-sm text-green-600">{path.probability}%</span>
                              </div>
                              <p className="text-sm text-gray-600">{path.outcome}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Processing Time */}
                      <div className="text-sm text-gray-500">
                        Tahlil vaqti: {(analysisResult.processing_time / 1000).toFixed(2)} soniya
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : currentNodeData ? (
                /* Current Node */
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="w-5 h-5" />
                      {currentNodeData.question}
                    </CardTitle>
                    {currentNodeData.description && (
                      <p className="text-gray-600">{currentNodeData.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentNodeData.options.map(option => (
                        <Card 
                          key={option.id}
                          className="cursor-pointer hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-300"
                          onClick={() => handleOptionSelect(option.id)}
                        >
                          <CardContent className="p-4">
                            <h4 className="font-medium text-gray-800 mb-2">{option.text}</h4>
                            
                            {option.consequence && (
                              <p className="text-sm text-gray-600 mb-2">
                                <strong>Natija:</strong> {option.consequence}
                              </p>
                            )}
                            
                            {option.legal_basis && (
                              <p className="text-sm text-blue-600">
                                <strong>Qonuniy asos:</strong> {option.legal_basis}
                              </p>
                            )}
                            
                            {option.probability && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm text-gray-600">Ehtimollik:</span>
                                <Progress value={option.probability} className="h-2 flex-1" />
                                <span className="text-sm font-medium">{option.probability}%</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">Qaror daraxti yuklanmoqda...</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ==================== ACTIVITY FEED ====================
interface ActivityItem {
  id: string;
  type: 'irac_analysis' | 'document_generated' | 'scenario_created' | 'weakness_detected';
  user: {
    name: string;
    avatar?: string;
  };
  action: string;
  details?: string;
  timestamp: Date;
  metadata?: {
    score?: number;
    document_type?: string;
    scenario_type?: string;
    weakness_count?: number;
  };
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
  className?: string;
}

export function ActivityFeed({
  activities,
  maxItems = 10,
  className
}: ActivityFeedProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'irac_analysis':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'document_generated':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'scenario_created':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332-.477 4.5-1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332-.477-4.5-1.253" />
          </svg>
        );
      case 'weakness_detected':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getActivityTypeText = (type: ActivityItem['type']) => {
    switch (type) {
      case 'irac_analysis': return 'IRAC tahlili';
      case 'document_generated': return 'Hujjat generatsiyasi';
      case 'scenario_created': return 'Senariy yaratildi';
      case 'weakness_detected': return 'Kamchilik aniqlandi';
      default: return 'Faoliyat';
    }
  };

  const getActivityTypeColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'irac_analysis': return 'bg-blue-100 text-blue-700';
      case 'document_generated': return 'bg-green-100 text-green-700';
      case 'scenario_created': return 'bg-purple-100 text-purple-700';
      case 'weakness_detected': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'hozirgina';
    if (minutes < 60) return `${minutes} daqiqa oldin`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} soat oldin`;
    return `${Math.floor(minutes / 1440)} kun oldin`;
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className={cn('space-y-4', className)}>
      {displayActivities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-3">
            <MessageCircle className="w-6 h-6" />
          </div>
          <p className="text-gray-500">Hozircha faoliyatlar yo\'q</p>
        </div>
      ) : (
        displayActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
          >
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={getActivityTypeColor(activity.type)}>
                  {getActivityTypeText(activity.type)}
                </Badge>
                
                {activity.metadata?.score && (
                  <Badge variant="outline" className="text-xs">
                    {activity.metadata.score} ball
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-gray-800 mb-1">{activity.action}</p>
              
              {activity.details && (
                <p className="text-xs text-gray-600 mb-2">{activity.details}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                    {activity.user.avatar || activity.user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-600">{activity.user.name}</span>
                </div>
                
                <span className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</span>
              </div>
              
              {/* Metadata */}
              {activity.metadata && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {activity.metadata.document_type && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {activity.metadata.document_type}
                    </span>
                  )}
                  {activity.metadata.scenario_type && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {activity.metadata.scenario_type}
                    </span>
                  )}
                  {activity.metadata.weakness_count !== undefined && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                      {activity.metadata.weakness_count} kamchilik
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ==================== MOCK DATA FOR ACTIVITY FEED ====================
export const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'irac_analysis',
    user: {
      name: 'Dilora Nazarova',
      avatar: '👩‍🏫'
    },
    action: '"Jinoyat ishi #245" IRAC tahlilini tugatdi',
    details: '85% ball oldi, mantiqiy tahlil uchun yuqori baholandi',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    metadata: {
      score: 85
    }
  },
  {
    id: '2',
    type: 'document_generated',
    user: {
      name: 'Aziz Karimov',
      avatar: '👨‍💼'
    },
    action: '"Tijorat shartnomasi" hujjatini generatsiya qildi',
    details: 'Shartnoma shabloni asosida to\'liq hujjat tayyorlandi',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    metadata: {
      document_type: 'Shartnoma'
    }
  },
  {
    id: '3',
    type: 'scenario_created',
    user: {
      name: 'Malika Umarova',
      avatar: '👩‍💼'
    },
    action: 'Yangi sud senariysini yaratdi',
    details: 'O\'rta qiyinlikdagi fuqarolik ishi bo\'yicha senariy',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    metadata: {
      scenario_type: 'Fuqarolik ishi'
    }
  },
  {
    id: '4',
    type: 'weakness_detected',
    user: {
      name: 'Bahodir Toshmatov',
      avatar: '👨‍⚖️'
    },
    action: 'IRAC tahlilida 3 ta kamchilikni aniqladi',
    details: 'Asosiy e\'tibor qoida bo\'limiga qaratildi',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    metadata: {
      weakness_count: 3
    }
  },
  {
    id: '5',
    type: 'irac_analysis',
    user: {
      name: 'Jamshid Xaydarov',
      avatar: '👨‍💼'
    },
    action: '"Mehnat munosabatlari" IRAC tahlilini boshladi',
    details: 'Hozircha Issue qismi ishlanyapti',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    metadata: {
      score: undefined
    }
  }
];
