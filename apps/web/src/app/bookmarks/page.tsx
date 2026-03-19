'use client';

export const dynamic = 'force-dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Bookmark, Trash2, ArrowRight, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { api, apiError, cn } from '@/lib/utils';

interface BookmarkItem {
  id: string;
  createdAt: string;
  topic: {
    id: string; title: string; slug: string;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null;
    subject: { name: string; categoryType: 'DSA' | 'CP' | 'GATE'; };
  } | null;
}

const DIFF_STYLES: Record<string, string> = {
  BEGINNER: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  INTERMEDIATE: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  ADVANCED: 'text-red-500 bg-red-50 dark:bg-red-900/20',
};

const CATEGORY_COLOR: Record<string, string> = {
  DSA: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
  CP: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  GATE: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
};

export default function BookmarksPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login?from=/bookmarks');
  }, [authLoading, isAuthenticated, router]);

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.get<BookmarkItem[]>('/user/bookmarks').then(r => r.data),
    enabled: isAuthenticated,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/user/bookmarks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmark removed');
    },
    onError: (err) => toast.error(apiError(err)),
  });

  // Group by category
  const grouped = bookmarks.reduce<Record<string, BookmarkItem[]>>((acc, b) => {
    const cat = b.topic?.subject?.categoryType ?? 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(b);
    return acc;
  }, {});

  if (authLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-40" />
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl" />)}
    </div>
  );

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
          <Bookmark className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Bookmarks</h1>
          <p className="text-muted-foreground text-sm">{bookmarks.length} saved topics</p>
        </div>
      </div>

      {/* Empty state */}
      {!isLoading && bookmarks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No bookmarks yet</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Bookmark topics while studying to quickly come back to them later.
          </p>
          <Link href="/dsa" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
            Start exploring DSA
          </Link>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* Grouped bookmarks */}
      {!isLoading && Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', CATEGORY_COLOR[category] ?? 'text-muted-foreground bg-muted')}>
              {category}
            </span>
            <span className="text-xs text-muted-foreground">{items.length} topics</span>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors group">
                <Link
                  href={`/${item.topic?.subject?.categoryType?.toLowerCase() ?? 'dsa'}?topic=${item.topic?.slug}`}
                  className="flex-1 flex items-center gap-3 min-w-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.topic?.title}</p>
                    <p className="text-xs text-muted-foreground">{item.topic?.subject?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.topic?.difficulty && (
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', DIFF_STYLES[item.topic.difficulty])}>
                        {item.topic.difficulty[0] + item.topic.difficulty.slice(1).toLowerCase()}
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
                <button
                  onClick={() => removeMutation.mutate(item.id)}
                  disabled={removeMutation.isPending}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                  title="Remove bookmark"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

    </main>
  );
}
