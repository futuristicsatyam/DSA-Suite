'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen, Menu, X, Moon, Sun,
  LayoutDashboard, User, LogOut, ChevronDown,
  Shield, Bookmark, Search,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { SearchModal } from './search-modal';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/dsa', label: 'DSA' },
  { href: '/cp', label: 'CP' },
  { href: '/gate', label: 'GATE CSE' },
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
            {NAV_LINKS.map((l) => (
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
            {NAV_LINKS.map((l) => (
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
