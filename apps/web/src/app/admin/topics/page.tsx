'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, cn } from '@/lib/utils';
import { Pagination } from '@/components/pagination';

interface Topic {
  id: string; title: string; slug: string;
  shortDescription: string | null;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null;
  orderIndex: number | null;
  subject: { name: string; categoryType: string };
}

interface Subject { id: string; name: string; categoryType: string; }

interface TopicsResponse {
  data: Topic[];
  total: number;
  page: number;
  totalPages: number;
}

const LIMIT = 20;
const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const DIFF_COLORS: Record<string, string> = {
  BEGINNER: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  INTERMEDIATE: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  ADVANCED: 'text-red-500 bg-red-50 dark:bg-red-900/20',
};

const empty = { title: '', slug: '', shortDescription: '', difficulty: '', subjectId: '', orderIndex: '' };

export default function TopicsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Topic | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Search is client-side (filters the current page).
  // If you have thousands of topics, consider moving search server-side like users.
  const { data: topicsData, isLoading } = useQuery({
    queryKey: ['admin-topics', page],
    queryFn: () =>
      api
        .get('/admin/topics', { params: { page, limit: LIMIT } })
        .then(r => r.data as TopicsResponse),
    staleTime: 30_000,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: () => api.get('/admin/subjects').then(r => r.data as { data: Subject[] }),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/admin/topics', {
      title: form.title, slug: form.slug,
      shortDescription: form.shortDescription || undefined,
      difficulty: form.difficulty || undefined,
      subjectId: form.subjectId,
      orderIndex: form.orderIndex ? Number(form.orderIndex) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-topics'] });
      toast.success('Topic created!');
      closeForm();
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.patch(`/admin/topics/${editing?.id}`, {
      title: form.title,
      shortDescription: form.shortDescription || undefined,
      difficulty: form.difficulty || undefined,
      orderIndex: form.orderIndex ? Number(form.orderIndex) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-topics'] });
      toast.success('Topic updated!');
      closeForm();
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/topics/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-topics'] });
      toast.success('Topic deleted');
    },
    onError: (err) => toast.error(apiError(err)),
  });

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(empty); };

  const openEdit = (t: Topic) => {
    setEditing(t);
    setForm({
      title: t.title,
      slug: t.slug,
      shortDescription: t.shortDescription ?? '',
      difficulty: t.difficulty ?? '',
      subjectId: '',
      orderIndex: t.orderIndex?.toString() ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.slug) { toast.error('Title and slug are required'); return; }
    if (!editing && !form.subjectId) { toast.error('Subject is required'); return; }
    editing ? updateMutation.mutate() : createMutation.mutate();
  };

  // Client-side search filters only the current page.
  // This is intentional: search within what's visible. See note above.
  const displayed = (topicsData?.data ?? []).filter(t =>
    !search ||
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.name.toLowerCase().includes(search.toLowerCase())
  );

  const isBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Topics</h1>
          <p className="text-muted-foreground text-sm">
            {topicsData?.total ?? 0} topics total
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(empty); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Topic
        </button>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search topics or subjects on this page..."
        className="w-full max-w-sm h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{editing ? 'Edit Topic' : 'New Topic'}</h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {[
              { label: 'Title', key: 'title', placeholder: 'Introduction to Arrays' },
              { label: 'Slug', key: 'slug', placeholder: 'arrays-intro', disabled: !!editing },
              { label: 'Short Description', key: 'shortDescription', placeholder: 'Brief description...' },
              { label: 'Order Index', key: 'orderIndex', placeholder: '1' },
            ].map(f => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                <input
                  value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  disabled={f.disabled}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— None —</option>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {!editing && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Subject</label>
                <select
                  value={form.subjectId}
                  onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">— Select subject —</option>
                  {(subjectsData?.data ?? []).map(s => (
                    <option key={s.id} value={s.id}>[{s.categoryType}] {s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSubmit}
                disabled={isBusy}
                className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editing ? 'Save changes' : 'Create topic'}
              </button>
              <button
                onClick={closeForm}
                className="px-4 h-9 border border-border rounded-lg text-sm hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {['Title', 'Subject', 'Difficulty', 'Order', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No topics found
                  </td>
                </tr>
              ) : displayed.map(topic => (
                <tr key={topic.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{topic.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">{topic.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{topic.subject.name}</p>
                    <p className="text-xs text-muted-foreground">{topic.subject.categoryType}</p>
                  </td>
                  <td className="px-4 py-3">
                    {topic.difficulty ? (
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', DIFF_COLORS[topic.difficulty])}>
                        {topic.difficulty[0] + topic.difficulty.slice(1).toLowerCase()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{topic.orderIndex ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(topic)}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete "${topic.title}"?`)) deleteMutation.mutate(topic.id); }}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination sits inside the border, below the table */}
          <div className="px-4">
            <Pagination
              page={page}
              totalPages={topicsData?.totalPages ?? 1}
              total={topicsData?.total ?? 0}
              limit={LIMIT}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
