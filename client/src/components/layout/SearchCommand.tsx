import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, TrendingUp, ArrowRight, Tag, Sparkles, ArrowUpRight, Hash } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../../api';
import { formatPrice, effectivePrice, imgUrl } from '../../utils';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SearchCommandProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  laptops: '💻', phones: '📱', tablets: '📟', monitors: '🖥️',
  keyboards: '⌨️', mice: '🖱️', earbuds: '🎧', headphones: '🎧',
  smartwatches: '⌚', gpus: '🎮', storage: '💾', accessories: '📦',
};

const TRENDING_SEARCHES = [
  { label: 'iPhone 17', icon: '📱' },
  { label: 'MacBook', icon: '💻' },
  { label: 'AirPods', icon: '🎧' },
  { label: 'Galaxy S26', icon: '📱' },
  { label: 'Gaming mouse', icon: '🖱️' },
  { label: '4K Monitor', icon: '🖥️' },
];

const QUICK_CATEGORIES = [
  { label: 'Зөөврийн компьютер', slug: 'laptops', icon: '💻' },
  { label: 'Утас', slug: 'phones', icon: '📱' },
  { label: 'Чихэвч', slug: 'earbuds', icon: '🎧' },
  { label: 'Тоглоом', slug: 'gpus', icon: '🎮' },
  { label: 'Монитор', slug: 'monitors', icon: '🖥️' },
  { label: 'Хямдрал', slug: null, icon: '🔥', link: '/shop?onSale=true' },
];

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

