"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfessionalSidebar from "../components/ProfessionalSidebar";
import SearchAndFilters from "../components/SearchAndFilters";
import { Bell, User, Eye, UserPlus } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  const metrics = [
    { label: "Sites", value: "156", change: "+12", sublabel: "Total sites" },
    { label: "Published", value: "143", change: "+8", sublabel: "Live sites" },
    { label: "DD", value: "89", change: "+23", sublabel: "Due diligence" },
    { label: "3-Click", value: "67", change: "+15", sublabel: "Quick builds" },
    { label: "Domains", value: "134", change: "+9", sublabel: "Purchased" },
    { label: "Phone", value: "145", change: "+11", sublabel: "Active numbers" },
    { label: "GMBs", value: "128", change: "-3", sublabel: "Business profiles" },
    { label: "Keywords", value: "24.5k", change: "", sublabel: "Tracked KWs" },
  ];

  const researchActivity = [
    {
      user: "Kyle Smith",
      email: "k@example.com",
      tenant: "Acme Corp",
      niche: "Dentist Miami FL",
      date: "09/12",
      status: "Built",
    },
    {
      user: "Jane Doe",
      email: "jane@example.com",
      tenant: "Globex Inc",
      niche: "Plumber Austin TX",
      date: "09/11",
      status: "Building",
    },
    {
      user: "John Smith",
      email: "john@example.com",
      tenant: "Acme Corp",
      niche: "Lawyer NYC",
      date: "09/10",
      status: "Built",
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <ProfessionalSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <h1 className="text-xl font-bold text-foreground">SitePanda</h1>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </button>
            
            <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">K</span>
              </div>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="text-sm text-muted-foreground mb-2">{metric.label}</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-foreground">{metric.value}</div>
                  {metric.change && (
                    <span className={metric.change.startsWith('+') ? 'text-green-600 text-sm font-medium' : 'text-red-600 text-sm font-medium'}>
                      {metric.change}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{metric.sublabel}</div>
              </div>
            ))}
          </div>

          {/* Search and Filters */}
          <SearchAndFilters />

          {/* Research Activity Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Research Activity</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Niche + Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Build Site</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {researchActivity.map((activity, index) => (
                    <tr key={index} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{activity.user}</div>
                        <div className="text-xs text-muted-foreground">{activity.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{activity.tenant}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{activity.niche}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{activity.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={activity.status === "Built" 
                          ? "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                          : "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }>
                          {activity.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors">
                            <UserPlus className="w-4 h-4" />
                            Impersonate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

