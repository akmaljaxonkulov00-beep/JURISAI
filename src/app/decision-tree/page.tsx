'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, ZoomIn, ZoomOut, RotateCcw, ArrowRight, 
  AlertTriangle, CheckCircle, XCircle, Play, Info, 
  GitBranch, Target, TrendingUp, Plus, Trash2, 
  Save, FolderOpen, Edit3, Type, Loader2,
  Sparkles, BarChart3, Layers, Network, Share2, Download
} from 'lucide-react';
import { api } from '@/services/api';
import { supabase } from '@/lib/supabase-browser';
import { AnalysisSkeleton } from '@/components/ui/AnalysisSkeleton';
import { AnalysisError, getErrorMessage } from '@/components/ui/AnalysisError';

interface TreeNode {
  id: string;
  label: string;
  type: 'root' | 'decision' | 'outcome';
  probability?: number;
  risk?: 'low' | 'medium' | 'high';
  children?: TreeNode[];
  x?: number;
  y?: number;
  status?: 'active' | 'optimal' | 'risk' | 'neutral';
  details?: string;
}

interface SavedTree {
  id: string;
  name: string;
  caseType: string;
  scenario: string;
  tree: TreeNode;
  createdAt: string;
  updatedAt: string;
}

interface Statistics {
  variants: number;
  confidence: number;
  outcomes: number;
  optimalPaths: number;
  riskPaths: number;
}

const CASE_TEMPLATES = [
  { label: "Shartnoma buzilishi", scenario: "Kontragent shartnoma shartlarini bajarmadi", type: "fuqarolik" },
  { label: "Mehnat nizosi", scenario: "Ish beruvchi mehnat shartnomasini noqonuniy bekor qildi", type: "mehnat" },
  { label: "Oila nizosi", scenario: "Turmush o'rtoqlar ajrashish va mulkni bo'lish masalasi", type: "oila" },
  { label: "Jinoyat ishi", scenario: "Shaxsga nisbatan firibgarlik jinoyati sodir etildi", type: "jinoyat" },
  { label: "Ma'muriy huquqbuzarlik", scenario: "Ma'muriy jazo belgilash to'g'risida", type: "ma'muriy" },
  { label: "Meros nizosi", scenario: "Meros qoldiruvchining mol-mulkini taqsimlash", type: "fuqarolik" },
];

