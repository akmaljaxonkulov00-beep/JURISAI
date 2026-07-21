'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ZoomIn, ZoomOut, RotateCcw, ArrowRight, AlertTriangle, CheckCircle, XCircle, Play, Info, GitBranch, Target, TrendingUp } from 'lucide-react';

interface TreeNode {
  id: string;
  label: string;
  type: 'root' | 'decision' | 'outcome';
  probability?: number;
  risk?: 'low' | 'medium' | 'high';
  children?: TreeNode[];
  x?: number;
  y?: number;
  status?: 'active' | 'optimal' | 'risk';
}

interface Statistics {
  variants: number;
  confidence: number;
  outcomes: number;
}

export default function DecisionTreeEngine() {
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);
  const [statistics, setStatistics] = useState<Statistics>({
    variants: 7,
    confidence: 72,
    outcomes: 3
  });
  const [history, setHistory] = useState<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const decisionTree: TreeNode = {
    id: 'root',
    label: 'Shartnoma buzilishi',
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
        probability: 65,
        risk: 'medium',
        children: [
          {
            id: 'g_alaba',
            label: 'G\'alaba',
            type: 'outcome',
            x: 100,
            y: 250,
            probability: 72,
            status: 'optimal'
          },
          {
            id: 'xarajat',
            label: 'Xarajat ortishi',
            type: 'outcome',
            x: 300,
            y: 250,
            probability: 28,
            status: 'risk'
          }
        ]
      },
      {
        id: 'muzokara',
        label: 'Muzokara o\'tkazish',
        type: 'decision',
        x: 600,
        y: 150,
        probability: 85,
        risk: 'low',
        children: [
          {
            id: 'kelishuv',
            label: 'Kelishuv',
            type: 'outcome',
            x: 500,
            y: 250,
            probability: 90,
            status: 'optimal'
          },
          {
            id: 'maglubiyat',
            label: 'Mag\'lubiyat',
            type: 'outcome',
            x: 700,
            y: 250,
            probability: 10,
            status: 'risk'
          }
        ]
      }
    ]
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setSelectedNode(null);
    setShowSimulation(false);
    setHistory([]);
  };

  const handleSimulation = () => {
    setShowSimulation(true);
    
    // Simulate probability calculations
    const newStats = {
      variants: 7,
      confidence: 72 + Math.floor(Math.random() * 10),
      outcomes: 3
    };
    setStatistics(newStats);
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    if (history.length === 0 || history[history.length - 1] !== nodeId) {
      setHistory([...history, nodeId]);
    }
  };

  const handleBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setSelectedNode(newHistory[newHistory.length - 1] || null);
    }
  };

  const getNodeColor = (node: TreeNode) => {
    if (node.status === 'optimal') return '#10b981'; // green
    if (node.status === 'risk') return '#ef4444'; // red
    if (node.id === selectedNode) return '#3b82f6'; // blue
    return '#6b7280'; // gray
  };

  const renderNode = (node: TreeNode) => {
    const color = getNodeColor(node);
    const isSelected = node.id === selectedNode;
    
    return (
      <g key={node.id}>
        {/* Node circle */}
        <circle
          cx={node.x}
          cy={node.y}
          r={node.type === 'root' ? 25 : node.type === 'decision' ? 20 : 15}
          fill={color}
          stroke={isSelected ? '#1f2937' : 'none'}
          strokeWidth={isSelected ? 3 : 0}
          className="cursor-pointer transition-all"
          onClick={() => handleNodeClick(node.id)}
        />
        
        {/* Node label */}
        <text
          x={node.x}
          y={node.y! + (node.type === 'root' ? 40 : node.type === 'decision' ? 35 : 30)}
          textAnchor="middle"
          className="text-sm font-medium fill-gray-700 dark:fill-zinc-300"
        >
          {node.label}
        </text>
        
        {/* Probability label */}
        {node.probability && (
          <text
            x={node.x}
            y={node.y! - (node.type === 'root' ? 35 : node.type === 'decision' ? 30 : 25)}
            textAnchor="middle"
            className="text-xs font-bold fill-gray-600 dark:fill-zinc-400"
          >
            {node.probability}%
          </text>
        )}
        
        {/* Render children */}
        {node.children?.map(child => (
          <g key={`connection-${node.id}-${child.id}`}>
            {/* Connection line */}
            <line
              x1={node.x}
              y1={node.y! + (node.type === 'root' ? 25 : node.type === 'decision' ? 20 : 15)}
              x2={child.x!}
              y2={child.y! - (child.type === 'root' ? 25 : child.type === 'decision' ? 20 : 15)}
              stroke={showSimulation && child.status === 'optimal' ? '#10b981' : '#d1d5db'}
              strokeWidth={showSimulation && child.status === 'optimal' ? 3 : 2}
            />
            
            {/* Arrow */}
            <polygon
              points={`${child.x!},${child.y! - (child.type === 'root' ? 25 : child.type === 'decision' ? 20 : 15) - 5} ${child.x! - 5},${child.y! - (child.type === 'root' ? 25 : child.type === 'decision' ? 20 : 15) - 10} ${child.x! + 5},${child.y! - (child.type === 'root' ? 25 : child.type === 'decision' ? 20 : 15) - 10}`}
              fill={showSimulation && child.status === 'optimal' ? '#10b981' : '#d1d5db'}
            />
          </g>
        ))}
        
        {node.children?.map(child => renderNode(child))}
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 min-h-screen">
          <div className="p-6">
            {/* Daily Goal Block */}
            <div className="bg-orange-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-gray-800 dark:text-zinc-100">Kundalik maqsad</span>
                </div>
              </div>
              <div className="mb-2">
                <div className="bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-zinc-300">2 ta case qolgan</p>
            </div>

            {/* Menu Items */}
            <nav className="space-y-2">
              <a href="/" className="flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 rounded-lg cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
                <span>Orqaga</span>
              </a>
              <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg">
                <GitBranch className="w-5 h-5" />
                <span className="font-medium">Decision Tree</span>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white dark:bg-zinc-900 px-8 py-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-100">Decision Tree Engine</h1>
                <p className="text-sm text-gray-600 dark:text-zinc-300">Qarorlar daraxti - Vizual strategiya xaritasi</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSimulation}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Simulyatsiya
                </button>
              </div>
            </div>
          </header>

          {/* Control Tools */}
          <div className="bg-white dark:bg-zinc-900 px-8 py-3 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 rounded-lg"
                  title="Yaqinlashtirish"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 rounded-lg"
                  title="Uzoqlashtirish"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleBack}
                  disabled={history.length <= 1}
                  className="p-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Orqaga qaytish"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleReset}
                  className="p-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 dark:bg-zinc-800/50 rounded-lg"
                  title="Qayta boshlash"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-500 dark:text-zinc-400 ml-2">Zoom: {Math.round(zoom * 100)}%</span>
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-zinc-300">Joriy nuqta</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-zinc-300">Optimal yo'l</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-zinc-300">Xavfli yo'l</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="p-8">
            <div className="grid grid-cols-4 gap-6">
              {/* Decision Tree Visualization */}
              <div className="col-span-3">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-zinc-100 mb-2">Vizual Strategiya Xaritasi</h2>
                    <p className="text-sm text-gray-600 dark:text-zinc-300">Huquqiy vaziyatning rivojlanish yo'llari va ehtimollari</p>
                  </div>
                  
                  {/* SVG Canvas */}
                  <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 overflow-hidden" style={{ height: '400px' }}>
                    <svg
                      ref={svgRef}
                      width="100%"
                      height="100%"
                      viewBox="0 0 800 400"
                      className="transition-transform"
                      style={{ transform: `scale(${zoom})` }}
                    >
                      {renderNode(decisionTree)}
                    </svg>
                  </div>

                  {/* Selected Node Info */}
                  {selectedNode && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                      <h3 className="font-semibold text-blue-800 mb-2">Tanlangan nuqta ma'lumotlari</h3>
                      <p className="text-sm text-blue-700">
                        {selectedNode === 'root' && 'Boshlang\'ich nuqta - Shartnoma buzilishi holati'}
                        {selectedNode === 'sud' && 'Sudga berish yo\'li - 65% muvaffaqiyat ehtimoli'}
                        {selectedNode === 'muzokara' && 'Muzokara yo\'li - 85% muvaffaqiyat ehtimoli, past xavf'}
                        {selectedNode === 'g_alaba' && 'Sudda g\'alaba - 72% ehtimol, optimal natija'}
                        {selectedNode === 'xarajat' && 'Xarajat ortishi - 28% ehtimol, xavfli natija'}
                        {selectedNode === 'kelishuv' && 'Kelishuv - 90% ehtimol, optimal natija'}
                        {selectedNode === 'maglubiyat' && 'Mag\'lubiyat - 10% ehtimol, xavfli natija'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics Panel */}
              <div className="col-span-1">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-zinc-100 mb-4">Statistik Ma'lumotlar</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-zinc-300">Variantlar</span>
                        <span className="text-xl font-bold text-gray-800 dark:text-zinc-100">{statistics.variants}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Rivojlanish ssenariylari</p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-zinc-300">Ishonchlilik</span>
                        <span className="text-xl font-bold text-green-600">{statistics.confidence}%</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Qonuniy asoslar kuchi</p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-zinc-300">Ijobiy yakunlar</span>
                        <span className="text-xl font-bold text-blue-600">{statistics.outcomes}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">G'alaba bilan tugaydigan yo'llar</p>
                    </div>
                  </div>
                </div>

                {/* Risk Analysis */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-zinc-100 mb-4">Xavf Tahlili</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-zinc-100">Yuqori xavf</p>
                        <p className="text-xs text-gray-600 dark:text-zinc-300">Sudga berish yo'li</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-zinc-100">Past xavf</p>
                        <p className="text-xs text-gray-600 dark:text-zinc-300">Muzokara yo'li</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {showSimulation && (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-800 dark:text-zinc-100 mb-4">Tavsiyalar</h3>
                    <div className="space-y-3">
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Optimal yo'l</span>
                        </div>
                        <p className="text-xs text-green-700">
                          Muzokara o'tkazish - eng yuqori muvaffaqiyat ehtimoli (85%) va eng past xavf
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">Eslatma</span>
                        </div>
                        <p className="text-xs text-yellow-700">
                          Sud yo'li qimmatroq bo'lishi mumkin, lekin qonuniy huquqlar to'liq himoyalangan
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
