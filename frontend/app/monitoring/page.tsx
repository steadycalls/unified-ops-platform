'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MonitoringPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [integrationData, setIntegrationData] = useState<any>(null);
  const [sopData, setSopData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch all monitoring data
      const [dashboard, performance, users, integrations, sop] = await Promise.all([
        fetch(`/api/v1/${orgSlug}/monitoring/dashboard?range=${timeRange}`, { headers }).then(r => r.json()),
        fetch(`/api/v1/${orgSlug}/monitoring/performance`, { headers }).then(r => r.json()),
        fetch(`/api/v1/${orgSlug}/monitoring/users?range=${timeRange}`, { headers }).then(r => r.json()),
        fetch(`/api/v1/${orgSlug}/monitoring/integrations`, { headers }).then(r => r.json()),
        fetch(`/api/v1/${orgSlug}/monitoring/sop-analytics`, { headers }).then(r => r.json())
      ]);

      setDashboardData(dashboard.data);
      setPerformanceData(performance.data);
      setUserData(users.data);
      setIntegrationData(integrations.data);
      setSopData(sop.data);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  const formatPercent = (num: number) => {
    return `${(num * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading monitoring data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📊 Monitoring Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Real-time system metrics and analytics</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button onClick={() => router.push('/dashboard')} className="px-3 py-2 text-gray-600 hover:text-gray-900">
                ← Back
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 overflow-x-auto">
            {[
              { id: 'overview', label: '📈 Overview', icon: '📈' },
              { id: 'performance', label: '⚡ Performance', icon: '⚡' },
              { id: 'users', label: '👥 Users', icon: '👥' },
              { id: 'integrations', label: '🔗 Integrations', icon: '🔗' },
              { id: 'sop', label: '📚 SOPs', icon: '📚' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Total Clients</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">{formatNumber(dashboardData.overview.totalClients)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Active Projects</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">{formatNumber(dashboardData.overview.activeProjects)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Open Opportunities</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">{formatNumber(dashboardData.overview.openOpportunities)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Pipeline Value</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">{formatCurrency(dashboardData.overview.pipelineValue)}</p>
              </div>
            </div>

            {/* Activity Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Daily Activity</h2>
              <div className="space-y-2">
                {dashboardData.activity.daily.map((day: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-600">{new Date(day.date).toLocaleDateString()}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6">
                      <div
                        className="bg-blue-600 h-6 rounded-full flex items-center justify-end px-2 text-white text-xs"
                        style={{ width: `${Math.min(100, (day.count / Math.max(...dashboardData.activity.daily.map((d: any) => d.count))) * 100)}%` }}
                      >
                        {day.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Users */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Top Active Users</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">User</th>
                      <th className="text-right py-2 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.activity.topUsers.map((user: any, idx: number) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 px-4">{user.full_name || user.email}</td>
                        <td className="text-right py-2 px-4">{formatNumber(user.activity_count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Project Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Projects by Status</h2>
                <div className="space-y-3">
                  {dashboardData.projects.byStatus.map((status: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="capitalize">{status.status}</span>
                      <span className="font-semibold">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Opportunities by Stage</h2>
                <div className="space-y-3">
                  {dashboardData.opportunities.byStage.map((stage: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="capitalize">{stage.stage}</span>
                      <div className="text-right">
                        <div className="font-semibold">{stage.count}</div>
                        <div className="text-sm text-gray-600">{formatCurrency(stage.total_value)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && performanceData && (
          <div className="space-y-6">
            {/* Database Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Database Tables</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Table</th>
                      <th className="text-right py-2 px-4">Size</th>
                      <th className="text-right py-2 px-4">Live Rows</th>
                      <th className="text-right py-2 px-4">Dead Rows</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.database.tables.slice(0, 10).map((table: any, idx: number) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 px-4">{table.tablename}</td>
                        <td className="text-right py-2 px-4">{table.size}</td>
                        <td className="text-right py-2 px-4">{formatNumber(table.live_rows)}</td>
                        <td className="text-right py-2 px-4">{formatNumber(table.dead_rows)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Webhook Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Webhook Delivery Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {performanceData.webhooks.byStatus.map((stat: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="text-sm text-gray-600 capitalize">{stat.status}</div>
                    <div className="text-2xl font-bold mt-2">{formatNumber(stat.count)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Avg: {stat.avg_duration ? `${Math.round(stat.avg_duration)}ms` : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Rate */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Error Rate (Last 7 Days)</h2>
              <div className="space-y-2">
                {performanceData.errors.daily.map((day: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-600">{new Date(day.date).toLocaleDateString()}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6">
                      <div
                        className="bg-red-600 h-6 rounded-full flex items-center justify-end px-2 text-white text-xs"
                        style={{ width: `${Math.min(100, (day.count / Math.max(...performanceData.errors.daily.map((d: any) => d.count))) * 100)}%` }}
                      >
                        {day.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && userData && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">User Activity</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">User</th>
                      <th className="text-right py-2 px-4">Active Days</th>
                      <th className="text-right py-2 px-4">Total Actions</th>
                      <th className="text-right py-2 px-4">Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userData.users.map((user: any, idx: number) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 px-4">{user.full_name || user.email}</td>
                        <td className="text-right py-2 px-4">{user.active_days}</td>
                        <td className="text-right py-2 px-4">{formatNumber(user.total_actions)}</td>
                        <td className="text-right py-2 px-4 text-sm text-gray-600">
                          {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Most Common Actions</h2>
              <div className="space-y-2">
                {userData.commonActions.slice(0, 10).map((action: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <span className="font-medium">{action.action}</span>
                      <span className="text-sm text-gray-600 ml-2">({action.entity_type})</span>
                    </div>
                    <span className="font-semibold">{formatNumber(action.count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && integrationData && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Integration Health</h2>
              <div className="space-y-4">
                {integrationData.integrations.map((integration: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{integration.name}</h3>
                        <p className="text-sm text-gray-600">{integration.integration_type}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${integration.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {integration.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Total Logs</div>
                        <div className="font-semibold">{formatNumber(integration.log_count)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Success</div>
                        <div className="font-semibold text-green-600">{formatNumber(integration.success_count)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Errors</div>
                        <div className="font-semibold text-red-600">{formatNumber(integration.error_count)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Webhook Health</h2>
              <div className="space-y-4">
                {integrationData.webhooks.map((webhook: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{webhook.name}</h3>
                        <p className="text-sm text-gray-600">{webhook.url}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${webhook.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {webhook.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Deliveries</div>
                        <div className="font-semibold">{formatNumber(webhook.delivery_count)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Delivered</div>
                        <div className="font-semibold text-green-600">{formatNumber(webhook.delivered_count)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Failed</div>
                        <div className="font-semibold text-red-600">{formatNumber(webhook.failed_count)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Avg Duration</div>
                        <div className="font-semibold">{webhook.avg_duration ? `${Math.round(webhook.avg_duration)}ms` : 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SOP Tab */}
        {activeTab === 'sop' && sopData && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Most Viewed Pages</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Title</th>
                      <th className="text-center py-2 px-4">Visibility</th>
                      <th className="text-right py-2 px-4">Total Views</th>
                      <th className="text-right py-2 px-4">Unique Viewers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sopData.mostViewed.map((page: any, idx: number) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 px-4">{page.title}</td>
                        <td className="text-center py-2 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${page.visibility === 'public' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {page.visibility}
                          </span>
                        </td>
                        <td className="text-right py-2 px-4">{formatNumber(page.view_count)}</td>
                        <td className="text-right py-2 px-4">{formatNumber(page.unique_viewers)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Views by Category</h2>
                <div className="space-y-3">
                  {sopData.viewsByCategory.map((category: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{category.category_name}</div>
                        <div className="text-sm text-gray-600">{category.page_count} pages</div>
                      </div>
                      <div className="font-semibold">{formatNumber(category.total_views)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Popular Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {sopData.popularTags.map((tag: any, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {tag.name} ({tag.usage_count})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

