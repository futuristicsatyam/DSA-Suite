export const dynamic = 'force-dynamic';

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, BookOpen, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { apiError } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const from = searchParams.get('from') ?? '/dashboard';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!identifier) e.identifier = 'Email or phone is required';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const user = await login(identifier, password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      router.push(user.role === 'ADMIN' ? '/admin' : from);
    } catch (err) {
      const msg = apiError(err);
      if (msg.toLowerCase().includes('invalid')) {
        setErrors({ password: 'Invalid credentials' });
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <Link href="/" className="relative flex items-center gap-2 text-white">
          <BookOpen className="w-7 h-7 text-indigo-300" />
          <span className="text-xl font-bold">DSA Suite</span>
        </Link>
        <div className="relative space-y-6">
          <blockquote className="text-3xl font-bold text-white leading-tight">
            "The only way to learn a new programming language is by writing programs in it."
          </blockquote>
          <p className="text-indigo-300 text-sm">— Dennis Ritchie</p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[{ label: 'Topics', value: '60+' }, { label: 'Tracks', value: '3' }, { label: 'Free', value: '100%' }].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-indigo-300 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-indigo-400 text-xs">© {new Date().getFullYear()} DSA Suite</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-2 lg:hidden mb-6">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span className="font-bold text-indigo-600">DSA Suite</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground text-sm">Sign in to continue your learning journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="identifier" className="text-sm font-medium">Email or Phone</label>
              <input
                id="identifier"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="you@example.com or +919876543210"
                autoFocus
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {errors.identifier && <p className="text-destructive text-xs">{errors.identifier}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-indigo-600 font-medium hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
