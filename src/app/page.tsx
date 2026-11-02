'use client'

import { useState } from 'react'
import Link from 'next/link'
import SiteLogo from '@/components/SiteLogo'
import ContactSection from '@/components/landing/ContactSection'
import { useAuth } from '@/app/providers'
import { getRoleDashboardPath } from '@/lib/roles'
import {
  Brain,
  FileText,
  Search,
  BookOpen,
  BarChart3,
  Shield,
  Zap,
  Users,
  ChevronRight,
  ArrowRight,
  CheckCircle,
  Menu,
  X,
  Scale,
  Briefcase,
  GraduationCap,
  UserCheck,
  Sparkles,
  ExternalLink,
  LogIn,
  LayoutDashboard,
} from 'lucide-react'

const AUDIENCES = [
  {
    id: 'citizen',
    title: 'Fuqarolar uchun',
    badge: 'Tezkor va ommabop',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: UserCheck,
    description:
      'Kundalik hayotdagi huquqiy savollarga tushunarli javob oling, huquqlaringizni himoya qiling va litsenziyalangan advokatlar yordamidan foydalaning.',
    features: [
      '24/7 AI konsultatsiya — savollaringizga amaldagi qonunchilik asosida javob',
      'Malakali va litsenziyaga ega advokatlar katalogi',
      'Rasmiy arizalar, daʼvo va shartnomalar konstruktori',
      'Huquqiy xavflarni oldindan baholash (Risk Assessment)',
    ],
    primaryAction: {
      label: 'Huquqiy savol berish',
      href: '/citizen/ask',
    },
    secondaryAction: {
      label: 'Advokat topish',
      href: '/citizen/advocates',
    },
    border: 'border-emerald-200 dark:border-emerald-800/40',
  },
  {
    id: 'law_student',
    title: 'Yosh huquqshunoslar & talabalar',
    badge: 'Amaliy tajriba & IRAC',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: GraduationCap,
    description:
      'Nazariyani amaliyot bilan birlashtiring. Virtual sudda turli rollarda qatnashing, kazuslarni yeching va respublika reytingida o‘z o‘rningizni oshiring.',
    features: [
      'AI Virtual Sud simulyatsiyasi (sudya, prokuror, advokat rollari)',
      'Multiplayer Sud — talabalar bilan real vaqtda raqobatli sud majlisi',
      'IRAC metodologiyasi bo‘yicha interaktiv kazuslar yechish',
      'Sud amaliyoti tahlili, reyting, haftalik XP va yutuqlar',
    ],
    primaryAction: {
      label: 'Virtual Sudga kirish',
      href: '/virtual-court',
    },
    secondaryAction: {
      label: 'Kazus yechish',
      href: '/case-solver',
    },
    border: 'border-blue-200 dark:border-blue-800/40',
  },
  {
    id: 'advocate',
    title: 'Professional advokatlar',
    badge: 'Raqamli ish muhiti',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: Briefcase,
    description:
      'Advokatlik amaliyotini avtomatlashtiring, yangi mijozlar oqimiga ega bo‘ling, yosh kadrlarga ustozlik qiling va nufuzli obro‘ profilini yarating.',
    features: [
      'Fuqarolardan to‘g‘ridan-to‘g‘ri murojaatlar va ishlarni qabul qilish',
      'Shogirdlar tayyorlash va mentorlik tizimi (shogird biriktirish)',
      'Oliy Sud Plenum qarorlari va sud amaliyoti tahliliy vositalari',
      'Shaxsiy advokatlik profili, mijozlar sharhlari va reytingi',
    ],
    primaryAction: {
      label: 'Advokat kabineti',
      href: '/advocate',
    },
    secondaryAction: {
      label: 'Mentorlik dasturi',
      href: '/advocate/mentorship',
    },
    border: 'border-amber-200 dark:border-amber-800/40',
  },
]

