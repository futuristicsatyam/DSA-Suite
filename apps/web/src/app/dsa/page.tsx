'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, BookOpen, Circle, ArrowRight, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';

interface Topic {
  id: string; slug: string; title: string;
  shortDescription: string | null;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null;
  orderIndex: number | null;
}
interface Subject { id: string; name: string; slug: string; topics: Topic[]; }
interface Editorial { title: string; summary: string | null; markdownContent: string; tags: string[]; estimatedMinutes: number | null; }

const DIFF_STYLES = {
  BEGINNER: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  INTERMEDIATE: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  ADVANCED: 'text-red-500 bg-red-50 dark:bg-red-900/20',
};

const DSA_TABS = [
  { label: 'Data Structures', slugs: ['arrays','strings','linked-list','stack','queue','tree','graph','dynamic-programming','hashing'] },
  { label: 'Algorithms', slugs: ['sorting','binary-search','greedy','two-pointers','sliding-window','divide-and-conquer','bit-manipulation','recursion','backtracking'] },
];

const PLACEHOLDER = `> [!NOTE]\n> This topic does not have a written editorial yet.\n\n## Coming Soon\n\nOur team is working on detailed notes for this topic.`;

function DsaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get('topic');
  const [activeTab, setActiveTab] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['dsa-subjects'],
    queryFn: () => api.get('/content/dsa/subjects').then(r => r.data as Subject[]),
    staleTime: 5 * 60_000,
  });

  const { data: topicData, isLoading: topicLoading } = useQuery({
    queryKey: ['dsa-topic', selectedSlug],
    queryFn: () => api.get(`/content/dsa/topics/${selectedSlug}`).then(r => r.data as { topic: Topic; editorial: Editorial | null }),
    enabled: !!selectedSlug,
    staleTime: 5 * 60_000,
  });

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.get('/user/bookmarks').then(r => r.data as any[]),
    enabled: isAuthenticated,
  });

  const isBookmarked = bookmarks.some((b: any) => b.topic?.slug === selectedSlug);
  const bookmarkId = bookmarks.find((b: any) => b.topic?.slug === selectedSlug)?.id;

  const bookmarkMutation = useMutation({
    mutationFn: () => isBookmarked
      ? api.delete(`/user/bookmarks/${bookmarkId}`)
      : api.post('/user/bookmarks', { topicId: topicData?.topic?.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success(isBookmarked ? 'Bookmark removed' : 'Bookmarked!');
    },
    onError: () => toast.error('Please login to bookmark topics'),
  });

  const selectTopic = (slug: string) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('topic', slug);
    router.push(`/dsa?${p.toString()}`, { scroll: false });
  };

  const visibleSubjects = subjects.filter(s => DSA_TABS[activeTab].slugs.includes(s.slug));

  const toggleExpand = (slug: string) => {
    setExpanded(prev => { const n = new Set(prev); n.has(slug) ? n.delete(slug) : n.add(slug); return n; });
  };

  useEffect(() => {
    if (selectedSlug && subjects.length) {
      const sub = subjects.find(s => s.topics.some(t => t.slug === selectedSlug));
      if (sub) setExpanded(prev => new Set([...prev, sub.slug]));
    }
  }, [selectedSlug, subjects]);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Data Structures & Algorithms</h1>
        <p className="text-muted-foreground text-sm mt-1">Master every DS and algorithm concept with structured editorials.</p>
      </div>
      <div className="flex gap-6 items-start">
        <aside className="w-64 flex-shrink-0 hidden md:block sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="flex rounded-lg bg-muted p-1 mb-4">
            {DSA_TABS.map((tab, i) => (
              <button key={tab.label} onClick={() => setActiveTab(i)}
                className={cn('flex-1 text-xs font-medium py-1.5 rounded-md transition-colors', activeTab === i ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            {subjectsLoading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 bg-muted animate-pulse rounded-lg" />) :
              visibleSubjects.length === 0 ? <p className="text-xs text-muted-foreground px-2 py-4 text-center">No content yet</p> :
                visibleSubjects.map(subject => {
                  const isOpen = expanded.has(subject.slug);
                  return (
                    <div key={subject.id}>
                      <button onClick={() => toggleExpand(subject.slug)}
                        className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm font-semibold hover:bg-accent transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-left">{subject.name}</span>
                        </div>
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="ml-1 pl-3 border-l border-border mt-1 space-y-0.5">
                          {subject.topics.sort((a, b) => (a.orderIndex ?? 999) - (b.orderIndex ?? 999)).map(topic => {
                            const active = topic.slug === selectedSlug;
                            return (
                              <button key={topic.id} onClick={() => selectTopic(topic.slug)}
                                className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all',
                                  active ? 'bg-indigo-600 text-white font-medium' : 'text-foreground hover:bg-accent')}>
                                <Circle className={cn('w-3 h-3 flex-shrink-0', active ? 'text-indigo-200' : 'text-muted-foreground')} />
                                <span className="flex-1 leading-snug">{topic.title}</span>
                                {topic.difficulty && !active && (
                                  <span className={cn('text-xs px-1 rounded flex-shrink-0', DIFF_STYLES[topic.difficulty])}>
                                    {topic.difficulty[0]}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {!selectedSlug ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <ArrowRight className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold">Select a topic</h2>
              <p className="text-sm text-muted-foreground max-w-xs">Choose a topic from the sidebar to start reading.</p>
            </div>
          ) : topicLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className={`h-4 bg-muted rounded ${i % 3 === 0 ? 'w-1/3' : 'w-full'}`} />)}
            </div>
          ) : topicData ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl font-bold">{topicData.topic.title}</h1>
                  <button
                    onClick={() => bookmarkMutation.mutate()}
                    disabled={bookmarkMutation.isPending}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0',
                      isBookmarked
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'border border-border hover:bg-accent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {isBookmarked
                      ? <><BookmarkCheck className="w-3.5 h-3.5" /> Bookmarked</>
                      : <><Bookmark className="w-3.5 h-3.5" /> Bookmark</>
                    }
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {topicData.topic.difficulty && (
                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', DIFF_STYLES[topicData.topic.difficulty])}>
                      {topicData.topic.difficulty[0] + topicData.topic.difficulty.slice(1).toLowerCase()}
                    </span>
                  )}
                  {topicData.editorial?.estimatedMinutes && (
                    <span className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Clock className="w-3.5 h-3.5" />{topicData.editorial.estimatedMinutes} min read
                    </span>
                  )}
                  {topicData.editorial?.tags?.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">{tag}</span>
                  ))}
                </div>
                {topicData.topic.shortDescription && (
                  <p className="text-muted-foreground text-sm border-l-2 border-indigo-400 pl-3">{topicData.topic.shortDescription}</p>
                )}
              </div>
              <hr className="border-border" />
              <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-indigo-600 prose-code:text-indigo-600 prose-code:bg-indigo-50 dark:prose-code:bg-indigo-950/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:p-0 prose-pre:bg-transparent">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight, rehypeSlug]}
                  components={{
                    pre({ children, ...props }) {
                      const code = (children as React.ReactElement)?.props;
                      return (
                        <div className="relative my-4 rounded-xl overflow-hidden border border-border">
                          <div className="flex items-center px-4 py-2 bg-zinc-900 border-b border-white/10">
                            <span className="text-xs text-zinc-400 font-mono">{code?.className?.replace('language-', '') || 'code'}</span>
                          </div>
                          <pre {...props} className="!m-0 !rounded-none !bg-zinc-950 overflow-x-auto p-4 text-sm">{children}</pre>
                        </div>
                      );
                    },
                    blockquote({ children, ...props }) {
                      const text = String((children as React.ReactElement[])?.[0]?.props?.children ?? '');
                      const type = text.match(/^\[!(NOTE|TIP|WARNING|IMPORTANT)\]/i)?.[1]?.toUpperCase();
                      const styles: Record<string, string> = {
                        NOTE: 'border-blue-400 bg-blue-50 dark:bg-blue-950/20',
                        TIP: 'border-green-400 bg-green-50 dark:bg-green-950/20',
                        WARNING: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20',
                        IMPORTANT: 'border-purple-400 bg-purple-50 dark:bg-purple-950/20',
                      };
                      const icons: Record<string, string> = { NOTE: 'ℹ️', TIP: '💡', WARNING: '⚠️', IMPORTANT: '📌' };
                      if (type && styles[type]) {
                        return <div className={cn('not-prose border-l-4 px-4 py-3 rounded-r-lg my-4 text-sm', styles[type])}>
                          <p className="font-semibold mb-1">{icons[type]} {type}</p><div>{children}</div>
                        </div>;
                      }
                      return <blockquote {...props}>{children}</blockquote>;
                    },
                  }}>
                  {topicData.editorial?.markdownContent ?? PLACEHOLDER}
                </ReactMarkdown>
              </article>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default function DsaPage() {
  return (
    <Suspense fallback={<div className="max-w-screen-2xl mx-auto px-4 py-10 animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-48" /></div>}>
      <DsaContent />
    </Suspense>
  );
}

