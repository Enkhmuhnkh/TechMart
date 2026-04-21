import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, ordersApi, wishlistApi } from '../../api';
import { useAuthStore, useUIStore } from '../../store';
import { formatPrice, formatDate, effectivePrice, ORDER_STATUS_COLORS } from '../../utils';
import { User, Package, Heart, Settings, LogOut, Camera, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../utils';
import toast from 'react-hot-toast';

type Tab = 'info' | 'orders' | 'wishlist' | 'settings';

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, setUser, logout } = useAuthStore();
  const { language, setLanguage } = useUIStore();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  });

  // Queries
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

  // Update profile mutation
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
    toast.success(t('auth.logoutSuccess'));
    navigate('/');
  };

  const handleLangChange = (lang: 'mn' | 'en') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    authApi.updateMe({ language_pref: lang }).catch(() => {});
  };

  const TABS = [
    { id: 'info', icon: User, label: 'Хувийн мэдээлэл' },
    { id: 'orders', icon: Package, label: 'Захиалгууд' },
    { id: 'wishlist', icon: Heart, label: 'Хадгалсан' },
    { id: 'settings', icon: Settings, label: 'Тохиргоо' },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Profile header */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-brand-primary font-display font-bold text-3xl">
                {user?.full_name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--surface-0)] border-2 flex items-center justify-center cursor-pointer hover:bg-[var(--surface-1)] transition-colors"
                 style={{ borderColor: 'var(--border)' }}>
              <Camera className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
              {user?.full_name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className={cn('badge text-xs', user?.role === 'admin' ? 'badge-primary' : 'badge-gray')}>
                {user?.role === 'admin' ? '👑 Admin' : 'Хэрэглэгч'}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {language === 'mn' ? '🇲🇳 Монгол' : '🇬🇧 English'}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button onClick={handleLogout} className="btn-ghost flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl px-4 py-2">
            <LogOut className="w-4 h-4" /> Гарах
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar tabs */}
        <div className="md:col-span-1">
          <div className="card p-2 space-y-0.5">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setActiveTab(id as Tab)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left',
                  activeTab === id
                    ? 'bg-brand-primary/10 text-brand-primary font-medium'
                    : 'hover:bg-[var(--surface-1)]'
                )}
                style={{ color: activeTab === id ? undefined : 'var(--text-secondary)' }}>
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
                    <button onClick={() => { setEditMode(false); setForm({ full_name: user?.full_name || '', phone: user?.phone || '' }); }} className="btn-ghost px-6">
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
                    <div key={order.id} className="px-6 py-4 hover:bg-[var(--surface-1)] transition-colors">
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
                              {order.status === 'pending' ? 'Хүлээгдэж байна'
                                : order.status === 'processing' ? 'Боловсруулж байна'
                                : order.status === 'shipped' ? 'Илгээсэн'
                                : order.status === 'delivered' ? 'Хүргэсэн'
                                : 'Цуцалсан'}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      </div>
                    </div>
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
                    <Link key={item.id} to={`/products/${item.slug}`}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--surface-1)] transition-colors">
                      <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                        {item.image_url
                          ? <img src={(item.image_url)} alt={item.name} className="w-12 h-12 object-contain" />
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

          {/* ── Тохиргоо ── */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Хэлний тохиргоо */}
              <div className="card p-6">
                <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Хэлний тохиргоо</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { code: 'mn', label: '🇲🇳 Монгол', sub: 'Монгол хэл' },
                    { code: 'en', label: '🇬🇧 English', sub: 'Англи хэл' },
                  ].map(lang => (
                    <button key={lang.code} onClick={() => handleLangChange(lang.code as 'mn' | 'en')}
                      className={cn(
                        'p-4 rounded-2xl border-2 text-left transition-all',
                        language === lang.code
                          ? 'border-brand-primary bg-brand-primary/5'
                          : 'hover:border-brand-primary/40'
                      )}
                      style={{ borderColor: language === lang.code ? undefined : 'var(--border)' }}>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{lang.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{lang.sub}</p>
                      {language === lang.code && (
                        <span className="badge-primary text-xs mt-2 inline-block">✓ Сонгогдсон</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Аккаунтын мэдээлэл */}
              <div className="card p-6">
                <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>Аккаунт</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Имэйл хаяг</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{user?.email}</p>
                    </div>
                  </div>
                  <div className="border-t" style={{ borderColor: 'var(--border)' }} />
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Эрхийн түвшин</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {user?.role === 'admin' ? 'Администратор' : 'Хэрэглэгч'}
                      </p>
                    </div>
                    <span className={cn('badge text-xs', user?.role === 'admin' ? 'badge-primary' : 'badge-gray')}>
                      {user?.role === 'admin' ? '👑 Admin' : 'Customer'}
                    </span>
                  </div>
                  <div className="border-t" style={{ borderColor: 'var(--border)' }} />
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors py-2 w-full">
                    <LogOut className="w-4 h-4" /> Аккаунтаас гарах
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
