'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Save,
  FolderOpen,
  RotateCcw,
  Sparkles,
  Download,
  FileDown,
  Scale,
  FileCheck,
  BookOpen,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Wallet,
  Target,
  BarChart3,
  Layers,
  Info,
  HelpCircle,
  Share2,
  GitBranch,
  X,
  RefreshCw,
} from 'lucide-react'
import AppSidebar from '@/components/layout/AppSidebar'
import FeatureInstructions from '@/components/ui/FeatureInstructions'
import DecisionTreeGraph from '@/components/decision-tree/DecisionTreeGraph'
import NewCaseModal, { NewCaseFormData } from '@/components/decision-tree/NewCaseModal'
import AnalysisProgressModal from '@/components/decision-tree/AnalysisProgressModal'
import NodeDetailPanel from '@/components/decision-tree/NodeDetailPanel'
import BranchComparisonModal from '@/components/decision-tree/BranchComparisonModal'
import EvidencePanel from '@/components/decision-tree/EvidencePanel'
import CaseHistoryDrawer from '@/components/decision-tree/CaseHistoryDrawer'
import { generateDecisionTreePdf } from '@/components/decision-tree/PdfExportHelper'
import {
  DecisionCase,
  DecisionNode,
  TreeStatistics,
  PathSimulationMetrics,
} from '@/types/decision-tree'
import {
  calculateTreeStatistics,
  calculatePathSimulation,
  buildComparisonVariants,
  findPathToNode,
  findNodeById,
  formatCurrencySom,
} from '@/lib/decision-tree-engine'
import { getAuthHeaders } from '@/lib/api-auth-client'

const INSTRUCTIONS = [
  {
    title: 'Ish tafsilotlarini kiriting',
    description:
      'Yangi ish formasida 10 ta yuridik parametr boʻyicha maʼlumotlarni kiriting yoki namunani tanlang.',
    icon: '📝',
  },
  {
    title: 'AI qonunlar bazasidan tahlil qiladi',
    description:
      'Sunʼiy intellekt Oʻzbekiston qonunchiligi moddalari asosida real qarorlar daraxtini shakllantiradi.',
    icon: '🤖',
  },
  {
    title: 'Strategiyani simulyatsiya qiling',
    description:
      'Har bir yoʻnalishni tanlab, xarajat, muddat, xavf va kerakli dalillarni taqqoslang.',
    icon: '🌳',
  },
  {
    title: 'PDF hisobotni yuklab oling',
    description:
      'Barcha qonun normalari va tahlillari bilan professional yuridik xulosani eksport qiling.',
    icon: '📄',
  },
]

const TIPS = [
  'Barcha mavjud dalillarni kiriting — AI dalil yetishmovchiligi xavfini aniqlaydi',
  'Variantlarni taqqoslash (Comparison) orqali eng optimal yuridik yoʻlni toping',
  'Tugunlarni bosib, Oʻzbekiston qonunlar bazasidagi aniq moddalarni oʻrganing',
]

// Standart boshlang'ich bo'sh daraxt
const INITIAL_ROOT_NODE: DecisionNode = {
  id: 'root',
  type: 'ROOT',
  title: 'Qarorlar Daraxti',
  description: 'Ishni boshlash uchun "Yangi ish yaratish" tugmasini bosing',
  risk_level: 'low',
  confidence: 80,
  children: [],
}