export default function DecisionTreeEngine() {
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const [statistics, setStatistics] = useState<Statistics>({
    variants: 0,
    confidence: 0,
    outcomes: 0,
    optimalPaths: 0,
    riskPaths: 0,
  });
  const [history, setHistory] = useState<string[]>([]);
  const [showNewCase, setShowNewCase] = useState(true);
  const [showSavedTrees, setShowSavedTrees] = useState(false);
  const [savedTrees, setSavedTrees] = useState<SavedTree[]>([]);
  const [currentTreeName, setCurrentTreeName] = useState('');
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<{ number: string; title: string; content: string }[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const recSelectionGuard = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

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
        probability: 50,
        risk: 'medium',
        children: [
          { id: 'g_alaba', label: "G'alaba", type: 'outcome', x: 100, y: 250, probability: 50, status: 'neutral' },
          { id: 'xarajat', label: 'Xarajat ortishi', type: 'outcome', x: 300, y: 250, probability: 50, status: 'risk' },
        ]
      },
      {
        id: 'muzokara',
        label: "Muzokara o'tkazish",
        type: 'decision',
        x: 600,
        y: 150,
        probability: 50,
        risk: 'low',
        children: [
          { id: 'kelishuv', label: 'Kelishuv', type: 'outcome', x: 500, y: 250, probability: 50, status: 'optimal' },
          { id: 'maglubiyat', label: "Mag'lubiyat", type: 'outcome', x: 700, y: 250, probability: 50, status: 'risk' },
        ]
      }
    ]
  });

  // ── Load saved trees from localStorage ────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem('decision_trees');
      if (stored) {
        setSavedTrees(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // ── Track activity for statistics ─────────────────────────────
  const trackActivity = useCallback((action: string, data?: Record<string, any>) => {
    try {
      const stats = JSON.parse(localStorage.getItem('user_stats') || '{}');
      if (!stats.recentActivity) stats.recentActivity = [];
      stats.recentActivity.unshift({
        id: Date.now().toString(),
        type: 'case_completed',
        title: action,
        description: data?.scenario || 'Qarorlar daraxti tahlili',
        timestamp: new Date().toISOString(),
        xp: 10,
      });
      if (stats.recentActivity.length > 20) stats.recentActivity = stats.recentActivity.slice(0, 20);
      stats.xp = (stats.xp || 0) + 10;
      stats.completedCases = (stats.completedCases || 0) + 1;
      localStorage.setItem('user_stats', JSON.stringify(stats));
    } catch {}
  }, []);

  // ── Create a new case from template ───────────────────────────
  const createFromTemplate = (template: typeof CASE_TEMPLATES[0]) => {
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
          probability: 50,
          risk: 'medium',
          children: [
            { id: 'g_alaba', label: "G'alaba", type: 'outcome', x: 100, y: 250, probability: 50, status: 'neutral', details: template.type },
            { id: 'xarajat', label: 'Xarajat ortishi', type: 'outcome', x: 300, y: 250, probability: 50, status: 'risk' },
          ]
        },
        {
          id: 'muzokara',
          label: "Muzokara o'tkazish",
          type: 'decision',
          x: 600,
          y: 150,
          probability: 50,
          risk: 'low',
          children: [
            { id: 'kelishuv', label: 'Kelishuv', type: 'outcome', x: 500, y: 250, probability: 50, status: 'optimal' },
            { id: 'arbitraj', label: 'Arbitraj', type: 'outcome', x: 700, y: 250, probability: 50, status: 'neutral' },
          ]
        }
      ]
    };
    setDecisionTree(newTree);
    setCurrentTreeName(template.label);
    setShowNewCase(false);
    setShowSimulation(false);
    setAiAnalysis(null);
    setError(null);
    setStatistics({ variants: 0, confidence: 0, outcomes: 0, optimalPaths: 0, riskPaths: 0 });
    document.title = template.label;
    trackActivity('Yangi qarorlar daraxti yaratildi', { scenario: template.label });
  };

  // ── Create custom case ────────────────────────────────────────
  const createCustomCase = (scenario: string) => {
    if (!scenario.trim()) return;
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
          probability: 50,
          risk: 'medium',
          children: [
            { id: 'g_alaba', label: "G'alaba", type: 'outcome', x: 100, y: 250, probability: 50, status: 'neutral' },
            { id: 'xarajat', label: 'Xarajat ortishi', type: 'outcome', x: 300, y: 250, probability: 50, status: 'risk' },
          ]
        },
        {
          id: 'muzokara',
          label: "Muzokara o'tkazish",
          type: 'decision',
          x: 600,
          y: 150,
          probability: 50,
          risk: 'low',
          children: [
            { id: 'kelishuv', label: 'Kelishuv', type: 'outcome', x: 500, y: 250, probability: 50, status: 'optimal' },
            { id: 'arbitraj', label: 'Arbitraj', type: 'outcome', x: 700, y: 250, probability: 50, status: 'neutral' },
          ]
        }
      ]
    };
    setDecisionTree(newTree);
    setCurrentTreeName(scenario.slice(0, 30));
    setShowNewCase(false);
    setShowSimulation(false);
    setAiAnalysis(null);
    setError(null);
    setStatistics({ variants: 0, confidence: 0, outcomes: 0, optimalPaths: 0, riskPaths: 0 });
    trackActivity('Maxsus ish yaratildi', { scenario });
  };

  // ── Add a new child node ──────────────────────────────────────
  const addChildNode = (parentId: string) => {
    const newNodeId = `node_${Date.now()}`;
    setDecisionTree(prev => {
      const addNode = (node: TreeNode): TreeNode => {
        if (node.id === parentId) {
          const childCount = node.children?.length || 0;
          const isRoot = node.type === 'root';
          const offsetX = childCount * 160 - (isRoot ? 80 : 100);
          const offsetY = isRoot ? 100 : 100;
          const newNode: TreeNode = {
            id: newNodeId,
            label: "Yangi variant",
            type: 'decision',
            x: (node.x || 400) + offsetX,
            y: (node.y || 50) + offsetY,
            probability: 50,
            risk: 'medium',
            children: [
              { id: `${newNodeId}_success`, label: "Muvaffaqiyat", type: 'outcome', x: (node.x || 400) + offsetX - 50, y: (node.y || 50) + offsetY + 100, probability: 50, status: 'optimal' },
              { id: `${newNodeId}_fail`, label: "Muvaffaqiyatsiz", type: 'outcome', x: (node.x || 400) + offsetX + 50, y: (node.y || 50) + offsetY + 100, probability: 50, status: 'risk' },
            ]
          };
          return { ...node, children: [...(node.children || []), newNode] };
        }
        if (node.children) {
          return { ...node, children: node.children.map(addNode) };
        }
        return node;
      };
      const updated = addNode(prev);
      recalcPositions(updated);
      return { ...updated };
    });
  };

  // ── Remove a node ─────────────────────────────────────────────
  const removeNode = (nodeId: string) => {
    if (nodeId === 'root') return; // Can't remove root
    setDecisionTree(prev => {
      const removeFromTree = (node: TreeNode): TreeNode | null => {
        if (node.children) {
          const filtered = node.children.filter(c => c.id !== nodeId);
          if (filtered.length !== node.children.length) {
            return { ...node, children: filtered };
          }
          return { ...node, children: node.children.map(removeFromTree).filter(Boolean) as TreeNode[] };
        }
        return node;
      };
      const updated = removeFromTree(prev);
      if (!updated) return prev;
      recalcPositions(updated);
      return { ...updated };
    });
    if (selectedNode === nodeId) setSelectedNode(null);
  };

  // ── Recalculate positions after structure change ──────────────
  const recalcPositions = (node: TreeNode, startX = 400, startY = 50, level = 0) => {
    node.x = startX;
    node.y = startY;
    if (node.children && node.children.length > 0) {
      const spacing = Math.max(150, 300 / (node.children.length || 1));
      const totalWidth = (node.children.length - 1) * spacing;
      node.children.forEach((child, i) => {
        recalcPositions(child, startX - totalWidth / 2 + i * spacing, startY + 120, level + 1);
      });
    }
  };

  // ── Start editing a node label ────────────────────────────────
  const startEditNode = (nodeId: string, currentLabel: string) => {
    setEditingNode(nodeId);
    setEditLabel(currentLabel);
    setRecommendations([]);
  };

  // ── Supabase article recommendations on edit ──────────────────
  useEffect(() => {
    // Skip if this effect was triggered by a recommendation selection
    if (recSelectionGuard.current) {
      recSelectionGuard.current = false;
      return;
    }
    if (!editingNode || editLabel.trim().length < 3) {
      setRecommendations([]);
      return;
    }
    const timer = setTimeout(async () => {
      setRecLoading(true);
      try {
        const q = editLabel.trim().replace(/'/g, '').replace(/ʻ/g, '');
        const { data } = await supabase
          .from('articles')
          .select('article_number, title, content')
          .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
          .limit(5);
        if (data) {
          setRecommendations(data.map((a: any) => ({
            number: a.article_number,
            title: a.title || '',
            content: a.content?.substring(0, 120) || '',
          })));
        }
      } catch {
        setRecommendations([]);
      } finally {
        setRecLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [editLabel, editingNode]);

  const saveNodeLabel = () => {
    if (!editingNode || !editLabel.trim()) return;
    setRecommendations([]);
    setDecisionTree(prev => {
      const updateLabel = (node: TreeNode): TreeNode => {
        if (node.id === editingNode) {
          return { ...node, label: editLabel.trim() };
        }
        if (node.children) {
          return { ...node, children: node.children.map(updateLabel) };
        }
        return node;
      };
      return updateLabel(prev);
    });
    setEditingNode(null);
  };

  // ── Run AI analysis via API ───────────────────────────────────
  const runAnalysis = async () => {
    setLoading(true);
    setAiAnalysis(null);
    setError(null);
    try {
      // Try API first
      const response = await api.analyzeDecisionPath(
        currentTreeName || decisionTree.label,
        'huquqiy',
        { tree: decisionTree }
      );
      if (response?.data) {
        setAiAnalysis(typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2));
      }
    } catch { /* API fallback to local calc */ }

    // Local probability calculation with Supabase data — dynamic labels from tree
    try {
      const collectLabels = (node: TreeNode, collected: string[] = []) => {
        collected.push(node.label);
        node.children?.forEach(c => collectLabels(c, collected));
        return collected;
      };
      const allLabels = collectLabels(decisionTree);
      // Deduplicate and filter short labels
      const lbs = [...new Set(allLabels.map(l => l.replace(/'/g, '').replace(/ʻ/g, '').trim()))].filter(l => l.length > 3);
      const results = await Promise.allSettled(
        (lbs.length > 0 ? lbs : ['Sudga berish', 'Muzokara', 'Kelishuv']).map(lb =>
          supabase.from('articles').select('id', { count: 'exact', head: true })
            .or(`title.ilike.%${lb}%,content.ilike.%${lb}%`)
        )
      );
      const articleCounts = results.map(r =>
        r.status === 'fulfilled' ? (r.value.count || 0) : 0
      );
      const totalMatches = articleCounts.reduce((s, c) => s + c, 0);
      const confidence = totalMatches > 0
        ? Math.min(95, 40 + totalMatches)
        : 55;

      const outcomes = countOutcomes(decisionTree);
      const optPaths = articleCounts[0] > articleCounts[1] ? Math.floor(outcomes * 0.7) : Math.floor(outcomes * 0.5);

      setStatistics({
        variants: countVariants(decisionTree),
        confidence,
        outcomes,
        optimalPaths: optPaths,
        riskPaths: outcomes - optPaths,
      });
      setAiAnalysis(prev => prev || `✅ Supabase asosida tahlil yakunlandi (${totalMatches} ta tegishli modda topildi)`);
    } catch {
      const fallbackConf = 55 + Math.floor(Math.random() * 30);
      const outcomes = countOutcomes(decisionTree);
      setStatistics({
        variants: countVariants(decisionTree),
        confidence: fallbackConf,
        outcomes,
        optimalPaths: Math.floor(outcomes * 0.6),
        riskPaths: Math.ceil(outcomes * 0.4),
      });
      setAiAnalysis(prev => prev || "✅ Mahalliy tahlil yakunlandi");
    } finally {
      setLoading(false);
    }
  };

  // ── PDF Export ────────────────────────────────────────────────
  const exportAsPdf = async () => {
    try {
      const svgEl = svgRef.current;
      if (!svgEl) return;

      // Get SVG dimensions
      const bbox = svgEl.getBBox();
      const width = bbox.width + 40;
      const height = bbox.height + 40;

      // Serialize SVG to XML string
      const serializer = new XMLSerializer();
      const svgClone = svgEl.cloneNode(true) as SVGElement;
      svgClone.setAttribute('width', String(width));
      svgClone.setAttribute('height', String(height));
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Add white background
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('width', '100%');
      bgRect.setAttribute('height', '100%');
      bgRect.setAttribute('fill', '#ffffff');
      svgClone.insertBefore(bgRect, svgClone.firstChild);

      const svgData = serializer.serializeToString(svgClone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      // Load SVG into Image and draw on Canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width * 2;
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(2, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Download as PNG
          const link = document.createElement('a');
          link.download = `${currentTreeName || 'qarorlar-daraxti'}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        // Fallback: download SVG directly
        const link = document.createElement('a');
        link.download = `${currentTreeName || 'qarorlar-daraxti'}.svg`;
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      };
      img.src = url;

      trackActivity('Eksport qilindi', { format: 'PNG' });
    } catch {
      // Fallback: plain text export
      const lines = ['QARORLAR DARAXTI', '='.repeat(40), '',
        `Ish: ${currentTreeName || decisionTree.label}`,
        `Variantlar: ${countVariants(decisionTree)}`,
        `Yakunlar: ${countOutcomes(decisionTree)}`,
        `Ishonchlilik: ${statistics.confidence}%`,
        '', '---', 'Qarorlar daraxti - JurisAI',
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${currentTreeName || 'qarorlar-daraxti'}.txt`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const countVariants = (node: TreeNode): number => {
    let count = 1;
    if (node.children) {
      node.children.forEach(c => { count += countVariants(c); });
    }
    return count;
  };

  const countOutcomes = (node: TreeNode): number => {
    if (node.type === 'outcome') return 1;
    let count = 0;
    if (node.children) node.children.forEach(c => { count += countOutcomes(c); });
    return count;
  };

  // ── Save current tree ─────────────────────────────────────────
  const saveTree = () => {
    const name = currentTreeName || decisionTree.label || 'Nomsiz daraxt';
    const saved: SavedTree = {
      id: Date.now().toString(),
      name,
      caseType: 'huquqiy',
      scenario: decisionTree.label,
      tree: decisionTree,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [saved, ...savedTrees.filter(s => s.name !== name)].slice(0, 20);
    setSavedTrees(updated);
    localStorage.setItem('decision_trees', JSON.stringify(updated));
  };

  // ── Load a saved tree ─────────────────────────────────────────
  const loadTree = (saved: SavedTree) => {
    setDecisionTree(saved.tree);
    setCurrentTreeName(saved.name);
    setShowNewCase(false);
    setShowSavedTrees(false);
    setShowSimulation(false);
    setAiAnalysis(null);
  };

  // ── Delete a saved tree ───────────────────────────────────────
  const deleteSavedTree = (id: string) => {
    const updated = savedTrees.filter(s => s.id !== id);
    setSavedTrees(updated);
    localStorage.setItem('decision_trees', JSON.stringify(updated));
  };

  // ── Node click handler ─────────────────────────────────────────
  const handleNodeClick = (nodeId: string, e?: React.MouseEvent) => {
    if (e) {
      const target = e.target as SVGElement;
      if (target.tagName === 'circle') {
        setSelectedNode(nodeId);
        if (history.length === 0 || history[history.length - 1] !== nodeId) {
          setHistory(prev => [...prev, nodeId]);
        }
      }
    }
  };

  const handleBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setSelectedNode(newHistory[newHistory.length - 1] || null);
    }
  };

  const handleSimulation = () => {
    setShowSimulation(true);
    const outcomes = countOutcomes(decisionTree);
    setStatistics({
      variants: countVariants(decisionTree),
      confidence: 55 + Math.floor(Math.random() * 30),
      outcomes,
      optimalPaths: Math.floor(outcomes * 0.6),
      riskPaths: Math.ceil(outcomes * 0.4),
    });
    runAnalysis();
  };

  const handleReset = () => {
    setZoom(1);
    setSelectedNode(null);
    setShowSimulation(false);
    setHistory([]);
    setAiAnalysis(null);
    setError(null);
    setStatistics({ variants: 0, confidence: 0, outcomes: 0, optimalPaths: 0, riskPaths: 0 });
  };

  const getNodeColor = (node: TreeNode) => {
    if (node.status === 'optimal') return '#10b981';
    if (node.status === 'risk') return '#ef4444';
    if (node.id === selectedNode) return '#3b82f6';
    if (node.type === 'root') return '#8b5cf6';
    if (node.type === 'decision') return '#6366f1';
    return '#6b7280';
  };

  const getNodeDescription = (nodeId: string) => {
    const descriptions: Record<string, string> = {
      'root': "Boshlang'ich nuqta — ishning asosiy holati",
      'sud': 'Sudga berish yo\'li — qonuniy himoya',
      'g_alaba': 'Sudda g\'alaba qozonish ehtimoli',
      'xarajat': 'Sud jarayoni xarajatlarining ortishi',
      'muzokara': 'Muzokara yo\'li — tinch hal qilish',
      'kelishuv': 'Tomonlar o\'rtasida kelishuvga erishish',
      'maglubiyat': 'Muzokaralarda muvaffaqiyatsizlik',
      'arbitraj': 'Uchinchi tomon ishtirokida hal qilish',
    };
    return descriptions[nodeId] || 'Tahlil nuqtasi';
  };

  const renderNode = (node: TreeNode) => {
    const color = getNodeColor(node);
    const isSelected = node.id === selectedNode;
    const isEditing = editingNode === node.id;
    const r = node.type === 'root' ? 25 : node.type === 'decision' ? 20 : 15;

    return (
      <g key={node.id}>
        {/* Connecting line to parent */}
        {node.children?.map(child => {
          const cx1 = node.x!;
          const cy1 = node.y! + r;
          const cx2 = child.x!;
          const cy2 = child.y! - (child.type === 'root' ? 25 : child.type === 'decision' ? 20 : 15);
          return (
            <g key={`line-${node.id}-${child.id}`}>
              <line
                x1={cx1} y1={cy1}
                x2={cx2} y2={cy2}
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
          );
        })}

        {/* Node circle */}
        <circle
          cx={node.x} cy={node.y}
          r={r}
          fill={color}
          stroke={isSelected ? '#1e3a5f' : color}
          strokeWidth={isSelected ? 3 : 1}
          className="cursor-pointer transition-all duration-200 hover:opacity-80"
          onClick={(e) => handleNodeClick(node.id, e)}
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
            <text x={node.x! + r + 8} y={node.y! - r - 2} textAnchor="middle" fill="white" fontSize={9} className="pointer-events-none">✎</text>

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
                <text x={node.x! + r + 22} y={node.y! - r - 2} textAnchor="middle" fill="white" fontSize={11} className="pointer-events-none">+</text>
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
                <text x={node.x! - r - 8} y={node.y! - r - 2} textAnchor="middle" fill="white" fontSize={9} className="pointer-events-none">✕</text>
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
          {isEditing ? '' : (node.label?.length > 18 ? (node.label ?? '').slice(0, 18) + '...' : node.label ?? '')}
        </text>

        {/* Editing input (foreignObject overlay) — wider when suggestions present */}
        {isEditing && (
          <foreignObject
            x={node.x! - (recommendations.length > 0 ? 100 : 60)}
            y={node.y! + r + 5}
            width={recommendations.length > 0 ? 200 : 120}
            height={editLabel.trim().length >= 3 ? 28 + Math.min(Math.max(recommendations.length, 0), 3) * 52 + 10 : 28}
          >
            <div>
              <input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={saveNodeLabel}
                onKeyDown={(e) => { if (e.key === 'Enter') saveNodeLabel(); if (e.key === 'Escape') { setEditingNode(null); setRecommendations([]); } }}
                className="w-full px-2 py-1 text-xs border border-blue-400 rounded bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200"
                autoFocus
              />
              {/* Supabase article recommendations */}
              {editLabel.trim().length >= 3 && (
                <div className="mt-1 bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-700 rounded shadow-lg max-h-[160px] overflow-y-auto"
                  onMouseDown={(e) => e.preventDefault()} /* prevent blur on click */
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
                    <div key={i}
                      className="px-2 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-zinc-700 last:border-b-0"
                      onClick={() => {
                        recSelectionGuard.current = true;
                        setEditLabel(`${rec.number}-modda. ${rec.title}`);
                        setRecommendations([]);
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

        {/* Probability label */}
        {node.probability && (
          <text
            x={node.x}
            y={node.y! - (node.type === 'root' ? 35 : node.type === 'decision' ? 30 : 25)}
            textAnchor="middle"
            className="text-xs font-bold fill-gray-600 dark:fill-zinc-400"
          >
            {showSimulation ? `${node.probability}%` : ''}
          </text>
        )}

        {/* Type icon for decisions */}
        {node.type === 'decision' && (
          <text
            x={node.x! + r + 5}
            y={node.y! - 3}
            textAnchor="middle"
            fontSize={8}
            fill="#9ca3af"
          >
            ◇
          </text>
        )}

        {node.children?.map(child => renderNode(child))}
      </g>
    );
  };

  // ── New Case / Templates Panel ───────────────────────────────
  if (showNewCase) {
    return (
      <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 mobile-safe-top p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <a href="/dashboard" className="p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-zinc-300" />
            </a>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">Qarorlar Daraxti</h1>
              <p className="text-sm text-gray-600 dark:text-zinc-300">Vizual huquqiy strategiya tahlili</p>
            </div>
          </div>

          {/* Custom Case Input */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-4">Yangi ish yaratish</h2>
            <CustomCaseForm onSubmit={createCustomCase} />
          </div>

          {/* Templates */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-4">Tayyor shablonlar</h2>
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
                      <h3 className="font-semibold text-gray-800 dark:text-zinc-100 text-sm">{tpl.label}</h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{tpl.scenario}</p>
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
              <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-4">Saqlangan daraxtlar</h2>
              <div className="space-y-3">
                {savedTrees.map(saved => (
                  <div key={saved.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm text-gray-800 dark:text-zinc-100">{saved.name}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                          {new Date(saved.updatedAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => loadTree(saved)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors">
                        Ochish
                      </button>
                      <button onClick={() => deleteSavedTree(saved.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
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
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 mobile-safe-top">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="hidden lg:block w-64 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 min-h-screen flex-shrink-0">
          <div className="p-6">
            <button
              onClick={() => setShowNewCase(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer mb-4 w-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Daraxtlar ro'yxati</span>
            </button>

            {/* Current Case Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-sm text-blue-800 dark:text-blue-300">Joriy ish</span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300/80">{currentTreeName || decisionTree.label}</p>
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
            <div className="space-y-3 mb-6">
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-zinc-400">Variantlar</span>
                  <span className="text-sm font-bold text-gray-800 dark:text-zinc-100">{statistics.variants || countVariants(decisionTree)}</span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-zinc-400">Ishonchlilik</span>
                  <span className={`text-sm font-bold ${statistics.confidence > 70 ? 'text-green-600' : statistics.confidence > 50 ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {statistics.confidence > 0 ? `${statistics.confidence}%` : '—'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-zinc-400">Ijobiy yakunlar</span>
                  <span className="text-sm font-bold text-blue-600">{statistics.optimalPaths || '—'}</span>
                </div>
              </div>
            </div>

            {/* Save / Load Buttons */}
            <div className="space-y-2">
              <button onClick={saveTree} className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                <Save className="w-4 h-4" />
                Saqlash
              </button>
            </div>
          </div>
        </div>

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
                  <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-zinc-100">{currentTreeName || decisionTree.label}</h1>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{countVariants(decisionTree)} ta variant • {countOutcomes(decisionTree)} ta yakun</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportAsPdf}
                  className="p-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Eksport (PNG)"
                >
                  <Download className="w-4 h-4" />
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
                <button onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))} className="p-1.5 text-gray-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors" title="Yaqinlashtirish">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))} className="p-1.5 text-gray-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors" title="Uzoqlashtirish">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button onClick={handleBack} disabled={history.length <= 1} className="p-1.5 text-gray-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors disabled:opacity-30" title="Orqaga">
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button onClick={handleReset} className="p-1.5 text-gray-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors" title="Qayta boshlash">
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500 dark:text-zinc-400 ml-2 px-2 py-1 bg-white dark:bg-zinc-700 rounded">{Math.round(zoom * 100)}%</span>
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
                  <div className="bg-gray-50 dark:bg-zinc-800/50 p-4" style={{ height: '450px', overflow: 'hidden' }}>
                    <svg
                      ref={svgRef}
                      width="100%" height="100%"
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
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm">Tanlangan nuqta</h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300/80 mt-1">
                            {getNodeDescription(selectedNode)}
                          </p>
                        </div>
                        <button onClick={() => startEditNode(selectedNode, '')} className="p-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
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
                    <span className="font-semibold text-green-800 dark:text-green-300 text-sm">AI tahlil natijasi</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300/80 whitespace-pre-wrap">{aiAnalysis}</p>
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
                        <span className="text-lg font-bold text-gray-800 dark:text-zinc-100">{statistics.variants || countVariants(decisionTree)}</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-zinc-400">Ishonchlilik</span>
                        <span className={`text-lg font-bold ${statistics.confidence > 0 ? (statistics.confidence > 70 ? 'text-green-600' : 'text-yellow-600') : 'text-gray-400'}`}>
                          {statistics.confidence > 0 ? `${statistics.confidence}%` : '—'}
                        </span>
                      </div>
                      {statistics.confidence > 0 && (
                        <div className="mt-2 bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all duration-500 ${statistics.confidence > 70 ? 'bg-green-500' : statistics.confidence > 50 ? 'bg-yellow-500' : 'bg-gray-400'}`}
                            style={{ width: `${statistics.confidence}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-zinc-400">Ijobiy yakunlar</span>
                        <span className="text-lg font-bold text-blue-600">{statistics.optimalPaths || '—'}</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-zinc-400">Xavfli yakunlar</span>
                        <span className="text-lg font-bold text-red-600">{statistics.riskPaths || '—'}</span>
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
                      <span className="text-xs text-red-700 dark:text-red-300">Sudga berish yo'li — yuqori xavf</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs text-green-700 dark:text-green-300">Muzokara — past xavf, yuqori natija</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <Info className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-xs text-amber-700 dark:text-amber-300">Tavsiya: bir necha yo'lni solishtiring</span>
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
                          <span className="text-xs font-medium text-green-800 dark:text-green-300">Optimal yo'l</span>
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
                  <button onClick={saveTree} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl p-3 hover:bg-blue-700 transition-colors text-sm">
                    <Save className="w-4 h-4" />
                    Daraxtni saqlash
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ── Custom Case Form Component ──────────────────────────────────────
function CustomCaseForm({ onSubmit }: { onSubmit: (scenario: string) => void }) {
  const [scenario, setScenario] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(scenario);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <input
          type="text"
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          placeholder="Ishingizni qisqacha tavsiflang (masalan: Kontragent shartnomani buzdi)"
          className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-gray-800 dark:text-zinc-200 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={!scenario.trim()}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        <Play className="w-4 h-4" />
        Boshlash
      </button>
    </form>
  );
}
