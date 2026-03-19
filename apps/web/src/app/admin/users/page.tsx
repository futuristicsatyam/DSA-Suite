'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { api, apiError, cn } from '@/lib/utils';

interface UserItem {
  id: string; name: string; email: string; phone: string;
  emailVerified: boolean; phoneVerified: boolean;
  role: 'USER' | 'ADMIN'; createdAt: string;
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api.get(`/admin/users${search ? `?search=${search}` : ''}`).then(r => r.data as { data: UserItem[]; total: number }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'USER' | 'ADMIN' }) =>
      api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Role updated!'); },
    onError: (err) => toast.error(apiError(err)),
  });

  const toggleRole = (user: UserItem) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`Change ${user.name}'s role to ${newRole}?`)) return;
    roleMutation.mutate({ id: user.id, role: newRole });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm">{data?.total ?? 0} registered users</p>
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        className="w-full max-w-sm h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {['User', 'Contact', 'Verified', 'Role', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.data ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No users found</td>
                </tr>
              ) : (data?.data ?? []).map(user => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {user.phone}
                  </td>

                  {/* Verified */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={cn('text-xs', user.emailVerified ? 'text-green-600' : 'text-muted-foreground')}>
                        {user.emailVerified ? '✓ Email' : '✗ Email'}
                      </span>
                      <span className={cn('text-xs', user.phoneVerified ? 'text-green-600' : 'text-muted-foreground')}>
                        {user.phoneVerified ? '✓ Phone' : '✗ Phone'}
                      </span>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <span className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit',
                      user.role === 'ADMIN'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'bg-secondary text-muted-foreground'
                    )}>
                      {user.role === 'ADMIN'
                        ? <><Shield className="w-3 h-3" /> Admin</>
                        : <><User className="w-3 h-3" /> User</>
                      }
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleRole(user)}
                      disabled={roleMutation.isPending}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50',
                        user.role === 'ADMIN'
                          ? 'border border-border hover:bg-accent text-muted-foreground'
                          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40'
                      )}
                    >
                      {roleMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : user.role === 'ADMIN' ? (
                        <><User className="w-3 h-3" /> Make User</>
                      ) : (
                        <><Shield className="w-3 h-3" /> Make Admin</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
