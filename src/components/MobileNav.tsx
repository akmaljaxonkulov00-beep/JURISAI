'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bot, Building2, Target, Scale, FileSearch, BookOpen, FileText, Search, Play, GitBranch, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const NAV_ITEMS = [
  { href: '/dashboard',        label: 'Bosh sahifa',      icon: LayoutDashboard },
  { href: '/ai-assistant',     label: 'AI Yordamchi',     icon: Bot },
  { href: '/court-simulator',  label: 'Sud Simulyator',   icon: Building2 },
  { href: '/simulator',        label: 'Simulyator',       icon: Target },
  { href: '/virtual-court',    label: 'Virtual Sud',      icon: Scale },
  { href: '/irac',             label: 'IRAC Tahlil',      icon: FileSearch },
  { href: '/legal-database',   label: 'Qonunlar Bazasi',  icon: BookOpen },
  { href: '/document-generator', label: 'Hujjat Yaratish', icon: FileText },
  { href: '/weakness-detector', label: 'Zaiflik Aniqlash', icon: Search },
  { href: '/scenario-generator', label: 'Stsenariy',      icon: Play },
  { href: '/decision-tree',    label: 'Qaror Daraxti',    icon: GitBranch },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { dark, toggle: toggleTheme } = useTheme();

  return (
    <>
      {/* Hamburger tugma — faqat mobilda ko'rinadi */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-md"
        aria-label="Menyu ochish"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round">
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

      {/* Menyu paneli */}
      <nav
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">J</span>
            </div>
            <span className="font-bold text-gray-800 dark:text-white">JURISAI</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
              aria-label={dark ? 'Yorug\' rejim' : 'Qorong\'i rejim'}
              title={dark ? 'Yorug\' rejim' : 'Qorong\'i rejim'}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              aria-label="Menyu yopish"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gray-500 dark:text-gray-400">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Nav links */}
        <div className="overflow-y-auto h-[calc(100%-65px)] py-2">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 mx-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
