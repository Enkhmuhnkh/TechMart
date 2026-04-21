import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api';
import { formatDate, timeAgo } from '../../../utils';
import { Users, Search, Shield, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => adminApi.listUsers({ page, limit: 20, search: search || undefined }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminApi.updateUserRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Эрх шинэчлэгдлээ');
    },
    onError: () => toast.error('Алдаа гарлаа'),
  });

  const users = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
            Хэрэглэгчид
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Нийт {meta?.total || 0} хэрэглэгч
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Нэр эсвэл имэйлээр хайх..."
            className="input text-sm pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                {['Хэрэглэгч', 'Имэйл', 'Утас', 'Эрх', 'Бүртгүүлсэн', 'Үйлдэл'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-24" /></td>
                    ))}
                  </tr>
                ))
                : users.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16">
                        <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                        <p style={{ color: 'var(--text-secondary)' }}>Хэрэглэгч олдсонгүй</p>
                      </td>
                    </tr>
                  )
                  : users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-[var(--surface-1)] transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                      {/* Avatar + Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
                               style={{ background: u.role === 'admin' ? '#6C63FF22' : 'var(--surface-2)', color: u.role === 'admin' ? '#6C63FF' : 'var(--text-secondary)' }}>
                            {u.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                            {u.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${u.role === 'admin' ? 'badge-primary' : 'badge-gray'}`}>
                          {u.role === 'admin' ? '👑 Admin' : 'Хэрэглэгч'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <div title={formatDate(u.created_at)}>{timeAgo(u.created_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => roleMutation.mutate({ id: u.id, role: u.role === 'admin' ? 'customer' : 'admin' })}
                          disabled={roleMutation.isPending}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            u.role === 'admin'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20'
                          }`}
                        >
                          {u.role === 'admin'
                            ? <><ShieldOff className="w-3.5 h-3.5" /> Admin болгох</> // remove admin
                            : <><Shield className="w-3.5 h-3.5" /> Admin болгох</>
                          }
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {meta.page} / {meta.totalPages} хуудас
            </p>
            <div className="flex gap-2">
              <button disabled={!meta.hasPrev} onClick={() => setPage(p => p - 1)}
                className="btn-ghost btn-sm text-xs disabled:opacity-40">← Өмнөх</button>
              <button disabled={!meta.hasNext} onClick={() => setPage(p => p + 1)}
                className="btn-ghost btn-sm text-xs disabled:opacity-40">Дараах →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
