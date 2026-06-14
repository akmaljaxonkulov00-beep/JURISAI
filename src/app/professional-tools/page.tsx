'use client';

import { useState } from 'react';
import { ArrowLeft, Calculator, FileText, Shield, TrendingUp, Search, Download, Upload, AlertTriangle, CheckCircle, Clock, DollarSign, Calendar, Target, BarChart, Crown, Star, Zap } from 'lucide-react';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: 'calculator' | 'document' | 'risk' | 'analytics';
  isPro: boolean;
}

interface CalculatorResult {
  stateFee: number;
  damages: number;
  interest: number;
  total: number;
}

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  fields: { name: string; type: 'text' | 'number' | 'date' | 'select'; required: boolean; options?: string[] }[];
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  risks: { category: string; severity: 'low' | 'medium' | 'high'; description: string }[];
  recommendations: string[];
  score: number;
}

interface CaseLawResult {
  precedents: { title: string; court: string; date: string; outcome: string; relevance: number }[];
  statistics: { winRate: number; averageDuration: string; commonIssues: string[] };
}

export default function ProfessionalTools() {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [activeTab, setActiveTab] = useState<'calculator' | 'document' | 'risk' | 'analytics'>('calculator');
  
  // Calculator states
  const [calculatorType, setCalculatorType] = useState<'state-fee' | 'damages' | 'deadlines'>('state-fee');
  const [calculatorInputs, setCalculatorInputs] = useState({
    claimAmount: '',
    contractAmount: '',
    daysLate: '',
    startDate: '',
    caseType: 'civil'
  });
  const [calculatorResult, setCalculatorResult] = useState<CalculatorResult | null>(null);
  
  // Document builder states
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [documentData, setDocumentData] = useState<Record<string, any>>({});
  const [generatedDocument, setGeneratedDocument] = useState<string>('');
  
  // Risk assessment states
  const [uploadedContract, setUploadedContract] = useState<File | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  
  // Case law analytics states
  const [searchQuery, setSearchQuery] = useState('');
  const [caseLawResults, setCaseLawResults] = useState<CaseLawResult | null>(null);

  const tools: Tool[] = [
    {
      id: 'legal-calculators',
      title: 'Yuridik Kalkulyatorlar',
      description: 'Davlat boji, zarar va muddatlarni hisoblash',
      icon: <Calculator className="w-8 h-8" />,
      color: 'blue',
      category: 'calculator',
      isPro: true
    },
    {
      id: 'document-builder',
      title: 'Hujjatlar Konstruktori',
      description: 'Aqlli hujjatlar generatori',
      icon: <FileText className="w-8 h-8" />,
      color: 'green',
      category: 'document',
      isPro: true
    },
    {
      id: 'risk-assessment',
      title: 'Risk Assessment',
      description: 'Shartnomalardagi xavflarni tahlil qilish',
      icon: <Shield className="w-8 h-8" />,
      color: 'purple',
      category: 'risk',
      isPro: true
    },
    {
      id: 'case-law-analytics',
      title: 'Sud Amaliyoti Tahlili',
      description: 'Pretsedentlar qidiruvi va statistik tahlil',
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'orange',
      category: 'analytics',
      isPro: true
    }
  ];

  const documentTemplates: DocumentTemplate[] = [
    {
      id: 'contract',
      name: 'Tijorat shartnomasi',
      description: 'Tijorat faoliyati uchun shartnoma',
      fields: [
        { name: 'party1', type: 'text', required: true },
        { name: 'party2', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true },
        { name: 'currency', type: 'select', required: true, options: ['UZS', 'USD', 'EUR'] },
        { name: 'startDate', type: 'date', required: true },
        { name: 'endDate', type: 'date', required: false }
      ]
    },
    {
      id: 'loan-agreement',
      name: 'Qarz shartnomasi',
      description: 'Pul qarzi uchun shartnoma',
      fields: [
        { name: 'lender', type: 'text', required: true },
        { name: 'borrower', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true },
        { name: 'interestRate', type: 'number', required: true },
        { name: 'repaymentDate', type: 'date', required: true }
      ]
    }
  ];

  const calculateStateFee = (caseType: string, amount: number) => {
    let fee = 0;
    
    if (amount <= 1000000) fee = amount * 0.05;
    else if (amount <= 5000000) fee = 50000 + (amount - 1000000) * 0.04;
    else if (amount <= 10000000) fee = 210000 + (amount - 5000000) * 0.03;
    else fee = 360000 + (amount - 10000000) * 0.02;
    
    return Math.min(fee, 2000000); // Maksimal 2 million so'm
  };

  const calculateDamages = (contractAmount: number, daysLate: number) => {
    const penaltyRate = 0.01; // 1% kuniga
    
    const penalty = contractAmount * penaltyRate * daysLate;
    return penalty;
  };

  const calculateLegalFees = async () => {
    try {
      // Call legal calculator API
      const response = await fetch('/api/professional-tools/legal-calculator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          case_type: calculatorInputs.caseType,
          claim_amount: parseFloat(calculatorInputs.claimAmount),
          contract_amount: parseFloat(calculatorInputs.contractAmount),
          days_late: parseFloat(calculatorInputs.daysLate),
          start_date: calculatorInputs.startDate
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCalculatorResult(result);
      } else {
        // Fallback to mock calculation
        useMockCalculation();
      }
    } catch (error) {
      console.log('Legal calculator API error, using fallback:', error);
      useMockCalculation();
    }
  };

  const useMockCalculation = () => {
    // Simulate fee calculation
    const mockResult: CalculatorResult = {
      stateFee: calculateStateFee(calculatorInputs.caseType, parseFloat(calculatorInputs.claimAmount)),
      damages: calculateDamages(parseFloat(calculatorInputs.contractAmount), parseFloat(calculatorInputs.daysLate)),
      interest: 0,
      total: 0
    };
    mockResult.total = mockResult.stateFee + mockResult.damages;
    setCalculatorResult(mockResult);
  };

  const handleCalculate = () => {
    calculateLegalFees();
  };

  const generateDocument = () => {
    if (!selectedTemplate) return;
    
    let docContent = `${selectedTemplate.name.toUpperCase()}\n\n`;
    
    selectedTemplate.fields.forEach(field => {
      const value = documentData[field.name] || '[____________]';
      docContent += `${field.name}: ${value}\n`;
    });
    
    docContent += '\nShartnoma matni avtomatik generatsiya qilindi...';
    setGeneratedDocument(docContent);
  };

  const analyzeContract = () => {
    // Simulate risk assessment
    const mockAssessment: RiskAssessment = {
      overallRisk: 'medium',
      score: 65,
      risks: [
        { category: 'To\'lov shartlari', severity: 'medium', description: 'To\'lov muddati noaniq belgilangan' },
        { category: 'Mas\'uliyat', severity: 'low', description: 'Mas\'uliyat chegaralari aniq' },
        { category: 'Nizolarni hal qilish', severity: 'high', description: 'Arbitraj usuli ko\'rsatilmagan' }
      ],
      recommendations: [
        'To\'lov muddatlarini aniqroq belgilang',
        'Nizolarni hal qilish tartibini qo\'shing',
        'Shartnoma buzilishi holatlarini batafsilroq bayon qiling'
      ]
    };
    setRiskAssessment(mockAssessment);
  };

  const searchCaseLaw = () => {
    // Simulate case law search
    const mockResults: CaseLawResult = {
      precedents: [
        {
          title: 'Tijorat shartnomasini buzish to\'g\'risida',
          court: 'Toshkent shahar sudining iqtisodiy sudi',
          date: '2024-02-15',
          outcome: 'Da\'vogar foydasiga',
          relevance: 92
        },
        {
          title: 'Qarz majburiyatlari bo\'yicha nizo',
          court: 'Samarqand viloyati sudi',
          date: '2024-01-20',
          outcome: 'Javobgar foydasiga',
          relevance: 78
        }
      ],
      statistics: {
        winRate: 67,
        averageDuration: '45 kun',
        commonIssues: ['To\'lov kechikishi', 'Shartnoma shartlarining noaniqligi']
      }
    };
    setCaseLawResults(mockResults);
  };

  const getToolColor = (color: string) => {
    switch (color) {
      case 'blue': return 'from-blue-500 to-blue-600';
      case 'green': return 'from-green-500 to-green-600';
      case 'purple': return 'from-purple-500 to-purple-600';
      case 'orange': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (selectedTool) {
    return (
      <div className="min-h-screen bg-[#f8faff]">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-white border-r border-gray-100 min-h-screen">
            <div className="p-6">
              <button
                onClick={() => setSelectedTool(null)}
                className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer mb-6"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Orqaga</span>
              </button>
              
              {/* Tool Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6">
                <div className={`w-12 h-12 bg-gradient-to-br ${getToolColor(selectedTool.color)} rounded-lg flex items-center justify-center text-white mb-3`}>
                  {selectedTool.icon}
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{selectedTool.title}</h3>
                <p className="text-sm text-gray-600">{selectedTool.description}</p>
                {selectedTool.isPro && (
                  <div className="flex items-center gap-1 mt-2">
                    <Crown className="w-3 h-3 text-yellow-600" />
                    <span className="text-xs text-yellow-600 font-medium">Pro</span>
                  </div>
                )}
              </div>
              
              {/* Tool Settings */}
              <div className="space-y-2">
                {selectedTool.category === 'calculator' && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Kalkulyator turi</h4>
                    <div className="space-y-2">
                      {[
                        { id: 'state-fee', label: 'Davlat boji' },
                        { id: 'damages', label: 'Zarar hisobi' },
                        { id: 'deadlines', label: 'Muddatlar' }
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => setCalculatorType(type.id as any)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            calculatorType === type.id
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Tool Content */}
          <div className="flex-1">
            <header className="bg-white px-8 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{selectedTool.title}</h1>
                  <p className="text-sm text-gray-600">{selectedTool.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTool.isPro && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Pro
                    </span>
                  )}
                </div>
              </div>
            </header>

            <main className="p-8">
              <div className="max-w-4xl mx-auto">
                {/* Legal Calculators */}
                {selectedTool.category === 'calculator' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <h2 className="text-lg font-bold text-gray-800 mb-4">
                        {calculatorType === 'state-fee' && 'Davlat boji kalkulyatori'}
                        {calculatorType === 'damages' && 'Zarar va jarimalarni hisoblash'}
                        {calculatorType === 'deadlines' && 'Muddatlar kalkulyatori'}
                      </h2>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {calculatorType === 'state-fee' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Da\'vo summasi (so\'m)</label>
                            <input
                              type="number"
                              value={calculatorInputs.claimAmount}
                              onChange={(e) => setCalculatorInputs({...calculatorInputs, claimAmount: e.target.value})}
                              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="10000000"
                            />
                          </div>
                        )}
                        
                        {calculatorType === 'damages' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Shartnoma summasi (so\'m)</label>
                              <input
                                type="number"
                                value={calculatorInputs.contractAmount}
                                onChange={(e) => setCalculatorInputs({...calculatorInputs, contractAmount: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="5000000"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Kechikish kunlari</label>
                              <input
                                type="number"
                                value={calculatorInputs.daysLate}
                                onChange={(e) => setCalculatorInputs({...calculatorInputs, daysLate: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="30"
                              />
                            </div>
                          </>
                        )}
                        
                        {calculatorType === 'deadlines' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Boshlanish sanasi</label>
                              <input
                                type="date"
                                value={calculatorInputs.startDate}
                                onChange={(e) => setCalculatorInputs({...calculatorInputs, startDate: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Ish turi</label>
                              <select
                                value={calculatorInputs.caseType}
                                onChange={(e) => setCalculatorInputs({...calculatorInputs, caseType: e.target.value})}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="civil">Fuqarolik ishi</option>
                                <option value="criminal">Jinoyat ishi</option>
                                <option value="administrative">Ma\'muriy ish</option>
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <button
                        onClick={handleCalculate}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Hisoblash
                      </button>
                      
                      {calculatorResult && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <h3 className="font-bold text-gray-800 mb-3">Hisoblash natijalari</h3>
                          <div className="space-y-2">
                            {calculatorResult.stateFee > 0 && (
                              <div className="flex justify-between">
                                <span>Davlat boji:</span>
                                <span className="font-bold">{calculatorResult.stateFee.toLocaleString()} so\'m</span>
                              </div>
                            )}
                            {calculatorResult.damages > 0 && (
                              <div className="flex justify-between">
                                <span>Zarar (penya):</span>
                                <span className="font-bold">{calculatorResult.damages.toLocaleString()} so\'m</span>
                              </div>
                            )}
                            <div className="pt-2 border-t border-gray-200 flex justify-between">
                              <span className="font-bold">Jami:</span>
                              <span className="font-bold text-blue-600">{calculatorResult.total.toLocaleString()} so\'m</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Document Builder */}
                {selectedTool.category === 'document' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <h2 className="text-lg font-bold text-gray-800 mb-4">Hujjat tanlang</h2>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {documentTemplates.map(template => (
                          <button
                            key={template.id}
                            onClick={() => setSelectedTemplate(template)}
                            className={`p-4 border-2 rounded-lg transition-all ${
                              selectedTemplate?.id === template.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <h3 className="font-medium text-gray-800">{template.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          </button>
                        ))}
                      </div>
                      
                      {selectedTemplate && (
                        <div className="space-y-4">
                          <h3 className="font-bold text-gray-800">Ma\'lumotlarni kiriting</h3>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {selectedTemplate.fields.map(field => (
                              <div key={field.name}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  {field.name} {field.required && '*'}
                                </label>
                                {field.type === 'select' ? (
                                  <select
                                    value={documentData[field.name] || ''}
                                    onChange={(e) => setDocumentData({...documentData, [field.name]: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">Tanlang</option>
                                    {field.options?.map(option => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={field.type}
                                    value={documentData[field.name] || ''}
                                    onChange={(e) => setDocumentData({...documentData, [field.name]: e.target.value})}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={field.name}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <button
                            onClick={generateDocument}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Hujjatni yaratish
                          </button>
                        </div>
                      )}
                      
                      {generatedDocument && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800">Generatsiya qilingan hujjat</h3>
                            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                              <Download className="w-4 h-4" />
                              Yuklab olish
                            </button>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <pre className="whitespace-pre-wrap text-sm text-gray-700">{generatedDocument}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Risk Assessment */}
                {selectedTool.category === 'risk' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <h2 className="text-lg font-bold text-gray-800 mb-4">Shartnomani yuklang</h2>
                      
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Shartnoma faylini bu yerga torting</p>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setUploadedContract(e.target.files?.[0] || null)}
                          className="hidden"
                          id="contract-upload"
                        />
                        <label
                          htmlFor="contract-upload"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                        >
                          Fayl tanlash
                        </label>
                      </div>
                      
                      {uploadedContract && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-800">{uploadedContract.name}</span>
                            <button
                              onClick={analyzeContract}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Tahlil qilish
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {riskAssessment && (
                        <div className="mt-6">
                          <h3 className="font-bold text-gray-800 mb-4">Xavflarni baholash natijalari</h3>
                          
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className={`p-4 rounded-lg text-center ${getRiskColor(riskAssessment.overallRisk)}`}>
                              <div className="text-2xl font-bold mb-1">{riskAssessment.score}%</div>
                              <div className="text-sm font-medium">Umumiy xavf</div>
                              <div className="text-xs mt-1">{riskAssessment.overallRisk === 'low' ? 'Past' : riskAssessment.overallRisk === 'medium' ? 'O\'rta' : 'Yuqori'}</div>
                            </div>
                            
                            <div className="p-4 bg-gray-50 rounded-lg text-center">
                              <div className="text-2xl font-bold mb-1">{riskAssessment.risks.length}</div>
                              <div className="text-sm font-medium">Topilgan xavflar</div>
                            </div>
                            
                            <div className="p-4 bg-gray-50 rounded-lg text-center">
                              <div className="text-2xl font-bold mb-1">{riskAssessment.recommendations.length}</div>
                              <div className="text-sm font-medium">Tavsiyalar</div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-800">Xavflar</h4>
                            {riskAssessment.risks.map((risk, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-gray-800">{risk.category}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${getRiskColor(risk.severity)}`}>
                                      {risk.severity === 'low' ? 'Past' : risk.severity === 'medium' ? 'O\'rta' : 'Yuqori'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">{risk.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-800 mb-3">Tavsiyalar</h4>
                            <div className="space-y-2">
                              {riskAssessment.recommendations.map((rec, index) => (
                                <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                                  <span className="text-sm text-gray-700">{rec}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Case Law Analytics */}
                {selectedTool.category === 'analytics' && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                      <h2 className="text-lg font-bold text-gray-800 mb-4">Pretsedentlarni qidirish</h2>
                      
                      <div className="flex gap-4 mb-6">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Ish turi, kalit so\'zlar..."
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={searchCaseLaw}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Qidirish
                        </button>
                      </div>
                      
                      {caseLawResults && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="font-bold text-gray-800 mb-4">Statistika</h3>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="p-4 bg-gray-50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-600 mb-1">{caseLawResults.statistics.winRate}%</div>
                                <div className="text-sm text-gray-600">G\'alaba ehtimoli</div>
                              </div>
                              <div className="p-4 bg-gray-50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-600 mb-1">{caseLawResults.statistics.averageDuration}</div>
                                <div className="text-sm text-gray-600">O\'rtalama muddat</div>
                              </div>
                              <div className="p-4 bg-gray-50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-purple-600 mb-1">{caseLawResults.precedents.length}</div>
                                <div className="text-sm text-gray-600">Topilgan ishlar</div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-bold text-gray-800 mb-4">Pretsedentlar</h3>
                            <div className="space-y-3">
                              {caseLawResults.precedents.map((precedent, index) => (
                                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-800 mb-1">{precedent.title}</h4>
                                      <p className="text-sm text-gray-600 mb-2">{precedent.court} • {precedent.date}</p>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                          precedent.outcome === 'Da\'vogar foydasiga' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                          {precedent.outcome}
                                        </span>
                                        <span className="text-xs text-gray-500">Moslik: {precedent.relevance}%</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faff]">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-100 min-h-screen">
          <div className="p-6">
            <a href="/" className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer mb-6">
              <ArrowLeft className="w-5 h-5" />
              <span>Orqaga</span>
            </a>
            
            {/* Daily Goal Block */}
            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-gray-800">Pro Vositalar</span>
                </div>
              </div>
              <div className="mb-2">
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">4 ta vosita faol</p>
            </div>

            {/* Menu Items */}
            <nav className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                <Star className="w-5 h-5" />
                <span className="font-medium">Pro Vositalar</span>
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
                <h1 className="text-2xl font-bold text-gray-800">Professional Vositalar</h1>
                <p className="text-sm text-gray-600">Premium qismi - amaliyotchi yuristlar uchun</p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Pro
                </span>
              </div>
            </div>
          </header>

          {/* Tool Grid */}
          <main className="p-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 gap-6">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool)}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200 text-left"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${getToolColor(tool.color)} rounded-xl flex items-center justify-center text-white`}>
                        {tool.icon}
                      </div>
                      {tool.isPro && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Pro
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{tool.title}</h3>
                    <p className="text-gray-600 mb-4">{tool.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Target className="w-4 h-4" />
                        <span>{tool.category === 'calculator' ? 'Hisoblash' : 
                               tool.category === 'document' ? 'Hujjat' :
                               tool.category === 'risk' ? 'Tahlil' : 'Analitika'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-600">
                        <span className="text-sm font-medium">Ochish</span>
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Features Section */}
              <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Pro Vositalar xususiyatlari</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Calculator className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 text-sm">Aniq hisoblar</h4>
                    <p className="text-xs text-gray-600 mt-1">Qonuniy asosda hisoblash</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 text-sm">Aqlli generator</h4>
                    <p className="text-xs text-gray-600 mt-1">Shaxsiylashtirilgan hujjatlar</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 text-sm">Xavf tahlili</h4>
                    <p className="text-xs text-gray-600 mt-1">AI asosida baholash</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <BarChart className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 text-sm">Statistika</h4>
                    <p className="text-xs text-gray-600 mt-1">Pretsedentlar tahlili</p>
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
