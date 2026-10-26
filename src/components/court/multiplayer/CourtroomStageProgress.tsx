'use client'

import React from 'react'
import { TRIAL_STAGES } from '@/lib/court/stage-machine'
import { Check, ChevronRight } from 'lucide-react'

interface CourtroomStageProgressProps {
  currentStageId: string
  currentStageOrder: number
  isJudge: boolean
  onAdvanceStage?: (stageId?: string) => void
}

export default function CourtroomStageProgress({
  currentStageId,
  currentStageOrder,
  isJudge,
  onAdvanceStage,
}: CourtroomStageProgressProps) {
  const currentStage = TRIAL_STAGES.find(s => s.id === currentStageId) || TRIAL_STAGES[0]

  return (
    <div className="bg-zinc-900/60 border-b border-zinc-800/80 px-4 sm:px-6 py-2.5">
      {/* Horizontal Stage Stepper for Desktop */}
      <div className="hidden lg:flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-thin">
        {TRIAL_STAGES.map((st, idx) => {
          const isDone = st.order < currentStageOrder
          const isCurrent = st.id === currentStageId

          return (
            <div key={st.id} className="flex items-center gap-1.5 flex-1 min-w-[110px]">
              <div
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium w-full transition-all ${
                  isCurrent
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-sm shadow-blue-500/20'
                    : isDone
                      ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    isCurrent
                      ? 'bg-blue-500 text-white animate-pulse'
                      : isDone
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3" /> : st.order}
                </div>
                <span className="truncate">{st.title}</span>
              </div>
              {idx < TRIAL_STAGES.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-700 flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      {/* Compact Stage View for Tablet/Mobile */}
      <div className="flex lg:hidden items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
            {currentStage.order}
          </span>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white leading-tight">
              {currentStage.title}
            </h2>
            <p className="text-[11px] text-zinc-400 truncate max-w-[240px]">
              {currentStage.legalName}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded-md">
          {currentStage.order} / {TRIAL_STAGES.length}
        </span>
      </div>
    </div>
  )
}
