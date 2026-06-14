'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useAuth } from '@/services/auth';

interface DecisionNode {
  id: string;
  title: string;
  description: string;
  type: string;
  options: Array<{ id: string; text: string; next: string }>;
  risk_level: string;
}

interface DecisionTree {
  id: string;
  scenario_title: string;
  scenario_description: string;
  tree_data: {
    template_type: string;
    nodes: DecisionNode[];
    edges: Array<{ from: string; to: string; condition: string }>;
    case_type: string;
    legal_framework: any;
  };
  current_node: string;
  path_taken: string[];
  final_decision: string | null;
  confidence_score: number;
  risk_assessment: {
    overall_risk: string;
    legal_risks: string[];
    financial_risks: string[];
    reputation_risks: string[];
    timeline_risks: string[];
  };
  ai_recommendations: string[];
  status: string;
  created_at: string;
}

interface CreateDecisionTreeRequest {
  scenario_title: string;
  scenario_description: string;
  case_type: string;
  initial_decisions: Record<string, any>;
}

export default function DecisionTreeEngine() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('create');
  const [scenarioTitle, setScenarioTitle] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [caseType, setCaseType] = useState('civil');
  const [currentTree, setCurrentTree] = useState<DecisionTree | null>(null);
  const [selectedNode, setSelectedNode] = useState<DecisionNode | null>(null);
  const [selectedDecision, setSelectedDecision] = useState('');
  const [confidence, setConfidence] = useState(0.5);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trees, setTrees] = useState<DecisionTree[]>([]);
  
  // Real API hooks instead of mock API calls
  const createTree = async (request: CreateDecisionTreeRequest) => {
    console.log('Creating decision tree...', request);
    
    const response = await fetch('/api/decision-tree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        ...request
      })
    });

    if (!response.ok) {
      throw new Error('Qaror daraxti yaratilmadi');
    }

    return await response.json();
  };
  
  const updateTree = async (treeId: string, data: any) => {
    console.log('Updating decision tree:', treeId, data);
    
    const response = await fetch('/api/decision-tree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        tree_id: treeId,
        ...data
      })
    });

    if (!response.ok) {
      throw new Error('Yangilanmadi');
    }

    return await response.json();
  };
  
  const getTrees = async () => {
    console.log('Loading decision trees...');
    
    // Load from localStorage
    try {
      const stored = localStorage.getItem('decision_trees');
      if (stored) {
        const trees = JSON.parse(stored);
        return { trees, total: trees.length };
      }
      return { trees: [], total: 0 };
    } catch (error) {
      console.error('Error loading trees from localStorage:', error);
      return { trees: [], total: 0 };
    }
  };
  
  const getTreeNodes = async (scenario: string) => {
    console.log('Loading tree nodes for scenario:', scenario);
    // Nodes come from tree data, no separate API call needed
    return {
      nodes: [],
      scenario: scenario
    };
  };

  useEffect(() => {
    if (user) {
      loadTrees();
    }
  }, [user]);

  const loadTrees = async () => {
    try {
      const result = await getTrees();
      if (result) {
        setTrees(result.trees);
      }
    } catch (error) {
      console.error('Trees loading error:', error);
      setTrees([]);
    }
  };

  const handleCreateTree = async () => {
    if (!scenarioTitle.trim() || !scenarioDescription.trim()) {
      alert('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const request: CreateDecisionTreeRequest = {
        scenario_title: scenarioTitle,
        scenario_description: scenarioDescription,
        case_type: caseType,
        initial_decisions: {}
      };

      const result = await createTree(request);
      if (result) {
        setCurrentTree(result);
        
        // Save to localStorage
        const existingTrees = await getTrees();
        const allTrees = [...(existingTrees.trees || []), result];
        localStorage.setItem('decision_trees', JSON.stringify(allTrees));
        
        setActiveTab('analyze');
        await loadTrees();
        
        // Clear form
        setScenarioTitle('');
        setScenarioDescription('');
      }
    } catch (error) {
      console.error('Tree creation error:', error);
      alert('Qaror daraxtini yaratish xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNodeSelection = (node: DecisionNode) => {
    setSelectedNode(node);
    setSelectedDecision('');
    setConfidence(0.5);
  };

  const handleDecisionSubmit = async () => {
    if (!currentTree || !selectedNode || !selectedDecision) {
      return;
    }

    try {
      const result = await updateTree(currentTree.id, {
        node_id: selectedNode.id,
        decision: selectedDecision,
        confidence: confidence
      });

      if (result && result.success) {
        const updatedTree = {
          ...currentTree,
          current_node: result.current_node,
          path_taken: [...currentTree.path_taken, selectedNode.id],
          confidence_score: result.confidence_score
        };
        
        setCurrentTree(updatedTree);
        
        // Update localStorage
        const existingTrees = await getTrees();
        const updatedTrees = existingTrees.trees.map((t: DecisionTree) => 
          t.id === currentTree.id ? updatedTree : t
        );
        localStorage.setItem('decision_trees', JSON.stringify(updatedTrees));
        
        setSelectedNode(null);
        setSelectedDecision('');
        setConfidence(0.5);
        await loadTrees();
        
        alert('Qaror qabul qilindi!');
      }
    } catch (error) {
      console.error('Decision update error:', error);
      alert('Qarorni yangilash xatolik yuz berdi');
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderDecisionNode = (node: DecisionNode) => (
    <Card 
      key={node.id}
      className={`bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl cursor-pointer transition-all hover:shadow-2xl ${
        selectedNode?.id === node.id ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={() => handleNodeSelection(node)}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-blue-900 text-lg">{node.title}</CardTitle>
          <Badge className={getRiskColor(node.risk_level)}>
            {node.risk_level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-4">{node.description}</p>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-blue-700">Qaror variantlari:</p>
          {node.options.map((option) => (
            <div key={option.id} className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">{option.text}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Decision Tree Engine</h1>
          <p className="text-blue-700">O'zbekiston qonunchiligiga moslashgan qaror daraxti analizi</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm rounded-2xl p-1">
            <TabsTrigger value="create" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Yaratish
            </TabsTrigger>
            <TabsTrigger value="analyze" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Tahlil
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
                    <CardTitle className="text-blue-900">Senariyo Yaratish</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Senariyo nomi
                      </label>
                      <input
                        type="text"
                        placeholder="Senariyo nomini kiriting..."
                        value={scenarioTitle}
                        onChange={(e) => setScenarioTitle(e.target.value)}
                        className="w-full px-4 py-2 bg-white/50 rounded-xl border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Senariyo tavsifi
                      </label>
                      <Textarea
                        placeholder="Senariyoni batafsil tasvirlang..."
                        value={scenarioDescription}
                        onChange={(e) => setScenarioDescription(e.target.value)}
                        className="min-h-[200px] bg-white/50 rounded-xl border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Case turi
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
                    
                    <Button
                      onClick={handleCreateTree}
                      disabled={isAnalyzing || !scenarioTitle.trim() || !scenarioDescription.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold"
                    >
                      {isAnalyzing ? 'Yaratilmoqda...' : 'Qaror Daraxtini Yaratish'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Qaror Daraxti Turlari</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-xl">
                      <h4 className="font-semibold text-green-900 mb-2">📄 Shartnoma Nizolari</h4>
                      <p className="text-sm text-green-700">Shartnoma shartlari va kelishuvlar</p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <h4 className="font-semibold text-blue-900 mb-2">👥 Vorislik Masalalari</h4>
                      <p className="text-sm text-blue-700">Meros va vorislik huquqlari</p>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <h4 className="font-semibold text-purple-900 mb-2">💼 Mehnat Masalalari</h4>
                      <p className="text-sm text-purple-700">Ishchi va ish beruvchi munosabatlari</p>
                    </div>
                    
                    <div className="p-4 bg-orange-50 rounded-xl">
                      <h4 className="font-semibold text-orange-900 mb-2">🏠 Oilaviy Masalalar</h4>
                      <p className="text-sm text-orange-700">Nikoh, ajralish, aliment</p>
                    </div>
                    
                    <div className="p-4 bg-red-50 rounded-xl">
                      <h4 className="font-semibold text-red-900 mb-2">⚖️ Jinoyat Ishlari</h4>
                      <p className="text-sm text-red-700">Jinoyat protsedurasi va himoya</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analyze" className="mt-6">
            {currentTree ? (
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-blue-900">{currentTree.scenario_title}</CardTitle>
                        <p className="text-gray-600 mt-1">{currentTree.scenario_description}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getConfidenceColor(currentTree.confidence_score)}`}>
                          {(currentTree.confidence_score * 100).toFixed(1)}%
                        </div>
                        <p className="text-sm text-gray-600">Ishonch darajasi</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-blue-900 mb-4">Qaror Tugunlari</h3>
                    <div className="space-y-4">
                      {currentTree.tree_data.nodes.map(renderDecisionNode)}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-blue-900 mb-4">Qaror Paneli</h3>
                    {selectedNode ? (
                      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                        <CardHeader>
                          <CardTitle className="text-blue-900">{selectedNode.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-gray-700">{selectedNode.description}</p>
                          
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-2">
                              Qaror tanlang
                            </label>
                            <Select 
                              value={selectedDecision} 
                              onChange={(e) => setSelectedDecision(e.target.value)}
                              options={selectedNode.options.map(opt => ({
                                value: opt.id,
                                label: opt.text
                              }))}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-2">
                              Ishonch darajasi: {(confidence * 100).toFixed(0)}%
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={confidence}
                              onChange={(e) => setConfidence(parseFloat(e.target.value))}
                              className="w-full"
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={handleDecisionSubmit}
                              disabled={!selectedDecision}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Qarorni Tasdiqlash
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedNode(null)}
                              className="border-blue-200 text-blue-700"
                            >
                              Bekor qilish
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                        <CardContent className="text-center py-12">
                          <p className="text-gray-500">Qaror tugunini tanlang</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-blue-900">Xavf Baholashi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Umumiy xavf:</span>
                          <Badge className={getRiskColor(currentTree.risk_assessment.overall_risk)}>
                            {currentTree.risk_assessment.overall_risk}
                          </Badge>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Yuridik xavflar:</p>
                          <div className="space-y-1">
                            {currentTree.risk_assessment.legal_risks.map((risk, index) => (
                              <div key={index} className="text-sm text-red-600">• {risk}</div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Moliyaviy xavflar:</p>
                          <div className="space-y-1">
                            {currentTree.risk_assessment.financial_risks.map((risk, index) => (
                              <div key={index} className="text-sm text-orange-600">• {risk}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-blue-900">AI Tavsiyalari</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {currentTree.ai_recommendations.map((recommendation, index) => (
                          <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 mb-4">Hali hech qanday qaror daraxti yaratilmagan</p>
                  <Button 
                    onClick={() => setActiveTab('create')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Birinchi Daraxtni Yaratish
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trees.map((tree) => (
                <Card 
                  key={tree.id} 
                  className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
                  onClick={() => {
                    setCurrentTree(tree);
                    setActiveTab('analyze');
                  }}
                >
                  <CardHeader>
                    <div className="flex flex-row items-center justify-between">
                      <CardTitle className="text-blue-900 text-lg">
                        {tree.scenario_title}
                      </CardTitle>
                      <Badge className={getRiskColor(tree.risk_assessment.overall_risk)}>
                        {(tree.confidence_score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Case turi:</span>
                        <span className="font-medium capitalize">{tree.tree_data.case_type}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium">{tree.status}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tugunlar soni:</span>
                        <span className="font-medium">{tree.tree_data.nodes.length}</span>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          {new Date(tree.created_at).toLocaleDateString('uz-UZ')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {trees.length === 0 && (
                <div className="col-span-full">
                  <Card className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-xl">
                    <CardContent className="text-center py-12">
                      <p className="text-gray-500 mb-4">Hali hech qanday qaror daraxtlari mavjud emas</p>
                      <Button 
                        onClick={() => setActiveTab('create')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Birinchi Daraxtni Yaratish
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
