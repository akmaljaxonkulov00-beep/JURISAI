'use client';

import { useState } from 'react';
import { ArrowLeft, CheckCircle, AlertCircle, Lightbulb, Send, Target, Scale, FileText, Award } from 'lucide-react';

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

export default function CaseSolver() {
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
    facts: '2024-yil 15-mart kuni Toshkent shahar, Yunusobod tumanida yashovchi 25 yoshli A.A. Karimov, "Mega Market" do\'koniga kirib, 10 million so\'m miqdoridagi naqd pulni olib qochib ketgan. Do\'kon xodimlari politsiyaga xabar bergan. Karimov 2 kundan keyin qo\'lga olingan. U jinoyatni tan olgan va o\'g\'rilgan pulning 7 million so\'mini qaytarib bergan.'
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

  const handleCheckAnswer = async () => {
    const currentStepId = steps[currentStep].id;
    const userAnswer = userAnswers[currentStepId] || '';
    
    if (!userAnswer.trim()) {
      setScore(0);
      setErrors(['Javob bo\'sh bo\'lishi mumkin emas']);
      setFeedback('Iltimos, javob kiriting');
      return;
    }

    try {
      // Call IRAC analysis API
      const response = await fetch('/api/ai/irac-analyze-real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          case_text: Object.values(userAnswers).join('\n\n'),
          case_type: currentCase.category.toLowerCase(),
          difficulty_level: currentCase.difficulty.toLowerCase()
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Extract score for current step
        const stepScores = {
          issue: result.scores?.issue || 0,
          rule: result.scores?.rule || 0,
          application: result.scores?.application || 0,
          conclusion: result.scores?.conclusion || 0
        };
        
        const currentScore = stepScores[currentStepId as keyof typeof stepScores] || 0;
        setScore(currentScore);
        
        // Generate feedback based on score
        let feedbackText = '';
        const stepErrors: string[] = [];
        
        if (currentScore >= 80) {
          feedbackText = 'A\'lo ishladingiz! IRAC metodikasini to\'g\'ri qo\'lladingiz.';
        } else if (currentScore >= 60) {
          feedbackText = 'Yaxshi, lekin yaxshilash mumkin.';
          if (result.suggestions && result.suggestions.length > 0) {
            stepErrors.push(...result.suggestions.slice(0, 2));
          }
        } else {
          feedbackText = 'Qayta urinib ko\'ring. IRAC bosqichlariga rioya qiling.';
          if (result.suggestions && result.suggestions.length > 0) {
            stepErrors.push(...result.suggestions.slice(0, 3));
          }
        }
        
        setErrors(stepErrors);
        setFeedback(feedbackText);
        
      } else {
        // Fallback to simple scoring if API fails
        console.log('IRAC API failed, using fallback scoring');
        useFallbackScoring(userAnswer, currentStepId);
      }
    } catch (error) {
      console.log('IRAC API error, using fallback:', error);
      useFallbackScoring(userAnswer, currentStepId);
    }
  };

  const useFallbackScoring = (userAnswer: string, currentStepId: string) => {
    // Simple scoring logic as fallback
    let calculatedScore = 0;
    const stepErrors: string[] = [];
    
    if (userAnswer.length < 50) {
      stepErrors.push('Javob juda qisqa. Batafsilroq yozing.');
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
      calculatedScore >= 80 ? 'A\'lo ishladingiz! IRAC metodikasini to\'g\'ri qo\'lladingiz.' :
      calculatedScore >= 60 ? 'Yaxshi, lekin yaxshilash mumkin. Qo\'shimcha dalillar keltiring.' :
      'Qayta urinib ko\'ring. IRAC bosqichlariga rioya qiling.'
    );
  };

  const handleSaveAnalysis = async () => {
    const allAnswers = Object.values(userAnswers);
    if (allAnswers.length < 4) {
      alert('Iltimos, barcha IRAC bosqichlarini to\'ldiring');
      return;
    }

    try {
      const response = await fetch('/api/case-solver/save-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          case_title: currentCase.title,
          case_category: currentCase.category,
          case_difficulty: currentCase.difficulty,
          irac_analysis: {
            issue: userAnswers.issue || '',
            rule: userAnswers.rule || '',
            application: userAnswers.application || '',
            conclusion: userAnswers.conclusion || ''
          },
          total_score: calculateTotalScore(),
          completed_at: new Date().toISOString()
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`IRAC tahlili saqlandi! ID: ${result.id}`);
      } else {
        // Fallback to local storage
        localStorage.setItem(`irac_analysis_${Date.now()}`, JSON.stringify({
          case_title: currentCase.title,
          irac_analysis: userAnswers,
          total_score: calculateTotalScore(),
          saved_at: new Date().toISOString()
        }));
        alert('IRAC tahlili mahalliy saqlandi (offline rejimda)');
      }
    } catch (error) {
      console.log('Save analysis error:', error);
      // Fallback to local storage
      localStorage.setItem(`irac_analysis_${Date.now()}`, JSON.stringify({
        case_title: currentCase.title,
        irac_analysis: userAnswers,
        total_score: calculateTotalScore(),
        saved_at: new Date().toISOString()
      }));
      alert('IRAC tahlili mahalliy saqlandi (offline rejimda)');
    }
  };

  const calculateTotalScore = () => {
    // Calculate average score from all steps
    const stepScores = Object.values(userAnswers).map(answer => {
      if (!answer) return 0;
      let score = 50; // Base score
      
      if (answer.length > 100) score += 20;
      if (answer.length > 200) score += 10;
      
      // Check for legal terms
      const legalTerms = ['modda', 'kodeks', 'qonun', 'huquqiy', 'nizo', 'javobgarlik'];
      const foundTerms = legalTerms.filter(term => answer.toLowerCase().includes(term));
      score += foundTerms.length * 5;
      
      return Math.min(score, 100);
    });
    
    return Math.round(stepScores.reduce((sum, score) => sum + score, 0) / stepScores.length);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setUserAnswers({});
    setShowAdvice(false);
    setScore(null);
    setFeedback('');
    setErrors([]);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-[#f8faff]">
      <div className="flex">
        {/* Sidebar - same as main page */}
        <div className="w-64 bg-white border-r border-gray-100 min-h-screen">
          <div className="p-6">
            {/* Daily Goal Block */}
            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-gray-800">Kundalik maqsad</span>
                </div>
              </div>
              <div className="mb-2">
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">2 ta case qolgan</p>
            </div>

            {/* Menu Items */}
            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
                <span>Orqaga</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                <Scale className="w-5 h-5" />
                <span className="font-medium">Case Solver</span>
              </div>
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
                <p className="text-sm text-gray-600">IRAC metodikasi bilan huquqiy tahlil</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentCase.difficulty === 'Boshlang\'ich' ? 'bg-green-100 text-green-700' :
                  currentCase.difficulty === 'O\'rta' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {currentCase.difficulty}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {currentCase.category}
                </span>
              </div>
            </div>
          </header>

          {/* Progress Bar */}
          <div className="bg-white px-8 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Qadam {currentStep + 1} / {steps.length}</span>
              <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="p-8">
            <div className="grid grid-cols-4 gap-6">
              {/* Step Navigation */}
              <div className="col-span-1">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-4">IRAC Bosqichlari</h3>
                  <div className="space-y-2">
                    {steps.map((step, index) => (
                      <button
                        key={step.id}
                        onClick={() => handleStepChange(index)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          index === currentStep 
                            ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                            : index < currentStep 
                            ? 'bg-green-50 text-green-600 border border-green-200'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {step.icon}
                          <span className="font-medium text-sm">{step.title}</span>
                        </div>
                        <p className="text-xs opacity-75">{step.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Case Content */}
              <div className="col-span-2">
                {/* Case Details */}
                <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">{currentCase.title}</h2>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <h3 className="font-semibold text-gray-700 mb-2">Holat faktlari:</h3>
                    <p className="text-gray-600 leading-relaxed">{currentCase.facts}</p>
                  </div>
                </div>

                {/* Current Step */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {steps[currentStep].icon}
                      <h3 className="text-lg font-bold text-gray-800">{steps[currentStep].title}</h3>
                    </div>
                    {userAnswers[steps[currentStep].id] && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4">{steps[currentStep].question}</p>
                  
                  <textarea
                    value={userAnswers[steps[currentStep].id] || ''}
                    onChange={(e) => handleAnswerChange(steps[currentStep].id, e.target.value)}
                    placeholder={steps[currentStep].placeholder}
                    className="w-full h-40 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Score and Feedback */}
                  {score !== null && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-800">Ball: {score}/100</span>
                        <span className={`text-sm font-medium ${
                          score >= 80 ? 'text-green-600' : 
                          score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {score >= 80 ? 'A\'lo' : score >= 60 ? 'Yaxshi' : 'Qayta urinib ko\'ring'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{feedback}</p>
                      {errors.length > 0 && (
                        <div className="space-y-1">
                          {errors.map((error, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle className="w-4 h-4" />
                              <span>{error}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleCheckAnswer}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Javobni tekshirish
                    </button>
                    <button
                      onClick={handleGetAdvice}
                      className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      <Lightbulb className="w-4 h-4 inline mr-2" />
                      Maslahat
                    </button>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between mt-6">
                    <button
                      onClick={() => handleStepChange(currentStep - 1)}
                      disabled={currentStep === 0}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Oldingi
                    </button>
                    <div className="flex gap-2">
                      {currentStep === steps.length - 1 && (
                        <button
                          onClick={handleSaveAnalysis}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          💾 Saqlash
                        </button>
                      )}
                      <button
                        onClick={() => handleStepChange(currentStep + 1)}
                        disabled={currentStep === steps.length - 1}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Keyingi →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advice Panel */}
              <div className="col-span-1">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-4">Maslahatlar</h3>
                  
                  {showAdvice ? (
                    <div className="space-y-3">
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <h4 className="font-medium text-yellow-800 mb-2">Qanday yondashish kerak:</h4>
                        <ul className="space-y-2 text-sm text-yellow-700">
                          {adviceHints[steps[currentStep].id as keyof typeof adviceHints].map((hint, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-yellow-500 mt-1">•</span>
                              <span>{hint}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-3">
                        <h4 className="font-medium text-blue-800 mb-2">Esda tutish:</h4>
                        <ul className="space-y-1 text-sm text-blue-700">
                          <li>• Aniq va aniq yozing</li>
                          <li>• Qonun sanalarini ko'rsating</li>
                          <li>• Mantiqiy ketma-ketlikni saqlang</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Maslahat olish uchun "Maslahat" tugmasini bosing</p>
                    </div>
                  )}
                </div>

                {/* XP Reward */}
                <div className="bg-white rounded-2xl p-4 shadow-sm mt-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Mukofotlar</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Muvaffaqiyatli yechim</span>
                      <span className="text-sm font-medium text-green-600">+50 XP</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Birinchi urinishda</span>
                      <span className="text-sm font-medium text-green-600">+25 XP</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">To'liq tahlil</span>
                      <span className="text-sm font-medium text-green-600">+15 XP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
