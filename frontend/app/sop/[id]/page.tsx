'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function SOPViewPage() {
  const router = useRouter();
  const params = useParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPage();
    }
  }, [params.id]);

  const fetchPage = async (pwd?: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/sop/${params.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        ...(pwd && { body: JSON.stringify({ password: pwd }) })
      });

      if (response.status === 401) {
        const data = await response.json();
        if (data.password_protected) {
          setShowPasswordPrompt(true);
          setLoading(false);
          return;
        }
      }

      if (response.ok) {
        const data = await response.json();
        setPage(data);
        setShowPasswordPrompt(false);
      } else {
        alert('Failed to load page');
        router.push('/sop');
      }
    } catch (error) {
      console.error('Fetch page error:', error);
      alert('Failed to load page');
      router.push('/sop');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPage(password);
  };

  const renderMarkdown = (content: string) => {
    // Simple markdown rendering (in production, use a proper markdown library like react-markdown)
    return content
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br />');
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (showPasswordPrompt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">🔒 Password Protected</h2>
          <p className="text-gray-600 mb-6">This page is password protected. Please enter the password to view.</p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 border rounded-md mb-4"
              autoFocus
            />
            <div className="flex gap-4">
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Submit
              </button>
              <button type="button" onClick={() => router.push('/sop')} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!page) {
    return <div className="p-8">Page not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <button onClick={() => router.push('/sop')} className="text-gray-600 hover:text-gray-900">
            ← Back to SOPs
          </button>
          <div className="flex gap-2">
            <button onClick={() => router.push(`/sop?edit=${page.id}`)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Edit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8 pb-6 border-b">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{page.visibility === 'public' ? '🌐' : '🔒'}</span>
              <h1 className="text-4xl font-bold text-gray-900">{page.title}</h1>
            </div>
            
            {page.excerpt && (
              <p className="text-xl text-gray-600 mb-4">{page.excerpt}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              {page.category_name && (
                <span className="px-3 py-1 bg-gray-100 rounded">
                  {page.category_name}
                </span>
              )}
              {page.author_name && (
                <span>✍️ By {page.author_name}</span>
              )}
              <span>📅 {new Date(page.published_at || page.created_at).toLocaleDateString()}</span>
              <span>👁️ {page.view_count || 0} views</span>
            </div>

            {page.tags && page.tags.length > 0 && (
              <div className="flex gap-2 mt-4">
                {page.tags.map((tag: any, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {tag.name || tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: `<p class="mb-4">${renderMarkdown(page.content)}</p>` }}
          />

          {/* Footer */}
          <div className="mt-12 pt-6 border-t">
            <div className="text-sm text-gray-500">
              <p>Last updated: {new Date(page.updated_at).toLocaleString()}</p>
              {page.editor_name && page.editor_name !== page.author_name && (
                <p>Last edited by: {page.editor_name}</p>
              )}
            </div>
          </div>
        </article>

        {/* Public URL Info */}
        {page.visibility === 'public' && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-2">🌐 Public Page</h3>
            <p className="text-sm text-green-800 mb-3">
              This page is publicly accessible on the web. Share the URL below:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-green-100 rounded text-sm">
                https://your-domain.com/sop/{page.slug}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://your-domain.com/sop/${page.slug}`);
                  alert('URL copied!');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                📋 Copy
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

