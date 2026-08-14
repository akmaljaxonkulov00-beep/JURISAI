'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  Play,
  Info,
  GitBranch,
  Target,
  TrendingUp,
  Plus,
  Trash2,
  Save,
  FolderOpen,
  Edit3,
  Type,
  Loader2,
  Sparkles,
  BarChart3,
  Layers,
  Network,
  Share2,
  Download,
  FileDown,
  Clock,
  Wallet,
  BookOpen,
  Lightbulb,
} from 'lucide-react'
import AppSidebar from '@/components/layout/AppSidebar'
import { api } from '@/services/api'
import { getUserIdentityPayload } from '@/lib/client-user'
import { supabase } from '@/lib/supabase-browser'
import { AnalysisSkeleton } from '@/components/ui/AnalysisSkeleton'
import { AnalysisError, getErrorMessage } from '@/components/ui/AnalysisError'
import { getDisplayNameFromCodeId } from '@/lib/utils/code-mapper'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

interface TreeNode {
  id: string
  label: string
  type: 'root' | 'decision' | 'outcome'
  probability?: number
  risk?: 'low' | 'medium' | 'high'
  children?: TreeNode[]
  x?: number
  y?: number
  status?: 'active' | 'optimal' | 'risk' | 'neutral'
  details?: string
  // ── Metrikalar (strategik ko'rsatkichlar) ──
  duration?: string // kutilayotgan muddat: "3-6 oy", "15-45 kun"
  cost?: number // moliyaviy xarajat (so'mda)
  legalBasis?: string // huquqiy asos: "FK 333-moddasi"
  actionItems?: string[] // tavsiya etiladigan keyingi qadamlar
}

interface SavedTree {
  id: string
  name: string
  caseType: string
  scenario: string
  tree: TreeNode
  createdAt: string
  updatedAt: string
  /** Supabase'dagi UUID — mavjud bo'lsa yangilash, aks holda yangi yozish */
  dbId?: string
}

interface Statistics {
  variants: number
  confidence: number
  outcomes: number
  optimalPaths: number
  riskPaths: number
  totalCost: number
  durations: string[]
}

const CASE_TEMPLATES = [
  {
    label: 'Shartnoma buzilishi',
    scenario: 'Kontragent shartnoma shartlarini bajarmadi',
    type: 'fuqarolik',
  },
  {
    label: 'Mehnat nizosi',
    scenario: 'Ish beruvchi mehnat shartnomasini noqonuniy bekor qildi',
    type: 'mehnat',
  },
  {
    label: 'Oila nizosi',
    scenario: "Turmush o'rtoqlar ajrashish va mulkni bo'lish masalasi",
    type: 'oila',
  },
  {
    label: 'Jinoyat ishi',
    scenario: 'Shaxsga nisbatan firibgarlik jinoyati sodir etildi',
    type: 'jinoyat',
  },
  {
    label: "Ma'muriy huquqbuzarlik",
    scenario: "Ma'muriy jazo belgilash to'g'risida",
    type: "ma'muriy",
  },
  {
    label: 'Meros nizosi',
    scenario: 'Meros qoldiruvchining mol-mulkini taqsimlash',
    type: 'fuqarolik',
  },
]

