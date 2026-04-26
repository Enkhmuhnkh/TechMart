import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Truck, Headphones, ShieldCheck, Zap, Sparkles, TrendingUp, Star, ChevronRight, Flame } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProducts, useCategories } from '../../hooks';
import { ProductCard, ProductCardSkeleton } from '../../components/product/ProductCard';
import { formatPrice, effectivePrice, imgUrl } from '../../utils';
import { adminApi } from '../../api';

const CATEGORY_ICONS: Record<string, string> = {
  laptops: '💻', phones: '📱', tablets: '📟', monitors: '🖥️',
  keyboards: '⌨️', mice: '🖱️', earbuds: '🎧', headphones: '🎧',
  smartwatches: '⌚', gpus: '🎮', storage: '💾', accessories: '📦',
};

const FALLBACK_BANNERS = [
  { tag: 'Шинэ ирэлт', title: 'Хамгийн сүүлийн\nTech гаджетууд', subtitle: 'Laptop, Phone, Monitor болон бусад', cta: 'Үзэх', bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', accent: '#6C63FF', emoji: '💻', link: '/shop' },
  { tag: 'Gaming Setup', title: 'Тоглоомын\nДэлгэрэнгүй дэлгүүр', subtitle: 'Monitor, GPU, Keyboard, Mouse', cta: 'Харах', bg: 'linear-gradient(135deg, #0d0d0d 0%, #1a0a2e 50%, #2d1b69 100%)', accent: '#00D4AA', emoji: '🎮', link: '/shop' },
  { tag: 'Хямдрал 🔥', title: 'До 30% хямдрал\nСонгосон бараанд', subtitle: 'Laptop, Earbuds, Smartwatch', cta: 'Авах', bg: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0f4c75 100%)', accent: '#F59E0B', emoji: '📱', link: '/shop?onSale=true' },
];

const DEFAULT_PROMO = [
  { id: 1, tag: 'Онцлох', title: 'Хөгжмийн туршлагаа\nсайжруулаарай', subtitle: 'AirPods, Sony, Bose — шилдэг чихэвчнүүд', cta: 'Одоо авах', link: '/shop?category=earbuds', emoji: '🎧', accent: '#00D4AA', image_url: '', bg: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 50%, #0d1a0d 100%)' },
  { id: 2, tag: 'Gaming', title: 'Тоглоомын\nтоног төхөөрөмж', subtitle: 'Mouse, Keyboard, Headset — pro setup', cta: 'Харах', link: '/shop?category=keyboards', emoji: '🎮', accent: '#6C63FF', image_url: '', bg: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #2d1b69 100%)' },
];

// ── Scroll reveal ─────────────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.06) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (el.getBoundingClientRect().top < window.innerHeight) { setVisible(true); return; }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(28px)',
      transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ── Mobile sale strip (horizontal scroll) ─────────────────────────────────────
function MobileSaleStrip() {
  const { data, isLoading } = useQuery({
    queryKey: ['sale-sidebar'],
    queryFn: () => adminApi.getSaleProducts(),
    staleTime: 5 * 60 * 1000,
  });
  const products = data || [];
  if (!isLoading && products.length === 0) return null;

  return (
    <div className="md:hidden mb-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#EF4444' }} />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Хямдрал</span>
        <Link to="/shop?onSale=true" className="ml-auto text-xs text-red-500 font-semibold flex items-center gap-0.5">
          Бүгд <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton w-24 h-24 rounded-xl flex-shrink-0" />)
          : products.slice(0, 8).map((p: any) => {
            const discount = p.sale_price ? Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100) : 0;
            return (
              <Link key={p.id} to={`/products/${p.slug}`}
                className="flex-shrink-0 w-24 rounded-xl overflow-hidden border transition-transform active:scale-95"
                style={{ background: 'var(--surface-0)', borderColor: 'var(--border)' }}>
                <div className="relative w-full h-20 flex items-center justify-center" style={{ background: 'var(--surface-1)' }}>
                  {p.image_url
                    ? <img src={imgUrl(p.image_url)} alt={p.name} className="w-16 h-16 object-contain p-1" />
                    : <span className="text-2xl">{CATEGORY_ICONS[p.category_slug] || '📦'}</span>}
                  <span className="absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: '#EF4444' }}>-{discount}%</span>
                </div>
                <div className="p-1.5">
                  <p className="text-[10px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  <p className="text-[10px] font-bold text-red-500">{formatPrice(Number(p.sale_price))}</p>
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}

// ── Desktop sale sidebar ───────────────────────────────────────────────────────
function DesktopSaleSidebar() {
  const { data, isLoading } = useQuery({
    queryKey: ['sale-sidebar'],
    queryFn: () => adminApi.getSaleProducts(),
    staleTime: 5 * 60 * 1000,
  });
  const products = data || [];
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-red-500" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Хямдрал</span>
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto scrollbar-hide">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl mb-1" />)
          : products.map((p: any, i: number) => {
            const discount = p.sale_price ? Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100) : 0;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}>
                <Link to={`/products/${p.slug}`}
                  className="flex items-center gap-2 px-2 py-2 rounded-xl transition-all group hover:bg-[var(--surface-1)]">
                  <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ background: 'var(--surface-2)' }}>
                    {p.image_url
                      ? <img src={imgUrl(p.image_url)} alt={p.name} className="w-8 h-8 object-contain" />
                      : <span className="text-sm">{CATEGORY_ICONS[p.category_slug] || '📦'}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate group-hover:text-red-500 transition-colors"
                      style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-red-500">-{discount}%</span>
                      <span className="text-[10px] line-through" style={{ color: 'var(--text-tertiary)' }}>
                        {formatPrice(Number(p.price))}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
      </div>
      <Link to="/shop?onSale=true"
        className="mt-2 text-center text-xs font-semibold text-red-500 hover:underline py-1 flex items-center justify-center gap-0.5">
        Бүгдийг харах <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ── Hero banner ───────────────────────────────────────────────────────────────
function HeroBanner() {
  const { data: settings } = useQuery({ queryKey: ['store-settings'], queryFn: () => adminApi.getSettings(), staleTime: 60000 });
  const raw = settings ? (() => { try { return JSON.parse(settings.hero_banners || '[]'); } catch { return []; } })() : [];
  const bannerList = raw.length > 0 ? raw : FALLBACK_BANNERS;

  const [cur, setCur] = useState(0);
  const [dir, setDir] = useState(1);
  useEffect(() => {
    const t = setInterval(() => { setDir(1); setCur(i => (i + 1) % bannerList.length); }, 5000);
    return () => clearInterval(t);
  }, [bannerList.length]);

  const b = bannerList[cur];
  if (!b) return null;

  return (
    // Mobile: taller for readability. Desktop: normal
    <div className="relative overflow-hidden rounded-2xl" style={{ background: b.bg, minHeight: 'clamp(220px, 42vw, 320px)' }}>
      {b.bg_image_url && (
        <img src={b.bg_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" style={{ zIndex: 0 }} />
      )}
      {!b.bg_image_url && (
        <>
          <div className="orb absolute -top-16 -right-16 w-64 h-64 opacity-20" style={{ background: b.accent }} />
          <div className="orb absolute bottom-0 left-1/4 w-44 h-44 opacity-10" style={{ background: b.accent, animationDelay: '3s' }} />
        </>
      )}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        zIndex: 1,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }} />

      {/* Content — mobile stacks vertically, desktop side by side */}
      <div className="relative flex items-center justify-between gap-4 h-full" style={{ zIndex: 2, padding: 'clamp(20px, 4vw, 56px)' }}>

        <motion.div key={`t-${cur}`}
          initial={{ opacity: 0, x: -24 * dir }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 min-w-0">

          <span className="inline-flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-full mb-3 sm:mb-5"
            style={{ fontSize: 11, background: b.accent + '22', color: b.accent, border: `1px solid ${b.accent}40` }}>
            <Sparkles className="w-3 h-3" /> {b.tag}
          </span>

          <h2 className="font-display font-bold text-white leading-tight mb-2 sm:mb-4 whitespace-pre-line"
            style={{ fontSize: 'clamp(1.25rem, 4.5vw, 2.4rem)' }}>
            {b.title}
          </h2>

          <p className="mb-4 sm:mb-7 leading-relaxed hidden xs:block sm:block"
            style={{ fontSize: 'clamp(11px, 2vw, 14px)', color: 'rgba(255,255,255,0.5)' }}>
            {b.subtitle || b.sub}
          </p>

          <Link to={b.link || '/shop'}
            className="btn-shine inline-flex items-center gap-2 font-bold text-white rounded-xl group transition-all hover:-translate-y-0.5"
            style={{
              background: b.accent,
              boxShadow: `0 6px 24px ${b.accent}55`,
              padding: 'clamp(8px,2vw,14px) clamp(14px,3vw,28px)',
              fontSize: 'clamp(12px,2vw,14px)',
            }}>
            {b.cta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Image — hidden on very small, visible sm+ */}
        <motion.div key={`i-${cur}`}
          initial={{ opacity: 0, scale: 0.7, rotate: -8 * dir }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 160, damping: 18 }}
          className="flex-shrink-0 flex items-center justify-center hidden xs:flex sm:flex">
          {b.image_url ? (
            <img src={b.image_url} alt=""
              className="object-contain animate-float"
              style={{
                height: 'clamp(90px, 20vw, 240px)',
                width: 'auto',
                filter: `drop-shadow(0 20px 40px ${b.accent}55)`,
              }} />
          ) : (
            <div className="animate-float select-none"
              style={{ fontSize: 'clamp(60px, 14vw, 120px)', lineHeight: 1, filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.4))' }}>
              {b.emoji}
            </div>
          )}
        </motion.div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5" style={{ zIndex: 3 }}>
        {bannerList.map((_: any, i: number) => (
          <button key={i} onClick={() => { setDir(i > cur ? 1 : -1); setCur(i); }}
            className="rounded-full transition-all duration-300"
            style={{ width: i === cur ? 24 : 7, height: 7, background: i === cur ? b.accent : 'rgba(255,255,255,0.3)' }} />
        ))}
      </div>
    </div>
  );
}

// ── Deals panel ───────────────────────────────────────────────────────────────
function useCountdown() {
  const [time, setTime] = useState({ h: 5, m: 47, s: 23 });
  useEffect(() => {
    const target = Date.now() + (5 * 3600 + 47 * 60 + 23) * 1000;
    const t = setInterval(() => {
      const diff = Math.max(0, target - Date.now());
      setTime({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

function DealsPanel() {
  const time = useCountdown();
  const { data, isLoading } = useProducts({ limit: 4 });
  const products = data?.data ?? [];
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="card p-4 h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-12 translate-x-12 opacity-[0.06] pointer-events-none"
        style={{ background: 'var(--brand-primary)', filter: 'blur(30px)' }} />

      <div className="flex items-center gap-2 mb-0.5">
        <Flame className="w-4 h-4 text-orange-500" />
        <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Өнөөдрийн санал</h3>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>Хугацаат хямдрал</p>

      {/* Countdown */}
      <div className="flex items-center gap-1 mb-4 p-2 rounded-xl" style={{ background: 'var(--surface-1)' }}>
        {[['Цаг', pad(time.h)], ['Мин', pad(time.m)], ['Сек', pad(time.s)]].map(([l, v], i) => (
          <div key={l} className="flex items-center gap-1">
            <div className="text-center">
              <AnimatePresence mode="popLayout">
                <motion.div key={v}
                  initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #1a1a2e, #6C63FF)' }}>
                  {v}
                </motion.div>
              </AnimatePresence>
              <span className="text-[9px] mt-0.5 block" style={{ color: 'var(--text-tertiary)' }}>{l}</span>
            </div>
            {i < 2 && <span className="font-bold text-base pb-3" style={{ color: 'var(--brand-primary)' }}>:</span>}
          </div>
        ))}
      </div>

      <div className="space-y-0.5">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)
          : products.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}>
              <Link to={`/products/${p.slug}`}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[var(--surface-1)] transition-all group active:scale-98">
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: 'var(--surface-2)' }}>
                  {p.image_url
                    ? <img src={imgUrl(p.image_url)} alt={p.name} className="w-9 h-9 object-contain" />
                    : <span className="text-lg">{CATEGORY_ICONS[p.category_slug || ''] || '📦'}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate group-hover:text-brand-primary transition-colors"
                    style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  <p className="text-xs font-bold text-brand-primary">
                    {formatPrice(effectivePrice(p.price, p.sale_price))}
                  </p>
                </div>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary flex-shrink-0" />
              </Link>
            </motion.div>
          ))}
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ sub, title, link }: { sub: string; title: string; link?: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #6C63FF, #a855f7)' }} />
          <span className="text-xs font-bold tracking-widest uppercase text-brand-primary">{sub}</span>
        </div>
        <h2 className="font-display font-bold" style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.5rem)', color: 'var(--text-primary)' }}>
          {title}
        </h2>
      </div>
      {link && (
        <Link to={link} className="group flex items-center gap-1 text-sm font-semibold text-brand-primary flex-shrink-0 ml-4">
          <span className="hidden sm:inline">Бүгдийг харах</span>
          <span className="sm:hidden">Бүгд</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

// ── Categories ────────────────────────────────────────────────────────────────
function CategoriesRow() {
  const { data: cats, isLoading } = useCategories();

  const CAT_COLOR: Record<string, { color: string; bg: string }> = {
    laptops:      { color: '#6C63FF', bg: 'rgba(108,99,255,0.08)' },
    phones:       { color: '#00D4AA', bg: 'rgba(0,212,170,0.08)' },
    smartphones:  { color: '#00D4AA', bg: 'rgba(0,212,170,0.08)' },
    tablets:      { color: '#06B6D4', bg: 'rgba(6,182,212,0.08)' },
    monitors:     { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
    keyboards:    { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
    mice:         { color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
    earbuds:      { color: '#EC4899', bg: 'rgba(236,72,153,0.08)' },
    headphones:   { color: '#EC4899', bg: 'rgba(236,72,153,0.08)' },
    smartwatches: { color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
    gpus:         { color: '#F97316', bg: 'rgba(249,115,22,0.08)' },
    storage:      { color: '#6C63FF', bg: 'rgba(108,99,255,0.08)' },
    accessories:  { color: '#9998B0', bg: 'rgba(153,152,176,0.08)' },
  };

  return (
    <section className="py-7">
      <SectionHeader sub="Ангилал" title="Ангилалаар хайх" link="/shop" />

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton rounded-2xl" style={{ height: 72 }} />
            ))
          : cats?.map((cat, i) => {
              const s = CAT_COLOR[cat.slug] || { color: '#9998B0', bg: 'rgba(153,152,176,0.08)' };
              return (
                <motion.div key={cat.id}
                  initial={{ opacity: 0, y: 16, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                  <Link
                    to={`/shop?category=${cat.slug}`}
                    className="flex items-center justify-center py-4 px-2 rounded-2xl text-center
                               transition-all duration-200 hover:-translate-y-1 active:scale-95 border"
                    style={{ background: 'var(--surface-0)', borderColor: 'var(--border)' }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = s.bg;
                      el.style.borderColor = s.color + '50';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = 'var(--surface-0)';
                      el.style.borderColor = 'var(--border)';
                    }}>
                    <span
                      className="font-semibold leading-tight transition-colors duration-200"
                      style={{
                        fontSize: 'clamp(10px, 2.2vw, 12px)',
                        color: 'var(--text-secondary)',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = s.color; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}>
                      {cat.name}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
      </div>

      <div className="mt-7 h-px"
        style={{ background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />
    </section>
  );
}

// ── Products grid ─────────────────────────────────────────────────────────────
function ProductsSection({ title, sub, filters, link }: {
  title: string; sub: string; filters?: object; link?: string;
}) {
  const { data, isLoading } = useProducts({ limit: 8, ...filters });
  const products = data?.data ?? [];

  return (
    <section className="py-7">
      <SectionHeader sub={sub} title={title} link={link || '/shop'} />
      {/* Mobile: 2 col, tight gap */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.length === 0
            ? (
              <div className="col-span-full text-center py-12">
                <span className="text-4xl mb-3 block">📦</span>
                <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>Бүтээгдэхүүн байхгүй</p>
                <Link to="/shop" className="btn-primary btn-sm inline-flex">Дэлгүүр үзэх</Link>
              </div>
            )
            : products.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.45, delay: Math.min(i * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}>
                <ProductCard product={p} />
              </motion.div>
            ))}
      </div>
      <div className="mt-7 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />
    </section>
  );
}

// ── Promo dual banner ─────────────────────────────────────────────────────────
function PromoBanners() {
  const { data: settings } = useQuery({ queryKey: ['store-settings'], queryFn: () => adminApi.getSettings(), staleTime: 60000 });
  const banners = settings ? (() => {
    try { const p = JSON.parse(settings.promo_banners || '[]'); return p.length === 2 ? p : DEFAULT_PROMO; }
    catch { return DEFAULT_PROMO; }
  })() : DEFAULT_PROMO;

  return (
    <section className="py-4">
      {/* Mobile: stack. Desktop: side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {banners.map((b: typeof DEFAULT_PROMO[0], idx: number) => (
          <Reveal key={idx} delay={idx * 80}>
            <div className="relative overflow-hidden rounded-2xl group"
              style={{ background: b.bg, minHeight: 'clamp(160px, 35vw, 220px)' }}>

              <div className="orb absolute -top-8 left-1/4 w-40 h-40 opacity-20" style={{ background: b.accent }} />
              <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }} />

              <div className="relative flex items-center justify-between gap-3 h-full"
                style={{ zIndex: 1, padding: 'clamp(16px, 4vw, 36px)' }}>

                {/* Text */}
                <div className="text-white flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full mb-3"
                    style={{ fontSize: 11, background: b.accent + '22', color: b.accent, border: `1px solid ${b.accent}35` }}>
                    <TrendingUp className="w-3 h-3" /> {b.tag}
                  </span>
                  <h2 className="font-display font-bold leading-snug mb-2 whitespace-pre-line"
                    style={{ fontSize: 'clamp(1rem, 3.5vw, 1.4rem)' }}>
                    {b.title}
                  </h2>
                  <p className="mb-4 hidden sm:block"
                    style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                    {b.subtitle}
                  </p>
                  <Link to={b.link || '/shop'}
                    className="btn-shine inline-flex items-center gap-1.5 font-bold text-white rounded-xl group/btn transition-all active:scale-95"
                    style={{
                      background: b.accent,
                      boxShadow: `0 4px 18px ${b.accent}45`,
                      padding: 'clamp(8px,2vw,12px) clamp(12px,3vw,24px)',
                      fontSize: 'clamp(12px,2vw,14px)',
                    }}>
                    {b.cta} <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                  </Link>
                </div>

                {/* Image / Emoji */}
                <div className="flex-shrink-0">
                  {b.image_url ? (
                    <img src={b.image_url} alt=""
                      className="animate-float object-contain"
                      style={{
                        height: 'clamp(80px, 18vw, 140px)',
                        width: 'auto',
                        filter: `drop-shadow(0 10px 24px ${b.accent}55)`,
                      }} />
                  ) : (
                    <div className="animate-float select-none"
                      style={{
                        fontSize: 'clamp(60px, 14vw, 90px)',
                        lineHeight: 1,
                        filter: `drop-shadow(0 8px 20px ${b.accent}44)`,
                      }}>
                      {b.emoji}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="mt-7 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />
    </section>
  );
}

// ── Trust section ─────────────────────────────────────────────────────────────
function TrustSection() {
  const { data: settings } = useQuery({ queryKey: ['store-settings'], queryFn: () => adminApi.getSettings(), staleTime: 60000 });
  const ICON_MAP: Record<string, React.ElementType> = {
    truck: Truck, headphones: Headphones, shield: ShieldCheck,
    zap: Zap, star: Star, heart: Zap, gift: Zap, lock: ShieldCheck,
  };
  const defaultItems = [
    { icon: 'truck', title: 'Үнэгүй хүргэлт', desc: '100,000₮-аас дээш', color: '#6C63FF' },
    { icon: 'headphones', title: '24/7 Дэмжлэг', desc: 'Мэргэжлийн тусламж', color: '#00D4AA' },
    { icon: 'shield', title: 'Мөнгө буцаалт', desc: '30 хоногийн баталгаа', color: '#F59E0B' },
    { icon: 'zap', title: 'Жинхэнэ бараа', desc: '100% баталгаат', color: '#EF4444' },
  ];
  const items = settings ? (() => {
    try { const p = JSON.parse(settings.trust_items || '[]'); return p.length > 0 ? p : defaultItems; }
    catch { return defaultItems; }
  })() : defaultItems;

  return (
    <section className="py-8">
      <div className={`grid grid-cols-2 gap-3 ${items.length === 4 ? 'md:grid-cols-4' : items.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {items.map((item: any, i: number) => {
          const Icon = ICON_MAP[item.icon] || Zap;
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="card p-4 text-center group hover:-translate-y-1.5 hover:shadow-lg cursor-default transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                style={{ background: `radial-gradient(circle at center, ${item.color}08 0%, transparent 70%)` }} />
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mx-auto mb-2.5 transition-all duration-300 group-hover:scale-110 relative"
                style={{ background: item.color + '15' }}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: item.color }} />
              </div>
              <p className="font-bold mb-0.5" style={{ fontSize: 'clamp(11px, 2.5vw, 14px)', color: 'var(--text-primary)' }}>
                {item.title}
              </p>
              <p className="leading-snug" style={{ fontSize: 'clamp(10px, 2vw, 12px)', color: 'var(--text-secondary)' }}>
                {item.desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 page-content">

      {/* Mobile sale strip */}
      <Reveal>
        <MobileSaleStrip />
      </Reveal>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="grid md:grid-cols-12 gap-3 sm:gap-4 mb-6 sm:mb-8">

        {/* Desktop sidebar */}
        <div className="hidden md:flex flex-col md:col-span-2 border-r pr-3"
          style={{ borderColor: 'var(--border)' }}>
          <DesktopSaleSidebar />
        </div>

        <div className="md:col-span-7">
          <HeroBanner />
        </div>

        {/* Deals: hidden on mobile, show on md+ */}
        <div className="hidden md:block md:col-span-3">
          <DealsPanel />
        </div>
      </motion.div>

      {/* Mobile deals (below banner) */}
      <div className="md:hidden mb-4">
        <Reveal>
          <DealsPanel />
        </Reveal>
      </div>

      <Reveal><CategoriesRow /></Reveal>
      <Reveal><ProductsSection title="Онцлох бүтээгдэхүүн" sub="Шилдэг сонголт" /></Reveal>
      <Reveal><PromoBanners /></Reveal>
      <Reveal delay={60}>
        <ProductsSection title="Эрэлттэй бүтээгдэхүүн" sub="Энэ сарын" filters={{ sortBy: 'created', sortDir: 'asc' }} />
      </Reveal>
      <Reveal delay={80}><TrustSection /></Reveal>
    </div>
  );
}