const FEATURES = [
  {
    icon: Scale,
    title: 'Virtual Sud AI & Multiplayer',
    description:
      'Sud jarayonlarini yakka tartibda yoki boshqa ishtirokchilar bilan multiplayer rejimida simulyatsiya qiling. AI sudya protsessual baholash beradi.',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    href: '/virtual-court',
  },
  {
    icon: Brain,
    title: 'AI Huquqiy Agent',
    description:
      'O‘zbekiston Respublikasi amaldagi qonunchiligi asosida har qanday huquqiy vaziyatga doir asoslantirilgan tavsiyalar oling.',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    href: '/ai-chat',
  },
  {
    icon: Sparkles,
    title: 'Professional Asboblar',
    description:
      'Huquqiy risklarni baholash, Oliy Sud Plenum amaliyoti tahlili, qiyosiy tadqiqot va rasmiy daʼvo hamda shartnoma namunalari.',
    color: 'from-amber-500 to-yellow-600',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    href: '/professional-tools',
  },
  {
    icon: FileText,
    title: 'Kazus Yechish / IRAC',
    description:
      'Issue, Rule, Application, Conclusion xalqaro metodologiyasi asosida sud kazuslarini chuqur yeching va tahlil qiling.',
    color: 'from-rose-500 to-red-600',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    href: '/case-solver',
  },
  {
    icon: BookOpen,
    title: 'O‘zbekiston Qonunchiligi',
    description:
      'Amaldagi qonunchilik bilan muvofiqlashtirilgan kodekslar, qonunlar va normativ hujjatlar bazasi.',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    href: '/legal-database',
  },
  {
    icon: BarChart3,
    title: 'Reyting & Haqiqiy XP Tizimi',
    description:
      'Bajarilgan sudlar va yechilgan ishlar bo‘yicha haftalik peshqadamlar jadvali, dinamik darajalar va yutuqlar.',
    color: 'from-cyan-500 to-blue-600',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    href: '/ratings',
  },
]

