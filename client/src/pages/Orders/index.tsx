import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api';
import { formatPrice, formatDate, timeAgo, ORDER_STATUS_COLORS } from '../../utils';
import { Package, ChevronRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { cn } from '../../utils';

const STATUS_MN: Record<string, string> = {
  pending: 'Хүлээгдэж байна',
  processing: 'Боловсруулж байна',
  shipped: 'Илгээсэн',
  delivered: 'Хүргэсэн',
  cancelled: 'Цуцалсан',
};

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

function OrderTimeline({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.indexOf(status);
  if (status === 'cancelled') return (
    <div className="flex items-center gap-2 py-3">
      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <span className="text-red-500 text-sm">✕</span>
      </div>
      <span className="text-sm text-red-500 font-medium">Захиалга цуцлагдсан</span>
    </div>
  );

  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((s, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                done ? 'bg-brand-primary text-white' : 'text-[var(--text-tertiary)]')}
                   style={{ background: done ? undefined : 'var(--surface-2)' }}>
                {done ? (active ? '●' : '✓') : i + 1}
              </div>
              <span className="text-xs mt-1 text-center w-16 leading-tight"
                    style={{ color: active ? 'var(--brand-primary, #6C63FF)' : done ? 'var(--text-secondary)' : 'var(--text-tertiary)', fontWeight: active ? 600 : 400 }}>
                {STATUS_MN[s]}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mb-5 mx-1" style={{ background: i < currentIdx ? 'var(--brand-primary, #6C63FF)' : 'var(--border)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Order detail view
function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48 rounded-xl" />
      <div className="skeleton h-40 rounded-2xl" />
      <div className="skeleton h-60 rounded-2xl" />
    </div>
  );

  if (!order) return (
    <div className="text-center py-16">
      <p style={{ color: 'var(--text-secondary)' }}>Захиалга олдсонгүй</p>
      <button onClick={() => navigate('/orders')} className="btn-primary mt-4">Буцах</button>
    </div>
  );

  const addr = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address)
    : order.shipping_address;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/orders')} className="btn-ghost rounded-xl p-2">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>
        <div>
          <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
            Захиалга #{order.id.slice(0, 8).toUpperCase()}
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {formatDate(order.created_at)} · {timeAgo(order.created_at)}
          </p>
        </div>
        <span className={cn('badge text-xs ml-auto', ORDER_STATUS_COLORS[order.status] || 'badge-gray')}>
          {STATUS_MN[order.status] || order.status}
        </span>
      </div>

      {/* Timeline */}
      <div className="card p-5">
        <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Захиалгын явц</h3>
        <OrderTimeline status={order.status} />
      </div>

      {/* Items */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Захиалсан бараанууд</h3>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {(order.items || []).map((item: any) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden" style={{ background: 'var(--surface-1)' }}>
                {item.image_url
                  ? <img src={(item.image_url)} alt={item.name} className="w-full h-full object-contain p-1" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.slug}`} className="font-medium text-sm hover:text-brand-primary transition-colors truncate block"
                      style={{ color: 'var(--text-primary)' }}>
                  {item.name}
                </Link>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>× {item.quantity}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-sm text-brand-primary">{formatPrice(item.unit_price * item.quantity)}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatPrice(item.unit_price)} / ширхэг</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t space-y-2" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Хүргэлт</span>
            <span className="text-emerald-500 font-medium">Үнэгүй</span>
          </div>
          <div className="flex justify-between font-bold">
            <span style={{ color: 'var(--text-primary)' }}>Нийт дүн</span>
            <span className="text-brand-primary text-lg">{formatPrice(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Shipping info */}
      <div className="card p-5">
        <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Хүргэлтийн мэдээлэл</h3>
        <div className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{addr?.full_name}</p>
          <p>{addr?.phone}</p>
          <p>{addr?.district} дүүрэг, {addr?.city}</p>
          <p>{addr?.address}</p>
        </div>
        <div className="mt-3 pt-3 border-t text-sm" style={{ borderColor: 'var(--border)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Төлбөрийн хэлбэр: </span>
          <span style={{ color: 'var(--text-primary)' }}>
            {order.payment_method === 'cash' ? '💵 Бэлэн мөнгө'
              : order.payment_method === 'qpay' ? '📱 QPay'
              : '💳 Карт'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Orders list view
function OrdersList() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => ordersApi.list(page),
  });

  const orders = data?.data || [];
  const meta = data?.meta;

  if (isLoading) return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  );

  if (!orders.length) return (
    <div className="text-center py-24">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--surface-2)' }}>
        <ShoppingBag className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} />
      </div>
      <h2 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
        {t('orders.empty')}
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Та одоогоор захиалга хийгээгүй байна
      </p>
      <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
        Дэлгүүр хэсэх <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
          {t('orders.title')}
        </h1>
        <span className="badge-gray text-xs">{meta?.total || orders.length} захиалга</span>
      </div>

      <div className="space-y-3">
        {orders.map((order: any) => (
          <Link key={order.id} to={`/orders/${order.id}`}
            className="card p-5 flex items-center gap-4 hover:border-brand-primary/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-2)' }}>
              <Package className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <span className={cn('badge text-xs', ORDER_STATUS_COLORS[order.status] || 'badge-gray')}>
                  {STATUS_MN[order.status] || order.status}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {formatDate(order.created_at)} · {order.item_count || 0} бараа
              </p>
            </div>
            <div className="text-right flex-shrink-0 flex items-center gap-3">
              <div>
                <p className="font-bold text-brand-primary">{formatPrice(order.total_amount)}</p>
              </div>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-tertiary)' }} />
            </div>
          </Link>
        ))}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button disabled={!meta.hasPrev} onClick={() => setPage(p => p - 1)} className="btn-ghost btn-sm disabled:opacity-40">← Өмнөх</button>
          <span className="btn-ghost btn-sm">{meta.page} / {meta.totalPages}</span>
          <button disabled={!meta.hasNext} onClick={() => setPage(p => p + 1)} className="btn-ghost btn-sm disabled:opacity-40">Дараах →</button>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { id } = useParams<{ id?: string }>();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {id ? <OrderDetail /> : <OrdersList />}
    </div>
  );
}
