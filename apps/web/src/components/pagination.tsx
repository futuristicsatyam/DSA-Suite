'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build page list: always include 1, last, current ±1, with ellipsis gaps
  const pages: (number | '...')[] = [];
  const range: number[] = [];

  for (
    let i = Math.max(2, page - 1);
    i <= Math.min(totalPages - 1, page + 1);
    i++
  ) {
    range.push(i);
  }

  if (range[0] > 2) pages.push(1, '...');
  else pages.push(1);

  pages.push(...range);

  if (range[range.length - 1] < totalPages - 1) pages.push('...', totalPages);
  else if (totalPages > 1) pages.push(totalPages);

  return (
    <div className="flex items-center justify-between px-1 py-3 border-t border-border">
      <p className="text-sm text-muted-foreground">
        Showing{' '}
        <span className="font-medium text-foreground">{from}–{to}</span>
        {' '}of{' '}
        <span className="font-medium text-foreground">{total}</span>{' '}
        results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span
              key={`ellipsis-${i}`}
              className="px-2 text-sm text-muted-foreground select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`min-w-[32px] h-8 px-2 rounded-md text-sm transition-colors ${
                p === page
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-secondary text-foreground'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
