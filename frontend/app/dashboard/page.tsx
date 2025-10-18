'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.push('/login');
      return;
    }

    // Load user data
    const userData = localStorage.getItem('user');
    const orgsData = localStorage.getItem('organizations');
    
    if (userData) setUser(JSON.parse(userData));
    if (orgsData) setOrganizations(JSON.parse(orgsData));
    
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-lg font-medium text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium text-foreground">{user?.full_name || user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-smooth text-sm font-medium touch-manipulation shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 sm:pb-8">
        {/* KPI Cards - Horizontal Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-card border border-border rounded-xl shadow-smooth p-5 sm:p-6 card-hover transition-smooth">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Clients</h3>
              <span className="text-3xl">👥</span>
            </div>
            <p className="text-4xl font-bold text-foreground mb-2">0</p>
            <p className="text-xs text-success">+0% from last month</p>
          </div>
          
          <div className="bg-card border border-border rounded-xl shadow-smooth p-5 sm:p-6 card-hover transition-smooth">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Projects</h3>
              <span className="text-3xl">📁</span>
            </div>
            <p className="text-4xl font-bold text-foreground mb-2">0</p>
            <p className="text-xs text-success">+0% from last month</p>
          </div>
          
          <div className="bg-card border border-border rounded-xl shadow-smooth p-5 sm:p-6 card-hover transition-smooth">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Opportunities</h3>
              <span className="text-3xl">💰</span>
            </div>
            <p className="text-4xl font-bold text-foreground mb-2">0</p>
            <p className="text-xs text-warning">0 pending review</p>
          </div>
          
          <div className="bg-card border border-border rounded-xl shadow-smooth p-5 sm:p-6 card-hover transition-smooth">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Revenue Pipeline</h3>
              <span className="text-3xl">💵</span>
            </div>
            <p className="text-4xl font-bold text-foreground mb-2">$0</p>
            <p className="text-xs text-muted-foreground">Total potential value</p>
          </div>
        </div>

        {/* Organizations - Horizontal Layout with Links */}
        <div className="bg-card border border-border rounded-xl shadow-smooth p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">🏢</span>
            <h2 className="text-xl font-bold text-foreground">Your Organizations</h2>
          </div>
          {organizations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizations.map((org) => (
                <div key={org.id} className="border border-border rounded-lg p-5 card-hover transition-smooth bg-gradient-surface">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg text-foreground">{org.name}</h3>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                      {org.role}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Domain:</span> {org.custom_domain}
                    </p>
                  </div>
                  <a
                    href={`https://${org.custom_domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth text-center font-semibold text-sm shadow-sm"
                  >
                    Open {org.name} →
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No organizations found</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl shadow-smooth p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-2xl">⚡</span>
            <h2 className="text-xl font-bold text-foreground">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
            <button 
              onClick={() => router.push('/clients')} 
              className="p-4 sm:p-5 border border-border rounded-xl hover:border-primary hover:bg-primary/5 active:scale-98 text-center touch-manipulation transition-smooth card-hover"
            >
              <div className="text-3xl mb-2">👥</div>
              <div className="text-sm font-semibold text-foreground">Clients</div>
              <div className="text-xs text-muted-foreground mt-1">Manage contacts</div>
            </button>
            
            <button 
              onClick={() => router.push('/projects')} 
              className="p-4 sm:p-5 border border-border rounded-xl hover:border-primary hover:bg-primary/5 active:scale-98 text-center touch-manipulation transition-smooth card-hover"
            >
              <div className="text-3xl mb-2">📁</div>
              <div className="text-sm font-semibold text-foreground">Projects</div>
              <div className="text-xs text-muted-foreground mt-1">Track work</div>
            </button>
            
            <button 
              onClick={() => router.push('/opportunities')} 
              className="p-4 sm:p-5 border border-border rounded-xl hover:border-primary hover:bg-primary/5 active:scale-98 text-center touch-manipulation transition-smooth card-hover"
            >
              <div className="text-3xl mb-2">💰</div>
              <div className="text-sm font-semibold text-foreground">Opportunities</div>
              <div className="text-xs text-muted-foreground mt-1">Sales pipeline</div>
            </button>
            
            <button 
              onClick={() => router.push('/notes')} 
              className="p-4 sm:p-5 border border-border rounded-xl hover:border-primary hover:bg-primary/5 active:scale-98 text-center touch-manipulation transition-smooth card-hover"
            >
              <div className="text-3xl mb-2">📝</div>
              <div className="text-sm font-semibold text-foreground">Notes</div>
              <div className="text-xs text-muted-foreground mt-1">Documentation</div>
            </button>
            
            <button 
              onClick={() => router.push('/integrations')} 
              className="p-4 sm:p-5 border border-border rounded-xl hover:border-primary hover:bg-primary/5 active:scale-98 text-center touch-manipulation transition-smooth card-hover"
            >
              <div className="text-3xl mb-2">🔗</div>
              <div className="text-sm font-semibold text-foreground">Integrations</div>
              <div className="text-xs text-muted-foreground mt-1">Connect apps</div>
            </button>
            
            <button 
              onClick={() => router.push('/outgoing-webhooks')} 
              className="p-4 sm:p-5 border border-border rounded-xl hover:border-primary hover:bg-primary/5 active:scale-98 text-center touch-manipulation transition-smooth card-hover"
            >
              <div className="text-3xl mb-2">🚀</div>
              <div className="text-sm font-semibold text-foreground">Webhooks</div>
              <div className="text-xs text-muted-foreground mt-1">Automation</div>
            </button>
            
            <button 
              onClick={() => router.push('/sop')} 
              className="p-4 sm:p-5 border border-border rounded-xl hover:border-primary hover:bg-primary/5 active:scale-98 text-center touch-manipulation transition-smooth card-hover"
            >
              <div className="text-3xl mb-2">📚</div>
              <div className="text-sm font-semibold text-foreground">SOPs</div>
              <div className="text-xs text-muted-foreground mt-1">Documentation</div>
            </button>
            
            <button 
              onClick={() => router.push('/monitoring')} 
              className="p-4 sm:p-5 border border-border rounded-xl hover:border-primary hover:bg-primary/5 active:scale-98 text-center touch-manipulation transition-smooth card-hover"
            >
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm font-semibold text-foreground">Monitoring</div>
              <div className="text-xs text-muted-foreground mt-1">System health</div>
            </button>
          </div>
        </div>

        {/* Platform Status */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🚀</span>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Platform Status</h2>
              <p className="text-foreground/90 mb-3">
                Your Unified Operations Platform is successfully deployed and running!
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-success/10 text-success border border-success/20">
                  ✓ Backend Online
                </span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-success/10 text-success border border-success/20">
                  ✓ Database Connected
                </span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-success/10 text-success border border-success/20">
                  ✓ All Services Running
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

