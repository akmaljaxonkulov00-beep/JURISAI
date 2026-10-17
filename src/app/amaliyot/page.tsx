'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Scale,
  GitBranch,
  Gavel,
  Clapperboard,
  ArrowRight,
  Sparkles,
  Award,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Brain,
  Shield,
  Layers,
  Clock,
  Play,
  FileText,
  Star,
} from 'lucide-react'
import AppSidebar from '@/components/layout/AppSidebar'
import { useAuth } from '@/app/providers'
import { getAuthHeaders } from '@/lib/api-auth-client'

interface PracticeModule {
  id: string
  title: string
  subtitle: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge: string
  badgeColor: string
  gradient: string
  features: string[]
  statsLabel: string
}

const MODULES: PracticeModule[] = [
  {
    id: 'case-solver',
    title: 'Kazus Yechish (IRAC)',
    subtitle: 'Xalqaro Huquqiy Tahlil Metodikasi',
    description:
      'Sud kazuslarini Issue, Rule, Application va Conclusion qismlariga ajratib tahlil qiling. Sunʼiy intellekt O‘zbekiston qonunchiligi moddalari asosida 100 ballik tizimda baholaydi.',
    href: '/case-solver',
    icon: Scale,
    badge: 'IRAC Metodi',
    badgeColor:
      'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-600/10 via-indigo-600/5 to-transparent hover:border-blue-500/50',
    features: [
      '100 ballik ob’yektiv tahlil tizimi',
      'RAG qonun moddalari avtomatik tekshiruvi',
      'Kuchli va zaif tomonlar tahlili',
      'Tahlil hisobotini yuklab olish',
    ],
    statsLabel: 'Mavjud kazuslar: 30+',
  },
  {
    id: 'decision-tree',
    title: 'Qarorlar Daraxti',
    subtitle: 'Strategik Yuridik Xaritalash',
    description:
      'Sud yoki muzokaralar oldidan barcha yuridik yo‘nalishlarni daraxt sxemasi ko‘rinishida vizuallashtiring. Xarajatlar, muddatlar, ehtimolliklar va zarur dalillarni taqqoslang.',
    href: '/decision-tree',
    icon: GitBranch,
    badge: 'Strategiya & Risk',
    badgeColor:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    gradient: 'from-emerald-600/10 via-teal-600/5 to-transparent hover:border-emerald-500/50',
    features: [
      'Interaktiv vizual sxema (Zoom & Pan)',
      'Yo‘llar va xarajatlar simulyatsiyasi',
      'Dalillar nazorat ro‘yxati (Checklist)',
      'Professional PDF hisobot eksporti',
    ],
    statsLabel: 'Vizual tahlil',
  },
  {
    id: 'virtual-court',
    title: 'Virtual Sud Simulyatsiyasi',
    subtitle: 'Jonli Protsessual Majlis',
    description:
      'Sudya, davlat ayblovchisi yoki himoyachi advokat rolida ishtirok eting. AI personajlari real vaqtda javob beradi va protsessual qoidalarga rioya etilishini baholaydi.',
    href: '/virtual-court',
    icon: Gavel,
    badge: 'Interaktiv Audio',
    badgeColor:
      'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    gradient: 'from-amber-600/10 via-orange-600/5 to-transparent hover:border-amber-500/50',
    features: [
      'JPK / FPK protsessual bosqichlari',
      'Web Speech ovozli replikalar (TTS)',
      'Dalillarni taqdim etish va e’tirozlar',
      'Sud bayonnomasini (.txt) yuklab olish',
    ],
    statsLabel: '3 ta rol: Sudya, Prokuror, Advokat',
  },
  {
    id: 'scenario-generator',
    title: 'Senariy Generator',
    subtitle: '2026 Qonunchilik Simulyatori',
    description:
      'Fuqarolik, jinoyat, mehnat va biznes sohalarida amaliy vaziyatlar yarating. Har bir bosqichda qaror qabul qiling yoki o‘zingizning mustaqil yuridik taktikangizni yozing.',
    href: '/scenario-generator',
    icon: Clapperboard,
    badge: 'Keys Generator',
    badgeColor:
      'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-600/10 via-violet-600/5 to-transparent hover:border-purple-500/50',
    features: [
      '12 ta huquq sohasi va 4 ta qiyinlik darajasi',
      'O‘z mustaqil yuridik pozitsiyasini kiritish',
      'Xatolar va tavsiyalar batafsil tahlili',
      'Sessiyalar tarixi va natijalarni tiklash',
    ],
    statsLabel: '12 ta huquq sohasi',
  },
]

export default function PracticeHubPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState({
    totalSolved: 0,
    averageScore: 0,
    xpEarned: 0,
  })

  useEffect(() => {
    const loadPracticeStats = async () => {
      try {
        const stored = localStorage.getItem('user_stats')
        if (stored) {
          const p = JSON.parse(stored)
          setStats(prev => ({
            ...prev,
            xpEarned: p.xp || 0,
          }))
        }
      } catch {}
    }
    loadPracticeStats()
  }, [])

  return (
    <div className="min-h-screen bg-[#f8faff] dark:bg-zinc-950 mobile-safe-top">
      <div className="flex flex-col md:flex-row">
        <AppSidebar />

        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-8">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-blue-800/40">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Yuridik Amaliyot Platformasi (2026)</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Amaliy Yuridik Ko‘nikmalarni{' '}
                <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                  Sunʼiy Intellekt
                </span>{' '}
                Bilan Oshiring
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Talabalar, amaliyotchi yuristlar va advokatlar uchun maxsus yaratilgan 4 ta
                professional interaktiv simulyator. O‘zbekiston Respublikasi amaldagi qonunchiligi
                asosida real sud, muzokara va kazus yechish tajribasini to‘plang.
              </p>

              {/* Stats Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-blue-800/60 max-w-lg">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">
                    Platforma Vositalari
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-white">4 ta Modul</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">
                    Qonunchilik Asosi
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-emerald-400">
                    2026 Amaldagi
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">
                    Tizim
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-amber-400">
                    100 Ballik IRAC
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Core Modules Grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <span>Amaliyot Modullari</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  Kerakli vositani tanlang va yuridik mahoratingizni sinang
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MODULES.map(m => {
                const Icon = m.icon
                return (
                  <div
                    key={m.id}
                    className={`bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-gray-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-blue-500/50 bg-gradient-to-br ${m.gradient}`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs group-hover:scale-105 transition-transform">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${m.badgeColor}`}
                        >
                          {m.badge}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {m.title}
                      </h3>
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                        {m.subtitle}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 leading-relaxed mb-5">
                        {m.description}
                      </p>

                      {/* Key Features Bullet List */}
                      <div className="space-y-2 mb-6 p-3.5 bg-gray-50/80 dark:bg-zinc-800/40 rounded-2xl border border-gray-100 dark:border-zinc-800">
                        {m.features.map((feat, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs text-gray-700 dark:text-zinc-300"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-medium">{m.statsLabel}</span>

                      <Link
                        href={m.href}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer group-hover:translate-x-1 duration-200"
                      >
                        <span>Boshlash</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
