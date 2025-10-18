'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SitePlan {
  id: string;
  niche: string;
  city: string;
  state: string;
  businessName: string;
  status: 'draft' | 'in_progress' | 'completed';
  createdAt: string;
  pages: number;
  keywords: number;
}

export default function SitePlansPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [sitePlans, setSitePlans] = useState<SitePlan[]>([
    {
      id: '1',
      niche: 'Plumbing',
      city: 'Austin',
      state: 'TX',
      businessName: 'Austin Plumbing Pro',
      status: 'completed',
      createdAt: '2025-01-15',
      pages: 8,
      keywords: 25
    },
    {
      id: '2',
      niche: 'Dentist',
      city: 'Miami',
      state: 'FL',
      businessName: 'Miami Dental Care',
      status: 'in_progress',
      createdAt: '2025-01-18',
      pages: 6,
      keywords: 18
    }
  ]);
  
  const [formData, setFormData] = useState({
    niche: '',
    city: '',
    state: '',
    businessName: '',
    targetKeywords: '',
    businessDescription: '',
    contentGoals: ''
  });

  const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPlan: SitePlan = {
      id: Date.now().toString(),
      niche: formData.niche,
      city: formData.city,
      state: formData.state,
      businessName: formData.businessName,
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      pages: 0,
      keywords: 0
    };
    
    setSitePlans([newPlan, ...sitePlans]);
    setShowModal(false);
    setFormData({
      niche: '',
      city: '',
      state: '',
      businessName: '',
      targetKeywords: '',
      businessDescription: '',
      contentGoals: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'in_progress':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Draft';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <h1 className="text-2xl font-bold text-foreground">Site Plans</h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => router.push('/sitepandaseo')} 
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-smooth font-medium"
            >
              ← Back to Research
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium shadow-sm"
            >
              + Create Site Plan
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Plans</div>
            <div className="text-3xl font-bold text-foreground">{sitePlans.length}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-sm font-medium text-muted-foreground mb-1">In Progress</div>
            <div className="text-3xl font-bold text-warning">
              {sitePlans.filter(p => p.status === 'in_progress').length}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-sm font-medium text-muted-foreground mb-1">Completed</div>
            <div className="text-3xl font-bold text-success">
              {sitePlans.filter(p => p.status === 'completed').length}
            </div>
          </div>
        </div>

        {/* Site Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sitePlans.map((plan) => (
            <div key={plan.id} className="bg-card border border-border rounded-xl p-6 card-hover transition-smooth">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{plan.businessName}</h3>
                  <p className="text-sm text-muted-foreground">{plan.niche} • {plan.city}, {plan.state}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(plan.status)}`}>
                  {getStatusLabel(plan.status)}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pages:</span>
                  <span className="font-medium text-foreground">{plan.pages}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Keywords:</span>
                  <span className="font-medium text-foreground">{plan.keywords}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium text-foreground">{plan.createdAt}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth text-sm font-medium">
                  View Plan
                </button>
                <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-smooth text-sm font-medium text-foreground">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {sitePlans.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No Site Plans Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first site plan to start building SEO-optimized websites.
            </p>
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-semibold shadow-sm"
            >
              + Create Site Plan
            </button>
          </div>
        )}
      </main>

      {/* Create Site Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">📋</span>
              <h2 className="text-2xl font-bold text-white">Create Site Plan</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Business Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🏢</span>
                  <input 
                    type="text" 
                    required
                    value={formData.businessName} 
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})} 
                    className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth"
                    placeholder="Enter business name"
                  />
                </div>
              </div>

              {/* Niche & Location Row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Niche</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🎯</span>
                    <input 
                      type="text" 
                      required
                      value={formData.niche} 
                      onChange={(e) => setFormData({...formData, niche: e.target.value})} 
                      className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth"
                      placeholder="Plumber"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🏙️</span>
                    <input 
                      type="text" 
                      required
                      value={formData.city} 
                      onChange={(e) => setFormData({...formData, city: e.target.value})} 
                      className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth"
                      placeholder="Austin"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">📍</span>
                    <select 
                      required
                      value={formData.state} 
                      onChange={(e) => setFormData({...formData, state: e.target.value})} 
                      className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth appearance-none cursor-pointer"
                    >
                      <option value="">Select...</option>
                      {US_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">▼</span>
                  </div>
                </div>
              </div>

              {/* Target Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Keywords</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-500">🔑</span>
                  <textarea 
                    value={formData.targetKeywords} 
                    onChange={(e) => setFormData({...formData, targetKeywords: e.target.value})} 
                    rows={3}
                    className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth resize-none"
                    placeholder="plumber austin&#10;emergency plumbing&#10;24/7 plumber"
                  />
                </div>
              </div>

              {/* Business Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Business Description</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-500">📝</span>
                  <textarea 
                    value={formData.businessDescription} 
                    onChange={(e) => setFormData({...formData, businessDescription: e.target.value})} 
                    rows={3}
                    className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth resize-none"
                    placeholder="Describe the business, services, and unique selling points..."
                  />
                </div>
              </div>

              {/* Content Goals */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content Goals</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-500">🎯</span>
                  <textarea 
                    value={formData.contentGoals} 
                    onChange={(e) => setFormData({...formData, contentGoals: e.target.value})} 
                    rows={3}
                    className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth resize-none"
                    placeholder="What are the main goals for this website content?"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-smooth font-semibold shadow-lg"
                >
                  Create Site Plan
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 px-6 py-3 bg-[#2a2a2a] text-gray-300 rounded-xl hover:bg-[#333] transition-smooth font-semibold"
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

