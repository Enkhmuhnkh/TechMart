import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, TrendingUp, ArrowRight, Sparkles, ChevronRight, Flame } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../../api';
import { formatPrice, effectivePrice, imgUrl } from '../../utils';

interface SearchCommandProps {
  open: boolean;
  onClose: () => void;
}

const TRENDING = [
  'iPhone 17', 'MacBook Pro', 'AirPods Pro',
  'Galaxy S26', 'Gaming mouse', '4K Monitor',
];

const QUICK_CATS = [
  { label: 'Зөөврийн компьютер', slug: 'laptops',  color: '#6C63FF', bg: 'rgba(108,99,255,0.08)' },
  { label: 'Утас',               slug: 'phones',   color: '#00D4AA', bg: 'rgba(0,212,170,0.08)' },
  { label: 'Чихэвч',             slug: 'earbuds',  color: '#EC4899', bg: 'rgba(236,72,153,0.08)' },
  { label: 'Тоглоом',            slug: 'gpus',     color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
  { label: 'Монитор',            slug: 'monitors', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
  { label: 'Хямдрал',            slug: null,       color: '#EF4444', bg: 'rgba(239,68,68,0.08)', link: '/shop?onSale=true' },
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
  const KEY = 'techmart_recent_searches';
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
          ? <mark key={i} className="font-bold" style={{ background: 'transparent', color: 'var(--brand-primary)' }}>{part}</mark>
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
    if (open) { setQuery(''); setSelected(-1); setTimeout(() => inputRef.current?.focus(), 80); }
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
    onClose(); setQuery('');
    setTimeout(() => navigate(path), 20);
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[90]"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 z-[91] flex flex-col"
            style={{ top: 0, bottom: 0 }}>

            {/* Inner — full mobile, floating desktop */}
            <div className="flex flex-col h-full w-full md:h-auto md:max-h-[78vh] md:my-[5vh] md:mx-auto md:px-4"
              style={{ maxWidth: 660 }}>

              <div className="flex flex-col flex-1 overflow-hidden"
                style={{
                  background: 'var(--surface-0)',
                  borderRadius: 0,
                }}>

                <style>{`
                  @media (min-width: 768px) {
                    .sp-inner {
                      border-radius: 20px !important;
                      box-shadow: 0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(108,99,255,0.15) !important;
                    }
                  }
                `}</style>

                <div className="sp-inner flex flex-col flex-1 overflow-hidden"
                  style={{ background: 'var(--surface-0)' }}>

                  {/* ── Input ── */}
                  <form onSubmit={handleSubmit} className="flex-shrink-0">
                    <div className="flex items-center gap-3 px-4 py-4 border-b"
                      style={{ borderColor: 'var(--border)' }}>

                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(108,99,255,0.1)' }}>
                        {isFetching
                          ? <div className="w-4 h-4 border-2 rounded-full animate-spin"
                              style={{ borderColor: 'rgba(108,99,255,0.25)', borderTopColor: '#6C63FF' }} />
                          : <Search className="w-4 h-4" style={{ color: '#6C63FF' }} />}
                      </div>

                      <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Бараа, ангилал хайх..."
                        className="flex-1 bg-transparent outline-none font-medium"
                        style={{ color: 'var(--text-primary)', fontSize: 16, minWidth: 0 }}
                        autoComplete="off" autoCorrect="off" spellCheck={false} inputMode="search"
                      />

                      {query ? (
                        <button type="button"
                          onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--surface-2)' }}>
                          <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                        </button>
                      ) : (
                        <button type="button" onClick={onClose}
                          className="px-3 py-1.5 rounded-xl text-sm font-semibold flex-shrink-0"
                          style={{ background: 'var(--surface-1)', color: 'var(--text-secondary)' }}>
                          Хаах
                        </button>
                      )}
                    </div>
                  </form>

                  {/* ── Body ── */}
                  <div className="flex-1 overflow-y-auto overscroll-contain">

                    {/* ── Empty state (no query) ── */}
                    {!hasQuery && (
                      <div className="p-4 space-y-6 pb-10">

                        {/* Recents */}
                        {recents.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"
                                style={{ color: 'var(--text-tertiary)' }}>
                                <Clock className="w-3.5 h-3.5" /> Сүүлийн хайлт
                              </span>
                              <button onClick={clear} className="text-xs font-medium hover:underline"
                                style={{ color: 'var(--text-tertiary)' }}>
                                Бүгдийг устгах
                              </button>
                            </div>
                            <div className="space-y-0.5">
                              {recents.map(r => (
                                <div key={r}
                                  onClick={() => goTo(`/shop?q=${encodeURIComponent(r)}`, r)}
                                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                  <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                                  <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{r}</span>
                                  <button onClick={e => { e.stopPropagation(); remove(r); }}
                                    className="p-1 rounded-lg opacity-60 hover:opacity-100"
                                    style={{ color: 'var(--text-tertiary)' }}>
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Trending */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-3">
                            <TrendingUp className="w-3.5 h-3.5" style={{ color: '#6C63FF' }} />
                            <span className="text-xs font-bold uppercase tracking-widest"
                              style={{ color: 'var(--text-tertiary)' }}>
                              Их хайгдаж байна
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {TRENDING.map((t, i) => (
                              <motion.button key={t}
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => { setQuery(t); inputRef.current?.focus(); }}
                                className="px-3.5 py-2 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5 border"
                                style={{
                                  background: 'var(--surface-0)',
                                  borderColor: 'var(--border)',
                                  color: 'var(--text-secondary)',
                                }}>
                                {t}
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* Categories */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-3">
                            <span className="text-xs font-bold uppercase tracking-widest"
                              style={{ color: 'var(--text-tertiary)' }}>
                              # Ангилал
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {QUICK_CATS.map((c, i) => (
                              <motion.button key={c.label}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => goTo(c.link || `/shop?category=${c.slug}`)}
                                className="flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-all active:scale-95 group"
                                style={{ background: 'var(--surface-0)', borderColor: 'var(--border)' }}
                                onMouseEnter={e => {
                                  const el = e.currentTarget;
                                  el.style.background = c.bg;
                                  el.style.borderColor = c.color + '40';
                                }}
                                onMouseLeave={e => {
                                  const el = e.currentTarget;
                                  el.style.background = 'var(--surface-0)';
                                  el.style.borderColor = 'var(--border)';
                                }}>
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {c.label}
                                  {c.slug === null && (
                                    <span className="ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                                      style={{ background: '#EF4444', fontSize: 10 }}>
                                      SALE
                                    </span>
                                  )}
                                </span>
                                <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-70 transition-opacity flex-shrink-0"
                                  style={{ color: c.color }} />
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Has query ── */}
                    {hasQuery && (
                      <div className="pb-10">

                        {/* Skeleton */}
                        {isFetching && results.length === 0 && (
                          <div className="p-3 space-y-1">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div key={i} className="flex items-center gap-3 p-3">
                                <div className="skeleton w-14 h-14 rounded-xl flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                  <div className="skeleton h-3.5 rounded w-3/4" />
                                  <div className="skeleton h-3 rounded w-1/3" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Results */}
                        {showResults && (
                          <>
                            <div className="px-4 pt-4 pb-1">
                              <span className="text-xs font-bold uppercase tracking-widest"
                                style={{ color: 'var(--text-tertiary)' }}>
                                Бүтээгдэхүүн
                              </span>
                            </div>

                            {results.map((p, i) => {
                              const price = effectivePrice(p.price, p.sale_price);
                              const isSel = selected === i;
                              return (
                                <div key={p.id}
                                  onClick={() => goTo(`/products/${p.slug}`, query)}
                                  className="flex items-center gap-3 mx-2 px-3 py-3 rounded-xl cursor-pointer transition-all active:scale-[0.98]"
                                  style={{
                                    background: isSel ? 'rgba(108,99,255,0.08)' : 'transparent',
                                    border: `1px solid ${isSel ? 'rgba(108,99,255,0.2)' : 'transparent'}`,
                                  }}
                                  onMouseEnter={() => setSelected(i)}
                                  onMouseLeave={() => setSelected(-1)}>

                                  {/* Image */}
                                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                                    style={{ background: 'var(--surface-1)' }}>
                                    {p.image_url
                                      ? <img src={imgUrl(p.image_url)} alt={p.name} className="w-12 h-12 object-contain" />
                                      : <span style={{ fontSize: 24, lineHeight: 1 }}>📦</span>}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
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

                                  <ChevronRight className="w-4 h-4 flex-shrink-0 transition-colors"
                                    style={{ color: isSel ? '#6C63FF' : 'var(--text-tertiary)', opacity: isSel ? 1 : 0.4 }} />
                                </div>
                              );
                            })}

                            {/* See all */}
                            <div
                              onClick={handleSubmit}
                              className="flex items-center justify-between mx-2 mt-2 px-4 py-3.5 rounded-xl cursor-pointer active:scale-[0.98] transition-all border"
                              style={{ background: 'var(--surface-1)', borderColor: 'transparent' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(108,99,255,0.25)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}>
                              <div className="flex items-center gap-2.5">
                                <Search className="w-4 h-4" style={{ color: '#6C63FF' }} />
                                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                                  "<span className="font-bold" style={{ color: '#6C63FF' }}>{query}</span>" — бүх үр дүн
                                </span>
                              </div>
                              <ArrowRight className="w-4 h-4" style={{ color: '#6C63FF' }} />
                            </div>
                          </>
                        )}

                        {/* Empty */}
                        {showEmpty && (
                          <div className="text-center py-16 px-6">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                              style={{ background: 'var(--surface-1)' }}>
                              <Search className="w-7 h-7" style={{ color: 'var(--text-tertiary)' }} />
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
                                  className="px-4 py-2 rounded-xl text-sm font-medium border"
                                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface-1)' }}>
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Footer (desktop only) ── */}
                  <div className="hidden md:flex items-center justify-between px-4 py-2.5 border-t flex-shrink-0"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {[['↑↓', 'Сонгох'], ['↵', 'Нэвтрэх'], ['ESC', 'Хаах']].map(([k, l]) => (
                        <span key={k} className="flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>{k}</kbd>
                          {l}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#6C63FF' }}>
                      <Sparkles className="w-3 h-3" /> TechMart Search
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
