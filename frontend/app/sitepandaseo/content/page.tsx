'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ContentItem {
  id: string;
  pageType: string;
  title: string;
  siteName: string;
  status: 'draft' | 'generated' | 'published';
  wordCount: number;
  createdAt: string;
}

export default function ContentGenerationPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentItems, setContentItems] = useState<ContentItem[]>([
    {
      id: '1',
      pageType: 'Home Page',
      title: 'Professional Plumbing Services in Austin, TX',
      siteName: 'Austin Plumbing Pro',
      status: 'published',
      wordCount: 850,
      createdAt: '2025-01-15'
    },
    {
      id: '2',
      pageType: 'Services Page',
      title: 'Emergency Plumbing Services',
      siteName: 'Austin Plumbing Pro',
      status: 'generated',
      wordCount: 650,
      createdAt: '2025-01-16'
    },
    {
      id: '3',
      pageType: 'About Page',
      title: 'About Miami Dental Care',
      siteName: 'Miami Dental Care',
      status: 'draft',
      wordCount: 0,
      createdAt: '2025-01-18'
    }
  ]);
  
  const [formData, setFormData] = useState({
    siteName: '',
    pageType: '',
    targetKeywords: '',
    contentBrief: '',
    tone: 'professional',
    wordCount: '800'
  });

  const PAGE_TYPES = [
    'Home Page',
    'About Page',
    'Services Page',
    'Contact Page',
    'Location Page',
    'Blog Post',
    'FAQ Page',
    'Testimonials Page'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsGenerating(true);
    
    // Simulate content generation
    setTimeout(() => {
      const newContent: ContentItem = {
        id: Date.now().toString(),
        pageType: formData.pageType,
        title: `${formData.pageType} - ${formData.siteName}`,
        siteName: formData.siteName,
        status: 'generated',
        wordCount: parseInt(formData.wordCount),
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      setContentItems([newContent, ...contentItems]);
      setIsGenerating(false);
      setShowModal(false);
      setFormData({
        siteName: '',
        pageType: '',
        targetKeywords: '',
        contentBrief: '',
        tone: 'professional',
        wordCount: '800'
      });
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-success/10 text-success border-success/20';
      case 'generated':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'Published';
      case 'generated':
        return 'Generated';
      default:
        return 'Draft';
    }
  };

  const totalWords = contentItems.reduce((sum, item) => sum + item.wordCount, 0);
  const publishedCount = contentItems.filter(item => item.status === 'published').length;
  const generatedCount = contentItems.filter(item => item.status === 'generated').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✍️</span>
            <h1 className="text-2xl font-bold text-foreground">Content Generation</h1>
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
              + Generate Content
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Content</div>
            <div className="text-3xl font-bold text-foreground">{contentItems.length}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-sm font-medium text-muted-foreground mb-1">Published</div>
            <div className="text-3xl font-bold text-success">{publishedCount}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-sm font-medium text-muted-foreground mb-1">Generated</div>
            <div className="text-3xl font-bold text-blue-500">{generatedCount}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Words</div>
            <div className="text-3xl font-bold text-foreground">{totalWords.toLocaleString()}</div>
          </div>
        </div>

        {/* Content Items Table */}
        <div className="bg-card border border-border rounded-xl shadow-smooth overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span>📄</span>
              <span>Content Library</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and generate AI-powered SEO content for your sites
            </p>
          </div>
          
          {contentItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">Page Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">Site</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">Words</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">Created</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {contentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50 transition-smooth">
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                          {item.pageType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground max-w-xs truncate">
                        {item.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {item.siteName}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {item.wordCount > 0 ? item.wordCount.toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {item.createdAt}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button className="text-primary hover:opacity-80 transition-smooth mr-4">
                          View
                        </button>
                        <button className="text-muted-foreground hover:text-foreground transition-smooth">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">✍️</div>
              <p className="text-lg font-medium text-foreground mb-2">No content yet</p>
              <p className="text-sm text-muted-foreground">
                Generate your first AI-powered content piece
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Generate Content Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">✨</span>
              <h2 className="text-2xl font-bold text-white">Generate AI Content</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Site Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Site Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🏢</span>
                  <input 
                    type="text" 
                    required
                    value={formData.siteName} 
                    onChange={(e) => setFormData({...formData, siteName: e.target.value})} 
                    className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth"
                    placeholder="Austin Plumbing Pro"
                  />
                </div>
              </div>

              {/* Page Type & Word Count */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Page Type <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">📄</span>
                    <select 
                      required
                      value={formData.pageType} 
                      onChange={(e) => setFormData({...formData, pageType: e.target.value})} 
                      className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth appearance-none cursor-pointer"
                    >
                      <option value="">Select type...</option>
                      {PAGE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">▼</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Word Count</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">📊</span>
                    <select 
                      value={formData.wordCount} 
                      onChange={(e) => setFormData({...formData, wordCount: e.target.value})} 
                      className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth appearance-none cursor-pointer"
                    >
                      <option value="500">500 words</option>
                      <option value="800">800 words</option>
                      <option value="1000">1000 words</option>
                      <option value="1500">1500 words</option>
                      <option value="2000">2000 words</option>
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

              {/* Content Brief */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content Brief</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-gray-500">📝</span>
                  <textarea 
                    value={formData.contentBrief} 
                    onChange={(e) => setFormData({...formData, contentBrief: e.target.value})} 
                    rows={4}
                    className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth resize-none"
                    placeholder="Describe what this content should cover, key points to include, and any specific requirements..."
                  />
                </div>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content Tone</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🎭</span>
                  <select 
                    value={formData.tone} 
                    onChange={(e) => setFormData({...formData, tone: e.target.value})} 
                    className="w-full pl-12 pr-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-smooth appearance-none cursor-pointer"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="authoritative">Authoritative</option>
                    <option value="conversational">Conversational</option>
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">▼</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  disabled={isGenerating}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-smooth font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Generate Content</span>
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  disabled={isGenerating}
                  className="flex-1 px-6 py-3 bg-[#2a2a2a] text-gray-300 rounded-xl hover:bg-[#333] transition-smooth font-semibold disabled:opacity-50"
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

