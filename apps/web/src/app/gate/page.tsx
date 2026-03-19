'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, BookOpen, Circle, ArrowRight, Clock } from 'lucide-react';
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
interface Editorial { title: string; markdownContent: string; tags: string[]; estimatedMinutes: number | null; }

const DIFF_STYLES = {
  BEGINNER: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  INTERMEDIATE: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  ADVANCED: 'text-red-500 bg-red-50 dark:bg-red-900/20',
};

const PLACEHOLDER = `> [!NOTE]\n> Editorial coming soon for this GATE topic.\n\n## Stay tuned!\n\nDetailed GATE CSE notes with previous year questions are being added.`;

function GateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get('topic');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['gate-subjects'],
    queryFn: () => api.get('/content/gate/subjects').then(r => r.data as Subject[]),
    staleTime: 5 * 60_000,
  });

  const { data: topicData, isLoading: topicLoading } = useQuery({
    queryKey: ['gate-topic', selectedSlug],
    queryFn: () => api.get(`/content/gate/topics/${selectedSlug}`).then(r => r.data as { topic: Topic; editorial: Editorial | null }),
    enabled: !!selectedSlug,
    staleTime: 5 * 60_000,
  });

  const selectTopic = (slug: string) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('topic', slug);
    router.push(`/gate?${p.toString()}`, { scroll: false });
  };

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
        <h1 className="text-2xl font-bold">GATE CSE Preparation</h1>
        <p className="text-muted-foreground text-sm mt-1">Complete theory notes for all GATE CSE subjects.</p>
      </div>
      <div className="flex gap-6 items-start">
        <aside className="w-64 flex-shrink-0 hidden md:block sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="space-y-1">
            {isLoading ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-8 bg-muted animate-pulse rounded-lg" />) :
              subjects.map(subject => {
                const isOpen = expanded.has(subject.slug);
                return (
                  <div key={subject.id}>
                    <button onClick={() => toggleExpand(subject.slug)}
                      className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm font-semibold hover:bg-accent transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="truncate text-left">{subject.name}</span>
                      </div>
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                    {isOpen && (
                      <div className="ml-1 pl-3 border-l border-border mt-1 space-y-0.5">
                        {subject.topics.sort((a, b) => (a.orderIndex ?? 999) - (b.orderIndex ?? 999)).map(topic => {
                          const active = topic.slug === selectedSlug;
                          return (
                            <button key={topic.id} onClick={() => selectTopic(topic.slug)}
                              className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all',
                                active ? 'bg-purple-600 text-white font-medium' : 'text-foreground hover:bg-accent')}>
                              <Circle className={cn('w-3 h-3 flex-shrink-0', active ? 'text-purple-200' : 'text-muted-foreground')} />
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
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <ArrowRight className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold">Select a topic</h2>
              <p className="text-sm text-muted-foreground max-w-xs">Choose a GATE subject and topic from the sidebar.</p>
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
                <h1 className="text-2xl font-bold">{topicData.topic.title}</h1>
                <div className="flex flex-wrap gap-2">
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
                  <p className="text-muted-foreground text-sm border-l-2 border-purple-400 pl-3">{topicData.topic.shortDescription}</p>
                )}
              </div>
              <hr className="border-border" />
              <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-purple-600 prose-code:text-purple-600 prose-code:bg-purple-50 dark:prose-code:bg-purple-950/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:p-0 prose-pre:bg-transparent">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight, rehypeSlug]}>
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

export default function GatePage() {
  return (
    <Suspense fallback={<div className="max-w-screen-2xl mx-auto px-4 py-10 animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-48" /></div>}>
      <GateContent />
    </Suspense>
  );
}