// ── Recent searches — localStorage ────────────────────────────────────────────
function useRecentSearches() {
  const KEY = 'techmart_recent_searches';
  const [recents, setRecents] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });

  const add = useCallback((q: string) => {
    if (!q.trim()) return;
    setRecents(prev => {
      const next = [q, ...prev.filter(r => r !== q)].slice(0, 8);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const remove = useCallback((q: string) => {
    setRecents(prev => {
      const next = prev.filter(r => r !== q);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setRecents([]);
  }, []);

  return { recents, add, remove, clear };
}

// ── Highlight matched text ─────────────────────────────────────────────────────
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="text-brand-primary font-bold" style={{ background: 'transparent' }}>{part}</mark>
          : part
      )}
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function SearchCommand({ open, onClose }: SearchCommandProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(-1);
  const { recents, add, remove, clear } = useRecentSearches();
  const debouncedQuery = useDebounce(query, 220);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelected(-1);
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Search query
  const { data, isFetching } = useQuery({
    queryKey: ['search-command', debouncedQuery],
    queryFn: () => productsApi.list({ q: debouncedQuery, limit: 6 }),
    enabled: debouncedQuery.length >= 1,
    staleTime: 30_000,
  });

  const results = data?.data ?? [];
  const hasQuery = query.length > 0;
  const showResults = hasQuery && results.length > 0;
  const showEmpty = hasQuery && !isFetching && results.length === 0 && debouncedQuery === query;

  const goTo = (path: string, q?: string) => {
    if (q) add(q);
    navigate(path);
    onClose();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    add(query);
    navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
    onClose();
  };

  // Keyboard navigation
  const totalItems = showResults ? results.length + (hasQuery ? 1 : 0) : 0;
  useEffect(() => { setSelected(-1); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, totalItems - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, -1));
    } else if (e.key === 'Enter' && selected >= 0) {
      e.preventDefault();
      if (selected < results.length) {
        goTo(`/products/${results[selected].slug}`, query);
      } else {
        handleSubmit();
      }
    }
  };

  // Scroll selected into view
  useEffect(() => {
    if (selected < 0 || !listRef.current) return;
    const el = listRef.current.querySelectorAll('[data-result-item]')[selected] as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[90]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 -translate-x-1/2 z-[91] w-full"
            style={{ top: '5vh', maxWidth: 680, padding: '0 16px' }}>

            <div className="rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--border)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(108,99,255,0.15)',
              }}>

              {/* Search input row */}
              <form onSubmit={handleSubmit}>
                <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6C63FF22, #a855f722)' }}>
                    {isFetching
                      ? <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                      : <Search className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                    }
                  </div>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Бараа, ангилал, брэнд хайх..."
                    className="flex-1 bg-transparent outline-none text-base font-medium placeholder:font-normal"
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: 15,
                    }}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {query && (
                      <button type="button" onClick={() => setQuery('')}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: 'var(--surface-2)' }}>
                        <X className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                      </button>
                    )}
                    <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-mono border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)', background: 'var(--surface-1)' }}>
                      ESC
                    </kbd>
                  </div>
                </div>
              </form>

              {/* Content */}
              <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: 'min(70vh, 520px)' }}>

                {/* ── No query: Recent + Trending + Categories ── */}
                {!hasQuery && (
                  <div className="p-3 space-y-4">

                    {/* Recent searches */}
                    {recents.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-2 mb-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                            style={{ color: 'var(--text-tertiary)' }}>
                            <Clock className="w-3.5 h-3.5" /> Сүүлийн хайлт
                          </span>
                          <button onClick={clear} className="text-xs hover:underline" style={{ color: 'var(--text-tertiary)' }}>
                            Цэвэрлэх
                          </button>
                        </div>
                        <div className="space-y-0.5">
                          {recents.map((r, i) => (
                            <motion.div key={r}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl group cursor-pointer transition-all"
                              style={{ '&:hover': { background: 'var(--surface-1)' } } as any}
                              onClick={() => goTo(`/shop?q=${encodeURIComponent(r)}`, r)}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                              <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{r}</span>
                              <button
                                onClick={e => { e.stopPropagation(); remove(r); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-[var(--surface-2)]">
                                <X className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
                              </button>
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-tertiary)' }} />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trending */}
                    <div>
                      <div className="flex items-center gap-1.5 px-2 mb-1.5">
                        <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--brand-primary)' }} />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                          Их хайгдаж байна
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 px-2">
                        {TRENDING_SEARCHES.map((t, i) => (
                          <motion.button
                            key={t.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => { setQuery(t.label); inputRef.current?.focus(); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5"
                            style={{
                              background: 'var(--surface-1)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border)',
                            }}>
                            <span>{t.icon}</span> {t.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Quick categories */}
                    <div>
                      <div className="flex items-center gap-1.5 px-2 mb-1.5">
                        <Hash className="w-3.5 h-3.5" style={{ color: 'var(--brand-primary)' }} />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                          Ангилал
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 px-1">
                        {QUICK_CATEGORIES.map((c, i) => (
                          <motion.button
                            key={c.label}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => goTo(c.link || `/shop?category=${c.slug}`)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all hover:-translate-y-0.5 hover:shadow-sm"
                            style={{
                              background: 'var(--surface-1)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border)',
                            }}>
                            <span className="text-lg">{c.icon}</span>
                            <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Has query: Results ── */}
                {hasQuery && (
                  <div className="p-2">
                    {/* Loading shimmer */}
                    {isFetching && results.length === 0 && (
                      <div className="space-y-2 p-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                            <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="skeleton h-3 rounded w-3/4" />
                              <div className="skeleton h-3 rounded w-1/3" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Results list */}
                    {showResults && (
                      <>
                        <div className="px-3 py-1.5">
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                            Бүтээгдэхүүн
                          </span>
                        </div>
                        {results.map((p, i) => {
                          const price = effectivePrice(p.price, p.sale_price);
                          const isSelected = selected === i;
                          return (
                            <motion.div
                              key={p.id}
                              data-result-item
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              onClick={() => goTo(`/products/${p.slug}`, query)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                              style={{
                                background: isSelected ? 'rgba(108,99,255,0.1)' : 'transparent',
                                border: `1px solid ${isSelected ? 'rgba(108,99,255,0.3)' : 'transparent'}`,
                              }}
                              onMouseEnter={e => {
                                setSelected(i);
                                (e.currentTarget as HTMLElement).style.background = 'rgba(108,99,255,0.08)';
                              }}
                              onMouseLeave={e => {
                                if (selected !== i) (e.currentTarget as HTMLElement).style.background = 'transparent';
                              }}>

                              {/* Image */}
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                                style={{ background: 'var(--surface-2)' }}>
                                {p.image_url
                                  ? <img src={imgUrl(p.image_url)} alt={p.name} className="w-11 h-11 object-contain" />
                                  : <span className="text-xl">{CATEGORY_ICONS[p.category_slug || ''] || '📦'}</span>}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                  <Highlight text={p.name} query={query} />
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {p.category_slug && (
                                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
                                      {CATEGORY_ICONS[p.category_slug] || '📦'} {p.category_slug}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Price */}
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-brand-primary">{formatPrice(price)}</p>
                                {p.sale_price && (
                                  <p className="text-xs line-through" style={{ color: 'var(--text-tertiary)' }}>
                                    {formatPrice(Number(p.price))}
                                  </p>
                                )}
                              </div>

                              <ArrowUpRight className="w-4 h-4 flex-shrink-0 transition-transform"
                                style={{ color: isSelected ? 'var(--brand-primary)' : 'var(--text-tertiary)', transform: isSelected ? 'translate(1px,-1px)' : 'none' }} />
                            </motion.div>
                          );
                        })}

                        {/* See all results */}
                        <motion.div
                          data-result-item
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: results.length * 0.04 }}
                          onClick={handleSubmit}
                          className="flex items-center justify-between px-3 py-3 mt-1 rounded-xl cursor-pointer transition-all mx-1"
                          style={{
                            background: selected === results.length ? 'rgba(108,99,255,0.1)' : 'var(--surface-1)',
                            border: `1px solid ${selected === results.length ? 'rgba(108,99,255,0.3)' : 'transparent'}`,
                          }}
                          onMouseEnter={() => setSelected(results.length)}>
                          <div className="flex items-center gap-2">
                            <Search className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                              "<span style={{ color: 'var(--brand-primary)' }}>{query}</span>" хайлтын бүх үр дүн
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                        </motion.div>
                      </>
                    )}

                    {/* Empty state */}
                    {showEmpty && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-12 px-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                          style={{ background: 'var(--surface-1)' }}>
                          <Search className="w-7 h-7" style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                        <p className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                          "{query}" олдсонгүй
                        </p>
                        <p className="text-xs mb-5" style={{ color: 'var(--text-tertiary)' }}>
                          Өөр үгээр хайж үзнэ үү
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {TRENDING_SEARCHES.slice(0, 4).map(t => (
                            <button key={t.label}
                              onClick={() => setQuery(t.label)}
                              className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
                              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface-1)' }}>
                              {t.icon} {t.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>↑↓</kbd>
                    Сонгох
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>↵</kbd>
                    Нэвтрэх
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>ESC</kbd>
                    Хаах
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <Sparkles className="w-3 h-3 text-brand-primary" />
                  TechMart Search
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
