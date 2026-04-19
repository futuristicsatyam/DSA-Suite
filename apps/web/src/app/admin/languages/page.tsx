'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Languages, ChevronRight, BookOpen,
  FileText, X, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import { api, cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

interface Language {
  id: string; name: string; slug: string; description?: string;
  icon?: string; thumbnail?: string; ctaText?: string; ctaUrl?: string;
  published: boolean; orderIndex?: number;
  subjectsCount: number; enrollmentsCount: number; createdAt: string;
}

interface Subject {
  id: string; name: string; slug: string; description?: string;
  categoryType?: string; courseId?: string; orderIndex?: number;
  course?: { id: string; name: string }; topicsCount: number;
}

interface Topic {
  id: string; title: string; slug: string; subjectId: string;
  shortDescription?: string; difficulty?: string; orderIndex?: number;
  subject?: { name: string; categoryType?: string };
}

interface Editorial {
  id: string; topicId: string; title: string; slug: string;
  markdownContent: string; published: boolean; includeCodeEditor: boolean;
  orderIndex?: number; createdAt: string;
  topic?: { title: string; slug: string };
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ManageLanguagesPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Languages</h1>
        <p className="text-muted-foreground text-sm mt-1">Programming languages, topics &amp; editorials</p>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => { setSelectedLanguage(null); setSelectedTopic(null); }}
          className={cn('hover:text-foreground transition-colors', !selectedLanguage && 'text-foreground font-medium')}>Languages</button>
        {selectedLanguage && (
          <>
            <ChevronRight className="w-4 h-4" />
            <button onClick={() => setSelectedTopic(null)}
              className={cn('hover:text-foreground transition-colors', !selectedTopic && 'text-foreground font-medium')}>{selectedLanguage.name}</button>
          </>
        )}
        {selectedTopic && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">{selectedTopic.title}</span>
          </>
        )}
      </div>

      {/* Conditional rendering based on selection */}
      {!selectedLanguage ? (
        <LanguagesSection onSelect={setSelectedLanguage} />
      ) : !selectedTopic ? (
        <TopicsInLanguageSection language={selectedLanguage} onSelectTopic={setSelectedTopic} />
      ) : (
        <EditorialsForTopicSection topic={selectedTopic} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Languages Section ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

interface LanguageForm {
  name: string; slug: string; description: string; icon: string;
  thumbnail: string; ctaText: string; ctaUrl: string;
  published: boolean; orderIndex: number;
}

const defaultLangForm: LanguageForm = {
  name: '', slug: '', description: '', icon: '', thumbnail: '',
  ctaText: 'Start Learning', ctaUrl: '', published: true, orderIndex: 0,
};

function LanguagesSection({ onSelect }: { onSelect: (lang: Language) => void }) {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Language | null>(null);
  const [form, setForm] = useState<LanguageForm>(defaultLangForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-languages'],
    queryFn: () => api.get('/admin/languages').then(r => r.data as { data: Language[]; total: number }),
  });

  const createMut = useMutation({
    mutationFn: (d: LanguageForm) => api.post('/admin/languages', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-languages'] }); toast.success('Language created'); close(); },
    onError: () => toast.error('Failed to create language'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, d }: { id: string; d: Partial<LanguageForm> }) => api.patch(`/admin/languages/${id}`, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-languages'] }); toast.success('Language updated'); close(); },
    onError: () => toast.error('Failed to update language'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/languages/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-languages'] }); toast.success('Language deleted'); },
    onError: () => toast.error('Failed to delete language'),
  });

  const close = () => { setIsModalOpen(false); setEditing(null); setForm(defaultLangForm); };
  const slug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const openEdit = (lang: Language) => {
    setEditing(lang);
    setForm({
      name: lang.name, slug: lang.slug, description: lang.description || '', icon: lang.icon || '',
      thumbnail: lang.thumbnail || '', ctaText: lang.ctaText || 'Start Learning',
      ctaUrl: lang.ctaUrl || '', published: lang.published, orderIndex: lang.orderIndex || 0,
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
          <Languages className="w-5 h-5 text-purple-600" /> Languages
        </h2>
        <button onClick={() => { setEditing(null); setForm(defaultLangForm); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Language
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
          ))
        ) : data?.data.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-12">No languages yet.</p>
        ) : data?.data.map(lang => (
          <div key={lang.id} className="border border-border rounded-xl bg-card p-5 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => onSelect(lang)}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                  <Languages className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-indigo-600 transition-colors">{lang.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">/{lang.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => openEdit(lang)} className="p-1.5 rounded-lg hover:bg-accent"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => { if (confirm(`Delete "${lang.name}"?`)) deleteMut.mutate(lang.id); }}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            {lang.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{lang.description}</p>}
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span>{lang.subjectsCount} subjects</span>
              <span>{lang.enrollmentsCount} enrolled</span>
              {lang.published ? (
                <span className="text-green-600 flex items-center gap-1"><Eye className="w-3 h-3" /> Published</span>
              ) : (
                <span className="text-gray-400 flex items-center gap-1"><EyeOff className="w-3 h-3" /> Draft</span>
              )}
            </div>
            <div className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              View Topics <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        ))}
      </div>

      {/* Language Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="relative bg-background rounded-xl border border-border shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h2 className="text-lg font-semibold">{editing ? 'Edit Language' : 'New Language'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input type="text" value={form.name} required placeholder="Python"
                  onChange={e => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slug(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug *</label>
                <input type="text" value={form.slug} required onChange={e => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thumbnail URL</label>
                <input type="text" value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">CTA Text</label>
                  <input type="text" value={form.ctaText} onChange={e => setForm({ ...form, ctaText: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CTA URL</label>
                  <input type="text" value={form.ctaUrl} onChange={e => setForm({ ...form, ctaUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
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
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pub-lang" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} className="rounded" />
                <label htmlFor="pub-lang" className="text-sm">Published</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={close} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent transition-colors">Cancel</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {editing ? 'Save Changes' : 'Create Language'}
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
// ── Topics in Language (Left sidebar layout) ─────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function TopicsInLanguageSection({ language, onSelectTopic }: { language: Language; onSelectTopic: (t: Topic) => void }) {
  const qc = useQueryClient();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicForm, setTopicForm] = useState({ title: '', slug: '', shortDescription: '', difficulty: '', orderIndex: '' });

  // Get subjects for this language (courseId = language.id)
  const { data: subjectsData, isLoading: subjectsLoading } = useQuery({
    queryKey: ['admin-subjects'],
    queryFn: () => api.get('/admin/subjects').then(r => r.data as { data: Subject[]; total: number }),
  });

  const langSubjects = subjectsData?.data.filter(s => s.courseId === language.id) || [];

  // Get topics for selected subject
  const { data: topicsData, isLoading: topicsLoading } = useQuery({
    queryKey: ['admin-topics', selectedSubjectId],
    queryFn: () => api.get(`/admin/topics?subjectId=${selectedSubjectId}&limit=500`).then(r => r.data as { data: Topic[] }),
    enabled: !!selectedSubjectId,
  });

  const topics = topicsData?.data || [];

  const createTopicMut = useMutation({
    mutationFn: (data: any) => api.post('/admin/topics', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-topics', selectedSubjectId] }); toast.success('Topic created'); resetTopicForm(); },
    onError: () => toast.error('Failed to create topic'),
  });

  const updateTopicMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/admin/topics/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-topics', selectedSubjectId] }); toast.success('Topic updated'); resetTopicForm(); },
    onError: () => toast.error('Failed to update topic'),
  });

  const deleteTopicMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/topics/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-topics', selectedSubjectId] }); toast.success('Topic deleted'); },
    onError: () => toast.error('Failed to delete topic'),
  });

  const resetTopicForm = () => {
    setShowTopicForm(false); setEditingTopic(null);
    setTopicForm({ title: '', slug: '', shortDescription: '', difficulty: '', orderIndex: '' });
  };

  const handleEditTopic = (t: Topic) => {
    setEditingTopic(t);
    setTopicForm({
      title: t.title, slug: t.slug, shortDescription: t.shortDescription || '',
      difficulty: t.difficulty || '', orderIndex: t.orderIndex?.toString() || '',
    });
    setShowTopicForm(true);
  };

  const handleTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) { toast.error('Select a subject first'); return; }
    const payload: any = {
      subjectId: selectedSubjectId, title: topicForm.title.trim(), slug: topicForm.slug.trim(),
      shortDescription: topicForm.shortDescription.trim() || undefined,
      difficulty: topicForm.difficulty || undefined,
      orderIndex: topicForm.orderIndex ? parseInt(topicForm.orderIndex) : undefined,
    };
    editingTopic ? updateTopicMut.mutate({ id: editingTopic.id, data: payload }) : createTopicMut.mutate(payload);
  };

  const slugify = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <div className="flex gap-6 min-h-[500px]">
      {/* Left Sidebar - Subjects */}
      <div className="w-64 flex-shrink-0 border border-border rounded-xl bg-card overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/50">
          <h3 className="font-semibold text-sm">Subjects in {language.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{langSubjects.length} subjects</p>
        </div>
        <div className="divide-y divide-border">
          {subjectsLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
          ) : langSubjects.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-xs">
              No subjects found.<br />Create subjects under Manage Courses and assign them to this language.
            </div>
          ) : langSubjects.map(sub => (
            <button key={sub.id} onClick={() => { setSelectedSubjectId(sub.id); setShowTopicForm(false); setEditingTopic(null); }}
              className={cn('w-full text-left px-4 py-3 text-sm hover:bg-accent transition-colors flex items-center justify-between',
                selectedSubjectId === sub.id && 'bg-accent font-medium')}>
              <div>
                <p className="font-medium text-sm">{sub.name}</p>
                <p className="text-xs text-muted-foreground">{sub.topicsCount} topics</p>
              </div>
              <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform', selectedSubjectId === sub.id && 'rotate-90')} />
            </button>
          ))}
        </div>
      </div>

      {/* Right Content - Topics */}
      <div className="flex-1 space-y-4">
        {!selectedSubjectId ? (
          <div className="flex items-center justify-center h-full border border-dashed border-border rounded-xl">
            <div className="text-center text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a subject to view topics</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Topics in {langSubjects.find(s => s.id === selectedSubjectId)?.name}</h3>
              <button onClick={() => { setShowTopicForm(true); setEditingTopic(null); setTopicForm({ title: '', slug: '', shortDescription: '', difficulty: '', orderIndex: '' }); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Add Topic
              </button>
            </div>

            {/* Topic Form */}
            {showTopicForm && (
              <div className="border border-border rounded-xl p-4 bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{editingTopic ? 'Edit Topic' : 'New Topic'}</h4>
                  <button onClick={resetTopicForm}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
                <form onSubmit={handleTopicSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium mb-1">Title *</label>
                      <input type="text" value={topicForm.title} required
                        onChange={e => setTopicForm({ ...topicForm, title: e.target.value, slug: editingTopic ? topicForm.slug : slugify(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
                    <div><label className="block text-xs font-medium mb-1">Slug *</label>
                      <input type="text" value={topicForm.slug} required onChange={e => setTopicForm({ ...topicForm, slug: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono" /></div>
                  </div>
                  <div><label className="block text-xs font-medium mb-1">Short Description</label>
                    <input type="text" value={topicForm.shortDescription} onChange={e => setTopicForm({ ...topicForm, shortDescription: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium mb-1">Difficulty</label>
                      <select value={topicForm.difficulty} onChange={e => setTopicForm({ ...topicForm, difficulty: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                        <option value="">None</option>
                        <option value="BEGINNER">Beginner</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="ADVANCED">Advanced</option>
                      </select></div>
                    <div><label className="block text-xs font-medium mb-1">Order</label>
                      <input type="number" value={topicForm.orderIndex} onChange={e => setTopicForm({ ...topicForm, orderIndex: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={createTopicMut.isPending || updateTopicMut.isPending}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50">
                      {editingTopic ? 'Update' : 'Create'}
                    </button>
                    <button type="button" onClick={resetTopicForm} className="px-3 py-1.5 border border-border rounded-lg hover:bg-accent text-sm">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* Topics List */}
            {topicsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading topics...</div>
            ) : topics.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                <p className="text-sm">No topics in this subject yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topics.map((t, i) => (
                  <div key={t.id}
                    className="flex items-center justify-between p-4 border border-border rounded-xl bg-card hover:shadow-sm transition-shadow cursor-pointer group"
                    onClick={() => onSelectTopic(t)}>
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-medium text-indigo-600">{i + 1}</span>
                      <div>
                        <p className="font-medium text-sm group-hover:text-indigo-600 transition-colors">{t.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">/{t.slug}</p>
                        {t.shortDescription && <p className="text-xs text-muted-foreground mt-0.5">{t.shortDescription}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {t.difficulty && (
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                          t.difficulty === 'BEGINNER' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                          t.difficulty === 'INTERMEDIATE' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                          t.difficulty === 'ADVANCED' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                        )}>{t.difficulty}</span>
                      )}
                      <button onClick={() => handleEditTopic(t)} className="p-1.5 rounded hover:bg-accent"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm('Delete?')) deleteTopicMut.mutate(t.id); }}
                        className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Editorials for Topic ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function EditorialsForTopicSection({ topic }: { topic: Topic }) {
  const qc = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editingEditorial, setEditingEditorial] = useState<Editorial | null>(null);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState({
    title: '', slug: '', markdownContent: '', published: false, includeCodeEditor: false, orderIndex: '',
  });

  // Editorials are linked by topicId — fetch all then filter
  const { data: editorialsData, isLoading } = useQuery({
    queryKey: ['admin-editorials'],
    queryFn: () => api.get('/admin/editorials?limit=500').then(r => r.data as { data: Editorial[] }),
  });

  const editorials = editorialsData?.data.filter(e => e.topicId === topic.id) || [];

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/admin/editorials', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-editorials'] }); toast.success('Editorial created'); resetForm(); },
    onError: () => toast.error('Failed to create editorial'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/admin/editorials/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-editorials'] }); toast.success('Editorial updated'); resetForm(); },
    onError: () => toast.error('Failed to update editorial'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/editorials/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-editorials'] }); toast.success('Editorial deleted'); },
    onError: () => toast.error('Failed to delete editorial'),
  });

  const resetForm = () => {
    setShowEditor(false); setEditingEditorial(null); setPreview(false);
    setForm({ title: '', slug: '', markdownContent: '', published: false, includeCodeEditor: false, orderIndex: '' });
  };

  const slugify = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleEdit = (ed: Editorial) => {
    setEditingEditorial(ed);
    setForm({
      title: ed.title, slug: ed.slug, markdownContent: ed.markdownContent, published: ed.published,
      includeCodeEditor: ed.includeCodeEditor, orderIndex: ed.orderIndex?.toString() || '',
    });
    setShowEditor(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      topicId: topic.id, title: form.title.trim(), slug: form.slug.trim(),
      markdownContent: form.markdownContent, published: form.published, includeCodeEditor: form.includeCodeEditor,
      orderIndex: form.orderIndex ? parseInt(form.orderIndex) : undefined,
    };
    editingEditorial ? updateMut.mutate({ id: editingEditorial.id, data: payload }) : createMut.mutate(payload);
  };

  // Full-screen editor
  if (showEditor) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold">{editingEditorial ? 'Edit Editorial' : 'New Editorial'}</span>
            <span className="text-xs text-muted-foreground">for {topic.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setPreview(!preview)}
              className={cn('px-3 py-1.5 text-sm rounded-lg transition-colors', preview ? 'bg-indigo-600 text-white' : 'border border-border hover:bg-accent')}>
              {preview ? 'Edit' : 'Preview'}
            </button>
            <button onClick={resetForm} className="p-2 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Metadata Panel */}
          <div className="w-72 border-r border-border p-4 space-y-4 overflow-y-auto bg-card">
            <div><label className="block text-xs font-medium mb-1">Title *</label>
              <input type="text" value={form.title} required
                onChange={e => setForm({ ...form, title: e.target.value, slug: editingEditorial ? form.slug : slugify(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div><label className="block text-xs font-medium mb-1">Slug *</label>
              <input type="text" value={form.slug} required onChange={e => setForm({ ...form, slug: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono" /></div>
            <div><label className="block text-xs font-medium mb-1">Order</label>
              <input type="number" value={form.orderIndex} onChange={e => setForm({ ...form, orderIndex: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" /></div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ed-pub" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} className="rounded" />
                <label htmlFor="ed-pub" className="text-sm">Published</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ed-code" checked={form.includeCodeEditor} onChange={e => setForm({ ...form, includeCodeEditor: e.target.checked })} className="rounded" />
                <label htmlFor="ed-code" className="text-sm">Include Code Editor</label>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending || !form.title.trim() || !form.slug.trim()}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
              {editingEditorial ? 'Update Editorial' : 'Create Editorial'}
            </button>
          </div>

          {/* Editor / Preview */}
          <div className="flex-1 overflow-hidden">
            {preview ? (
              <div className="h-full overflow-y-auto p-8 prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeHighlight, rehypeSlug, rehypeKatex]}>
                  {form.markdownContent || '*No content yet*'}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea value={form.markdownContent} onChange={e => setForm({ ...form, markdownContent: e.target.value })}
                className="w-full h-full p-6 bg-background text-sm font-mono resize-none focus:outline-none"
                placeholder="Write editorial content in Markdown..." />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" /> Editorials for {topic.title}
        </h3>
        <button onClick={() => { setShowEditor(true); setEditingEditorial(null); }}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Editorial
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : editorials.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No editorials for this topic yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Editorial</th>
                <th className="text-left px-4 py-3 font-medium">Code Editor</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {editorials.map(ed => (
                <tr key={ed.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{ed.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">{ed.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    {ed.includeCodeEditor ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-medium">Yes</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {ed.published ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs"><Eye className="w-3.5 h-3.5" /> Published</span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground text-xs"><EyeOff className="w-3.5 h-3.5" /> Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(ed)} className="p-2 rounded hover:bg-accent"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Delete?')) deleteMut.mutate(ed.id); }}
                        className="p-2 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
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
