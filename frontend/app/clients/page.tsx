'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    status: 'active',
    tags: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Fetch clients error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const url = editingClient 
        ? `/api/v1/${orgSlug}/clients/${editingClient.id}`
        : `/api/v1/${orgSlug}/clients`;
      
      const method = editingClient ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
        })
      });

      if (response.ok) {
        setShowModal(false);
        setEditingClient(null);
        setFormData({ company_name: '', first_name: '', last_name: '', email: '', phone: '', status: 'active', tags: '' });
        fetchClients();
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setFormData({
      company_name: client.company_name || '',
      first_name: client.first_name || '',
      last_name: client.last_name || '',
      email: client.email || '',
      phone: client.phone || '',
      status: client.status || 'active',
      tags: client.tags?.join(', ') || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/clients/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchClients();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const filteredClients = clients.filter(client =>
    client.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-lg font-medium text-muted-foreground">Loading clients...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => router.push('/dashboard')} 
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-smooth font-medium"
            >
              ← Back
            </button>
            <button 
              onClick={() => { 
                setShowModal(true); 
                setEditingClient(null); 
                setFormData({ company_name: '', first_name: '', last_name: '', email: '', phone: '', status: 'active', tags: '' }); 
              }} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium shadow-sm"
            >
              + Add Client
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search clients by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-11 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-smooth"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-card border border-border shadow-smooth rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-muted/50 transition-smooth">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground">
                      {client.company_name || <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {client.first_name} {client.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {client.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {client.phone || <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        client.status === 'active' 
                          ? 'bg-success/10 text-success border border-success/20' 
                          : client.status === 'lead'
                          ? 'bg-warning/10 text-warning border border-warning/20'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(client)} 
                        className="text-primary hover:opacity-80 transition-smooth mr-4 font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(client.id)} 
                        className="text-destructive hover:opacity-80 transition-smooth font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredClients.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-lg font-medium text-foreground mb-2">No clients found</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first client'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-lg p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">👤</span>
              <h2 className="text-2xl font-bold text-foreground">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Company Name</label>
                <input 
                  type="text" 
                  value={formData.company_name} 
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})} 
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                  placeholder="Acme Corp"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">First Name</label>
                  <input 
                    type="text" 
                    value={formData.first_name} 
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})} 
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Last Name</label>
                  <input 
                    type="text" 
                    value={formData.last_name} 
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})} 
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Email <span className="text-destructive">*</span>
                </label>
                <input 
                  type="email" 
                  required 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Phone</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})} 
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="lead">Lead</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Tags (comma-separated)</label>
                <input 
                  type="text" 
                  value={formData.tags} 
                  onChange={(e) => setFormData({...formData, tags: e.target.value})} 
                  placeholder="vip, enterprise, priority" 
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-smooth"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-semibold shadow-sm"
                >
                  {editingClient ? 'Update Client' : 'Create Client'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setEditingClient(null); }} 
                  className="flex-1 px-4 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-smooth font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

