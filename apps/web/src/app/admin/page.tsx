'use client';

export const dynamic = 'force-dynamic';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Users, BookOpen, Tag, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/utils';

interface Stats {
  totalUsers: number;
  totalSubjects: number;
  totalTopics: number;
  totalEditorials: number;
  publishedEditorials: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data as Stats),
  });

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', href: '/admin/users' },
    { label: 'Subjects', value: stats?.totalSubjects, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', href: '/admin/subjects' },
    { label: 'Topics', value: stats?.totalTopics, icon: Tag, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', href: '/admin/topics' },
    { label: 'Editorials', value: stats?.totalEditorials, icon: FileText, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', href: '/admin/editorials' },
    { label: 'Published', value: stats?.publishedEditorials, icon: CheckCircle2, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', href: '/admin/editorials' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform overview and quick actions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map(card => (
          <Link key={card.label} href={card.href}
            className="rounded-xl border border-border bg-card p-4 space-y-3 hover:shadow-md transition-all group">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.bg}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{isLoading ? '—' : (card.value ?? 0)}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/admin/subjects', label: 'Manage Subjects', desc: 'Add or edit DSA/CP/GATE subjects', icon: BookOpen, color: 'text-indigo-600' },
            { href: '/admin/topics', label: 'Manage Topics', desc: 'Add or edit topic entries', icon: Tag, color: 'text-purple-600' },
            { href: '/admin/editorials', label: 'Write Editorials', desc: 'Create and publish content', icon: FileText, color: 'text-green-600' },
            { href: '/admin/users', label: 'Manage Users', desc: 'View users and update roles', icon: Users, color: 'text-blue-600' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors group">
              <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
