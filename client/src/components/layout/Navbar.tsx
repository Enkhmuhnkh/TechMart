import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingCart, Heart, Search, Sun, Moon,
  User, LayoutDashboard, LogOut, Sparkles
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useCartStore, useUIStore } from '../../store';
import { authApi, adminApi } from '../../api';
import { SearchCommand } from './SearchCommand';
import toast from 'react-hot-toast';

export function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount, openCart } = useCartStore();
  const { theme, toggleTheme } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const count = itemCount();

  // Scroll shadow
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  // Store settings
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => adminApi.getSettings(),
    staleTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const storeName = settings?.store_name || 'TechMart';
  const storeLogo = settings?.store_logo || null;

  // Cmd+K
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    toast.success('Гарлаа 👋');
    navigate('/');
    setMenuOpen(false);
  };

  // Icon button helper
  const IconBtn = ({ onClick, children, className = '' }: { onClick?: () => void; children: React.ReactNode; className?: string }) => (
    <button onClick={onClick}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--surface-2)] active:scale-90 ${className}`}>
      {children}
    </button>
  );

  return (
    <>
      <SearchCommand open={searchOpen} onClose={() => setSearchOpen(false)} />

      <nav className="sticky top-0 z-50 border-b transition-all duration-300"
        style={{
          borderColor: 'var(--border)',
          background: theme === 'dark'
            ? 'rgba(15,15,19,0.92)'
            : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: scrolled
            ? '0 1px 32px rgba(0,0,0,0.08)'
            : 'none',
        }}>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-3">

            {/* ── Logo ── */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2.5 group mr-1">
              {storeLogo ? (
                <img src={storeLogo} alt={storeName}
                  className="w-8 h-8 rounded-xl object-contain transition-transform group-hover:scale-105"
                  style={{ background: 'var(--surface-1)' }} />
              ) : (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-all group-hover:scale-105 group-hover:shadow-md"
                  style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)' }}>
                  <span className="text-white font-bold text-sm leading-none">
                    {storeName[0]?.toUpperCase() || 'T'}
                  </span>
                </div>
              )}
              <span className="font-display font-bold text-lg hidden sm:block"
                style={{ color: 'var(--text-primary)' }}>
                {storeName}
              </span>
            </Link>

            {/* ── Search bar — desktop ── */}
            <button onClick={() => setSearchOpen(true)}
              className="flex-1 max-w-xl hidden md:flex items-center gap-3 px-4 py-2.5 rounded-2xl border text-left transition-all duration-200 group"
              style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.borderColor = 'rgba(108,99,255,0.35)';
                el.style.background = 'var(--surface-0)';
                el.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.08)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.borderColor = 'var(--border)';
                el.style.background = 'var(--surface-1)';
                el.style.boxShadow = 'none';
              }}>
              <Search className="w-4 h-4 flex-shrink-0 transition-colors group-hover:text-brand-primary"
                style={{ color: 'var(--text-tertiary)' }} />
              <span className="flex-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Бараа, ангилал хайх...
              </span>
              <kbd className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)', background: 'var(--surface-0)' }}>
                ⌘K
              </kbd>
            </button>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-0.5 ml-auto">

              {/* Search mobile */}
              <IconBtn onClick={() => setSearchOpen(true)} className="md:hidden">
                <Search className="w-[18px] h-[18px]" style={{ color: 'var(--text-secondary)' }} />
              </IconBtn>

              {/* AI */}
              <Link to="/ai"
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0 mx-1 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
                  color: 'white',
                  boxShadow: '0 2px 14px rgba(108,99,255,0.45)',
                }}>
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:block">AI</span>
              </Link>

              {/* Theme */}
              <IconBtn onClick={toggleTheme}>
                <AnimatePresence mode="wait">
                  <motion.div key={theme}
                    initial={{ rotate: -30, opacity: 0, scale: 0.8 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 30, opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}>
                    {theme === 'dark'
                      ? <Sun className="w-[18px] h-[18px]" style={{ color: 'var(--text-secondary)' }} />
                      : <Moon className="w-[18px] h-[18px]" style={{ color: 'var(--text-secondary)' }} />}
                  </motion.div>
                </AnimatePresence>
              </IconBtn>

              {/* Wishlist */}
              <Link to="/wishlist"
                className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center transition-all hover:bg-[var(--surface-2)] group active:scale-90">
                <Heart className="w-[18px] h-[18px] transition-colors group-hover:text-red-500 group-hover:fill-red-500"
                  style={{ color: 'var(--text-secondary)' }} />
              </Link>

              {/* Cart */}
              <button onClick={openCart}
                className="w-9 h-9 rounded-xl flex items-center justify-center relative transition-all hover:bg-[var(--surface-2)] group active:scale-90">
                <ShoppingCart className="w-[18px] h-[18px] transition-colors group-hover:text-brand-primary"
                  style={{ color: 'var(--text-secondary)' }} />
                <AnimatePresence>
                  {count > 0 && (
                    <motion.span
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)' }}>
                      {count > 9 ? '9+' : count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* User / Login */}
              {isAuthenticated && user ? (
                <div className="relative ml-1">
                  <motion.button
                    onClick={() => setMenuOpen(v => !v)}
                    whileTap={{ scale: 0.92 }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)' }}>
                    {user.full_name[0].toUpperCase()}
                  </motion.button>

                  <AnimatePresence>
                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.94 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute right-0 top-11 w-56 z-50 rounded-2xl border overflow-hidden"
                          style={{
                            background: 'var(--surface-0)',
                            borderColor: 'var(--border)',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
                          }}>

                          {/* Profile header */}
                          <div className="px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)' }}>
                                {user.full_name[0].toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                  {user.full_name}
                                </p>
                                <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Links */}
                          <div className="p-2 space-y-0.5">
                            {([
                              { to: '/ai', icon: <Sparkles className="w-4 h-4" />, label: 'TechMart AI', color: '#6C63FF', always: false, mobile: true },
                              { to: '/wishlist', icon: <Heart className="w-4 h-4" />, label: t('nav.wishlist'), always: false, mobile: true },
                              { to: '/profile', icon: <User className="w-4 h-4" />, label: t('nav.profile'), always: true },
                              { to: '/orders', icon: <ShoppingCart className="w-4 h-4" />, label: t('nav.orders'), always: true },
                              ...(user.role === 'admin' ? [{ to: '/admin', icon: <LayoutDashboard className="w-4 h-4" />, label: t('nav.admin'), color: '#6C63FF', always: true }] : []),
                            ] as any[]).map((item: any) => (
                              <Link key={item.to} to={item.to}
                                onClick={() => setMenuOpen(false)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--surface-1)] ${item.mobile ? 'sm:hidden' : ''}`}
                                style={{ color: item.color || 'var(--text-primary)' }}>
                                {item.icon} {item.label}
                              </Link>
                            ))}

                            <div className="h-px mx-1" style={{ background: 'var(--border)' }} />

                            <button onClick={handleLogout}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-colors hover:bg-red-50 text-red-500">
                              <LogOut className="w-4 h-4" /> Гарах
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/login"
                  className="ml-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
                    boxShadow: '0 2px 12px rgba(108,99,255,0.4)',
                  }}>
                  Нэвтрэх
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
