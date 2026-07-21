import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { firebaseAuth } from '@/services/firebase-auth';
import type { AuthUser } from '@/services/firebase-auth';

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  user: propUser, 
  className, 
  isOpen = false, 
  onToggle 
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [activeItem, setActiveItem] = useState(pathname);

  useEffect(() => {
    // Subscribe to Firebase auth changes
    const unsubscribe = firebaseAuth.onAuthChange((user) => {
      setAuthUser(user);
    });
    // Also check localStorage for immediate display
    const storedUser = firebaseAuth.getCurrentUser();
    if (storedUser) {
      setAuthUser(storedUser);
    }
    return unsubscribe;
  }, []);

  const isAuthenticated = !!authUser;
  const isAdmin = authUser?.role === 'ADMIN' || authUser?.role === 'admin';

  const handleLogout = async () => {
    await firebaseAuth.signOut();
    window.location.href = '/signin';
  };

  const navigationGroups = [
    {
      title: 'Asosiy',
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
          badge: null,
          requiresAuth: true,
          adminOnly: false,
        }
      ]
    },
    {
      title: 'Amaliyot',
      items: [
        {
          name: 'Case Solver',
          href: '/case-solver',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ),
          badge: null,
          requiresAuth: true,
          adminOnly: false,
        },
        {
          name: 'Court Simulator',
          href: '/court-simulator',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          ),
          badge: 'Yangi',
          requiresAuth: true,
          adminOnly: false,
        },
        {
          name: 'Decision Tree',
          href: '/decision-tree',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          badge: null,
          requiresAuth: true,
          adminOnly: false,
        }
      ]
    },
    {
      title: 'Resurslar',
      items: [
        {
          name: 'Legal Database',
          href: '/legal-database',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
          badge: null,
          requiresAuth: true,
          adminOnly: false,
        },

        {
          name: 'Document Generator',
          href: '/document-generator',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          badge: null,
          requiresAuth: true,
          adminOnly: false,
        },
        {
          name: 'Professional Tools',
          href: '/professional-tools',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          badge: 'Pro',
          requiresAuth: true,
          adminOnly: false,
        },
        {
          name: 'AI Assistant',
          href: '/ai-assistant',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          ),
          badge: null,
          requiresAuth: true,
          adminOnly: false,
        }
      ]
    },
    {
      title: 'Shaxsiy',
      items: [
        {
          name: 'Sozlamalar',
          href: '/profile?tab=settings',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          badge: null,
          requiresAuth: true,
          adminOnly: false,
        },
        {
          name: 'Premium',
          href: '/premium',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          badge: 'Pro',
          requiresAuth: true,
          adminOnly: false,
        },
        {
          name: 'Yordam',
          href: '/help',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          badge: null,
          requiresAuth: true,
          adminOnly: false,
        },
        {
          name: 'Admin Panel',
          href: '/admin',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
          badge: null,
          requiresAuth: true,
          adminOnly: true,
        }
      ]
    }
  ];

  useEffect(() => {
    setActiveItem(pathname);
  }, [pathname]);

  const handleNavigation = (href: string) => {
    router.push(href);
    if (onToggle && typeof window !== 'undefined' && window.innerWidth < 768) {
      onToggle();
    }
  };

  const displayUser = authUser || propUser;

  return (
    <div className={cn("flex flex-col w-64 bg-gray-900 h-screen sticky top-0 overflow-y-auto hidden md:flex", className || "")}>
      {/* Logo */}
      <div className="flex items-center h-16 px-6 bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">J</span>
          </div>
          <span className="text-white font-semibold text-lg">JURISAI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-8">
        {navigationGroups.map((group) => {
          const filteredItems = group.items.filter((item: any) => {
            if (!isAuthenticated && item.requiresAuth) return false;
            if (item.adminOnly && !isAdmin) return false;
            return true;
          });
          if (filteredItems.length === 0) return null;
          return (
            <div key={group.title}>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {filteredItems.map((item: any) => (
                  <li key={item.name}>
                    <button
                      onClick={() => handleNavigation(item.href)}
                      className={cn(
                        "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        activeItem === item.href
                          ? "bg-blue-600 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <span className="mr-3 h-5 w-5">{item.icon}</span>
                      {item.name}
                      {item.badge && (
                        <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

      </nav>

      {/* User Section */}
      {isAuthenticated && displayUser && (
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-gray-300 text-sm font-medium">
                {displayUser.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {displayUser.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {displayUser.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-800 hover:text-white transition-colors"
          >
            <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Chiqish
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
