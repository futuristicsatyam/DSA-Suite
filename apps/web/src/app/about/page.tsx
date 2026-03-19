import Link from 'next/link';
import {
  BookOpen, Code2, GraduationCap, TrendingUp,
  Bookmark, Search, CheckCircle2, ArrowRight,
  Github, Heart,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-16">

      {/* Hero */}
      <section className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          <span className="text-2xl font-bold">DSA Suite</span>
        </div>
        <h1 className="text-4xl font-bold leading-tight">
          Built for serious learners,<br />
          <span className="text-indigo-600">not just browsers.</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          DSA Suite is a free, editorial-first learning platform designed to help
          students master Data Structures, Algorithms, Competitive Programming,
          and GATE CSE — with depth, not just definitions.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link href="/dsa"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors">
            Start learning <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/signup"
            className="flex items-center gap-2 px-5 py-2.5 border border-border hover:bg-accent rounded-xl text-sm font-medium transition-colors">
            Create free account
          </Link>
        </div>
      </section>

      {/* Mission */}
      <section className="rounded-2xl border border-border bg-card p-8 space-y-4">
        <h2 className="text-2xl font-bold">Our mission</h2>
        <p className="text-muted-foreground leading-relaxed">
          Most learning platforms show you <em>what</em> to learn. We focus on helping you
          understand <em>why</em> it works. Every editorial on DSA Suite is written with
          intuition first — explaining the thought process before the code.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          We believe that deep understanding beats surface-level memorization, especially
          when it comes to cracking placements, competitive programming contests, or the GATE exam.
        </p>
      </section>

      {/* Learning tracks */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">What we cover</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: Code2,
              color: 'text-indigo-600',
              bg: 'bg-indigo-50 dark:bg-indigo-900/20',
              title: 'Data Structures & Algorithms',
              desc: 'From arrays and linked lists to graphs and dynamic programming. 40+ topics with structured editorials, code examples, and complexity analysis.',
              href: '/dsa',
            },
            {
              icon: TrendingUp,
              color: 'text-blue-600',
              bg: 'bg-blue-50 dark:bg-blue-900/20',
              title: 'Competitive Programming',
              desc: 'Number theory, advanced graph algorithms, string algorithms, and DP patterns used in ICPC, Codeforces, and LeetCode contests.',
              href: '/cp',
            },
            {
              icon: GraduationCap,
              color: 'text-purple-600',
              bg: 'bg-purple-50 dark:bg-purple-900/20',
              title: 'GATE CSE',
              desc: 'Complete theory notes for all 8 GATE CSE subjects — OS, DBMS, CN, TOC, Algorithms, Discrete Math, Digital Logic, and Compiler Design.',
              href: '/gate',
            },
          ].map(track => (
            <Link key={track.href} href={track.href}
              className="group rounded-xl border border-border bg-card p-6 hover:shadow-md transition-all space-y-3">
              <div className={`w-10 h-10 rounded-lg ${track.bg} ${track.color} flex items-center justify-center`}>
                <track.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold">{track.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{track.desc}</p>
              <span className="text-xs text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                Explore <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Platform features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: BookOpen, title: 'Rich editorials', desc: 'Markdown with math (KaTeX), syntax highlighted code, callout blocks and tables' },
            { icon: CheckCircle2, title: 'Progress tracking', desc: 'Mark topics complete, track streaks, and see your overall progress' },
            { icon: Bookmark, title: 'Bookmarks', desc: 'Save any topic for quick access later, grouped by category' },
            { icon: Search, title: 'Instant search', desc: 'Find any topic, subject or editorial instantly with the / shortcut' },
            { icon: TrendingUp, title: 'Dashboard', desc: 'Weekly activity chart, continue learning, and progress overview' },
            { icon: Code2, title: 'Admin panel', desc: 'Full CMS to manage subjects, topics and editorials with a markdown editor' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Built with</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: 'Next.js 15', desc: 'Frontend framework' },
            { name: 'NestJS', desc: 'Backend API' },
            { name: 'PostgreSQL', desc: 'Database' },
            { name: 'Prisma', desc: 'ORM' },
            { name: 'Tailwind CSS', desc: 'Styling' },
            { name: 'TanStack Query', desc: 'Data fetching' },
            { name: 'Vercel', desc: 'Frontend hosting' },
            { name: 'Render', desc: 'API hosting' },
          ].map(t => (
            <div key={t.name} className="p-3 rounded-xl border border-border bg-card text-center space-y-1">
              <p className="font-semibold text-sm">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="rounded-2xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 text-white p-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '108+', label: 'Topics' },
            { value: '28', label: 'Subjects' },
            { value: '3', label: 'Learning tracks' },
            { value: '100%', label: 'Free forever' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-indigo-300 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Open source */}
      <section className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          <h2 className="text-xl font-bold">Made with love for learners</h2>
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
          DSA Suite is built by developers who went through the same grind —
          placement prep, competitive programming, GATE preparation.
          We know what it takes, and we built the resource we wish we had.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link href="https://github.com/futuristicsatyam/DSA-Suite" target="_blank"
            className="flex items-center gap-2 px-4 py-2 border border-border hover:bg-accent rounded-xl text-sm transition-colors">
            <Github className="w-4 h-4" /> View on GitHub
          </Link>
          <Link href="/contact"
            className="flex items-center gap-2 px-4 py-2 border border-border hover:bg-accent rounded-xl text-sm transition-colors">
            Get in touch
          </Link>
        </div>
      </section>

    </main>
  );
}
