'use client'

import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ScenarioGenerator from '@/components/features/ScenarioGenerator'
import AppSidebar from '@/components/layout/AppSidebar'
import FeatureInstructions from '@/components/ui/FeatureInstructions'

const SCENARIO_INSTRUCTIONS = [
  {
    title: "Ko'nikmani tanlang",
    description: "Huquqiy yo'nalishni tanlang: fuqarolik, jinoyat, mehnat yoki ma'muriy huquq.",
    icon: '⚖️',
  },
  {
    title: 'Senariyni yarating',
    description: 'AI sizga real hayotdagi huquqiy holatlar asosida senariy yaratib beradi.',
    icon: '🎭',
  },
  {
    title: "Yeching va o'rganing",
    description:
      "Senariy yechimini toping, tegishli qonun moddalarini o'rganing va bilimlaringizni sinang.",
    icon: '✅',
  },
]

const SCENARIO_TIPS = [
  "Har xil turdagi senariylarni sinab ko'ring — bu turli yo'nalishlardagi bilimingizni oshiradi",
  'Senariy tavsifini batafsil kiriting — AI shunga asosan aniqroq tahlil beradi',
  "Yechim topganingizdan keyin, boshqa variantlarni ham ko'rib chiqing",
]

export default function ScenarioGeneratorPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-gray-950 mobile-safe-top">
      <div className="flex flex-col md:flex-row">
        <AppSidebar>
          <div className="space-y-1">
            <button
              onClick={() => router.push('/professional-tools')}
              className="flex items-center gap-2 px-3 py-2 w-full text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Asboblar</span>
            </button>
          </div>
        </AppSidebar>

        <div className="flex-1 min-w-0">
          <div className="p-4 md:p-6">
            <FeatureInstructions
              featureName="Senariy Generator"
              steps={SCENARIO_INSTRUCTIONS}
              tips={SCENARIO_TIPS}
            />
          </div>
          <ScenarioGenerator />
        </div>
      </div>
    </div>
  )
}
