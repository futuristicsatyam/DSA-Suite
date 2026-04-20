'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, BookOpen, Bookmark, Search, CheckCircle2,
  BarChart3, Flame, Clock, Zap, Target,
  Layers, Github, Mail, MapPin, Phone,
  BrainCircuit, Cpu, Trophy, Rocket, Code,
  Globe, Sparkles, GraduationCap, Terminal,
} from 'lucide-react';
import { api } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

/* ─── types ────────────────────────────────────────────────────────── */
interface FooterItem { name: string; slug: string }

/* ─── intersection-observer reveal ─────────────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('revealed'); io.unobserve(el); } },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal-section ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ─── typing animation ─────────────────────────────────────────────── */

function TypingText({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [forward, setForward] = useState(true);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    if (subIndex === words[index].length + 1 && forward) {
      setTimeout(() => setForward(false), 1200);
      return;
    }
    if (subIndex === 0 && !forward) {
      setForward(true);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (forward ? 1 : -1));
    }, forward ? 90 : 40);
    return () => clearTimeout(timeout);
  }, [subIndex, forward, index, words]);

  // blinking cursor
  useEffect(() => {
    const blinkInt = setInterval(() => setBlink((v) => !v), 500);
    return () => clearInterval(blinkInt);
  }, []);

  // Find the longest word for sizing
  const longest = words.reduce((a, b) => (a.length > b.length ? a : b), '');

  return (
    <span className="relative inline-block align-bottom" style={{ minWidth: 0 }}>
      {/* Sizer span for reserving space */}
      <span aria-hidden="true" className="invisible select-none bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
        {longest}
      </span>
      {/* Animated text absolutely positioned over sizer */}
      <span className="absolute left-0 top-0 w-full bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
        {words[index].substring(0, subIndex)}
        <span className="animate-blink text-indigo-500">{blink ? '|' : ' '}</span>
      </span>
    </span>
  );
}

