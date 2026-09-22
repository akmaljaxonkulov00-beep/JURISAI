'use client'

import React, { useState } from 'react'
import {
  X,
  BookOpen,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Wallet,
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  Lightbulb,
  FileCheck,
  AlertTriangle,
  Play,
} from 'lucide-react'
import { DecisionNode, ApplicableLawRef } from '@/types/decision-tree'
import { formatCurrencySom } from '@/lib/decision-tree-engine'

interface NodeDetailPanelProps {
  node: DecisionNode | null
  onClose: () => void
  onSimulatePath: (nodeId: string) => void
  onAddChildNode?: (parentId: string) => void
  onDeleteNode?: (nodeId: string) => void
  onUpdateNode?: (nodeId: string, patch: Partial<DecisionNode>) => void
  evidenceState?: Record<string, boolean>
  onToggleEvidence?: (evidenceName: string) => void
}

export default function NodeDetailPanel({
  node,
  onClose,
  onSimulatePath,
  onAddChildNode,
  onDeleteNode,
  onUpdateNode,
  evidenceState = {},
  onToggleEvidence,
}: NodeDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editProb, setEditProb] = useState('')
  const [editCost, setEditCost] = useState('')
  const [editDuration, setEditDuration] = useState('')

  if (!node) return null

  const handleStartEdit = () => {
    setEditTitle(node.title)
    setEditDesc(node.description || '')
    setEditProb(node.probability != null ? String(node.probability) : '')
    setEditCost(node.estimated_cost != null ? String(node.estimated_cost) : '')
    setEditDuration(node.estimated_duration || '')
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (!onUpdateNode) return
    const patch: Partial<DecisionNode> = {
      title: editTitle.trim() || node.title,
      description: editDesc.trim() || undefined,
      probability: editProb ? Math.min(100, Math.max(0, parseInt(editProb, 10))) : undefined,
      estimated_cost: editCost ? parseInt(editCost.replace(/[^\d]/g, ''), 10) : undefined,
      estimated_duration: editDuration.trim() || undefined,
    }
    onUpdateNode(node.id, patch)
    setIsEditing(false)
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 overflow-hidden select-text">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-start justify-between gap-3 bg-slate-50/50 dark:bg-zinc-800/30">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 uppercase tracking-wide">
              {node.type}
            </span>

            {node.risk_level && (
              <span
                className={`flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded ${
                  node.risk_level === 'high'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    : node.risk_level === 'low'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {node.risk_level === 'high' ? (
                  <ShieldAlert className="w-3 h-3" />
                ) : (
                  <ShieldCheck className="w-3 h-3" />
                )}
                {node.risk_level === 'high'
                  ? 'Yuqori xavf'
                  : node.risk_level === 'low'
                    ? 'Past xavf'
                    : 'O‘rta xavf'}
              </span>
            )}
          </div>

          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 leading-snug">
            {node.title}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto text-xs">
        {/* Quick Metrics Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 text-center">
            <span className="text-[10px] text-slate-400 block mb-0.5">Ehtimollik</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {node.probability != null ? `${node.probability}%` : '—'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 text-center">
            <span className="text-[10px] text-slate-400 block mb-0.5">Muddat</span>
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 truncate block">
              {node.estimated_duration || '1-3 oy'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 text-center">
            <span className="text-[10px] text-slate-400 block mb-0.5">Xarajat</span>
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-200 truncate block">
              {formatCurrencySom(node.estimated_cost)}
            </span>
          </div>
        </div>

        {/* Simulate / Select Path CTA */}
        <button
          onClick={() => onSimulatePath(node.id)}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 transition-all"
        >
          <Play className="w-4 h-4 fill-white" />
          Ushbu yoʻnalishni sinab koʻrish (Simulyatsiya)
        </button>

        {/* 1. Tavsif & Harakat */}
        {node.description && (
          <div>
            <h4 className="font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] mb-1">
              Vaziyat tavsifi
            </h4>
            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed bg-slate-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800">
              {node.description}
            </p>
          </div>
        )}

        {/* 2. Huquqiy Asoslar (Real Qonun Moddalari) */}
        <div>
          <h4 className="font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Huquqiy asos & Qonun normalari
          </h4>

          {node.applicable_laws && node.applicable_laws.length > 0 ? (
            <div className="space-y-2">
              {node.applicable_laws.map((law, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-200"
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>
                      {law.code_name || law.code_id}, {law.article_number}-modda
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-200/60 dark:bg-blue-800/60 text-blue-800 dark:text-blue-200">
                      Amalda
                    </span>
                  </div>
                  {law.title && <p className="text-[11px] font-medium mt-0.5">{law.title}</p>}
                  {law.excerpt && (
                    <p className="text-[10px] text-blue-700/80 dark:text-blue-300/80 mt-1 italic line-clamp-3">
                      “{law.excerpt}”
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : node.legal_basis ? (
            <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-200 font-medium">
              {node.legal_basis}
            </div>
          ) : (
            <p className="text-slate-400 italic text-[11px]">
              Ushbu nuqtaga xos alohida modda koʻrsatilmagan
            </p>
          )}
        </div>

        {/* 3. Xavf Tahlili & Sabablari */}
        {node.risk_basis && (
          <div>
            <h4 className="font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Xavf sababi & tahlili
            </h4>
            <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
              {node.risk_basis}
            </div>
          </div>
        )}

        {/* 4. Kerakli Dalillar (Checklist) */}
        {node.evidence_required && node.evidence_required.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-indigo-600" /> Talab etiladigan dalillar
            </h4>
            <div className="space-y-1.5">
              {node.evidence_required.map((ev, idx) => {
                const isChecked = Boolean(evidenceState[ev])
                return (
                  <label
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleEvidence && onToggleEvidence(ev)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span
                      className={`text-xs ${
                        isChecked
                          ? 'line-through text-slate-400 dark:text-zinc-500'
                          : 'text-slate-700 dark:text-zinc-200 font-medium'
                      }`}
                    >
                      {ev}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* 5. Keyingi Qadamlar */}
        {node.next_steps && node.next_steps.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-emerald-600" /> Keyingi amaliy qadamlar
            </h4>
            <div className="space-y-1.5">
              {node.next_steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-200 text-[11px]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 text-[10px] text-slate-500 dark:text-zinc-400">
          ⚠️ <strong className="text-slate-700 dark:text-zinc-300">Eslatma:</strong> Xarajat, muddat
          va ishonchlilik koʻrsatkichlari AI tahliliy bahosi boʻlib, sud yoki protsess natijasini
          100% kafolatlamaydi.
        </div>
      </div>

      {/* Footer Node Actions */}
      <div className="p-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-zinc-800/30">
        <div className="flex items-center gap-1">
          {onAddChildNode && (
            <button
              onClick={() => onAddChildNode(node.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-[11px] font-medium transition-colors"
              title="Shox qo‘shish"
            >
              <Plus className="w-3.5 h-3.5" /> Shox qoʻshish
            </button>
          )}

          {onUpdateNode && (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 text-[11px] font-medium transition-colors"
              title="Tahrirlash"
            >
              <Edit3 className="w-3.5 h-3.5" /> Tahrirlash
            </button>
          )}
        </div>

        {node.id !== 'root' && onDeleteNode && (
          <button
            onClick={() => onDeleteNode(node.id)}
            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
            title="Tugunni oʻchirish"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Edit Node Modal Overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-5 border border-slate-200 dark:border-zinc-800 space-y-3">
            <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
              Tugunni tahrirlash
            </h4>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                Tugun nomi
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                Tavsif
              </label>
              <textarea
                rows={2}
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-zinc-100"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                  Ehtimollik %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editProb}
                  onChange={e => setEditProb(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                  Muddat
                </label>
                <input
                  type="text"
                  value={editDuration}
                  onChange={e => setEditDuration(e.target.value)}
                  placeholder="1-3 oy"
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                  Xarajat
                </label>
                <input
                  type="text"
                  value={editCost}
                  onChange={e => setEditCost(e.target.value)}
                  placeholder="500000"
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-zinc-300 hover:bg-slate-100 rounded-lg"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
