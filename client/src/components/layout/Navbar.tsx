import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, Search, Sun, Moon, LogOut,
         LayoutDashboard, User, X, Sparkles, Menu } from 'lucide-react';
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
  const [searchOpen, setSearchOpen] = useState(false);
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
      setSearchOpen(false);
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
    <>
      <nav
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? theme === 'dark'
              ? 'rgba(10,10,15,0.92)'
              : 'rgba(250,250,247,0.92)'
            : 'var(--bg)',
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
          borderBottom: `0.5px solid ${scrolled ? 'var(--line-strong)' : 'transparent'}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-5">
          <div className="flex items-center h-14 gap-3">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ background: theme === 'dark' ? 'var(--lime)' : 'var(--ink)' }}
              >
                <span
                  className="font-semibold text-xs"
                  style={{ color: theme === 'dark' ? 'var(--ink)' : 'var(--bg)', fontFamily: "'DM Mono', monospace" }}
                >T</span>
              </div>
              <span className="hidden sm:block font-medium text-sm tracking-tight" style={{ color: 'var(--ink)', fontFamily: "'DM Sans', sans-serif" }}>
                TechMart
              </span>
            </Link>

            {/* Search — desktop */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xs mx-auto hidden md:flex">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--ink-4)' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Бүтээгдэхүүн хайх..."
                  className="input pl-9 py-2 text-sm"
                  style={{ borderRadius: '10px', fontSize: '13px' }}
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 press">
                    <X className="w-3.5 h-3.5" style={{ color: 'var(--ink-4)' }} />
                  </button>
                )}
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1 ml-auto">

              {/* Search — mobile */}
              <button onClick={() => setSearchOpen(true)}
                className="btn-ghost btn-sm p-2 md:hidden press rounded-lg">
                <Search className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
              </button>

              {/* AI pill */}
              <Link to="/ai" className="relative flex-shrink-0">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.93 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium relative overflow-hidden"
                  style={{
                    background: theme === 'dark' ? 'var(--lime)' : 'var(--ink)',
                    color: theme === 'dark' ? 'var(--ink)' : 'var(--lime)',
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: '-0.01em',
                  }}
                >
                  {/* Ping ring */}
                  <span className="absolute inset-0 rounded-full animate-ping opacity-20"
                    style={{ background: theme === 'dark' ? 'var(--lime)' : 'var(--ink)' }} />
                  <Sparkles className="w-3 h-3 relative z-10" />
                  <span className="relative z-10">AI</span>
                </motion.div>
              </Link>

              {/* Dark mode */}
              <motion.button
                onClick={toggleTheme}
                whileTap={{ scale: 0.88, rotate: 15 }}
                className="btn-ghost p-2 rounded-lg"
              >
                {theme === 'dark'
                  ? <Sun className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
                  : <Moon className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />}
              </motion.button>

              {/* Wishlist */}
              <Link to="/wishlist" className="btn-ghost p-2 rounded-lg press hidden sm:flex">
                <Heart className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
              </Link>

              {/* Cart */}
              <motion.button
                onClick={openCart}
                whileTap={{ scale: 0.88 }}
                className="btn-ghost p-2 rounded-lg relative"
              >
                <ShoppingCart className="w-4 h-4" style={{ color: 'var(--ink-3)' }} />
                <AnimatePresence>
                  {count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-white text-[9px] font-bold rounded-full"
                      style={{
                        background: theme === 'dark' ? 'var(--lime)' : 'var(--ink)',
                        color: theme === 'dark' ? 'var(--ink)' : 'var(--bg)',
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
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
                    className="w-7 h-7 rounded-full flex items-center justify-center ml-1 transition-all"
                    style={{
                      background: theme === 'dark' ? 'rgba(200,255,87,0.12)' : 'var(--bg-2)',
                      border: menuOpen ? `1.5px solid ${theme === 'dark' ? 'var(--lime)' : 'var(--ink)'}` : '1.5px solid transparent',
                    }}
                  >
                    <span className="text-xs font-semibold tracking-tight"
                      style={{
                        color: theme === 'dark' ? 'var(--lime)' : 'var(--ink)',
                        fontFamily: "'DM Mono', monospace",
                      }}>
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
                          className="absolute right-0 top-9 w-52 z-50 card py-1"
                          style={{ transformOrigin: 'top right' }}
                        >
                          <div className="px-3.5 py-2.5 border-b" style={{ borderColor: 'var(--line)' }}>
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--ink)' }}>{user.full_name}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--ink-3)', fontFamily: "'DM Mono', monospace" }}>{user.email}</p>
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

                          <div className="border-t my-1" style={{ borderColor: 'var(--line)' }} />
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
                    className="flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium ml-1"
                    style={{
                      background: 'var(--bg-2)',
                      color: 'var(--ink)',
                      border: '0.5px solid var(--line-strong)',
                      fontFamily: "'DM Sans', sans-serif",
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

      {/* Mobile search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start pt-4 px-4 md:hidden"
            style={{ background: 'rgba(10,10,15,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) setSearchOpen(false); }}
          >
            <motion.form
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              onSubmit={handleSearch}
              className="w-full flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--ink-4)' }} />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Бүтээгдэхүүн хайх..."
                  className="input pl-10 py-3 text-sm w-full"
                  style={{ borderRadius: '12px', fontSize: '15px' }}
                />
              </div>
              <button type="button" onClick={() => setSearchOpen(false)}
                className="btn btn-secondary px-4" style={{ borderRadius: '12px' }}>
                Болих
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
