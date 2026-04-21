import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, Headphones, ShieldCheck, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useProducts, useCategories } from '../../hooks';
import { ProductCard, ProductCardSkeleton } from '../../components/product/ProductCard';
import { formatPrice, effectivePrice } from '../../utils';

const CATEGORY_ICONS: Record<string, string> = {
  laptops: '💻', phones: '📱', tablets: '📟', monitors: '🖥️',
  keyboards: '⌨️', mice: '🖱️', earbuds: '🎧', headphones: '🎧',
  smartwatches: '⌚', gpus: '🎮', storage: '💾', accessories: '📦',
};

const BANNERS = [
  { tag: 'Шинэ ирэлт', title: 'Хамгийн сүүлийн\nTech бүтээгдэхүүн', sub: 'Laptop, Phone, Monitor болон бусад', cta: 'Үзэх', bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', accent: '#6C63FF', emoji: '💻' },
  { tag: 'Онцлох санал', title: 'Gaming Setup\nТаны хамгийн сайн', sub: 'Monitor, GPU, Keyboard, Mouse', cta: 'Харах', bg: 'linear-gradient(135deg, #0d0d0d 0%, #1a0a2e 100%)', accent: '#00D4AA', emoji: '🎮' },
  { tag: 'Хямдрал', title: 'До 30% хямдрал\nСонгосон бараанд', sub: 'Laptop, Earbuds, Smartwatch', cta: 'Авах', bg: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)', accent: '#F59E0B', emoji: '📱' },
];

function HeroBanner() {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCur(i => (i + 1) % BANNERS.length), 4500);
    return () => clearInterval(t);
  }, []);
  const b = BANNERS[cur];
  return (
    <div className="relative overflow-hidden rounded-2xl text-white" style={{ background: b.bg, minHeight: 300 }}>
      <div className="flex items-center justify-between px-8 md:px-14 py-12">
        <motion.div key={cur} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }} className="flex-1 max-w-md">
          <span className="text-xs font-semibold px-3 py-1 rounded-full mb-4 inline-block" style={{ background: b.accent + '33', color: b.accent }}>{b.tag}</span>
          <h2 className="font-display font-bold text-3xl md:text-4xl leading-tight mb-3 whitespace-pre-line">{b.title}</h2>
          <p className="text-sm opacity-60 mb-7">{b.sub}</p>
          <Link to="/shop" className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90" style={{ background: b.accent, color: '#fff' }}>
            {b.cta} <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
        <motion.div key={`e-${cur}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }} className="text-8xl md:text-9xl hidden md:block select-none">
          {b.emoji}
        </motion.div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {BANNERS.map((_, i) => (
          <button key={i} onClick={() => setCur(i)} className="rounded-full transition-all" style={{ width: i === cur ? 20 : 8, height: 8, background: i === cur ? b.accent : 'rgba(255,255,255,0.3)' }} />
        ))}
      </div>
    </div>
  );
}

function useCountdown() {
  const [time, setTime] = useState({ h: 3, m: 23, s: 56 });
  useEffect(() => {
    const target = Date.now() + (3 * 3600 + 23 * 60 + 56) * 1000;
    const t = setInterval(() => {
      const diff = Math.max(0, target - Date.now());
      setTime({ h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
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
    <div className="card p-5 h-full">
      <h3 className="font-display font-bold text-sm mb-0.5" style={{ color: 'var(--text-primary)' }}>Өнөөдрийн санал</h3>
      <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>Техник хэрэгсэл</p>
      <div className="flex items-center gap-1.5 mb-4">
        {[['Цаг', pad(time.h)], ['Мин', pad(time.m)], ['Сек', pad(time.s)]].map(([l, v], i) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="text-center">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white" style={{ background: '#1a1a2e' }}>{v}</div>
              <span className="text-xs mt-0.5 block" style={{ color: 'var(--text-tertiary)' }}>{l}</span>
            </div>
            {i < 2 && <span className="font-bold text-base mb-4" style={{ color: 'var(--text-primary)' }}>:</span>}
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)
          : products.map(p => (
            <Link key={p.id} to={`/products/${p.slug}`} className="flex items-center gap-3 hover:bg-[var(--surface-1)] rounded-xl p-2 transition-colors">
              <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                {p.image_url
                  ? <img src={(p.image_url)} alt={p.name} className="w-9 h-9 object-contain" />
                  : <span className="text-lg">{CATEGORY_ICONS[p.category_slug] || '📦'}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                <p className="text-xs font-bold text-brand-primary">{formatPrice(effectivePrice(p.price, p.sale_price))}</p>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
}

// ── Ангилал товч хэсэг ──────────────────────────────────────────────────────
function CategoriesRow() {
  const { data: cats, isLoading } = useCategories();
  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1 h-5 rounded-full bg-brand-primary" />
            <span className="text-xs font-semibold text-brand-primary">Ангилал</span>
          </div>
          <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Ангилалаар хайх</h2>
        </div>
        <Link to="/shop" className="text-sm font-medium text-brand-primary hover:underline flex items-center gap-1">
          Бүгдийг харах <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)
          : cats?.map(cat => (
            <Link key={cat.id} to={`/shop?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 py-4 rounded-xl border text-center hover:border-brand-primary hover:text-brand-primary transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
              <span className="text-2xl">{CATEGORY_ICONS[cat.slug] || '📦'}</span>
              <span className="text-xs font-medium leading-tight">{cat.name}</span>
            </Link>
          ))}
      </div>
      <div className="mt-6 border-t" style={{ borderColor: 'var(--border)' }} />
    </section>
  );
}

