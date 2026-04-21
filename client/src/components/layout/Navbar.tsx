import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Heart, Search, Sun, Moon, User, LayoutDashboard, LogOut, X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore, useCartStore, useUIStore } from '../../store';
import { authApi } from '../../api';
import toast from 'react-hot-toast';

export function Navbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount, openCart } = useCartStore();
  const { theme, toggleTheme, language, setLanguage } = useUIStore();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const count = itemCount();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/shop?q=${encodeURIComponent(search.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    toast.success(t('auth.logoutSuccess'));
    navigate('/');
    setMenuOpen(false);
  };

  const toggleLang = () => {
    const next = language === 'en' ? 'mn' : 'en';
    setLanguage(next);
    i18n.changeLanguage(next);
  };

  return (
    <nav className="sticky top-0 z-50 border-b backdrop-blur-md bg-[var(--surface-0)]/95"
         style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-2 sm:gap-3">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-display font-bold text-sm">T</span>
            </div>
            <span className="font-display font-bold text-lg hidden sm:block" style={{ color: 'var(--text-primary)' }}>
              TechMart
            </span>
          </Link>

          {/* Search desktop */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-auto hidden md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('shop.search')} className="input pl-10 py-2 text-sm rounded-xl w-full" />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                </button>
              )}
            </div>
          </form>

          {/* Search mobile overlay */}
          {searchOpen && (
            <div className="absolute inset-0 z-50 flex items-center px-4 md:hidden" style={{ background: 'var(--surface-0)' }}>
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                  <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={t('shop.search')} className="input pl-10 py-2 text-sm rounded-xl w-full" />
                </div>
                <button type="button" onClick={() => setSearchOpen(false)} className="btn-ghost rounded-xl px-3 text-sm">
                  {t('common.cancel')}
                </button>
              </form>
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">

            {/* Search mobile */}
            <button onClick={() => setSearchOpen(true)} className="btn-ghost rounded-xl p-2 md:hidden">
              <Search className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            </button>

            {/* ✨ AI Button - Prominent, always visible */}
            <Link to="/ai" className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)', color: 'white', boxShadow: '0 0 14px rgba(108,99,255,0.45)' }}>
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden xs:block sm:block">AI</span>
            </Link>

            {/* Language */}
            <button onClick={toggleLang}
              className="rounded-lg px-2 py-1.5 text-xs font-semibold border transition-colors hover:border-brand-primary hover:text-brand-primary hidden sm:flex items-center"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              {language === 'en' ? '🇲🇳 MN' : '🇬🇧 EN'}
            </button>

            {/* Dark mode */}
            <button onClick={toggleTheme} className="btn-ghost rounded-xl p-2">
              {theme === 'dark'
                ? <Sun className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                : <Moon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />}
            </button>

            {/* Wishlist */}
            <Link to="/wishlist" className="btn-ghost rounded-xl p-2 hidden sm:flex">
              <Heart className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            </Link>

            {/* Cart */}
            <button onClick={openCart} className="btn-ghost rounded-xl p-2 relative">
              <ShoppingCart className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>

            {/* User / Login */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)}
                  className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center ml-1 hover:bg-brand-primary/20 transition-colors">
                  <span className="text-brand-primary text-sm font-semibold">
                    {user.full_name[0].toUpperCase()}
                  </span>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-10 w-52 card py-1 z-50 shadow-modal">
                      <div className="px-3 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.full_name}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{user.email}</p>
                      </div>
                      <Link to="/ai" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--surface-1)] transition-colors sm:hidden"
                        style={{ color: '#6C63FF' }}>
                        <Sparkles className="w-4 h-4" /> TechMart AI
                      </Link>
                      <Link to="/wishlist" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--surface-1)] transition-colors sm:hidden"
                        style={{ color: 'var(--text-primary)' }}>
                        <Heart className="w-4 h-4" /> {t('nav.wishlist')}
                      </Link>
                      <Link to="/profile" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--surface-1)] transition-colors"
                        style={{ color: 'var(--text-primary)' }}>
                        <User className="w-4 h-4" /> {t('nav.profile')}
                      </Link>
                      <Link to="/orders" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--surface-1)] transition-colors"
                        style={{ color: 'var(--text-primary)' }}>
                        <ShoppingCart className="w-4 h-4" /> {t('nav.orders')}
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-[var(--surface-1)] transition-colors text-brand-primary">
                          <LayoutDashboard className="w-4 h-4" /> {t('nav.admin')}
                        </Link>
                      )}
                      <div className="border-t my-1" style={{ borderColor: 'var(--border)' }} />
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm w-full text-left hover:bg-[var(--surface-1)] transition-colors text-red-500">
                        <LogOut className="w-4 h-4" /> {t('nav.logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary btn-sm ml-1 text-xs sm:text-sm px-2 sm:px-4 flex-shrink-0">
                {t('nav.login')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
