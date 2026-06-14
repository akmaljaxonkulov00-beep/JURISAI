'use client';

import { ArrowLeft, Home as HomeIcon, BookOpen, Award, Settings, Scale, GitBranch, Play, MessageCircle, GraduationCap, Target, Gavel, User, Star, Database, Users, BarChart3, CheckCircle, Trophy } from 'lucide-react';

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
    { id: 'ai-assistant', label: 'AI Yordamchi', icon: <MessageCircle className="w-5 h-5" />, href: '/ai-assistant' },
    { id: 'my-courses', label: 'Mening kurslarim', icon: <GraduationCap className="w-5 h-5" />, href: '/my-courses' },
    { id: 'profile', label: 'Profil', icon: <User className="w-5 h-5" />, href: '/profile' },
    { id: 'professional-tools', label: 'Pro Vositalar', icon: <Star className="w-5 h-5" />, href: '/professional-tools' },
    { id: 'legal-database', label: 'Qonunlar bazasi', icon: <Database className="w-5 h-5" />, href: '/legal-database' },
    { id: 'community', label: 'Jamiyat', icon: <Users className="w-5 h-5" />, href: '/community' },
    { id: 'statistics', label: 'Statistika', icon: <BarChart3 className="w-5 h-5" />, href: '/statistics' },
    { id: 'tasks', label: 'Topshiriqlar', icon: <CheckCircle className="w-5 h-5" />, href: '/tasks' },
    { id: 'achievements', label: 'Yutuqlar', icon: <Trophy className="w-5 h-5" />, href: '/achievements' },
    { id: 'settings', label: 'Sozlamalar', icon: <Settings className="w-5 h-5" />, href: '#' },
  ];

  const isActive = (id: string) => {
    if (currentPage === 'home' && id === 'home') return true;
    if (currentPage === 'case-solver' && id === 'case-solver') return true;
    if (currentPage === 'decision-tree' && id === 'decision-tree') return true;
    if (currentPage === 'virtual-court' && id === 'virtual-court') return true;
    if (currentPage === 'simulator' && id === 'simulator') return true;
    if (currentPage === 'ai-assistant' && id === 'ai-assistant') return true;
    if (currentPage === 'my-courses' && id === 'my-courses') return true;
    if (currentPage === 'profile' && id === 'profile') return true;
    if (currentPage === 'professional-tools' && id === 'professional-tools') return true;
    if (currentPage === 'legal-database' && id === 'legal-database') return true;
    if (currentPage === 'community' && id === 'community') return true;
    if (currentPage === 'statistics' && id === 'statistics') return true;
    if (currentPage === 'tasks' && id === 'tasks') return true;
    if (currentPage === 'achievements' && id === 'achievements') return true;
    if (currentPage === 'settings' && id === 'settings') return true;
    return false;
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
