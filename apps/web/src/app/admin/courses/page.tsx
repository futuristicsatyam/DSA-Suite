'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, GraduationCap, Eye, EyeOff,
  BookOpen, Tag, FileText, Loader2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, cn } from '@/lib/utils';
import { Pagination } from '@/components/pagination';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';

// ── Types ────────────────────────────────────────────────────────────────────

interface Course {
  id: string; name: string; slug: string; type?: string;
  description?: string; icon?: string; thumbnail?: string;
  ctaText?: string; ctaUrl?: string;
  dsThumbnail?: string; dsCtaText?: string; dsCtaUrl?: string;
  algoThumbnail?: string; algoCtaText?: string; algoCtaUrl?: string;
  published: boolean; orderIndex?: number;
  subjectsCount: number; enrollmentsCount: number; createdAt: string;
}

interface Subject {
  id: string; name: string; slug: string; description: string | null;
  courseId: string; course: { id: string; name: string };
  orderIndex: number | null; topicsCount: number;
}

interface Topic {
  id: string; title: string; slug: string;
  shortDescription: string | null;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null;
  orderIndex: number | null;
  subject: { name: string; categoryType: string };
}

interface Editorial {
  id: string; slug: string; title: string;
  summary: string | null; published: boolean;
  estimatedMinutes: number | null; tags: string[];
  includeCodeEditor: boolean;
  topic: { title: string; slug: string };
}

// ── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'courses', label: 'Courses', icon: GraduationCap },
  { key: 'subjects', label: 'Subjects', icon: BookOpen },
  { key: 'topics', label: 'Topics', icon: Tag },
  { key: 'editorials', label: 'Editorials', icon: FileText },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const DIFF_COLORS: Record<string, string> = {
  BEGINNER: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  INTERMEDIATE: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  ADVANCED: 'text-red-500 bg-red-50 dark:bg-red-900/20',
};

// ── Markdown Preview ─────────────────────────────────────────────────────────

