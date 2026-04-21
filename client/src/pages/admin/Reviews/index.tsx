import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api';
import { formatDate, timeAgo } from '../../../utils';
import { Star, Check, Trash2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../../utils';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn('w-3.5 h-3.5', i < rating ? 'text-amber-400 fill-current' : 'text-gray-300')} />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', filter, page],
    queryFn: () => adminApi.listReviews({
      page,
      limit: 20,
      approved: filter === 'all' ? undefined : filter === 'approved' ? true : false,
    }),
  });

  const approveMutation = useMutation({
    mutationFn: adminApi.approveReview,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-reviews'] }); toast.success('Зөвшөөрөгдлөө ✓'); },
    onError: () => toast.error('Алдаа гарлаа'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteReview,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-reviews'] }); toast.success('Устгагдлаа'); },
    onError: () => toast.error('Алдаа гарлаа'),
  });

  const reviews = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Сэтгэгдлүүд</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Нийт {meta?.total || 0} сэтгэгдэл</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'pending', label: '⏳ Хүлээгдэж байна' },
          { key: 'approved', label: '✅ Зөвшөөрөгдсөн' },
          { key: 'all', label: '📋 Бүгд' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => { setFilter(key as any); setPage(1); }}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium border transition-all',
              filter === key ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'hover:border-brand-primary/40')}
            style={{ borderColor: filter === key ? undefined : 'var(--border)', color: filter === key ? undefined : 'var(--text-secondary)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)
          : reviews.length === 0
            ? (
              <div className="card p-12 text-center">
                <Star className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                  {filter === 'pending' ? 'Хүлээгдэж буй сэтгэгдэл байхгүй' : 'Сэтгэгдэл байхгүй байна'}
                </p>
              </div>
            )
            : reviews.map((r: any) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
                         style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                      {r.user_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{r.user_name}</span>
                        <StarRating rating={r.rating} />
                        <span className={cn('badge text-xs', r.approved ? 'badge-success' : 'badge-warning')}>
                          {r.approved ? '✓ Зөвшөөрөгдсөн' : '⏳ Хүлээгдэж байна'}
                        </span>
                      </div>
                      <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{r.product_name}</span>
                        {' · '}{timeAgo(r.created_at)}
                      </p>
                      {r.body && (
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          "{r.body}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    {!r.approved && (
                      <button onClick={() => approveMutation.mutate(r.id)}
                        disabled={approveMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 transition-colors">
                        <Check className="w-3.5 h-3.5" /> Зөвшөөрөх
                      </button>
                    )}
                    <button onClick={() => deleteMutation.mutate(r.id)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Устгах
                    </button>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{meta.page} / {meta.totalPages} хуудас</p>
          <div className="flex gap-2">
            <button disabled={!meta.hasPrev} onClick={() => setPage(p => p - 1)} className="btn-ghost btn-sm text-xs disabled:opacity-40">← Өмнөх</button>
            <button disabled={!meta.hasNext} onClick={() => setPage(p => p + 1)} className="btn-ghost btn-sm text-xs disabled:opacity-40">Дараах →</button>
          </div>
        </div>
      )}
    </div>
  );
}
