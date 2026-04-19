'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { api, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { getSolvedProblemIds } from '@/lib/problems';

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  topic: {
    title: string;
    slug: string;
    subject: {
      name: string;
      categoryType: string;
    };
  };
  _count: {
    submissions: number;
  };
}

interface PracticeCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryType?: string;
}

const difficultyColors = {
  BEGINNER: 'text-green-600 bg-green-50 dark:bg-green-900/30',
  INTERMEDIATE: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30',
  ADVANCED: 'text-red-600 bg-red-50 dark:bg-red-900/30',
};

const difficultyLabels = {
  BEGINNER: 'Easy',
  INTERMEDIATE: 'Medium',
  ADVANCED: 'Hard',
};

export default function PracticeCategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  // Get practice category info
  const { data: categories } = useQuery({
    queryKey: ['practice-categories'],
    queryFn: () => api.get('/content/practice-categories').then(r => r.data as PracticeCategory[]),
  });

  const category = categories?.find(c => c.slug === slug);

  // Get problems filtered by category type if specified
  const { data: problemsData, isLoading } = useQuery({
    queryKey: ['practice-problems', slug, category?.categoryType],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      const res = await api.get(`/problems?${params}`);
      let problems = res.data.data as Problem[];
      
      // Filter by category type if the practice category has one
      if (category?.categoryType) {
        problems = problems.filter(p => p.topic.subject.categoryType === category.categoryType);
      }
      
      return problems;
    },
    enabled: !!category || !!slug,
  });

  // Get user's solved problem IDs
  const { data: solvedIds = [] } = useQuery({
    queryKey: ['solved-problem-ids'],
    queryFn: getSolvedProblemIds,
    enabled: !!user,
    staleTime: 30_000,
  });
  const solvedSet = new Set(solvedIds);

  const getStatus = (problemId: string) => {
    if (!user) return 'not-attempted';
    return solvedSet.has(problemId) ? 'solved' : 'not-attempted';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/problems" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to all problems
          </Link>
          <h1 className="text-3xl font-bold">{category?.name || 'Practice Problems'}</h1>
          {category?.description && (
            <p className="text-muted-foreground mt-2">{category.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold">{problemsData?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Total Problems</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-green-600">
              {problemsData?.filter(p => p.difficulty === 'BEGINNER').length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Easy</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-yellow-600">
              {problemsData?.filter(p => p.difficulty === 'INTERMEDIATE').length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Medium</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-red-600">
              {problemsData?.filter(p => p.difficulty === 'ADVANCED').length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Hard</p>
          </div>
        </div>

        {/* Problems table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium w-12">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Problem</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Topic</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Difficulty</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Submissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading problems...
                  </td>
                </tr>
              ) : !problemsData?.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No problems available in this category yet.
                  </td>
                </tr>
              ) : (
                problemsData.map((problem, idx) => {
                  const status = getStatus(problem.id);
                  return (
                    <tr key={problem.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        {status === 'solved' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground/40" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link 
                          href={`/problems/${problem.slug}`}
                          className="font-medium text-sm hover:text-indigo-600 transition-colors"
                        >
                          {idx + 1}. {problem.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {problem.topic.title}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          difficultyColors[problem.difficulty]
                        )}>
                          {difficultyLabels[problem.difficulty]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {problem._count.submissions}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
