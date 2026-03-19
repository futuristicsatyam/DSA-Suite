'use client';

export const dynamic = 'force-dynamic';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  BookOpen, Bookmark, CheckCircle2, TrendingUp,
  Clock, ArrowRight, BarChart2, Flame,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { api, cn } from '@/lib/utils';

interface DashboardData {
  continueLearning: any[];
  recentlyViewed: any[];
  bookmarks: any[];
  progressSummary: { completedCount: number; totalTopics: number; percent: number };
  streak: number;
  weeklyActivity: { date: string; count: number }[];
  recommendations: any[];
}

const DIFF_STYLES: Record<string, string> = {
  BEGINNER: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  INTERMEDIATE: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  ADVANCED: 'text-red-500 bg-red-50 dark:bg-red-900/20',
};

const CATEGORY_HREF: Record<string, string> = {
  DSA: '/dsa', CP: '/cp', GATE: '/gate',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?from=/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/user/dashboard').then(r => r.data as DashboardData),
    enabled: isAuthenticated,
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/profile"
          className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-bold hover:bg-indigo-700 transition-colors">
          {user?.name.charAt(0).toUpperCase()}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: CheckCircle2, label: 'Completed', value: data?.progressSummary.completedCount ?? 0, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { icon: BookOpen, label: 'Total Topics', value: data?.progressSummary.totalTopics ?? 0, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { icon: Flame, label: 'Day Streak', value: data?.streak ?? 0, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { icon: TrendingUp, label: 'Progress', value: `${data?.progressSummary.percent ?? 0}%`, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', stat.bg)}>
              <stat.icon className={cn('w-4 h-4', stat.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold">{isLoading ? '—' : stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {data && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall progress</span>
            <span className="text-muted-foreground">{data.progressSummary.completedCount} / {data.progressSummary.totalTopics} topics</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${data.progressSummary.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Weekly activity */}
      {data?.weeklyActivity && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Weekly activity</h2>
          </div>
          <div className="flex items-end gap-2 h-16">
            {data.weeklyActivity.map((day) => {
              const max = Math.max(...data.weeklyActivity.map(d => d.count), 1);
              const height = day.count === 0 ? 4 : Math.max(8, (day.count / max) * 64);
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={cn('w-full rounded-sm transition-all', day.count > 0 ? 'bg-indigo-600' : 'bg-secondary')}
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Continue learning */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Continue learning
            </h2>
          </div>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}</div>
          ) : data?.continueLearning.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-sm text-muted-foreground">No topics in progress yet.</p>
              <Link href="/dsa" className="text-indigo-600 text-sm hover:underline">Start with DSA →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.continueLearning.slice(0, 4).map((item: any) => (
                <Link
                  key={item.id}
                  href={`/${item.topic.subject.categoryType.toLowerCase()}?topic=${item.topic.slug}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.topic.title}</p>
                    <p className="text-xs text-muted-foreground">{item.topic.subject.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${item.progressPercent}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{item.progressPercent}%</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Bookmarks */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-muted-foreground" /> Bookmarks
            </h2>
            <Link href="/bookmarks" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}</div>
          ) : data?.bookmarks.length === 0 ? (
            <div className="text-center py-6 space-y-2">
              <p className="text-sm text-muted-foreground">No bookmarks yet.</p>
              <Link href="/dsa" className="text-indigo-600 text-sm hover:underline">Explore topics →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.bookmarks.slice(0, 4).map((item: any) => (
                <Link
                  key={item.id}
                  href={`/${item.topic?.subject?.categoryType?.toLowerCase() ?? 'dsa'}?topic=${item.topic?.slug}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.topic?.title}</p>
                    <p className="text-xs text-muted-foreground">{item.topic?.subject?.name}</p>
                  </div>
                  {item.topic?.difficulty && (
                    <span className={cn('text-xs px-2 py-0.5 rounded-full flex-shrink-0', DIFF_STYLES[item.topic.difficulty])}>
                      {item.topic.difficulty[0] + item.topic.difficulty.slice(1).toLowerCase()}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/dsa', label: 'Learn DSA', icon: '📚', color: 'text-indigo-600' },
          { href: '/cp', label: 'Practice CP', icon: '🏆', color: 'text-blue-600' },
          { href: '/gate', label: 'Study GATE', icon: '🎓', color: 'text-purple-600' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors text-center"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className={cn('text-sm font-medium', item.color)}>{item.label}</span>
          </Link>
        ))}
      </div>

    </main>
  );
}
