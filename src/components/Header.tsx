'use client';

import { Search, Bell, Globe, User } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
}

export default function Header({ 
  title = 'JurisAI', 
  subtitle = 'Huquqiy ta\'lim platformasi',
  showSearch = true,
  showNotifications = true 
}: HeaderProps) {
  return (
    <header className="bg-white px-8 py-4 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          {showSearch && (
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Qidirish..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Filter
              </button>
            </div>
          )}
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            {showNotifications && (
              <button className="relative p-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            )}
            
            {/* Language Selector */}
            <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              <Globe className="w-5 h-5" />
              <span className="text-sm">UZ</span>
            </button>
            
            {/* User Profile */}
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                S
              </div>
              <span className="font-medium text-gray-800">Sarvar K.</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
