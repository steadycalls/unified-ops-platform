'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'integrations' | 'webhooks' | 'logs'>('integrations');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [formData, setFormData] = useState({
    integration_type: 'ghl',
    integration_name: '',
    api_key: '',
    location_id: ''
  });
  const [webhookFormData, setWebhookFormData] = useState({
    name: '',
    description: '',
    webhook_type: 'notes'
  });

  useEffect(() => {
    fetchIntegrations();
    fetchWebhooks();
    fetchLogs();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/integrations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Fetch integrations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhooks = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/webhooks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (error) {
      console.error('Fetch webhooks error:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/integration-logs?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Fetch logs error:', error);
    }
  };

  const handleCreateIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/integrations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          integration_type: formData.integration_type,
          integration_name: formData.integration_name,
          credentials: {
            api_key: formData.api_key,
            location_id: formData.location_id
          }
        })
      });

      if (response.ok) {
        setShowModal(false);
        setFormData({ integration_type: 'ghl', integration_name: '', api_key: '', location_id: '' });
        fetchIntegrations();
      }
    } catch (error) {
      console.error('Create integration error:', error);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/webhooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookFormData)
      });

      if (response.ok) {
        const data = await response.json();
        setShowWebhookModal(false);
        setWebhookFormData({ name: '', description: '', webhook_type: 'notes' });
        fetchWebhooks();
        setSelectedWebhook(data);
      }
    } catch (error) {
      console.error('Create webhook error:', error);
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/integrations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchIntegrations();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/webhooks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchWebhooks();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <div className="flex gap-4">
            <button onClick={() => router.push('/dashboard')} className="px-4 py-2 text-gray-600 hover:text-gray-900">
              ← Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button onClick={() => setActiveTab('integrations')} className={`${activeTab === 'integrations' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
              Integrations
            </button>
            <button onClick={() => setActiveTab('webhooks')} className={`${activeTab === 'webhooks' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
              Webhooks
            </button>
            <button onClick={() => setActiveTab('logs')} className={`${activeTab === 'logs' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
              Logs
            </button>
          </nav>
        </div>

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Connected Integrations</h2>
              <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                + Add Integration
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((integration) => (
                <div key={integration.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{integration.integration_name}</h3>
                      <p className="text-sm text-gray-500">{integration.integration_type.toUpperCase()}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getHealthStatusColor(integration.health_status)}`}>
                      {integration.health_status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {integration.last_sync_at && (
                      <div>Last sync: {new Date(integration.last_sync_at).toLocaleString()}</div>
                    )}
                    <div>Auto-sync: {integration.auto_sync_enabled ? 'Enabled' : 'Disabled'}</div>
                  </div>
                  
                  <button onClick={() => handleDeleteIntegration(integration.id)} className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                    Delete
                  </button>
                </div>
              ))}
            </div>

            {integrations.length === 0 && (
              <div className="text-center py-12 text-gray-500">No integrations configured</div>
            )}
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Webhooks</h2>
              <button onClick={() => setShowWebhookModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                + Create Webhook
              </button>
            </div>

            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{webhook.name}</h3>
                      <p className="text-sm text-gray-500">{webhook.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedWebhook(webhook)} className="text-blue-600 hover:text-blue-900 text-sm">
                        View Details
                      </button>
                      <button onClick={() => handleDeleteWebhook(webhook.id)} className="text-red-600 hover:text-red-900 text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-xs text-gray-500 mb-1">Webhook URL:</div>
                    <code className="text-sm text-gray-900 break-all">{webhook.webhook_url}</code>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Total Requests</div>
                      <div className="font-semibold">{webhook.total_requests || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Successful</div>
                      <div className="font-semibold text-green-600">{webhook.successful_requests || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Failed</div>
                      <div className="font-semibold text-red-600">{webhook.failed_requests || 0}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {webhooks.length === 0 && (
              <div className="text-center py-12 text-gray-500">No webhooks created</div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div>
            <h2 className="text-lg font-semibold mb-6">Integration Logs</h2>
            
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Integration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.integration_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getLogLevelColor(log.log_level)}`}>
                          {log.log_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.action}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {log.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && (
                <div className="text-center py-12 text-gray-500">No logs found</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add Integration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Add Integration</h2>
            <form onSubmit={handleCreateIntegration} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Integration Type</label>
                <select value={formData.integration_type} onChange={(e) => setFormData({...formData, integration_type: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md">
                  <option value="ghl">GoHighLevel</option>
                  <option value="google_calendar">Google Calendar</option>
                  <option value="niftypm">NiftyPM</option>
                  <option value="teamwork">Teamwork</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Integration Name *</label>
                <input type="text" required value={formData.integration_name} onChange={(e) => setFormData({...formData, integration_name: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">API Key *</label>
                <input type="password" required value={formData.api_key} onChange={(e) => setFormData({...formData, api_key: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>
              {formData.integration_type === 'ghl' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location ID</label>
                  <input type="text" value={formData.location_id} onChange={(e) => setFormData({...formData, location_id: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md" />
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Create
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Create Webhook</h2>
            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Webhook Name *</label>
                <input type="text" required value={webhookFormData.name} onChange={(e) => setWebhookFormData({...webhookFormData, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea value={webhookFormData.description} onChange={(e) => setWebhookFormData({...webhookFormData, description: e.target.value})} rows={3} className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Webhook Type</label>
                <select value={webhookFormData.webhook_type} onChange={(e) => setWebhookFormData({...webhookFormData, webhook_type: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md">
                  <option value="notes">Notes</option>
                  <option value="contacts">Contacts</option>
                  <option value="generic">Generic</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Create
                </button>
                <button type="button" onClick={() => setShowWebhookModal(false)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhook Details Modal */}
      {selectedWebhook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{selectedWebhook.name}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
                <div className="bg-gray-50 p-3 rounded-md">
                  <code className="text-sm break-all">{selectedWebhook.webhook_url}</code>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Secret</label>
                <div className="bg-gray-50 p-3 rounded-md">
                  <code className="text-sm break-all">{selectedWebhook.webhook_secret}</code>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Example cURL Request</label>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-md text-xs overflow-x-auto">
                  <pre>{`curl -X POST ${selectedWebhook.webhook_url} \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: your_signature" \\
  -d '{"title":"Test","content":"Test content"}'`}</pre>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-6">
              <button onClick={() => setSelectedWebhook(null)} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

