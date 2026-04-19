'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, Target, Eye, EyeOff, Code2, TestTube, X, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

interface PracticeCategory {
  id: string; name: string; slug: string; description?: string;
  icon?: string; categoryType?: 'DSA' | 'CP' | 'GATE';
  published: boolean; orderIndex?: number; createdAt: string;
}

interface Topic {
  id: string; title: string; slug: string;
  subject?: { name: string; categoryType?: 'DSA' | 'CP' | 'GATE' | null };
}

interface Problem {
  id: string; title: string; slug: string; description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  constraints: string | null; hints: string[]; tags: string[];
  timeLimit: number; memoryLimit: number; orderIndex: number | null;
  published: boolean; topicId: string;
  topic: { title: string; slug: string; subject?: { name: string; categoryType?: string } };
  testCasesCount: number; submissionsCount: number;
}

interface TestCase {
  id: string; problemId: string; input: string; expected: string;
  isHidden: boolean; orderIndex: number | null;
}

const DIFFICULTY_STYLES = {
  BEGINNER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  ADVANCED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ManagePracticePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Practice</h1>
        <p className="text-muted-foreground text-sm mt-1">Practice categories &amp; coding problems</p>
      </div>

      {/* Practice Categories Section */}
      <PracticeCategoriesSection />

      {/* Thin border separator */}
      <div className="border-t border-border" />

      {/* Problems Section */}
      <ProblemsSection />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Practice Categories Section ──────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

interface PracticeCategoryForm {
  name: string; slug: string; description: string; icon: string;
  categoryType: string; published: boolean; orderIndex: number;
}

const defaultCatForm: PracticeCategoryForm = {
  name: '', slug: '', description: '', icon: '',
  categoryType: '', published: true, orderIndex: 0,
};

function PracticeCategoriesSection() {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<PracticeCategory | null>(null);
  const [form, setForm] = useState<PracticeCategoryForm>(defaultCatForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-practice-categories'],
    queryFn: () => api.get('/admin/practice-categories').then(r => r.data as { data: PracticeCategory[]; total: number }),
  });

  const createMut = useMutation({
    mutationFn: (d: PracticeCategoryForm) => {
      const payload = { ...d, categoryType: d.categoryType || undefined };
      return api.post('/admin/practice-categories', payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-practice-categories'] }); toast.success('Category created'); close(); },
    onError: () => toast.error('Failed to create category'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: Partial<PracticeCategoryForm> }) => {
      const payload = { ...d, categoryType: d.categoryType || undefined };
      return api.patch(`/admin/practice-categories/${id}`, payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-practice-categories'] }); toast.success('Category updated'); close(); },
    onError: () => toast.error('Failed to update category'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/practice-categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-practice-categories'] }); toast.success('Category deleted'); },
    onError: () => toast.error('Failed to delete category'),
  });

  const close = () => { setIsModalOpen(false); setEditing(null); setForm(defaultCatForm); };
  const slug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const openEdit = (cat: PracticeCategory) => {
    setEditing(cat);
    setForm({
      name: cat.name, slug: cat.slug, description: cat.description || '', icon: cat.icon || '',
      categoryType: cat.categoryType || '', published: cat.published, orderIndex: cat.orderIndex || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editing ? updateMut.mutate({ id: editing.id, d: form }) : createMut.mutate(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-600" /> Practice Categories
        </h2>
        <button onClick={() => { setEditing(null); setForm(defaultCatForm); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Category</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Slug</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Order</th>
              <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : data?.data.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No practice categories yet.</td></tr>
            ) : data?.data.map(cat => (
              <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                      <Target className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cat.name}</p>
                      {cat.description && <p className="text-xs text-muted-foreground line-clamp-1">{cat.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground font-mono">/practice/{cat.slug}</td>
                <td className="px-4 py-3 text-sm">
                  {cat.categoryType ? <span className="px-2 py-1 rounded bg-muted text-xs font-medium">{cat.categoryType}</span> : <span className="text-muted-foreground">All</span>}
                </td>
                <td className="px-4 py-3">
                  {cat.published ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs"><Eye className="w-3 h-3" /> Published</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs"><EyeOff className="w-3 h-3" /> Draft</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{cat.orderIndex || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(cat)} className="p-2 rounded-lg hover:bg-accent transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm(`Delete "${cat.name}"?`)) deleteMut.mutate(cat.id); }} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="relative bg-background rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold">{editing ? 'Edit Category' : 'New Category'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slug(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug *</label>
                <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category Type</label>
                  <select value={form.categoryType} onChange={e => setForm({ ...form, categoryType: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Problems</option>
                    <option value="DSA">DSA</option>
                    <option value="CP">CP</option>
                    <option value="GATE">GATE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Order</label>
                  <input type="number" value={form.orderIndex} onChange={e => setForm({ ...form, orderIndex: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon</label>
                <input type="text" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Code, Target, Trophy, etc." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pub-cat" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} className="rounded border-border" />
                <label htmlFor="pub-cat" className="text-sm">Published</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={close} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent transition-colors">Cancel</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {editing ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Problems Section ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function ProblemsSection() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [testCasesProblemId, setTestCasesProblemId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form, setForm] = useState({
    topicId: '', title: '', slug: '', description: '',
    difficulty: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    constraints: '', hints: '', tags: '',
    timeLimit: 2, memoryLimit: 256, orderIndex: '', published: false,
  });
  const [testCaseForm, setTestCaseForm] = useState({ input: '', expected: '', isHidden: false, orderIndex: '' });
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);

  const { data: problemsData, isLoading } = useQuery({
    queryKey: ['admin-problems'],
    queryFn: () => api.get('/admin/problems?limit=100').then(r => r.data as { data: Problem[]; total: number }),
  });

  const { data: topicsData } = useQuery({
    queryKey: ['admin-topics-all'],
    queryFn: () => api.get('/admin/topics?limit=500').then(r => r.data as { data: Topic[] }),
  });

  const { data: testCasesData } = useQuery({
    queryKey: ['admin-test-cases', testCasesProblemId],
    queryFn: () => api.get(`/admin/problems/${testCasesProblemId}/test-cases`).then(r => r.data as TestCase[]),
    enabled: !!testCasesProblemId,
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/admin/problems', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-problems'] }); toast.success('Problem created'); resetForm(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/admin/problems/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-problems'] }); toast.success('Problem updated'); resetForm(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/problems/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-problems'] }); toast.success('Problem deleted'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const createTCMut = useMutation({
    mutationFn: (data: any) => api.post('/admin/test-cases', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-test-cases', testCasesProblemId] }); toast.success('Test case created'); resetTCForm(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const updateTCMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/admin/test-cases/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-test-cases', testCasesProblemId] }); toast.success('Test case updated'); resetTCForm(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteTCMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/test-cases/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-test-cases', testCasesProblemId] }); toast.success('Test case deleted'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const resetForm = () => {
    setForm({ topicId: '', title: '', slug: '', description: '', difficulty: 'BEGINNER', constraints: '', hints: '', tags: '', timeLimit: 2, memoryLimit: 256, orderIndex: '', published: false });
    setEditingProblem(null); setShowForm(false);
  };

  const resetTCForm = () => { setTestCaseForm({ input: '', expected: '', isHidden: false, orderIndex: '' }); setEditingTestCase(null); };

  const handleEdit = (p: Problem) => {
    setEditingProblem(p);
    setForm({
      topicId: p.topicId, title: p.title, slug: p.slug, description: p.description,
      difficulty: p.difficulty, constraints: p.constraints || '', hints: p.hints.join(', '),
      tags: p.tags.join(', '), timeLimit: p.timeLimit, memoryLimit: p.memoryLimit,
      orderIndex: p.orderIndex?.toString() || '', published: p.published,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topicId || !form.title.trim() || !form.slug.trim() || !form.description.trim()) {
      toast.error('Topic, title, slug and description are required'); return;
    }
    const payload = {
      topicId: form.topicId, title: form.title.trim(), slug: form.slug.trim(),
      description: form.description.trim(), difficulty: form.difficulty,
      constraints: form.constraints.trim() || undefined,
      hints: form.hints ? form.hints.split(',').map(h => h.trim()).filter(Boolean) : [],
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      timeLimit: form.timeLimit, memoryLimit: form.memoryLimit,
      orderIndex: form.orderIndex ? parseInt(form.orderIndex) : undefined,
      published: form.published,
    };
    editingProblem ? updateMut.mutate({ id: editingProblem.id, data: payload }) : createMut.mutate(payload);
  };

  const handleTCSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCaseForm.input.trim() || !testCaseForm.expected.trim()) { toast.error('Input and expected are required'); return; }
    const payload = {
      problemId: testCasesProblemId!, input: testCaseForm.input, expected: testCaseForm.expected,
      isHidden: testCaseForm.isHidden, orderIndex: testCaseForm.orderIndex ? parseInt(testCaseForm.orderIndex) : undefined,
    };
    editingTestCase ? updateTCMut.mutate({ id: editingTestCase.id, data: payload }) : createTCMut.mutate(payload);
  };

  const problems = problemsData?.data || [];
  const topics = topicsData?.data || [];
  const testCases = testCasesData || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Code2 className="w-5 h-5 text-indigo-600" /> Problems
        </h2>
        <button onClick={() => { setShowForm(true); setEditingProblem(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Problem
        </button>
      </div>

      {/* Problem Form */}
      {showForm && (
        <div className="border border-border rounded-xl p-6 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editingProblem ? 'Edit Problem' : 'Create Problem'}</h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <label className="block text-sm font-medium mb-2">Filter by Category</label>
              <div className="flex gap-2 flex-wrap">
                {['', 'DSA', 'CP', 'GATE'].map(cat => (
                  <button key={cat || 'all'} type="button" onClick={() => { setCategoryFilter(cat); setForm({ ...form, topicId: '' }); }}
                    className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      categoryFilter === cat ? 'bg-indigo-600 text-white' : 'bg-background border border-border hover:bg-accent')}>
                    {cat || 'All'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Topic *</label>
                <select value={form.topicId} onChange={e => setForm({ ...form, topicId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  <option value="">Select topic...</option>
                  {topics.filter(t => !categoryFilter || t.subject?.categoryType === categoryFilter).map(t => (
                    <option key={t.id} value={t.id}>[{t.subject?.categoryType || 'N/A'}] {t.subject?.name ? `${t.subject.name} → ` : ''}{t.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Difficulty *</label>
                <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Two Sum"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Slug *</label>
                <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="two-sum"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            </div>

            <div><label className="block text-sm font-medium mb-1">Description * (Markdown)</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={6}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono text-sm" /></div>

            <div><label className="block text-sm font-medium mb-1">Constraints</label>
              <textarea value={form.constraints} onChange={e => setForm({ ...form, constraints: e.target.value })} rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono text-sm" /></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Hints (comma-separated)</label>
                <input type="text" value={form.hints} onChange={e => setForm({ ...form, hints: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium mb-1">Time Limit (s)</label>
                <input type="number" value={form.timeLimit} onChange={e => setForm({ ...form, timeLimit: parseInt(e.target.value) || 2 })} min={1} max={10}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Memory Limit (MB)</label>
                <input type="number" value={form.memoryLimit} onChange={e => setForm({ ...form, memoryLimit: parseInt(e.target.value) || 256 })} min={16} max={512}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Order Index</label>
                <input type="number" value={form.orderIndex} onChange={e => setForm({ ...form, orderIndex: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="pub-prob" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} className="rounded" />
              <label htmlFor="pub-prob" className="text-sm">Published</label>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm">
                {editingProblem ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-border rounded-lg hover:bg-accent text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Thin border separator */}
      {testCasesProblemId && <div className="border-t border-border" />}

      {/* Test Cases Panel */}
      {testCasesProblemId && (
        <div className="border border-border rounded-xl p-6 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <TestTube className="w-5 h-5" /> Test Cases: {problems.find(p => p.id === testCasesProblemId)?.title}
            </h3>
            <button onClick={() => { setTestCasesProblemId(null); resetTCForm(); }} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
          </div>

          <form onSubmit={handleTCSubmit} className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Input *</label>
                <textarea value={testCaseForm.input} onChange={e => setTestCaseForm({ ...testCaseForm, input: e.target.value })} rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Expected Output *</label>
                <textarea value={testCaseForm.expected} onChange={e => setTestCaseForm({ ...testCaseForm, expected: e.target.value })} rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background font-mono text-sm" /></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isHidden" checked={testCaseForm.isHidden} onChange={e => setTestCaseForm({ ...testCaseForm, isHidden: e.target.checked })} className="rounded" />
                <label htmlFor="isHidden" className="text-sm">Hidden</label>
              </div>
              <input type="number" value={testCaseForm.orderIndex} onChange={e => setTestCaseForm({ ...testCaseForm, orderIndex: e.target.value })} placeholder="Order" className="w-20 px-2 py-1 rounded border border-border bg-background text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={createTCMut.isPending || updateTCMut.isPending}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50">
                {editingTestCase ? 'Update' : 'Add'} Test Case
              </button>
              {editingTestCase && <button type="button" onClick={resetTCForm} className="px-3 py-1.5 border border-border rounded-lg hover:bg-accent text-sm">Cancel</button>}
            </div>
          </form>

          <div className="space-y-2">
            {testCases.length === 0 ? (
              <p className="text-muted-foreground text-sm">No test cases yet.</p>
            ) : testCases.map((tc, i) => (
              <div key={tc.id} className="flex items-start gap-4 p-3 border border-border rounded-lg bg-background">
                <div className="flex-shrink-0 text-sm font-medium text-muted-foreground">#{i + 1}</div>
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-muted-foreground mb-1">Input</p><pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{tc.input}</pre></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Expected</p><pre className="text-xs bg-muted p-2 rounded overflow-x-auto">{tc.expected}</pre></div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {tc.isHidden && <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded dark:bg-yellow-900/30 dark:text-yellow-400">Hidden</span>}
                  <button onClick={() => { setEditingTestCase(tc); setTestCaseForm({ input: tc.input, expected: tc.expected, isHidden: tc.isHidden, orderIndex: tc.orderIndex?.toString() || '' }); }} className="p-1.5 rounded hover:bg-accent"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if (confirm('Delete?')) deleteTCMut.mutate(tc.id); }} className="p-1.5 rounded hover:bg-red-50 text-red-600 dark:hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Problems Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Problem</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Category</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Topic</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Difficulty</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Tests</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-6 bg-muted animate-pulse rounded" /></td></tr>
              ))
            ) : problems.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No problems found.</td></tr>
            ) : problems.map(p => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div><p className="font-medium">{p.title}</p><p className="text-xs text-muted-foreground">{p.slug}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className={cn('text-xs px-2 py-1 rounded-full font-medium',
                    p.topic?.subject?.categoryType === 'DSA' && 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
                    p.topic?.subject?.categoryType === 'CP' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    p.topic?.subject?.categoryType === 'GATE' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                    !p.topic?.subject?.categoryType && 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
                  )}>{p.topic?.subject?.categoryType || 'N/A'}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  {p.topic?.subject?.name && <span className="text-foreground">{p.topic.subject.name} → </span>}{p.topic?.title}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={cn('text-xs px-2 py-1 rounded-full font-medium', DIFFICULTY_STYLES[p.difficulty])}>{p.difficulty}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{p.testCasesCount} cases</td>
                <td className="px-4 py-3">
                  {p.published ? (
                    <span className="flex items-center gap-1 text-green-600 text-xs"><Eye className="w-3.5 h-3.5" /> Published</span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground text-xs"><EyeOff className="w-3.5 h-3.5" /> Draft</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setTestCasesProblemId(p.id)} className="p-2 rounded hover:bg-accent" title="Test cases"><TestTube className="w-4 h-4" /></button>
                    <button onClick={() => handleEdit(p)} className="p-2 rounded hover:bg-accent" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm('Delete this problem?')) deleteMut.mutate(p.id); }} className="p-2 rounded hover:bg-red-50 text-red-600 dark:hover:bg-red-900/20" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
