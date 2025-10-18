'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SOPPage() {
  const router = useRouter();
  const [pages, setPages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category_id: '',
    visibility: 'private',
    status: 'draft',
    tags: [] as string[],
    password: ''
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchPages();
    fetchCategories();
    fetchTags();
  }, [selectedCategory, selectedTag, searchTerm]);

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      let url = `/api/v1/${orgSlug}/sop?limit=100`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      if (selectedTag) url += `&tag=${selectedTag}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPages(data.pages || []);
      }
    } catch (error) {
      console.error('Fetch pages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/sop-categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/sop-categories/tags`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error('Fetch tags error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const url = editingPage 
        ? `/api/v1/${orgSlug}/sop/${editingPage.id}`
        : `/api/v1/${orgSlug}/sop`;
      
      const method = editingPage ? 'PATCH' : 'POST';

      const payload = {
        ...formData,
        password: formData.password || undefined
      };

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
        setEditingPage(null);
        setFormData({
          title: '',
          excerpt: '',
          content: '',
          category_id: '',
          visibility: 'private',
          status: 'draft',
          tags: [],
          password: ''
        });
        fetchPages();
        fetchTags();
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleEdit = (page: any) => {
    setEditingPage(page);
    setFormData({
      title: page.title || '',
      excerpt: page.excerpt || '',
      content: page.content || '',
      category_id: page.category_id || '',
      visibility: page.visibility || 'private',
      status: page.status || 'draft',
      tags: page.tags || [],
      password: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/sop/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchPages();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    return visibility === 'public' ? '🌐' : '🔒';
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">📚 SOPs & Documentation</h1>
          <div className="flex gap-4">
            <button onClick={() => router.push('/dashboard')} className="px-4 py-2 text-gray-600 hover:text-gray-900">
              ← Back
            </button>
            <button onClick={() => router.push('/sop/sitemap')} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
              📄 Sitemap
            </button>
            <button onClick={() => { setShowModal(true); setEditingPage(null); setFormData({ title: '', excerpt: '', content: '', category_id: '', visibility: 'private', status: 'draft', tags: [], password: '' }); }} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              + New Page
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search pages..."
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.icon} {cat.name} ({cat.page_count})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tag</label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Tags</option>
                {tags.map(tag => (
                  <option key={tag.id} value={tag.slug}>
                    {tag.name} ({tag.usage_count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pages List */}
        <div className="space-y-4">
          {pages.map((page) => (
            <div key={page.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{getVisibilityIcon(page.visibility)}</span>
                    <h3 className="text-xl font-semibold text-gray-900">{page.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(page.status)}`}>
                      {page.status}
                    </span>
                  </div>
                  {page.excerpt && (
                    <p className="text-gray-600 mb-3">{page.excerpt}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {page.category_name && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {page.category_name}
                      </span>
                    )}
                    {page.tags && page.tags.length > 0 && (
                      <div className="flex gap-2">
                        {page.tags.map((tag: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <span>👁️ {page.view_count || 0} views</span>
                    {page.author_name && <span>✍️ {page.author_name}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => router.push(`/sop/${page.id}`)} className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
                    View
                  </button>
                  <button onClick={() => handleEdit(page)} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(page.id)} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {pages.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No pages found</p>
            <p className="text-sm">Create your first SOP or documentation page</p>
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-4xl w-full my-8 max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editingPage ? 'Edit Page' : 'New Page'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Excerpt</label>
                <textarea value={formData.excerpt} onChange={(e) => setFormData({...formData, excerpt: e.target.value})} rows={2} placeholder="Brief summary..." className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Content * (Markdown)</label>
                <textarea required value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} rows={15} placeholder="# Heading\n\nYour content here..." className="mt-1 block w-full px-3 py-2 border rounded-md font-mono text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md">
                    <option value="">No Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Visibility</label>
                  <select value={formData.visibility} onChange={(e) => setFormData({...formData, visibility: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md">
                    <option value="private">🔒 Private (Logged in users only)</option>
                    <option value="public">🌐 Public (Anyone on the web)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password (Optional)</label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Leave blank for no password" className="mt-1 block w-full px-3 py-2 border rounded-md" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                  <button type="button" onClick={addTag} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-blue-600 hover:text-blue-900">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {editingPage ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setEditingPage(null); }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
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

