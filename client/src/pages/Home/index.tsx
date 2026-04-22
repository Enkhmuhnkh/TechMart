import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, Headphones, ShieldCheck, Zap, Sparkles, TrendingUp } from 'lucide-react';
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

const BANNERS = [
  { tag: 'Шинэ ирэлт', title: 'Хамгийн сүүлийн\nTech гаджетууд', sub: 'Laptop, Phone, Monitor болон бусад', cta: 'Үзэх', bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', accent: '#6C63FF', emoji: '💻' },
  { tag: 'Gaming Setup', title: 'Тоглоомын\nДэлгэрэнгүй дэлгүүр', sub: 'Monitor, GPU, Keyboard, Mouse', cta: 'Харах', bg: 'linear-gradient(135deg, #0d0d0d 0%, #1a0a2e 50%, #2d1b69 100%)', accent: '#00D4AA', emoji: '🎮' },
  { tag: 'Хямдрал 🔥', title: 'До 30% хямдрал\nСонгосон бараанд', sub: 'Laptop, Earbuds, Smartwatch', cta: 'Авах', bg: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0f4c75 100%)', accent: '#F59E0B', emoji: '📱' },
];

// Scroll reveal - аюулгүй хувилбар
function useScrollReveal(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Хэрэв viewport-д байвал шууд харуулна
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

function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(28px)',
      transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)',
    }}>
      {children}
    </div>
  );
}

function SaleSidebar() {
  const { data, isLoading } = useQuery({
    queryKey: ['sale-sidebar'],
    queryFn: () => adminApi.getSaleProducts(),
    staleTime: 5 * 60 * 1000,
  });
  const products = data || [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#EF4444' }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#EF4444' }} />
        </span>
        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Хямдрал</span>
      </div>

      {/* List */}
      <div className="flex-1 space-y-0.5 overflow-y-auto scrollbar-hide">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)
          : products.length === 0
            ? <p className="text-xs text-center py-4" style={{ color: 'var(--text-tertiary)' }}>Хямдрал байхгүй</p>
            : products.map((p: any, i: number) => {
              const discount = p.sale_price ? Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100) : 0;
              return (
                <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <Link to={`/products/${p.slug}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all group hover:bg-[var(--surface-1)]">
                    <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110"
                      style={{ background: 'var(--surface-2)' }}>
                      {p.image_url
                        ? <img src={imgUrl(p.image_url)} alt={p.name} className="w-8 h-8 object-contain" />
                        : <span className="text-base">{CATEGORY_ICONS[p.category_slug] || '📦'}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate group-hover:text-red-500 transition-colors"
                        style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-red-500">{discount}%</span>
                        <span className="text-xs line-through" style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>
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
        className="mt-2 text-center text-xs font-semibold text-red-500 hover:underline py-1">
        Бүгдийг харах →
      </Link>
    </div>
  );
}

function HeroBanner() {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCur(i => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(t);
  }, []);
  const b = BANNERS[cur];

  return (
    <div className="relative overflow-hidden rounded-2xl text-white noise" style={{ background: b.bg, minHeight: 300 }}>
      {/* Animated orbs */}
      <div className="orb absolute -top-16 -right-16 w-64 h-64 opacity-20" style={{ background: b.accent }} />
      <div className="orb absolute bottom-0 left-1/4 w-48 h-48 opacity-10" style={{ background: b.accent, animationDelay: '3s' }} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="relative flex items-center justify-between px-8 md:px-14 py-12 gap-4">
        <motion.div key={cur} initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="flex-1 max-w-md">

          <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-5"
            style={{ background: b.accent + '25', color: b.accent, border: `1px solid ${b.accent}40` }}>
            <Sparkles className="w-3 h-3" /> {b.tag}
          </motion.span>

          <h2 className="font-display font-bold text-3xl md:text-4xl leading-tight mb-4 whitespace-pre-line">
            {b.title}
          </h2>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{b.sub}</p>

          <Link to="/shop"
            className="btn-shine inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
            style={{ background: b.accent, boxShadow: `0 6px 24px ${b.accent}55` }}>
            {b.cta} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <motion.div key={`emoji-${cur}`}
          initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
          className="text-8xl md:text-[120px] select-none hidden md:block animate-float">
          {b.emoji}
        </motion.div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
        {BANNERS.map((_, i) => (
          <button key={i} onClick={() => setCur(i)}
            className="rounded-full transition-all duration-400"
            style={{ width: i === cur ? 24 : 8, height: 8, background: i === cur ? b.accent : 'rgba(255,255,255,0.3)', boxShadow: i === cur ? `0 0 8px ${b.accent}` : 'none' }} />
        ))}
      </div>
    </div>
  );
}

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
    <div className="card p-5 h-full relative overflow-hidden">
      {/* Subtle gradient bg */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 -translate-y-8 translate-x-8"
        style={{ background: 'var(--brand-primary)', filter: 'blur(30px)' }} />

      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🔥</span>
        <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Өнөөдрийн санал</h3>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>Хугацаат хямдрал</p>

      {/* Countdown */}
      <div className="flex items-center gap-1.5 mb-5 p-2.5 rounded-xl" style={{ background: 'var(--surface-1)' }}>
        {[['Цаг', pad(time.h)], ['Мин', pad(time.m)], ['Сек', pad(time.s)]].map(([l, v], i) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="text-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1a1a2e, #6C63FF)' }}>
                <span className="relative z-10 animate-fade-in-up" key={v}>{v}</span>
              </div>
              <span className="text-xs mt-1 block" style={{ color: 'var(--text-tertiary)' }}>{l}</span>
            </div>
            {i < 2 && <span className="font-bold text-lg mb-4" style={{ color: 'var(--brand-primary)' }}>:</span>}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)
          : products.length === 0
            ? <p className="text-xs text-center py-4" style={{ color: 'var(--text-tertiary)' }}>Бараа байхгүй</p>
            : products.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}>
                <Link to={`/products/${p.slug}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--surface-1)] transition-all group">
                  <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: 'var(--surface-2)' }}>
                    {p.image_url
                      ? <img src={imgUrl(p.image_url)} alt={p.name} className="w-10 h-10 object-contain" />
                      : <span className="text-xl">{CATEGORY_ICONS[p.category_slug || ''] || '📦'}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate group-hover:text-brand-primary transition-colors" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                    <p className="text-xs font-bold text-brand-primary">{formatPrice(effectivePrice(p.price, p.sale_price))}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-brand-primary" />
                </Link>
              </motion.div>
            ))}
      </div>
    </div>
  );
}

