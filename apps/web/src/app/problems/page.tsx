'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getProblems, type Problem } from '@/lib/problems';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Code2 } from 'lucide-react';

const DIFF_STYLES: Record<string, string> = {
  BEGINNER: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  INTERMEDIATE: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  ADVANCED: 'text-red-500 bg-red-50 dark:bg-red-900/20',
};

const DIFF_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
};

const PAGE_SIZE = 20;

export default function ProblemsPage() {
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['problems', difficulty, page],
    queryFn: () => getProblems({ difficulty: difficulty || undefined, page, limit: PAGE_SIZE }),
    staleTime: 60_000,
  });

  const problems = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Code2 className="w-6 h-6 text-indigo-600" /> Practice Problems
        </h1>
        <p className="text-muted-foreground text-sm">
          Solve problems and submit your solution to get instant feedback.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Difficulty:</span>
        {['', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((d) => (
          <button
            key={d}
            onClick={() => { setDifficulty(d); setPage(1); }}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
              difficulty === d
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
          >
            {d === '' ? 'All' : DIFF_LABELS[d]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">#</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Title</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Topic</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Difficulty</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Submissions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3"><div className="h-4 w-6 bg-muted animate-pulse rounded" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded w-48" /></td>
                  <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-muted animate-pulse rounded w-24" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded w-20" /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-muted animate-pulse rounded w-12 ml-auto" /></td>
                </tr>
              ))
            ) : problems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No problems found.
                </td>
              </tr>
            ) : (
              problems.map((problem: Problem, idx: number) => (
                <tr key={problem.id} className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <Link
                        href={`/problems/${problem.slug}`}
                        className="font-medium text-foreground hover:text-indigo-600 transition-colors"
                      >
                        {problem.title}
                      </Link>
                      {problem.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {problem.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 rounded text-xs bg-secondary text-secondary-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                    {problem.topic.title}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', DIFF_STYLES[problem.difficulty])}>
                      {DIFF_LABELS[problem.difficulty]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-right text-muted-foreground">
                    {problem._count.submissions}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
