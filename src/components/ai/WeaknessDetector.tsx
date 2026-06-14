import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button, Textarea, Badge, Progress, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { LoadingSpinner } from '@/components/ui';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface Weakness {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  suggestion: string;
  confidence: number;
  impact_score: number;
}

interface WeaknessAnalysisResult {
  argument_text: string;
  argument_type: string;
  weaknesses: Weakness[];
  overall_score: number;
  strength_areas: string[];
  improvement_recommendations: string[];
  detailed_feedback: string;
  processing_time: number;
  timestamp: Date;
}

const WeaknessDetector: React.FC = () => {
  const [argumentText, setArgumentText] = useState('');
  const [argumentType, setArgumentType] = useState<'irac_analysis' | 'legal_brief' | 'court_argument' | 'contract_claim'>('irac_analysis');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<WeaknessAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('input');

  const handleAnalyze = async () => {
    if (!argumentText.trim()) {
      toast.error('Iltimos, tahlil qilinadigan matnni kiriting');
      return;
    }

    setIsAnalyzing(true);
    setActiveTab('results');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Mock analysis result
      const mockAnalysis: WeaknessAnalysisResult = {
        argument_text: argumentText,
        argument_type: argumentType,
        weaknesses: [
          {
            type: 'insufficient_evidence',
            severity: 'high',
            description: 'Dalillar yetarli emas',
            location: '2-3 paragraflar',
            suggestion: 'Qo\'shimcha dalillar va ishonatlar keltiring',
            confidence: 0.85,
            impact_score: 0.7
          },
          {
            type: 'legal_misapplication',
            severity: 'medium',
            description: 'Qonunni noto\'g\'ri qo\'llash',
            location: '5-paragraf',
            suggestion: 'Qonun hujjatlari bilan tanishib chiqing',
            confidence: 0.75,
            impact_score: 0.5
          },
          {
            type: 'emotional_reasoning',
            severity: 'low',
            description: 'Hissiy so\'zlar ishlatish',
            location: '1-paragraf',
            suggestion: 'Ob\'ektiv tilda yozing',
            confidence: 0.9,
            impact_score: 0.2
          }
        ],
        overall_score: 72,
        strength_areas: [
          'Mantiqiy tuzilma',
          'Aniq muammoni belgilash',
          'Xulosa aniqligi'
        ],
        improvement_recommendations: [
          'Qo\'shimcha dalillar keltiring',
          'Qonun havolalarini tekshiring',
          'Hissiy so\'zlardan saqlaning',
          'Pretsedent holatlarni ko\'rib chiqing'
        ],
        detailed_feedback: 'Sizning argumentlaringiz yaxshi tuzilgan va aniq muammoni ko\'rsatadi. Biroq, dalillar bazasi kuchaytirilishi va qonunni to\'g\'ri qo\'llash tavsiya etiladi. Xissiy so\'zlardan qochinib, ob\'ektiv tilda yozish argumentlaringizning ishonchini oshiradi.',
        processing_time: 2.3,
        timestamp: new Date()
      };

      setAnalysis(mockAnalysis);
      toast.success('Tahlil muvaffaqiyatli yakunlandi');

    } catch (error) {
      toast.error('Tahlil jarayonida xatolik yuz berdi');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityName = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Jiddiy';
      case 'high': return 'Yuqori';
      case 'medium': return 'O\'rta';
      case 'low': return 'Past';
      default: return 'Noma\'lum';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'default';
    if (score >= 40) return 'warning';
    return 'destructive';
  };

  const getWeaknessTypeName = (type: string) => {
    switch (type) {
      case 'logical_fallacy': return 'Mantiqiy xato';
      case 'insufficient_evidence': return 'Dalillar yetarli emas';
      case 'irrelevant_argument': return 'Aloqasiz argument';
      case 'legal_misapplication': return 'Qonunni noto\'g\'ri qo\'llash';
      case 'structural_issue': return 'Tuzilma muammosi';
      case 'emotional_reasoning': return 'Hissiy mulohazalar';
      case 'missing_precedent': return 'Pretsedent yo\'q';
      case 'unclear_conclusion': return 'Noma\'lum xulosa';
      default: return type;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Kamchilik Detektori</h1>
        <p className="text-gray-600">Huquqiy argumentlardagi kamchiliklarni aniqlash</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input">Kiritish</TabsTrigger>
          <TabsTrigger value="results">Natijalar</TabsTrigger>
          <TabsTrigger value="export">Eksport</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Argument tahlili</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Argument turi
                </label>
                <div className="flex space-x-2">
                  {[
                    { value: 'irac_analysis', label: 'IRAC tahlili' },
                    { value: 'legal_brief', label: 'Huquqiy xulosa' },
                    { value: 'court_argument', label: 'Sud argumenti' },
                    { value: 'contract_claim', label: 'Shartnoma da\'vosi' }
                  ].map((type) => (
                    <Button
                      key={type.value}
                      variant={argumentType === type.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setArgumentType(type.value as any)}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Argument matni
                </label>
                <Textarea
                  placeholder="Tahlil qilinadigan argument matnini kiriting..."
                  value={argumentText}
                  onChange={(e) => setArgumentText(e.target.value)}
                  rows={10}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !argumentText.trim()}
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

        <TabsContent value="results" className="space-y-6">
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
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Umumiy baholash
                    <Badge variant={getScoreBadge(analysis.overall_score)}>
                      {analysis.overall_score} ball
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Argument turi</span>
                      <span className="font-medium capitalize">{analysis.argument_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Tahlil vaqti</span>
                      <span className="font-medium">{analysis.processing_time} soniya</span>
                    </div>
                    <Progress value={analysis.overall_score} className="mt-2" />
                    <div className="text-center">
                      <span className={cn("text-4xl font-bold", getScoreColor(analysis.overall_score))}>
                        {analysis.overall_score}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        {analysis.overall_score >= 80 && 'A\'lo'}
                        {analysis.overall_score >= 60 && analysis.overall_score < 80 && 'Yaxshi'}
                        {analysis.overall_score >= 40 && analysis.overall_score < 60 && 'Qoniqarli'}
                        {analysis.overall_score < 40 && 'Qoniqarsiz'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Weaknesses */}
              <Card>
                <CardHeader>
                  <CardTitle>Topilgan kamchiliklar ({analysis.weaknesses.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.weaknesses.map((weakness, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getSeverityColor(weakness.severity)}>
                              {getSeverityName(weakness.severity)}
                            </Badge>
                            <span className="font-medium">{getWeaknessTypeName(weakness.type)}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {Math.round(weakness.confidence * 100)}% ishonch
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{weakness.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Joylashuv: {weakness.location}</span>
                          <span className="text-gray-500">Ta'sir: {Math.round(weakness.impact_score * 100)}%</span>
                        </div>
                        <div className="mt-2 p-3 bg-blue-50 rounded-md">
                          <p className="text-sm font-medium text-blue-900 mb-1">Tavsiya:</p>
                          <p className="text-sm text-blue-700">{weakness.suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Strengths and Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Kuchli tomonlar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.strength_areas.map((strength, index) => (
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
                    <CardTitle className="text-blue-600">Tavsiyalar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysis.improvement_recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">→</span>
                          <span className="text-gray-700">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle>Batafsil fikr-mulohazalar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{analysis.detailed_feedback}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-gray-500">
                  <p>Hali tahlil qilinmagan</p>
                  <p className="text-sm mt-2">Avval argument matnini kiriting va tahlil qiling</p>
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

export { WeaknessDetector };