function SectionHeader({ sub, title, link }: { sub: string; title: string; link?: string }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 rounded-full" style={{ background: 'linear-gradient(to bottom, #6C63FF, #a855f7)' }} />
          <span className="text-xs font-bold tracking-wide text-brand-primary uppercase">{sub}</span>
        </div>
        <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      {link && (
        <Link to={link} className="group flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:gap-2.5 transition-all">
          Бүгдийг харах <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function CategoriesRow() {
  const { data: cats, isLoading } = useCategories();
  return (
    <section className="py-8">
      <SectionHeader sub="Ангилал" title="Ангилалаар хайх" link="/shop" />
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-22 rounded-2xl" />)
          : cats?.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4 }}>
              <Link to={`/shop?category=${cat.slug}`}
                className="gradient-border flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
                <span className="text-2xl transition-transform duration-300 group-hover:scale-125">{CATEGORY_ICONS[cat.slug] || '📦'}</span>
                <span className="text-xs font-semibold leading-tight group-hover:text-brand-primary transition-colors">{cat.name}</span>
              </Link>
            </motion.div>
          ))}
      </div>
      <div className="mt-8 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />
    </section>
  );
}

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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: Math.min(i * 0.06, 0.3) }}>
                <ProductCard product={p} />
              </motion.div>
            ))}
      </div>
      <div className="mt-8 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />
    </section>
  );
}

function PromoBanner() {
  return (
    <section className="py-4">
      <div className="relative overflow-hidden rounded-2xl noise"
        style={{ background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 50%, #0d1a0d 100%)' }}>
        {/* Orbs */}
        <div className="orb absolute top-0 left-1/3 w-56 h-56 opacity-15" style={{ background: '#00D4AA' }} />
        <div className="orb absolute bottom-0 right-1/4 w-40 h-40 opacity-10" style={{ background: '#6C63FF', animationDelay: '4s' }} />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 px-8 md:px-14 py-12">
          <div className="text-white text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(0,212,170,0.2)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.3)' }}>
              <TrendingUp className="w-3 h-3" /> Онцлох
            </span>
            <h2 className="font-display font-bold text-2xl md:text-3xl leading-snug mb-3">
              Хөгжмийн туршлагаа<br />
              <span style={{ color: '#00D4AA' }}>сайжруулаарай</span>
            </h2>
            <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.45)' }}>
              AirPods, Sony, Bose — шилдэг чихэвчнүүд
            </p>
            <Link to="/shop?category=earbuds"
              className="btn-shine inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white"
              style={{ background: '#00D4AA', boxShadow: '0 6px 24px rgba(0,212,170,0.4)' }}>
              Одоо авах <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="text-8xl md:text-[110px] select-none animate-float">🎧</div>
        </div>
      </div>
      <div className="mt-8 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />
    </section>
  );
}

function TrustSection() {
  const items = [
    { icon: Truck, title: 'Үнэгүй хүргэлт', desc: '100,000₮-аас дээш захиалгад', color: '#6C63FF', bg: 'rgba(108,99,255,0.1)' },
    { icon: Headphones, title: '24/7 Дэмжлэг', desc: 'Мэргэжлийн техникийн тусламж', color: '#00D4AA', bg: 'rgba(0,212,170,0.1)' },
    { icon: ShieldCheck, title: 'Мөнгө буцаалт', desc: '30 хоногийн баталгаа', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    { icon: Zap, title: 'Жинхэнэ бараа', desc: '100% баталгаат бүтээгдэхүүн', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  ];
  return (
    <section className="py-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(({ icon: Icon, title, desc, color, bg }, i) => (
          <motion.div key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="card p-5 text-center group hover:-translate-y-1 hover:shadow-lg cursor-default">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:scale-110"
              style={{ background: bg }}>
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { data: cats } = useCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 page-content">

      {/* Hero section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="grid md:grid-cols-12 gap-4 mb-8">

        {/* Sale products sidebar */}
        <div className="hidden md:flex flex-col md:col-span-2 border-r pr-3 min-h-0"
          style={{ borderColor: 'var(--border)' }}>
          <SaleSidebar />
        </div>

        <div className="md:col-span-7"><HeroBanner /></div>
        <div className="md:col-span-3"><DealsPanel /></div>
      </motion.div>

      {/* Sections - always visible */}
      <CategoriesRow />
      <ProductsSection title="Онцлох бүтээгдэхүүн" sub="Шилдэг сонголт" />
      <PromoBanner />
      <RevealSection>
        <ProductsSection title="Эрэлттэй бүтээгдэхүүн" sub="Энэ сарын" filters={{ sortBy: 'created', sortDir: 'asc' }} />
      </RevealSection>
      <RevealSection>
        <TrustSection />
      </RevealSection>
    </div>
  );
}
