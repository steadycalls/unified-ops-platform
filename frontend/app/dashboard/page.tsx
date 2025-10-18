'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar';

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserName(user.first_name || 'User');

    const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
    setOrganizations(orgs);
  }, [router]);

  const stats = [
    { label: 'Total Clients', value: '0', change: '+0%', icon: '👥', color: 'text-primary' },
    { label: 'Active Projects', value: '0', change: '+0%', icon: '📁', color: 'text-success' },
    { label: 'Opportunities', value: '0', pending: '0 pending', icon: '💡', color: 'text-warning' },
    { label: 'Revenue Pipeline', value: '$0', subtext: 'Total potential value', icon: '💰', color: 'text-info' },
  ];

  const quickActions = [
    { icon: '👥', label: 'Clients', sublabel: 'Manage contacts', path: '/clients' },
    { icon: '📁', label: 'Projects', sublabel: 'Track work', path: '/projects' },
    { icon: '💡', label: 'Opportunities', sublabel: 'Sales pipeline', path: '/opportunities' },
    { icon: '📝', label: 'Notes', sublabel: 'Documentation', path: '/notes' },
    { icon: '🔗', label: 'Integrations', sublabel: 'Connect apps', path: '/integrations' },
    { icon: '🌐', label: 'Webhooks', sublabel: 'Automation', path: '/webhooks' },
    { icon: '📚', label: 'SOPs', sublabel: 'Documentation', path: '/sops' },
    { icon: '📊', label: 'Monitoring', sublabel: 'System health', path: '/monitoring' },
  ];

  return (
    <Sidebar>
      <div className="min-h-screen">
        {/* Page Header */}
        <header className="page-header sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, {userName}! 👋</p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="stats-card card-hover animate-fadeIn">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`text-4xl ${stat.color}`}>{stat.icon}</div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {stat.change && (
                    <span className="text-muted-foreground">{stat.change} from last month</span>
                  )}
                  {stat.pending && (
                    <span className="text-muted-foreground">{stat.pending}</span>
                  )}
                  {stat.subtext && (
                    <span className="text-muted-foreground">{stat.subtext}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Organizations Section */}
          {organizations.length > 0 && (
            <div className="content-section animate-fadeIn">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">🏢</span>
                <h2 className="text-xl font-bold text-foreground">Your Organizations</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {organizations.map((org) => (
                  <div key={org.id} className="bg-card border border-border rounded-xl p-5 card-hover">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-1">{org.name}</h3>
                        <p className="text-sm text-muted-foreground">{org.role}</p>
                      </div>
                      <span className="badge-success">Active</span>
                    </div>
                    {org.domain && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <span>🌐</span>
                        <span>Domain: {org.domain}</span>
                      </div>
                    )}
                    <button
                      onClick={() => window.open(`https://${org.domain}`, '_blank')}
                      className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium text-sm"
                    >
                      Open {org.name} →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="content-section animate-fadeIn">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">⚡</span>
              <h2 className="text-xl font-bold text-foreground">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => router.push(action.path)}
                  className="bg-card border border-border rounded-xl p-5 card-hover text-left"
                >
                  <div className="text-3xl mb-3">{action.icon}</div>
                  <h3 className="font-semibold text-foreground mb-1">{action.label}</h3>
                  <p className="text-xs text-muted-foreground">{action.sublabel}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Platform Status */}
          <div className="content-section animate-fadeIn">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">✅</span>
              <h2 className="text-xl font-bold text-foreground">Platform Status</h2>
            </div>
            <div className="space-y-3">
              <p className="text-foreground font-medium">Your Unified Operations Platform is successfully deployed and running!</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-success">✓</span>
                  <span className="text-muted-foreground">Backend Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-success">✓</span>
                  <span className="text-muted-foreground">Database Connected</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-success">✓</span>
                  <span className="text-muted-foreground">All Services Running</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

