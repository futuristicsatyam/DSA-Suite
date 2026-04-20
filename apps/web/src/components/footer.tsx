'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Code, Github, Mail } from 'lucide-react';
import { api } from '@/lib/utils';

interface FooterItem { name: string; slug: string }

export function Footer() {
  const [courses, setCourses] = useState<FooterItem[]>([]);
  const [practiceCategories, setPracticeCategories] = useState<FooterItem[]>([]);
  const [languages, setLanguages] = useState<FooterItem[]>([]);

  useEffect(() => {
    api.get('/content/courses').then(r => setCourses(r.data)).catch(() => {});
    api.get('/content/practice-categories').then(r => setPracticeCategories(r.data)).catch(() => {});
    api.get('/content/languages').then(r => setLanguages(r.data)).catch(() => {});
  }, []);

  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-border mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
          {/* brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">DSA Suite</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Master Data Structures, Algorithms, CP, and GATE CSE with structured learning paths.
            </p>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center transition-colors">
                <Github className="w-4 h-4" />
              </span>
              <a href="mailto:contact@dsasuite.com" className="w-9 h-9 rounded-lg bg-muted hover:bg-muted-foreground/10 flex items-center justify-center transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* courses */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Courses</h4>
            <ul className="space-y-2.5">
              <li><Link href="/dsa" className="text-sm text-muted-foreground hover:text-foreground transition-colors">DSA</Link></li>
              <li><Link href="/cp" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Competitive Programming</Link></li>
              <li><Link href="/gate" className="text-sm text-muted-foreground hover:text-foreground transition-colors">GATE CSE</Link></li>
              {courses.map((c) => (
                <li key={c.slug}><Link href={`/courses/${c.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{c.name}</Link></li>
              ))}
            </ul>
          </div>

          {/* practice */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Practice</h4>
            <ul className="space-y-2.5">
              <li><Link href="/problems" className="text-sm text-muted-foreground hover:text-foreground transition-colors">All Problems</Link></li>
              {practiceCategories.map((p) => (
                <li key={p.slug}><Link href={`/practice/${p.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{p.name}</Link></li>
              ))}
            </ul>
          </div>

          {/* languages */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Languages</h4>
            <ul className="space-y-2.5">
              {languages.length > 0 ? languages.map((l) => (
                <li key={l.slug}><Link href={`/languages/${l.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.name}</Link></li>
              )) : (
                <>
                  <li><Link href="/problems" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Python</Link></li>
                  <li><Link href="/problems" className="text-sm text-muted-foreground hover:text-foreground transition-colors">JavaScript</Link></li>
                  <li><Link href="/problems" className="text-sm text-muted-foreground hover:text-foreground transition-colors">C++</Link></li>
                  <li><Link href="/problems" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Java</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* company & contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Company</h4>
            <ul className="space-y-2.5">
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link href="/bookmarks" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Bookmarks</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} DSA Suite. Built for deep learning.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
