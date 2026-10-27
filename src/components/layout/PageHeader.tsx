'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight, Home, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

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
  showBackButton = false,
  backHref,
  actions,
}: PageHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()

  // Generate default breadcrumbs if not provided
  const defaultBreadcrumbs: BreadcrumbItem[] = []
  
  // Add dashboard as first breadcrumb if not on dashboard
  if (pathname !== '/dashboard') {
    defaultBreadcrumbs.push({
      label: t('navDashboard'),
      href: '/dashboard',
    })
  }

  // Add section breadcrumb based on path
  const pathSegments = pathname.split('/').filter(Boolean)
  if (pathSegments.length > 0 && pathSegments[0] !== 'dashboard') {
    const sectionMap: Record<string, string> = {
      'case-solver': t('navCaseSolver'),
      'decision-tree': t('navDecisionTree'),
      'virtual-court': t('navVirtualCourt'),
      'scenario-generator': t('navScenarioGen'),
      'legal-database': t('navLegalDatabase'),
      'legal-database-new': t('navLegalDatabase'),
      'qonunlar': t('navLegalDatabase'),
      'settings': t('navSettings'),
      'profile': t('profile'),
      'statistics': t('navStatistics'),
      'community': t('navCommunity'),
      'billing': t('billing'),
      'premium': t('navPremium'),
      'help': t('navHelp'),
      'admin': t('adminDashboard'),
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
      router.push('/dashboard')
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
                className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Orqaga"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
              </button>
            )}

            <div className="flex items-center gap-2 min-w-0">
              {/* Breadcrumbs */}
              {finalBreadcrumbs.length > 0 && (
                <nav className="hidden sm:flex items-center gap-1.5 text-sm">
                  {finalBreadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      {index > 0 && (
                        <ChevronRight className="w-4 h-4 text-gray-400 dark:text-zinc-600 flex-shrink-0" />
                      )}
                      {crumb.href ? (
                        <Link
                          href={crumb.href}
                          className="text-gray-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-[150px]"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-gray-600 dark:text-zinc-400 truncate max-w-[150px]">
                          {crumb.label}
                        </span>
                      )}
                    </div>
                  ))}
                </nav>
              )}

              {/* Current page title */}
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                {title}
              </h1>
            </div>
          </div>

          {/* Right: Actions */}
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>

        {/* Description (if provided) */}
        {description && (
          <div className="pb-4 sm:pb-5">
            <p className="text-sm text-gray-600 dark:text-zinc-400">{description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
