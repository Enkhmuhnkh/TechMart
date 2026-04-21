import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../api';
import { formatPrice, timeAgo, ORDER_STATUS_COLORS } from '../../../utils';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Users, Package, ShoppingBag, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '../../../utils';

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs mb-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className="font-bold text-lg leading-tight truncate" style={{ color: 'var(--text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: adminApi.getDashboard });
  const { data: revenue } = useQuery({ queryKey: ['admin-revenue'], queryFn: adminApi.getRevenueAnalytics });
  const { data: products } = useQuery({ queryKey: ['admin-products'], queryFn: adminApi.getProductAnalytics });

  const revenueData = (revenue || []).map((r: any) => ({
    month: new Date(r.month).toLocaleDateString('en', { month: 'short' }),
    орлого: Math.round(r.revenue / 1000000),
  }));

  const categoryData = (products?.byCategory || []).slice(0, 5).map((c: any) => ({
    name: c.category?.slice(0, 8),
    зарагдсан: parseInt(c.units_sold) || 0,
  }));

  if (isLoading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
      <div className="skeleton h-60 rounded-2xl" />
    </div>
  );

  const { stats, lowStock, recentOrders, recentUsers } = data || {};

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-xl lg:text-2xl" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>TechMart overview</p>
      </div>

      {/* Stats — 2 col mobile, 4 col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Нийт орлого" value={formatPrice(stats?.revenue || 0)} color="bg-brand-primary" />
        <StatCard icon={ShoppingBag} label="Захиалга" value={stats?.orders || 0} color="bg-emerald-500" />
        <StatCard icon={Package} label="Бүтээгдэхүүн" value={stats?.products || 0} color="bg-amber-500" />
        <StatCard icon={Users} label="Хэрэглэгч" value={stats?.users || 0} color="bg-purple-500" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Сарын орлого (сая ₮)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={30} />
              <Tooltip contentStyle={{ background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
              <Line type="monotone" dataKey="орлого" stroke="#6C63FF" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Ангилалаар зарагдсан</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} width={30} />
              <Tooltip contentStyle={{ background: 'var(--surface-0)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="зарагдсан" fill="#6C63FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low stock + Recent users - stack on mobile */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Нөөц бага</h3>
          </div>
          <div className="space-y-2">
            {(lowStock || []).slice(0, 6).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-sm gap-2">
                <span className="truncate text-xs" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                <span className={cn('badge flex-shrink-0 text-xs', p.stock_quantity === 0 ? 'badge-danger' : 'badge-warning')}>
                  {p.stock_quantity}
                </span>
              </div>
            ))}
            {(!lowStock || lowStock.length === 0) && (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Бүх бүтээгдэхүүн нөөцтэй ✓</p>
            )}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-brand-primary" />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Шинэ хэрэглэгч</h3>
          </div>
          <div className="space-y-2.5">
            {(recentUsers || []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-primary text-xs font-bold">{u.full_name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.full_name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{timeAgo(u.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders - scrollable on mobile */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-brand-primary" />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Сүүлийн захиалгууд</h3>
        </div>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-xs min-w-[400px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['ID', 'Хэрэглэгч', 'Дүн', 'Статус', 'Хэзээ'].map(h => (
                  <th key={h} className="text-left pb-2 pr-3 font-medium" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentOrders || []).map((o: any) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-2.5 pr-3 font-mono" style={{ color: 'var(--text-tertiary)' }}>#{o.id.slice(0, 6)}</td>
                  <td className="py-2.5 pr-3 truncate max-w-[80px]" style={{ color: 'var(--text-primary)' }}>{o.full_name}</td>
                  <td className="py-2.5 pr-3 font-medium" style={{ color: 'var(--text-primary)' }}>{formatPrice(o.total_amount)}</td>
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
    </div>
  );
}
