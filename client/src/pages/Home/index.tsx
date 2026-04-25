import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Truck, Headphones, ShieldCheck, Zap, Sparkles, TrendingUp, ChevronRight, Star } from 'lucide-react';
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

const DEFAULT_PROMO_BANNERS = [
  { id: 1, tag: 'Онцлох', title: 'Хөгжмийн туршлагаа\nсайжруулаарай', subtitle: 'AirPods, Sony, Bose — шилдэг чихэвчнүүд', cta: 'Одоо авах', link: '/shop?category=earbuds', emoji: '🎧', accent: '#00D4AA', image_url: '', bg: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 50%, #0d1a0d 100%)' },
  { id: 2, tag: 'Gaming', title: 'Тоглоомын\nтоног төхөөрөмж', subtitle: 'Mouse, Keyboard, Headset — pro setup', cta: 'Харах', link: '/shop?category=keyboards', emoji: '🎮', accent: '#6C63FF', image_url: '', bg: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #2d1b69 100%)' },
];

// ── Scroll reveal ─────────────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) { setVisible(true); return; }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(32px)',
      transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ── Sale sidebar ──────────────────────────────────────────────────────────────
function SaleSidebar() {
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
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#EF4444' }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#EF4444' }} />
        </span>
        <span className="text-xs font-bold tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>Хямдрал</span>
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto scrollbar-hide">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl mb-1" />)
          : products.length === 0
            ? <p className="text-xs text-center py-4" style={{ color: 'var(--text-tertiary)' }}>Хямдрал байхгүй</p>
            : products.map((p: any, i: number) => {
              const discount = p.sale_price ? Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100) : 0;
              return (
                <motion.div key={p.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}>
                  <Link to={`/products/${p.slug}`}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all group hover:bg-[var(--surface-1)]">
                    <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110"
                      style={{ background: 'var(--surface-2)' }}>
                      {p.image_url
                        ? <img src={imgUrl(p.image_url)} alt={p.name} className="w-8 h-8 object-contain" />
                        : <span className="text-base">{CATEGORY_ICONS[p.category_slug] || '📦'}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate group-hover:text-red-500 transition-colors"
                        style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
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
        className="mt-2 text-center text-xs font-semibold text-red-500 hover:underline py-1 flex items-center justify-center gap-1">
        Бүгдийг харах <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ── Hero Banner ───────────────────────────────────────────────────────────────
function HeroBanner() {
  const { data: settings } = useQuery({ queryKey: ['store-settings'], queryFn: () => adminApi.getSettings(), staleTime: 60000 });
  const rawBanners = settings ? (() => { try { return JSON.parse(settings.hero_banners || '[]'); } catch { return []; } })() : [];
  const bannerList = rawBanners.length > 0 ? rawBanners : FALLBACK_BANNERS;

  const [cur, setCur] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const t = setInterval(() => {
      setDirection(1);
      setCur(i => (i + 1) % bannerList.length);
    }, 5000);
    return () => clearInterval(t);
  }, [bannerList.length]);

  const goTo = (i: number) => {
    setDirection(i > cur ? 1 : -1);
    setCur(i);
  };

  const b = bannerList[cur] || bannerList[0];
  if (!b) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ background: b.bg, minHeight: 300 }}>
      {/* Background image */}
      {b.bg_image_url && (
        <img src={b.bg_image_url} alt="" className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.25, zIndex: 0 }} />
      )}

      {/* Animated orbs */}
      {!b.bg_image_url && (
        <>
          <div className="orb absolute -top-20 -right-20 w-72 h-72 opacity-25" style={{ background: b.accent }} />
          <div className="orb absolute bottom-0 left-1/3 w-56 h-56 opacity-10" style={{ background: b.accent, animationDelay: '3s' }} />
          <div className="orb absolute top-1/2 right-1/4 w-32 h-32 opacity-15" style={{ background: '#fff', animationDelay: '1.5s' }} />
        </>
      )}

      {/* Grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        zIndex: 1,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative flex items-center justify-between px-8 md:px-14 py-12 gap-6" style={{ zIndex: 2, minHeight: 300 }}>
        {/* Left text */}
        <motion.div key={`text-${cur}`}
          initial={{ opacity: 0, x: -32 * direction }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 max-w-md">

          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-5"
              style={{ background: b.accent + '22', color: b.accent, border: `1px solid ${b.accent}40` }}>
              <Sparkles className="w-3 h-3" /> {b.tag}
            </span>
          </motion.div>

          <h2 className="font-display font-bold text-white leading-tight mb-4 whitespace-pre-line"
            style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}>
            {b.title}
          </h2>

          <p className="text-sm mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {b.subtitle || b.sub}
          </p>

          <Link to={b.link || '/shop'}
            className="btn-shine inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 group"
            style={{ background: b.accent, boxShadow: `0 8px 28px ${b.accent}55` }}>
            {b.cta}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Right image / emoji */}
        <motion.div key={`img-${cur}`}
          initial={{ opacity: 0, scale: 0.65, rotate: -8 * direction }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.65, type: 'spring', stiffness: 160, damping: 18 }}
          className="hidden md:flex items-center justify-center flex-shrink-0">
          {b.image_url ? (
            <img src={b.image_url} alt=""
              className="object-contain animate-float drop-shadow-2xl"
              style={{ height: 250, width: 'auto', maxWidth: 270, filter: 'drop-shadow(0 28px 52px rgba(0,0,0,0.5))' }} />
          ) : (
            <div className="animate-float select-none" style={{ fontSize: 128, lineHeight: 1, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}>
              {b.emoji}
            </div>
          )}
        </motion.div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2" style={{ zIndex: 3 }}>
        {bannerList.map((_: any, i: number) => (
          <button key={i} onClick={() => goTo(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === cur ? 28 : 8, height: 8,
              background: i === cur ? b.accent : 'rgba(255,255,255,0.25)',
              boxShadow: i === cur ? `0 0 10px ${b.accent}` : 'none',
            }} />
        ))}
      </div>
    </div>
  );
}

