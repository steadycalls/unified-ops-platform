'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Fetch notes error:', error);
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

      const url = editingNote 
        ? `/api/v1/${orgSlug}/notes/${editingNote.id}`
        : `/api/v1/${orgSlug}/notes`;
      
      const method = editingNote ? 'PATCH' : 'POST';

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
        setEditingNote(null);
        setFormData({ title: '', content: '', tags: '' });
        fetchNotes();
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFile) {
      alert('Please select a file');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const formDataUpload = new FormData();
      formDataUpload.append('file', uploadFile);
      formDataUpload.append('title', formData.title || uploadFile.name);
      if (formData.tags) {
        formDataUpload.append('tags', formData.tags);
      }

      const response = await fetch(`/api/v1/${orgSlug}/notes/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });

      if (response.ok) {
        setShowUploadModal(false);
        setUploadFile(null);
        setFormData({ title: '', content: '', tags: '' });
        fetchNotes();
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleEdit = (note: any) => {
    setEditingNote(note);
    setFormData({
      title: note.title || '',
      content: note.content || '',
      tags: note.tags?.join(', ') || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const orgs = JSON.parse(localStorage.getItem('organizations') || '[]');
      const orgSlug = orgs[0]?.slug || 'sitepanda';

      const response = await fetch(`/api/v1/${orgSlug}/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
          <div className="flex gap-4">
            <button onClick={() => router.push('/dashboard')} className="px-4 py-2 text-gray-600 hover:text-gray-900">
              ← Back
            </button>
            <button onClick={() => { setShowUploadModal(true); setFormData({ title: '', content: '', tags: '' }); }} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              📎 Upload File
            </button>
            <button onClick={() => { setShowModal(true); setEditingNote(null); setFormData({ title: '', content: '', tags: '' }); }} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              + Add Note
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div key={note.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {note.has_attachment && <span>📎</span>}
                  {note.title || 'Untitled Note'}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(note)} className="text-blue-600 hover:text-blue-900 text-sm">Edit</button>
                  <button onClick={() => handleDelete(note.id)} className="text-red-600 hover:text-red-900 text-sm">Delete</button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-4">
                {note.content?.substring(0, 200)}
                {note.content?.length > 200 && '...'}
              </p>
              
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {note.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                {note.source === 'file_upload' && <span className="mr-2">📁 Uploaded</span>}
                {note.source === 'webhook' && <span className="mr-2">🔗 Webhook</span>}
                {note.source === 'manual' && <span className="mr-2">✏️ Manual</span>}
                <span>{new Date(note.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center py-12 text-gray-500">No notes found</div>
        )}
      </main>

      {/* Add/Edit Note Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editingNote ? 'Edit Note' : 'Add Note'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Content *</label>
                <textarea required value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} rows={10} className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                <input type="text" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="tag1, tag2" className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {editingNote ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setEditingNote(null); }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Upload File</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">File (TXT, PDF, DOCX, MD) *</label>
                <input 
                  type="file" 
                  required 
                  accept=".txt,.pdf,.docx,.md" 
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)} 
                  className="mt-1 block w-full px-3 py-2 border rounded-md" 
                />
                <p className="mt-1 text-xs text-gray-500">Max file size: 10MB</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title (optional)</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Leave blank to use filename" className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                <input type="text" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="tag1, tag2" className="mt-1 block w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Upload
                </button>
                <button type="button" onClick={() => { setShowUploadModal(false); setUploadFile(null); }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
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

