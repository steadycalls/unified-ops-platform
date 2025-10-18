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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">{user?.full_name || user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm touch-manipulation"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 sm:pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {/* KPI Cards */}
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Clients</h3>
            <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900">0</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Active Projects</h3>
            <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900">0</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Open Opportunities</h3>
            <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900">0</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-500">Revenue Pipeline</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">$0</p>
          </div>
        </div>

        {/* Organizations */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Organizations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {organizations.map((org) => (
              <div key={org.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900">{org.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Role: {org.role}</p>
                <p className="text-sm text-gray-500">Domain: {org.custom_domain}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            <button onClick={() => router.push('/clients')} className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 active:bg-gray-100 text-center touch-manipulation transition-colors">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm font-medium">Clients</div>
            </button>
            
            <button onClick={() => router.push('/projects')} className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 active:bg-gray-100 text-center touch-manipulation transition-colors">
              <div className="text-2xl mb-2">📁</div>
              <div className="text-sm font-medium">Projects</div>
            </button>
            
            <button onClick={() => router.push('/opportunities')} className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 active:bg-gray-100 text-center touch-manipulation transition-colors">
              <div className="text-2xl mb-2">💰</div>
              <div className="text-sm font-medium">Opportunities</div>
            </button>
            
            <button onClick={() => router.push('/notes')} className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 active:bg-gray-100 text-center touch-manipulation transition-colors">
              <div className="text-2xl mb-2">📝</div>
              <div className="text-sm font-medium">Notes</div>
            </button>
            
            <button onClick={() => router.push('/integrations')} className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 active:bg-gray-100 text-center touch-manipulation transition-colors">
              <div className="text-2xl mb-2">🔗</div>
              <div className="text-sm font-medium">Integrations</div>
            </button>
            
            <button onClick={() => router.push('/outgoing-webhooks')} className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 active:bg-gray-100 text-center touch-manipulation transition-colors">
              <div className="text-2xl mb-2">🚀</div>
              <div className="text-sm font-medium">Outgoing Webhooks</div>
            </button>
            
            <button onClick={() => router.push('/sop')} className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 active:bg-gray-100 text-center touch-manipulation transition-colors">
              <div className="text-2xl mb-2">📚</div>
              <div className="text-sm font-medium">SOPs & Docs</div>
            </button>
            
            <button onClick={() => router.push('/monitoring')} className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 active:bg-gray-100 text-center touch-manipulation transition-colors">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm font-medium">Monitoring</div>
            </button>
          </div>
        </div>

        {/* Platform Status */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">🚀 Platform Status</h2>
          <p className="text-blue-800">
            Your Unified Operations Platform is successfully deployed and running!
          </p>
          <p className="text-sm text-blue-700 mt-2">
            This is a functional MVP. Full features for Clients, Projects, Opportunities, Notes, and Integrations are ready to be implemented.
          </p>
        </div>
      </main>
    </div>
  );
}

