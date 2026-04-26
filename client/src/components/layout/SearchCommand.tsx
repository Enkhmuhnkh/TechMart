import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, TrendingUp, ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../../api';
import { formatPrice, effectivePrice, imgUrl } from '../../utils';

interface SearchCommandProps {
  open: boolean;
  onClose: () => void;
}

const TRENDING = [
  'iPhone 17', 'MacBook Pro', 'AirPods Pro',
  'Galaxy S26 Ultra', 'Gaming mouse', '4K Monitor',
];

const QUICK_CATS = [
  { label: 'Зөөврийн компьютер', slug: 'laptops',  color: '#6C63FF' },
  { label: 'Утас',               slug: 'phones',   color: '#00D4AA' },
  { label: 'Чихэвч',             slug: 'earbuds',  color: '#EC4899' },
  { label: 'Тоглоом',            slug: 'gpus',     color: '#F97316' },
  { label: 'Монитор',            slug: 'monitors', color: '#8B5CF6' },
  { label: 'Хямдрал',            slug: null,       color: '#EF4444', link: '/shop?onSale=true', badge: 'SALE' },
];

function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

function useRecentSearches() {
  const KEY = 'techmart_recent';
  const [recents, setRecents] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });
  const add = useCallback((q: string) => {
    if (!q.trim()) return;
    setRecents(prev => {
      const next = [q, ...prev.filter(r => r !== q)].slice(0, 6);
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
  const clear = useCallback(() => { localStorage.removeItem(KEY); setRecents([]); }, []);
  return { recents, add, remove, clear };
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} style={{ background: 'transparent', color: '#6C63FF', fontWeight: 700 }}>{part}</mark>
          : part
      )}
    </>
  );
}

