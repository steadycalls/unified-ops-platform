'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OutgoingWebhooksPage() {
  const router = useRouter();
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'webhooks' | 'deliveries'>('webhooks');
  const [showModal, setShowModal] = useState(false);
  const [showDeliveriesModal, setShowDeliveriesModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [editingWebhook, setEditingWebhook] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_url: '',
    http_method: 'POST',
    auth_type: 'none',
    auth_token: '',
    auth_username: '',
    auth_password: '',
    auth_key_name: '',
    auth_key_value: '',
    event_types: [] as string[],
    retry_enabled: true,
    retry_attempts: 3
  });

  useEffect(() => {
    fetchWebhooks();
    fetchEventTypes();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/outgoing-webhooks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (error) {
      console.error('Fetch webhooks error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventTypes = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/outgoing-webhooks/event-types`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEventTypes(data.event_types || []);
      }
    } catch (error) {
      console.error('Fetch event types error:', error);
    }
  };

  const fetchDeliveries = async (webhookId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/outgoing-webhooks/${webhookId}/deliveries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDeliveries(data.deliveries || []);
        setShowDeliveriesModal(true);
      }
    } catch (error) {
      console.error('Fetch deliveries error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      // Build auth_config based on auth_type
      let auth_config = {};
      if (formData.auth_type === 'bearer') {
        auth_config = { token: formData.auth_token };
      } else if (formData.auth_type === 'basic') {
        auth_config = { username: formData.auth_username, password: formData.auth_password };
      } else if (formData.auth_type === 'api_key') {
        auth_config = { key: formData.auth_key_name, value: formData.auth_key_value };
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        target_url: formData.target_url,
        http_method: formData.http_method,
        auth_type: formData.auth_type,
        auth_config,
        event_types: formData.event_types,
        retry_enabled: formData.retry_enabled,
        retry_attempts: formData.retry_attempts
      };

      const url = editingWebhook 
        ? `/api/v1/${orgSlug}/outgoing-webhooks/${editingWebhook.id}`
        : `/api/v1/${orgSlug}/outgoing-webhooks`;
      
      const method = editingWebhook ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowModal(false);
        setEditingWebhook(null);
        setFormData({
          name: '',
          description: '',
          target_url: '',
          http_method: 'POST',
          auth_type: 'none',
          auth_token: '',
          auth_username: '',
          auth_password: '',
          auth_key_name: '',
          auth_key_value: '',
          event_types: [],
          retry_enabled: true,
          retry_attempts: 3
        });
        fetchWebhooks();
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleTest = async (webhookId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/outgoing-webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Test successful!\n\nStatus: ${data.status_code}\nResponse time: ${data.response_time_ms}ms`);
      } else {
        alert(`❌ Test failed!\n\nError: ${data.error || 'Unknown error'}\nResponse time: ${data.response_time_ms}ms`);
      }
    } catch (error) {
      console.error('Test error:', error);
      alert('Failed to test webhook');
    }
  };

  const handleEdit = (webhook: any) => {
    setEditingWebhook(webhook);
    
    // Extract auth credentials from auth_config
    const authConfig = webhook.auth_config || {};
    
    setFormData({
      name: webhook.name || '',
      description: webhook.description || '',
      target_url: webhook.target_url || '',
      http_method: webhook.http_method || 'POST',
      auth_type: webhook.auth_type || 'none',
      auth_token: authConfig.token || '',
      auth_username: authConfig.username || '',
      auth_password: authConfig.password || '',
      auth_key_name: authConfig.key || '',
      auth_key_value: authConfig.value || '',
      event_types: webhook.event_types || [],
      retry_enabled: webhook.retry_enabled !== false,
      retry_attempts: webhook.retry_attempts || 3
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this outgoing webhook?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/outgoing-webhooks/${id}`, {
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

  const toggleEventType = (eventType: string) => {
    setFormData(prev => ({
      ...prev,
      event_types: prev.event_types.includes(eventType)
        ? prev.event_types.filter(e => e !== eventType)
        : [...prev.event_types, eventType]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'retrying': return 'bg-orange-100 text-orange-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Outgoing Webhooks</h1>
          <div className="flex gap-4">
            <button onClick={() => router.push('/dashboard')} className="px-4 py-2 text-gray-600 hover:text-gray-900">
              ← Back
            </button>
            <button onClick={() => { setShowModal(true); setEditingWebhook(null); setFormData({ name: '', description: '', target_url: '', http_method: 'POST', auth_type: 'none', auth_token: '', auth_username: '', auth_password: '', auth_key_name: '', auth_key_value: '', event_types: [], retry_enabled: true, retry_attempts: 3 }); }} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              + Add Outgoing Webhook
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">🔗 What are Outgoing Webhooks?</h3>
          <p className="text-sm text-blue-800">
            Outgoing webhooks automatically send data from your platform to external services (like n8n, Zapier, Make, or custom endpoints) when events occur. 
            Perfect for triggering automations, syncing data, or integrating with other tools.
          </p>
        </div>

        <div className="space-y-6">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{webhook.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${webhook.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {webhook.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {webhook.description && (
                    <p className="text-sm text-gray-600 mb-3">{webhook.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>🎯 {webhook.target_url}</span>
                    <span>📡 {webhook.http_method}</span>
                    <span>🔐 {webhook.auth_type}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleTest(webhook.id)} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                    Test
                  </button>
                  <button onClick={() => handleEdit(webhook)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                    Edit
                  </button>
                  <button onClick={() => { setSelectedWebhook(webhook); fetchDeliveries(webhook.id); }} className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
                    Logs
                  </button>
                  <button onClick={() => handleDelete(webhook.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                    Delete
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Listening to Events:</h4>
                  <div className="flex flex-wrap gap-2">
                    {webhook.event_types?.map((event: string) => (
                      <span key={event} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                        {event}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Total Triggers</div>
                    <div className="font-semibold">{webhook.total_triggers || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Successful</div>
                    <div className="font-semibold text-green-600">{webhook.successful_triggers || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Failed</div>
                    <div className="font-semibold text-red-600">{webhook.failed_triggers || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Last Triggered</div>
                    <div className="font-semibold">
                      {webhook.last_triggered_at ? new Date(webhook.last_triggered_at).toLocaleString() : 'Never'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {webhooks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No outgoing webhooks configured</p>
            <p className="text-sm">Create your first webhook to start sending events to external platforms</p>
          </div>
        )}
      </main>

      {/* Add/Edit Webhook Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full my-8 max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editingWebhook ? 'Edit Outgoing Webhook' : 'Add Outgoing Webhook'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Webhook Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="My n8n Automation" className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} placeholder="Sends new client data to n8n workflow" className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Target URL *</label>
                <input type="url" required value={formData.target_url} onChange={(e) => setFormData({...formData, target_url: e.target.value})} placeholder="https://your-n8n.com/webhook/abc123" className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">HTTP Method</label>
                  <select value={formData.http_method} onChange={(e) => setFormData({...formData, http_method: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md">
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Authentication</label>
                  <select value={formData.auth_type} onChange={(e) => setFormData({...formData, auth_type: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md">
                    <option value="none">None</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="api_key">API Key (Header)</option>
                  </select>
                </div>
              </div>

              {formData.auth_type === 'bearer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bearer Token</label>
                  <input type="password" value={formData.auth_token} onChange={(e) => setFormData({...formData, auth_token: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md" />
                </div>
              )}

              {formData.auth_type === 'basic' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input type="text" value={formData.auth_username} onChange={(e) => setFormData({...formData, auth_username: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" value={formData.auth_password} onChange={(e) => setFormData({...formData, auth_password: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md" />
                  </div>
                </div>
              )}

              {formData.auth_type === 'api_key' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Header Name</label>
                    <input type="text" value={formData.auth_key_name} onChange={(e) => setFormData({...formData, auth_key_name: e.target.value})} placeholder="X-API-Key" className="mt-1 block w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Header Value</label>
                    <input type="password" value={formData.auth_key_value} onChange={(e) => setFormData({...formData, auth_key_value: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Types * (select at least one)</label>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                  {eventTypes.map((event) => (
                    <label key={event.value} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.event_types.includes(event.value)}
                        onChange={() => toggleEventType(event.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-sm">{event.label}</div>
                        <div className="text-xs text-gray-500">{event.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={formData.retry_enabled} onChange={(e) => setFormData({...formData, retry_enabled: e.target.checked})} />
                    <span className="text-sm font-medium text-gray-700">Enable Retry on Failure</span>
                  </label>
                </div>
                {formData.retry_enabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Retry Attempts</label>
                    <input type="number" min="1" max="5" value={formData.retry_attempts} onChange={(e) => setFormData({...formData, retry_attempts: parseInt(e.target.value)})} className="mt-1 block w-full px-3 py-2 border rounded-md" />
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {editingWebhook ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setEditingWebhook(null); }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deliveries Modal */}
      {showDeliveriesModal && selectedWebhook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-6xl w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Delivery Logs: {selectedWebhook.name}</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time (ms)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(delivery.triggered_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{delivery.event_type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(delivery.status)}`}>
                          {delivery.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {delivery.response_status_code || delivery.error_message || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{delivery.response_time_ms || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {deliveries.length === 0 && (
                <div className="text-center py-12 text-gray-500">No deliveries yet</div>
              )}
            </div>

            <div className="flex justify-end pt-6">
              <button onClick={() => { setShowDeliveriesModal(false); setSelectedWebhook(null); }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