export default function DecisionTreeEngine() {
  const [zoom, setZoom] = useState(1)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showSimulation, setShowSimulation] = useState(false)
  const [statistics, setStatistics] = useState<Statistics>({
    variants: 0,
    confidence: 0,
    outcomes: 0,
    optimalPaths: 0,
    riskPaths: 0,
    totalCost: 0,
    durations: [],
  })
  const [history, setHistory] = useState<string[]>([])
  const [showNewCase, setShowNewCase] = useState(true)
  const [showSavedTrees, setShowSavedTrees] = useState(false)
  const [savedTrees, setSavedTrees] = useState<SavedTree[]>([])
  const [currentTreeName, setCurrentTreeName] = useState('')
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false) // AI daraxt yaratish holati
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<
    { number: string; title: string; content: string }[]
  >([])
  const [recLoading, setRecLoading] = useState(false)
  const recSelectionGuard = useRef(false)
  const svgRef = useRef<SVGSVGElement>(null)

  // ── Tugun batafsil ma'lumot modali ───────────────────────────
  const [detailNode, setDetailNode] = useState<TreeNode | null>(null)
  const [detailLegal, setDetailLegal] = useState<
    { article_number: string; title: string; code_id: string }[]
  >([])
  const [legalLoading, setLegalLoading] = useState(false)
  const [editProb, setEditProb] = useState('')
  const [editDuration, setEditDuration] = useState('')
  const [editCost, setEditCost] = useState('')

  // ── Default tree (shown after user creates a case) ────────────
  const [decisionTree, setDecisionTree] = useState<TreeNode>({
    id: 'root',
    label: 'Yangi ish',
    type: 'root',
    x: 400,
    y: 50,
    children: [
      {
        id: 'sud',
        label: 'Sudga berish',
        type: 'decision',
        x: 200,
        y: 150,
        probability: 60,
        risk: 'medium',
        duration: '3-6 oy',
        cost: 800000,
        legalBasis: 'FK 333-moddasi',
        actionItems: [
          "Da'vo arizasini tayyorlash va sudga topshirish",
          'Dalillarni toʻplash (shartnoma, hisob-fakturalar)',
        ],
        children: [
          {
            id: 'g_alaba',
            label: "G'alaba",
            type: 'outcome',
            x: 100,
            y: 250,
            probability: 75,
            status: 'optimal',
            duration: '3-6 oy',
          },
          {
            id: 'xarajat',
            label: 'Xarajat ortishi',
            type: 'outcome',
            x: 300,
            y: 250,
            probability: 25,
            status: 'risk',
            duration: '6-12 oy',
            cost: 1200000,
          },
        ],
      },
      {
        id: 'muzokara',
        label: "Muzokara o'tkazish",
        type: 'decision',
        x: 600,
        y: 150,
        probability: 70,
        risk: 'low',
        duration: '15-45 kun',
        cost: 200000,
        legalBasis: 'FK 387-moddasi',
        actionItems: [
          'Kontragentga rasmiy taklif xati yuborish',
          'Mediator yoki advokat ishtirokida uchrashuv tashkil qilish',
        ],
        children: [
          {
            id: 'kelishuv',
            label: 'Kelishuv',
            type: 'outcome',
            x: 500,
            y: 250,
            probability: 80,
            status: 'optimal',
            duration: '15-45 kun',
          },
          {
            id: 'maglubiyat',
            label: "Mag'lubiyat",
            type: 'outcome',
            x: 700,
            y: 250,
            probability: 20,
            status: 'risk',
            duration: '1-3 oy',
            cost: 300000,
          },
        ],
      },
    ],
  })

  // ── Load saved trees from localStorage + Supabase ─────────────
  useEffect(() => {
    let local: SavedTree[] = []
    try {
      const stored = localStorage.getItem('decision_trees')
      if (stored) local = JSON.parse(stored) as SavedTree[]
    } catch {}

    // Supabase'dan foydalanuvchi daraxtlarini yuklash va birlashtirish
    // (boshqa qurilmada saqlangan daraxtlar ham ko'rinadi)
    ;(async () => {
      let supabaseTrees: SavedTree[] = []
      try {
        const { data, error } = await supabase
          .from('decision_trees')
          .select('*')
          .order('updated_at', { ascending: false })
        if (!error && data && Array.isArray(data)) {
          supabaseTrees = data.map((t: any) => ({
            id: t.id,
            dbId: t.id,
            name: t.name,
            caseType: t.case_type || 'huquqiy',
            scenario: t.scenario || '',
            tree: t.tree as TreeNode,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
          }))
        }
      } catch {
        /* jadval mavjud emas yoki ruxsat yo'q — localStorage'da qoladi */
      }

      // Birlashtirish: Supabase versiyasi ustun (eng so'nggi updatedAt)
      const merged = [...supabaseTrees]
      for (const l of local) {
        const dup = merged.find(m => (m.dbId && m.dbId === l.dbId) || m.name === l.name)
        if (!dup) {
          merged.push(l)
        } else if (new Date(l.updatedAt) > new Date(dup.updatedAt)) {
          Object.assign(dup, { ...l, dbId: dup.dbId })
        }
      }
      merged.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      setSavedTrees(merged.slice(0, 20))
    })()
  }, [])

  // ── Statistika har doim daraxtdan hisoblanadi ("—" qolmaydi) ──
  useEffect(() => {
    setStatistics(computeTreeStats(decisionTree))
  }, [decisionTree])

  // ── Tugun modal ochilganda huquqiy asos (Supabase moddalar) ──
  useEffect(() => {
    if (!detailNode) {
      setDetailLegal([])
      return
    }
    setEditProb(detailNode.probability != null ? String(detailNode.probability) : '50')
    setEditDuration(detailNode.duration || '')
    setEditCost(detailNode.cost != null ? String(detailNode.cost) : '')
    setLegalLoading(true)
    setDetailLegal([])
    const q = (detailNode.label || '').replace(/'/g, '').replace(/ʻ/g, '').trim()
    if (q.length < 3) {
      setLegalLoading(false)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('articles')
          .select('article_number, title, code_id')
          .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
          .limit(3)
        setDetailLegal((data || []) as any)
      } catch {
        setDetailLegal([])
      } finally {
        setLegalLoading(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [detailNode])

  // ── Track activity for statistics ─────────────────────────────
  const trackActivity = useCallback((action: string, data?: Record<string, any>) => {
    try {
      const stats = JSON.parse(localStorage.getItem('user_stats') || '{}')
      if (!stats.recentActivity) stats.recentActivity = []
      stats.recentActivity.unshift({
        id: Date.now().toString(),
        type: 'case_completed',
        title: action,
        description: data?.scenario || 'Qarorlar daraxti tahlili',
        timestamp: new Date().toISOString(),
        xp: 10,
      })
      if (stats.recentActivity.length > 20) stats.recentActivity = stats.recentActivity.slice(0, 20)
      stats.xp = (stats.xp || 0) + 10
      stats.completedCases = (stats.completedCases || 0) + 1
      localStorage.setItem('user_stats', JSON.stringify(stats))
    } catch {}
  }, [])

  // ── Create a new case from template ───────────────────────────
  const createFromTemplate = (template: (typeof CASE_TEMPLATES)[0]) => {
    const newTree: TreeNode = {
      id: 'root',
      label: template.label,
      type: 'root',
      x: 400,
      y: 50,
      children: [
        {
          id: 'sud',
          label: 'Sudga berish',
          type: 'decision',
          x: 200,
          y: 150,
          probability: 60,
          risk: 'medium',
          duration: '3-6 oy',
          cost: 800000,
          legalBasis: 'FK 333-moddasi',
          actionItems: [
            "Da'vo arizasini tayyorlash va sudga topshirish",
            'Dalillarni toʻplash (shartnoma, hisob-fakturalar)',
          ],
          children: [
            {
              id: 'g_alaba',
              label: "G'alaba",
              type: 'outcome',
              x: 100,
              y: 250,
              probability: 50,
              status: 'neutral',
              details: template.type,
            },
            {
              id: 'xarajat',
              label: 'Xarajat ortishi',
              type: 'outcome',
              x: 300,
              y: 250,
              probability: 25,
              status: 'risk',
              duration: '6-12 oy',
              cost: 1200000,
            },
          ],
        },
        {
          id: 'muzokara',
          label: "Muzokara o'tkazish",
          type: 'decision',
          x: 600,
          y: 150,
          probability: 70,
          risk: 'low',
          duration: '15-45 kun',
          cost: 200000,
          legalBasis: 'FK 387-moddasi',
          actionItems: [
            'Kontragentga rasmiy taklif xati yuborish',
            'Mediator yoki advokat ishtirokida uchrashuv tashkil qilish',
          ],
          children: [
            {
              id: 'kelishuv',
              label: 'Kelishuv',
              type: 'outcome',
              x: 500,
              y: 250,
              probability: 50,
              status: 'optimal',
            },
            {
              id: 'arbitraj',
              label: 'Arbitraj',
              type: 'outcome',
              x: 700,
              y: 250,
              probability: 50,
              status: 'neutral',
            },
          ],
        },
      ],
    }
    setDecisionTree(newTree)
    setCurrentTreeName(template.label)
    setShowNewCase(false)
    setShowSimulation(false)
    setAiAnalysis(null)
    setError(null)
    setStatistics(computeTreeStats(newTree))
    document.title = template.label
    trackActivity('Yangi qarorlar daraxti yaratildi', { scenario: template.label })
  }

  // ── AI'dan kelgan daraxtni TreeNode formatiga o'tkazish ───────
  const buildTreeFromAi = (ai: any): TreeNode => {
    let counter = 0
    const convert = (n: any, isRoot: boolean): TreeNode => {
      const prob = typeof n.probability === 'number' ? n.probability : undefined
      const node: TreeNode = {
        id: `ai_${counter++}`,
        label: n.label || 'Qaror',
        type: isRoot ? 'root' : n.type === 'outcome' ? 'outcome' : 'decision',
        probability: prob,
        risk: prob == null ? 'medium' : prob >= 60 ? 'low' : prob <= 40 ? 'high' : 'medium',
        duration: n.duration || undefined,
        cost: typeof n.cost === 'number' && n.cost > 0 ? n.cost : undefined,
        legalBasis: n.legalBasis || undefined,
        actionItems:
          Array.isArray(n.actionItems) && n.actionItems.length
            ? n.actionItems.slice(0, 3)
            : undefined,
        details: n.details || undefined,
      }
      if (!isRoot && n.type === 'outcome') {
        node.status =
          prob != null && prob >= 60 ? 'optimal' : prob != null && prob <= 40 ? 'risk' : 'neutral'
      }
      if (Array.isArray(n.children) && n.children.length) {
        node.children = n.children.map((c: any) => convert(c, false))
      }
      return node
    }
    return convert(ai, true)
  }

  // ── Create custom case (AI bilan yaratish + fallback) ─────────
  const createCustomCase = async (scenario: string) => {
    if (!scenario.trim() || aiGenerating) return
    const applyTree = (newTree: TreeNode, fromAi: boolean) => {
      recalcPositions(newTree)
      setDecisionTree(newTree)
      setCurrentTreeName(scenario.slice(0, 30))
      setShowNewCase(false)
      setShowSimulation(false)
      setAiAnalysis(null)
      setError(null)
      setStatistics(computeTreeStats(newTree))
      document.title = scenario.slice(0, 30)
      trackActivity(fromAi ? 'AI qarorlar daraxti yaratildi' : 'Maxsus ish yaratildi', {
        scenario,
      })
    }

    // 1) AI'dan real qonunchilikka asoslangan daraxt yaratishga urinamiz
    setAiGenerating(true)
    let aiTree: TreeNode | null = null
    try {
      const res = await fetch('/api/decision-tree/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenario.trim(), case_type: 'huquqiy', ...getUserIdentityPayload() }),
      })
      const json = await res.json().catch(() => null)
      if (json?.success && json.tree && json.tree.label) {
        aiTree = buildTreeFromAi(json.tree)
      }
    } catch {
      /* AI xatosi — fallback shablonga o'tamiz */
    }
    setAiGenerating(false)

    if (aiTree) {
      applyTree(aiTree, true)
      return
    }

    // 2) Fallback: standart shablon daraxti
    const newTree: TreeNode = {
      id: 'root',
      label: scenario.slice(0, 40),
      type: 'root',
      x: 400,
      y: 50,
      children: [
        {
          id: 'sud',
          label: 'Sudga berish',
          type: 'decision',
          x: 200,
          y: 150,
          probability: 60,
          risk: 'medium',
          duration: '3-6 oy',
          cost: 800000,
          legalBasis: 'FK 333-moddasi',
          actionItems: [
            "Da'vo arizasini tayyorlash va sudga topshirish",
            'Dalillarni toʻplash (shartnoma, hisob-fakturalar)',
          ],
          children: [
            {
              id: 'g_alaba',
              label: "G'alaba",
              type: 'outcome',
              x: 100,
              y: 250,
              probability: 50,
              status: 'neutral',
            },
            {
              id: 'xarajat',
              label: 'Xarajat ortishi',
              type: 'outcome',
              x: 300,
              y: 250,
              probability: 25,
              status: 'risk',
              duration: '6-12 oy',
              cost: 1200000,
            },
          ],
        },
        {
          id: 'muzokara',
          label: "Muzokara o'tkazish",
          type: 'decision',
          x: 600,
          y: 150,
          probability: 70,
          risk: 'low',
          duration: '15-45 kun',
          cost: 200000,
          legalBasis: 'FK 387-moddasi',
          actionItems: [
            'Kontragentga rasmiy taklif xati yuborish',
            'Mediator yoki advokat ishtirokida uchrashuv tashkil qilish',
          ],
          children: [
            {
              id: 'kelishuv',
              label: 'Kelishuv',
              type: 'outcome',
              x: 500,
              y: 250,
              probability: 50,
              status: 'optimal',
            },
            {
              id: 'arbitraj',
              label: 'Arbitraj',
              type: 'outcome',
              x: 700,
              y: 250,
              probability: 50,
              status: 'neutral',
            },
          ],
        },
      ],
    }
    applyTree(newTree, false)
  }

  // ── Add a new child node ──────────────────────────────────────
  const addChildNode = (parentId: string) => {
    const newNodeId = `node_${Date.now()}`
    setDecisionTree(prev => {
      const addNode = (node: TreeNode): TreeNode => {
        if (node.id === parentId) {
          const childCount = node.children?.length || 0
          const isRoot = node.type === 'root'
          const offsetX = childCount * 160 - (isRoot ? 80 : 100)
          const offsetY = isRoot ? 100 : 100
          const newNode: TreeNode = {
            id: newNodeId,
            label: 'Yangi variant',
            type: 'decision',
            x: (node.x || 400) + offsetX,
            y: (node.y || 50) + offsetY,
            probability: 50,
            risk: 'medium',
            duration: '1-3 oy',
            cost: 250000,
            actionItems: [
              'Variantning huquqiy asoslarini tekshirish (tegishli qonun moddalari)',
              'Xarajat va muddatni baholash, byudjetni aniqlash',
            ],
            children: [
              {
                id: `${newNodeId}_success`,
                label: 'Muvaffaqiyat',
                type: 'outcome',
                x: (node.x || 400) + offsetX - 50,
                y: (node.y || 50) + offsetY + 100,
                probability: 50,
                status: 'optimal',
              },
              {
                id: `${newNodeId}_fail`,
                label: 'Muvaffaqiyatsiz',
                type: 'outcome',
                x: (node.x || 400) + offsetX + 50,
                y: (node.y || 50) + offsetY + 100,
                probability: 50,
                status: 'risk',
              },
            ],
          }
          return { ...node, children: [...(node.children || []), newNode] }
        }
        if (node.children) {
          return { ...node, children: node.children.map(addNode) }
        }
        return node
      }
      const updated = addNode(prev)
      recalcPositions(updated)
      return { ...updated }
    })
  }

  // ── Remove a node ─────────────────────────────────────────────
  const removeNode = (nodeId: string) => {
    if (nodeId === 'root') return // Can't remove root
    setDecisionTree(prev => {
      const removeFromTree = (node: TreeNode): TreeNode | null => {
        if (node.children) {
          const filtered = node.children.filter(c => c.id !== nodeId)
          if (filtered.length !== node.children.length) {
            return { ...node, children: filtered }
          }
          return {
            ...node,
            children: node.children.map(removeFromTree).filter(Boolean) as TreeNode[],
          }
        }
        return node
      }
      const updated = removeFromTree(prev)
      if (!updated) return prev
      recalcPositions(updated)
      return { ...updated }
    })
    if (selectedNode === nodeId) setSelectedNode(null)
  }

  // ── Recalculate positions after structure change ──────────────
  const recalcPositions = (node: TreeNode, startX = 400, startY = 50, level = 0) => {
    node.x = startX
    node.y = startY
    if (node.children && node.children.length > 0) {
      const spacing = Math.max(150, 300 / (node.children.length || 1))
      const totalWidth = (node.children.length - 1) * spacing
      node.children.forEach((child, i) => {
        recalcPositions(child, startX - totalWidth / 2 + i * spacing, startY + 120, level + 1)
      })
    }
  }

  // ── Start editing a node label ────────────────────────────────
  const startEditNode = (nodeId: string, currentLabel: string) => {
    setEditingNode(nodeId)
    setEditLabel(currentLabel)
    setRecommendations([])
  }

  // ── Supabase article recommendations on edit ──────────────────
  useEffect(() => {
    // Skip if this effect was triggered by a recommendation selection
    if (recSelectionGuard.current) {
      recSelectionGuard.current = false
      return
    }
    if (!editingNode || editLabel.trim().length < 3) {
      setRecommendations([])
      return
    }
    const timer = setTimeout(async () => {
      setRecLoading(true)
      try {
        const q = editLabel.trim().replace(/'/g, '').replace(/ʻ/g, '')
        const { data } = await supabase
          .from('articles')
          .select('article_number, title, content')
          .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
          .limit(5)
        if (data) {
          setRecommendations(
            data.map((a: any) => ({
              number: a.article_number,
              title: a.title || '',
              content: a.content?.substring(0, 120) || '',
            }))
          )
        }
      } catch {
        setRecommendations([])
      } finally {
        setRecLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [editLabel, editingNode])

  const saveNodeLabel = () => {
    if (!editingNode || !editLabel.trim()) return
    setRecommendations([])
    setDecisionTree(prev => {
      const updateLabel = (node: TreeNode): TreeNode => {
        if (node.id === editingNode) {
          return { ...node, label: editLabel.trim() }
        }
        if (node.children) {
          return { ...node, children: node.children.map(updateLabel) }
        }
        return node
      }
      return updateLabel(prev)
    })
    setEditingNode(null)
  }

  // ── Run AI analysis via API ───────────────────────────────────
  const runAnalysis = async () => {
    setLoading(true)
    setAiAnalysis(null)
    setError(null)
    try {
      // Try API first
      const response = await api.analyzeDecisionPath(
        currentTreeName || decisionTree.label,
        'huquqiy',
        { tree: decisionTree }
      )
      if (response?.data) {
        setAiAnalysis(
          typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2)
        )
      }
    } catch {
      /* API fallback to local calc */
    }

    // Local probability calculation with Supabase data — dynamic labels from tree
    try {
      const collectLabels = (node: TreeNode, collected: string[] = []) => {
        collected.push(node.label)
        node.children?.forEach(c => collectLabels(c, collected))
        return collected
      }
      const allLabels = collectLabels(decisionTree)
      // Deduplicate and filter short labels
      const lbs = [
        ...new Set(allLabels.map(l => l.replace(/'/g, '').replace(/ʻ/g, '').trim())),
      ].filter(l => l.length > 3)
      const results = await Promise.allSettled(
        (lbs.length > 0 ? lbs : ['Sudga berish', 'Muzokara', 'Kelishuv']).map(lb =>
          supabase
            .from('articles')
            .select('id', { count: 'exact', head: true })
            .or(`title.ilike.%${lb}%,content.ilike.%${lb}%`)
        )
      )
      const articleCounts = results.map(r => (r.status === 'fulfilled' ? r.value.count || 0 : 0))
      const totalMatches = articleCounts.reduce((s, c) => s + c, 0)
      const confidence = totalMatches > 0 ? Math.min(95, 40 + totalMatches) : 55

      const outcomes = countOutcomes(decisionTree)
      const optPaths =
        articleCounts[0] > articleCounts[1]
          ? Math.floor(outcomes * 0.7)
          : Math.floor(outcomes * 0.5)

      setStatistics(prev => ({ ...computeTreeStats(decisionTree), confidence }))
      setAiAnalysis(
        prev =>
          prev ||
          `✅ Supabase asosida tahlil yakunlandi (${totalMatches} ta tegishli modda topildi)`
      )
    } catch {
      const fallbackConf = 55 + Math.floor(Math.random() * 30)
      setStatistics(prev => ({ ...computeTreeStats(decisionTree), confidence: fallbackConf }))
      setAiAnalysis(prev => prev || '✅ Mahalliy tahlil yakunlandi')
    } finally {
      setLoading(false)
    }
  }

  // ── PNG Export (vizual rasm) ──────────────────────────────────
  const exportAsPng = async () => {
    try {
      const svgEl = svgRef.current
      if (!svgEl) return

      // Get SVG dimensions
      const bbox = svgEl.getBBox()
      const width = bbox.width + 40
      const height = bbox.height + 40

      // Serialize SVG to XML string
      const serializer = new XMLSerializer()
      const svgClone = svgEl.cloneNode(true) as SVGElement
      svgClone.setAttribute('width', String(width))
      svgClone.setAttribute('height', String(height))
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

      // Add white background
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      bgRect.setAttribute('width', '100%')
      bgRect.setAttribute('height', '100%')
      bgRect.setAttribute('fill', '#ffffff')
      svgClone.insertBefore(bgRect, svgClone.firstChild)

      const svgData = serializer.serializeToString(svgClone)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      // Load SVG into Image and draw on Canvas
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = width * 2
        canvas.height = height * 2
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.scale(2, 2)
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)

          // Download as PNG
          const link = document.createElement('a')
          link.download = `${currentTreeName || 'qarorlar-daraxti'}.png`
          link.href = canvas.toDataURL('image/png')
          link.click()
        }
        URL.revokeObjectURL(url)
      }
      img.onerror = () => {
        // Fallback: download SVG directly
        const link = document.createElement('a')
        link.download = `${currentTreeName || 'qarorlar-daraxti'}.svg`
        link.href = url
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 100)
      }
      img.src = url

      trackActivity('Eksport qilindi', { format: 'PNG' })
    } catch {
      // Fallback: plain text export
      const lines = [
        'QARORLAR DARAXTI',
        '='.repeat(40),
        '',
        `Ish: ${currentTreeName || decisionTree.label}`,
        `Variantlar: ${countVariants(decisionTree)}`,
        `Yakunlar: ${countOutcomes(decisionTree)}`,
        `Ishonchlilik: ${statistics.confidence}%`,
        '',
        '---',
        'Qarorlar daraxti - JurisAI',
      ]
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${currentTreeName || 'qarorlar-daraxti'}.txt`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  // ── PDF Hisobot eksporti (pdf-lib) ────────────────────────────
  const exportPdfReport = async () => {
    try {
      const doc = await PDFDocument.create()
      const pageSize: [number, number] = [595.28, 841.89] // A4
      const margin = 48
      const pageWidth = pageSize[0] - margin * 2
      let page = doc.addPage(pageSize)
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const bold = await doc.embedFont(StandardFonts.HelveticaBold)
      const dark = rgb(0.13, 0.15, 0.2)
      const gray = rgb(0.45, 0.47, 0.52)
      const blue = rgb(0.2, 0.36, 0.85)
      const green = rgb(0.07, 0.55, 0.32)
      const red = rgb(0.85, 0.2, 0.2)
      let y = pageSize[1] - margin

      const ensureSpace = (needed: number) => {
        if (y - needed < margin + 30) {
          page = doc.addPage(pageSize)
          y = pageSize[1] - margin
        }
      }

      const drawWrapped = (
        text: string,
        opts: {
          size?: number
          bold?: boolean
          color?: typeof dark
          indent?: number
        } = {}
      ) => {
        const f = opts.bold ? bold : font
        const size = opts.size || 11
        const color = opts.color || dark
        const indent = opts.indent || 0
        const words = sanitizeForPdf(text).split(/\s+/).filter(Boolean)
        const lines: string[] = []
        let line = ''
        for (const w of words) {
          const test = line ? line + ' ' + w : w
          if (f.widthOfTextAtSize(test, size) > pageWidth - indent) {
            if (line) {
              lines.push(line)
              line = w
            } else {
              lines.push(test)
              line = ''
            }
          } else {
            line = test
          }
        }
        if (line) lines.push(line)
        ensureSpace(lines.length * size * 1.45)
        for (const ln of lines) {
          page.drawText(ln, { x: margin + indent, y, size, font: f, color })
          y -= size * 1.45
        }
        y -= 3
      }

      // ── Sarlavha ──
      drawWrapped('QARORLAR DARAXTI HISOBOTI', { size: 18, bold: true, color: blue })
      drawWrapped(`Ish: ${currentTreeName || decisionTree.label}`, { size: 13, bold: true })
      drawWrapped(
        `Hisobot sanasi: ${new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}  •  JurisAI`,
        { size: 9, color: gray }
      )
      y -= 8
      page.drawLine({
        start: { x: margin, y },
        end: { x: pageSize[0] - margin, y },
        thickness: 1,
        color: rgb(0.8, 0.82, 0.87),
      })
      y -= 16

      // ── Umumiy ko'rsatkichlar ──
      drawWrapped('UMUMIY KO\u02BBRSATKICHLAR', { size: 12, bold: true })
      const s = computeTreeStats(decisionTree)
      const rows: [string, string][] = [
        ['Variantlar (tugunlar) soni', String(s.variants)],
        ['Yakuniy natijalar soni', String(s.outcomes)],
        ['Ishonchlilik indeksi', `${s.confidence}%`],
        ['Ijobiy yakunlar', String(s.optimalPaths)],
        ['Xavfli yakunlar', String(s.riskPaths)],
        ['Taxminiy umumiy xarajat', formatSom(s.totalCost)],
        ['Taxminiy davomiyligi', s.durations.length ? s.durations.join(' / ') : '—'],
      ]
      for (const [k, v] of rows) {
        ensureSpace(30)
        drawWrapped(k, { size: 10.5, color: gray })
        y += 10
        drawWrapped(v, { size: 11.5, bold: true })
      }
      y -= 10

      // ── Daraxt tuzilmasi ──
      drawWrapped('QARORLAR DARAXTI TUZILMASI', { size: 12, bold: true })
      const treeLines: string[] = []
      const collect = (n: TreeNode, depth: number) => {
        const meta = [
          typeof n.probability === 'number' ? `${n.probability}%` : '',
          n.duration || '',
          n.cost ? formatSom(n.cost) : '',
        ]
          .filter(Boolean)
          .join(' | ')
        const typeName =
          n.type === 'root' ? 'boshlangich' : n.type === 'decision' ? 'qaror' : 'yakun'
        treeLines.push(
          `${'  '.repeat(depth)}• ${n.label}${meta ? '  [' + meta + ']' : ''}  (${typeName})`
        )
        n.children?.forEach(c => collect(c, depth + 1))
      }
      collect(decisionTree, 0)
      for (const tl of treeLines) {
        drawWrapped(tl, { size: 10, color: dark, indent: 8 })
      }
      y -= 8

      // ── Xavf tahlili ──
      drawWrapped('XAVF TAHLILI', { size: 12, bold: true })
      const riskyNodes: string[] = []
      const walkRisky = (n: TreeNode) => {
        if (n.type === 'outcome' && n.status === 'risk') riskyNodes.push(n.label)
        n.children?.forEach(walkRisky)
      }
      walkRisky(decisionTree)
      if (riskyNodes.length) {
        drawWrapped(`Yuqori xavf: ${riskyNodes.join(', ')}`, { size: 10.5, color: red })
      } else {
        drawWrapped('Alohida yuqori xavf aniqlanmadi', { size: 10.5, color: green })
      }

      // ── AI tahlil ──
      if (aiAnalysis) {
        y -= 8
        drawWrapped('AI TAHLIL NATIJASI', { size: 12, bold: true })
        drawWrapped(aiAnalysis, { size: 10, color: dark })
      }

      // ── Tavsiyalar ──
      y -= 8
      drawWrapped('TAVSIYALAR', { size: 12, bold: true })
      if (s.optimalPaths > s.riskPaths) {
        drawWrapped(
          "Muzokara / kelishuv yo'li eng yuqori muvaffaqiyat ehtimoliga ega — ushbu yo'lni birinchi navbatda ko'rib chiqing.",
          { size: 10.5, color: green }
        )
      } else {
        drawWrapped(
          "Sud yo'li qonuniy himoyani to'liq ta'minlaydi — da'vo arizasini tayyorlashda advokat bilan ishlang.",
          { size: 10.5, color: green }
        )
      }
      drawWrapped(
        "Har bir yo'l bo'yicha tegishli qonun moddalarini o'rganing va qarorni hujjatlashtiring.",
        { size: 10.5, color: gray }
      )

      // ── Yuridik asoslar va tavsiyalar (moddalar) ──
      const legalBases: string[] = []
      const actionItems: string[] = []
      const collectLegal = (n: TreeNode) => {
        if (n.legalBasis && !legalBases.includes(n.legalBasis)) legalBases.push(n.legalBasis)
        n.actionItems?.forEach(a => {
          if (!actionItems.includes(a)) actionItems.push(a)
        })
        n.children?.forEach(collectLegal)
      }
      collectLegal(decisionTree)
      if (legalBases.length > 0 || actionItems.length > 0 || recommendations.length > 0) {
        y -= 8
        drawWrapped('YURIDIK ASOSLAR VA TAVSIYALAR', { size: 12, bold: true })
        if (legalBases.length > 0) {
          drawWrapped('Qonun moddalari:', { size: 10.5, bold: true, color: blue })
          legalBases
            .slice(0, 8)
            .forEach(b => drawWrapped(`• ${b}`, { size: 10, color: dark, indent: 8 }))
        }
        if (recommendations.length > 0) {
          drawWrapped("Tegishli moddalar (ma'lumotlar bazasidan):", {
            size: 10.5,
            bold: true,
            color: blue,
          })
          recommendations.slice(0, 6).forEach(r =>
            drawWrapped(`• ${r.number}${r.title ? ' - ' + r.title : ''}`, {
              size: 10,
              color: dark,
              indent: 8,
            })
          )
        }
        if (actionItems.length > 0) {
          drawWrapped('Tavsiya etiladigan keyingi qadamlar:', {
            size: 10.5,
            bold: true,
            color: blue,
          })
          actionItems
            .slice(0, 10)
            .forEach(a => drawWrapped(`• ${a}`, { size: 10, color: dark, indent: 8 }))
        }
      }

      // ── Footer ──
      y -= 16
      page.drawLine({
        start: { x: margin, y },
        end: { x: pageSize[0] - margin, y },
        thickness: 0.5,
        color: rgb(0.85, 0.87, 0.9),
      })
      y -= 14
      drawWrapped(
        'JurisAI — Qarorlar daraxti hisoboti • Bu hujjat yuridik maslahat o\u2019rnini bosmaydi',
        {
          size: 8.5,
          color: gray,
        }
      )

      const pdfBytes = await doc.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const baseName = sanitizeForPdf(currentTreeName || decisionTree.label || 'qarorlar-daraxti')
        .replace(/[^a-zA-Z0-9\-_]/g, ' ')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 50)
      link.download = `${baseName || 'qarorlar-daraxti'}-hisobot.pdf`
      link.href = url
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      trackActivity('PDF hisobot yuklab olindi', { format: 'PDF' })
    } catch (err) {
      console.error('PDF export xatosi:', err)
      alert("PDF yaratishda xatolik yuz berdi. Brauzer yangilab qayta urinib ko'ring.")
    }
  }

  const countVariants = (node: TreeNode): number => {
    let count = 1
    if (node.children) {
      node.children.forEach(c => {
        count += countVariants(c)
      })
    }
    return count
  }

  const countOutcomes = (node: TreeNode): number => {
    if (node.type === 'outcome') return 1
    let count = 0
    if (node.children)
      node.children.forEach(c => {
        count += countOutcomes(c)
      })
    return count
  }

  // ── Save current tree (localStorage + Supabase) ───────────────
  const saveTree = async () => {
    const name = currentTreeName || decisionTree.label || 'Nomsiz daraxt'
    const now = new Date().toISOString()
    const existing = savedTrees.find(s => s.name === name)
    const saved: SavedTree = {
      id: existing?.id || Date.now().toString(),
      dbId: existing?.dbId,
      name,
      caseType: 'huquqiy',
      scenario: decisionTree.label,
      tree: decisionTree,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }
    const updated = [saved, ...savedTrees.filter(s => s.name !== name)].slice(0, 20)
    setSavedTrees(updated)
    localStorage.setItem('decision_trees', JSON.stringify(updated))

    // Supabase'ga sinxronlash (session mavjud bo'lsa) — boshqa qurilmada davom ettirish uchun
    try {
      const { data: udata } = await supabase.auth.getUser()
      if (!udata?.user) return
      const payload = {
        name: saved.name,
        case_type: saved.caseType,
        scenario: saved.scenario,
        tree: saved.tree,
        updated_at: now,
      }
      if (saved.dbId) {
        await supabase.from('decision_trees').update(payload).eq('id', saved.dbId)
      } else {
        const { data: inserted } = await supabase
          .from('decision_trees')
          .insert({ ...payload, user_id: udata.user.id, created_at: saved.createdAt })
          .select('id')
          .single()
        if (inserted?.id) {
          saved.dbId = inserted.id
          const updated2 = [saved, ...updated.filter(s => s.name !== name)]
          setSavedTrees(updated2)
          localStorage.setItem('decision_trees', JSON.stringify(updated2))
        }
      }
    } catch {
      /* oflayn — localStorage'da qoladi, keyingi saqlashda sinxronlanadi */
    }
  }

  // ── Load a saved tree ─────────────────────────────────────────
  const loadTree = (saved: SavedTree) => {
    setDecisionTree(saved.tree)
    setCurrentTreeName(saved.name)
    setShowNewCase(false)
    setShowSavedTrees(false)
    setShowSimulation(false)
    setAiAnalysis(null)
    setError(null)
  }

  // ── Delete a saved tree (localStorage + Supabase) ─────────────
  const deleteSavedTree = async (id: string) => {
    const target = savedTrees.find(s => s.id === id)
    const updated = savedTrees.filter(s => s.id !== id)
    setSavedTrees(updated)
    localStorage.setItem('decision_trees', JSON.stringify(updated))
    if (target?.dbId) {
      try {
        await supabase.from('decision_trees').delete().eq('id', target.dbId)
      } catch {
        /* o'chirish xatosi — localStorage'da o'chirilgan */
      }
    }
  }

  // ── Yordamchi funksiyalar: metrikalar va statistika ────────────
  const formatSom = (n?: number): string => {
    if (!n) return '—'
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm"
  }

  const findNodeInTree = (node: TreeNode, id: string): TreeNode | null => {
    if (node.id === id) return node
    for (const child of node.children || []) {
      const found = findNodeInTree(child, id)
      if (found) return found
    }
    return null
  }

  const updateTreeNode = (nodeId: string, patch: Partial<TreeNode>) => {
    setDecisionTree(prev => {
      const upd = (node: TreeNode): TreeNode => {
        if (node.id === nodeId) return { ...node, ...patch }
        if (node.children) return { ...node, children: node.children.map(upd) }
        return node
      }
      return upd(prev)
    })
  }

  const computeTreeStats = (tree: TreeNode): Statistics => {
    const variants = countVariants(tree)
    const outcomes = countOutcomes(tree)
    const probs: number[] = []
    const durations: string[] = []
    let totalCost = 0
    let optimal = 0
    let risky = 0
    const walk = (n: TreeNode) => {
      if (typeof n.probability === 'number') probs.push(n.probability)
      if (n.duration) durations.push(n.duration)
      if (n.cost) totalCost += n.cost
      if (n.type === 'outcome') {
        if (n.status === 'optimal' || (typeof n.probability === 'number' && n.probability >= 60)) {
          optimal++
        } else if (
          n.status === 'risk' ||
          (typeof n.probability === 'number' && n.probability <= 40)
        ) {
          risky++
        }
      }
      n.children?.forEach(walk)
    }
    walk(tree)
    const avgProb = probs.length ? probs.reduce((s, p) => s + p, 0) / probs.length : 55
    const outcomeRatio = outcomes > 0 ? (optimal / outcomes) * 100 : 50
    const confidence = Math.round(avgProb * 0.6 + outcomeRatio * 0.4)
    return {
      variants,
      outcomes,
      confidence: Math.min(95, Math.max(35, confidence)),
      optimalPaths: optimal,
      riskPaths: risky,
      totalCost,
      durations: [...new Set(durations)],
    }
  }

  // PDF matnini ASCII-ga moslashtirish (pdf-lib standard fontlar uchun)
  const sanitizeForPdf = (s: string): string =>
    s
      .replace(/ʻ/g, "'")
      .replace(/[’‘`]/g, "'")
      .replace(/—|–/g, '-')
      .replace(/[^\x20-\x7E]/g, ch => (ch === "'" ? "'" : '?'))

  // Tugun turi bo'yicha avtomatik keyingi qadamlar
  const autoActionItems = (node: TreeNode): string[] => {
    if (node.type === 'outcome') {
      return [
        node.status === 'optimal'
          ? 'Ushbu yoʻlni tanlash tavsiya etiladi — muvaffaqiyat ehtimoli yuqori'
          : node.status === 'risk'
            ? 'Ushbu yoʻldan qochish yoki xavfni kamaytirish choralarini koʻrish kerak'
            : 'Natijani hujjatlashtirish va keyingi qaror uchun asos qilib olish',
        'Qaror qabul qilishdan oldin advokat bilan maslahatlashish',
      ]
    }
    if (node.type === 'decision') {
      return [
        'Variantning huquqiy asoslarini tekshirish (tegishli qonun moddalari)',
        'Xarajat va muddatni baholash, byudjetni aniqlash',
        'Qarorni hujjatlashtirish va tomonlar bilan kelishish',
      ]
    }
    return ['Ish holatini toʻliq tahlil qilish', 'Yuridik maslahat olish']
  }

  // ── Node click handler ─────────────────────────────────────────
  const handleNodeClick = (nodeId: string, e?: React.MouseEvent) => {
    if (e) {
      const target = e.target as SVGElement
      if (target.tagName === 'circle') {
        setSelectedNode(nodeId)
        const node = findNodeInTree(decisionTree, nodeId)
        if (node) setDetailNode(node)
        if (history.length === 0 || history[history.length - 1] !== nodeId) {
          setHistory(prev => [...prev, nodeId])
        }
      }
    }
  }

  const handleBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1)
      setHistory(newHistory)
      setSelectedNode(newHistory[newHistory.length - 1] || null)
    }
  }

  const handleSimulation = () => {
    setShowSimulation(true)
    runAnalysis()
  }

  const handleReset = () => {
    setZoom(1)
    setSelectedNode(null)
    setShowSimulation(false)
    setHistory([])
    setAiAnalysis(null)
    setError(null)
    setStatistics(computeTreeStats(decisionTree))
  }

  const getNodeColor = (node: TreeNode) => {
    if (node.status === 'optimal') return '#10b981'
    if (node.status === 'risk') return '#ef4444'
    if (node.id === selectedNode) return '#3b82f6'
    if (node.type === 'root') return '#8b5cf6'
    if (node.type === 'decision') return '#6366f1'
    return '#6b7280'
  }

  const getNodeDescription = (nodeId: string) => {
    const descriptions: Record<string, string> = {
      root: "Boshlang'ich nuqta — ishning asosiy holati",
      sud: "Sudga berish yo'li — qonuniy himoya",
      g_alaba: "Sudda g'alaba qozonish ehtimoli",
      xarajat: 'Sud jarayoni xarajatlarining ortishi',
      muzokara: "Muzokara yo'li — tinch hal qilish",
      kelishuv: "Tomonlar o'rtasida kelishuvga erishish",
      maglubiyat: 'Muzokaralarda muvaffaqiyatsizlik',
      arbitraj: 'Uchinchi tomon ishtirokida hal qilish',
    }
    return descriptions[nodeId] || 'Tahlil nuqtasi'
  }

  const renderNode = (node: TreeNode) => {
    const color = getNodeColor(node)
    const isSelected = node.id === selectedNode
    const isEditing = editingNode === node.id
    const r = node.type === 'root' ? 25 : node.type === 'decision' ? 20 : 15

    return (
      <g key={node.id}>
        {/* Connecting line to parent */}
        {node.children?.map(child => {
          const cx1 = node.x!
          const cy1 = node.y! + r
          const cx2 = child.x!
          const cy2 = child.y! - (child.type === 'root' ? 25 : child.type === 'decision' ? 20 : 15)
          return (
            <g key={`line-${node.id}-${child.id}`}>
              <line
                x1={cx1}
                y1={cy1}
                x2={cx2}
                y2={cy2}
                stroke={showSimulation && child.status === 'optimal' ? '#10b981' : '#d1d5db'}
                strokeWidth={showSimulation && child.status === 'optimal' ? 3 : 2}
                strokeDasharray={child.status === 'risk' ? '6,3' : 'none'}
                className="transition-colors duration-300"
              />
              <polygon
                points={`${cx2},${cy2 - 6} ${cx2 - 5},${cy2 - 12} ${cx2 + 5},${cy2 - 12}`}
                fill={showSimulation && child.status === 'optimal' ? '#10b981' : '#9ca3af'}
              />
            </g>
          )
        })}

        {/* Node circle */}
        <circle
          cx={node.x}
          cy={node.y}
          r={r}
          fill={color}
          stroke={isSelected ? '#1e3a5f' : color}
          strokeWidth={isSelected ? 3 : 1}
          className="cursor-pointer transition-all duration-200 hover:opacity-80"
          onClick={e => handleNodeClick(node.id, e)}
          style={{ filter: isSelected ? 'drop-shadow(0 0 6px rgba(59,130,246,0.4))' : 'none' }}
        />

        {/* Edit / Add / Remove buttons (hover) */}
        {isSelected && (
          <g className="transition-opacity duration-200">
            <circle
              cx={node.x! + r + 8}
              cy={node.y! - r - 5}
              r={8}
              fill="#3b82f6"
              className="cursor-pointer hover:fill-blue-700"
              onClick={() => startEditNode(node.id, node.label)}
            />
            <text
              x={node.x! + r + 8}
              y={node.y! - r - 2}
              textAnchor="middle"
              fill="white"
              fontSize={9}
              className="pointer-events-none"
            >
              ✎
            </text>

            {node.type !== 'outcome' && (
              <>
                <circle
                  cx={node.x! + r + 22}
                  cy={node.y! - r - 5}
                  r={8}
                  fill="#10b981"
                  className="cursor-pointer hover:fill-green-700"
                  onClick={() => addChildNode(node.id)}
                />
                <text
                  x={node.x! + r + 22}
                  y={node.y! - r - 2}
                  textAnchor="middle"
                  fill="white"
                  fontSize={11}
                  className="pointer-events-none"
                >
                  +
                </text>
              </>
            )}

            {node.id !== 'root' && (
              <React.Fragment>
                <circle
                  cx={node.x! - r - 8}
                  cy={node.y! - r - 5}
                  r={8}
                  fill="#ef4444"
                  className="cursor-pointer hover:fill-red-700"
                  onClick={() => removeNode(node.id)}
                />
                <text
                  x={node.x! - r - 8}
                  y={node.y! - r - 2}
                  textAnchor="middle"
                  fill="white"
                  fontSize={9}
                  className="pointer-events-none"
                >
                  ✕
                </text>
              </React.Fragment>
            )}
          </g>
        )}

        {/* Label */}
        <text
          x={node.x}
          y={node.y! + (node.type === 'root' ? 40 : node.type === 'decision' ? 35 : 30)}
          textAnchor="middle"
          className="text-sm font-medium fill-gray-700 dark:fill-zinc-300 transition-colors"
        >
          {isEditing
            ? ''
            : node.label?.length > 18
              ? (node.label ?? '').slice(0, 18) + '...'
              : (node.label ?? '')}
        </text>

        {/* Editing input (foreignObject overlay) — wider when suggestions present */}
        {isEditing && (
          <foreignObject
            x={node.x! - (recommendations.length > 0 ? 100 : 60)}
            y={node.y! + r + 5}
            width={recommendations.length > 0 ? 200 : 120}
            height={
              editLabel.trim().length >= 3
                ? 28 + Math.min(Math.max(recommendations.length, 0), 3) * 52 + 10
                : 28
            }
          >
            <div>
              <input
                value={editLabel}
                onChange={e => setEditLabel(e.target.value)}
                onBlur={saveNodeLabel}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveNodeLabel()
                  if (e.key === 'Escape') {
                    setEditingNode(null)
                    setRecommendations([])
                  }
                }}
                className="w-full px-2 py-1 text-xs border border-blue-400 rounded bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200"
                autoFocus
              />
              {/* Supabase article recommendations */}
              {editLabel.trim().length >= 3 && (
                <div
                  className="mt-1 bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-700 rounded shadow-lg max-h-[160px] overflow-y-auto"
                  onMouseDown={e => e.preventDefault()} /* prevent blur on click */
                >
                  {recLoading && (
                    <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-gray-500">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      Qidirilmoqda...
                    </div>
                  )}
                  {!recLoading && recommendations.length === 0 && editLabel.trim().length >= 3 && (
                    <div className="px-2 py-1.5 text-[10px] text-gray-400 italic">
                      Hech narsa topilmadi
                    </div>
                  )}
                  {(recommendations ?? []).slice(0, 3).map((rec, i) => (
                    <div
                      key={i}
                      className="px-2 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-zinc-700 last:border-b-0"
                      onClick={() => {
                        recSelectionGuard.current = true
                        setEditLabel(`${rec.number}-modda. ${rec.title}`)
                        setRecommendations([])
                      }}
                    >
                      <div className="text-[10px] font-medium text-blue-700 dark:text-blue-300 leading-tight truncate">
                        {rec.number}-modda. {rec.title}
                      </div>
                      <div className="text-[9px] text-gray-500 dark:text-zinc-400 leading-tight mt-0.5 line-clamp-2">
                        {rec.content}
                      </div>
                    </div>
                  ))}
                  {recommendations.length > 3 && (
                    <div className="px-2 py-1 text-[9px] text-gray-400 text-center">
                      +{recommendations.length - 3} ta ko'proq
                    </div>
                  )}
                </div>
              )}
            </div>
          </foreignObject>
        )}

        {/* Metrikalar: ehtimollik %, muddat, xarajat — har doim ko'rinadi */}
        {typeof node.probability === 'number' && (
          <text
            x={node.x}
            y={node.y! - (node.type === 'root' ? 35 : node.type === 'decision' ? 30 : 25)}
            textAnchor="middle"
            className="text-xs font-bold"
            fill={
              node.probability >= 60 ? '#10b981' : node.probability <= 40 ? '#ef4444' : '#d97706'
            }
          >
            {node.probability}%
          </text>
        )}
        {node.duration && (
          <text
            x={node.x}
            y={node.y! - (node.type === 'root' ? 47 : node.type === 'decision' ? 42 : 37)}
            textAnchor="middle"
            className="text-[9px] fill-gray-500 dark:fill-zinc-400"
          >
            {node.duration}
          </text>
        )}
        {node.cost ? (
          <text
            x={node.x}
            y={node.y! - (node.type === 'root' ? 59 : node.type === 'decision' ? 54 : 49)}
            textAnchor="middle"
            className="text-[9px] fill-gray-400 dark:fill-zinc-500"
          >
            {formatSom(node.cost)}
          </text>
        ) : null}

        {/* Type icon for decisions */}
        {node.type === 'decision' && (
          <text x={node.x! + r + 5} y={node.y! - 3} textAnchor="middle" fontSize={8} fill="#9ca3af">
            ◇
          </text>
        )}

        {node.children?.map(child => renderNode(child))}
      </g>
    )
  }

  // ── Tugun batafsil ma'lumot modali ────────────────────────────
  const renderDetailModal = () => {
    if (!detailNode) return null
    const node = detailNode
    const statusLabel =
      node.status === 'optimal'
        ? 'Ijobiy'
        : node.status === 'risk'
          ? 'Xavfli'
          : node.type === 'outcome'
            ? 'Neytral'
            : node.risk === 'low'
              ? 'Past xavf'
              : node.risk === 'high'
                ? 'Yuqori xavf'
                : "O'rtacha xavf"

    const causeEffect =
      node.details ||
      (node.type === 'decision'
        ? node.risk === 'low'
          ? 'Bu yoʻl nisbatan xavfsiz — xarajat va muddat past, biroq natija kafolatlanmagan.'
          : node.risk === 'high'
            ? 'Bu yoʻl yuqori xavf bilan bogʻliq — moliyaviy va vaqt xarajatlari ortishi mumkin.'
            : "Bu yoʻl o'rtacha xavfga ega — natija dalillar va jarayonning kechishiga bog'liq."
        : node.status === 'optimal'
          ? 'Ijobiy natija — bu yoʻlni tanlash maqsadga muvofiq.'
          : node.status === 'risk'
            ? 'Salbiy natija — bu yoʻl xarajat ortishi yoki talab qondirilmasligi bilan yakunlanishi mumkin.'
            : 'Natija hozircha noaniq — qoʻshimcha tahlil talab etiladi.')

    const actions = node.actionItems?.length ? node.actionItems : autoActionItems(node)

    const saveMetrics = () => {
      if (!detailNode) return
      const patch: Partial<TreeNode> = {}
      const p = parseInt(editProb, 10)
      if (!isNaN(p)) patch.probability = Math.min(100, Math.max(0, p))
      if (editDuration.trim()) patch.duration = editDuration.trim()
      const c = parseInt(editCost.replace(/[^\d]/g, ''), 10)
      if (!isNaN(c)) patch.cost = c
      updateTreeNode(detailNode.id, patch)
      setDetailNode(null)
      setSelectedNode(null)
    }

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
        onClick={() => setDetailNode(null)}
      >
        <div
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase ${
                      node.type === 'root'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : node.type === 'decision'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {node.type === 'root'
                      ? 'Boshlangʻich'
                      : node.type === 'decision'
                        ? 'Qaror'
                        : 'Yakun'}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                      node.status === 'optimal'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : node.status === 'risk'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{node.label}</h2>
              </div>
              <button
                onClick={() => setDetailNode(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Ko'rsatkichlar — tahrirlanadigan */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 mb-2">
                Ko'rsatkichlar
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="text-[10px] text-gray-500 dark:text-zinc-400">Ehtimollik %</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editProb}
                    onChange={e => setEditProb(e.target.value)}
                    className="mt-1 w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] text-gray-500 dark:text-zinc-400">Muddat</span>
                  <input
                    type="text"
                    value={editDuration}
                    onChange={e => setEditDuration(e.target.value)}
                    placeholder="3-6 oy"
                    className="mt-1 w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] text-gray-500 dark:text-zinc-400">
                    Xarajat (so'm)
                  </span>
                  <input
                    type="text"
                    value={editCost}
                    onChange={e => setEditCost(e.target.value)}
                    placeholder="800000"
                    className="mt-1 w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200"
                  />
                </label>
              </div>
              <button
                onClick={saveMetrics}
                className="mt-2 w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                <Save className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                Ko'rsatkichlarni saqlash
              </button>
            </div>

            {/* Huquqiy asos */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 mb-2 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" /> Huquqiy asos
              </h3>
              {node.legalBasis ? (
                <p className="text-sm text-gray-700 dark:text-zinc-300">{node.legalBasis}</p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-zinc-400 italic">
                  Tegishli qonun moddasi belgilanmagan
                </p>
              )}
              {legalLoading ? (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Qonun moddalari qidirilmoqda...
                </div>
              ) : detailLegal.length > 0 ? (
                <div className="mt-2 space-y-1.5">
                  {detailLegal.map((a, i) => (
                    <div
                      key={i}
                      className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300"
                    >
                      <span className="font-semibold">
                        {getDisplayNameFromCodeId(a.code_id)} • {a.article_number}-modda
                      </span>{' '}
                      — {a.title}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Sabab va oqibat */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 mb-2">
                Sabab va oqibat
              </h3>
              <p className="text-sm text-gray-700 dark:text-zinc-300">{causeEffect}</p>
            </div>

            {/* Keyingi qadamlar */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-zinc-400 mb-2 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" /> Tavsiya etiladigan qadamlar
              </h3>
              <ul className="space-y-1.5">
                {actions.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-zinc-300"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Amallar */}
          <div className="px-5 py-4 border-t border-gray-100 dark:border-zinc-800 flex flex-wrap gap-2">
            <button
              onClick={() => {
                startEditNode(node.id, node.label)
                setDetailNode(null)
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Nomni tahrirlash
            </button>
            {node.type !== 'outcome' && (
              <button
                onClick={() => {
                  addChildNode(node.id)
                  setDetailNode(null)
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Yangi tugun
              </button>
            )}
            {node.id !== 'root' && (
              <button
                onClick={() => {
                  removeNode(node.id)
                  setDetailNode(null)
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> O'chirish
              </button>
            )}
            <button
              onClick={() => setDetailNode(null)}
              className="ml-auto px-3 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── New Case / Templates Panel ───────────────────────────────
  if (showNewCase) {
    return (
      <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 mobile-safe-top p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <a
              href="/dashboard"
              className="p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-zinc-300" />
            </a>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">
                Qarorlar Daraxti
              </h1>
              <p className="text-sm text-gray-600 dark:text-zinc-300">
                Vizual huquqiy strategiya tahlili
              </p>
            </div>
          </div>

          {/* Custom Case Input */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-4">
              Yangi ish yaratish
            </h2>
            <CustomCaseForm onSubmit={createCustomCase} generating={aiGenerating} />
          </div>

          {/* Templates */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-4">
              Tayyor shablonlar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CASE_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => createFromTemplate(tpl)}
                  className="text-left p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all hover:shadow-md border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <GitBranch className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-zinc-100 text-sm">
                        {tpl.label}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                        {tpl.scenario}
                      </p>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md text-[10px] font-medium uppercase">
                        {tpl.type}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Saved Trees */}
          {savedTrees.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm mt-6">
              <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-4">
                Saqlangan daraxtlar
              </h2>
              <div className="space-y-3">
                {savedTrees.map(saved => (
                  <div
                    key={saved.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm text-gray-800 dark:text-zinc-100">
                          {saved.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                          {new Date(saved.updatedAt).toLocaleDateString('uz-UZ', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadTree(saved)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
                      >
                        Ochish
                      </button>
                      <button
                        onClick={() => deleteSavedTree(saved.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 mobile-safe-top">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar — yagona navigatsiya (desktop) */}
        <AppSidebar>
          <div className="space-y-1">
            <button
              onClick={() => setShowNewCase(true)}
              className="flex items-center gap-2 px-3 py-2 w-full text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Daraxtlar ro'yxati</span>
            </button>

            {/* Current Case Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-sm text-blue-800 dark:text-blue-300">
                  Joriy ish
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300/80">
                {currentTreeName || decisionTree.label}
              </p>
              <div className="mt-2 flex gap-1">
                <span className="px-2 py-0.5 bg-blue-200/60 dark:bg-blue-800/40 rounded text-[10px] text-blue-700 dark:text-blue-300">
                  {countVariants(decisionTree)} nuqta
                </span>
                <span className="px-2 py-0.5 bg-blue-200/60 dark:bg-blue-800/40 rounded text-[10px] text-blue-700 dark:text-blue-300">
                  {countOutcomes(decisionTree)} yakun
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-2 mb-3">
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-zinc-400">Variantlar</span>
                  <span className="text-sm font-bold text-gray-800 dark:text-zinc-100">
                    {statistics.variants || countVariants(decisionTree)}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-zinc-400">Ishonchlilik</span>
                  <span
                    className={`text-sm font-bold ${statistics.confidence > 70 ? 'text-green-600' : statistics.confidence > 50 ? 'text-yellow-600' : 'text-gray-600'}`}
                  >
                    {statistics.confidence > 0 ? `${statistics.confidence}%` : '—'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-zinc-400">Ijobiy yakunlar</span>
                  <span className="text-sm font-bold text-blue-600">
                    {statistics.optimalPaths || '—'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={saveTree}
              className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Saqlash
            </button>
          </div>
        </AppSidebar>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white dark:bg-zinc-900 px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowNewCase(true)}
                  className="lg:hidden p-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-zinc-100">
                    {currentTreeName || decisionTree.label}
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    {countVariants(decisionTree)} ta variant • {countOutcomes(decisionTree)} ta
                    yakun
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportAsPng}
                  className="p-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="PNG rasm yuklab olish"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={exportPdfReport}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors font-medium"
                  title="PDF hisobot yuklab olish"
                >
                  <FileDown className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={handleSimulation}
                  disabled={loading}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  Tahlil qilish
                </button>
              </div>
            </div>
          </header>

          {/* Controls */}
          <div className="bg-white dark:bg-zinc-900 px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))}
                  className="p-1.5 text-gray-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors"
                  title="Yaqinlashtirish"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
                  className="p-1.5 text-gray-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors"
                  title="Uzoqlashtirish"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleBack}
                  disabled={history.length <= 1}
                  className="p-1.5 text-gray-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors disabled:opacity-30"
                  title="Orqaga"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleReset}
                  className="p-1.5 text-gray-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors"
                  title="Qayta boshlash"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500 dark:text-zinc-400 ml-2 px-2 py-1 bg-white dark:bg-zinc-700 rounded">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-gray-600 dark:text-zinc-400">Optimal</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-gray-600 dark:text-zinc-400">Xavfli</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-gray-600 dark:text-zinc-400">Neytral</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* Tree Visualization */}
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
                    <h2 className="font-semibold text-gray-800 dark:text-zinc-100 text-sm flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-blue-500" />
                      Vizual strategiya xaritasi
                    </h2>
                  </div>
                  <div
                    className="bg-gray-50 dark:bg-zinc-800/50 p-4"
                    style={{ height: '450px', overflow: 'hidden' }}
                  >
                    <svg
                      ref={svgRef}
                      width="100%"
                      height="100%"
                      viewBox="0 0 800 400"
                      className="transition-transform duration-200"
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}
                    >
                      {renderNode(decisionTree)}
                    </svg>
                  </div>

                  {/* Selected node info */}
                  {selectedNode && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm">
                            Tanlangan nuqta
                          </h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300/80 mt-1">
                            {getNodeDescription(selectedNode)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              const n = findNodeInTree(decisionTree, selectedNode)
                              if (n) setDetailNode(n)
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
                          >
                            Batafsil
                          </button>
                          <button
                            onClick={() =>
                              startEditNode(
                                selectedNode,
                                findNodeInTree(decisionTree, selectedNode)?.label || ''
                              )
                            }
                            className="p-1.5 bg-white dark:bg-zinc-700 text-gray-600 dark:text-zinc-200 rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-zinc-600 transition-colors"
                            title="Nomni tahrirlash"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Analysis Loading Skeleton */}
                  {loading && (
                    <div className="border-t border-gray-100 dark:border-zinc-800">
                      <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-4 h-4 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse" />
                          <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-28 animate-pulse" />
                        </div>
                      </div>
                      <div className="p-4">
                        <AnalysisSkeleton variant="card" count={1} />
                        <div className="mt-4">
                          <AnalysisSkeleton variant="chart" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Analysis */}
                  {!loading && aiAnalysis && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-t border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-800 dark:text-green-300 text-sm">
                          AI tahlil natijasi
                        </span>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300/80 whitespace-pre-wrap">
                        {aiAnalysis}
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {!loading && error && (
                    <div className="border-t border-red-200 dark:border-red-800">
                      <div className="p-4">
                        <AnalysisError
                          message={getErrorMessage(error)}
                          context="api"
                          onRetry={runAnalysis}
                          compact
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics Panel */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-800 dark:text-zinc-100 text-sm mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    Statistik ma'lumotlar
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-zinc-400">Variantlar</span>
                        <span className="text-lg font-bold text-gray-800 dark:text-zinc-100">
                          {statistics.variants || countVariants(decisionTree)}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-zinc-400">
                          Ishonchlilik
                        </span>
                        <span
                          className={`text-lg font-bold ${statistics.confidence > 0 ? (statistics.confidence > 70 ? 'text-green-600' : 'text-yellow-600') : 'text-gray-400'}`}
                        >
                          {statistics.confidence > 0 ? `${statistics.confidence}%` : '—'}
                        </span>
                      </div>
                      {statistics.confidence > 0 && (
                        <div className="mt-2 bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${statistics.confidence > 70 ? 'bg-green-500' : statistics.confidence > 50 ? 'bg-yellow-500' : 'bg-gray-400'}`}
                            style={{ width: `${statistics.confidence}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-zinc-400">
                          Ijobiy yakunlar
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          {statistics.optimalPaths || '—'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-zinc-400">
                          Xavfli yakunlar
                        </span>
                        <span className="text-lg font-bold text-red-600">
                          {statistics.riskPaths || '—'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5" />
                          Taxminiy umumiy xarajat
                        </span>
                        <span className="text-sm font-bold text-gray-800 dark:text-zinc-100">
                          {statistics.totalCost ? formatSom(statistics.totalCost) : '—'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Taxminiy davomiyligi
                        </span>
                        <span className="text-sm font-bold text-gray-800 dark:text-zinc-100">
                          {statistics.durations.length ? statistics.durations.join(' / ') : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Analysis */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-800 dark:text-zinc-100 text-sm mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Xavf tahlili
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-xs text-red-700 dark:text-red-300">
                        Sudga berish yo'li — yuqori xavf
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs text-green-700 dark:text-green-300">
                        Muzokara — past xavf, yuqori natija
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-xs text-amber-700 dark:text-amber-300">
                        Tavsiya: bir necha yo'lni solishtiring
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recommendations (only after analysis) */}
                {showSimulation && statistics.confidence > 0 && (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-800 dark:text-zinc-100 text-sm mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      Tavsiyalar
                    </h3>
                    <div className="space-y-2">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs font-medium text-green-800 dark:text-green-300">
                            Optimal yo'l
                          </span>
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-300/80">
                          {statistics.optimalPaths > statistics.riskPaths
                            ? "Muzokara yo'li eng yuqori muvaffaqiyat ehtimoliga ega"
                            : "Sud yo'li qonuniy himoyani to'liq ta'minlaydi"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile save button */}
                <div className="lg:hidden">
                  <button
                    onClick={saveTree}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl p-3 hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Save className="w-4 h-4" />
                    Daraxtni saqlash
                  </button>
                </div>
              </div>
            </div>
          </main>

          {/* Tugun batafsil ma'lumot modali */}
          {renderDetailModal()}
        </div>
      </div>
    </div>
  )
}

// ── Custom Case Form Component ──────────────────────────────────────
function CustomCaseForm({
  onSubmit,
  generating,
}: {
  onSubmit: (scenario: string) => void
  generating?: boolean
}) {
  const [scenario, setScenario] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!generating) onSubmit(scenario)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <input
          type="text"
          value={scenario}
          onChange={e => setScenario(e.target.value)}
          disabled={generating}
          placeholder="Ishingizni qisqacha tavsiflang (masalan: Kontragent shartnomani buzdi)"
          className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-800 dark:text-zinc-200 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm disabled:opacity-60"
        />
      </div>
      <button
        type="submit"
        disabled={!scenario.trim() || generating}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            AI yaratmoqda...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            AI bilan yaratish
          </>
        )}
      </button>
    </form>
  )
}