export function SearchCommand({ open, onClose }: SearchCommandProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(-1);
  const { recents, add, remove, clear } = useRecentSearches();
  const dq = useDebounce(query, 200);

  useEffect(() => {
    if (open) { setQuery(''); setSelected(-1); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const { data, isFetching } = useQuery({
    queryKey: ['search-cmd', dq],
    queryFn: () => productsApi.list({ q: dq, limit: 6 }),
    enabled: dq.length >= 1,
    staleTime: 30_000,
  });

  const results = data?.data ?? [];
  const hasQuery = query.length > 0;
  const showResults = hasQuery && results.length > 0;
  const showEmpty = hasQuery && !isFetching && results.length === 0 && dq === query;

  const goTo = useCallback((path: string, q?: string) => {
    if (q) add(q);
    navigate(path);
    setQuery('');
    setTimeout(() => onClose(), 150);
  }, [add, onClose, navigate]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    goTo(`/shop?q=${encodeURIComponent(query.trim())}`, query);
  }, [query, goTo]);

  const totalItems = showResults ? results.length + 1 : 0;
  useEffect(() => { setSelected(-1); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, totalItems - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, -1)); }
    else if (e.key === 'Enter' && selected >= 0) {
      e.preventDefault();
      if (selected < results.length) goTo(`/products/${results[selected].slug}`, query);
      else handleSubmit();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
            onClick={onClose}
          />

          {/* ── Panel wrapper ── */}
          <div className="fixed inset-0 z-[91] flex flex-col md:items-center"
            style={{ pointerEvents: 'none' }}>

            {/* Mobile: slide up from bottom. Desktop: drop from top center */}
            <motion.div
              initial={{
                opacity: 0,
                y: typeof window !== 'undefined' && window.innerWidth < 768 ? 60 : -32,
                scale: 0.95,
              }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: typeof window !== 'undefined' && window.innerWidth < 768 ? 60 : -20,
                scale: 0.96,
              }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col w-full overflow-hidden"
              style={{
                pointerEvents: 'all',
                // Mobile: full screen
                flex: '1 1 auto',
                background: 'var(--surface-0)',
                // Desktop overrides via media class below
              }}>

              <style>{`
                @media (min-width: 768px) {
                  .sp-panel {
                    flex: none !important;
                    margin-top: 6vh;
                    max-height: 76vh;
                    border-radius: 24px !important;
                    max-width: 640px;
                    width: 100%;
                    margin-left: auto;
                    margin-right: auto;
                    overflow: hidden;
                    box-shadow:
                      0 0 0 1px rgba(108,99,255,0.14),
                      0 24px 60px rgba(0,0,0,0.3),
                      0 4px 16px rgba(0,0,0,0.2) !important;
                  }
                }
              `}</style>

              <div className="sp-panel flex flex-col flex-1 overflow-hidden"
                style={{ background: 'var(--surface-0)', padding: '0 16px' }}>

                {/* ── Search input ── */}
                <form onSubmit={handleSubmit} style={{ flexShrink: 0 }}>
                  <div className="flex items-center gap-3 py-4 border-b"
                    style={{ borderColor: 'var(--border)' }}>

                    {/* Icon */}
                    <motion.div
                      animate={{ rotate: isFetching ? 360 : 0 }}
                      transition={{ duration: isFetching ? 0.8 : 0, repeat: isFetching ? Infinity : 0, ease: 'linear' }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(108,99,255,0.12)' }}>
                      <Search className="w-4 h-4" style={{ color: '#6C63FF' }} />
                    </motion.div>

                    <input
                      ref={inputRef}
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Бараа, ангилал хайх..."
                      className="flex-1 bg-transparent outline-none"
                      style={{
                        color: 'var(--text-primary)',
                        fontSize: 16,
                        fontWeight: 500,
                        minWidth: 0,
                      }}
                      autoComplete="off" autoCorrect="off" spellCheck={false} inputMode="search"
                    />

                    <AnimatePresence mode="wait">
                      {query ? (
                        <motion.button
                          key="clear"
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                          type="button"
                          onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--surface-2)' }}>
                          <X className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                        </motion.button>
                      ) : (
                        <motion.button
                          key="close"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          type="button" onClick={onClose}
                          className="px-3 py-1.5 rounded-xl text-sm font-semibold flex-shrink-0 border"
                          style={{
                            borderColor: 'var(--border)',
                            color: 'var(--text-secondary)',
                            background: 'var(--surface-1)',
                          }}>
                          Хаах
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </form>

                {/* ── Scrollable body ── */}
                <div className="flex-1 overflow-y-auto overscroll-contain" style={{ padding: '8px 0' }}>
                  <AnimatePresence mode="wait">

                    {/* ── No query state ── */}
                    {!hasQuery && (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        style={{ paddingBottom: 40 }}>

                        {/* Recents */}
                        {recents.length > 0 && (
                          <div style={{ marginBottom: 24 }}>
                            <div className="flex items-center justify-between px-1 mb-2">
                              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"
                                style={{ color: 'var(--text-tertiary)' }}>
                                <Clock className="w-3 h-3" /> Сүүлийн хайлт
                              </span>
                              <button onClick={clear} className="text-xs hover:underline"
                                style={{ color: 'var(--text-tertiary)' }}>
                                Устгах
                              </button>
                            </div>
                            {recents.map(r => (
                              <div key={r}
                                onClick={() => goTo(`/shop?q=${encodeURIComponent(r)}`, r)}
                                className="flex items-center gap-3 px-2 py-2.5 rounded-xl cursor-pointer transition-colors group"
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <Clock className="w-3.5 h-3.5 flex-shrink-0 opacity-40" style={{ color: 'var(--text-primary)' }} />
                                <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{r}</span>
                                <button onClick={e => { e.stopPropagation(); remove(r); }}
                                  className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity p-1 rounded-lg"
                                  style={{ color: 'var(--text-primary)' }}>
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Trending */}
                        <div style={{ marginBottom: 24 }}>
                          <div className="flex items-center gap-1.5 px-1 mb-3">
                            <TrendingUp className="w-3.5 h-3.5" style={{ color: '#6C63FF' }} />
                            <span className="text-xs font-bold uppercase tracking-widest"
                              style={{ color: 'var(--text-tertiary)' }}>
                              Их хайгдаж байна
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 px-1">
                            {TRENDING.map((t, i) => (
                              <motion.button
                                key={t}
                                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => { setQuery(t); inputRef.current?.focus(); }}
                                className="px-3.5 py-2 rounded-2xl text-sm font-medium transition-all active:scale-95 border"
                                style={{
                                  background: 'var(--surface-1)',
                                  borderColor: 'transparent',
                                  color: 'var(--text-secondary)',
                                }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(108,99,255,0.3)';
                                  (e.currentTarget as HTMLElement).style.color = '#6C63FF';
                                  (e.currentTarget as HTMLElement).style.background = 'rgba(108,99,255,0.06)';
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                                  (e.currentTarget as HTMLElement).style.background = 'var(--surface-1)';
                                }}>
                                {t}
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* Categories */}
                        <div>
                          <div className="px-1 mb-3">
                            <span className="text-xs font-bold uppercase tracking-widest"
                              style={{ color: 'var(--text-tertiary)' }}>
                              # Ангилал
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {QUICK_CATS.map((c, i) => (
                              <motion.button
                                key={c.label}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => goTo(c.link || `/shop?category=${c.slug}`)}
                                className="flex items-center justify-between px-4 py-3.5 rounded-2xl border text-left transition-all active:scale-[0.97] group"
                                style={{
                                  background: 'var(--surface-1)',
                                  borderColor: 'transparent',
                                }}
                                onMouseEnter={e => {
                                  const el = e.currentTarget;
                                  el.style.background = c.color + '10';
                                  el.style.borderColor = c.color + '30';
                                }}
                                onMouseLeave={e => {
                                  const el = e.currentTarget;
                                  el.style.background = 'var(--surface-1)';
                                  el.style.borderColor = 'transparent';
                                }}>
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-1.5 h-5 rounded-full flex-shrink-0"
                                    style={{ background: c.color + '80' }} />
                                  <span className="text-sm font-semibold truncate"
                                    style={{ color: 'var(--text-primary)' }}>
                                    {c.label}
                                  </span>
                                  {c.badge && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                                      style={{ background: c.color }}>
                                      {c.badge}
                                    </span>
                                  )}
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-30 group-hover:opacity-80 transition-opacity"
                                  style={{ color: c.color }} />
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* ── Results ── */}
                    {hasQuery && (
                      <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        style={{ paddingBottom: 40 }}>

                        {/* Skeleton */}
                        {isFetching && results.length === 0 && (
                          <div style={{ padding: '4px 0' }}>
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div key={i} className="flex items-center gap-3 px-2 py-3">
                                <div className="skeleton w-14 h-14 rounded-xl flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                  <div className="skeleton h-3.5 rounded w-3/4" />
                                  <div className="skeleton h-3 rounded w-1/3" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Product list */}
                        {showResults && (
                          <>
                            <div className="px-2 pt-2 pb-2">
                              <span className="text-xs font-bold uppercase tracking-widest"
                                style={{ color: 'var(--text-tertiary)' }}>
                                Бүтээгдэхүүн
                              </span>
                            </div>

                            {results.map((p, i) => {
                              const price = effectivePrice(p.price, p.sale_price);
                              const isSel = selected === i;
                              return (
                                <motion.div
                                  key={p.id}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.04, duration: 0.2 }}
                                  onClick={() => goTo(`/products/${p.slug}`, query)}
                                  className="flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all active:scale-[0.98]"
                                  style={{
                                    background: isSel ? 'rgba(108,99,255,0.08)' : 'transparent',
                                    border: `1px solid ${isSel ? 'rgba(108,99,255,0.18)' : 'transparent'}`,
                                  }}
                                  onMouseEnter={() => setSelected(i)}
                                  onMouseLeave={() => setSelected(-1)}>

                                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                                    style={{ background: 'var(--surface-1)' }}>
                                    {p.image_url
                                      ? <img src={imgUrl(p.image_url)} alt={p.name} className="w-12 h-12 object-contain" />
                                      : <div className="w-8 h-8 rounded-lg" style={{ background: 'rgba(108,99,255,0.15)' }} />}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                                      <Highlight text={p.name} query={query} />
                                    </p>
                                    {p.brand_name && (
                                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                        {p.brand_name}
                                      </p>
                                    )}
                                  </div>

                                  <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-bold" style={{ color: '#6C63FF' }}>
                                      {formatPrice(price)}
                                    </p>
                                    {p.sale_price && (
                                      <p className="text-xs line-through" style={{ color: 'var(--text-tertiary)' }}>
                                        {formatPrice(Number(p.price))}
                                      </p>
                                    )}
                                  </div>

                                  <motion.div
                                    animate={{ x: isSel ? 2 : 0, opacity: isSel ? 1 : 0.25 }}
                                    transition={{ duration: 0.15 }}>
                                    <ChevronRight className="w-4 h-4" style={{ color: '#6C63FF' }} />
                                  </motion.div>
                                </motion.div>
                              );
                            })}

                            {/* See all */}
                            <motion.div
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: results.length * 0.04 }}
                              onClick={handleSubmit}
                              className="flex items-center justify-between mx-1 mt-2 px-4 py-3.5 rounded-2xl cursor-pointer active:scale-[0.98] transition-all"
                              style={{ background: 'var(--surface-1)' }}
                              onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(108,99,255,0.08)';
                              }}
                              onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.background = 'var(--surface-1)';
                              }}>
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                  style={{ background: 'rgba(108,99,255,0.12)' }}>
                                  <Search className="w-3.5 h-3.5" style={{ color: '#6C63FF' }} />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    Бүх үр дүн харах
                                  </p>
                                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    "{query}" хайлт
                                  </p>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4" style={{ color: '#6C63FF' }} />
                            </motion.div>
                          </>
                        )}

                        {/* Empty */}
                        {showEmpty && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-16 px-6">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                              style={{ background: 'var(--surface-1)' }}>
                              <Search className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
                            </div>
                            <p className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
                              "{query}" олдсонгүй
                            </p>
                            <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
                              Өөр үгээр хайж үзнэ үү
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {TRENDING.slice(0, 4).map(t => (
                                <button key={t}
                                  onClick={() => { setQuery(t); inputRef.current?.focus(); }}
                                  className="px-4 py-2 rounded-2xl text-sm font-medium border transition-all"
                                  style={{
                                    borderColor: 'var(--border)',
                                    color: 'var(--text-secondary)',
                                    background: 'var(--surface-1)',
                                  }}>
                                  {t}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Footer (desktop only) ── */}
                <div className="hidden md:flex items-center justify-between py-3 border-t flex-shrink-0"
                  style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {[['↑↓', 'Сонгох'], ['↵', 'Нэвтрэх'], ['ESC', 'Хаах']].map(([k, l]) => (
                      <span key={k} className="flex items-center gap-1.5">
                        <kbd className="px-1.5 py-0.5 rounded-md text-[10px] font-mono border"
                          style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--text-secondary)' }}>
                          {k}
                        </kbd>
                        <span>{l}</span>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#6C63FF' }}>
                    <Sparkles className="w-3 h-3" /> TechMart Search
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