// ── Countdown ─────────────────────────────────────────────────────────────────
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

// ── Deals panel ───────────────────────────────────────────────────────────────
function DealsPanel() {
  const time = useCountdown();
  const { data, isLoading } = useProducts({ limit: 4 });
  const products = data?.data ?? [];
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="card p-5 h-full relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-16 translate-x-16 opacity-[0.06] pointer-events-none"
        style={{ background: 'var(--brand-primary)', filter: 'blur(40px)' }} />

      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-lg">🔥</span>
        <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Өнөөдрийн санал</h3>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>Хугацаат хямдрал</p>

      {/* Countdown */}
      <div className="flex items-center gap-1.5 mb-5 p-2.5 rounded-xl" style={{ background: 'var(--surface-1)' }}>
        {[['Цаг', pad(time.h)], ['Мин', pad(time.m)], ['Сек', pad(time.s)]].map(([l, v], i) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="text-center">
              <motion.div key={v}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #1a1a2e, #6C63FF)' }}>
                {v}
              </motion.div>
              <span className="text-[10px] mt-1 block" style={{ color: 'var(--text-tertiary)' }}>{l}</span>
            </div>
            {i < 2 && <span className="font-bold text-base mb-3.5" style={{ color: 'var(--brand-primary)' }}>:</span>}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)
          : products.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}>
              <Link to={`/products/${p.slug}`}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--surface-1)] transition-all group">
                <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105"
                  style={{ background: 'var(--surface-2)' }}>
                  {p.image_url
                    ? <img src={imgUrl(p.image_url)} alt={p.name} className="w-10 h-10 object-contain" />
                    : <span className="text-xl">{CATEGORY_ICONS[p.category_slug || ''] || '📦'}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate group-hover:text-brand-primary transition-colors"
                    style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                  <p className="text-xs font-bold text-brand-primary">{formatPrice(effectivePrice(p.price, p.sale_price))}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary" />
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
    <div className="flex items-end justify-between mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #6C63FF, #a855f7)' }} />
          <span className="text-xs font-bold tracking-widest uppercase text-brand-primary">{sub}</span>
        </div>
        <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      {link && (
        <Link to={link}
          className="group flex items-center gap-1.5 text-sm font-semibold text-brand-primary transition-all hover:gap-2.5">
          Бүгдийг харах <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

// ── Categories ────────────────────────────────────────────────────────────────
function CategoriesRow() {
  const { data: cats, isLoading } = useCategories();
  return (
    <section className="py-8">
      <SectionHeader sub="Ангилал" title="Ангилалаар хайх" link="/shop" />
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
          : cats?.map((cat, i) => (
            <motion.div key={cat.id}
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <Link to={`/shop?category=${cat.slug}`}
                className="relative flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1.5 group overflow-hidden border"
                style={{ background: 'var(--surface-0)', borderColor: 'var(--border)' }}>
                {/* Hover bg */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.06), rgba(168,85,247,0.06))' }} />
                <span className="text-2xl transition-transform duration-300 group-hover:scale-125 relative z-10">
                  {CATEGORY_ICONS[cat.slug] || '📦'}
                </span>
                <span className="text-xs font-semibold leading-tight group-hover:text-brand-primary transition-colors relative z-10"
                  style={{ color: 'var(--text-secondary)' }}>
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
      </div>
      <div className="mt-8 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />
    </section>
  );
}

// ── Products section ──────────────────────────────────────────────────────────
function ProductsSection({ title, sub, filters, link }: {
  title: string; sub: string; filters?: object; link?: string;
}) {
  const { data, isLoading } = useProducts({ limit: 8, ...filters });
  const products = data?.data ?? [];

  return (
    <section className="py-8">
      <SectionHeader sub={sub} title={title} link={link || '/shop'} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.length === 0
            ? (
              <div className="col-span-full text-center py-16">
                <span className="text-5xl mb-4 block">📦</span>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Бүтээгдэхүүн байхгүй байна</p>
                <Link to="/shop" className="btn-primary btn-sm mt-4 inline-flex">Дэлгүүр үзэх</Link>
              </div>
            )
            : products.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.07, 0.35), ease: [0.16, 1, 0.3, 1] }}>
                <ProductCard product={p} />
              </motion.div>
            ))}
      </div>
      <div className="mt-8 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />
    </section>
  );
}