// ── Бүтээгдэхүүний хэсэг ────────────────────────────────────────────────────
function ProductsSection({ title, sub, filters, link }: {
  title: string; sub: string; filters?: object; link?: string;
}) {
  const { data, isLoading } = useProducts({ limit: 8, ...filters });
  const products = data?.data ?? [];
  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1 h-5 rounded-full bg-brand-primary" />
            <span className="text-xs font-semibold text-brand-primary">{sub}</span>
          </div>
          <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        </div>
        <Link to={link || '/shop'} className="text-sm font-medium text-brand-primary hover:underline flex items-center gap-1">
          Бүгдийг харах <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.length === 0
            ? (
              <div className="col-span-full text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
                Бүтээгдэхүүн байхгүй байна
              </div>
            )
            : products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
      <div className="mt-6 border-t" style={{ borderColor: 'var(--border)' }} />
    </section>
  );
}

function PromoBanner() {
  return (
    <section className="py-4">
      <div className="rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6"
           style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0d1117 100%)' }}>
        <div className="text-white">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#00D4AA' }}>Онцлох</span>
          <h2 className="font-display font-bold text-2xl md:text-3xl mt-2 leading-tight">
            Хөгжмийн туршлагаа<br />сайжруулаарай
          </h2>
          <p className="text-sm mt-2 mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            AirPods, Sony, Bose — шилдэг чихэвчнүүд
          </p>
          <Link to="/shop?category=earbuds"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: '#00D4AA' }}>
            Одоо авах <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="text-8xl select-none">🎧</div>
      </div>
      <div className="mt-6 border-t" style={{ borderColor: 'var(--border)' }} />
    </section>
  );
}

function TrustSection() {
  return (
    <section className="py-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { icon: Truck, title: 'Үнэгүй хүргэлт', desc: '100,000₮-аас дээш захиалгад' },
          { icon: Headphones, title: '24/7 Дэмжлэг', desc: 'Мэргэжлийн техникийн тусламж' },
          { icon: ShieldCheck, title: 'Мөнгө буцаалт', desc: '30 хоногийн баталгаа' },
          { icon: Zap, title: 'Жинхэнэ бараа', desc: '100% баталгаат бүтээгдэхүүн' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--text-primary)' }}>
                <Icon className="w-4 h-4" style={{ color: 'var(--surface-0)' }} />
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { data: cats } = useCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Hero: sidebar + banner + deals */}
      <div className="grid md:grid-cols-12 gap-4 mb-8">
        {/* Ангилал sidebar — зөвхөн hero-д */}
        <div className="hidden md:flex flex-col gap-0.5 md:col-span-2 border-r pr-3"
             style={{ borderColor: 'var(--border)' }}>
          {cats?.map(cat => (
            <Link key={cat.id} to={`/shop?category=${cat.slug}`}
              className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs hover:bg-[var(--surface-1)] hover:text-brand-primary transition-colors"
              style={{ color: 'var(--text-secondary)' }}>
              <span className="text-sm">{CATEGORY_ICONS[cat.slug] || '📦'}</span>
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Banner */}
        <div className="md:col-span-7">
          <HeroBanner />
        </div>

        {/* Deals */}
        <div className="md:col-span-3">
          <DealsPanel />
        </div>
      </div>

      {/* Ангилал товч — нэг удаа, доор */}
      <CategoriesRow />

      {/* Онцлох бүтээгдэхүүн */}
      <ProductsSection title="Онцлох бүтээгдэхүүн" sub="Шилдэг сонголт" />

      {/* Promo */}
      <PromoBanner />

      {/* Эрэлттэй */}
      <ProductsSection title="Эрэлттэй бүтээгдэхүүн" sub="Энэ сарын" filters={{ sortBy: 'created', sortDir: 'asc' }} />

      {/* Trust */}
      <TrustSection />
    </div>
  );
}
