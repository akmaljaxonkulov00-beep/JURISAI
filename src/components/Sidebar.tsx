'use client';

'use client';

import Link from 'next/link';
import { Home as HomeIcon, Scale, GitBranch, Play, Target, Gavel, User, Star, Database, Users, BarChart3, LogOut } from 'lucide-react';
import { firebaseAuth } from '@/services/firebase-auth';

interface SidebarProps {
  currentPage?: string;
}

export default function Sidebar({ currentPage = 'home' }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Bosh sahifa', icon: <HomeIcon className="w-5 h-5" />, href: '/' },
    { id: 'case-solver', label: 'Case Solver', icon: <Scale className="w-5 h-5" />, href: '/case-solver' },
    { id: 'decision-tree', label: 'Decision Tree', icon: <GitBranch className="w-5 h-5" />, href: '/decision-tree' },
    { id: 'virtual-court', label: 'Virtual Sud', icon: <Gavel className="w-5 h-5" />, href: '/virtual-court' },
    { id: 'simulator', label: 'Simulyator', icon: <Play className="w-5 h-5" />, href: '/simulator' },
    { id: 'profile', label: 'Profil', icon: <User className="w-5 h-5" />, href: '/profile' },
    { id: 'professional-tools', label: 'Pro Vositalar', icon: <Star className="w-5 h-5" />, href: '/professional-tools' },
    { id: 'legal-database', label: 'Qonunlar bazasi', icon: <Database className="w-5 h-5" />, href: '/legal-database' },
    { id: 'community', label: 'Jamiyat', icon: <Users className="w-5 h-5" />, href: '/community' },
    { id: 'statistics', label: 'Statistika', icon: <BarChart3 className="w-5 h-5" />, href: '/statistics' },
  ];

  const isActive = (id: string) => {
    return currentPage === id;
  };

  return (
    <div className="hidden lg:block w-64 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 min-h-screen flex-shrink-0">
      <div className="p-6">
        {/* Daily Goal Block */}
        <div className="bg-orange-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-gray-800 dark:text-zinc-200">Kundalik maqsad</span>
            </div>
          </div>
          <div className="mb-2">
            <div className="bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-zinc-400">2 ta case qolgan</p>
        </div>

        {/* Menu Items */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.id)
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                  : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:bg-zinc-800/50'
              }`}
            >
              {item.icon}
              <span className={isActive(item.id) ? 'font-medium' : ''}>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          onClick={async () => {
            await firebaseAuth.signOut();
          }}
          className="mt-4 w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Chiqish</span>
        </button>

        {/* Premium Button */}
        <Link
          href="/premium"
          className="w-full mt-8 bg-orange-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors text-center inline-block"
        >
          Premiumga o'tish
        </Link>
      </div>
    </div>
  );
}
