'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/app/providers'
import { NAV_GROUPS, filterNavGroups, isNavItemActive } from './navigation'

interface AppSidebarProps {
  /**
   * Sahifa-spetsifik vositalar (Orqaga, statistika, sozlamalar va h.k.)
   * Profil + XP blokidan keyin, nav bo'limidan yuqorida ko'rsatiladi. Ixtiyoriy.
   */
  children?: ReactNode
}

interface SidebarStats {
  xp: number
  level: number
  weeklyProgress: number
  rank: string
}

const DEFAULT_STATS: SidebarStats = {
  xp: 0,
  level: 1,
  weeklyProgress: 0,
  rank: 'Yangi boshlovchi',
}

/**
 * ─────────────────────────────────────────────────────────────────────
 *  YAGONA SIDEBAR KOMPONENTI (1-rasm — source of truth)
 *
 *  Struktura (barcha ekranlarda bir xil):
 *    Profil → avatar, ism, daraja ("Yangi boshlovchi"), Level + XP progress
 *    XP     → Total XP + Haftalik maqsad
 *    AMALIYOT → IRAC Huquqiy Tahlil, Qarorlar Daraxti, Virtual Sud
 *    RESURSLAR → Qonunlar bazasi, Asboblar, Jamiyat, Statistika
 *    SHAXSIY → Sozlamalar, Premium, Yordam, (Admin Panel — faqat admin), Chiqish
 *
 *  Desktop (≥768px) uchun doimiy ko'rinadi. Mobil versiyada global
 *  MobileNav (hamburger) aynan shu NAV_GROUPS konfiguratsiyasini ishlatadi
 *  — ya'ni desktop va mobil menyu DOIM bir xil bo'ladi.
 *
 *  Yangi menyu elementi qo'shilsa — faqat NAV_GROUPS'ga qo'shiladi,
 *  desktop va mobile avtomatik yangilanadi.
 * ─────────────────────────────────────────────────────────────────────
 */
export default function AppSidebar({ children }: AppSidebarProps) {
  const pathname = usePathname()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const [stats, setStats] = useState<SidebarStats>(DEFAULT_STATS)

  // XP / Level — dashboard bilan bir xil manba (localStorage 'user_stats')
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('user_stats')
      if (stored) {
        const parsed = JSON.parse(stored)
        setStats({
          xp: parsed.xp ?? 0,
          level: parsed.level ?? 1,
          weeklyProgress: parsed.weeklyProgress ?? 0,
          rank: parsed.rank || 'Yangi boshlovchi',
        })
      }
    } catch {
      // localStorage ma'lumot buzilgan bo'lsa — default qiymatlar
    }
  }, [])

  // Single source of truth: shared NAV_GROUPS + auth/admin filter
  const groups = filterNavGroups(NAV_GROUPS, { isAuthenticated, isAdmin })
  const levelProgress = ((stats.level % 20) * 5)

  return (
    <aside
      className="hidden md:flex flex-col w-72 lg:w-80 shrink-0 h-screen sticky top-0 overflow-y-auto overscroll-contain p-4"
      aria-label="Asosiy navigatsiya"
    >
      <div className="glass-strong rounded-2xl shadow-2xl overflow-hidden flex flex-col flex-1">
        {/* ── Profil: avatar, ism, daraja, Level + XP progress ───────── */}
        <div className="p-5 border-b border-gray-100 dark:border-zinc-800/50">
          <Link href="/profile" className="flex items-center space-x-4 group cursor-pointer">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform group-hover:scale-105 duration-200">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center shadow-sm">
                <span className="text-white text-[10px] font-bold">{stats.level}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-white text-base truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {user?.name || 'Foydalanuvchi'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-zinc-500 truncate">{stats.rank}</p>
              <div className="flex items-center mt-2">
                <div className="flex-1 bg-gray-100 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <span className="ml-2 text-xs text-gray-500 dark:text-zinc-500 font-medium flex-shrink-0">
                  Lv.{stats.level}
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* ── XP: Total XP + Haftalik maqsad ─────────────────────────── */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800/50">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                {stats.xp}
              </div>
              <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">Total XP</div>
            </div>
            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <div className="text-2xl font-bold text-emerald-600">{stats.weeklyProgress}%</div>
              <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">Haftalik maqsad</div>
            </div>
          </div>
        </div>

        {/* Sahifa-spetsifik vositalar (ixtiyoriy) */}
        {children && (
          <div className="px-4 pt-4 pb-2 border-b border-gray-100 dark:border-zinc-800/50">
            {children}
          </div>
        )}

        {/* ── Asosiy navigatsiya — NAV_GROUPS (yagona manba) ─────────── */}
        <nav className="flex-1 px-4 py-4 space-y-5 overflow-y-auto overscroll-contain">
          {groups.map(group => (
            <div key={group.title}>
              <h3 className="px-4 text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-[0.08em] mb-2">
                {group.title}
              </h3>
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
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 cursor-pointer"
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{item.name}</span>
                      </button>
                    )
                  }

                  return (
                    <Link
                      key={item.id}
                      href={item.href || '#'}
                      className={`nav-item flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                        active
                          ? 'nav-item-active'
                          : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 ${active ? '' : 'text-gray-400 dark:text-zinc-500'}`}
                      />
                      <span className="font-medium text-sm flex-1">{item.name}</span>
                      {active && (
                        <div className="w-1.5 h-1.5 bg-white dark:bg-zinc-900 rounded-full shadow-[0_0_4px_rgba(255,255,255,0.5)]" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  )
}