// ── Promo dual banner ─────────────────────────────────────────────────────────
function PromoBanners() {
  const { data: settings } = useQuery({ queryKey: ['store-settings'], queryFn: () => adminApi.getSettings(), staleTime: 60000 });
  const promoBanners = settings ? (() => {
    try { const p = JSON.parse(settings.promo_banners || '[]'); return p.length === 2 ? p : DEFAULT_PROMO_BANNERS; }
    catch { return DEFAULT_PROMO_BANNERS; }
  })() : DEFAULT_PROMO_BANNERS;

  return (
    <section className="py-4">
      <div className="grid md:grid-cols-2 gap-4">
        {promoBanners.map((b: typeof DEFAULT_PROMO_BANNERS[0], idx: number) => (
          <RevealSection key={idx} delay={idx * 80}>
            <div className="relative overflow-hidden rounded-2xl h-full group cursor-pointer"
              style={{ background: b.bg, minHeight: 210 }}>

              {/* Orbs */}
              <div className="orb absolute -top-10 left-1/4 w-48 h-48 opacity-20 group-hover:opacity-30 transition-opacity"
                style={{ background: b.accent }} />
              <div className="orb absolute bottom-0 right-1/4 w-32 h-32 opacity-10"
                style={{ background: b.accent, animationDelay: `${idx * 2}s` }} />

              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }} />

              <div className="relative flex items-center justify-between gap-4 px-7 py-9">
                <div className="text-white flex-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-4"
                    style={{ background: b.accent + '22', color: b.accent, border: `1px solid ${b.accent}35` }}>
                    <TrendingUp className="w-3 h-3" /> {b.tag}
                  </span>
                  <h2 className="font-display font-bold text-xl md:text-2xl leading-snug mb-3 whitespace-pre-line">
                    {b.title}
                  </h2>
                  <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>{b.subtitle}</p>
                  <Link to={b.link || '/shop'}
                    className="btn-shine inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white group/btn"
                    style={{ background: b.accent, boxShadow: `0 6px 24px ${b.accent}40` }}>
                    {b.cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </div>

                {/* Image/emoji — floating animation */}
                <div className="flex-shrink-0">
                  {b.image_url ? (
                    <img src={b.image_url} alt=""
                      className="animate-float object-contain"
                      style={{ height: 150, width: 'auto', maxWidth: 160, filter: `drop-shadow(0 16px 32px ${b.accent}55)` }} />
                  ) : (
                    <div className="animate-float select-none"
                      style={{ fontSize: 96, lineHeight: 1, filter: `drop-shadow(0 12px 24px ${b.accent}44)` }}>
                      {b.emoji}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </RevealSection>
        ))}
      </div>
      <div className="mt-8 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />
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
    { icon: 'truck', title: 'Үнэгүй хүргэлт', desc: '100,000₮-аас дээш захиалгад', color: '#6C63FF' },
    { icon: 'headphones', title: '24/7 Дэмжлэг', desc: 'Мэргэжлийн техникийн тусламж', color: '#00D4AA' },
    { icon: 'shield', title: 'Мөнгө буцаалт', desc: '30 хоногийн баталгаа', color: '#F59E0B' },
    { icon: 'zap', title: 'Жинхэнэ бараа', desc: '100% баталгаат бүтээгдэхүүн', color: '#EF4444' },
  ];
  const items = settings ? (() => {
    try { const p = JSON.parse(settings.trust_items || '[]'); return p.length > 0 ? p : defaultItems; }
    catch { return defaultItems; }
  })() : defaultItems;

  return (
    <section className="py-10">
      <div className={`grid grid-cols-2 gap-4 ${items.length === 4 ? 'md:grid-cols-4' : items.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {items.map((item: any, i: number) => {
          const Icon = ICON_MAP[item.icon] || Zap;
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="card p-5 text-center group hover:-translate-y-2 hover:shadow-xl cursor-default transition-all duration-300 relative overflow-hidden">
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                style={{ background: `radial-gradient(circle at center, ${item.color}08 0%, transparent 70%)` }} />
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:scale-110 relative"
                style={{ background: item.color + '15' }}>
                <Icon className="w-6 h-6" style={{ color: item.color }} />
              </div>
              <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 page-content">

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="grid md:grid-cols-12 gap-4 mb-8">

        {/* Sale sidebar */}
        <div className="hidden md:flex flex-col md:col-span-2 border-r pr-3"
          style={{ borderColor: 'var(--border)' }}>
          <SaleSidebar />
        </div>

        <div className="md:col-span-7">
          <HeroBanner />
        </div>

        <div className="md:col-span-3">
          <DealsPanel />
        </div>
      </motion.div>

      {/* ── Categories ── */}
      <RevealSection>
        <CategoriesRow />
      </RevealSection>

      {/* ── Featured products ── */}
      <RevealSection>
        <ProductsSection title="Онцлох бүтээгдэхүүн" sub="Шилдэг сонголт" />
      </RevealSection>

      {/* ── Promo dual banners ── */}
      <RevealSection>
        <PromoBanners />
      </RevealSection>

      {/* ── Popular products ── */}
      <RevealSection delay={60}>
        <ProductsSection
          title="Эрэлттэй бүтээгдэхүүн"
          sub="Энэ сарын"
          filters={{ sortBy: 'created', sortDir: 'asc' }}
        />
      </RevealSection>

      {/* ── Trust ── */}
      <RevealSection delay={80}>
        <TrustSection />
      </RevealSection>
    </div>
  );
}
