import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api';
import { formatPrice, formatDate, timeAgo, ORDER_STATUS_COLORS } from '../../../utils';
import { ShoppingBag, ChevronDown, Eye, X, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../../utils';

const STATUSES = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const STATUS_MN: Record<string, string> = {
  all:        'Бүгд',
  pending:    'Хүлээгдэж байна',
  processing: 'Боловсруулж байна',
  shipped:    'Илгээсэн',
  delivered:  'Хүргэсэн',
  cancelled:  'Цуцалсан',
  refunded:   'Буцаалт',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash:  '💵 Бэлэн мөнгө',
  qpay:  '📱 QPay',
  card:  '💳 Карт',
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  paid:    { label: 'Төлсөн',          badge: 'badge-success' },
  pending: { label: 'Хүлээгдэж байна', badge: 'badge-warning' },
  failed:  { label: 'Амжилтгүй',       badge: 'badge-danger'  },
};

// ─── Order detail modal ───────────────────────────────────────────────────────

function OrderDetailModal({
  order,
  onClose,
  onStatusChange,
}: {
  order: any;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const ps = PAYMENT_STATUS_LABELS[order.payment_status] || { label: order.payment_status, badge: 'badge-gray' };
  const methodLabel = PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 px-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div className="w-full max-w-lg rounded-2xl shadow-modal" style={{ background: 'var(--surface-0)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              Захиалга #{order.id.slice(0, 8).toUpperCase()}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{formatDate(order.created_at)}</p>
          </div>
          <button onClick={onClose} className="btn-ghost rounded-xl p-2"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">

          {/* Customer */}
          <div className="card p-4">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>ХЭРЭГЛЭГЧ</p>
            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{order.full_name}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{order.email}</p>
          </div>

          {/* Shipping address */}
          {order.shipping_address && (
            <div className="card p-4">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>ХҮРГЭЛТИЙН ХАЯГ</p>
              {(() => {
                try {
                  const addr = typeof order.shipping_address === 'string'
                    ? JSON.parse(order.shipping_address)
                    : order.shipping_address;
                  return (
                    <div className="text-sm space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{addr.full_name}</p>
                      <p>{addr.phone}</p>
                      <p>{addr.district} дүүрэг, {addr.city}</p>
                      <p>{addr.address}</p>
                    </div>
                  );
                } catch { return <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>—</p>; }
              })()}
            </div>
          )}

          {/* Payment info */}
          <div className="card p-4">
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-tertiary)' }}>ТӨЛБӨРИЙН МЭДЭЭЛЭЛ</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {methodLabel}
                </span>
              </div>
              <span className={cn('badge text-xs', ps.badge)}>{ps.label}</span>
            </div>
            {order.payment_method === 'cash' && order.payment_status !== 'paid' && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                ℹ️ Захиалга "Хүргэсэн" болоход автоматаар Төлсөн тэмдэглэгдэнэ
              </p>
            )}
            {order.payment_method === 'qpay' && order.payment_status !== 'paid' && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                ℹ️ QPay-аар төлбөр орсны дараа автоматаар Төлсөн болно
              </p>
            )}
          </div>

          {/* Status change */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>СТАТУС СОЛИХ</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.filter(s => s !== 'all').map(s => (
                <button
                  key={s}
                  onClick={() => onStatusChange(order.id, s)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                    order.status === s
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                      : 'hover:border-brand-primary/40'
                  )}
                  style={{
                    borderColor: order.status === s ? undefined : 'var(--border)',
                    color: order.status === s ? undefined : 'var(--text-secondary)',
                  }}
                >
                  {STATUS_MN[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between py-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Нийт дүн</span>
            <span className="font-bold text-lg text-brand-primary">{formatPrice(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminOrders() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, statusFilter],
    queryFn: () => adminApi.listOrders({
      page,
      limit: 20,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateOrderStatus(id, status),
    onSuccess: (updatedOrder) => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Статус шинэчлэгдлээ');
      // Sync modal with the fully updated order from the server
      if (selectedOrder && updatedOrder) {
        setSelectedOrder((prev: any) => ({ ...prev, ...updatedOrder }));
      }
    },
    onError: () => toast.error('Алдаа гарлаа'),
  });

  const orders = data?.data || [];
  const meta   = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Захиалгууд</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Нийт {meta?.total || 0} захиалга</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
              statusFilter === s
                ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                : 'hover:border-brand-primary/40'
            )}
            style={{
              borderColor: statusFilter === s ? undefined : 'var(--border)',
              color: statusFilter === s ? undefined : 'var(--text-secondary)',
            }}
          >
            {STATUS_MN[s]}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                {['Захиалга', 'Хэрэглэгч', 'Дүн', 'Статус', 'Төлбөр', 'Огноо', 'Үйлдэл'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-20" /></td>
                      ))}
                    </tr>
                  ))
                : orders.length === 0
                  ? (
                    <tr><td colSpan={7} className="text-center py-16">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                      <p style={{ color: 'var(--text-secondary)' }}>Захиалга байхгүй байна</p>
                    </td></tr>
                  )
                  : orders.map((o: any) => {
                      const ps = PAYMENT_STATUS_LABELS[o.payment_status] || { label: o.payment_status, badge: 'badge-gray' };
                      return (
                        <tr
                          key={o.id}
                          className="hover:bg-[var(--surface-1)] transition-colors"
                          style={{ borderBottom: '1px solid var(--border)' }}
                        >
                          <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                            #{o.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{o.full_name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{o.email}</p>
                          </td>
                          <td className="px-4 py-3 font-bold text-sm text-brand-primary">
                            {formatPrice(o.total_amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('badge text-xs', ORDER_STATUS_COLORS[o.status] || 'badge-gray')}>
                              {STATUS_MN[o.status] || o.status}
                            </span>
                          </td>
                          {/* Payment method + status combined */}
                          <td className="px-4 py-3">
                            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                              {PAYMENT_METHOD_LABELS[o.payment_method] || o.payment_method || '—'}
                            </p>
                            <span className={cn('badge text-xs', ps.badge)}>{ps.label}</span>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            <span title={formatDate(o.created_at)}>{timeAgo(o.created_at)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSelectedOrder(o)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                              </button>
                              <div className="relative">
                                <select
                                  value={o.status}
                                  onChange={e => statusMutation.mutate({ id: o.id, status: e.target.value })}
                                  className="appearance-none pl-2 pr-6 py-1 rounded-lg text-xs border cursor-pointer"
                                  style={{ borderColor: 'var(--border)', background: 'var(--surface-0)', color: 'var(--text-secondary)' }}
                                >
                                  {STATUSES.filter(s => s !== 'all').map(s => (
                                    <option key={s} value={s}>{STATUS_MN[s]}</option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
              }
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{meta.page} / {meta.totalPages} хуудас</p>
            <div className="flex gap-2">
              <button disabled={!meta.hasPrev} onClick={() => setPage(p => p - 1)} className="btn-ghost btn-sm text-xs disabled:opacity-40">← Өмнөх</button>
              <button disabled={!meta.hasNext} onClick={() => setPage(p => p + 1)} className="btn-ghost btn-sm text-xs disabled:opacity-40">Дараах →</button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
        />
      )}
    </div>
  );
}