export default function DecisionTreePage() {
  const router = useRouter()

  // Case State
  const [currentCase, setCurrentCase] = useState<DecisionCase | null>(null)
  const [savedCases, setSavedCases] = useState<DecisionCase[]>([])
  const [activeTab, setActiveTab] = useState<'details' | 'evidence'>('details')

  // Graph & Node Selection State
  const [selectedNode, setSelectedNode] = useState<DecisionNode | null>(null)
  const [simulatedNodeId, setSimulatedNodeId] = useState<string | null>(null)
  const [evidenceState, setEvidenceState] = useState<Record<string, boolean>>({})

  // Modals & Drawers State
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false)
  const [isProgressOpen, setIsProgressOpen] = useState(false)
  const [isComparisonOpen, setIsComparisonOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Status & Notifications
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(null), 3500)
  }

  // 1. Fetch saved cases from backend API on mount
  const loadSavedCases = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/decision-tree/trees', { headers })
      const data = await res.json()

      if (data.success && Array.isArray(data.trees)) {
        setSavedCases(data.trees)
        // If no case currently selected, open the latest saved one
        if (!currentCase && data.trees.length > 0) {
          const latest = data.trees[0]
          setCurrentCase(latest)
          setEvidenceState(latest.evidence_state || {})
          if (Array.isArray(latest.selected_path) && latest.selected_path.length > 0) {
            setSimulatedNodeId(latest.selected_path[latest.selected_path.length - 1])
          }
        }
      }
    } catch (err) {
      console.error('Error loading saved trees:', err)
    }
  }, [currentCase])

  useEffect(() => {
    loadSavedCases()
  }, [loadSavedCases])

  // Real-time Statistics calculation
  const statistics: TreeStatistics = useMemo(() => {
    if (!currentCase?.tree) {
      return {
        variants: 0,
        decisionPoints: 0,
        outcomes: 0,
        optimalPaths: 0,
        riskPaths: 0,
        totalCost: 0,
        durations: [],
        confidence: 0,
        evidenceRequiredCount: 0,
        legalBasesCount: 0,
      }
    }
    return calculateTreeStatistics(currentCase.tree)
  }, [currentCase?.tree])

  // Active Path IDs for simulation highlight
  const activePathIds = useMemo(() => {
    if (!currentCase?.tree || !simulatedNodeId) return []
    const path = findPathToNode(currentCase.tree, simulatedNodeId)
    return path.map(n => n.id)
  }, [currentCase?.tree, simulatedNodeId])

  // Simulated Path Metrics
  const simulationMetrics: PathSimulationMetrics | null = useMemo(() => {
    if (!currentCase?.tree || !simulatedNodeId) return null
    return calculatePathSimulation(currentCase.tree, simulatedNodeId, evidenceState)
  }, [currentCase?.tree, simulatedNodeId, evidenceState])

  // Comparison Variants
  const comparisonVariants = useMemo(() => {
    if (!currentCase?.tree) return []
    return buildComparisonVariants(currentCase.tree)
  }, [currentCase?.tree])

  // Handle New Case Submission (AI Analysis)
  const handleCreateCase = async (formData: NewCaseFormData) => {
    setIsNewCaseOpen(false)
    setIsProgressOpen(true)
    setError(null)
    setLoading(true)

    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/decision-tree/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(formData),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error || result.message || 'AI tahlilida xatolik yuz berdi')
      }

      const newCase: DecisionCase = {
        id: `case_${Date.now()}`,
        name: formData.name,
        case_type: formData.case_type,
        user_role: formData.user_role,
        objectives: formData.objectives,
        known_facts: formData.known_facts,
        evidence_docs: formData.evidence_docs,
        opposing_party: formData.opposing_party,
        deadlines: formData.deadlines,
        additional_notes: formData.additional_notes,
        tree: result.tree,
        analysis: result.analysis,
        selected_path: [],
        evidence_state: {},
        notes: '',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setCurrentCase(newCase)
      setSelectedNode(result.tree)
      setSimulatedNodeId(null)
      setEvidenceState({})

      // Persist to backend database immediately
      await saveCaseToDb(newCase)
      showToast('Yangi ish tahlili yakunlandi va saqlandi!')
    } catch (err) {
      console.error('Case analysis error:', err)
      setError(err instanceof Error ? err.message : 'Tahlil jarayonida xatolik yuz berdi')
    } finally {
      setIsProgressOpen(false)
      setLoading(false)
    }
  }

  // Save Case to Database
  const saveCaseToDb = async (caseToSave?: DecisionCase) => {
    const c = caseToSave || currentCase
    if (!c) return

    setSaving(true)
    try {
      const headers = await getAuthHeaders()
      const payload = {
        ...c,
        selected_path: activePathIds,
        evidence_state: evidenceState,
      }

      let res
      if (c.id && !c.id.startsWith('case_')) {
        // Update existing row
        res = await fetch(`/api/decision-tree/trees/${c.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(payload),
        })
      } else {
        // Insert new row
        res = await fetch('/api/decision-tree/trees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(payload),
        })
      }

      const resData = await res.json()
      if (resData.success && resData.case) {
        setCurrentCase(resData.case)
        setSavedCases(prev => [resData.case, ...prev.filter(x => x.id !== resData.case.id)])
        showToast('Qarorlar daraxti bazaga muvaffaqiyatli saqlandi!')
      } else {
        throw new Error(resData.error || 'Saqlashda xatolik yuz berdi')
      }
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Saqlashda xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  // Toggle Node Collapse
  const handleToggleCollapse = (nodeId: string) => {
    if (!currentCase?.tree) return

    function toggle(n: DecisionNode): DecisionNode {
      if (n.id === nodeId) {
        return { ...n, collapsed: !n.collapsed }
      }
      if (n.children) {
        return { ...n, children: n.children.map(toggle) }
      }
      return n
    }

    const updatedTree = toggle(currentCase.tree)
    setCurrentCase({ ...currentCase, tree: updatedTree })
  }

  // Update Node Data
  const handleUpdateNode = (nodeId: string, patch: Partial<DecisionNode>) => {
    if (!currentCase?.tree) return

    function update(n: DecisionNode): DecisionNode {
      if (n.id === nodeId) {
        return { ...n, ...patch }
      }
      if (n.children) {
        return { ...n, children: n.children.map(update) }
      }
      return n
    }

    const updatedTree = update(currentCase.tree)
    setCurrentCase({ ...currentCase, tree: updatedTree })
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({ ...selectedNode, ...patch })
    }
  }

  // Add Child Node
  const handleAddChildNode = (parentId: string) => {
    if (!currentCase?.tree) return
    const newId = `node_${Date.now()}`
    const newNode: DecisionNode = {
      id: newId,
      type: 'DECISION',
      title: 'Yangi qaror varianti',
      description: 'Qaror tafsilotlari',
      risk_level: 'medium',
      risk_basis: 'Qo‘shimcha tahlil talab etiladi',
      probability: 50,
      estimated_cost: 0,
      estimated_duration: '15-30 kun',
      confidence: 70,
      evidence_required: [],
      next_steps: ['Harakat rejasini tuzish'],
    }

    function add(n: DecisionNode): DecisionNode {
      if (n.id === parentId) {
        return {
          ...n,
          collapsed: false,
          children: [...(n.children || []), newNode],
        }
      }
      if (n.children) {
        return { ...n, children: n.children.map(add) }
      }
      return n
    }

    const updatedTree = add(currentCase.tree)
    setCurrentCase({ ...currentCase, tree: updatedTree })
    setSelectedNode(newNode)
  }

  // Delete Node
  const handleDeleteNode = (nodeId: string) => {
    if (!currentCase?.tree || nodeId === 'root') return

    function remove(n: DecisionNode): DecisionNode | null {
      if (n.id === nodeId) return null
      if (n.children) {
        return {
          ...n,
          children: n.children.map(remove).filter(Boolean) as DecisionNode[],
        }
      }
      return n
    }

    const updatedTree = remove(currentCase.tree)
    if (updatedTree) {
      setCurrentCase({ ...currentCase, tree: updatedTree })
      if (selectedNode?.id === nodeId) {
        setSelectedNode(updatedTree)
      }
      if (simulatedNodeId === nodeId) {
        setSimulatedNodeId(null)
      }
    }
  }

  // Evidence Checklist Toggle
  const handleToggleEvidence = (evidenceName: string) => {
    setEvidenceState(prev => ({
      ...prev,
      [evidenceName]: !prev[evidenceName],
    }))
  }

  const handleAddCustomEvidence = (name: string) => {
    setEvidenceState(prev => ({
      ...prev,
      [name]: true,
    }))
  }

  const handleRemoveEvidence = (name: string) => {
    setEvidenceState(prev => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  // Delete saved case
  const handleDeleteCase = async (caseId: string) => {
    try {
      const headers = await getAuthHeaders()
      await fetch(`/api/decision-tree/trees/${caseId}`, {
        method: 'DELETE',
        headers,
      })

      setSavedCases(prev => prev.filter(c => c.id !== caseId))
      if (currentCase?.id === caseId) {
        setCurrentCase(null)
        setSelectedNode(null)
        setSimulatedNodeId(null)
      }
      showToast('Ish oʻchirildi')
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  // PDF Export
  const handleExportPdf = async () => {
    if (!currentCase) return
    try {
      showToast('PDF hisobot tayyorlanmoqda...')
      const blob = await generateDecisionTreePdf(currentCase, statistics, simulationMetrics)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${currentCase.name.replace(/[^a-zA-Z0-9\-_]/g, '_')}_qarorlar_daraxti.pdf`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch (err) {
      console.error('PDF export error:', err)
      setError('PDF hisobotini yaratishda xatolik yuz berdi')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col select-none">
      <FeatureInstructions featureName="Qarorlar Daraxti" steps={INSTRUCTIONS} tips={TIPS} />

      {/* Top Application Bar */}
      <header className="h-16 px-4 sm:px-6 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            title="Bosh sahifaga qaytish"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center font-bold">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                {currentCase?.name || 'Qarorlar Daraxti'}
                {currentCase?.case_type && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 uppercase">
                    {currentCase.case_type}
                  </span>
                )}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Oʻzbekiston qonunchiligiga asoslangan interaktiv qaror qabul qilish simulyatori
              </p>
            </div>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-colors"
            title="Saqlangan ishlar tarixi"
          >
            <FolderOpen className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Tarix ({savedCases.length})</span>
          </button>

          <button
            onClick={() => setIsComparisonOpen(true)}
            disabled={!currentCase || comparisonVariants.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-40 rounded-xl transition-colors"
            title="Variantlarni taqqoslash"
          >
            <Scale className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Taqqoslash</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={!currentCase}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 disabled:opacity-40 rounded-xl transition-colors"
            title="PDF hisobot"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={() => saveCaseToDb()}
            disabled={!currentCase || saving}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm shadow-blue-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
          </button>

          <button
            onClick={() => setIsNewCaseOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Yangi Ish</span>
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          {successToast}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:text-rose-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Simulation Path Highlight Bar */}
      {simulatedNodeId && simulationMetrics && (
        <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-emerald-900 dark:text-emerald-200">
              Faol Simulyatsiya Yoʻnalishi:
            </span>
            <span className="text-emerald-800 dark:text-emerald-300 truncate max-w-md">
              {simulationMetrics.pathNodes.map(p => p.title).join('  ➔  ')}
            </span>
          </div>

          <div className="flex items-center gap-4 text-emerald-900 dark:text-emerald-200 font-medium">
            <span>
              Xarajat: <strong>{formatCurrencySom(simulationMetrics.totalCost)}</strong>
            </span>
            <span>
              AI Ishonchliligi: <strong>{simulationMetrics.overallConfidence}%</strong>
            </span>
            <button
              onClick={() => setSimulatedNodeId(null)}
              className="text-[11px] underline text-emerald-700 dark:text-emerald-300 hover:text-emerald-900"
            >
              Simulyatsiyani bekor qilish
            </button>
          </div>
        </div>
      )}

      {/* Main 3-Pane Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT PANE (Case Metadata & Analysis Summary & Evidence) */}
        <div className="lg:col-span-3 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-full overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Ish Tafsilotlari
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'evidence'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" /> Dalillar Tizimi
            </button>
          </div>

          {/* Left Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {activeTab === 'details' ? (
              currentCase ? (
                <div className="space-y-4">
                  {/* Case Summary */}
                  {currentCase.analysis?.case_summary && (
                    <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                      <h4 className="font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wide text-[10px] mb-1">
                        Huquqiy Xulosa
                      </h4>
                      <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">
                        {currentCase.analysis.case_summary}
                      </p>
                    </div>
                  )}

                  {/* Facts */}
                  {currentCase.known_facts && (
                    <div>
                      <h4 className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide text-[10px] mb-1">
                        Ishdagi Maʼlum Faktlar
                      </h4>
                      <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 leading-relaxed">
                        {currentCase.known_facts}
                      </p>
                    </div>
                  )}

                  {/* Legal Issues */}
                  {currentCase.analysis?.legal_issues &&
                    currentCase.analysis.legal_issues.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide text-[10px] mb-1.5">
                          Huquqiy Masalalar
                        </h4>
                        <div className="space-y-1">
                          {currentCase.analysis.legal_issues.map((issue, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/50 text-slate-700 dark:text-zinc-300"
                            >
                              • {issue}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Applicable Laws */}
                  {currentCase.analysis?.applicable_laws &&
                    currentCase.analysis.applicable_laws.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide text-[10px] mb-1.5 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Baza Qonun Moddalari
                        </h4>
                        <div className="space-y-1.5">
                          {currentCase.analysis.applicable_laws.map((law, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/70 dark:border-zinc-800 text-slate-800 dark:text-zinc-200"
                            >
                              <span className="font-bold text-blue-600 dark:text-blue-400 block">
                                {law.code_name || law.code_id} • {law.article_number}-modda
                              </span>
                              {law.title && (
                                <span className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium block">
                                  {law.title}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 dark:text-zinc-500">
                  <p>Hozircha ish tanlanmagan.</p>
                  <button
                    onClick={() => setIsNewCaseOpen(true)}
                    className="mt-3 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg hover:bg-blue-100"
                  >
                    Yangi ish yaratish
                  </button>
                </div>
              )
            ) : (
              <EvidencePanel
                evidenceState={evidenceState}
                onToggleEvidence={handleToggleEvidence}
                onAddEvidence={handleAddCustomEvidence}
                onRemoveEvidence={handleRemoveEvidence}
              />
            )}
          </div>
        </div>

        {/* CENTER PANE (Interactive Decision Tree Graph) */}
        <div className="lg:col-span-6 h-full p-4 flex flex-col bg-slate-100/60 dark:bg-zinc-950 overflow-hidden">
          {currentCase?.tree ? (
            <DecisionTreeGraph
              tree={currentCase.tree}
              selectedNodeId={selectedNode?.id || null}
              activePathIds={activePathIds}
              onSelectNode={node => setSelectedNode(node)}
              onToggleCollapse={handleToggleCollapse}
              onAddChildNode={handleAddChildNode}
            />
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 ring-8 ring-blue-500/5">
                <GitBranch className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100">
                Halicha Qarorlar Daraxti Yaratilmagan
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mt-1 mb-6">
                Oʻzbekiston qonunlariga asoslangan real huquqiy strategiya tahlilini olish uchun
                yangi ish yarating
              </p>
              <button
                onClick={() => setIsNewCaseOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Yangi Ish Yaratish
              </button>
            </div>
          )}
        </div>

        {/* RIGHT PANE (Node Details & Real-Time Stats) */}
        <div className="lg:col-span-3 border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-full overflow-hidden">
          {selectedNode ? (
            <NodeDetailPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onSimulatePath={nodeId => setSimulatedNodeId(nodeId)}
              onAddChildNode={handleAddChildNode}
              onDeleteNode={handleDeleteNode}
              onUpdateNode={handleUpdateNode}
              evidenceState={evidenceState}
              onToggleEvidence={handleToggleEvidence}
            />
          ) : (
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800">
                <h3 className="font-bold text-slate-800 dark:text-zinc-100 text-xs mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  Strategik Koʻrsatkichlar
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                    <span className="text-slate-500 dark:text-zinc-400">Jami variantlar</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-100">
                      {statistics.variants} ta
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                    <span className="text-slate-500 dark:text-zinc-400">Qaror nuqtalari</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {statistics.decisionPoints} ta
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                    <span className="text-slate-500 dark:text-zinc-400">Optimal / Xavfli</span>
                    <span className="font-bold">
                      <span className="text-emerald-600">{statistics.optimalPaths}</span> /{' '}
                      <span className="text-rose-600">{statistics.riskPaths}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                    <span className="text-slate-500 dark:text-zinc-400">AI Ishonchliligi</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {statistics.confidence}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800">
                    <span className="text-slate-500 dark:text-zinc-400 block text-[10px] mb-0.5">
                      Taxminiy umumiy xarajat:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-zinc-100">
                      {formatCurrencySom(statistics.totalCost)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs text-blue-900 dark:text-blue-300">
                <Info className="w-4 h-4 mb-2 text-blue-600" />
                <p>
                  Daraxtdagi istalgan tugunni bosib, uning huquqiy asoslari, kerakli dalillar
                  roʻyxati va amaliy qadamlarini koʻrishingiz mumkin.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Case Creation Modal */}
      <NewCaseModal
        isOpen={isNewCaseOpen}
        onClose={() => setIsNewCaseOpen(false)}
        onSubmit={handleCreateCase}
        loading={loading}
      />

      {/* 6-Step Analysis Progress Modal */}
      <AnalysisProgressModal isOpen={isProgressOpen} />

      {/* Branch Comparison Modal */}
      <BranchComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        variants={comparisonVariants}
        onSelectVariant={variantId => setSimulatedNodeId(variantId)}
      />

      {/* Saved Cases History Drawer */}
      <CaseHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        cases={savedCases}
        onOpenCase={c => {
          setCurrentCase(c)
          setSelectedNode(c.tree)
          setEvidenceState(c.evidence_state || {})
          if (Array.isArray(c.selected_path) && c.selected_path.length > 0) {
            setSimulatedNodeId(c.selected_path[c.selected_path.length - 1])
          } else {
            setSimulatedNodeId(null)
          }
        }}
        onDeleteCase={handleDeleteCase}
        onNewCase={() => setIsNewCaseOpen(true)}
      />
    </div>
  )
}
