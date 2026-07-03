import { useState, type ReactNode } from 'react';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { ThemeProvider } from '@/lib/ThemeContext';

interface LayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <ThemeProvider>
      <div className="min-h-0 min-w-0 bg-semantic-0 flex flex-col h-screen">
        <AppHeader />
        <div className="min-h-0 min-w-0 flex flex-1 overflow-hidden">
          <AppSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />
          <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
