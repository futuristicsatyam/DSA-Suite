export const dynamic = 'force-dynamic';

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { api, apiError, cn } from '@/lib/utils';

interface Profile {
  id: string; name: string; email: string; phone: string;
  emailVerified: boolean; phoneVerified: boolean;
  role: string; createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login?from=/profile');
  }, [authLoading, isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<Profile>('/auth/me').then(r => r.data),
    enabled: isAuthenticated,
  });

  // Edit name
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const nameMutation = useMutation({
    mutationFn: (name: string) => api.patch('/user/profile', { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      setEditingName(false);
      toast.success('Name updated!');
    },
    onError: (err) => toast.error(apiError(err)),
  });

  // Change password
  const [changingPwd, setChangingPwd] = useState(false);
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');

  const pwdMutation = useMutation({
    mutationFn: () => api.patch('/user/password', { currentPassword: curPwd, newPassword: newPwd }),
    onSuccess: () => {
      setChangingPwd(false);
      setCurPwd(''); setNewPwd(''); setConfirmPwd(''); setPwdError('');
      toast.success('Password changed!');
    },
    onError: (err) => setPwdError(apiError(err)),
  });

  const handlePwdSubmit = () => {
    setPwdError('');
    if (!curPwd) { setPwdError('Enter current password'); return; }
    if (newPwd.length < 8) { setPwdError('Min 8 characters'); return; }
    if (!/[A-Z]/.test(newPwd)) { setPwdError('Must have uppercase letter'); return; }
    if (!/[0-9]/.test(newPwd)) { setPwdError('Must have a number'); return; }
    if (newPwd !== confirmPwd) { setPwdError('Passwords do not match'); return; }
    pwdMutation.mutate();
  };

  if (authLoading || isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-32" />
        <div className="h-48 bg-muted rounded-xl" />
        <div className="h-40 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {data.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{data.name}</h1>
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
            data.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-secondary text-muted-foreground')}>
            {data.role}
          </span>
        </div>
      </div>

      {/* Account info */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Account information</h2>
          {!editingName && (
            <button onClick={() => { setEditingName(true); setNameInput(data.name); }}
              className="text-xs text-indigo-600 hover:underline">Edit name</button>
          )}
        </div>

        {/* Name */}
        {editingName ? (
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Full name</label>
            <input value={nameInput} onChange={e => setNameInput(e.target.value)} autoFocus
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="flex gap-2">
              <button onClick={() => nameMutation.mutate(nameInput.trim())} disabled={nameMutation.isPending || nameInput.trim().length < 2}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 disabled:opacity-50">
                {nameMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
              </button>
              <button onClick={() => setEditingName(false)}
                className="px-3 py-1.5 border border-border text-xs rounded-md hover:bg-accent">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-1">
            <span className="text-xs text-muted-foreground w-20">Name</span>
            <span className="text-sm font-medium">{data.name}</span>
          </div>
        )}

        {/* Email */}
        <div className="flex items-center gap-3 py-1 border-t border-border">
          <span className="text-xs text-muted-foreground w-20">Email</span>
          <span className="text-sm flex-1">{data.email}</span>
          {data.emailVerified
            ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            : <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
          <span className={cn('text-xs flex-shrink-0', data.emailVerified ? 'text-green-600' : 'text-muted-foreground')}>
            {data.emailVerified ? 'Verified' : 'Not verified'}
          </span>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-3 py-1 border-t border-border">
          <span className="text-xs text-muted-foreground w-20">Phone</span>
          <span className="text-sm flex-1">{data.phone}</span>
          {data.phoneVerified
            ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            : <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
          <span className={cn('text-xs flex-shrink-0', data.phoneVerified ? 'text-green-600' : 'text-muted-foreground')}>
            {data.phoneVerified ? 'Verified' : 'Not verified'}
          </span>
        </div>

        {/* Joined */}
        <div className="flex items-center gap-3 py-1 border-t border-border">
          <span className="text-xs text-muted-foreground w-20">Joined</span>
          <span className="text-sm">
            {new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">Password</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Change your account password</p>
          </div>
          {!changingPwd && (
            <button onClick={() => setChangingPwd(true)} className="text-xs text-indigo-600 hover:underline">
              Change password
            </button>
          )}
        </div>

        {changingPwd && (
          <div className="space-y-3">
            {[
              { label: 'Current password', value: curPwd, setter: setCurPwd },
              { label: 'New password', value: newPwd, setter: setNewPwd },
              { label: 'Confirm new password', value: confirmPwd, setter: setConfirmPwd },
            ].map(f => (
              <div key={f.label} className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{f.label}</label>
                <input type="password" value={f.value} onChange={e => f.setter(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
            {pwdError && <p className="text-destructive text-xs">{pwdError}</p>}
            <div className="flex gap-2">
              <button onClick={handlePwdSubmit} disabled={pwdMutation.isPending}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5">
                {pwdMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Change password
              </button>
              <button onClick={() => { setChangingPwd(false); setCurPwd(''); setNewPwd(''); setConfirmPwd(''); setPwdError(''); }}
                className="px-3 py-1.5 border border-border text-xs rounded-md hover:bg-accent">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/dashboard', emoji: '📊', label: 'Dashboard' },
          { href: '/bookmarks', emoji: '🔖', label: 'Bookmarks' },
          { href: '/dsa', emoji: '📚', label: 'Learn DSA' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:bg-accent transition-colors text-center">
            <span className="text-xl">{item.emoji}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
