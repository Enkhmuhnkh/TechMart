import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { CartDrawer } from '../components/layout/CartDrawer';
import { useCartStore, useAuthStore, useUIStore } from '../store';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api';
import { cn } from '../utils';

// ── Announcement bar ───────────────────────────────────────────────────────────
function AnnouncementBar() {
  const { theme } = useUIStore();
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => adminApi.getSettings(),
    staleTime: 5 * 60 * 1000,
  });
  if (!settings?.announcement) return null;
  return (
    <div className="announcement-bar">
      <span className="animate-live inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: theme === 'dark' ? '#818CF8' : '#6366F1' }} />
      <span>{settings.announcement}</span>
    </div>
  );
}

// ── Mobile bottom navigation — 4 tabs only ────────────────────────────────────
function BottomNav() {
  const location = useLocation();
  const { itemCount } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { theme } = useUIStore();
  const count = itemCount();

  const hidden = ['/checkout', '/login', '/register'].some(p => location.pathname.startsWith(p));
  if (hidden) return null;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const tabs = [
    { path: '/', icon: Home, label: 'Нүүр' },
    { path: '/shop', icon: ShoppingBag, label: 'Дэлгүүр' },
    { path: '/cart', icon: ShoppingCart, label: 'Сагс', badge: count },
    { path: isAuthenticated ? '/profile' : '/login', icon: User, label: isAuthenticated ? 'Профайл' : 'Нэвтрэх' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <Link key={tab.path} to={tab.path}
          className={cn('bottom-nav-item', isActive(tab.path) && 'active')}>
          <div className="relative">
            <tab.icon className={cn('transition-transform duration-200',
              isActive(tab.path) ? 'scale-110' : 'scale-100')} />
            {tab.badge ? (
              <motion.span key={tab.badge} initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{
                  fontSize: '8px', fontFamily: "'DM Mono', monospace",
                  background: theme === 'dark' ? '#6366F1' : 'var(--ink)',
                  color: 'white',
                }}>
                {tab.badge > 9 ? '9+' : tab.badge}
              </motion.span>
            ) : null}
          </div>
          <span style={{ fontSize: '10px' }}>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}

// ── Root Layout ────────────────────────────────────────────────────────────────
export function RootLayout() {
  const location = useLocation();
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={location.pathname}
            initial={{ opacity: 0, y: 22, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
            exit={{    opacity: 0, y: -10, filter: 'blur(2px)' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <CartDrawer />
      <BottomNav />
    </div>
  );
}
