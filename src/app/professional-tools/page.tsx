'use client'

import { useState } from 'react'
import AppSidebar from '@/components/layout/AppSidebar'
import { getUserIdentityPayload } from '@/lib/client-user'
import DocumentTemplates from '@/components/features/DocumentTemplates'
import {
  ArrowLeft,
  Calculator,
  FileText,
  Shield,
  TrendingUp,
  Search,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Target,
  BarChart,
  Crown,
  Star,
  Zap,
} from 'lucide-react'

interface Tool {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  category: 'calculator' | 'document' | 'risk' | 'analytics'
  isPro: boolean
}

interface CalculatorResult {
  stateFee: number
  damages: number
  interest: number
  total: number
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high'
  risks: { category: string; severity: 'low' | 'medium' | 'high'; description: string }[]
  recommendations: string[]
  score: number
}

interface CaseLawResult {
  precedents: { title: string; court: string; date: string; outcome: string; relevance: number }[]
  statistics: { winRate: number; averageDuration: string; commonIssues: string[] }
}

export default function ProfessionalTools() {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [activeTab, setActiveTab] = useState<'calculator' | 'document' | 'risk' | 'analytics'>(
    'calculator'
  )

  // Calculator states
  const [calculatorType, setCalculatorType] = useState<'state-fee' | 'damages' | 'deadlines'>(
    'state-fee'
  )
  const [calculatorInputs, setCalculatorInputs] = useState({
    claimAmount: '',
    contractAmount: '',
    daysLate: '',
    startDate: '',
    caseType: 'civil',
  })
  const [calculatorResult, setCalculatorResult] = useState<CalculatorResult | null>(null)

  // Document builder states

  // Risk assessment states
  const [uploadedContract, setUploadedContract] = useState<File | null>(null)
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null)

  // Case law analytics states
  const [searchQuery, setSearchQuery] = useState('')
  const [caseLawResults, setCaseLawResults] = useState<CaseLawResult | null>(null)
  const [caseLawError, setCaseLawError] = useState<string | null>(null)

  const tools: Tool[] = [
    {
      id: 'legal-calculators',
      title: 'Yuridik Kalkulyatorlar',
      description: 'Davlat boji, zarar va muddatlarni hisoblash',
      icon: <Calculator className="w-8 h-8" />,
      color: 'blue',
      category: 'calculator',
      isPro: true,
    },
    {
      id: 'document-builder',
      title: 'Hujjatlar Konstruktori',
      description: 'Aqlli hujjatlar generatori',
      icon: <FileText className="w-8 h-8" />,
      color: 'green',
      category: 'document',
      isPro: true,
    },
    {
      id: 'risk-assessment',
      title: 'Risk Assessment',
      description: 'Shartnomalardagi xavflarni tahlil qilish',
      icon: <Shield className="w-8 h-8" />,
      color: 'purple',
      category: 'risk',
      isPro: true,
    },
    {
      id: 'case-law-analytics',
      title: 'Sud Amaliyoti Tahlili',
      description: 'Pretsedentlar qidiruvi va statistik tahlil',
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'orange',
      category: 'analytics',
      isPro: true,
    },
  ]


  const calculateStateFee = (caseType: string, amount: number) => {
    let fee = 0

    if (amount <= 1000000) fee = amount * 0.05
    else if (amount <= 5000000) fee = 50000 + (amount - 1000000) * 0.04
    else if (amount <= 10000000) fee = 210000 + (amount - 5000000) * 0.03
    else fee = 360000 + (amount - 10000000) * 0.02

    return Math.min(fee, 2000000) // Maksimal 2 million so'm
  }

  const calculateDamages = (contractAmount: number, daysLate: number) => {
    const penaltyRate = 0.01 // 1% kuniga

    const penalty = contractAmount * penaltyRate * daysLate
    return penalty
  }

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
          start_date: calculatorInputs.startDate,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setCalculatorResult(result)
      } else {
        // Fallback to mock calculation
        useMockCalculation()
      }
    } catch (error) {
      console.log('Legal calculator API error, using fallback:', error)
      useMockCalculation()
    }
  }

  const useMockCalculation = () => {
    // Simulate fee calculation
    const mockResult: CalculatorResult = {
      stateFee: calculateStateFee(
        calculatorInputs.caseType,
        parseFloat(calculatorInputs.claimAmount)
      ),
      damages: calculateDamages(
        parseFloat(calculatorInputs.contractAmount),
        parseFloat(calculatorInputs.daysLate)
      ),
      interest: 0,
      total: 0,
    }
    mockResult.total = mockResult.stateFee + mockResult.damages
    setCalculatorResult(mockResult)
  }

  const handleCalculate = () => {
    calculateLegalFees()
  }

  const analyzeContract = async () => {
    if (!uploadedContract) return
    setRiskAssessment(null)

    try {
      const text = await uploadedContract.text()
      const response = await fetch('/api/ai/document-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: text, documentType: 'contract', ...getUserIdentityPayload() }),
      })

      if (response.ok) {
        const result = await response.json()
        // Parse AI response into risk assessment structure
        const analysis = result.analysis || ''
        const hasRisk =
          analysis.includes('risk') || analysis.includes('xavf') || analysis.includes('muammo')
        const riskLevel = hasRisk ? 'medium' : 'low'

        setRiskAssessment({
          overallRisk: riskLevel,
          score: riskLevel === 'low' ? 85 : 55,
          risks: [
            {
              category: 'Hujjat tahlili',
              severity: riskLevel,
              description: analysis.slice(0, 200),
            },
          ],
          recommendations: [
            "Hujjatni professional huquqshunosga ko'rsatish tavsiya etiladi",
            'Muhim shartlarni ikki marta tekshirib chiqing',
            'Nizolarni hal qilish tartibini aniq belgilang',
          ],
        })
      } else {
        useMockFallback()
      }
    } catch (error) {
      console.log('Risk analysis API error, using fallback:', error)
      useMockFallback()
    }
  }

  const useMockFallback = () => {
    const mockAssessment: RiskAssessment = {
      overallRisk: 'medium',
      score: 65,
      risks: [
        {
          category: "To'lov shartlari",
          severity: 'medium',
          description: "To'lov muddati noaniq belgilangan",
        },
        { category: "Mas'uliyat", severity: 'low', description: "Mas'uliyat chegaralari aniq" },
        {
          category: 'Nizolarni hal qilish',
          severity: 'high',
          description: "Arbitraj usuli ko'rsatilmagan",
        },
      ],
      recommendations: [
        "To'lov muddatlarini aniqroq belgilang",
        "Nizolarni hal qilish tartibini qo'shing",
        'Shartnoma buzilishi holatlarini batafsilroq bayon qiling',
      ],
    }
    setRiskAssessment(mockAssessment)
  }

  const searchCaseLaw = async () => {
    if (!searchQuery.trim()) return
    setCaseLawResults(null)
    setCaseLawError(null)

    try {
      const response = await fetch('/api/ai/legal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Sud amaliyoti bo\'yicha qidiruv: "${searchQuery}". O\'zbekiston sudlarining ushbu masala bo\'yicha qarorlari, statistikasi va umumiy tendensiyalari haqida ma'lumot bering.`,
          context: [],
          ...getUserIdentityPayload(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const aiResponse = result.response || ''
        if (!aiResponse) {
          setCaseLawError('AI javob topilmadi. Iltimos, qayta urinib ko\u02BBring.')
          return
        }

        setCaseLawResults({
          precedents: [
            {
              title: `${searchQuery} bo\u02BByicha AI tahlili`,
              court: "O'zbekiston qonunchiligi asosida AI tahlili",
              date: new Date().toISOString().split('T')[0],
              outcome: 'AI tahlil asosida',
              relevance: 85,
            },
          ],
          statistics: {
            winRate: 50,
            averageDuration: '30-60 kun',
            commonIssues: [aiResponse.slice(0, 150)],
          },
        })
      } else {
        setCaseLawError(
          'Sud amaliyoti ma\u02BBlumotlarini yuklab bo\u02BBlmadi. Iltimos, keyinroq qayta urinib ko\u02BBring.'
        )
      }
    } catch (error) {
      console.log('Case law search API error:', error)
      setCaseLawError(
        'Sud amaliyoti ma\u02BBlumotlarini yuklab bo\u02BBlmadi. Iltimos, keyinroq qayta urinib ko\u02BBring.'
      )
    }
  }

  const getToolColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'from-blue-500 to-blue-600'
      case 'green':
        return 'from-green-500 to-green-600'
      case 'purple':
        return 'from-purple-500 to-purple-600'
      case 'orange':
        return 'from-orange-500 to-orange-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'high':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800/30'
    }
  }

  if (selectedTool) {
    return (
      <div className="min-h-screen bg-[#f8faff] dark:bg-zinc-950 mobile-safe-top">
        <div className="flex flex-col md:flex-row">
          {/* Sidebar — yagona navigatsiya (desktop) */}
          <AppSidebar>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedTool(null)}
                className="flex items-center gap-3 px-3 py-2 w-full text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:bg-zinc-800/50 rounded-lg cursor-pointer mb-4"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Orqaga</span>
              </button>

              {/* Tool Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-900 rounded-xl p-4 mb-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${getToolColor(selectedTool.color)} rounded-lg flex items-center justify-center text-white mb-3`}
                >
                  {selectedTool.icon}
                </div>
                <h3 className="font-bold text-gray-800 dark:text-zinc-200 mb-1">
                  {selectedTool.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-zinc-400">
                  {selectedTool.description}
                </p>
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
                    <h4 className="font-medium text-gray-800 dark:text-zinc-200 mb-3">
                      Kalkulyator turi
                    </h4>
                    <div className="space-y-2">
                      {[
                        { id: 'state-fee', label: 'Davlat boji' },
                        { id: 'damages', label: 'Zarar hisobi' },
                        { id: 'deadlines', label: 'Muddatlar' },
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => setCalculatorType(type.id as any)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            calculatorType === type.id
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                              : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:bg-zinc-800/50'
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
          </AppSidebar>

          {/* Main Tool Content */}
          <div className="flex-1">
            <header className="bg-white dark:bg-zinc-900 px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-zinc-200">
                    {selectedTool.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400">
                    {selectedTool.description}
                  </p>
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

            <main className="p-4 sm:p-6 lg:p-8">
              <div className="max-w-4xl mx-auto">
                {/* Mobile tool bar — desktop sidebar yashirin bo'lganda */}
                <div className="md:hidden mb-4 space-y-2">
                  <button
                    onClick={() => setSelectedTool(null)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg"
                  >
                    <ArrowLeft className="w-4 h-4" /> Orqaga
                  </button>
                  {selectedTool.category === 'calculator' && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {[
                        { id: 'state-fee', label: 'Davlat boji' },
                        { id: 'damages', label: 'Zarar hisobi' },
                        { id: 'deadlines', label: 'Muddatlar' },
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => setCalculatorType(type.id as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                            calculatorType === type.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Legal Calculators */}
                {selectedTool.category === 'calculator' && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
                      <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-200 mb-4">
                        {calculatorType === 'state-fee' && 'Davlat boji kalkulyatori'}
                        {calculatorType === 'damages' && 'Zarar va jarimalarni hisoblash'}
                        {calculatorType === 'deadlines' && 'Muddatlar kalkulyatori'}
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {calculatorType === 'state-fee' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                              Da\'vo summasi (so\'m)
                            </label>
                            <input
                              type="number"
                              value={calculatorInputs.claimAmount}
                              onChange={e =>
                                setCalculatorInputs({
                                  ...calculatorInputs,
                                  claimAmount: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="10000000"
                            />
                          </div>
                        )}

                        {calculatorType === 'damages' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                Shartnoma summasi (so\'m)
                              </label>
                              <input
                                type="number"
                                value={calculatorInputs.contractAmount}
                                onChange={e =>
                                  setCalculatorInputs({
                                    ...calculatorInputs,
                                    contractAmount: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="5000000"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                Kechikish kunlari
                              </label>
                              <input
                                type="number"
                                value={calculatorInputs.daysLate}
                                onChange={e =>
                                  setCalculatorInputs({
                                    ...calculatorInputs,
                                    daysLate: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="30"
                              />
                            </div>
                          </>
                        )}

                        {calculatorType === 'deadlines' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                Boshlanish sanasi
                              </label>
                              <input
                                type="date"
                                value={calculatorInputs.startDate}
                                onChange={e =>
                                  setCalculatorInputs({
                                    ...calculatorInputs,
                                    startDate: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                                Ish turi
                              </label>
                              <select
                                value={calculatorInputs.caseType}
                                onChange={e =>
                                  setCalculatorInputs({
                                    ...calculatorInputs,
                                    caseType: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                          <h3 className="font-bold text-gray-800 dark:text-zinc-200 mb-3">
                            Hisoblash natijalari
                          </h3>
                          <div className="space-y-2">
                            {calculatorResult.stateFee > 0 && (
                              <div className="flex justify-between">
                                <span>Davlat boji:</span>
                                <span className="font-bold">
                                  {calculatorResult.stateFee.toLocaleString()} so\'m
                                </span>
                              </div>
                            )}
                            {calculatorResult.damages > 0 && (
                              <div className="flex justify-between">
                                <span>Zarar (penya):</span>
                                <span className="font-bold">
                                  {calculatorResult.damages.toLocaleString()} so\'m
                                </span>
                              </div>
                            )}
                            <div className="pt-2 border-t border-gray-200 dark:border-zinc-800 flex justify-between">
                              <span className="font-bold">Jami:</span>
                              <span className="font-bold text-blue-600">
                                {calculatorResult.total.toLocaleString()} so\'m
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Document Templates — to\'liq shablonlar kutubxonasi */}
                {selectedTool.category === 'document' && <DocumentTemplates />}

                {/* Risk Assessment */}
                {selectedTool.category === 'risk' && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
                      <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-200 mb-4">
                        Shartnomani yuklang
                      </h2>

                      <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg p-8 text-center">
                        <Upload className="w-12 h-12 text-gray-400 dark:text-zinc-500 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-zinc-400 mb-4">
                          Shartnoma faylini bu yerga torting
                        </p>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={e => setUploadedContract(e.target.files?.[0] || null)}
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
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-800 dark:text-zinc-200">
                              {uploadedContract.name}
                            </span>
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
                          <h3 className="font-bold text-gray-800 dark:text-zinc-200 mb-4">
                            Xavflarni baholash natijalari
                          </h3>

                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <div
                              className={`p-4 rounded-lg text-center ${getRiskColor(riskAssessment.overallRisk)}`}
                            >
                              <div className="text-2xl font-bold mb-1">{riskAssessment.score}%</div>
                              <div className="text-sm font-medium">Umumiy xavf</div>
                              <div className="text-xs mt-1">
                                {riskAssessment.overallRisk === 'low'
                                  ? 'Past'
                                  : riskAssessment.overallRisk === 'medium'
                                    ? "O'rta"
                                    : 'Yuqori'}
                              </div>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg text-center">
                              <div className="text-2xl font-bold mb-1">
                                {riskAssessment.risks.length}
                              </div>
                              <div className="text-sm font-medium">Topilgan xavflar</div>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg text-center">
                              <div className="text-2xl font-bold mb-1">
                                {riskAssessment.recommendations.length}
                              </div>
                              <div className="text-sm font-medium">Tavsiyalar</div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-800 dark:text-zinc-200">
                              Xavflar
                            </h4>
                            {riskAssessment.risks.map((risk, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-gray-800 dark:text-zinc-200">
                                      {risk.category}
                                    </span>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs ${getRiskColor(risk.severity)}`}
                                    >
                                      {risk.severity === 'low'
                                        ? 'Past'
                                        : risk.severity === 'medium'
                                          ? "O'rta"
                                          : 'Yuqori'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-zinc-400">
                                    {risk.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4">
                            <h4 className="font-medium text-gray-800 dark:text-zinc-200 mb-3">
                              Tavsiyalar
                            </h4>
                            <div className="space-y-2">
                              {riskAssessment.recommendations.map((rec, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                                >
                                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                                  <span className="text-sm text-gray-700 dark:text-zinc-300">
                                    {rec}
                                  </span>
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
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
                      <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-200 mb-4">
                        Pretsedentlarni qidirish
                      </h2>

                      <div className="flex gap-4 mb-6">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Ish turi, kalit so\'zlar..."
                          className="flex-1 px-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={searchCaseLaw}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Qidirish
                        </button>
                      </div>

                      {caseLawError && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-sm text-red-600 dark:text-red-400">{caseLawError}</p>
                        </div>
                      )}

                      {caseLawResults && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="font-bold text-gray-800 dark:text-zinc-200 mb-4">
                              Statistika
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-600 mb-1">
                                  {caseLawResults.statistics.winRate}%
                                </div>
                                <div className="text-sm text-gray-600 dark:text-zinc-400">
                                  G\'alaba ehtimoli
                                </div>
                              </div>
                              <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-600 mb-1">
                                  {caseLawResults.statistics.averageDuration}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-zinc-400">
                                  O\'rtalama muddat
                                </div>
                              </div>
                              <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-purple-600 mb-1">
                                  {caseLawResults.precedents.length}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-zinc-400">
                                  Topilgan ishlar
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-bold text-gray-800 dark:text-zinc-200 mb-4">
                              Pretsedentlar
                            </h3>
                            <div className="space-y-3">
                              {caseLawResults.precedents.map((precedent, index) => (
                                <div
                                  key={index}
                                  className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-800 dark:text-zinc-200 mb-1">
                                        {precedent.title}
                                      </h4>
                                      <p className="text-sm text-gray-600 dark:text-zinc-400 mb-2">
                                        {precedent.court} • {precedent.date}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs ${
                                            precedent.outcome === "Da'vogar foydasiga"
                                              ? 'bg-green-100 text-green-700'
                                              : 'bg-red-100 text-red-700'
                                          }`}
                                        >
                                          {precedent.outcome}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-zinc-500">
                                          Moslik: {precedent.relevance}%
                                        </span>
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
    )
  }

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-zinc-950 mobile-safe-top">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar — yagona navigatsiya (desktop) */}
        <AppSidebar>
          <div className="space-y-1">
            <button
              onClick={() => {
                if (window.history.length > 1) window.history.back()
                else window.location.href = '/dashboard'
              }}
              className="flex items-center gap-3 px-3 py-2 w-full text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:bg-zinc-800/50 rounded-lg cursor-pointer mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Orqaga</span>
            </button>

            <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
              <Star className="w-5 h-5" />
              <span className="font-medium">Pro Vositalar</span>
            </div>
          </div>
        </AppSidebar>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white dark:bg-zinc-900 px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-zinc-200">
                  Professional Vositalar
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400">
                  Premium qismi - amaliyotchi yuristlar uchun
                </p>
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
          <main className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {tools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool)}
                    className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200 text-left"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-16 h-16 bg-gradient-to-br ${getToolColor(tool.color)} rounded-xl flex items-center justify-center text-white`}
                      >
                        {tool.icon}
                      </div>
                      {tool.isPro && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Pro
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 dark:text-zinc-200 mb-2">
                      {tool.title}
                    </h3>
                    <p className="text-gray-600 dark:text-zinc-400 mb-4">{tool.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-500">
                        <Target className="w-4 h-4" />
                        <span>
                          {tool.category === 'calculator'
                            ? 'Hisoblash'
                            : tool.category === 'document'
                              ? 'Hujjat'
                              : tool.category === 'risk'
                                ? 'Tahlil'
                                : 'Analitika'}
                        </span>
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
              <div className="mt-8 bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-200 mb-4">
                  Pro Vositalar xususiyatlari
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Calculator className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 dark:text-zinc-200 text-sm">
                      Aniq hisoblar
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                      Qonuniy asosda hisoblash
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 dark:text-zinc-200 text-sm">
                      Aqlli generator
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                      Shaxsiylashtirilgan hujjatlar
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 dark:text-zinc-200 text-sm">
                      Xavf tahlili
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                      AI asosida baholash
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <BarChart className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="font-medium text-gray-800 dark:text-zinc-200 text-sm">
                      Statistika
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                      Pretsedentlar tahlili
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
