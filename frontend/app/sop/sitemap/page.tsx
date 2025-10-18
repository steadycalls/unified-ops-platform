'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SitemapPage() {
  const router = useRouter();
  const [sitemap, setSitemap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<'category' | 'date'>('category');

  useEffect(() => {
    fetchSitemap();
  }, []);

  const fetchSitemap = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/sop-categories/sitemap.json`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSitemap(data);
      }
    } catch (error) {
      console.error('Fetch sitemap error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadXML = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/sop-categories/sitemap.xml`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const xml = await response.text();
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sitemap.xml';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download sitemap error:', error);
    }
  };

  const copyURL = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard!');
  };

  const groupedPages = () => {
    if (!sitemap?.pages) return {};

    if (groupBy === 'category') {
      return sitemap.pages.reduce((acc: any, page: any) => {
        const category = page.category || 'Uncategorized';
        if (!acc[category]) acc[category] = [];
        acc[category].push(page);
        return acc;
      }, {});
    } else {
      return sitemap.pages.reduce((acc: any, page: any) => {
        const date = new Date(page.published_at || page.updated_at).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(page);
        return acc;
      }, {});
    }
  };

  if (loading) {
    return <div className="p-8">Loading sitemap...</div>;
  }

  if (!sitemap) {
    return <div className="p-8">Failed to load sitemap</div>;
  }

  const grouped = groupedPages();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">📄 Public Pages Sitemap</h1>
          <div className="flex gap-4">
            <button onClick={() => router.push('/sop')} className="px-4 py-2 text-gray-600 hover:text-gray-900">
              ← Back to SOPs
            </button>
            <button onClick={downloadXML} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              ⬇️ Download XML
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">🌐 Public Pages Sitemap</h3>
          <p className="text-sm text-blue-800 mb-3">
            This sitemap lists all <strong>public pages</strong> that are accessible on the web. 
            Use this for SEO, sharing with external teams, or submitting to search engines.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">Base URL:</span>
            <code className="px-2 py-1 bg-blue-100 rounded">{sitemap.base_url}</code>
            <button onClick={() => copyURL(sitemap.base_url)} className="text-blue-600 hover:text-blue-800">
              📋 Copy
            </button>
          </div>
          <div className="mt-2 text-sm">
            <span className="font-medium">Total Public Pages:</span> {sitemap.total_pages}
          </div>
        </div>

        {/* Group By Toggle */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Group By:</span>
            <button
              onClick={() => setGroupBy('category')}
              className={`px-4 py-2 rounded-md ${groupBy === 'category' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Category
            </button>
            <button
              onClick={() => setGroupBy('date')}
              className={`px-4 py-2 rounded-md ${groupBy === 'date' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Date
            </button>
          </div>
        </div>

        {/* Grouped Pages */}
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, pages]: [string, any]) => (
            <div key={group} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">{group}</h2>
                <p className="text-sm text-gray-500">{pages.length} page{pages.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="divide-y">
                {pages.map((page: any) => (
                  <div key={page.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{page.title}</h3>
                        {page.excerpt && (
                          <p className="text-sm text-gray-600 mb-2">{page.excerpt}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {page.url}
                          </code>
                          <span>👁️ {page.view_count || 0} views</span>
                          <span>📅 {new Date(page.published_at || page.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(page.url, '_blank')}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          🔗 Open
                        </button>
                        <button
                          onClick={() => copyURL(page.url)}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {sitemap.total_pages === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No public pages yet</p>
            <p className="text-sm">Create pages and set visibility to "Public" to see them here</p>
          </div>
        )}

        {/* SEO Tips */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-3">💡 SEO Tips</h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li>• Submit your sitemap.xml to Google Search Console and Bing Webmaster Tools</li>
            <li>• Update your robots.txt to reference the sitemap: <code className="bg-yellow-100 px-1">Sitemap: {sitemap.base_url}/sop-categories/sitemap.xml</code></li>
            <li>• Ensure all public pages have proper meta titles and descriptions</li>
            <li>• Use descriptive slugs and organize content with categories</li>
            <li>• Regularly update content to improve search rankings</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

