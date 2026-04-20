
import Link from 'next/link';
import {
  BookOpen, BrainCircuit, Trophy, GraduationCap, TrendingUp, Bookmark, Search, CheckCircle2, ArrowRight, Github, Heart, Rocket, Sparkles, BarChart3
} from 'lucide-react';
import { Reveal } from '../page';


export default function AboutPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-24">
      {/* Hero */}
      <Reveal className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Rocket className="w-8 h-8 text-indigo-600" />
          <span className="text-2xl font-bold">DSA Suite</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
          Built for <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">serious learners</span>,<br />
          <span className="text-indigo-600">not just browsers.</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          DSA Suite is a free, editorial-first learning platform designed to help
          students master Data Structures, Algorithms, Competitive Programming,
          and GATE CSE — with depth, not just definitions.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link href="/dsa"
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-base font-semibold transition-all shadow-lg hover:scale-[1.03]">
            Start learning <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/signup"
            className="flex items-center gap-2 px-6 py-3 border border-border hover:bg-accent rounded-xl text-base font-semibold transition-all shadow hover:scale-[1.03]">
            Create free account
          </Link>
        </div>
      </Reveal>

      {/* Mission */}
      <Reveal className="rounded-2xl border border-border bg-card p-10 space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500" /> Our mission</h2>
        <p className="text-muted-foreground leading-relaxed text-lg">
          Most learning platforms show you <em>what</em> to learn. We focus on helping you
          understand <em>why</em> it works. Every editorial on DSA Suite is written with
          intuition first — explaining the thought process before the code.
        </p>
        <p className="text-muted-foreground leading-relaxed text-lg">
          We believe that deep understanding beats surface-level memorization, especially
          when it comes to cracking placements, competitive programming contests, or the GATE exam.
        </p>
      </Reveal>

      {/* Learning tracks */}
      <Reveal className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-500" /> What we cover</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: BrainCircuit,
              gradient: 'from-indigo-500 to-blue-600',
              title: 'Data Structures & Algorithms',
              desc: 'Arrays, linked lists, trees, graphs, DP. 40+ topics with structured editorials, code, and complexity analysis.',
              href: '/dsa',
            },
            {
              icon: Trophy,
              gradient: 'from-amber-500 to-orange-600',
              title: 'Competitive Programming',
              desc: 'Number theory, advanced graph algorithms, string algorithms, and DP patterns used in ICPC, Codeforces, and LeetCode contests.',
              href: '/cp',
            },
            {
              icon: GraduationCap,
              gradient: 'from-purple-500 to-pink-500',
              title: 'GATE CSE',
              desc: 'Complete theory notes for all 8 GATE CSE subjects — OS, DBMS, CN, TOC, Algorithms, Discrete Math, Digital Logic, and Compiler Design.',
              href: '/gate',
            },
          ].map(track => (
            <Link key={track.href} href={track.href}
              className="group rounded-2xl border border-border bg-card p-8 hover:shadow-xl hover:shadow-indigo-100/40 dark:hover:shadow-indigo-900/10 transition-all duration-300 hover:-translate-y-1 h-full space-y-3 overflow-hidden">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${track.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <track.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">{track.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{track.desc}</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-3 transition-all">
                Explore <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>
      </Reveal>

      {/* Features */}
      <Reveal className="space-y-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500" /> Platform features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { icon: BookOpen, gradient: 'from-indigo-500 to-blue-500', title: 'Rich editorials', desc: 'Markdown with math (KaTeX), syntax highlighted code, callout blocks and tables' },
            { icon: CheckCircle2, gradient: 'from-green-500 to-emerald-500', title: 'Progress tracking', desc: 'Mark topics complete, track streaks, and see your overall progress' },
            { icon: Bookmark, gradient: 'from-purple-500 to-pink-500', title: 'Bookmarks', desc: 'Save any topic for quick access later, grouped by category' },
            { icon: Search, gradient: 'from-cyan-500 to-teal-500', title: 'Instant search', desc: 'Find any topic, subject or editorial instantly with the / shortcut' },
            { icon: TrendingUp, gradient: 'from-blue-500 to-cyan-500', title: 'Dashboard', desc: 'Weekly activity chart, continue learning, and progress overview' },
            { icon: TrendingUp, gradient: 'from-amber-500 to-orange-500', title: 'Day streaks', desc: 'Build a daily learning habit with streak tracking and weekly activity charts' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center flex-shrink-0`}>
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-base">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Stats */}
      <Reveal className="rounded-2xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 text-white p-10">
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
      </Reveal>

      {/* Open source */}
      <Reveal className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          <h2 className="text-xl font-bold">Made with love for learners</h2>
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
          DSA Suite is built by developers who went through the same grind —
          placement prep, competitive programming, GATE preparation.
          We know what it takes, and we built the resource we wish we had.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link href="https://github.com/futuristicsatyam/DSA-Suite" target="_blank"
            className="flex items-center gap-2 px-5 py-2.5 border border-border hover:bg-accent rounded-xl text-base transition-all shadow hover:scale-[1.03]">
            <Github className="w-4 h-4" /> View on GitHub
          </Link>
          <Link href="/contact"
            className="flex items-center gap-2 px-5 py-2.5 border border-border hover:bg-accent rounded-xl text-base transition-all shadow hover:scale-[1.03]">
            Get in touch
          </Link>
        </div>
      </Reveal>

    </main>
  );
}
