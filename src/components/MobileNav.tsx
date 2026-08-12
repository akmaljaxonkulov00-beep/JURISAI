'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun, X, LogIn } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/app/providers'
import { NAV_GROUPS, filterNavGroups, isNavItemActive } from '@/components/layout/navigation'

const SWIPE_THRESHOLD = 80 // px

/**
 * Mobil menyu — Desktop Sidebar bilan AYNAN bir xil navigation
 * manbai (NAV_GROUPS) ishlatadi. Admin Panel faqat admin uchun
 * ko'rinadi, chiqish tugmasi haqiqiy auth.signOut() bajaradi.
 */
export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { dark, toggle: toggleTheme } = useTheme()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const panelRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwiping = useRef(false)

  // ── Single source of truth: shared NAV_GROUPS + filter ──────────
  const groups = filterNavGroups(NAV_GROUPS, { isAuthenticated, isAdmin })

  // ── Body scroll lock (menyu ochiq bo'lganda) ─────────────────────
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [open])

  // ── ESC key close ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open])

  // ── Touch swipe-to-close (panel chap tomonda) ────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwiping.current = true
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isSwiping.current || !open) return
      const dx = e.touches[0].clientX - touchStartX.current
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current)
      // Only close on horizontal swipe (ignore vertical scroll attempts)
      if (dy > 30) {
        isSwiping.current = false
        return
      }
      if (dx < 0) return // Only right-to-left swipe (panel is on the left)
      // If swiped far enough, close
      if (dx > SWIPE_THRESHOLD) {
        setOpen(false)
        isSwiping.current = false
      }
    },
    [open]
  )

  const close = useCallback(() => setOpen(false), [])

  const handleLogout = async () => {
    close()
    await logout()
  }

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-zinc-700 rounded-lg shadow-md"
        aria-label="Menyu ochish"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-gray-700 dark:text-zinc-300"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Menu panel — left drawer */}
      <nav
        ref={panelRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw] bg-white dark:bg-zinc-900 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto overflow-x-hidden overscroll-contain ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">J</span>
            </div>
            <span className="font-bold text-gray-800 dark:text-white">JURISAI</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg text-gray-600 dark:text-zinc-400"
              aria-label={dark ? "Yorug' rejim" : "Qorong'i rejim"}
              title={dark ? "Yorug' rejim" : "Qorong'i rejim"}
            >
              {dark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
              aria-label="Menyu yopish"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Nav links by groups (shared config) */}
        <div className="py-3 px-3 pb-24">
          {isAuthenticated ? (
            <>
              {/* User info — ism/email kesilmasligi uchun flex-1 + min-w-0 */}
              <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-gray-50 dark:bg-zinc-800/60 rounded-xl overflow-hidden">
                <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold text-gray-800 dark:text-white truncate"
                    title={user?.name}
                  >
                    {user?.name}
                  </p>
                  <p
                    className="text-xs text-gray-500 dark:text-zinc-400 truncate"
                    title={user?.email}
                  >
                    {user?.email}
                  </p>
                </div>
                {isAdmin && (
                  <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex-shrink-0">
                    ADMIN
                  </span>
                )}
              </div>

              {groups.length === 0 ? (
                <p className="px-3 py-4 text-sm text-gray-400 dark:text-zinc-500">Menyu bo'sh</p>
              ) : (
                groups.map(group => (
                  <div key={group.title} className="mb-4">
                    <p className="px-3 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                      {group.title}
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map(item => {
                        const isActive = isNavItemActive(item.href, pathname)
                        const Icon = item.icon

                        // Logout — haqiqiy Supabase signOut tugmasi
                        if (item.action === 'logout') {
                          return (
                            <button
                              key={item.id}
                              onClick={handleLogout}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                isActive
                                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800'
                                  : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600'
                              }`}
                            >
                              <Icon className="w-5 h-5 flex-shrink-0" />
                              <span className="flex-1">{item.name}</span>
                            </button>
                          )
                        }

                        return (
                          <Link
                            key={item.id}
                            href={item.href || '#'}
                            onClick={close}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800'
                                : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                            }`}
                          >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="flex-1">{item.name}</span>
                            {item.badge && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            // ── Logged out — kirish taklifi ─────────────────────────
            <div className="px-3 py-4">
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-3">
                To'liq menyu uchun tizimga kiring
              </p>
              <Link
                href="/signin"
                onClick={close}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Tizimga kirish
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}
