import { Outlet, NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, Bookmark, ShoppingBag, Users, Star, LogOut, Menu, X, Settings } from 'lucide-react';
import { useAuthStore } from '../store';
import { authApi } from '../api';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils';
import { useState } from 'react';

const NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Бүтээгдэхүүн' },
  { to: '/admin/categories', icon: Tag, label: 'Ангилал' },
  { to: '/admin/brands', icon: Bookmark, label: 'Брэнд' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Захиалга' },
  { to: '/admin/users', icon: Users, label: 'Хэрэглэгч' },
  { to: '/admin/reviews', icon: Star, label: 'Сэтгэгдэл' },
  { to: '/admin/settings', icon: Settings, label: 'Тохиргоо' },
];

export function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <Link to="/" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <div>
            <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>TechMart</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Admin Panel</p>
          </div>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden btn-ghost p-1.5 rounded-lg">
          <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
              isActive ? 'bg-brand-primary/10 text-brand-primary font-medium' : 'hover:bg-[var(--surface-1)]'
            )}
            style={({ isActive }) => ({ color: isActive ? undefined : 'var(--text-secondary)' })}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-primary text-xs font-bold">{user?.full_name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.full_name}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Admin</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 w-full text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors">
          <LogOut className="w-4 h-4" /> Гарах
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface-1)' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - desktop always visible, mobile slide-in */}
      <aside className={cn(
        'fixed lg:static top-0 left-0 h-full z-50 w-60 flex-shrink-0 flex flex-col border-r transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )} style={{ background: 'var(--surface-0)', borderColor: 'var(--border)', minHeight: '100vh' }}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b sticky top-0 z-30"
          style={{ background: 'var(--surface-0)', borderColor: 'var(--border)' }}>
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-2 rounded-lg">
            <Menu className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
          <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Admin Panel</span>
        </div>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
