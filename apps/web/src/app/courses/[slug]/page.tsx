'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, BookOpen, Circle, CheckCircle2, ArrowRight, Clock, Bookmark, BookmarkCheck, Check, Menu, X, Code2, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { getProblemsForTopic, getSolvedProblemIds } from '@/lib/problems';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import { CodeRunner } from '@/components/code-runner';

interface Topic {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null;
  orderIndex: number | null;
}

interface Subject {
  id: string;
  name: string;
  slug: string;
  topics: Topic[];
}

interface Course {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  thumbnail: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  dsThumbnail: string | null;
  dsCtaText: string | null;
  dsCtaUrl: string | null;
  algoThumbnail: string | null;
  algoCtaText: string | null;
  algoCtaUrl: string | null;
}

interface Editorial {
  title: string;
  summary: string | null;
  markdownContent: string;
  tags: string[];
  estimatedMinutes: number | null;
  includeCodeEditor?: boolean;
}

interface Progress {
  topicId: string;
  completed: boolean;
  progressPercent: number;
}

const DIFF_STYLES = {
  BEGINNER: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  INTERMEDIATE: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  ADVANCED: 'text-red-500 bg-red-50 dark:bg-red-900/20',
};

const PLACEHOLDER = `> [!NOTE]\n> This topic does not have a written editorial yet.\n\n## Coming Soon\n\nOur team is working on detailed notes for this topic.`;

const ALGORITHM_SLUGS = new Set(['sorting', 'binary-search', 'dynamic-programming', 'greedy', 'two-pointers', 'sliding-window']);

