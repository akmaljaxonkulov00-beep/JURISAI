'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard',        label: 'Bosh sahifa',      icon: '🏠' },
  { href: '/ai-assistant',     label: 'AI Yordamchi',     icon: '🤖' },
  { href: '/court-simulator',  label: 'Sud Simulyator',   icon: '🏛️' },
  { href: '/simulator',        label: 'Simulyator',       icon: '🎯' },
  { href: '/virtual-court',    label: 'Virtual Sud',      icon: '⚖️' },
  { href: '/irac',             label: 'IRAC Tahlil',      icon: '📋' },
  { href: '/legal-database',   label: 'Qonunlar Bazasi',  icon: '📚' },
  { href: '/document-generator', label: 'Hujjat Yaratish', icon: '📄' },
  { href: '/weakness-detector', label: 'Zaiflik Aniqlash', icon: '🔍' },
  { href: '/scenario-generator', label: 'Stsenariy',      icon: '🎬' },
  { href: '/decision-tree',    label: 'Qaror Daraxti',    icon: '🌳' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">J</span>
            </div>
            <span className="font-bold text-gray-800">JURISAI</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Menyu yopish"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <div className="overflow-y-auto h-[calc(100%-65px)] py-2">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href;
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
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
