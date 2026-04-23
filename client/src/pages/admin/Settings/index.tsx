import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api';
import { imgUrl, formatPrice } from '../../../utils';
import {
  Save, Upload, X, Check, Package, Star, Image, Plus, Trash2,
  Megaphone, Award, ChevronUp, ChevronDown, Store, Palette, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Banner {
  id: number; tag: string; title: string; subtitle: string;
  cta: string; emoji: string; accent: string;
  image_url: string;      // баруун тал — бүтээгдэхүүний зураг
  bg_image_url: string;   // арын дэвсгэр зураг
  bg: string;
}
interface TrustItem {
  icon: string; title: string; desc: string; color: string;
}

const ICON_OPTIONS = [
  { value: 'truck', label: '🚚 Хүргэлт' },
  { value: 'headphones', label: '🎧 Дэмжлэг' },
  { value: 'shield', label: '🛡️ Баталгаа' },
  { value: 'zap', label: '⚡ Хурдан' },
  { value: 'star', label: '⭐ Чанар' },
  { value: 'heart', label: '❤️ Хайр' },
  { value: 'gift', label: '🎁 Бэлэг' },
  { value: 'lock', label: '🔒 Аюулгүй' },
];
const EMOJI_OPTIONS = ['💻', '📱', '🎮', '🖥️', '🎧', '⌚', '📟', '⌨️', '🖱️', '💾', '🔥', '✨', '🚀', '🌟'];
const ACCENT_COLORS = ['#6C63FF', '#00D4AA', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#10B981', '#F97316'];

// ─── Section header ────────────────────────────────────────────────────────────
function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h2 className="font-bold text-base mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AdminSettings() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'store' | 'banners' | 'sidebar' | 'trust' | 'announce'>('store');

  // Store info
  const [storeInfo, setStoreInfo] = useState({ store_name: 'TechMart', store_phone: '', store_email: '', announcement: '' });

  // Banners
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editBannerId, setEditBannerId] = useState<number | null>(null);

  // Trust items
  const [trustItems, setTrustItems] = useState<TrustItem[]>([]);

  // Sale products
  const [saleSearch, setSaleSearch] = useState('');
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Load settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => adminApi.getSettings(),
  });

  const { data: allProducts } = useQuery({
    queryKey: ['products-for-settings'],
    queryFn: () => adminApi.listProducts({ limit: 200 }),
  });

  useEffect(() => {
    if (!settings) return;
    setStoreInfo({
      store_name: settings.store_name || 'TechMart',
      store_phone: settings.store_phone || '',
      store_email: settings.store_email || '',
      announcement: settings.announcement || '',
    });
    try { setBanners(JSON.parse(settings.hero_banners || '[]')); } catch { setBanners([]); }
    try { setTrustItems(JSON.parse(settings.trust_items || '[]')); } catch { setTrustItems([]); }
    try { setSelectedSaleIds(JSON.parse(settings.sidebar_sale_product_ids || '[]')); } catch { setSelectedSaleIds([]); }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string>) => adminApi.saveSettings(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['store-settings'] }); qc.invalidateQueries({ queryKey: ['sale-sidebar'] }); toast.success('Хадгалагдлаа ✓'); setSaving(false); },
    onError: () => { toast.error('Алдаа гарлаа'); setSaving(false); },
  });

  const handleSave = () => {
    setSaving(true);
    saveMutation.mutate({
      ...storeInfo,
      hero_banners: JSON.stringify(banners),
      trust_items: JSON.stringify(trustItems),
      sidebar_sale_product_ids: JSON.stringify(selectedSaleIds),
    });
  };

  // Banner helpers
  const addBanner = () => {
    if (banners.length >= 3) { toast.error('Хамгийн ихдээ 3 banner'); return; }
    const newBanner: Banner = { id: Date.now(), tag: 'Шинэ banner', title: 'Гарчиг', subtitle: 'Дэд гарчиг', cta: 'Үзэх', emoji: '🚀', accent: '#6C63FF', image_url: '', bg_image_url: '', bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' };
    setBanners(b => [...b, newBanner]);
    setEditBannerId(newBanner.id);
  };
  const updateBanner = (id: number, field: keyof Banner, value: string) => {
    setBanners(b => b.map(ban => ban.id === id ? { ...ban, [field]: value } : ban));
  };
  const removeBanner = (id: number) => {
    setBanners(b => b.filter(ban => ban.id !== id));
    if (editBannerId === id) setEditBannerId(null);
  };
  const moveBanner = (idx: number, dir: -1 | 1) => {
    const arr = [...banners];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setBanners(arr);
  };

  const handleBannerImage = (bannerId: number, field: 'image_url' | 'bg_image_url', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateBanner(bannerId, field, reader.result as string);
    reader.readAsDataURL(file);
  };

  // Trust helpers
  const addTrustItem = () => {
    if (trustItems.length >= 4) { toast.error('Хамгийн ихдээ 4 item'); return; }
    setTrustItems(t => [...t, { icon: 'star', title: 'Шинэ давуу тал', desc: 'Тайлбар', color: '#6C63FF' }]);
  };
  const updateTrust = (idx: number, field: keyof TrustItem, val: string) => {
    setTrustItems(t => t.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };
  const removeTrust = (idx: number) => setTrustItems(t => t.filter((_, i) => i !== idx));

  // Sale product helpers
  const saleProducts = (allProducts?.data || []).filter((p: any) => p.sale_price);
  const filteredSale = saleProducts.filter((p: any) =>
    p.name.toLowerCase().includes(saleSearch.toLowerCase()) ||
    (p.name_mn || '').toLowerCase().includes(saleSearch.toLowerCase())
  );
  const toggleSaleProduct = (id: string) => {
    setSelectedSaleIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id)
        : prev.length >= 10 ? (toast.error('Хамгийн ихдээ 10 бараа'), prev)
          : [...prev, id]
    );
  };

  const TABS = [
    { id: 'store', icon: <Store className="w-4 h-4" />, label: 'Дэлгүүр' },
    { id: 'banners', icon: <Image className="w-4 h-4" />, label: 'Banner' },
    { id: 'sidebar', icon: <Package className="w-4 h-4" />, label: 'Хямдрал' },
    { id: 'trust', icon: <Award className="w-4 h-4" />, label: 'Давуу тал' },
    { id: 'announce', icon: <Megaphone className="w-4 h-4" />, label: 'Зар' },
  ] as const;

  if (isLoading) return (
    <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>
  );

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>⚙️ Тохиргоо</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Home хуудасны контентыг удирдах</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" /> {saving ? 'Хадгалж...' : 'Хадгалах'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: activeTab === tab.id ? 'linear-gradient(135deg, #6C63FF, #a855f7)' : 'var(--surface-1)',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Дэлгүүрийн мэдээлэл ── */}
      {activeTab === 'store' && (
        <SectionCard icon={<Store className="w-4 h-4 text-brand-primary" />} title="Дэлгүүрийн мэдээлэл">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Дэлгүүрийн нэр</label>
              <input value={storeInfo.store_name} onChange={e => setStoreInfo(s => ({ ...s, store_name: e.target.value }))} className="input text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Утас</label>
              <input value={storeInfo.store_phone} onChange={e => setStoreInfo(s => ({ ...s, store_phone: e.target.value }))} className="input text-sm" placeholder="+976 9900 0000" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Имэйл</label>
              <input value={storeInfo.store_email} onChange={e => setStoreInfo(s => ({ ...s, store_email: e.target.value }))} className="input text-sm" placeholder="info@techmart.mn" />
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Hero Banners ── */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Home хуудасны slider banner-уудыг удирдах ({banners.length}/3)
            </p>
            <button onClick={addBanner} className="btn-primary btn-sm flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Banner нэмэх
            </button>
          </div>

          {banners.map((banner, idx) => (
            <div key={banner.id} className="card overflow-hidden">
              {/* Preview bar */}
              <div className="h-2" style={{ background: banner.accent }} />
              <div className="p-4">
                {/* Collapsed header */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{banner.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{banner.tag}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{banner.title.replace('\n', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => moveBanner(idx, -1)} disabled={idx === 0} className="btn-ghost p-1.5 rounded-lg disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveBanner(idx, 1)} disabled={idx === banners.length - 1} className="btn-ghost p-1.5 rounded-lg disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                    <button onClick={() => setEditBannerId(editBannerId === banner.id ? null : banner.id)}
                      className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ color: 'var(--brand-primary)' }}>
                      {editBannerId === banner.id ? 'Хаах' : 'Засах'}
                    </button>
                    <button onClick={() => removeBanner(banner.id)} className="btn-ghost p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded editor */}
                {editBannerId === banner.id && (
                  <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: 'var(--border)' }}>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Tag (жижиг label)</label>
                        <input value={banner.tag} onChange={e => updateBanner(banner.id, 'tag', e.target.value)} className="input text-sm" placeholder="Шинэ ирэлт" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Товчлуурын текст</label>
                        <input value={banner.cta} onChange={e => updateBanner(banner.id, 'cta', e.target.value)} className="input text-sm" placeholder="Үзэх" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Гарчиг (мөр эхлүүлэхийн тулд \n ашиглана)</label>
                        <input value={banner.title} onChange={e => updateBanner(banner.id, 'title', e.target.value)} className="input text-sm" placeholder="Хамгийн сүүлийн\nTech гаджетууд" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Дэд гарчиг</label>
                        <input value={banner.subtitle} onChange={e => updateBanner(banner.id, 'subtitle', e.target.value)} className="input text-sm" placeholder="Laptop, Phone, Monitor болон бусад" />
                      </div>
                    </div>

                    {/* Emoji picker */}
                    <div>
                      <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>Emoji</label>
                      <div className="flex flex-wrap gap-2">
                        {EMOJI_OPTIONS.map(e => (
                          <button key={e} onClick={() => updateBanner(banner.id, 'emoji', e)}
                            className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                            style={{ background: banner.emoji === e ? 'var(--brand-primary)' : 'var(--surface-2)', transform: banner.emoji === e ? 'scale(1.15)' : 'scale(1)' }}>
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Accent color */}
                    <div>
                      <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>Accent өнгө</label>
                      <div className="flex gap-2 flex-wrap">
                        {ACCENT_COLORS.map(c => (
                          <button key={c} onClick={() => updateBanner(banner.id, 'accent', c)}
                            className="w-8 h-8 rounded-lg transition-all border-2"
                            style={{ background: c, borderColor: banner.accent === c ? 'white' : 'transparent', transform: banner.accent === c ? 'scale(1.2)' : 'scale(1)' }} />
                        ))}
                      </div>
                    </div>

                    {/* Image uploads */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Баруун тал — бүтээгдэхүүний зураг */}
                      <div>
                        <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                          📦 Баруун талын зураг
                          <span className="ml-1 font-normal" style={{ color: 'var(--text-tertiary)' }}>(бүтээгдэхүүн)</span>
                        </label>
                        <input ref={el => { fileRefs.current[`banner-img-${banner.id}`] = el; }} type="file" accept="image/*"
                          onChange={e => handleBannerImage(banner.id, 'image_url', e)} className="hidden" />
                        <div className="flex flex-col gap-2">
                          <button onClick={() => fileRefs.current[`banner-img-${banner.id}`]?.click()}
                            className="btn-ghost border rounded-xl px-3 py-2 text-xs flex items-center gap-2 w-full" style={{ borderColor: 'var(--border)' }}>
                            <Upload className="w-3.5 h-3.5" /> Зураг оруулах
                          </button>
                          {banner.image_url && (
                            <div className="flex items-center gap-2">
                              <img src={banner.image_url} className="w-14 h-14 rounded-xl object-contain" style={{ background: 'var(--surface-2)' }} alt="" />
                              <button onClick={() => updateBanner(banner.id, 'image_url', '')} className="text-red-500 p-1"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          )}
                          {!banner.image_url && (
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Зураггүй бол emoji харагдана</p>
                          )}
                        </div>
                      </div>

                      {/* Арын дэвсгэр зураг */}
                      <div>
                        <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                          🖼️ Арын дэвсгэр зураг
                          <span className="ml-1 font-normal" style={{ color: 'var(--text-tertiary)' }}>(background)</span>
                        </label>
                        <input ref={el => { fileRefs.current[`banner-bg-${banner.id}`] = el; }} type="file" accept="image/*"
                          onChange={e => handleBannerImage(banner.id, 'bg_image_url', e)} className="hidden" />
                        <div className="flex flex-col gap-2">
                          <button onClick={() => fileRefs.current[`banner-bg-${banner.id}`]?.click()}
                            className="btn-ghost border rounded-xl px-3 py-2 text-xs flex items-center gap-2 w-full" style={{ borderColor: 'var(--border)' }}>
                            <Upload className="w-3.5 h-3.5" /> Зураг оруулах
                          </button>
                          {banner.bg_image_url && (
                            <div className="flex items-center gap-2">
                              <img src={banner.bg_image_url} className="w-14 h-10 rounded-xl object-cover" alt="" />
                              <button onClick={() => updateBanner(banner.id, 'bg_image_url', '')} className="text-red-500 p-1"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          )}
                          {!banner.bg_image_url && (
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Зураггүй бол gradient харагдана</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    <div>
                      <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>Урьдчилан харах</label>
                      <div className="rounded-xl overflow-hidden relative" style={{ background: banner.bg, minHeight: 120 }}>
                        {banner.bg_image_url && <img src={banner.bg_image_url} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />}
                        <div className="relative p-6 flex items-center justify-between" style={{ zIndex: 1 }}>
                          <div>
                            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: banner.accent + '33', color: banner.accent }}>✦ {banner.tag}</span>
                            <h3 className="text-white font-bold text-lg mt-2 whitespace-pre-line leading-snug">{banner.title}</h3>
                            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{banner.subtitle}</p>
                            <span className="inline-block mt-3 px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: banner.accent }}>
                              {banner.cta} →
                            </span>
                          </div>
                          {banner.image_url
                            ? <img src={banner.image_url} alt="" className="h-20 w-20 object-contain" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }} />
                            : <div className="text-5xl">{banner.emoji}</div>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {banners.length === 0 && (
            <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--surface-1)' }}>
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Banner байхгүй байна</p>
              <button onClick={addBanner} className="btn-primary btn-sm">+ Banner нэмэх</button>
            </div>
          )}
        </div>
      )}

      {/* ── Хямдралтай sidebar бараа ── */}
      {activeTab === 'sidebar' && (
        <SectionCard icon={<Package className="w-4 h-4 text-red-500" />} title="Хямдралтай sidebar бараа">
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            Home хуудасны зүүн талд харагдах бараануудыг сонго (хамгийн ихдээ 10). Сонгоогүй бол автоматаар харуулна.
          </p>

          {/* Selected count */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="badge text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                {selectedSaleIds.length}/10 сонгогдсон
              </span>
              {selectedSaleIds.length > 0 && (
                <button onClick={() => setSelectedSaleIds([])} className="text-xs text-red-500 hover:underline">Цэвэрлэх</button>
              )}
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
              <input value={saleSearch} onChange={e => setSaleSearch(e.target.value)}
                placeholder="Бараа хайх..." className="input text-xs pl-8 py-2 w-44" />
            </div>
          </div>

          {saleProducts.length === 0 ? (
            <div className="text-center py-10 rounded-xl" style={{ background: 'var(--surface-1)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Хямдралтай бараа байхгүй</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Бараанд "Хямдралсан үнэ" оруулна уу</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {filteredSale.map((p: any) => {
                const selected = selectedSaleIds.includes(p.id);
                const discount = Math.round((1 - Number(p.sale_price) / Number(p.price)) * 100);
                return (
                  <button key={p.id} onClick={() => toggleSaleProduct(p.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                    style={{ borderColor: selected ? '#EF4444' : 'var(--border)', background: selected ? 'rgba(239,68,68,0.05)' : 'var(--surface-1)' }}>
                    <div className="w-11 h-11 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                      style={{ background: 'var(--surface-2)' }}>
                      {p.image_url
                        ? <img src={imgUrl(p.image_url)} alt={p.name} className="w-10 h-10 object-contain" />
                        : <span className="text-xl">📦</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-red-500">{formatPrice(Number(p.sale_price))}</span>
                        <span className="text-xs line-through" style={{ color: 'var(--text-tertiary)' }}>{formatPrice(Number(p.price))}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#EF4444' }}>-{discount}%</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'bg-red-500 border-red-500' : 'border-[var(--border)]'}`}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredSale.length === 0 && (
                <p className="text-center text-sm py-6" style={{ color: 'var(--text-tertiary)' }}>Бараа олдсонгүй</p>
              )}
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Trust / Давуу тал section ── */}
      {activeTab === 'trust' && (
        <SectionCard icon={<Award className="w-4 h-4 text-amber-500" />} title="Давуу талын хэсэг (footer дээрх 4 box)">
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            Home хуудасны доод хэсэгт харагдах давуу талуудыг засна. Хамгийн ихдээ 4, хамгийн багадаа 2.
          </p>
          <div className="space-y-3 mb-4">
            {trustItems.map((item, idx) => (
              <div key={idx} className="border rounded-2xl p-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: item.color + '20' }}>
                    {ICON_OPTIONS.find(i => i.value === item.icon)?.label.split(' ')[0] || '⭐'}
                  </div>
                  <button onClick={() => removeTrust(idx)} disabled={trustItems.length <= 2}
                    className="text-red-500 disabled:opacity-30 p-1 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Дүрс</label>
                    <select value={item.icon} onChange={e => updateTrust(idx, 'icon', e.target.value)} className="input text-sm">
                      {ICON_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Өнгө</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {ACCENT_COLORS.map(c => (
                        <button key={c} onClick={() => updateTrust(idx, 'color', c)}
                          className="w-7 h-7 rounded-lg border-2 transition-transform"
                          style={{ background: c, borderColor: item.color === c ? 'white' : 'transparent', transform: item.color === c ? 'scale(1.2)' : 'scale(1)' }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Гарчиг</label>
                    <input value={item.title} onChange={e => updateTrust(idx, 'title', e.target.value)} className="input text-sm" placeholder="Үнэгүй хүргэлт" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Тайлбар</label>
                    <input value={item.desc} onChange={e => updateTrust(idx, 'desc', e.target.value)} className="input text-sm" placeholder="100,000₮-аас дээш" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {trustItems.length < 4 && (
            <button onClick={addTrustItem} className="btn-ghost border rounded-xl px-4 py-2 text-sm flex items-center gap-2 w-full justify-center"
              style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}>
              <Plus className="w-4 h-4" /> Item нэмэх ({trustItems.length}/4)
            </button>
          )}
        </SectionCard>
      )}

      {/* ── Announcement bar ── */}
      {activeTab === 'announce' && (
        <SectionCard icon={<Megaphone className="w-4 h-4 text-brand-primary" />} title="Зарлалын мөр">
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            Navbar-ын дээр харагдах зарлалын мөр. Хоосон бол харагдахгүй.
          </p>
          <input value={storeInfo.announcement}
            onChange={e => setStoreInfo(s => ({ ...s, announcement: e.target.value }))}
            className="input text-sm" placeholder="🔥 Хямдрал эхлэлээ! Бүх захиалгад 10% хямдрал..." />
          {storeInfo.announcement && (
            <div className="mt-3 p-3 rounded-xl text-center text-sm font-semibold text-white animate-gradient"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7, #6C63FF)', backgroundSize: '200% 200%' }}>
              {storeInfo.announcement}
            </div>
          )}
        </SectionCard>
      )}

      {/* Save */}
      <div className="flex justify-end pt-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-8">
          <Save className="w-4 h-4" /> {saving ? 'Хадгалж байна...' : 'Бүгдийг хадгалах'}
        </button>
      </div>
    </div>
  );
}
