'use client';

import { Home as HomeIcon, Scale, GitBranch, Play, Target, Gavel, User, Star, Database, Users, BarChart3 } from 'lucide-react';

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
    <div className="w-64 bg-white border-r border-gray-100 min-h-screen">
      <div className="p-6">
        {/* Daily Goal Block */}
        <div className="bg-orange-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-gray-800">Kundalik maqsad</span>
            </div>
          </div>
          <div className="mb-2">
            <div className="bg-gray-200 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
          <p className="text-sm text-gray-600">2 ta case qolgan</p>
        </div>

        {/* Menu Items */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.id)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              <span className={isActive(item.id) ? 'font-medium' : ''}>{item.label}</span>
            </a>
          ))}
        </nav>

        {/* Premium Button */}
        <button className="w-full mt-8 bg-orange-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors">
          Premiumga o'tish
        </button>
      </div>
    </div>
  );
}
