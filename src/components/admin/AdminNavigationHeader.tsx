'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Shield,
  Scale,
  Users,
  GraduationCap,
  CreditCard,
  LayoutDashboard,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'
import SiteLogo from '@/components/SiteLogo'

interface AdminNavigationHeaderProps {
  title?: string
  subtitle?: string
  children?: React.ReactNode
}

export default function AdminNavigationHeader({
  title,
  subtitle,
  children,
}: AdminNavigationHeaderProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/admin',
      label: 'Boshqaruv',
      icon: LayoutDashboard,
      active: pathname === '/admin',
    },
    {
      href: '/admin/advocates',
      label: 'Advokatlar Nazorati',
      icon: Scale,
      active: pathname.startsWith('/admin/advocates'),
      badge: 'Litsenziya',
    },
    {
      href: '/admin/citizens',
      label: 'Fuqarolar Nazorati',
      icon: Users,
      active: pathname.startsWith('/admin/citizens'),
      badge: 'Mijozlar',
    },
    {
      href: '/admin/students',
      label: 'Yurist-Talabalar',
      icon: GraduationCap,
      active: pathname.startsWith('/admin/students'),
      badge: 'Nomzodlar',
    },
    {
      href: '/admin/payments',
      label: 'To‘lovlar',
      icon: CreditCard,
      active: pathname.startsWith('/admin/payments'),
    },
    {
      href: '/admin/users',
      label: 'Barcha Foydalanuvchilar',
      icon: Users,
      active: pathname.startsWith('/admin/users'),
    },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Yuqori qator: Brend + Tezkor havolalar */}
        <div className="flex items-center justify-between h-16 border-b border-gray-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <SiteLogo size="sm" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 flex items-center gap-1.5">
                <Shield size={12} className="text-indigo-600 dark:text-indigo-400" />
                ADMIN NAZORAT TIZIMI
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Real-time
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {children}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <ArrowLeft size={13} />
              Platformaga qaytish
            </Link>
          </div>
        </div>

        {/* Quyi qator: 3 ta yangi tizim va asosiy navigatsiya tugmalari */}
        <div className="flex items-center gap-1 py-2 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  item.active
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 ring-2 ring-indigo-500/20'
                    : 'text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/70 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={15} className={item.active ? 'text-white' : 'text-gray-500 dark:text-zinc-400'} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                      item.active
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {title && (
        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800/40 border-t border-gray-100 dark:border-zinc-800/60 py-3.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
