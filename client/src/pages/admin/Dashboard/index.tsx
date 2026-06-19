import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../api';
import { formatPrice, timeAgo, ORDER_STATUS_COLORS } from '../../../utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users, Package, ShoppingBag, DollarSign, AlertTriangle, TrendingUp,
  ArrowUpRight, ArrowDownRight, BarChart2, X, Search,
} from 'lucide-react';
import { cn } from '../../../utils';

// ─── helpers ─────────────────────────────────────────────────────────────────

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function ChangeBadge({ current, previous }: { current: number; previous: number }) {
  const pct = pctChange(current, previous);
  const up = pct >= 0;
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold', up ? 'text-emerald-500' : 'text-red-500')}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(pct)}%
    </span>
  );
}

const STATUS_COLOR: Record<string, string> = {
  delivered:  '#10b981',
  processing: '#6C63FF',
  shipped:    '#3b82f6',
  pending:    '#f59e0b',
  cancelled:  '#ef4444',
  refunded:   '#8b5cf6',
};

// ─── Inventory popup ──────────────────────────────────────────────────────────

type InventoryType = 'active' | 'low' | 'out';

const INVENTORY_CONFIG: Record<InventoryType, {
  title: string; dot: string; emptyMsg: string;
}> = {
  active: { title: 'Идэвхтэй бүтээгдэхүүн',       dot: 'bg-emerald-500', emptyMsg: 'Идэвхтэй бүтээгдэхүүн байхгүй' },
  low:    { title: 'Бага нөөцтэй бүтээгдэхүүн',    dot: 'bg-amber-500',  emptyMsg: 'Бага нөөцтэй бүтээгдэхүүн байхгүй' },
  out:    { title: 'Нөөц дуусчихсан бүтээгдэхүүн', dot: 'bg-red-500',    emptyMsg: 'Нөөц дуусчихсан бүтээгдэхүүн байхгүй' },
};

