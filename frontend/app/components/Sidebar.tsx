'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { icon: '📊', label: 'Dashboard', path: '/dashboard' },
    { icon: '👥', label: 'Clients', path: '/clients' },
    { icon: '📁', label: 'Projects', path: '/projects' },
    { icon: '💡', label: 'Opportunities', path: '/opportunities' },
    { icon: '📝', label: 'Notes', path: '/notes' },
    { icon: '🐼', label: 'SitePanda SEO', path: '/sitepandaseo' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-sidebar-background border-r border-sidebar-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-sidebar-border flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-2xl">
            🏢
          </div>
          {isSidebarOpen && (
            <div>
              <h1 className="text-lg font-bold text-foreground">Unified Ops</h1>
              <p className="text-xs text-muted-foreground">Platform</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                isActive(item.path)
                  ? 'bg-primary/10 text-primary border-l-4 border-primary pl-3'
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {isSidebarOpen && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              K
            </div>
            {isSidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Kyle Roelofs</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            )}
          </div>
          {isSidebarOpen && (
            <button
              onClick={() => {
                localStorage.removeItem('accessToken');
                router.push('/login');
              }}
              className="w-full mt-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-lg transition-smooth"
            >
              Logout
            </button>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-4 border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-smooth"
        >
          {isSidebarOpen ? '◀' : '▶'}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

