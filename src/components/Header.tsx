'use client'

import { Search, Bell, Globe, User } from 'lucide-react'

interface HeaderProps {
  title?: string
  subtitle?: string
  showSearch?: boolean
  showNotifications?: boolean
}

export default function Header({
  title = 'JurisAI',
  subtitle = "Huquqiy ta'lim platformasi",
  showSearch = true,
  showNotifications = true,
}: HeaderProps) {
  return (
    <header className="bg-white dark:bg-zinc-900 px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-100 dark:border-zinc-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-zinc-100">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400">{subtitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          {showSearch && (
            <div className="flex items-center gap-2 w-full sm:w-auto sm:max-w-xl">
              <div className="relative flex-1 sm:min-w-[220px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-zinc-500 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Qidirish..."
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="px-3 sm:px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                Filter
              </button>
            </div>
          )}

          {/* Right Side Actions */}
          <div className="flex items-center justify-end gap-2 sm:gap-4">
            {/* Notifications */}
            {showNotifications && (
              <button className="relative p-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-50 dark:bg-red-900/20 rounded-full"></span>
              </button>
            )}

            {/* Language Selector */}
            <button className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm">UZ</span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm">
                S
              </div>
              <span className="hidden sm:inline font-medium text-gray-800 dark:text-zinc-100">
                Sarvar K.
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
