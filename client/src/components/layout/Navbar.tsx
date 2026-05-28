import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, Search, Sun, Moon, LogOut,
         LayoutDashboard, User, X, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useCartStore, useUIStore } from '../../store';
import { authApi } from '../../api';
import toast from 'react-hot-toast';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount, openCart } = useCartStore();
  const { theme, toggleTheme } = useUIStore();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const count = itemCount();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/shop?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    toast.success('Гарлаа');
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? theme === 'dark' ? 'rgba(10,10,15,0.92)' : 'rgba(250,250,247,0.92)'
          : 'var(--bg)',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: `0.5px solid ${scrolled ? 'var(--line-strong)' : 'var(--line)'}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: theme === 'dark' ? 'var(--lime)' : 'var(--ink)' }}
            >
              <span className="font-semibold text-xs mono"
                style={{ color: theme === 'dark' ? 'var(--ink)' : 'var(--bg)' }}>T</span>
            </motion.div>
            <span className="hidden sm:block font-medium text-sm tracking-tight"
              style={{ color: 'var(--ink)', fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>
              TechMart
            </span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto hidden md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--ink-4)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Бүтээгдэхүүн хайх..."
                className="input pl-10 py-2.5 text-sm w-full"
                style={{ borderRadius: 'var(--r-sm)', fontSize: '13px', height: '38px' }}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5" style={{ color: 'var(--ink-4)' }} />
                </button>
              )}
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 ml-auto">

            {/* Search mobile */}
            <Link to="/shop" className="btn-ghost p-2 rounded-lg md:hidden press">
              <Search className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
            </Link>

            {/* AI button — navbar-д нэг л удаа */}
            <Link to="/ai" className="flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium overflow-hidden"
                style={{
                  background: theme === 'dark' ? 'var(--lime)' : 'var(--ink)',
                  color: theme === 'dark' ? 'var(--ink)' : 'var(--lime)',
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '-0.01em',
                }}
              >
                <span className="absolute inset-0 rounded-full animate-ping opacity-15"
                  style={{ background: theme === 'dark' ? 'var(--lime)' : 'var(--ink)' }} />
                <Sparkles className="w-3 h-3 relative z-10" />
                <span className="relative z-10 hidden sm:block">AI</span>
              </motion.div>
            </Link>

            {/* Dark mode */}
            <motion.button onClick={toggleTheme} whileTap={{ scale: 0.88, rotate: 18 }}
              className="btn-ghost p-2 rounded-lg">
              {theme === 'dark'
                ? <Sun className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
                : <Moon className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />}
            </motion.button>

            {/* Wishlist */}
            <Link to="/wishlist" className="btn-ghost p-2 rounded-lg press hidden sm:flex">
              <Heart className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
            </Link>

            {/* Cart */}
            <motion.button onClick={openCart} whileTap={{ scale: 0.88 }}
              className="btn-ghost p-2 rounded-lg relative">
              <ShoppingCart className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span key={count}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full mono"
                    style={{
                      fontSize: '9px', fontWeight: 600,
                      background: theme === 'dark' ? 'var(--lime)' : 'var(--ink)',
                      color: theme === 'dark' ? 'var(--ink)' : 'var(--bg)',
                    }}>
                    {count > 9 ? '9+' : count}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* User / Login */}
            {isAuthenticated && user ? (
              <div className="relative">
                <motion.button
                  onClick={() => setMenuOpen(!menuOpen)}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 rounded-full flex items-center justify-center ml-0.5"
                  style={{
                    background: theme === 'dark' ? 'rgba(200,255,87,0.1)' : 'var(--bg-2)',
                    border: menuOpen
                      ? `1.5px solid ${theme === 'dark' ? 'var(--lime)' : 'var(--ink)'}`
                      : '1.5px solid var(--line-strong)',
                  }}
                >
                  <span className="text-xs font-semibold mono"
                    style={{ color: theme === 'dark' ? 'var(--lime)' : 'var(--ink)' }}>
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
                          <p className="text-xs font-medium truncate tracking-tight" style={{ color: 'var(--ink)' }}>
                            {user.full_name}
                          </p>
                          <p className="mono truncate mt-0.5" style={{ fontSize: '11px', color: 'var(--ink-3)' }}>
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
                          <LogOut className="w-3.5 h-3.5" />
                          Гарах
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium ml-0.5 flex items-center"
                  style={{
                    background: 'var(--bg-2)',
                    color: 'var(--ink)',
                    border: '0.5px solid var(--line-strong)',
                  }}
                >
                  Нэвтрэх
                </motion.div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