const STATS = [
  { value: '4,000+', label: 'Qonun moddalari' },
  { value: '100%', label: 'O‘zbekiston qonunchiligiga asoslangan' },
  { value: 'Real-time', label: 'Multiplayer sud zali' },
  { value: '24/7', label: 'AI huquqiy yordam' },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isAuthenticated } = useAuth()

  const userDashboardUrl = isAuthenticated ? getRoleDashboardPath(user?.role) : '/signin'

  // Login qilmagan foydalanuvchini platforma ichiga emas, avval loginga yo'naltirish
  const getAuthProtectedUrl = (destination: string) => {
    if (isAuthenticated) return destination
    return `/signin?redirectTo=${encodeURIComponent(destination)}`
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <SiteLogo size="sm" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-7">
              <a
                href="#audiences"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-amber-400 transition-colors"
              >
                Yo‘nalishlar
              </a>
              <a
                href="#features"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-amber-400 transition-colors"
              >
                Imkoniyatlar
              </a>
              <Link
                href={getAuthProtectedUrl('/virtual-court')}
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-amber-400 transition-colors"
              >
                Virtual Sud
              </Link>
              <Link
                href={getAuthProtectedUrl('/professional-tools')}
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-amber-400 transition-colors"
              >
                Asboblar
              </Link>
            </nav>

            {/* Desktop Auth Controls */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  href={userDashboardUrl}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Kabinetga o‘tish
                </Link>
              ) : (
                <>
                  <Link
                    href="/signin"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Kirish
                  </Link>
                  <Link
                    href="/signin?mode=register"
                    className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-md shadow-blue-500/20"
                  >
                    Ro‘yxatdan o‘tish
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-400"
              aria-label="Menyu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <nav className="flex flex-col gap-2">
                <a
                  href="#audiences"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300"
                >
                  Yo‘nalishlar
                </a>
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300"
                >
                  Imkoniyatlar
                </a>
                <Link
                  href={getAuthProtectedUrl('/virtual-court')}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300"
                >
                  Virtual Sud
                </Link>
                <Link
                  href={getAuthProtectedUrl('/professional-tools')}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300"
                >
                  Asboblar
                </Link>
                <div className="flex gap-2 pt-2">
                  {isAuthenticated ? (
                    <Link
                      href={userDashboardUrl}
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg"
                    >
                      Kabinetga o‘tish
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/signin"
                        className="flex-1 text-center py-2 text-sm font-medium border border-slate-300 dark:border-slate-700 rounded-lg"
                      >
                        Kirish
                      </Link>
                      <Link
                        href="/signin?mode=register"
                        className="flex-1 text-center py-2 text-sm font-medium bg-blue-600 text-white rounded-lg"
                      >
                        Ro‘yxatdan o‘tish
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-tr from-blue-600/10 via-amber-500/10 to-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* National Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 mb-6">
              <Shield className="w-4 h-4 text-amber-500" />
              <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                O‘zbekiston Respublikasi qonunchiligiga asoslangan yagona platforma
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.15] mb-6">
              Huquqiy bilim, sun’iy intellekt va professional yordam —{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500 bg-clip-text text-transparent">
                yagona platformada.
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Juristiv — fuqarolar uchun huquqiy yordam, yosh huquqshunoslar uchun amaliy ta’lim va
              advokatlar uchun zamonaviy raqamli ish muhitini birlashtiruvchi platforma.
            </p>

            {/* Quick Action Buttons (Protected) */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Link
                href={isAuthenticated ? userDashboardUrl : '/signin?mode=register'}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:-translate-y-0.5"
              >
                Platformani boshlash
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href={getAuthProtectedUrl('/virtual-court')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all hover:-translate-y-0.5"
              >
                <Scale className="w-5 h-5 text-amber-500" />
                Virtual Sud
              </Link>
              <Link
                href={getAuthProtectedUrl('/citizen/advocates')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all hover:-translate-y-0.5"
              >
                <Briefcase className="w-5 h-5 text-blue-500" />
                Advokat topish
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Dedicated Audience Sections */}
      <section id="audiences" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-950 dark:text-white mb-4">
              Har bir foydalanuvchi uchun{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                moslashtirilgan yechimlar
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
              Juristiv har xil foydalanuvchi qatlamlarining o‘ziga xos ehtiyojlarini hisobga olgan holda
              alohida ixtisoslashgan vositalarni taqdim etadi.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {AUDIENCES.map(aud => {
              const Icon = aud.icon
              return (
                <div
                  key={aud.id}
                  className={`relative flex flex-col rounded-2xl bg-white dark:bg-slate-900/90 border ${aud.border} p-7 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                >
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-slate-900 dark:text-slate-100" />
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border ${aud.badgeColor}`}
                    >
                      {aud.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-slate-950 dark:text-white mb-3">
                    {aud.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    {aud.description}
                  </p>

                  {/* Bullet points */}
                  <div className="space-y-3 mb-8 flex-1">
                    {aud.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action CTAs (Protected) */}
                  <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      href={getAuthProtectedUrl(aud.primaryAction.href)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                    >
                      {aud.primaryAction.label}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href={getAuthProtectedUrl(aud.secondaryAction.href)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl transition-colors"
                    >
                      {aud.secondaryAction.label}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Core Features Grid (Protected Links) */}
      <section
        id="features"
        className="py-20 sm:py-28 bg-slate-50/70 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-950 dark:text-white mb-4">
              Platformaning asosiy{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 bg-clip-text text-transparent">
                imkoniyatlari
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
              Zamonaviy sun’iy intellekt, real-time arxitektura va rasmiy qonunchilik ma’lumotlar bazasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(feature => {
              const Icon = feature.icon
              return (
                <Link
                  key={feature.title}
                  href={getAuthProtectedUrl(feature.href)}
                  className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    <div
                      className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-6 h-6 text-blue-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-amber-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-amber-400">
                    Batafsil ko‘rish <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="mb-4">
                <SiteLogo size="sm" className="[&_span]:text-white" />
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                O‘zbekistonning yetakchi LegalTech platformasi. Huquqiy ta’lim, amaliyot va advokatura uchun yagona raqamli makon.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-sm text-slate-200">Asosiy xizmatlar</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                <li>
                  <Link href={getAuthProtectedUrl('/virtual-court')} className="hover:text-white transition-colors">
                    Virtual Sud
                  </Link>
                </li>
                <li>
                  <Link href={getAuthProtectedUrl('/virtual-court/multiplayer')} className="hover:text-white transition-colors">
                    Multiplayer Sud
                  </Link>
                </li>
                <li>
                  <Link href={getAuthProtectedUrl('/ai-chat')} className="hover:text-white transition-colors">
                    AI Maslahatchi
                  </Link>
                </li>
                <li>
                  <Link href={getAuthProtectedUrl('/case-solver')} className="hover:text-white transition-colors">
                    Kazus Yechish / IRAC
                  </Link>
                </li>
                <li>
                  <Link href={getAuthProtectedUrl('/professional-tools')} className="hover:text-white transition-colors">
                    Professional Asboblar
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-sm text-slate-200">Foydalanuvchi bo‘limlari</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                <li>
                  <Link href={getAuthProtectedUrl('/citizen')} className="hover:text-white transition-colors">
                    Fuqarolar portali
                  </Link>
                </li>
                <li>
                  <Link href={getAuthProtectedUrl('/law-student')} className="hover:text-white transition-colors">
                    Talabalar portali
                  </Link>
                </li>
                <li>
                  <Link href={getAuthProtectedUrl('/advocate')} className="hover:text-white transition-colors">
                    Advokatlar portali
                  </Link>
                </li>
                <li>
                  <Link href={getAuthProtectedUrl('/ratings')} className="hover:text-white transition-colors">
                    Reyting va XP
                  </Link>
                </li>
                <li>
                  <Link href={getAuthProtectedUrl('/legal-database')} className="hover:text-white transition-colors">
                    Qonunlar bazasi
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-sm text-slate-200">Huquqiy ma’lumotlar</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
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
          <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} JURISTIV.UZ. Barcha huquqlar himoyalangan.
          </div>
        </div>
      </footer>
    </div>
  )
}