/* ─── particles for hero ───────────────────────────────────────────── */
function HeroParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* gradient blobs */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-400/20 dark:bg-indigo-400/10 blur-[100px] animate-float" />
      <div className="absolute top-1/4 -right-20 w-[400px] h-[400px] rounded-full bg-blue-400/15 dark:bg-blue-400/10 blur-[80px] animate-float-delayed" />
      <div className="absolute -bottom-20 left-1/4 w-[350px] h-[350px] rounded-full bg-purple-400/15 dark:bg-purple-400/10 blur-[80px] animate-float-slow" />
      {/* floating dots */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-indigo-400/30 dark:bg-indigo-300/20 animate-particle"
          style={{
            left: `${5 + Math.random() * 90}%`,
            top: `${5 + Math.random() * 90}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${4 + Math.random() * 6}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [courses, setCourses] = useState<FooterItem[]>([]);
  const [practiceCategories, setPracticeCategories] = useState<FooterItem[]>([]);
  const [languages, setLanguages] = useState<FooterItem[]>([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    api.get('/content/courses').then(r => setCourses(r.data)).catch(() => {});
    api.get('/content/practice-categories').then(r => setPracticeCategories(r.data)).catch(() => {});
    api.get('/content/languages').then(r => setLanguages(r.data)).catch(() => {});
  }, []);

  return (
    <main className="overflow-hidden">
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center bg-gradient-to-br from-indigo-50 via-blue-50/50 to-white dark:from-indigo-950 dark:via-slate-900 dark:to-slate-950">
        <HeroParticles />
        {/* grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.4) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* left */}
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-medium backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-800/50">
              <Sparkles className="w-3.5 h-3.5" />
              Open Source Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight">
              Master{' '}
              <TypingText words={['Data Structures', 'Algorithms', 'Competitive Programming', 'GATE CSE']} />
              <br />
              <span className="text-foreground">with confidence</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Structured learning paths, editorial-rich content, real-time code execution,
              and personalized progress tracking — all in one place.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href={isAuthenticated ? "/dsa" : "/signup"}
                className="group px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/problems"
                className="group px-7 py-3.5 border border-border bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 backdrop-blur-sm"
              >
                <Terminal className="w-4 h-4 text-indigo-600" />
                Explore Problems
              </Link>
            </div>
          </div>

          {/* right — floating cards */}
          <div className="relative hidden lg:flex items-center justify-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="relative w-full max-w-md">
              {/* main card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-indigo-200/40 dark:shadow-indigo-900/30 border border-border p-6 space-y-4 animate-float-slow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                    <Code className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Two Sum</p>
                    <p className="text-xs text-muted-foreground">Arrays • Easy</p>
                  </div>
                  <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Solved ✓</span>
                </div>
                <div className="h-px bg-border" />
                <div className="font-mono text-xs text-muted-foreground space-y-1 bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                  <p><span className="text-indigo-600 dark:text-indigo-400">def</span> twoSum(nums, target):</p>
                  <p className="pl-4"><span className="text-indigo-600 dark:text-indigo-400">for</span> i <span className="text-indigo-600 dark:text-indigo-400">in</span> range(len(nums)):</p>
                  <p className="pl-8"><span className="text-green-600 dark:text-green-400"># find complement</span></p>
                  <p className="pl-8">...</p>
                </div>
              </div>

              {/* streak badge */}
              <div className="absolute -top-5 -right-5 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-border px-4 py-3 flex items-center gap-3 animate-float">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">7 Day Streak</p>
                  <p className="text-[10px] text-muted-foreground">Keep it up! 🔥</p>
                </div>
              </div>

              {/* solved badge */}
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-border px-4 py-3 flex items-center gap-3 animate-float-delayed">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">188 Solved</p>
                  <p className="text-[10px] text-muted-foreground">This month</p>
                </div>
              </div>

              {/* progress ring */}
              <div className="absolute top-1/2 -right-14 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-border p-3 animate-float-slow" style={{ animationDelay: '1s' }}>
                <div className="w-12 h-12 relative">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="3" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-indigo-500" strokeWidth="3" strokeDasharray="88" strokeDashoffset="22" strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">75%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path d="M0 80V40C360 0 720 60 1080 30C1260 15 1380 25 1440 40V80H0Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* ── STRUCTURED LEARNING PATHS ─────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center space-y-4 mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mx-auto">
              <Rocket className="w-3.5 h-3.5" />
              Learning Paths
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold">Structured Learning Paths</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Follow clear roadmaps to master data structures, algorithms, programming languages, and competitive programming.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                href: '/dsa',
                icon: BrainCircuit,
                title: 'Data Structures & Algorithms',
                desc: '500+ problems covering arrays, trees, graphs, DP and more with detailed editorials.',
                gradient: 'from-indigo-500 to-blue-600',
                lightBg: 'bg-indigo-50 dark:bg-indigo-900/20',
                iconBg: 'from-indigo-500 to-blue-500',
                stat: '40+ Topics',
              },
              {
                href: '/languages/c',
                icon: Globe,
                title: 'Programming Languages',
                desc: 'Beginner to advanced hands-on coding practice across multiple languages.',
                gradient: 'from-emerald-500 to-teal-600',
                lightBg: 'bg-emerald-50 dark:bg-emerald-900/20',
                iconBg: 'from-emerald-500 to-teal-500',
                stat: '5+ Languages',
              },
              {
                href: '/cp',
                icon: Trophy,
                title: 'Competitive Programming',
                desc: 'Codeforces-style contests, graph theory, greedy, and advanced algorithms.',
                gradient: 'from-amber-500 to-orange-600',
                lightBg: 'bg-amber-50 dark:bg-amber-900/20',
                iconBg: 'from-amber-500 to-orange-500',
                stat: '15+ Topics',
              },
            ].map((track, i) => (
              <Reveal key={track.href} delay={i * 150}>
                <Link
                  href={track.href}
                  className="group relative block rounded-2xl border border-border bg-card p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-100/60 dark:hover:shadow-indigo-900/20 hover:-translate-y-2 h-full overflow-hidden"
                >
                  {/* hover gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${track.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                  <div className="relative space-y-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${track.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <track.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{track.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{track.desc}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${track.lightBg}`}>{track.stat}</span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-3 transition-all duration-300">
                        View Path <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRACK YOUR PROGRESS ───────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-b from-background via-indigo-50/30 to-background dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Dashboard
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold">Track Your Progress</h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Stay on top of your progress with detailed analytics and performance insights.
                  Monitor streaks, problems solved, and mastery levels.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Flame, label: 'Daily Streak', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                    { icon: BarChart3, label: 'Problems Solved', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                    { icon: Clock, label: 'Coding Hours', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { icon: Bookmark, label: 'Bookmarks', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                  ].map((f) => (
                    <div key={f.label} className={`flex items-center gap-3 p-3.5 rounded-xl ${f.bg} border border-border/50`}>
                      <f.icon className={`w-5 h-5 ${f.color}`} />
                      <span className="text-sm font-medium">{f.label}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:scale-[1.02]"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="relative">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-indigo-200/30 dark:shadow-indigo-900/20 border border-border p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Overview</h3>
                    <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-md">This Week</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { val: '188', label: 'Total Problems', icon: '⭐', color: 'text-indigo-600 dark:text-indigo-400' },
                      { val: '41', label: 'Daily Streak', icon: '🔥', color: 'text-orange-500' },
                      { val: '23h', label: 'Coding Hours', icon: '⏱️', color: 'text-blue-500' },
                    ].map((s) => (
                      <div key={s.label} className="text-center p-3 rounded-xl bg-muted/50">
                        <p className="text-lg mb-0.5">{s.icon}</p>
                        <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Arrays', pct: 85, color: 'bg-indigo-500' },
                      { label: 'Trees', pct: 60, color: 'bg-blue-500' },
                      { label: 'DP', pct: 35, color: 'bg-purple-500' },
                    ].map((b) => (
                      <div key={b.label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{b.label}</span>
                          <span className="text-muted-foreground">{b.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${b.color} progress-bar-animate`} style={{ '--target-width': `${b.pct}%` } as React.CSSProperties} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-border p-3 animate-float">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔥</span>
                    <div>
                      <p className="text-xs font-bold">7 Days</p>
                      <p className="text-[9px] text-muted-foreground">Streak</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── PRACTICE KEY SKILLS ───────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center space-y-4 mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mx-auto">
              <Cpu className="w-3.5 h-3.5" />
              Practice
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold">Practice Key Skills</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Solve curated problems and sharpen your skills with our integrated code editor and instant feedback.
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-10">
            <Reveal>
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-indigo-100/30 dark:shadow-indigo-900/10 border border-border overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-border">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-muted-foreground ml-2 font-mono">solution.py</span>
                  <span className="ml-auto text-[10px] text-green-600 dark:text-green-400 font-medium">✓ All tests passed</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">113. Path Sum II</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Trees • Medium</p>
                    </div>
                    <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">Medium</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2.5 py-1 text-[10px] font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">Binary Tree</span>
                    <span className="px-2.5 py-1 text-[10px] font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">DFS</span>
                    <span className="px-2.5 py-1 text-[10px] font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">Backtracking</span>
                  </div>
                  <div className="font-mono text-xs bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-border space-y-1 text-muted-foreground">
                    <p><span className="text-indigo-600 dark:text-indigo-400">class</span> Solution:</p>
                    <p className="pl-4"><span className="text-indigo-600 dark:text-indigo-400">def</span> <span className="text-blue-600 dark:text-blue-400">pathSum</span>(self, root, targetSum):</p>
                    <p className="pl-8">result = []</p>
                    <p className="pl-8">self.dfs(root, targetSum, [], result)</p>
                    <p className="pl-8"><span className="text-indigo-600 dark:text-indigo-400">return</span> result</p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div className="space-y-5 flex flex-col justify-center h-full">
                {[
                  { icon: Zap, title: 'Instant Code Execution', desc: 'Run code against test cases in real-time with Judge0 integration.', gradient: 'from-yellow-400 to-orange-500' },
                  { icon: BookOpen, title: 'Rich Editorials', desc: 'Detailed explanations with code, math formulas, and complexity analysis.', gradient: 'from-indigo-500 to-blue-500' },
                  { icon: Layers, title: 'Topic-wise Organization', desc: 'Problems organized by topic, difficulty, and prerequisite skills.', gradient: 'from-blue-500 to-cyan-500' },
                  { icon: Target, title: 'Difficulty Progression', desc: 'Start easy and gradually increase difficulty as your skills improve.', gradient: 'from-green-500 to-emerald-500' },
                ].map((f) => (
                  <div key={f.title} className="group flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all duration-300">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <f.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{f.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
                <Link
                  href="/problems"
                  className="group inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:scale-[1.02] w-fit"
                >
                  Start Practicing <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ─────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-b from-background via-indigo-50/20 to-background dark:from-slate-950 dark:via-indigo-950/10 dark:to-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center space-y-4 mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mx-auto">
              <Sparkles className="w-3.5 h-3.5" />
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold">Everything You Need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">Built for serious learners who want a clean, focused experience.</p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, title: 'Detailed Editorials', desc: 'Rich content with code, math, tables and callouts.', gradient: 'from-indigo-500 to-blue-500' },
              { icon: BarChart3, title: 'Progress Tracking', desc: 'Track completion, streaks and weekly activity.', gradient: 'from-blue-500 to-cyan-500' },
              { icon: Bookmark, title: 'Bookmarks', desc: 'Save topics to revisit later.', gradient: 'from-purple-500 to-pink-500' },
              { icon: Search, title: 'Fast Search', desc: 'Find topics, subjects and editorials instantly.', gradient: 'from-cyan-500 to-teal-500' },
              { icon: CheckCircle2, title: 'Structured Roadmaps', desc: 'Topic-wise coverage in the right order.', gradient: 'from-green-500 to-emerald-500' },
              { icon: GraduationCap, title: 'GATE Ready', desc: 'Complete theory notes for all GATE CSE subjects.', gradient: 'from-amber-500 to-orange-500' },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 100}>
                <div className="group bg-card rounded-2xl border border-border p-6 space-y-4 hover:shadow-xl hover:shadow-indigo-100/40 dark:hover:shadow-indigo-900/10 transition-all duration-500 hover:-translate-y-1 h-full">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24">
        <Reveal>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 p-12 sm:p-16 text-center text-white">
              <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/3" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/[0.02]" />
              <div className="relative space-y-6">
                <h2 className="text-3xl sm:text-4xl font-bold">Start Your Coding Journey Today</h2>
                <p className="text-indigo-200 max-w-xl mx-auto text-lg">
                  Join learners mastering DSA, Competitive Programming, and GATE CSE — completely free.
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <Link
                    href="/signup"
                    className="group px-8 py-3.5 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-lg hover:scale-[1.02]"
                  >
                    Get Started Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/about"
                    className="px-8 py-3.5 border border-white/30 hover:bg-white/10 font-semibold rounded-xl transition-colors"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

    </main>
  );
}
