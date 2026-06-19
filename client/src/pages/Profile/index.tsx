import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authApi, ordersApi, wishlistApi } from '../../api';
import { useAuthStore, useUIStore } from '../../store';
import { formatPrice, formatDate, effectivePrice, ORDER_STATUS_COLORS } from '../../utils';
import { User, Package, Heart, LogOut, Camera, ChevronRight, X, MapPin, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../utils';
import toast from 'react-hot-toast';

type Tab = 'info' | 'orders' | 'wishlist';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const { language } = useUIStore();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list(1),
    enabled: activeTab === 'orders',
  });

  const { data: wishlist, isLoading: wishlistLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistApi.get,
    enabled: activeTab === 'wishlist',
  });

  const { data: selectedOrder, isLoading: orderDetailLoading } = useQuery({
    queryKey: ['order', selectedOrderId],
    queryFn: () => ordersApi.getById(selectedOrderId!),
    enabled: !!selectedOrderId,
  });

  const updateMutation = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (updated) => {
      setUser(updated);
      setEditMode(false);
      toast.success('Мэдээлэл шинэчлэгдлээ');
    },
    onError: () => toast.error('Алдаа гарлаа'),
  });

  const handleSave = () => {
    if (!form.full_name.trim()) { toast.error('Нэр заавал бөглөнө'); return; }
    updateMutation.mutate(form);
  };

  const handleLogout = () => {
    logout();
    toast.success('Амжилттай гарлаа');
    navigate('/');
  };

  const TABS = [
    { id: 'info', icon: User, label: 'Хувийн мэдээлэл' },
    { id: 'orders', icon: Package, label: 'Захиалгууд' },
    { id: 'wishlist', icon: Heart, label: 'Хадгалсан' },
  ] as const;

  const statusLabel = (s: string) =>
    s === 'pending' ? 'Хүлээгдэж байна'
    : s === 'processing' ? 'Боловсруулж байна'
    : s === 'shipped' ? 'Илгээсэн'
    : s === 'delivered' ? 'Хүргэсэн'
    : 'Цуцалсан';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Profile header */}
      <div className="card p-4 sm:p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-primary/10 flex items-center justify-center">
              <span className="text-brand-primary font-display font-bold text-2xl sm:text-3xl">
                {user?.full_name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--surface-0)] border-2 flex items-center justify-center cursor-pointer hover:bg-[var(--surface-1)] transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: 'var(--text-secondary)' }} />
            </div>
          </div>

          {/* Info + Logout */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="font-display font-bold text-lg sm:text-xl truncate" style={{ color: 'var(--text-primary)' }}>
                  {user?.full_name}
                </h1>
                <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={cn('badge text-xs', user?.role === 'admin' ? 'badge-primary' : 'badge-gray')}>
                    {user?.role === 'admin' ? '👑 Admin' : 'Хэрэглэгч'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {language === 'mn' ? '🇲🇳 Монгол' : '🇬🇧 English'}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex-shrink-0 flex items-center gap-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl px-2 sm:px-4 py-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Гарах</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar tabs */}
        <div className="md:col-span-1">
          <div className="card p-2 space-y-0.5">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as Tab)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left',
                  activeTab === id
                    ? 'bg-brand-primary/10 text-brand-primary font-medium'
                    : 'hover:bg-[var(--surface-1)]'
                )}
                style={{ color: activeTab === id ? undefined : 'var(--text-secondary)' }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3">

          {/* ── Хувийн мэдээлэл ── */}
          {activeTab === 'info' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Хувийн мэдээлэл</h2>
                {!editMode && (
                  <button onClick={() => setEditMode(true)} className="btn-ghost btn-sm text-brand-primary">
                    Засах
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Овог нэр</label>
                  {editMode
                    ? <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="input text-sm" />
                    : <p className="text-sm py-2.5 px-3 rounded-xl" style={{ background: 'var(--surface-1)', color: 'var(--text-primary)' }}>{user?.full_name}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Имэйл</label>
                  <p className="text-sm py-2.5 px-3 rounded-xl" style={{ background: 'var(--surface-1)', color: 'var(--text-secondary)' }}>
                    {user?.email} <span className="text-xs ml-2" style={{ color: 'var(--text-tertiary)' }}>(өөрчлөх боломжгүй)</span>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Утасны дугаар</label>
                  {editMode
                    ? <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input text-sm" placeholder="+976 9900 0000" />
                    : <p className="text-sm py-2.5 px-3 rounded-xl" style={{ background: 'var(--surface-1)', color: 'var(--text-primary)' }}>{user?.phone || '—'}</p>}
                </div>

                {editMode && (
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleSave} disabled={updateMutation.isPending} className="btn-primary px-6">
                      {updateMutation.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
                    </button>
                    <button
                      onClick={() => { setEditMode(false); setForm({ full_name: user?.full_name || '', phone: user?.phone || '' }); }}
                      className="btn-ghost px-6"
                    >
                      Болих
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Захиалгууд ── */}
          {activeTab === 'orders' && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Захиалгын түүх</h2>
              </div>
              {ordersLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
                </div>
              ) : !orders?.data?.length ? (
                <div className="text-center py-16">
                  <Package className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Захиалга байхгүй байна</p>
                  <Link to="/shop" className="btn-primary btn-sm mt-4 inline-flex">Дэлгүүр хэсэх</Link>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {orders.data.map((order: any) => (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className="w-full px-6 py-4 hover:bg-[var(--surface-1)] transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                            Захиалга #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            {formatDate(order.created_at)} · {order.item_count || 0} бараа
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-sm text-brand-primary">{formatPrice(order.total_amount)}</p>
                            <span className={cn('badge text-xs mt-1', ORDER_STATUS_COLORS[order.status] || 'badge-gray')}>
                              {statusLabel(order.status)}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Хадгалсан бараанууд ── */}
          {activeTab === 'wishlist' && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Хадгалсан бараанууд</h2>
              </div>
              {wishlistLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
                </div>
              ) : !wishlist?.length ? (
                <div className="text-center py-16">
                  <Heart className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>Хадгалсан бараа байхгүй байна</p>
                  <Link to="/shop" className="btn-primary btn-sm mt-4 inline-flex">Дэлгүүр хэсэх</Link>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {wishlist.map((item: any) => (
                    <Link
                      key={item.id}
                      to={`/products/${item.slug}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--surface-1)] transition-colors"
                    >
                      <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                        {item.image_url
                          ? <img src={item.image_url} alt={item.name} className="w-12 h-12 object-contain" />
                          : <span className="text-2xl">📦</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                        <p className="text-sm font-bold text-brand-primary mt-0.5">
                          {formatPrice(effectivePrice(item.price, item.sale_price))}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Order Detail Modal ── */}
      {selectedOrderId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSelectedOrderId(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: 'var(--surface-0)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                  Захиалгын дэлгэрэнгүй
                </h3>
                {selectedOrder && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    #{selectedOrder.id.slice(0, 8).toUpperCase()} · {formatDate(selectedOrder.created_at)}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--surface-1)] transition-colors"
              >
                <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {orderDetailLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
              </div>
            ) : selectedOrder ? (
              <div className="p-6 space-y-5">

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Төлөв</span>
                  <span className={cn('badge text-xs', ORDER_STATUS_COLORS[selectedOrder.status] || 'badge-gray')}>
                    {statusLabel(selectedOrder.status)}
                  </span>
                </div>

                {/* Items */}
                <div>
                  <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>БАРААНУУД</p>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                          style={{ background: 'var(--surface-1)' }}
                        >
                          {item.image_url
                            ? <img src={item.image_url} alt={item.name} className="w-10 h-10 object-contain" />
                            : <span className="text-xl">📦</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            {item.quantity}ш × {formatPrice(item.unit_price)}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-brand-primary flex-shrink-0">
                          {formatPrice(item.unit_price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t" style={{ borderColor: 'var(--border)' }} />

                {/* Shipping address */}
                {selectedOrder.shipping_address && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>ХҮРГЭЛТИЙН ХАЯГ</p>
                    </div>
                    <div className="rounded-xl p-3 text-sm space-y-0.5" style={{ background: 'var(--surface-1)' }}>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedOrder.shipping_address.full_name}</p>
                      <p style={{ color: 'var(--text-secondary)' }}>{selectedOrder.shipping_address.phone}</p>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        {selectedOrder.shipping_address.district}, {selectedOrder.shipping_address.city}
                      </p>
                      <p style={{ color: 'var(--text-secondary)' }}>{selectedOrder.shipping_address.address}</p>
                    </div>
                  </div>
                )}

                {/* Payment */}
                <div className="flex items-center gap-1.5 mb-2">
                  <CreditCard className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>ТӨЛБӨР</p>
                </div>
                <div className="flex items-center justify-between -mt-3">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {selectedOrder.payment_method === 'qpay' ? 'QPay' : selectedOrder.payment_method}
                  </span>
                  <span className={cn('badge text-xs',
                    selectedOrder.payment_status === 'paid' ? 'badge-success'
                    : selectedOrder.payment_status === 'failed' ? 'badge-danger'
                    : 'badge-gray'
                  )}>
                    {selectedOrder.payment_status === 'paid' ? 'Төлөгдсөн'
                      : selectedOrder.payment_status === 'failed' ? 'Амжилтгүй'
                      : selectedOrder.payment_status === 'refunded' ? 'Буцаагдсан'
                      : 'Хүлээгдэж байна'}
                  </span>
                </div>

                <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Нийт дүн</span>
                    <span className="font-bold text-lg text-brand-primary">{formatPrice(selectedOrder.total_amount)}</span>
                  </div>
                </div>

              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
}
