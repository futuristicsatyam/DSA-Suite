'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, BookOpen, Tag, FileText, Loader2 } from 'lucide-react';
import { api, cn } from '@/lib/utils';

interface SearchResult {
  subjects: { id: string; name: string; slug: string; categoryType: string }[];
  topics: { id: string; title: string; slug: string; shortDescription: string | null; subject: { name: string; categoryType: string } }[];
  editorials: { id: string; title: string; slug: string; topic: { slug: string } }[];
}

const CATEGORY_HREF: Record<string, string> = {
  DSA: '/dsa', CP: '/cp', GATE: '/gate',
};

const CATEGORY_COLOR: Record<string, string> = {
  DSA: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
  CP: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  GATE: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
};

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults(null);
      setActiveIndex(0);
    }
  }, [open]);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults(null); return; }
    setIsLoading(true);
    try {
      const { data } = await api.get(`/content/search?q=${encodeURIComponent(q)}`);
      setResults(data);
      setActiveIndex(0);
    } catch {
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q), 300);
  };

  // Flatten results for keyboard nav
  const allResults = [
    ...(results?.topics ?? []).map(t => ({
      type: 'topic' as const,
      label: t.title,
      sub: t.subject.name,
      category: t.subject.categoryType,
      href: `${CATEGORY_HREF[t.subject.categoryType]}?topic=${t.slug}`,
    })),
    ...(results?.subjects ?? []).map(s => ({
      type: 'subject' as const,
      label: s.name,
      sub: s.categoryType,
      category: s.categoryType,
      href: CATEGORY_HREF[s.categoryType],
    })),
    ...(results?.editorials ?? []).map(e => ({
      type: 'editorial' as const,
      label: e.title,
      sub: 'Editorial',
      category: 'DSA',
      href: `/dsa?topic=${e.topic.slug}`,
    })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && allResults[activeIndex]) {
      navigate(allResults[activeIndex].href);
    }
  };

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  if (!open) return null;

  const hasResults = allResults.length > 0;
  const showEmpty = query.trim().length >= 2 && !isLoading && !hasResults;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-xl bg-background rounded-2xl border border-border shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          {isLoading
            ? <Loader2 className="w-5 h-5 text-muted-foreground animate-spin flex-shrink-0" />
            : <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search topics, subjects, editorials..."
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }}
              className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Empty state */}
          {!query && (
            <div className="px-4 py-8 text-center space-y-2">
              <Search className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Search for topics, subjects or editorials</p>
              <p className="text-xs text-muted-foreground">Try "arrays", "BFS", "OS", "DP"</p>
            </div>
          )}

          {/* No results */}
          {showEmpty && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No results for <span className="font-medium text-foreground">"{query}"</span></p>
            </div>
          )}

          {/* Topics */}
          {(results?.topics?.length ?? 0) > 0 && (
            <div className="p-2">
              <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Topics</p>
              {results!.topics.map((topic, i) => {
                const idx = i;
                return (
                  <button key={topic.id} onClick={() => navigate(`${CATEGORY_HREF[topic.subject.categoryType]}?topic=${topic.slug}`)}
                    className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      activeIndex === idx ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-accent')}>
                    <div className={cn('w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0', CATEGORY_COLOR[topic.subject.categoryType])}>
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{topic.title}</p>
                      <p className="text-xs text-muted-foreground">{topic.subject.name} · {topic.subject.categoryType}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Subjects */}
          {(results?.subjects?.length ?? 0) > 0 && (
            <div className="p-2 border-t border-border">
              <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subjects</p>
              {results!.subjects.map((subject, i) => {
                const idx = (results?.topics?.length ?? 0) + i;
                return (
                  <button key={subject.id} onClick={() => navigate(CATEGORY_HREF[subject.categoryType])}
                    className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      activeIndex === idx ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-accent')}>
                    <div className={cn('w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0', CATEGORY_COLOR[subject.categoryType])}>
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">{subject.categoryType}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Editorials */}
          {(results?.editorials?.length ?? 0) > 0 && (
            <div className="p-2 border-t border-border">
              <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Editorials</p>
              {results!.editorials.map((ed, i) => {
                const idx = (results?.topics?.length ?? 0) + (results?.subjects?.length ?? 0) + i;
                return (
                  <button key={ed.id} onClick={() => navigate(`/dsa?topic=${ed.topic.slug}`)}
                    className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      activeIndex === idx ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-accent')}>
                    <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-green-600 bg-green-50 dark:bg-green-900/20">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ed.title}</p>
                      <p className="text-xs text-muted-foreground">Editorial</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer hint */}
          {hasResults && (
            <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">↑↓</kbd> navigate</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">↵</kbd> select</span>
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">ESC</kbd> close</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
