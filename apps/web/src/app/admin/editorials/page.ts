'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, cn } from '@/lib/utils';

interface Editorial {
  id: string; slug: string; title: string;
  summary: string | null; published: boolean;
  estimatedMinutes: number | null; tags: string[];
  topic: { title: string; slug: string };
}

interface Topic { id: string; title: string; slug: string; }

const emptyForm = {
  topicId: '', slug: '', title: '', summary: '',
  markdownContent: '# Title\n\nContent here...', tags: '',
  estimatedMinutes: '', published: false,
};

export default function EditorialsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Editorial | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [filterPublished, setFilterPublished] = useState<string>('ALL');
  const [previewMode, setPreviewMode] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-editorials'],
    queryFn: () => api.get('/admin/editorials').then(r => r.data as { data: Editorial[]; total: number }),
  });

  const { data: topicsData } = useQuery({
    queryKey: ['admin-topics'],
    queryFn: () => api.get('/admin/topics').then(r => r.data as { data: Topic[] }),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/admin/editorials', {
      topicId: form.topicId, slug: form.slug, title: form.title,
      summary: form.summary || undefined,
      markdownContent: form.markdownContent,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined,
      published: form.published,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-editorials'] }); toast.success('Editorial created!'); closeForm(); },
    onError: (err) => toast.error(apiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.patch(`/admin/editorials/${editing?.id}`, {
      title: form.title,
      summary: form.summary || undefined,
      markdownContent: form.markdownContent,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined,
      published: form.published,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-editorials'] }); toast.success('Editorial updated!'); closeForm(); },
    onError: (err) => toast.error(apiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/editorials/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-editorials'] }); toast.success('Editorial deleted'); },
    onError: (err) => toast.error(apiError(err)),
  });

  const togglePublish = useMutation({
    mutationFn: (ed: Editorial) => api.patch(`/admin/editorials/${ed.id}`, { published: !ed.published }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-editorials'] }); toast.success('Updated!'); },
    onError: (err) => toast.error(apiError(err)),
  });

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); setPreviewMode(false); };

  const openEdit = (ed: Editorial) => {
    setEditing(ed);
    setForm({
      topicId: '', slug: ed.slug, title: ed.title,
      summary: ed.summary ?? '',
      markdownContent: '',
      tags: ed.tags?.join(', ') ?? '',
      estimatedMinutes: ed.estimatedMinutes?.toString() ?? '',
      published: ed.published,
    });
    // fetch full editorial
    api.get(`/admin/editorials/${ed.id}`).then(r => {
      setForm(p => ({ ...p, markdownContent: r.data.markdownContent }));
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.slug || !form.markdownContent) { toast.error('Title, slug and content are required'); return; }
    if (!editing && !form.topicId) { toast.error('Topic is required'); return; }
    editing ? updateMutation.mutate() : createMutation.mutate();
  };

  const filtered = (data?.data ?? []).filter(ed => {
    const matchSearch = !search || ed.title.toLowerCase().includes(search.toLowerCase()) || ed.topic.title.toLowerCase().includes(search.toLowerCase());
    const matchPub = filterPublished === 'ALL' || (filterPublished === 'PUBLISHED' ? ed.published : !ed.published);
    return matchSearch && matchPub;
  });

  const isBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Editorials</h1>
          <p className="text-muted-foreground text-sm">{data?.total ?? 0} editorials total</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> New Editorial
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search editorials..."
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64" />
        {['ALL', 'PUBLISHED', 'DRAFT'].map(f => (
          <button key={f} onClick={() => setFilterPublished(f)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filterPublished === f ? 'bg-indigo-600 text-white' : 'border border-border hover:bg-accent text-muted-foreground')}>
            {f}
          </button>
        ))}
      </div>

      {/* Full-screen form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Form header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border">
            <h2 className="font-semibold">{editing ? 'Edit Editorial' : 'New Editorial'}</h2>
            <div className="flex items-center gap-3">
              <button onClick={() => setPreviewMode(p => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-accent">
                {previewMode ? <><EyeOff className="w-3.5 h-3.5" /> Editor</> : <><Eye className="w-3.5 h-3.5" /> Preview</>}
              </button>
              <button onClick={handleSubmit} disabled={isBusy}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg disabled:opacity-50">
                {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editing ? 'Save' : 'Create'}
              </button>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left: metadata */}
            <div className="w-72 flex-shrink-0 border-r border-border overflow-y-auto p-4 space-y-4">
              {[
                { label: 'Title', key: 'title', placeholder: 'Introduction to Arrays' },
                { label: 'Slug', key: 'slug', placeholder: 'editorial-arrays-intro', disabled: !!editing },
                { label: 'Summary', key: 'summary', placeholder: 'Brief summary...' },
                { label: 'Tags (comma separated)', key: 'tags', placeholder: 'arrays, basics, dsa' },
                { label: 'Estimated Minutes', key: 'estimatedMinutes', placeholder: '15' },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} disabled={(f as any).disabled}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" />
                </div>
              ))}

              {!editing && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Topic</label>
                  <select value={form.topicId} onChange={e => setForm(p => ({ ...p, topicId: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">— Select topic —</option>
                    {(topicsData?.data ?? []).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <label className="text-xs font-medium text-muted-foreground">Published</label>
                <button onClick={() => setForm(p => ({ ...p, published: !p.published }))}
                  className={cn('w-10 h-5 rounded-full transition-colors relative', form.published ? 'bg-indigo-600' : 'bg-muted')}>
                  <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform', form.published ? 'translate-x-5' : 'translate-x-0.5')} />
                </button>
                <span className="text-xs text-muted-foreground">{form.published ? 'Yes' : 'Draft'}</span>
              </div>
            </div>

            {/* Right: editor / preview */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {previewMode ? (
                <div className="flex-1 overflow-y-auto p-8 prose prose-slate dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">{form.markdownContent}</pre>
                </div>
              ) : (
                <textarea
                  value={form.markdownContent}
                  onChange={e => setForm(p => ({ ...p, markdownContent: e.target.value }))}
                  className="flex-1 w-full p-6 font-mono text-sm bg-background resize-none focus:outline-none"
                  placeholder="Write your markdown content here..."
                  spellCheck={false}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {['Title', 'Topic', 'Tags', 'Minutes', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No editorials found</td></tr>
              ) : filtered.map(ed => (
                <tr key={ed.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{ed.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">{ed.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{ed.topic.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {ed.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">{tag}</span>
                      ))}
                      {(ed.tags?.length ?? 0) > 2 && <span className="text-xs text-muted-foreground">+{ed.tags.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{ed.estimatedMinutes ? `${ed.estimatedMinutes}m` : '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublish.mutate(ed)}
                      className={cn('px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
                        ed.published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground')}>
                      {ed.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(ed)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm(`Delete "${ed.title}"?`)) deleteMutation.mutate(ed.id); }}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