function MarkdownPreview({ content }: { content: string }) {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-indigo-600 prose-code:text-indigo-600 prose-code:bg-indigo-50 dark:prose-code:bg-indigo-950/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:p-0 prose-pre:bg-transparent">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeSlug, rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ManageCoursesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('courses');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Courses</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Courses, subjects, topics &amp; editorials
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'courses' && <CoursesTab />}
      {activeTab === 'subjects' && <SubjectsTab />}
      {activeTab === 'topics' && <TopicsTab />}
      {activeTab === 'editorials' && <EditorialsTab />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Courses Tab ──────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

interface CourseForm {
  name: string; slug: string; description: string; icon: string;
  thumbnail: string; ctaText: string; ctaUrl: string;
  dsThumbnail: string; dsCtaText: string; dsCtaUrl: string;
  algoThumbnail: string; algoCtaText: string; algoCtaUrl: string;
  published: boolean; orderIndex: number;
}

const defaultCourseForm: CourseForm = {
  name: '', slug: '', description: '', icon: '',
  thumbnail: '', ctaText: 'Enroll Now', ctaUrl: '',
  dsThumbnail: '', dsCtaText: '', dsCtaUrl: '',
  algoThumbnail: '', algoCtaText: '', algoCtaUrl: '',
  published: true, orderIndex: 0,
};

function CoursesTab() {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState<CourseForm>(defaultCourseForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => api.get('/admin/courses').then(r => r.data as { data: Course[]; total: number }),
  });

  const createMut = useMutation({
    mutationFn: (d: CourseForm) => api.post('/admin/courses', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-courses'] }); toast.success('Course created'); close(); },
    onError: () => toast.error('Failed to create course'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: Partial<CourseForm> }) => api.patch(`/admin/courses/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-courses'] }); toast.success('Course updated'); close(); },
    onError: () => toast.error('Failed to update course'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/courses/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-courses'] }); toast.success('Course deleted'); },
    onError: () => toast.error('Failed to delete course'),
  });

  const close = () => { setIsModalOpen(false); setEditing(null); setForm(defaultCourseForm); };

  const openEdit = (c: Course) => {
    setEditing(c);
    setForm({
      name: c.name, slug: c.slug, description: c.description || '', icon: c.icon || '',
      thumbnail: c.thumbnail || '', ctaText: c.ctaText || 'Enroll Now', ctaUrl: c.ctaUrl || '',
      dsThumbnail: c.dsThumbnail || '', dsCtaText: c.dsCtaText || '', dsCtaUrl: c.dsCtaUrl || '',
      algoThumbnail: c.algoThumbnail || '', algoCtaText: c.algoCtaText || '', algoCtaUrl: c.algoCtaUrl || '',
      published: c.published, orderIndex: c.orderIndex || 0,
    });
    setIsModalOpen(true);
  };

  const slug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editing ? updateMut.mutate({ id: editing.id, d: form }) : createMut.mutate(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} courses</p>
        <button onClick={() => { setEditing(null); setForm(defaultCourseForm); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Course</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Slug</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Subjects</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Enrolled</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Order</th>
              <th className="text-right px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : data?.data.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No courses yet. Create your first course!</td></tr>
            ) : data?.data.map(c => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      {c.description && <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground font-mono">/{c.slug}</td>
                <td className="px-4 py-3 text-sm">{c.subjectsCount}</td>
                <td className="px-4 py-3 text-sm">{c.enrollmentsCount}</td>
                <td className="px-4 py-3">
                  {c.published ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs"><Eye className="w-3 h-3" /> Published</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs"><EyeOff className="w-3 h-3" /> Draft</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.orderIndex || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-accent transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm(`Delete "${c.name}"?`)) deleteMut.mutate(c.id); }} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
          <div className="relative bg-background rounded-xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h2 className="text-lg font-semibold">{editing ? 'Edit Course' : 'New Course'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slug(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Data Structures & Algorithms" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug *</label>
                <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" placeholder="dsa" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Master DSA from basics to advanced" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Icon</label>
                  <input type="text" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Code" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Order</label>
                  <input type="number" value={form.orderIndex} onChange={e => setForm({ ...form, orderIndex: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thumbnail URL</label>
                <input type="text" value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://example.com/thumbnail.jpg" />
                {form.thumbnail && <img src={form.thumbnail} alt="Preview" referrerPolicy="no-referrer" className="mt-2 h-24 rounded-lg object-cover border border-border" />}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">CTA Button Text</label>
                  <input type="text" value={form.ctaText} onChange={e => setForm({ ...form, ctaText: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enroll Now" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CTA URL</label>
                  <input type="text" value={form.ctaUrl} onChange={e => setForm({ ...form, ctaUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://example.com/enroll" />
                </div>
              </div>
              {form.slug === 'dsa' && (
                <div className="space-y-4 border-t border-border pt-4">
                  <p className="text-sm font-semibold text-muted-foreground">Data Structures Tab</p>
                  <div>
                    <label className="block text-sm font-medium mb-1">DS Thumbnail URL</label>
                    <input type="text" value={form.dsThumbnail} onChange={e => setForm({ ...form, dsThumbnail: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    {form.dsThumbnail && <img src={form.dsThumbnail} alt="DS Preview" referrerPolicy="no-referrer" className="mt-2 h-24 rounded-lg object-cover border border-border" />}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">DS CTA Text</label><input type="text" value={form.dsCtaText} onChange={e => setForm({ ...form, dsCtaText: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                    <div><label className="block text-sm font-medium mb-1">DS CTA URL</label><input type="text" value={form.dsCtaUrl} onChange={e => setForm({ ...form, dsCtaUrl: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground pt-2">Algorithms Tab</p>
                  <div>
                    <label className="block text-sm font-medium mb-1">Algo Thumbnail URL</label>
                    <input type="text" value={form.algoThumbnail} onChange={e => setForm({ ...form, algoThumbnail: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    {form.algoThumbnail && <img src={form.algoThumbnail} alt="Algo Preview" referrerPolicy="no-referrer" className="mt-2 h-24 rounded-lg object-cover border border-border" />}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Algo CTA Text</label><input type="text" value={form.algoCtaText} onChange={e => setForm({ ...form, algoCtaText: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                    <div><label className="block text-sm font-medium mb-1">Algo CTA URL</label><input type="text" value={form.algoCtaUrl} onChange={e => setForm({ ...form, algoCtaUrl: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pub-course" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} className="rounded border-border" />
                <label htmlFor="pub-course" className="text-sm">Published (visible in navbar)</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={close} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent transition-colors">Cancel</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {editing ? 'Save Changes' : 'Create Course'}
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
// ── Subjects Tab ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function SubjectsTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const empty = { name: '', slug: '', description: '', courseId: '', orderIndex: '' };
  const [form, setForm] = useState(empty);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: () => api.get('/admin/subjects').then(r => r.data as { data: Subject[]; total: number }),
  });

  const { data: coursesData } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => api.get('/admin/courses').then(r => r.data as { data: Course[] }),
  });

  const createMut = useMutation({
    mutationFn: () => api.post('/admin/subjects', {
      name: form.name, slug: form.slug, description: form.description || undefined,
      courseId: form.courseId, orderIndex: form.orderIndex ? Number(form.orderIndex) : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-subjects'] }); toast.success('Subject created!'); closeForm(); },
    onError: (err) => toast.error(apiError(err)),
  });

  const updateMut = useMutation({
    mutationFn: () => api.patch(`/admin/subjects/${editing?.id}`, {
      name: form.name, description: form.description || undefined,
      courseId: form.courseId, orderIndex: form.orderIndex ? Number(form.orderIndex) : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-subjects'] }); toast.success('Subject updated!'); closeForm(); },
    onError: (err) => toast.error(apiError(err)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/subjects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-subjects'] }); toast.success('Subject deleted'); },
    onError: (err) => toast.error(apiError(err)),
  });

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(empty); };

  const openEdit = (s: Subject) => {
    setEditing(s);
    setForm({ name: s.name, slug: s.slug, description: s.description ?? '', courseId: s.courseId, orderIndex: s.orderIndex?.toString() ?? '' });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.slug) { toast.error('Name and slug are required'); return; }
    if (!form.courseId) { toast.error('Course is required'); return; }
    editing ? updateMut.mutate() : createMut.mutate();
  };

  const isBusy = createMut.isPending || updateMut.isPending;
  const courses = coursesData?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} subjects</p>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(empty); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

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
              <label className="text-xs font-medium text-muted-foreground">Course</label>
              <select value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">— No course —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {['Name', 'Slug', 'Course', 'Topics', 'Order', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.data ?? []).length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No subjects found</td></tr>
              ) : (data?.data ?? []).map(s => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.slug}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.course?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.topicsCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.orderIndex ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm(`Delete "${s.name}"?`)) deleteMut.mutate(s.id); }}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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

// ══════════════════════════════════════════════════════════════════════════════
// ── Topics Tab ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function TopicsTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Topic | null>(null);
  const empty = { title: '', slug: '', shortDescription: '', difficulty: '', subjectId: '', orderIndex: '' };
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-topics', page],
    queryFn: () => api.get('/admin/topics', { params: { page, limit: LIMIT } }).then(r => r.data as { data: Topic[]; total: number; page: number; totalPages: number }),
    staleTime: 30_000,
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: () => api.get('/admin/subjects').then(r => r.data as { data: { id: string; name: string; categoryType: string }[] }),
  });

  const createMut = useMutation({
    mutationFn: () => api.post('/admin/topics', {
      title: form.title, slug: form.slug, shortDescription: form.shortDescription || undefined,
      difficulty: form.difficulty || undefined, subjectId: form.subjectId,
      orderIndex: form.orderIndex ? Number(form.orderIndex) : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-topics'] }); toast.success('Topic created!'); closeForm(); },
    onError: (err) => toast.error(apiError(err)),
  });

  const updateMut = useMutation({
    mutationFn: () => api.patch(`/admin/topics/${editing?.id}`, {
      title: form.title, shortDescription: form.shortDescription || undefined,
      difficulty: form.difficulty || undefined, orderIndex: form.orderIndex ? Number(form.orderIndex) : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-topics'] }); toast.success('Topic updated!'); closeForm(); },
    onError: (err) => toast.error(apiError(err)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/topics/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-topics'] }); toast.success('Topic deleted'); },
    onError: (err) => toast.error(apiError(err)),
  });

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(empty); };

  const openEdit = (t: Topic) => {
    setEditing(t);
    setForm({ title: t.title, slug: t.slug, shortDescription: t.shortDescription ?? '', difficulty: t.difficulty ?? '', subjectId: '', orderIndex: t.orderIndex?.toString() ?? '' });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.slug) { toast.error('Title and slug are required'); return; }
    if (!editing && !form.subjectId) { toast.error('Subject is required'); return; }
    editing ? updateMut.mutate() : createMut.mutate();
  };

  const displayed = (data?.data ?? []).filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.subject.name.toLowerCase().includes(search.toLowerCase())
  );

  const isBusy = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search topics..."
          className="w-full max-w-sm h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(empty); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors ml-3">
          <Plus className="w-4 h-4" /> Add Topic
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-background rounded-xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{editing ? 'Edit Topic' : 'New Topic'}</h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            {[
              { label: 'Title', key: 'title', placeholder: 'Introduction to Arrays' },
              { label: 'Slug', key: 'slug', placeholder: 'arrays-intro', disabled: !!editing },
              { label: 'Short Description', key: 'shortDescription', placeholder: 'Brief description...' },
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
              <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
              <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">— None —</option>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {!editing && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Subject</label>
                <select value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">— Select subject —</option>
                  {(subjectsData?.data ?? []).map(s => <option key={s.id} value={s.id}>[{s.categoryType}] {s.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={handleSubmit} disabled={isBusy}
                className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editing ? 'Save changes' : 'Create topic'}
              </button>
              <button onClick={closeForm} className="px-4 h-9 border border-border rounded-lg text-sm hover:bg-accent">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />)}</div>
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
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">No topics found</td></tr>
              ) : displayed.map(t => (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{t.subject.name}</p>
                    <p className="text-xs text-muted-foreground">{t.subject.categoryType}</p>
                  </td>
                  <td className="px-4 py-3">
                    {t.difficulty ? (
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', DIFF_COLORS[t.difficulty])}>
                        {t.difficulty[0] + t.difficulty.slice(1).toLowerCase()}
                      </span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.orderIndex ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm(`Delete "${t.title}"?`)) deleteMut.mutate(t.id); }}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4">
            <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} limit={LIMIT} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Editorials Tab ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function EditorialsTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Editorial | null>(null);
  const emptyForm = {
    topicId: '', slug: '', title: '', summary: '',
    markdownContent: '# Title\n\nContent here...', tags: '',
    estimatedMinutes: '', published: false, includeCodeEditor: false,
  };
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filterPublished, setFilterPublished] = useState('ALL');
  const [previewMode, setPreviewMode] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-editorials', filterPublished, page],
    queryFn: () => api.get('/admin/editorials', {
      params: {
        published: filterPublished === 'PUBLISHED' ? true : filterPublished === 'DRAFT' ? false : undefined,
        page, limit: LIMIT,
      },
    }).then(r => r.data as { data: Editorial[]; total: number; page: number; totalPages: number }),
    staleTime: 30_000,
  });

  const { data: topicsData } = useQuery({
    queryKey: ['admin-topics-all'],
    queryFn: () => api.get('/admin/topics', { params: { limit: 500 } }).then(r => r.data as { data: { id: string; title: string }[] }),
  });

  const createMut = useMutation({
    mutationFn: () => api.post('/admin/editorials', {
      topicId: form.topicId, slug: form.slug, title: form.title,
      summary: form.summary || undefined, markdownContent: form.markdownContent,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined,
      published: form.published, includeCodeEditor: form.includeCodeEditor,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-editorials'] }); toast.success('Editorial created!'); closeForm(); },
    onError: (err) => toast.error(apiError(err)),
  });

  const updateMut = useMutation({
    mutationFn: () => api.patch(`/admin/editorials/${editing?.id}`, {
      title: form.title, summary: form.summary || undefined, markdownContent: form.markdownContent,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined,
      published: form.published, includeCodeEditor: form.includeCodeEditor,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-editorials'] }); toast.success('Editorial updated!'); closeForm(); },
    onError: (err) => toast.error(apiError(err)),
  });

  const deleteMut = useMutation({
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
      topicId: '', slug: ed.slug, title: ed.title, summary: ed.summary ?? '',
      markdownContent: '', tags: ed.tags?.join(', ') ?? '',
      estimatedMinutes: ed.estimatedMinutes?.toString() ?? '',
      published: ed.published, includeCodeEditor: ed.includeCodeEditor ?? false,
    });
    api.get(`/admin/editorials/${ed.id}`).then(r => {
      setForm(p => ({ ...p, markdownContent: r.data.markdownContent, includeCodeEditor: r.data.includeCodeEditor ?? false }));
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.slug || !form.markdownContent) { toast.error('Title, slug and content are required'); return; }
    if (!editing && !form.topicId) { toast.error('Topic is required'); return; }
    editing ? updateMut.mutate() : createMut.mutate();
  };

  const displayed = (data?.data ?? []).filter(ed =>
    !search || ed.title.toLowerCase().includes(search.toLowerCase()) || ed.topic.title.toLowerCase().includes(search.toLowerCase())
  );

  const isBusy = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64" />
        {['ALL', 'PUBLISHED', 'DRAFT'].map(f => (
          <button key={f} onClick={() => { setFilterPublished(f); setPage(1); }}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              filterPublished === f ? 'bg-indigo-600 text-white' : 'border border-border hover:bg-accent text-muted-foreground')}>
            {f}
          </button>
        ))}
        <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> New Editorial
        </button>
      </div>

      {/* Full-screen editor */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 border-b border-border flex-shrink-0">
            <h2 className="font-semibold">{editing ? 'Edit Editorial' : 'New Editorial'}</h2>
            <div className="flex items-center gap-3">
              <button onClick={() => setPreviewMode(p => !p)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-accent transition-colors">
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
            {/* Metadata panel */}
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
              <div className="flex items-center gap-3 pt-2">
                <input type="checkbox" id="includeCodeEditor" checked={form.includeCodeEditor}
                  onChange={e => setForm(p => ({ ...p, includeCodeEditor: e.target.checked }))} className="rounded border-border" />
                <label htmlFor="includeCodeEditor" className="text-xs font-medium text-muted-foreground">Include Code Editor</label>
              </div>
            </div>

            {/* Editor / Preview */}
            {previewMode ? (
              <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 flex flex-col border-r border-border overflow-hidden">
                  <div className="px-4 py-2 border-b border-border bg-muted/30 flex-shrink-0"><span className="text-xs font-medium text-muted-foreground">Markdown</span></div>
                  <textarea value={form.markdownContent} onChange={e => setForm(p => ({ ...p, markdownContent: e.target.value }))}
                    className="flex-1 w-full p-6 font-mono text-sm bg-background resize-none focus:outline-none" spellCheck={false} />
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-4 py-2 border-b border-border bg-muted/30 flex-shrink-0"><span className="text-xs font-medium text-muted-foreground">Preview</span></div>
                  <div className="flex-1 overflow-y-auto p-8"><MarkdownPreview content={form.markdownContent} /></div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <textarea value={form.markdownContent} onChange={e => setForm(p => ({ ...p, markdownContent: e.target.value }))}
                  className="flex-1 w-full p-6 font-mono text-sm bg-background resize-none focus:outline-none" spellCheck={false} />
              </div>
            )}
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
                {['Title', 'Topic', 'Tags', 'Minutes', 'Code Editor', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayed.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No editorials found</td></tr>
              ) : displayed.map(ed => (
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
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                      ed.includeCodeEditor ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-muted text-muted-foreground')}>
                      {ed.includeCodeEditor ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePublish.mutate(ed)}
                      className={cn('px-2 py-0.5 rounded-full text-xs font-medium transition-colors',
                        ed.published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground')}>
                      {ed.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(ed)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm(`Delete "${ed.title}"?`)) deleteMut.mutate(ed.id); }}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4">
            <Pagination page={page} totalPages={data?.totalPages ?? 1} total={data?.total ?? 0} limit={LIMIT} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
