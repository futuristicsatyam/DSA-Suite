import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center space-y-6">
      <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
        <BookOpen className="w-10 h-10 text-indigo-600" />
      </div>
      <div className="space-y-2">
        <h1 className="text-6xl font-bold text-indigo-600">404</h1>
        <h2 className="text-2xl font-bold">Page not found</h2>
        <p className="text-muted-foreground max-w-sm">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Go home
        </Link>
        <Link
          href="/dsa"
          className="px-5 py-2.5 border border-border hover:bg-accent rounded-xl text-sm font-medium transition-colors"
        >
          Browse DSA
        </Link>
      </div>
    </main>
  );
}
