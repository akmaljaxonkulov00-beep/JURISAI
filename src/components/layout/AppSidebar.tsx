'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useAuth } from '@/app/providers'
import { NAV_GROUPS, filterNavGroups, isNavItemActive } from './navigation'

interface AppSidebarProps {
  /**
   * Sahifa-spetsifik vositalar (Orqaga, statistika, sozlamalar va h.k.)
   * Nav bo'limidan yuqorida ko'rsatiladi. Ixtiyoriy.
   */
  children?: ReactNode
}

/**
 * ─────────────────────────────────────────────────────────────────────
 *  YAGONA SIDEBAR KOMPONENTI
 *
 *  Desktop (≥768px) uchun doimiy ko'rinadigan sidebar. Mobil versiyada
 *  global MobileNav (hamburger) aynan shu NAV_GROUPS konfiguratsiyasini
 *  ishlatadi — ya'ni desktop va mobil menyu DOIM bir xil bo'ladi.
 *
 *  Yangi menyu elementi qo'shilsa — faqat NAV_GROUPS'ga qo'shiladi,
 *  desktop va mobile avtomatik yangilanadi.
 * ─────────────────────────────────────────────────────────────────────
 */
export default function AppSidebar({ children }: AppSidebarProps) {
  const pathname = usePathname()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  // Single source of truth: shared NAV_GROUPS + auth/admin filter
  const groups = filterNavGroups(NAV_GROUPS, { isAuthenticated, isAdmin })

  return (
    <aside
      className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 overflow-y-auto overscroll-contain bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800"
      aria-label="Asosiy navigatsiya"
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 dark:border-zinc-800 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">J</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-white">JURISAI</span>
        </Link>
      </div>

      {/* Sahifa-spetsifik vositalar (ixtiyoriy) */}
      {children && (
        <div className="px-3 pt-4 pb-2 flex-shrink-0 border-b border-gray-100 dark:border-zinc-800">
          {children}
        </div>
      )}

      {/* Asosiy navigatsiya — NAV_GROUPS (yagona manba) */}
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto overscroll-contain">
        {groups.map(group => (
          <div key={group.title}>
            <p className="px-3 text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon
                const active = isNavItemActive(item.href, pathname)

                // Chiqish — haqiqiy Supabase signOut
                if (item.action === 'logout') {
                  return (
                    <button
                      key={item.id}
                      onClick={() => logout()}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </button>
                  )
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href || '#'}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Foydalanuvchi qismi */}
      {isAuthenticated && user && (
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-700 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-zinc-300 flex-shrink-0">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">{user.email}</p>
            </div>
            {isAdmin && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex-shrink-0">
                ADMIN
              </span>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
