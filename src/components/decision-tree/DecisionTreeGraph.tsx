'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wallet,
  BookOpen,
} from 'lucide-react'
import { DecisionNode, NodeType, RiskLevel, NodeStatus } from '@/types/decision-tree'
import { NODE_WIDTH, NODE_HEIGHT, layoutTree, formatCurrencySom } from '@/lib/decision-tree-engine'

interface DecisionTreeGraphProps {
  tree: DecisionNode
  selectedNodeId: string | null
  activePathIds: string[]
  onSelectNode: (node: DecisionNode) => void
  onToggleCollapse: (nodeId: string) => void
  onAddChildNode?: (parentId: string) => void
}

export default function DecisionTreeGraph({
  tree,
  selectedNodeId,
  activePathIds,
  onSelectNode,
  onToggleCollapse,
}: DecisionTreeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMinimap, setShowMinimap] = useState(true)

  // Layouted tree calculation
  const layoutedTree = React.useMemo(() => {
    return layoutTree(tree)
  }, [tree])

  // Center & Fit tree on first render
  const fitToScreen = useCallback(() => {
    if (!containerRef.current || !layoutedTree) return
    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight

    // Compute bounding box
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    function getBounds(n: DecisionNode) {
      const nx = n.x ?? 0
      const ny = n.y ?? 0
      minX = Math.min(minX, nx)
      maxX = Math.max(maxX, nx + NODE_WIDTH)
      minY = Math.min(minY, ny)
      maxY = Math.max(maxY, ny + NODE_HEIGHT)
      if (!n.collapsed && n.children) {
        n.children.forEach(getBounds)
      }
    }
    getBounds(layoutedTree)

    const treeWidth = maxX - minX + 100
    const treeHeight = maxY - minY + 100

    const scaleX = (containerWidth - 60) / Math.max(treeWidth, 300)
    const scaleY = (containerHeight - 60) / Math.max(treeHeight, 300)
    const newZoom = Math.min(1.2, Math.max(0.35, Math.min(scaleX, scaleY)))

    const centerX = (containerWidth - treeWidth * newZoom) / 2 - minX * newZoom + 40
    const centerY = Math.max(30, (containerHeight - treeHeight * newZoom) / 3)

    setZoom(newZoom)
    setPan({ x: centerX, y: centerY })
  }, [layoutedTree])

  useEffect(() => {
    fitToScreen()
  }, [fitToScreen])

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.decision-node-card')) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
    setZoom(prev => Math.min(2.5, Math.max(0.3, prev * zoomFactor)))
  }

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Generate Bezier Curves for edges
  const renderEdges = (node: DecisionNode): React.ReactNode[] => {
    if (node.collapsed || !node.children || node.children.length === 0) return []

    const elements: React.ReactNode[] = []
    const startX = (node.x ?? 0) + NODE_WIDTH / 2
    const startY = (node.y ?? 0) + NODE_HEIGHT

    node.children.forEach(child => {
      const endX = (child.x ?? 0) + NODE_WIDTH / 2
      const endY = child.y ?? 0

      const isPathActive = activePathIds.includes(node.id) && activePathIds.includes(child.id)

      // Cubic Bezier curve
      const controlY1 = startY + (endY - startY) / 2
      const controlY2 = endY - (endY - startY) / 2
      const pathD = `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`

      elements.push(
        <g key={`edge-${node.id}-${child.id}`}>
          {/* Active Glow Background */}
          {isPathActive && (
            <path
              d={pathD}
              fill="none"
              stroke="#10b981"
              strokeWidth={8}
              strokeOpacity={0.35}
              strokeLinecap="round"
            />
          )}

          {/* Main Connector Line */}
          <path
            d={pathD}
            fill="none"
            stroke={isPathActive ? '#10b981' : '#cbd5e1'}
            strokeWidth={isPathActive ? 3 : 2}
            strokeDasharray={child.risk_level === 'high' ? '6 4' : 'none'}
            className="transition-colors duration-300"
          />

          {/* Directional Arrow marker */}
          <polygon
            points={`${endX},${endY} ${endX - 5},${endY - 7} ${endX + 5},${endY - 7}`}
            fill={isPathActive ? '#10b981' : '#94a3b8'}
          />
        </g>
      )

      elements.push(...renderEdges(child))
    })

    return elements
  }

  // Render Node UI
  const renderNodes = (node: DecisionNode): React.ReactNode[] => {
    const isSelected = node.id === selectedNodeId
    const isPathActive = activePathIds.includes(node.id)
    const hasChildren = Boolean(node.children && node.children.length > 0)

    const elements: React.ReactNode[] = []

    elements.push(
      <foreignObject
        key={`node-${node.id}`}
        x={node.x}
        y={node.y}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        className="overflow-visible"
      >
        <div
          onClick={e => {
            e.stopPropagation()
            onSelectNode(node)
          }}
          className={`decision-node-card group relative h-full w-full rounded-xl p-3 select-none cursor-pointer transition-all duration-200 ${
            isSelected
              ? 'ring-2 ring-blue-600 shadow-lg shadow-blue-500/20 bg-white dark:bg-zinc-900 border-blue-500'
              : isPathActive
                ? 'ring-2 ring-emerald-500 bg-white dark:bg-zinc-900 border-emerald-400 shadow-md shadow-emerald-500/10'
                : 'bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-zinc-700 shadow-sm border border-slate-200 dark:border-zinc-800'
          }`}
        >
          {/* Top Tag Bar */}
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase ${getNodeTypeBadge(
                node.type
              )}`}
            >
              {getNodeTypeLabel(node.type)}
            </span>

            <div className="flex items-center gap-1">
              {node.risk_level && (
                <span
                  className={`flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded ${getRiskBadge(
                    node.risk_level
                  )}`}
                >
                  {node.risk_level === 'high' ? (
                    <ShieldAlert className="w-2.5 h-2.5" />
                  ) : (
                    <ShieldCheck className="w-2.5 h-2.5" />
                  )}
                  {node.risk_level === 'low'
                    ? 'Past'
                    : node.risk_level === 'high'
                      ? 'Yuqori'
                      : 'O‘rta'}
                </span>
              )}

              {typeof node.probability === 'number' && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    node.probability >= 65
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : node.probability <= 40
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                  }`}
                >
                  {node.probability}%
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h4
            className="text-xs font-semibold text-slate-800 dark:text-zinc-100 line-clamp-2 leading-tight"
            title={node.title}
          >
            {node.title}
          </h4>

          {/* Bottom Metas (Legal / Cost / Duration) */}
          <div className="mt-2 flex items-center justify-between text-[9px] text-slate-500 dark:text-zinc-400">
            {node.legal_basis ? (
              <span
                className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-medium truncate max-w-[120px]"
                title={node.legal_basis}
              >
                <BookOpen className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{node.legal_basis}</span>
              </span>
            ) : (
              <span className="text-[8px] text-slate-400">Tahlil nuqtasi</span>
            )}

            <div className="flex items-center gap-1.5 flex-shrink-0 font-medium">
              {node.estimated_duration && (
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {node.estimated_duration}
                </span>
              )}
              {node.estimated_cost ? (
                <span className="flex items-center gap-0.5 text-slate-700 dark:text-zinc-300">
                  <Wallet className="w-2.5 h-2.5" />
                  {formatCurrencySom(node.estimated_cost)}
                </span>
              ) : null}
            </div>
          </div>

          {/* Expand / Collapse Button if has children */}
          {hasChildren && (
            <button
              onClick={e => {
                e.stopPropagation()
                onToggleCollapse(node.id)
              }}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-blue-600 hover:text-white transition-colors shadow-sm z-10"
              title={node.collapsed ? 'Shoxlarni ochish' : 'Shoxlarni yig‘ish'}
            >
              {node.collapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </foreignObject>
    )

    if (!node.collapsed && node.children) {
      node.children.forEach(c => {
        elements.push(...renderNodes(c))
      })
    }

    return elements
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] bg-slate-50/70 dark:bg-zinc-950 rounded-2xl overflow-hidden select-none border border-slate-200/80 dark:border-zinc-800/80"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Interactive Tool Control Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 p-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
        <button
          onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
          className="p-1.5 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          title="Yaqinlashtirish"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.3, z - 0.15))}
          className="p-1.5 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          title="Uzoqlashtirish"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={fitToScreen}
          className="p-1.5 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          title="Ekranga moslashtirish"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 my-auto" />
        <button
          onClick={toggleFullscreen}
          className="p-1.5 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          title="To‘liq ekran"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 px-2">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Legend & Simulation Status Bar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3 px-3 py-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-600 dark:text-zinc-300">Optimal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-slate-600 dark:text-zinc-300">O‘rta xavf</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-slate-600 dark:text-zinc-300">Yuqori xavf</span>
        </div>
      </div>

      {/* Main SVG Graph */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <defs>
          <pattern id="graph-grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.8" fill="#94a3b8" fillOpacity="0.25" />
          </pattern>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#graph-grid-pattern)" />

        {/* Graph Transform Layer */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {renderEdges(layoutedTree)}
          {renderNodes(layoutedTree)}
        </g>
      </svg>
    </div>
  )
}

function getNodeTypeBadge(type: NodeType): string {
  switch (type) {
    case 'ROOT':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
    case 'DECISION':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
    case 'QUESTION':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
    case 'ACTION':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
    case 'SUCCESS':
    case 'OUTCOME':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
    case 'FAILURE':
    case 'WARNING':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
  }
}

function getNodeTypeLabel(type: NodeType): string {
  switch (type) {
    case 'ROOT':
      return 'Ish Boshi'
    case 'DECISION':
      return 'Qaror'
    case 'QUESTION':
      return 'Savol'
    case 'ACTION':
      return 'Harakat'
    case 'SUCCESS':
      return 'G‘alaba'
    case 'OUTCOME':
      return 'Natija'
    case 'FAILURE':
      return 'Rad / Xavf'
    case 'WARNING':
      return 'Ogohlantirish'
    default:
      return 'Bosqich'
  }
}

function getRiskBadge(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
    case 'high':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
    case 'medium':
    default:
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
  }
}
