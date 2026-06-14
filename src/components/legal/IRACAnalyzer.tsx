import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button, Textarea, Tabs, TabsList, TabsTrigger, TabsContent, Badge, Progress } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface IRACAnalysis {
  issue: string;
  rule: string;
  application: string;
  conclusion: string;
  confidence_score: number;
  legal_references: string[];
  analysis_notes: string;
  difficulty_level: string;
  processing_time: number;
}

interface IRACEvaluation {
  component_scores: {
    issue: number;
    rule: number;
    application: number;
    conclusion: number;
  };
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  detailed_feedback: string;
}

const IRACAnalyzer: React.FC = () => {
  const [caseText, setCaseText] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<IRACAnalysis | null>(null);
  const [evaluation, setEvaluation] = useState<IRACEvaluation | null>(null);
  const [activeTab, setActiveTab] = useState('input');

  const handleAnalyze = async () => {
    if (!caseText.trim()) {
      toast.error('Iltimos, toliq matn kiriting');
      return;
    }

    setIsAnalyzing(true);
    setActiveTab('analysis');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock analysis result
      const mockAnalysis: IRACAnalysis = {
        issue: "Shartnomani buzish qonuniy mas'ulati belgilanganmi?",
        rule: "O'zbekiston Respublikasi Fuqarolik kodeksining 330-moddasiga ko'ra, shartnoma tomonlari o'z majburiyatlarini tegishli ravishda bajarishi shart. Majburiyatning bajarilmay qolishi qonuniy asoslarga ega bo'lishi lozim.",
        application: "Berilgan holatda, A tomon B tomonga to'lanadigan summani vaqtida to'lamagan, bu esa shartnomada belgilangan majburiyatning buzilishini tashkil etadi. Bunda to'lov muddati shartnomada aniq belgilangan bo'lib, A tomon ushbu muddatni rioya qilmagan.",
        conclusion: "Shu sabablarga ko'ra, A tomon shartnoma shartlarini buzganligi uchun qonuniy javobgarlikka tortilishi va B tomonga yetkazilgan zarar uchun tovon puli to'lashi majburiy.",
        confidence_score: 0.85,
        legal_references: [
          "Fuqarolik kodeksi 330-moddasi",
          "Fuqarolik kodeksi 367-moddasi",
          "Shartnoma huquqi to'g'risidagi qonun"
        ],
        analysis_notes: "Kompleks tahlil yuqori ishonch darajasida bajarildi. Asosiy qonuniy asoslar aniqlandi.",
        difficulty_level: difficulty,
        processing_time: 2.3
      };

      setAnalysis(mockAnalysis);

      // Auto-evaluate
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockEvaluation: IRACEvaluation = {
        component_scores: {
          issue: 0.9,
          rule: 0.85,
          application: 0.8,
          conclusion: 0.85
        },
        overall_score: 85,
        strengths: [
          "Aniq huquqiy muammoni aniqlash",
          "To'g'ri qonun havolasini keltirish",
          "Mantiqiy xulosa chiqarish"
        ],
        weaknesses: [
          "Qo'shimcha dalillar keltirish kerak",
          "Pretsedent holatlarni ko'rib chiqish"
        ],
        recommendations: [
          "Shartnoma buzilishining oqibatlarini batafsilroq tahlil qiling",
          " Sud amaliyotidagi o'xshash holatlarni keltiring",
          " To'lov kechikishiga oid qo'shimcha qoidalar haqida ma'lumot bering"
        ],
        detailed_feedback: "Sizning IRAC tahlilingiz yaxshi darajada bajarilgan. Huquqiy masala to'g'ri aniqlangan va qonun havolalari to'g'ri keltirilgan. Biroq, tahlilni yanada chuqurlashtirish uchun qo'shimcha dalillar va pretsedent holatlarni keltirish tavsiya etiladi."
      };

      setEvaluation(mockEvaluation);
      toast.success('Tahlil muvaffaqiyatli yakunlandi');

    } catch (error) {
      toast.error('Tahlil jarayonida xatolik yuz berdi');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEvaluate = async () => {
    if (!analysis) return;

    try {
      // Simulate evaluation API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // This would be replaced with actual evaluation
      setActiveTab('evaluation');
      toast.success('Baholash muvaffaqiyatli yakunlandi');

    } catch (error) {
      toast.error('Baholash jarayonida xatolik yuz berdi');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'default';
    if (score >= 70) return 'warning';
    return 'destructive';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">IRAC Tahlilchi</h1>
        <p className="text-gray-600">Huquqiy ishlarni IRAC metodologiyasi bo'yicha tahlil qiling</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="input">Kiritish</TabsTrigger>
          <TabsTrigger value="analysis">Tahlil</TabsTrigger>
          <TabsTrigger value="evaluation">Baholash</TabsTrigger>
          <TabsTrigger value="export">Eksport</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Holat matni</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qiyinlik darajasi
                </label>
                <div className="flex space-x-2">
                  {(['beginner', 'intermediate', 'advanced', 'expert'] as const).map((level) => (
                    <Button
                      key={level}
                      variant={difficulty === level ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDifficulty(level)}
                    >
                      {level === 'beginner' && 'Boshlang\'ich'}
                      {level === 'intermediate' && 'O\'rta'}
                      {level === 'advanced' && 'Yuqori'}
                      {level === 'expert' && 'Ekspert'}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Holat tavsifi
                </label>
                <Textarea
                  placeholder="Huquqiy holatning to'liq tavsifini kiriting..."
                  value={caseText}
                  onChange={(e) => setCaseText(e.target.value)}
                  rows={8}
                  className="w-full"
                />
              </div>

              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || !caseText.trim()}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Tahlil qilinmoqda...
                  </>
                ) : (
                  'Tahlil qilish'
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {isAnalyzing ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <LoadingSpinner size="lg" />
                  <p className="text-gray-600">Tahlil jarayoni davom etmoqda...</p>
                </div>
              </CardContent>
            </Card>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Analysis Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Tahlil natijalari
                    <div className="flex items-center space-x-2">
                      <Badge variant={getScoreBadge(analysis.confidence_score * 100)}>
                        {Math.round(analysis.confidence_score * 100)}% ishonch
                      </Badge>
                      <Badge variant="outline">
                        {analysis.difficulty_level}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-500">Ishlov vaqti</span>
                      <p className="font-semibold">{analysis.processing_time} soniya</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Qiyinlik</span>
                      <p className="font-semibold capitalize">{analysis.difficulty_level}</p>
                    </div>
                  </div>
                  <Progress value={analysis.confidence_score * 100} className="mb-2" />
                  <p className="text-sm text-gray-600">{analysis.analysis_notes}</p>
                </CardContent>
              </Card>

              {/* IRAC Components */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Issue (Masala)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{analysis.issue}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rule (Qoida)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{analysis.rule}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Application (Qo'llash)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{analysis.application}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Conclusion (Xulosa)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{analysis.conclusion}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Legal References */}
              <Card>
                <CardHeader>
                  <CardTitle>Qonuniy havolalar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.legal_references.map((ref, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-700">{ref}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Button onClick={handleEvaluate} className="w-full">
                Baholash
              </Button>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <p>Hali tahlil qilinmagan</p>
                  <p className="text-sm mt-2">Avval holat matnini kiriting va tahlil qiling</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-6">
          {evaluation ? (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle>Umumiy baholash</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-6xl font-bold text-gray-900">
                      {evaluation.overall_score}
                    </div>
                    <Badge variant={getScoreBadge(evaluation.overall_score)} className="text-lg px-4 py-2">
                      {evaluation.overall_score >= 90 && 'A\'lo'}
                      {evaluation.overall_score >= 80 && evaluation.overall_score < 90 && 'Yaxshi'}
                      {evaluation.overall_score >= 70 && evaluation.overall_score < 80 && 'Qoniqarli'}
                      {evaluation.overall_score < 70 && 'Qoniqarsiz'}
                    </Badge>
                    <Progress value={evaluation.overall_score} className="max-w-md mx-auto" />
                  </div>
                </CardContent>
              </Card>

              {/* Component Scores */}
              <Card>
                <CardHeader>
                  <CardTitle>Komponentlar bo'yicha baholar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(evaluation.component_scores).map(([component, score]) => (
                      <div key={component} className="flex items-center justify-between">
                        <span className="capitalize font-medium">{component}</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={score} className="w-32" />
                          <span className={cn("font-semibold", getScoreColor(score))}>
                            {score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Kuchli tomonlar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {evaluation.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Kamchiliklar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {evaluation.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-red-500 mt-1">!</span>
                          <span className="text-gray-700">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle>Tavsiyalar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {evaluation.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">→</span>
                        <span className="text-gray-700">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Detailed Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle>Batafsil fikr-mulohazalar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{evaluation.detailed_feedback}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <p>Hali baholash qilinmagan</p>
                  <p className="text-sm mt-2">Avval tahlilni bajaring</p>
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
                  PDF
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Word
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  JSON
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { IRACAnalyzer };