function SidebarContent({ subjects, subjectsLoading, selectedSlug, selectTopic, expanded, toggleExpand, completedTopicIds, isAuthenticated, courseSlug, activeTab, setActiveTab }: any) {
  const isDsaCourse = courseSlug === 'dsa';
  const filteredSubjects = isDsaCourse
    ? subjects.filter((subject: Subject) => activeTab === 'ds' ? !ALGORITHM_SLUGS.has(subject.slug) : ALGORITHM_SLUGS.has(subject.slug))
    : subjects;

  return (
    <>
      {isDsaCourse && (
        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
          <button onClick={() => setActiveTab('ds')} className={cn('flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors', activeTab === 'ds' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}>Data Structures</button>
          <button onClick={() => setActiveTab('algo')} className={cn('flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors', activeTab === 'algo' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground')}>Algorithms</button>
        </div>
      )}
    <div className="space-y-1">
      {subjectsLoading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 bg-muted animate-pulse rounded-lg" />) :
        filteredSubjects.map((subject: Subject) => {
          const isOpen = expanded.has(subject.slug);
          const subjectCompleted = subject.topics.filter((t: Topic) => completedTopicIds.has(t.id)).length;
          return (
            <div key={subject.id}>
              <button onClick={() => toggleExpand(subject.slug)}
                className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm font-semibold hover:bg-accent transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="truncate text-left">{subject.name}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isAuthenticated && subjectCompleted > 0 && (
                    <span className="text-xs text-green-600 font-medium">{subjectCompleted}/{subject.topics.length}</span>
                  )}
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
              </button>
              {isOpen && (
                <div className="ml-1 pl-3 border-l border-border mt-1 space-y-0.5">
                  {subject.topics.sort((a: Topic, b: Topic) => (a.orderIndex ?? 999) - (b.orderIndex ?? 999)).map((topic: Topic) => {
                    const active = topic.slug === selectedSlug;
                    const done = completedTopicIds.has(topic.id);
                    return (
                      <button key={topic.id} onClick={() => selectTopic(topic.slug)}
                        className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all',
                          active ? 'bg-indigo-600 text-white font-medium' : 'text-foreground hover:bg-accent')}>
                        {done && !active
                          ? <CheckCircle2 className="w-3 h-3 flex-shrink-0 text-green-500" />
                          : <Circle className={cn('w-3 h-3 flex-shrink-0', active ? 'text-indigo-200' : 'text-muted-foreground')} />
                        }
                        <span className="flex-1 leading-snug">{topic.title}</span>
                        {topic.difficulty && !active && !done && (
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
    </>
  );
}

function CourseContent({ courseSlug }: { courseSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get('topic');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ds' | 'algo'>('ds');
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  // Fetch course info
  const { data: course, isLoading: courseLoading, error: courseError } = useQuery({
    queryKey: ['course', courseSlug],
    queryFn: () => api.get(`/content/courses/${courseSlug}`).then(r => r.data as Course),
    staleTime: 5 * 60_000,
  });

  // Fetch subjects for this course
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['course-subjects', courseSlug],
    queryFn: () => api.get(`/content/courses/${courseSlug}/subjects`).then(r => r.data as Subject[]),
    staleTime: 5 * 60_000,
    enabled: !!course,
  });

  // Fetch topic data
  const { data: topicData, isLoading: topicLoading } = useQuery({
    queryKey: ['course-topic', courseSlug, selectedSlug],
    queryFn: () => api.get(`/content/courses/${courseSlug}/topics/${selectedSlug}`).then(r => r.data as { topic: Topic & { id: string }; editorial: Editorial | null }),
    enabled: !!selectedSlug && !!course,
    staleTime: 5 * 60_000,
  });

  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.get('/user/bookmarks').then(r => r.data as any[]),
    enabled: isAuthenticated,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['progress'],
    queryFn: () => api.get('/user/progress').then(r => r.data as Progress[]),
    enabled: isAuthenticated,
  });

  const { data: practiceProblems = [] } = useQuery({
    queryKey: ['course-problems', topicData?.topic?.id],
    queryFn: () => getProblemsForTopic(topicData!.topic.id),
    enabled: !!topicData?.topic?.id,
    staleTime: 5 * 60_000,
  });

  const { data: solvedIds = [] } = useQuery({
    queryKey: ['solved-problem-ids'],
    queryFn: getSolvedProblemIds,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
  const solvedSet = new Set(solvedIds);

  // Enrollment status
  const { data: enrollmentStatus } = useQuery({
    queryKey: ['enrollment-status', course?.id],
    queryFn: () => api.get(`/user/enrollments/${course!.id}/status`).then(r => r.data as { enrolled: boolean }),
    enabled: isAuthenticated && !!course?.id,
  });

  const enrollMutation = useMutation({
    mutationFn: () => enrollmentStatus?.enrolled
      ? api.delete(`/user/enrollments/${course!.id}`)
      : api.post('/user/enrollments', { courseId: course!.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment-status', course?.id] });
      qc.invalidateQueries({ queryKey: ['enrollments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(enrollmentStatus?.enrolled ? 'Unenrolled from course' : 'Enrolled successfully! 🎉');
    },
    onError: () => toast.error('Please login to enroll'),
  });

  const isBookmarked = bookmarks.some((b: any) => b.topic?.slug === selectedSlug);
  const bookmarkId = bookmarks.find((b: any) => b.topic?.slug === selectedSlug)?.id;
  const isCompleted = progress.find(p => p.topicId === topicData?.topic?.id)?.completed ?? false;
  const completedTopicIds = new Set(progress.filter(p => p.completed).map(p => p.topicId));

  const bookmarkMutation = useMutation({
    mutationFn: () => isBookmarked ? api.delete(`/user/bookmarks/${bookmarkId}`) : api.post('/user/bookmarks', { topicId: topicData?.topic?.id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bookmarks'] }); toast.success(isBookmarked ? 'Bookmark removed' : 'Bookmarked!'); },
    onError: () => toast.error('Please login to bookmark topics'),
  });

  const progressMutation = useMutation({
    mutationFn: () => api.post('/user/progress', { topicId: topicData?.topic?.id, progressPercent: isCompleted ? 0 : 100, completed: !isCompleted }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['progress'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); toast.success(isCompleted ? 'Marked as incomplete' : 'Topic completed! 🎉'); },
    onError: () => toast.error('Please login to track progress'),
  });

  const selectTopic = (slug: string) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set('topic', slug);
    router.push(`/courses/${courseSlug}?${p.toString()}`, { scroll: false });
    setMobileOpen(false);
  };

  const toggleExpand = (slug: string) => {
    setExpanded(prev => { const n = new Set(prev); n.has(slug) ? n.delete(slug) : n.add(slug); return n; });
  };

  useEffect(() => {
    if (selectedSlug && subjects.length) {
      const sub = subjects.find(s => s.topics.some(t => t.slug === selectedSlug));
      if (sub) {
        setExpanded(prev => new Set([...prev, sub.slug]));
        if (courseSlug === 'dsa') setActiveTab(ALGORITHM_SLUGS.has(sub.slug) ? 'algo' : 'ds');
      }
    }
  }, [selectedSlug, subjects, courseSlug]);

  // Handle course not found
  if (courseError) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
        <p className="text-muted-foreground mb-6">The course you're looking for doesn't exist or has been removed.</p>
        <Link href="/" className="text-indigo-600 hover:underline">Go back home</Link>
      </div>
    );
  }

  const sidebarProps = { subjects, subjectsLoading, selectedSlug, selectTopic, expanded, toggleExpand, completedTopicIds, isAuthenticated, courseSlug, activeTab, setActiveTab };

  const editorial = topicData?.editorial;
  const content = editorial?.markdownContent ?? PLACEHOLDER;

  // Tab-aware thumbnail & CTA for DSA course
  const isDsaCourse = courseSlug === 'dsa';
  const currentThumb = isDsaCourse ? (activeTab === 'ds' ? course?.dsThumbnail : course?.algoThumbnail) || course?.thumbnail : course?.thumbnail;
  const currentCtaText = isDsaCourse ? (activeTab === 'ds' ? course?.dsCtaText : course?.algoCtaText) || course?.ctaText : course?.ctaText;
  const currentCtaUrl = isDsaCourse ? (activeTab === 'ds' ? course?.dsCtaUrl : course?.algoCtaUrl) || course?.ctaUrl : course?.ctaUrl;
  const tabLabel = isDsaCourse ? (activeTab === 'ds' ? 'Data Structures' : 'Algorithms') : course?.name;
  const tabSubjects = isDsaCourse ? subjects.filter(s => activeTab === 'ds' ? !ALGORITHM_SLUGS.has(s.slug) : ALGORITHM_SLUGS.has(s.slug)) : subjects;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{courseLoading ? 'Loading...' : course?.name}</h1>
          <p className="text-muted-foreground text-sm mt-1 hidden sm:block">
            {course?.description || 'Explore subjects and topics in this course.'}
          </p>
        </div>
        <button onClick={() => setMobileOpen(true)} className="md:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-accent text-sm font-medium">
          <Menu className="w-4 h-4" /> Topics
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar - desktop */}
        <aside className="hidden md:block w-64 flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-border bg-card p-4">
          <SidebarContent {...sidebarProps} />
        </aside>

        {/* Mobile sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border p-4 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Topics</span>
                <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <SidebarContent {...sidebarProps} />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {!selectedSlug ? (
            <div className="border border-border rounded-xl bg-card overflow-hidden">
              {currentThumb ? (
                <div className="w-full aspect-video"><img src={currentThumb} alt={tabLabel || 'Course'} referrerPolicy="no-referrer" className="w-full h-full object-cover" /></div>
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"><GraduationCap className="w-20 h-20 text-white/50" /></div>
              )}
              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{tabLabel}</h2>
                    {course?.description && <p className="text-sm text-muted-foreground mt-2">{course.description}</p>}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mt-3">
                      <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {tabSubjects.length} subjects</span>
                      <span className="flex items-center gap-1.5"><Code2 className="w-4 h-4" /> {tabSubjects.reduce((s, sub) => s + sub.topics.length, 0)} topics</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isAuthenticated ? (
                      enrollmentStatus?.enrolled ? (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-sm text-green-600 font-medium"><CheckCircle2 className="w-4 h-4" /> Enrolled</div>
                          <button onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50">Unenroll</button>
                        </div>
                      ) : currentCtaUrl ? (
                        <a href={currentCtaUrl} target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium text-center transition-colors">{currentCtaText || 'Enroll Now'}</a>
                      ) : (
                        <button onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">{enrollMutation.isPending ? 'Enrolling...' : (currentCtaText || 'Enroll Now')}</button>
                      )
                    ) : (
                      <Link href="/login" className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium text-center transition-colors">Login to Enroll</Link>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground"><ArrowRight className="w-3.5 h-3.5 inline mr-1" />Choose a topic from the sidebar to start learning.</p>
              </div>
            </div>
          ) : topicLoading ? (
            <div className="border border-border rounded-xl bg-card p-8 space-y-4">
              <div className="h-8 w-2/3 bg-muted animate-pulse rounded" />
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
              <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
            </div>
          ) : (
            <article className="space-y-6">
              {/* Topic header */}
              <div className="border border-border rounded-xl bg-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">{topicData?.topic?.title}</h2>
                    {editorial?.estimatedMinutes && (
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <Clock className="w-4 h-4" /> {editorial.estimatedMinutes} min read
                      </p>
                    )}
                  </div>
                  {isAuthenticated && (
                    <div className="flex gap-2">
                      <button onClick={() => bookmarkMutation.mutate()} disabled={bookmarkMutation.isPending}
                        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors', isBookmarked ? 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' : 'border-border hover:bg-accent')}>
                        {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        {isBookmarked ? 'Saved' : 'Save'}
                      </button>
                      <button onClick={() => progressMutation.mutate()} disabled={progressMutation.isPending}
                        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors', isCompleted ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20' : 'border-border hover:bg-accent')}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        {isCompleted ? 'Completed' : 'Mark done'}
                      </button>
                    </div>
                  )}
                </div>
                {editorial?.tags && editorial.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {editorial.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Editorial content */}
              <div className="border border-border rounded-xl bg-card p-6 prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeHighlight, rehypeSlug, rehypeKatex]}
                >
                  {content}
                </ReactMarkdown>
              </div>

              {/* Practice problems */}
              {practiceProblems.length > 0 && (
                <div className="border border-border rounded-xl bg-card p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-indigo-600" /> Practice Problems
                  </h3>
                  <div className="space-y-2">
                    {practiceProblems.map((prob: any) => (
                      <Link key={prob.id} href={`/problems/${prob.slug}`}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors group">
                        <div className="flex items-center gap-2">
                          {isAuthenticated && solvedSet.has(prob.id) ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          ) : isAuthenticated ? (
                            <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                          ) : null}
                          <span className="font-medium group-hover:text-indigo-600">{prob.title}</span>
                        </div>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', DIFF_STYLES[prob.difficulty as keyof typeof DIFF_STYLES])}>
                          {prob.difficulty}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Code runner */}
              {topicData?.editorial?.includeCodeEditor && <CodeRunner />}
            </article>
          )}
        </main>
      </div>
    </div>
  );
}

export default function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  
  return (
    <Suspense fallback={
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-6" />
        <div className="flex gap-6">
          <div className="hidden md:block w-64 h-96 bg-muted animate-pulse rounded-xl" />
          <div className="flex-1 h-96 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    }>
      <CourseContent courseSlug={resolvedParams.slug} />
    </Suspense>
  );
}
