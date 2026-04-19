'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen, Menu, X, Moon, Sun,
  LayoutDashboard, User, LogOut, ChevronDown,
  Shield, Bookmark, Search, GraduationCap, Target, Code2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { SearchModal } from './search-modal';
import { api } from '@/lib/utils';

interface Course {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

interface PracticeCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  categoryType?: string;
}

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [practiceCategories, setPracticeCategories] = useState<PracticeCategory[]>([]);
  const [languages, setLanguages] = useState<Course[]>([]);
  const [mobileCoursesOpen, setMobileCoursesOpen] = useState(false);
  const [mobilePracticeOpen, setMobilePracticeOpen] = useState(false);
  const [mobileLanguagesOpen, setMobileLanguagesOpen] = useState(false);
  const coursesRef = useRef<HTMLDivElement>(null);
  const practiceRef = useRef<HTMLDivElement>(null);
  const languagesRef = useRef<HTMLDivElement>(null);

  // Fetch courses and practice categories
  useEffect(() => {
    api.get('/content/courses')
      .then(res => setCourses(res.data))
      .catch(() => {});
    api.get('/content/practice-categories')
      .then(res => setPracticeCategories(res.data))
      .catch(() => {});
    api.get('/content/languages')
      .then(res => setLanguages(res.data))
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (coursesRef.current && !coursesRef.current.contains(e.target as Node)) {
        setCoursesOpen(false);
      }
      if (practiceRef.current && !practiceRef.current.contains(e.target as Node)) {
        setPracticeOpen(false);
      }
      if (languagesRef.current && !languagesRef.current.contains(e.target as Node)) {
        setLanguagesOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Open search with "/" key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out successfully.');
      router.push('/');
    } catch {
      toast.error('Could not sign out.');
    }
    setDropdownOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex h-14 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold shrink-0">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span className="text-sm sm:text-base">DSA Suite</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.slice(0, 2).map((l) => (
              <Link key={l.href} href={l.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  pathname === l.href
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}>
                {l.label}
              </Link>
            ))}

            {/* Courses dropdown */}
            <div className="relative" ref={coursesRef}>
              <button
                onClick={() => setCoursesOpen(o => !o)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  coursesOpen
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
              >
                <GraduationCap className="w-4 h-4" />
                Courses
                <ChevronDown className={cn('w-3 h-3 transition-transform', coursesOpen && 'rotate-180')} />
              </button>

              {coursesOpen && (
                <div className="absolute left-0 mt-1 w-64 rounded-xl border border-border bg-background shadow-lg z-50 py-1">
                  {courses.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted-foreground">No courses available</p>
                  ) : (
                    courses.map((course) => (
                      <Link
                        key={course.id}
                        href={`/courses/${course.slug}`}
                        onClick={() => setCoursesOpen(false)}
                        className={cn(
                          'flex flex-col px-4 py-2.5 hover:bg-accent transition-colors',
                          pathname === `/courses/${course.slug}` && 'bg-indigo-50 dark:bg-indigo-950/40',
                        )}
                      >
                        <span className="text-sm font-medium">{course.name}</span>
                        {course.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1">{course.description}</span>
                        )}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Practice dropdown */}
            <div className="relative" ref={practiceRef}>
              <button
                onClick={() => setPracticeOpen(o => !o)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  practiceOpen || pathname.startsWith('/practice')
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
              >
                <Target className="w-4 h-4" />
                Practice
                <ChevronDown className={cn('w-3 h-3 transition-transform', practiceOpen && 'rotate-180')} />
              </button>

              {practiceOpen && (
                <div className="absolute left-0 mt-1 w-64 rounded-xl border border-border bg-background shadow-lg z-50 py-1">
                  {/* All Problems link */}
                  <Link
                    href="/problems"
                    onClick={() => setPracticeOpen(false)}
                    className={cn(
                      'flex flex-col px-4 py-2.5 hover:bg-accent transition-colors border-b border-border',
                      pathname === '/problems' && 'bg-indigo-50 dark:bg-indigo-950/40',
                    )}
                  >
                    <span className="text-sm font-medium">All</span>
                    <span className="text-xs text-muted-foreground">Browse all practice problems</span>
                  </Link>
                  {practiceCategories.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted-foreground">No categories available</p>
                  ) : (
                    practiceCategories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/practice/${cat.slug}`}
                        onClick={() => setPracticeOpen(false)}
                        className={cn(
                          'flex flex-col px-4 py-2.5 hover:bg-accent transition-colors',
                          pathname === `/practice/${cat.slug}` && 'bg-indigo-50 dark:bg-indigo-950/40',
                        )}
                      >
                        <span className="text-sm font-medium">{cat.name}</span>
                        {cat.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1">{cat.description}</span>
                        )}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Languages dropdown */}
            <div className="relative" ref={languagesRef}>
              <button
                onClick={() => setLanguagesOpen(o => !o)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  languagesOpen || pathname.startsWith('/languages')
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
              >
                <Code2 className="w-4 h-4" />
                Languages
                <ChevronDown className={cn('w-3 h-3 transition-transform', languagesOpen && 'rotate-180')} />
              </button>

              {languagesOpen && (
                <div className="absolute left-0 mt-1 w-64 rounded-xl border border-border bg-background shadow-lg z-50 py-1">
                  {languages.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted-foreground">No languages available</p>
                  ) : (
                    languages.map((lang) => (
                      <Link
                        key={lang.id}
                        href={`/languages/${lang.slug}`}
                        onClick={() => setLanguagesOpen(false)}
                        className={cn(
                          'flex flex-col px-4 py-2.5 hover:bg-accent transition-colors',
                          pathname === `/languages/${lang.slug}` && 'bg-indigo-50 dark:bg-indigo-950/40',
                        )}
                      >
                        <span className="text-sm font-medium">{lang.name}</span>
                        {lang.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1">{lang.description}</span>
                        )}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {NAV_LINKS.slice(2).map((l) => (
              <Link key={l.href} href={l.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  pathname === l.href
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">

            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-border/60"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Search</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 bg-muted rounded text-xs font-mono">/</kbd>
            </button>

            {/* Dark mode */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>

            {/* Auth — desktop */}
            {!isLoading && (
              <div className="hidden md:flex items-center gap-2">
                {isAuthenticated && user ? (
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(o => !o)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-accent transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </button>

                    {dropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                        <div className="absolute right-0 mt-1 w-48 rounded-xl border border-border bg-background shadow-lg z-20 py-1">
                          <div className="px-3 py-2 border-b border-border">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                          {[
                            { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                            { href: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
                            { href: '/profile', icon: User, label: 'Profile' },
                          ].map((item) => (
                            <Link key={item.href} href={item.href} onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors">
                              <item.icon className="w-4 h-4" /> {item.label}
                            </Link>
                          ))}
                          {user.role === 'ADMIN' && (
                            <>
                              <div className="border-t border-border my-1" />
                              <Link href="/admin" onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors">
                                <Shield className="w-4 h-4" /> Admin Panel
                              </Link>
                            </>
                          )}
                          <div className="border-t border-border my-1" />
                          <button onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                            <LogOut className="w-4 h-4" /> Sign out
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <Link href="/login" className="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      Login
                    </Link>
                    <Link href="/signup" className="px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-1">
            {NAV_LINKS.slice(0, 2).map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === l.href
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}>
                {l.label}
              </Link>
            ))}

            {/* Mobile courses accordion */}
            <button
              onClick={() => setMobileCoursesOpen(o => !o)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Courses</span>
              <ChevronDown className={cn('w-3 h-3 transition-transform', mobileCoursesOpen && 'rotate-180')} />
            </button>
            {mobileCoursesOpen && (
              <div className="pl-6 space-y-1">
                {courses.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">No courses available</p>
                ) : (
                  courses.map((course) => (
                    <Link key={course.id} href={`/courses/${course.slug}`} onClick={() => setMobileOpen(false)}
                      className={cn(
                        'block px-3 py-2 rounded-md text-sm transition-colors',
                        pathname === `/courses/${course.slug}`
                          ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                      )}>
                      {course.name}
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Mobile practice accordion */}
            <button
              onClick={() => setMobilePracticeOpen(o => !o)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <span className="flex items-center gap-2"><Target className="w-4 h-4" /> Practice</span>
              <ChevronDown className={cn('w-3 h-3 transition-transform', mobilePracticeOpen && 'rotate-180')} />
            </button>
            {mobilePracticeOpen && (
              <div className="pl-6 space-y-1">
                <Link href="/problems" onClick={() => setMobileOpen(false)}
                  className={cn(
                    'block px-3 py-2 rounded-md text-sm transition-colors',
                    pathname === '/problems'
                      ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                  )}>
                  All
                </Link>
                {practiceCategories.map((cat) => (
                  <Link key={cat.id} href={`/practice/${cat.slug}`} onClick={() => setMobileOpen(false)}
                    className={cn(
                      'block px-3 py-2 rounded-md text-sm transition-colors',
                      pathname === `/practice/${cat.slug}`
                        ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                    )}>
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Mobile languages accordion */}
            <button
              onClick={() => setMobileLanguagesOpen(o => !o)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <span className="flex items-center gap-2"><Code2 className="w-4 h-4" /> Languages</span>
              <ChevronDown className={cn('w-3 h-3 transition-transform', mobileLanguagesOpen && 'rotate-180')} />
            </button>
            {mobileLanguagesOpen && (
              <div className="pl-6 space-y-1">
                {languages.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">No languages available</p>
                ) : (
                  languages.map((lang) => (
                    <Link key={lang.id} href={`/languages/${lang.slug}`} onClick={() => setMobileOpen(false)}
                      className={cn(
                        'block px-3 py-2 rounded-md text-sm transition-colors',
                        pathname === `/languages/${lang.slug}`
                          ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                      )}>
                      {lang.name}
                    </Link>
                  ))
                )}
              </div>
            )}

            {NAV_LINKS.slice(2).map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === l.href
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}>
                {l.label}
              </Link>
            ))}
            <button onClick={() => { setSearchOpen(true); setMobileOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent">
              <Search className="w-4 h-4" /> Search topics
            </button>
            <div className="pt-3 border-t border-border space-y-1">
              {isAuthenticated && user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link href="/bookmarks" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent">
                    <Bookmark className="w-4 h-4" /> Bookmarks
                  </Link>
                  <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent">
                      <Shield className="w-4 h-4" /> Admin
                    </Link>
                  )}
                  <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm hover:bg-accent">Login</Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm bg-indigo-600 text-white text-center">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Search modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