function InventoryModal({
  type,
  products,
  isLoading,
  onClose,
}: {
  type: InventoryType;
  products: any[];
  isLoading: boolean;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const cfg = INVENTORY_CONFIG[type];

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const stockBadge = (qty: number) =>
    qty === 0
      ? { label: 'Дуссан',          cls: 'badge-danger'  }
      : qty <= 5
      ? { label: `${qty} үлдсэн`,   cls: 'badge-warning' }
      : { label: `${qty} ширхэг`,   cls: 'badge-success' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg flex flex-col rounded-2xl"
        style={{
          background: 'var(--surface-0)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
          maxHeight: '82vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <span className={cn('w-3 h-3 rounded-full flex-shrink-0', cfg.dot)} />
            <div>
              <h3 className="font-bold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
                {cfg.title}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {isLoading ? 'Уншиж байна...' : `${filtered.length} бүтээгдэхүүн`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-[var(--surface-2)]"
          >
            <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Бүтээгдэхүүний нэрээр хайх..."
              className="input pl-9 pr-9 text-sm w-full"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md flex items-center justify-center hover:bg-[var(--surface-2)]"
              >
                <X className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
              </button>
            )}
          </div>
        </div>

        {/* Product list */}
        <div className="overflow-y-auto flex-1 p-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-14 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14" style={{ color: 'var(--text-tertiary)' }}>
              <Package className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">
                {search ? `"${search}" нэртэй бүтээгдэхүүн олдсонгүй` : cfg.emptyMsg}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((p: any) => {
                const img = p.image_url ?? p.images?.[0]?.url ?? null;
                const badge = stockBadge(p.stock_quantity ?? 0);
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[var(--surface-2)]"
                    style={{ background: 'var(--surface-1)' }}
                  >
                    {/* Image */}
                    <div
                      className="w-11 h-11 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center text-lg"
                      style={{ background: 'var(--surface-2)' }}
                    >
                      {img
                        ? <img src={img} alt={p.name} className="w-full h-full object-contain p-1" />
                        : '📦'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {p.name}
                      </p>
                      {p.price != null && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {formatPrice(p.sale_price ?? p.price)}
                          {p.sale_price && (
                            <span className="ml-1.5 line-through opacity-50">{formatPrice(p.price)}</span>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Stock badge */}
                    <span className={cn('badge text-xs flex-shrink-0', badge.cls)}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer count */}
        {!isLoading && filtered.length > 0 && (
          <div
            className="px-5 py-3 flex-shrink-0 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {search
                ? `${filtered.length} / ${products.length} харуулж байна`
                : `Нийт ${products.length} бүтээгдэхүүн`}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-brand-primary hover:underline"
              >
                Хайлт арилгах
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, color, label, value, change, changeSub }: {
  icon: any; color: string; label: string; value: string;
  change?: { current: number; previous: number }; changeSub?: string;
}) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        {change && <ChangeBadge current={change.current} previous={change.previous} />}
      </div>
      <div>
        <p className="font-bold text-xl leading-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        {changeSub && <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{changeSub}</p>}
      </div>
    </div>
  );
}

function MiniStat({ label, value, current, previous, sub }: {
  label: string; value: number; current?: number; previous?: number; sub?: string;
}) {
  return (
    <div className="card p-3">
      <p className="text-xs truncate mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{value.toLocaleString()}</p>
      {current !== undefined && previous !== undefined ? (
        <div className="flex items-center gap-1 mt-0.5">
          <ChangeBadge current={current} previous={previous} />
          <span className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>өмнөх үетэй</span>
        </div>
      ) : sub ? (
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>
      ) : null}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
      </div>
      <div className="skeleton h-72 rounded-2xl" />
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="skeleton h-52 rounded-2xl" />
        <div className="skeleton h-52 rounded-2xl" />
      </div>
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [chartPeriod, setChartPeriod]       = useState<'30d' | '12m'>('30d');
  const [inventoryModal, setInventoryModal] = useState<InventoryType | null>(null);

  // Dashboard stats (always loaded)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: adminApi.getDashboardStats,
    staleTime: 5 * 60 * 1000,
  });

  // Active products — lazy: only fetches when the 'active' popup opens
  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: ['admin-products-active'],
    queryFn:  () => adminApi.listProducts({ limit: 500, page: 1 }),
    enabled:  inventoryModal === 'active',
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <LoadingSkeleton />;

  const {
    revenue       = {} as any,
    orders        = {} as any,
    users         = {} as any,
    products      = {} as any,
    dailyRevenue   = [] as any[],
    monthlyRevenue = [] as any[],
    ordersByStatus = [] as any[],
    topProducts    = [] as any[],
    categoryStats  = [] as any[],
    lowStockProducts = [] as any[],
    recentOrders   = [] as any[],
    recentUsers    = [] as any[],
  } = data || {};

  // ── Inventory popup data (no new API calls for low/out) ──
  const inventoryProductMap: Record<InventoryType, any[]> = {
    active: activeData?.data ?? [],
    low:    (lowStockProducts as any[]).filter(p => p.stock_quantity > 0),
    out:    (lowStockProducts as any[]).filter(p => p.stock_quantity === 0),
  };

  const isInventoryLoading = inventoryModal === 'active' && activeLoading;

  // ── Chart data ──
  const chartData = chartPeriod === '30d'
    ? dailyRevenue.map((r: any) => ({
        label:    new Date(r.day + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        орлого:   Math.round(r.revenue / 1000),
        захиалга: r.orderCount,
      }))
    : monthlyRevenue.map((r: any) => ({
        label:    new Date(r.month + 'T12:00:00').toLocaleDateString('en', { month: 'short', year: '2-digit' }),
        орлого:   Math.round(r.revenue / 1_000_000),
        захиалга: r.orderCount,
      }));

  const chartYLabel = chartPeriod === '30d' ? 'мянга ₮' : 'сая ₮';
  const totalStatusOrders     = ordersByStatus.reduce((s: number, r: any) => s + r.count, 0);
  const totalProductRevenue   = topProducts.reduce((s: number, p: any) => s + p.revenue, 0);

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div>
        <h1 className="font-display font-bold text-xl lg:text-2xl" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>TechMart тоймлол</p>
      </div>

      {/* ── Revenue KPI ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={DollarSign} color="bg-brand-primary"
          label="Өнөөдрийн орлого" value={formatPrice(revenue.today || 0)}
          change={{ current: revenue.today, previous: revenue.yesterday }}
          changeSub={`Өчигдөр: ${formatPrice(revenue.yesterday || 0)}`}
        />
        <KpiCard icon={BarChart2} color="bg-emerald-500"
          label="Энэ сарын орлого" value={formatPrice(revenue.thisMonth || 0)}
          change={{ current: revenue.thisMonth, previous: revenue.lastMonth }}
          changeSub={`Өнгөрсөн сар: ${formatPrice(revenue.lastMonth || 0)}`}
        />
        <KpiCard icon={TrendingUp} color="bg-blue-500"
          label="Жилийн орлого" value={formatPrice(revenue.thisYear || 0)}
          change={{ current: revenue.thisYear, previous: revenue.lastYear }}
          changeSub={`Өнгөрсөн жил: ${formatPrice(revenue.lastYear || 0)}`}
        />
        <KpiCard icon={ShoppingBag} color="bg-amber-500"
          label="Дундаж захиалгын дүн" value={formatPrice(orders.avgOrderValue || 0)}
          changeSub={`${orders.active || 0} идэвхтэй захиалга`}
        />
      </div>

      {/* ── Mini stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="Өнөөдрийн захиалга"   value={orders.today || 0}
          current={orders.today} previous={orders.yesterday} />
        <MiniStat label="Энэ сарын захиалга"   value={orders.thisMonth || 0}
          current={orders.thisMonth} previous={orders.lastMonth} />
        <MiniStat label="Шинэ хэрэглэгч (сар)" value={users.newThisMonth || 0}
          current={users.newThisMonth} previous={users.newLastMonth} />
        <MiniStat label="Нийт хэрэглэгч"       value={users.total || 0}
          sub={`${products.totalActive || 0} идэвхтэй бүтээгдэхүүн`} />
      </div>

      {/* ── Revenue chart ── */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Орлогын график</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{chartYLabel}</p>
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-1)' }}>
            {(['30d', '12m'] as const).map(p => (
              <button key={p} onClick={() => setChartPeriod(p)}
                className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all',
                  chartPeriod === p ? 'bg-brand-primary text-white shadow-sm' : '')}
                style={chartPeriod !== p ? { color: 'var(--text-secondary)' } : {}}>
                {p === '30d' ? '30 өдөр' : '12 сар'}
              </button>
            ))}
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-52" style={{ color: 'var(--text-tertiary)' }}>
            <p className="text-sm">Мэдээлэл байхгүй байна</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6C63FF" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} width={38} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                formatter={(v: any) => [`${v.toLocaleString()} ${chartPeriod === '30d' ? 'мянга ₮' : 'сая ₮'}`, 'Орлого']}
              />
              <Area type="monotone" dataKey="орлого" stroke="#6C63FF" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Orders by status + Inventory ── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Orders by status */}
        <div className="card p-4">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Захиалгын статус</h3>
          <div className="space-y-3">
            {ordersByStatus.map((s: any) => {
              const pct = totalStatusOrders > 0 ? Math.round((s.count / totalStatusOrders) * 100) : 0;
              return (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: STATUS_COLOR[s.status] || '#94a3b8' }} />
                      <span className="text-xs capitalize font-medium" style={{ color: 'var(--text-primary)' }}>{s.status}</span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {s.count.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                         style={{ width: `${pct}%`, background: STATUS_COLOR[s.status] || '#94a3b8' }} />
                  </div>
                </div>
              );
            })}
            {ordersByStatus.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>Захиалга байхгүй</p>
            )}
          </div>
        </div>

        {/* Inventory snapshot — 3 clickable cards */}
        <div className="card p-4">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Нөөцийн тойм</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">

            {/* Active */}
            <button
              onClick={() => setInventoryModal('active')}
              className="text-center p-3 rounded-xl transition-all hover:scale-[1.03] hover:shadow-md cursor-pointer group"
              style={{ background: 'var(--surface-1)' }}
            >
              <p className="text-xl font-bold text-emerald-500 group-hover:text-emerald-400 transition-colors">
                {products.totalActive || 0}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Идэвхтэй</p>
              <p className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500">
                Харах →
              </p>
            </button>

            {/* Low stock */}
            <button
              onClick={() => setInventoryModal('low')}
              className="text-center p-3 rounded-xl transition-all hover:scale-[1.03] hover:shadow-md cursor-pointer group"
              style={{ background: 'var(--surface-1)' }}
            >
              <p className="text-xl font-bold text-amber-500 group-hover:text-amber-400 transition-colors">
                {products.lowStockCount || 0}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Бага нөөц</p>
              <p className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-amber-500">
                Харах →
              </p>
            </button>

            {/* Out of stock */}
            <button
              onClick={() => setInventoryModal('out')}
              className="text-center p-3 rounded-xl transition-all hover:scale-[1.03] hover:shadow-md cursor-pointer group"
              style={{ background: 'var(--surface-1)' }}
            >
              <p className="text-xl font-bold text-red-500 group-hover:text-red-400 transition-colors">
                {products.outOfStock || 0}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Дуусчихсан</p>
              <p className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500">
                Харах →
              </p>
            </button>
          </div>

          {/* Category mini chart */}
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Ангилалаар зарагдсан</p>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart
              data={categoryStats.slice(0, 6).map((c: any) => ({ name: c.category?.slice(0, 7), ш: c.unitsSold }))}
              barSize={18} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                formatter={(v: any) => [`${v} ширхэг`, 'Зарагдсан']}
              />
              <Bar dataKey="ш" fill="#6C63FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top products ── */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-brand-primary" />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Шилдэг 10 бүтээгдэхүүн</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-1)', color: 'var(--text-secondary)' }}>
            delivered захиалгаар
          </span>
        </div>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-xs min-w-[520px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['#', 'Бүтээгдэхүүн', 'Зарагдсан', 'Орлого', 'Хувь'].map(h => (
                  <th key={h} className="text-left pb-2 pr-4 font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p: any, i: number) => {
                const pct = totalProductRevenue > 0 ? Math.round((p.revenue / totalProductRevenue) * 100) : 0;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-2.5 pr-4 font-mono font-bold w-6"
                        style={{ color: i < 3 ? '#6C63FF' : 'var(--text-tertiary)' }}>{i + 1}</td>
                    <td className="py-2.5 pr-4">
                      <p className="font-medium truncate max-w-[180px]" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                    </td>
                    <td className="py-2.5 pr-4" style={{ color: 'var(--text-secondary)' }}>{p.unitsSold.toLocaleString()} ш</td>
                    <td className="py-2.5 pr-4 font-semibold" style={{ color: 'var(--text-primary)' }}>{formatPrice(p.revenue)}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full bg-brand-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-right" style={{ color: 'var(--text-tertiary)' }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {topProducts.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>Мэдээлэл байхгүй</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Low stock alert + Recent users ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Нөөц бага (≤ 5)</h3>
          </div>
          <div className="space-y-2">
            {lowStockProducts.slice(0, 8).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between gap-3">
                <span className="truncate text-xs" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                <span className={cn('badge flex-shrink-0 text-xs', p.stock_quantity === 0 ? 'badge-danger' : 'badge-warning')}>
                  {p.stock_quantity === 0 ? 'Дуссан' : `${p.stock_quantity} үлдсэн`}
                </span>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <p className="text-xs py-3 text-center" style={{ color: 'var(--text-secondary)' }}>Бүх бүтээгдэхүүн нөөцтэй ✓</p>
            )}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-brand-primary" />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Сүүлд бүртгүүлсэн хэрэглэгч</h3>
          </div>
          <div className="space-y-3">
            {recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-primary text-xs font-bold">{u.full_name?.[0] || '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.full_name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{u.email}</p>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{timeAgo(u.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent orders ── */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-brand-primary" />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Сүүлийн захиалгууд</h3>
        </div>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-xs min-w-[520px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['ID', 'Хэрэглэгч', 'Дүн', 'Бараа', 'Статус', 'Огноо'].map(h => (
                  <th key={h} className="text-left pb-2 pr-3 font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o: any) => (
                <tr key={o.id} className="transition-colors hover:bg-[var(--surface-1)]"
                    style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-2.5 pr-3 font-mono" style={{ color: 'var(--text-tertiary)' }}>#{o.id.slice(0, 6)}</td>
                  <td className="py-2.5 pr-3">
                    <p className="truncate max-w-[100px] font-medium" style={{ color: 'var(--text-primary)' }}>{o.full_name}</p>
                    <p className="truncate max-w-[100px]" style={{ color: 'var(--text-tertiary)' }}>{o.email}</p>
                  </td>
                  <td className="py-2.5 pr-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{formatPrice(o.total_amount)}</td>
                  <td className="py-2.5 pr-3" style={{ color: 'var(--text-secondary)' }}>{o.item_count} ш</td>
                  <td className="py-2.5 pr-3">
                    <span className={cn('badge text-xs', ORDER_STATUS_COLORS[o.status] || 'badge-gray')}>{o.status}</span>
                  </td>
                  <td className="py-2.5" style={{ color: 'var(--text-tertiary)' }}>{timeAgo(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Inventory modal ── */}
      {inventoryModal && (
        <InventoryModal
          type={inventoryModal}
          products={inventoryProductMap[inventoryModal]}
          isLoading={isInventoryLoading}
          onClose={() => setInventoryModal(null)}
        />
      )}

    </div>
  );
}
