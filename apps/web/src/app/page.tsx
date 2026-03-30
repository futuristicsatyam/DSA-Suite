import Link from 'next/link';
import {
  BookOpen, Code2, GraduationCap, Bookmark,
  TrendingUp, Search, ArrowRight, CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Production-ready learning platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Master DSA, Competitive Programming,
            <span className="text-indigo-300"> and GATE CSE</span>
          </h1>

          <p className="text-lg text-indigo-200 max-w-2xl mx-auto leading-relaxed">
            Editorial-first content, structured roadmaps, personalized progress tracking,
            and a clean developer-focused experience.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/signup"
              className="px-6 py-3 bg-white text-indigo-900 font-semibold rounded-xl hover:bg-indigo-50 transition-colors flex items-center gap-2"
            >
              Get started free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dsa"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 font-semibold rounded-xl transition-colors"
            >
              Explore DSA
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-md mx-auto pt-4">
            {[
              { value: '60+', label: 'Topics' },
              { value: '3', label: 'Tracks' },
              { value: 'Free', label: 'Forever' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-indigo-300 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roadmap snapshot ─────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Learning tracks</h2>
          <p className="text-muted-foreground">Structured paths from beginner to advanced</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              href: '/dsa',
              icon: Code2,
              color: 'text-indigo-600',
              bg: 'bg-indigo-50 dark:bg-indigo-900/20',
              border: 'border-indigo-100 dark:border-indigo-900',
              title: 'DSA',
              desc: 'Arrays → Strings → Trees → Graphs → DP',
              topics: '40+ topics',
            },
            {
              href: '/cp',
              icon: TrendingUp,
              color: 'text-blue-600',
              bg: 'bg-blue-50 dark:bg-blue-900/20',
              border: 'border-blue-100 dark:border-blue-900',
              title: 'Competitive Programming',
              desc: 'Number Theory → Graphs → DP → Strings',
              topics: '15+ topics',
            },
            {
              href: '/gate',
              icon: GraduationCap,
              color: 'text-purple-600',
              bg: 'bg-purple-50 dark:bg-purple-900/20',
              border: 'border-purple-100 dark:border-purple-900',
              title: 'GATE CSE',
              desc: 'OS → DBMS → CN → TOC → Algorithms',
              topics: '30+ topics',
            },
          ].map((track) => (
            <Link
              key={track.href}
              href={track.href}
              className={`group rounded-xl border ${track.border} bg-card p-6 hover:shadow-md transition-all space-y-4`}
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-lg ${track.bg} ${track.color} flex items-center justify-center`}>
                  <track.icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <div>
                <h3 className="font-semibold">{track.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{track.desc}</p>
              </div>
              <span className="text-xs font-medium text-indigo-600">{track.topics}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="bg-muted/30 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Everything you need</h2>
            <p className="text-muted-foreground">Built for serious learners</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, title: 'Detailed Editorials', desc: 'Rich content with code, math, tables and callouts' },
              { icon: TrendingUp, title: 'Progress Tracking', desc: 'Track completion, streaks and weekly activity' },
              { icon: Bookmark, title: 'Bookmarks', desc: 'Save topics to revisit later' },
              { icon: Search, title: 'Fast Search', desc: 'Find topics, subjects and editorials instantly' },
              { icon: CheckCircle2, title: 'Structured Roadmaps', desc: 'Topic-wise coverage in the right order' },
              { icon: GraduationCap, title: 'GATE Ready', desc: 'Complete theory notes for all GATE CSE subjects' },
            ].map((f) => (
              <div key={f.title} className="bg-card rounded-xl border border-border p-5 space-y-2">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <f.icon className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center space-y-6">
        <h2 className="text-3xl font-bold">Ready to start learning?</h2>
        <p className="text-muted-foreground">
          Join thousands of learners mastering DSA, CP and GATE CSE.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
        >
          Start for free <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </main>
  );
}
