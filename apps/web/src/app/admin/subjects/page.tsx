'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, cn } from '@/lib/utils';

interface Subject {
  id: string; name: string; slug: string;
  description: string | null;
  categoryType: 'DSA' | 'CP' | 'GATE';
  orderIndex: number | null;
  topicsCount: number;
}

const CATEGORIES = ['DSA', 'CP', 'GATE'];
const CAT_COLORS: Record<string, string> = {
  DSA: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
  CP: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  GATE: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
};

const empty = { name: '', slug: '', description: '', categoryType: 'DSA', orderIndex: '' };

export default function SubjectsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [filterCat, setFilterCat] = useState<string>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: () => api.get('/admin/subjects').then(r => r.data as { data: Subject[]; total: number }),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/admin/subjects', {
      ...form,
      orderIndex: form.orderIndex ? Number(form.orderIndex) : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-subjects'] }); toast.success('Subject created!'); closeForm(); },
    onError: (err) => toast.error(apiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.patch(`/admin/subjects/${editing?.id}`, {
      name: form.name, description: form.description,
      categoryType: form.categoryType,
      orderIndex: form.orderIndex ? Number(form.orderIndex) : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-subjects'] }); toast.success('Subject updated!'); closeForm(); },
    onError: (err) => toast.error(apiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/subjects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-subjects'] }); toast.success('Subject deleted'); },
    onError: (err) => toast.error(apiError(err)),
  });

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(empty); };

  const openEdit = (s: Subject) => {
    setEditing(s);
    setForm({ name: s.name, slug: s.slug, description: s.description ?? '', categoryType: s.categoryType, orderIndex: s.orderIndex?.toString() ?? '' });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.slug || !form.categoryType) { toast.error('Name, slug and category are required'); return; }
    editing ? updateMutation.mutate() : createMutation.mutate();
  };

  const filtered = (data?.data ?? []).filter(s => filterCat === 'ALL' || s.categoryType === filterCat);
  const isBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Subjects</h1>
          <p className="text-muted-foreground text-sm">{data?.total ?? 0} subjects total</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(empty); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['ALL', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filterCat === cat ? 'bg-indigo-600 text-white' : 'border border-border hover:bg-accent text-muted-foreground')}>
            {cat}
          </button>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{editing ? 'Edit Subject' : 'New Subject'}</h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>

            {[
              { label: 'Name', key: 'name', placeholder: 'Arrays' },
              { label: 'Slug', key: 'slug', placeholder: 'arrays', disabled: !!editing },
              { label: 'Description', key: 'description', placeholder: 'Brief description...' },
              { label: 'Order Index', key: 'orderIndex', placeholder: '1' },
            ].map(f => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} disabled={f.disabled}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" />
              </div>
            ))}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <select value={form.categoryType} onChange={e => setForm(p => ({ ...p, categoryType: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleSubmit} disabled={isBusy}
                className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editing ? 'Save changes' : 'Create subject'}
              </button>
              <button onClick={closeForm} className="px-4 h-9 border border-border rounded-lg text-sm hover:bg-accent">Cancel</button>
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
                {['Name', 'Slug', 'Category', 'Topics', 'Order', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No subjects found</td></tr>
              ) : filtered.map(subject => (
                <tr key={subject.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{subject.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{subject.slug}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', CAT_COLORS[subject.categoryType])}>
                      {subject.categoryType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{subject.topicsCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{subject.orderIndex ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(subject)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm(`Delete "${subject.name}"?`)) deleteMutation.mutate(subject.id); }}
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
