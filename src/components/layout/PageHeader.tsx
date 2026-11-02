'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, Home, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/app/providers'
import { getRoleDashboardPath } from '@/lib/roles'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  showBackButton?: boolean
  backHref?: string
  actions?: React.ReactNode
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  showBackButton = true,
  backHref,
  actions,
}: PageHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const { user } = useAuth()

  const roleDashboard = getRoleDashboardPath(user?.role)

  // Generate default breadcrumbs if not provided
  const defaultBreadcrumbs: BreadcrumbItem[] = []

  // Add role-based dashboard as first breadcrumb if not on dashboard
  if (pathname !== roleDashboard && pathname !== '/dashboard' && pathname !== '/') {
    defaultBreadcrumbs.push({
      label: t('navDashboard', 'Bosh sahifa'),
      href: roleDashboard,
    })
  }

  // Add section breadcrumb based on path
  const pathSegments = pathname.split('/').filter(Boolean)
  if (pathSegments.length > 0 && pathSegments[0] !== 'dashboard') {
    const sectionMap: Record<string, string> = {
      'case-solver': t('navCaseSolver', 'Kazus Yechish (IRAC)'),
      'decision-tree': t('navDecisionTree', 'Qarorlar Daraxti'),
      'virtual-court': t('navVirtualCourt', 'Virtual Sud'),
      'scenario-generator': t('navScenarioGen', 'Senariy Generator'),
      'legal-database': t('navLegalDatabase', 'Qonunlar bazasi'),
      'legal-database-new': t('navLegalDatabase', 'Qonunlar bazasi'),
      'professional-tools': t('navTools', 'Asboblar'),
      'pro-tools': t('navTools', 'Asboblar'),
      qonunlar: t('navLegalDatabase', 'Qonunlar bazasi'),
      settings: t('navSettings', 'Sozlamalar'),
      profile: t('profile', 'Profil'),
      statistics: t('navStatistics', 'Statistika'),
      community: t('navCommunity', 'Jamiyat'),
      billing: t('billing', 'Hisob-kitob'),
      premium: t('navPremium', 'Premium'),
      help: t('navHelp', 'Yordam'),
      admin: t('adminDashboard', 'Admin Panel'),
      citizen: 'Fuqaro kabineti',
      'law-student': 'Talaba kabineti',
      advocate: 'Advokat kabineti',
    }

    const sectionLabel = sectionMap[pathSegments[0]]
    if (sectionLabel) {
      defaultBreadcrumbs.push({
        label: sectionLabel,
        href: `/${pathSegments[0]}`,
      })
    }
  }

  const finalBreadcrumbs = breadcrumbs || defaultBreadcrumbs

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(roleDashboard)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left: Back button + Breadcrumbs + Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {showBackButton && (
              <button
                onClick={handleBack}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 text-xs font-semibold transition-colors"
                aria-label="Oldingi sahifaga qaytish"
                title="Orqaga"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-zinc-400" />
                <span className="hidden sm:inline">Orqaga</span>
              </button>
            )}

            {/* Home / Dashboard quick button */}
            <Link
              href={roleDashboard}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/60 text-xs font-medium transition-colors"
              title="Bosh sahifa / Dashboard"
            >
              <Home className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>

            <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700 hidden sm:block flex-shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              {/* Breadcrumbs */}
              {finalBreadcrumbs.length > 0 && (
                <nav className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
                  {finalBreadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      {index > 0 && (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-600 flex-shrink-0" />
                      )}
                      {crumb.href ? (
                        <Link
                          href={crumb.href}
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-[140px]"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="truncate max-w-[140px]">{crumb.label}</span>
                      )}
                    </div>
                  ))}
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-600 flex-shrink-0" />
                </nav>
              )}

              {/* Current page title */}
              <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                {title}
              </h1>
            </div>
          </div>

          {/* Right: Actions */}
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>

        {/* Description (if provided) */}
        {description && (
          <div className="pb-3 sm:pb-4 -mt-2">
            <p className="text-xs text-gray-500 dark:text-zinc-400">{description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
