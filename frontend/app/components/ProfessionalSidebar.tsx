"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Lightbulb,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function ProfessionalSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Clients", path: "/clients" },
    { icon: FolderOpen, label: "Projects", path: "/projects" },
    { icon: Lightbulb, label: "Opportunities", path: "/opportunities" },
    { icon: FileText, label: "Notes", path: "/notes" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <aside
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-card border-r border-border transition-all duration-300 flex flex-col`}
    >
      {/* Logo/Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-6">
        {!isCollapsed && (
          <div>
            <h1 className="text-lg font-bold text-foreground">Unified Ops</h1>
            <p className="text-xs text-muted-foreground">Platform</p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <button
          onClick={() => {
            localStorage.removeItem("token");
            router.push("/login");
          }}
          className="w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          {isCollapsed ? "↪" : "Logout"}
        </button>
      </div>
    </aside>
  );
}

