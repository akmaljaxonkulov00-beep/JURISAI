'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Scale,
  Brain,
  FileText,
  Search,
  BookOpen,
  BarChart3,
  Shield,
  Zap,
  Users,
  Star,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  Menu,
  X,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Scale,
    title: 'Virtual Sud AI',
    description:
      'Sud jarayonlarini simulyatsiya qiling — sudya, advokat yoki prokuror rolini tanlang',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    href: '/virtual-court',
  },
  {
    icon: Brain,
    title: 'AI Huquqiy Agent',
    description:
      "O'zbekiston qonunchiligi asosida AI yordamchi bilan huquqiy savollaringizga javob oling",
    color: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    href: '/ai-chat',
  },
  {
    icon: BarChart3,
    title: 'AI Analitika',
    description: 'Huquqiy tahlil va bashoratli tavsiyalar — statistika va trendlarni kuzating',
    color: 'from-red-500 to-rose-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
    href: '/statistics',
  },
  {
    icon: Search,
    title: 'Smart Huquqiy Qidiruv',
    description: "Sun'iy intellekt bilan semantik qidiruv — kerakli moddani tezda toping",
    color: 'from-purple-500 to-fuchsia-500',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    href: '/legal-database',
  },
  {
    icon: FileText,
    title: 'AI Hujjat Generator',
    description: "Da'vo arizalari, shartnomalar va boshqa huquqiy hujjatlarni avtomatik yarating",
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    href: '/document-generator',
  },
  {
    icon: BookOpen,
    title: "O'zbekiston Qonunchiligi",
    description: 'Kodekslar va normativ hujjatlar bazasi — 4000+ modda bitta joyda',
    color: 'from-emerald-500 to-green-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    href: '/legal-database',
  },
]

const STATS = [
  { value: '4,000+', label: 'Qonun moddalari' },
  { value: '500+', label: "AI so'rovlar" },
  { value: '24/7', label: 'AI yordam' },
  { value: '100%', label: 'Bepul boshlang' },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                JURIST<span className="text-indigo-500">IV</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Imkoniyatlar
              </a>
              <a
                href="#about"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Biz haqimizda
              </a>
              <a
                href="#stats"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Statistika
              </a>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/signin"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Kirish
              </Link>
              <Link
                href="/signin?mode=register"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
              >
                Ro'yxatdan o'tish
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 dark:border-gray-800">
              <nav className="flex flex-col gap-3">
                <a href="#features" className="text-sm text-gray-600 dark:text-gray-400 py-2">
                  Imkoniyatlar
                </a>
                <a href="#about" className="text-sm text-gray-600 dark:text-gray-400 py-2">
                  Biz haqimizda
                </a>
                <div className="flex gap-3 pt-2">
                  <Link
                    href="/signin"
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    Kirish
                  </Link>
                  <Link
                    href="/signin?mode=register"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg"
                  >
                    Ro'yxatdan o'tish
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-indigo-950/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 mb-8">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                O'zbekistonning birinchi AI huquqiy platformasi
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
              Huquqiy ta'limni{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                qayta kashf qiling
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Zamonaviy AI texnologiyalari orqali huquqiy tahlil, IRAC metodologiyasi va interaktiv
              sud simulyatsiyalari bilan professional mahoratingizni oshiring
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signin?mode=register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
              >
                Bepul boshlang
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/signin"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:-translate-y-0.5"
              >
                Kirish
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section
        id="stats"
        className="border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Zamonaviy AI bilan{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                huquqiy yordam
              </span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Barcha huquqiy ehtiyojlaringiz uchun bitta platforma — AI yordamida tezroq, aniqroq va
              professional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(feature => {
              const Icon = feature.icon
              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="group p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Batafsil <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* About / CTA Section */}
      <section id="about" className="py-20 sm:py-28 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Nima uchun JURISTIV?
              </h2>
              <p className="text-lg text-blue-100 mb-8 leading-relaxed">
                Biz O'zbekiston huquq tizimini zamonaviy AI bilan integratsiya qilish orqali har bir
                fuqaroga professional huquqiy yordamni yetkazib berishni maqsad qilganmiz.
              </p>
              <div className="space-y-4">
                {[
                  "Barcha O'zbekiston kodekslari va qonunlari",
                  'AI yordamida real vaqtda huquqiy maslahat',
                  'Interaktiv sud simulyatsiyalari',
                  'Hujjat avtomatik generatsiyasi',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-300 flex-shrink-0" />
                    <span className="text-blue-100">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/signin?mode=register"
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-blue-600 bg-white rounded-xl hover:bg-blue-50 transition-all shadow-lg"
                >
                  <Zap className="w-5 h-5" />
                  Hoziroq boshlang
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Users, label: 'Faol foydalanuvchilar', value: '500+' },
                    { icon: Star, label: "O'rtacha baho", value: '4.9/5' },
                    { icon: Shield, label: 'Xavfsizlik', value: '100%' },
                    { icon: Zap, label: 'AI aniqligi', value: '95%+' },
                  ].map(item => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="bg-white/10 rounded-xl p-4 text-center">
                        <Icon className="w-6 h-6 text-white/80 mx-auto mb-2" />
                        <div className="text-xl font-bold text-white">{item.value}</div>
                        <div className="text-xs text-blue-200 mt-1">{item.label}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-6 h-6 text-blue-400" />
                <span className="text-lg font-bold">JURISTIV</span>
              </div>
              <p className="text-sm text-gray-400">
                O'zbekistonning yetakchi AI huquqiy platformasi
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-sm">Xizmatlar</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/virtual-court" className="hover:text-white transition-colors">
                    Virtual Sud
                  </Link>
                </li>
                <li>
                  <Link href="/ai-chat" className="hover:text-white transition-colors">
                    AI Chat
                  </Link>
                </li>
                <li>
                  <Link href="/legal-database" className="hover:text-white transition-colors">
                    Qonunlar Bazasi
                  </Link>
                </li>
                <li>
                  <Link href="/document-generator" className="hover:text-white transition-colors">
                    Hujjat Generator
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-sm">Platforma</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/irac" className="hover:text-white transition-colors">
                    IRAC Tahlili
                  </Link>
                </li>
                <li>
                  <Link href="/decision-tree" className="hover:text-white transition-colors">
                    Qarorlar Daraxti
                  </Link>
                </li>
                <li>
                  <Link href="/statistics" className="hover:text-white transition-colors">
                    Statistika
                  </Link>
                </li>
                <li>
                  <Link href="/premium" className="hover:text-white transition-colors">
                    Premium
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-sm">Huquqiy</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Foydalanish shartlari
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Maxfiylik siyosati
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} JURISTIV. Barcha huquqlar himoyalangan.
          </div>
        </div>
      </footer>
    </div>
  )
}
