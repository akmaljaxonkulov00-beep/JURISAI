import React, { useState } from 'react';
import { Header } from './Header';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  showSidebar?: boolean;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  showSidebar = true, 
  className 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      <Header user={user} />
      
      <div className="flex">
        {showSidebar && (
          <>
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
            
            {/* Sidebar */}
            <div className={cn(
              'fixed inset-y-0 left-0 z-50 lg:static lg:inset-0',
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
              'transition-transform duration-300 ease-in-out'
            )}>
              <Sidebar
                user={user}
                isOpen={isSidebarOpen}
                onToggle={toggleSidebar}
              />
            </div>
          </>
        )}
        
        {/* Main Content */}
        <main className={cn(
          'flex-1',
          showSidebar && 'lg:ml-0'
        )}>
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export { Layout };
