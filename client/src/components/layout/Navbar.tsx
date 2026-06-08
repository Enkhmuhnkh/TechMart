import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, Search, Sun, Moon, LogOut,
         LayoutDashboard, User, Sparkles, Command } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useCartStore, useUIStore } from '../../store';
import { authApi } from '../../api';
import { SearchCommand } from './SearchCommand';
import toast from 'react-hot-toast';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount, openCart } = useCartStore();
  const { theme, toggleTheme } = useUIStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const count = itemCount();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(s => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    toast.success('Гарлаа');
    navigate('/');
    setMenuOpen(false);
  };

  // Header background — body-оос ялгарах
  const navBg = theme === 'dark'
    ? scrolled ? 'rgba(14,14,20,0.96)' : '#111116'
    : scrolled ? 'rgba(248,247,244,0.96)' : '#EDEDEA';

  return (
    <>
    <nav
      className="sticky top-0 z-50 transition-all duration-200"
      style={{
        background: navBg,
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: `0.5px solid var(--line-strong)`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Single row — flex-nowrap, no wrap */}
        <div className="flex items-center h-14 gap-2 flex-nowrap">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)' }}
            >
              <span className="font-semibold text-xs text-white"
                style={{ fontFamily: "'DM Mono', monospace" }}>T</span>
            </motion.div>
            <span className="hidden sm:block font-medium text-sm flex-shrink-0"
              style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              TechMart
            </span>
          </Link>

          {/* Search trigger — desktop */}
          <motion.button
            onClick={() => setSearchOpen(true)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 min-w-0 max-w-sm mx-2 hidden md:flex items-center gap-2.5 px-3 text-left transition-all"
            style={{
              height: '36px',
              borderRadius: '10px',
              background: theme === 'dark' ? 'var(--bg-3)' : 'var(--bg)',
              border: '0.5px solid var(--line-strong)',
              color: 'var(--ink-4)',
              fontSize: '13px',
            }}>
            <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--ink-4)' }} />
            <span className="flex-1 truncate" style={{ fontSize: '13px' }}>Бүтээгдэхүүн хайх...</span>
            <span className="hidden lg:flex items-center gap-0.5 flex-shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded-md"
              style={{ background: 'var(--bg-2)', border: '0.5px solid var(--line-strong)', color: 'var(--ink-4)' }}>
              <Command className="w-2.5 h-2.5" />K
            </span>
          </motion.button>

          {/* Right actions — flex-shrink-0 to stay in one row */}
          <div className="flex items-center gap-1 ml-auto flex-shrink-0">

            {/* Search mobile */}
            <motion.button
              onClick={() => setSearchOpen(true)}
              whileTap={{ scale: 0.88 }}
              className="btn-ghost p-2 rounded-lg md:hidden flex-shrink-0">
              <Search className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
            </motion.button>

            {/* AI button — purple gradient, original style */}
            <Link to="/ai" className="flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.07, boxShadow: '0 8px 24px rgba(99,102,241,0.5)' }}
                whileTap={{ scale: 0.91 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
                  color: 'white',
                  boxShadow: '0 4px 14px rgba(108,99,255,0.35)',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-xl animate-ping opacity-20"
                  style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)' }} />
                <Sparkles className="w-3 h-3 relative z-10" />
                <span className="relative z-10 hidden xs:block sm:block">AI</span>
              </motion.div>
            </Link>

            {/* Dark mode */}
            <motion.button onClick={toggleTheme}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.85, rotate: 20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="btn-ghost p-2 rounded-lg flex-shrink-0">
              {theme === 'dark'
                ? <Sun className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
                : <Moon className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />}
            </motion.button>

            {/* Wishlist — desktop */}
            <Link to="/wishlist" className="btn-ghost p-2 rounded-lg hidden sm:flex flex-shrink-0">
              <Heart className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
            </Link>

            {/* Cart */}
            <motion.button onClick={openCart} whileTap={{ scale: 0.88 }}
              className="btn-ghost p-2 rounded-lg relative flex-shrink-0">
              <ShoppingCart className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span key={count}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full"
                    style={{
                      fontSize: '9px', fontFamily: "'DM Mono', monospace", fontWeight: 600,
                      background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
                      color: 'white',
                    }}>
                    {count > 9 ? '9+' : count}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* User / Login */}
            {isAuthenticated && user ? (
              <div className="relative flex-shrink-0">
                <motion.button
                  onClick={() => setMenuOpen(!menuOpen)}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 rounded-full flex items-center justify-center ml-0.5 transition-all"
                  style={{
                    background: 'rgba(108,99,255,0.12)',
                    border: menuOpen ? '1.5px solid #6C63FF' : '1.5px solid transparent',
                  }}
                >
                  <span className="text-xs font-semibold" style={{ color: '#6C63FF', fontFamily: "'DM Mono', monospace" }}>
                    {user.full_name[0].toUpperCase()}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -8 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className="absolute right-0 top-9 w-48 z-50 card py-1"
                        style={{ transformOrigin: 'top right' }}
                      >
                        <div className="px-3.5 py-2.5 border-b" style={{ borderColor: 'var(--line)' }}>
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--ink)' }}>
                            {user.full_name}
                          </p>
                          <p className="truncate mt-0.5" style={{ fontSize: '11px', color: 'var(--ink-3)', fontFamily: "'DM Mono', monospace" }}>
                            {user.email}
                          </p>
                        </div>
                        {[
                          { to: '/profile', icon: User, label: 'Профайл' },
                          { to: '/orders', icon: ShoppingCart, label: 'Захиалгууд' },
                          { to: '/wishlist', icon: Heart, label: 'Хадгалсан' },
                          ...(user.role === 'admin' ? [{ to: '/admin', icon: LayoutDashboard, label: 'Admin' }] : []),
                        ].map(item => (
                          <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2 text-xs hover:bg-[var(--bg-2)] transition-colors"
                            style={{ color: 'var(--ink-2)' }}>
                            <item.icon className="w-3.5 h-3.5" style={{ color: 'var(--ink-3)' }} />
                            {item.label}
                          </Link>
                        ))}
                        <div className="border-t my-0.5" style={{ borderColor: 'var(--line)' }} />
                        <button onClick={handleLogout}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs w-full hover:bg-[var(--bg-2)] transition-colors"
                          style={{ color: 'var(--red)' }}>
                          <LogOut className="w-3.5 h-3.5" /> Гарах
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="flex-shrink-0 ml-0.5">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center"
                  style={{
                    background: 'var(--bg-2)', color: 'var(--ink)',
                    border: '0.5px solid var(--line-strong)',
                  }}>
                  Нэвтрэх
                </motion.div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>

    <SearchCommand open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
