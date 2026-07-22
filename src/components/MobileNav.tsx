'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Scale, Building2, GitBranch, BookOpen, FileText, Wrench, Crown, Settings, HelpCircle, Shield, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const NAV_GROUPS = [
  {
    title: 'Asosiy',
    items: [
      { href: '/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Amaliyot',
    items: [
      { href: '/case-solver', label: 'IRAC Huquqiy Tahlil', icon: Scale },
      { href: '/court-simulator', label: 'Sud Simulyatori', icon: Building2 },
      { href: '/decision-tree', label: 'Qarorlar Daraxti', icon: GitBranch },
    ]
  },
  {
    title: 'Resurslar',
    items: [
      { href: '/legal-database', label: 'Qonunlar Bazasi', icon: BookOpen },
      { href: '/document-generator', label: 'Hujjat Generator', icon: FileText },
      { href: '/professional-tools', label: 'Asboblar', icon: Wrench },
    ]
  },
  {
    title: 'Shaxsiy',
    items: [
      { href: '/premium', label: 'Premium', icon: Crown },
      { href: '/profile', label: 'Sozlamalar', icon: Settings },
      { href: '/help', label: 'Yordam', icon: HelpCircle },
      { href: '/admin', label: 'Admin Panel', icon: Shield },
    ]
  }
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { dark, toggle: toggleTheme } = useTheme();

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-zinc-700 rounded-lg shadow-md"
        aria-label="Menyu ochish"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gray-700 dark:text-zinc-300">
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

      {/* Menu panel */}
      <nav
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-zinc-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
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

        {/* Nav links by groups */}
        <div className="overflow-y-auto h-[calc(100%-65px)] py-3 px-3">
          {NAV_GROUPS.map(group => (
            <div key={group.title} className="mb-4">
              <p className="px-3 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800'
                          : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
