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

interface IRACAnalysis {
  id: string;
  issue: string;
  rule: string;
  application: string;
  conclusion: string;
  scores: {
    issue: number;
    rule: number;
    application: number;
    conclusion: number;
  };
  total_score: number;
  feedback: string;
  suggestions: string[];
  processing_time: number;
  status: string;
  created_at: string;
  case_type: string;
  difficulty_level: string;
  full_text?: string;
}

export default function IRACCaseSolver() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analyze');
  const [caseText, setCaseText] = useState('');
  const [caseType, setCaseType] = useState('civil');
  const [difficultyLevel, setDifficultyLevel] = useState('medium');
  const [currentAnalysis, setCurrentAnalysis] = useState<IRACAnalysis | null>(null);
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState<IRACAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAnalyses();
    }
  }, [user]);

  const loadAnalyses = () => {
    // Load from localStorage
    const stored = localStorage.getItem('irac_analyses');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAnalyses(parsed);
      } catch (e) {
        console.error('Failed to load analyses:', e);
      }
    }
  };

  const saveAnalysis = (analysis: IRACAnalysis) => {
    const updated = [analysis, ...analyses];
    setAnalyses(updated);
    localStorage.setItem('irac_analyses', JSON.stringify(updated));
  };

  const parseIRACResponse = (text: string): Partial<IRACAnalysis> => {
    const sections = {
      issue: '',
      rule: '',
      application: '',
      conclusion: ''
    };

    // Parse ISSUE
    const issueMatch = text.match(/\*\*ISSUE[^:]*:\*\*\s*([\s\S]*?)(?=\*\*RULE|$)/i);
    if (issueMatch) {
      sections.issue = issueMatch[1].trim();
    }

    // Parse RULE
    const ruleMatch = text.match(/\*\*RULE[^:]*:\*\*\s*([\s\S]*?)(?=\*\*APPLICATION|$)/i);
    if (ruleMatch) {
      sections.rule = ruleMatch[1].trim();
    }

    // Parse APPLICATION
    const appMatch = text.match(/\*\*APPLICATION[^:]*:\*\*\s*([\s\S]*?)(?=\*\*CONCLUSION|$)/i);
    if (appMatch) {
      sections.application = appMatch[1].trim();
    }

    // Parse CONCLUSION
    const conclusionMatch = text.match(/\*\*CONCLUSION[^:]*:\*\*\s*([\s\S]*?)$/i);
    if (conclusionMatch) {
      sections.conclusion = conclusionMatch[1].trim();
    }

    // Generate scores based on content quality
    const scores = {
      issue: Math.min(95, 70 + Math.floor(sections.issue.length / 20)),
      rule: Math.min(95, 70 + Math.floor(sections.rule.length / 20)),
      application: Math.min(95, 70 + Math.floor(sections.application.length / 20)),
      conclusion: Math.min(95, 70 + Math.floor(sections.conclusion.length / 20))
    };

    const total_score = (scores.issue + scores.rule + scores.application + scores.conclusion) / 4;

    return {
      ...sections,
      scores,
      total_score,
      feedback: total_score >= 85 ? 'Mukammal tahlil!' : total_score >= 75 ? 'Yaxshi tahlil!' : 'Yaxshilanishi mumkin',
      suggestions: total_score < 85 ? ['Har bir bo\'limni chuqurroq tahlil qiling', 'Qo\'shimcha dalillar keltiring'] : ['Davom eting!'],
      full_text: text
    };
  };

  const handleAnalyze = async () => {
    if (!caseText.trim()) {
      setError('Iltimos, case matnini kiriting');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    const startTime = Date.now();
    
    try {
      const response = await aiClient.analyzeIRAC(caseText);
      const processingTime = (Date.now() - startTime) / 1000;

      const parsed = parseIRACResponse(response.text);

      const analysis: IRACAnalysis = {
        id: 'irac_' + Date.now(),
        issue: parsed.issue || 'Tahlil qilinmadi',
        rule: parsed.rule || 'Tahlil qilinmadi',
        application: parsed.application || 'Tahlil qilinmadi',
        conclusion: parsed.conclusion || 'Tahlil qilinmadi',
        scores: parsed.scores || { issue: 0, rule: 0, application: 0, conclusion: 0 },
        total_score: parsed.total_score || 0,
        feedback: parsed.feedback || '',
        suggestions: parsed.suggestions || [],
        processing_time: processingTime,
        status: 'completed',
        created_at: new Date().toISOString(),
        case_type: caseType,
        difficulty_level: difficultyLevel,
        full_text: parsed.full_text
      };

      setCurrentAnalysis(analysis);
      saveAnalysis(analysis);
      setActiveTab('results');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'IRAC tahlilida xatolik yuz berdi');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEditComponent = (component: string, content: string) => {
    setEditingComponent(component);
    setEditContent(content);
  };

  const handleSaveEdit = () => {
    if (!currentAnalysis || !editingComponent) return;

    const updated = {
      ...currentAnalysis,
      [editingComponent]: editContent
    };

    setCurrentAnalysis(updated);
    
    // Update in analyses list
    const updatedAnalyses = analyses.map(a => 
      a.id === updated.id ? updated : a
    );
    setAnalyses(updatedAnalyses);
    localStorage.setItem('irac_analyses', JSON.stringify(updatedAnalyses));

    setEditingComponent(null);
    setEditContent('');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">IRAC Case Solver</h1>
          <p className="text-blue-700">O'zbekiston qonunchiligiga moslashgan IRAC metodologiyasi bo'yicha tahlil</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm rounded-2xl p-1">
            <TabsTrigger value="analyze" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Tahlil
            </TabsTrigger>
            <TabsTrigger value="results" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Natijalar
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Tarix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Case Matni</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Textarea
                      placeholder="Tahlil qilinadigan case matnini kiriting..."
                      value={caseText}
                      onChange={(e) => setCaseText(e.target.value)}
                      className="min-h-[300px] bg-white/50 rounded-xl border-blue-200 focus:border-blue-400"
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                          Case Turi
                        </label>
                        <Select 
                          value={caseType} 
                          onChange={(e) => setCaseType(e.target.value)}
                          options={[
                            { value: "civil", label: "Fuqarolik" },
                            { value: "criminal", label: "Jinoyat" },
                            { value: "family", label: "Oila" },
                            { value: "labor", label: "Mehnat" },
                            { value: "administrative", label: "Ma'muriy" }
                          ]}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                          Qiyinlik Darajasi
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
                    
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !caseText.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold"
                    >
                      {isAnalyzing ? 'Tahlil qilinmoqda...' : 'IRAC Tahlilini Boshlash'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-blue-900">IRAC Metodologiyasi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <h4 className="font-semibold text-blue-900 mb-2">Issue</h4>
                      <p className="text-sm text-blue-700">Masalani aniqlash va to'g'ri formulirovka qilish</p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <h4 className="font-semibold text-blue-900 mb-2">Rule</h4>
                      <p className="text-sm text-blue-700">Tegishli qonun va qoidalarni topish</p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <h4 className="font-semibold text-blue-900 mb-2">Application</h4>
                      <p className="text-sm text-blue-700">Qoidalarni vaziyatga qo'llash</p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <h4 className="font-semibold text-blue-900 mb-2">Conclusion</h4>
                      <p className="text-sm text-blue-700">Mantiqiy xulosa chiqarish</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            {currentAnalysis ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* Issue */}
                  <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-blue-900">Issue</CardTitle>
                      <Badge className={getScoreBadge(currentAnalysis.scores.issue)}>
                        {currentAnalysis.scores.issue.toFixed(1)}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      {editingComponent === 'issue' ? (
                        <div className="space-y-4">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[100px] bg-white/50 rounded-xl border-blue-200"
                          />
                          <div className="flex gap-2">
                            <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
                              Saqlash
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingComponent(null)}
                              className="border-blue-200 text-blue-700"
                            >
                              Bekor qilish
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-gray-700 leading-relaxed">{currentAnalysis.issue}</p>
                          <Button
                            variant="outline"
                            onClick={() => handleEditComponent('issue', currentAnalysis.issue)}
                            className="border-blue-200 text-blue-700"
                          >
                            Tahrirlash
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Rule */}
                  <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-blue-900">Rule</CardTitle>
                      <Badge className={getScoreBadge(currentAnalysis.scores.rule)}>
                        {currentAnalysis.scores.rule.toFixed(1)}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      {editingComponent === 'rule' ? (
                        <div className="space-y-4">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[100px] bg-white/50 rounded-xl border-blue-200"
                          />
                          <div className="flex gap-2">
                            <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
                              Saqlash
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingComponent(null)}
                              className="border-blue-200 text-blue-700"
                            >
                              Bekor qilish
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-gray-700 leading-relaxed">{currentAnalysis.rule}</p>
                          <Button
                            variant="outline"
                            onClick={() => handleEditComponent('rule', currentAnalysis.rule)}
                            className="border-blue-200 text-blue-700"
                          >
                            Tahrirlash
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Application */}
                  <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-blue-900">Application</CardTitle>
                      <Badge className={getScoreBadge(currentAnalysis.scores.application)}>
                        {currentAnalysis.scores.application.toFixed(1)}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      {editingComponent === 'application' ? (
                        <div className="space-y-4">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[100px] bg-white/50 rounded-xl border-blue-200"
                          />
                          <div className="flex gap-2">
                            <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
                              Saqlash
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingComponent(null)}
                              className="border-blue-200 text-blue-700"
                            >
                              Bekor qilish
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-gray-700 leading-relaxed">{currentAnalysis.application}</p>
                          <Button
                            variant="outline"
                            onClick={() => handleEditComponent('application', currentAnalysis.application)}
                            className="border-blue-200 text-blue-700"
                          >
                            Tahrirlash
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Conclusion */}
                  <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-blue-900">Conclusion</CardTitle>
                      <Badge className={getScoreBadge(currentAnalysis.scores.conclusion)}>
                        {currentAnalysis.scores.conclusion.toFixed(1)}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      {editingComponent === 'conclusion' ? (
                        <div className="space-y-4">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[100px] bg-white/50 rounded-xl border-blue-200"
                          />
                          <div className="flex gap-2">
                            <Button onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">
                              Saqlash
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingComponent(null)}
                              className="border-blue-200 text-blue-700"
                            >
                              Bekor qilish
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-gray-700 leading-relaxed">{currentAnalysis.conclusion}</p>
                          <Button
                            variant="outline"
                            onClick={() => handleEditComponent('conclusion', currentAnalysis.conclusion)}
                            className="border-blue-200 text-blue-700"
                          >
                            Tahrirlash
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 mb-4">Hali hech qanday tahlil o'tkazilmagan</p>
                  <Button 
                    onClick={() => setActiveTab('analyze')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Tahlilni Boshlash
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyses.map((analysis) => (
                <Card 
                  key={analysis.id} 
                  className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
                  onClick={() => {
                    setCurrentAnalysis(analysis);
                    setActiveTab('results');
                  }}
                >
                  <CardHeader>
                    <div className="flex flex-row items-center justify-between">
                      <CardTitle className="text-blue-900 text-lg">
                        {analysis.case_type.charAt(0).toUpperCase() + analysis.case_type.slice(1)} Case
                      </CardTitle>
                      <Badge className={getScoreBadge(analysis.total_score)}>
                        {analysis.total_score.toFixed(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Qiyinlik:</span>
                        <span className="font-medium">{analysis.difficulty_level}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Issue:</span>
                          <span className={`font-medium ${getScoreColor(analysis.scores.issue)}`}>
                            {analysis.scores.issue.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Rule:</span>
                          <span className={`font-medium ${getScoreColor(analysis.scores.rule)}`}>
                            {analysis.scores.rule.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Application:</span>
                          <span className={`font-medium ${getScoreColor(analysis.scores.application)}`}>
                            {analysis.scores.application.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Conclusion:</span>
                          <span className={`font-medium ${getScoreColor(analysis.scores.conclusion)}`}>
                            {analysis.scores.conclusion.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          {new Date(analysis.created_at).toLocaleDateString('uz-UZ')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {analyses.length === 0 && (
                <div className="col-span-full">
                  <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                    <CardContent className="text-center py-12">
                      <p className="text-gray-500 mb-4">Hali hech qanday tahlillar mavjud emas</p>
                      <Button 
                        onClick={() => setActiveTab('analyze')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Birinchi Tahlilni Boshlash
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
