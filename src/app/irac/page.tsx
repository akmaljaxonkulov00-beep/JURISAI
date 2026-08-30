'use client'

import React from 'react'
import IRACCaseSolver from '@/components/features/IRACCaseSolver'
import FeatureInstructions from '@/components/ui/FeatureInstructions'

const IRAC_INSTRUCTIONS = [
  {
    title: "Ish holatini kiriting",
    description: "Sud ishi yoki huquqiy muammoning tavsifini batafsil yozing. Qancha aniq bo'lsa, AI tahlili shuncha yaxshi bo'ladi.",
    icon: '📝',
  },
  {
    title: "AI tahlilini kuting",
    description: "AI sizning ishingizni IRAC metodi (Issue, Rule, Application, Conclusion) bo'yicha tahlil qiladi.",
    icon: '🤖',
  },
  {
    title: "Natijani o'rganing",
    description: "Tahlil natijasini o'qing, tegishli qonun moddalarini tekshiring va o'z xulosangizni chiqaring.",
    icon: '📖',
  },
]

const IRAC_TIPS = [
  "Shartnoma nizolari uchun: shartnoma sanasi, summa va buzilgan shartlarni ko'rsating",
  "Jinoyat ishlari uchun: voqea sanasi, joy va jabrlanuvchini tavsiflang",
  "Mehnat nizolari uchun: ish beruvchi nomi, mehnat shartnomasi muddatini kiriting",
]

export default function IRACPage() {
  return (
    <div className="mobile-safe-top">
      <FeatureInstructions
        featureName="IRAC Huquqiy Tahlil"
        steps={IRAC_INSTRUCTIONS}
        tips={IRAC_TIPS}
      />
      <IRACCaseSolver />
    </div>
  )
}
