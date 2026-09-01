'use client'

import { useLanguage } from '@/context/LanguageContext'
import ContactSection from '@/components/landing/ContactSection'
import SiteLogo from '@/components/SiteLogo'

import React, { useMemo } from 'react'
import Link from 'next/link'
import {
  Scale,
  Brain,
  FileText,
  Search,
  BarChart3,
  BookOpen,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Gavel,
  ChevronRight,
} from 'lucide-react'

export default function LandingPage() {
  const { t } = useLanguage()

  const SERVICES = useMemo(
    () => [
      {
        icon: Scale,
        title: t('landingVirtualCourt'),
        description: t('landingVirtualCourtDesc'),
        bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
        textColor: 'text-cyan-600',
        href: '/virtual-court',
      },
      {
        icon: Brain,
        title: t('landingLegalAgent'),
        description: t('landingLegalAgentDesc'),
        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
        textColor: 'text-indigo-600',
        href: '/ai-assistant',
      },
      {
        icon: BarChart3,
        title: t('landingAnalytics'),
        description: t('landingAnalyticsDesc'),
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        textColor: 'text-red-600',
        href: '/statistics',
      },
      {
        icon: Search,
        title: t('landingSmartSearch'),
        description: t('landingSmartSearchDesc'),
        bgColor: 'bg-violet-50 dark:bg-violet-900/20',
        textColor: 'text-violet-600',
        href: '/legal-database-new',
      },
      {
        icon: FileText,
        title: t('landingDocGenerator'),
        description: t('landingDocGeneratorDesc'),
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        textColor: 'text-amber-600',
        href: '/document-generator',
      },
      {
        icon: BookOpen,
        title: t('landingLawDatabase'),
        description: t('landingLawDatabaseDesc'),
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        textColor: 'text-emerald-600',
        href: '/legal-database-new',
      },
    ],
    [t]
  )

  const STATS = useMemo(
    () => [
      { value: '10,000+', label: t('landingStatsUsers') },
      { value: '5,000+', label: t('landingStatsDocs') },
      { value: '95%', label: t('landingStatsAccuracy') },
      { value: '24/7', label: t('landingStatsSupport') },
    ],
    [t]
  )

  const ADVANTAGES = useMemo(
    () => [
      t('landingAdv1'),
      t('landingAdv2'),
      t('landingAdv3'),
      t('landingAdv4'),
      t('landingAdv5'),
      t('landingAdv6'),
    ],
    [t]
  )

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <SiteLogo size="sm" />
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="#services"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t('landingServices')}
              </a>
              <a
                href="#advantages"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t('landingAdvantages')}
              </a>
              <a
                href="#stats"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t('landingStats')}
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/signin"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t('landingLogin')}
              </Link>
              <Link
                href="/signin?mode=register"
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
              >
                {t('landingFreeTrial')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/30" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 mb-8">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {t('landingBadge')}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
              {t('landingTitle1')}{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t('landingTitle2')}
              </span>{' '}
              {t('landingTitle3')}
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              {t('landingHeroDesc')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signin?mode=register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40"
              >
                {t('landingFreeTrial')}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/signin"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                {t('landingDemo')}
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>{t('landingSafePlatform')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>{t('landingFreeTrial2')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500" />
                <span>{t('landingRating')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section
        id="stats"
        className="py-16 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200/50 dark:border-gray-800/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SERVICES ═══ */}
      <section id="services" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('landingServicesTitle')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('landingServicesDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service, i) => (
              <Link
                key={i}
                href={service.href}
                className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${service.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <service.icon className={`w-6 h-6 ${service.textColor}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                  {service.description}
                </p>
                <div className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
                  {t('landingLearnMore')}
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ADVANTAGES ═══ */}
      <section id="advantages" className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                {t('landingWhyTitle')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">{t('landingWhyDesc')}</p>
              <div className="space-y-4">
                {ADVANTAGES.map((adv, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{adv}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/signin?mode=register"
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
              >
                {t('landingCTA')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <Gavel className="w-8 h-8" />
                  <h3 className="text-xl font-bold">{t('landingVirtualCourtTitle')}</h3>
                </div>
                <p className="text-blue-100 mb-6 leading-relaxed">{t('landingVirtualCourtDesc')}</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="text-2xl font-bold">4</div>
                    <div className="text-xs text-blue-200">{t('landingCourtRoles')}</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="text-2xl font-bold">AI</div>
                    <div className="text-xs text-blue-200">{t('landingCourtAI')}</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="text-2xl font-bold">Real</div>
                    <div className="text-xs text-blue-200">{t('landingCourtReal')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 sm:p-14 text-white shadow-2xl shadow-blue-500/20">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t('landingCTATitle')}</h2>
            <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto">{t('landingCTADesc')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signin?mode=register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-blue-600 bg-white rounded-xl hover:bg-blue-50 transition-all shadow-lg"
              >
                {t('landingRegister')}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/signin"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-semibold text-white border border-white/30 rounded-xl hover:bg-white/10 transition-all"
              >
                {t('landingLogin')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CONTACT ═══ */}
      <ContactSection />

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <SiteLogo size="sm" className="[&_span]:text-white" />
              </div>
              <p className="text-sm leading-relaxed">{t('landingFooterDesc2')}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                {t('landingServices')}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/virtual-court" className="hover:text-white transition-colors">
                    {t('landingVirtualCourt')}
                  </a>
                </li>
                <li>
                  <a href="/ai-assistant" className="hover:text-white transition-colors">
                    {t('landingLegalAgent')}
                  </a>
                </li>
                <li>
                  <a href="/document-generator" className="hover:text-white transition-colors">
                    {t('landingDocGenerator')}
                  </a>
                </li>
                <li>
                  <a href="/legal-database-new" className="hover:text-white transition-colors">
                    {t('landingLawDatabase')}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                {t('landingPlatform')}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/irac" className="hover:text-white transition-colors">
                    IRAC Tahlili
                  </a>
                </li>
                <li>
                  <a href="/decision-tree" className="hover:text-white transition-colors">
                    Qarorlar Daraxti
                  </a>
                </li>
                <li>
                  <a href="/statistics" className="hover:text-white transition-colors">
                    {t('landingStats')}
                  </a>
                </li>
                <li>
                  <a href="/premium" className="hover:text-white transition-colors">
                    Premium
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                {t('landingContact')}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>info@juristiv.uz</li>
                <li>+998 90 123 45 67</li>
                <li>Toshkent, O&apos;zbekiston</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>
              &copy; {new Date().getFullYear()} JURISTIV. {t('landingAllRights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
