import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api';
import { imgUrl, formatPrice, effectivePrice } from '../../../utils';
import { Save, Upload, X, Check, Package, Star, Image } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => adminApi.getSettings(),
  });

  const { data: allProducts } = useQuery({
    queryKey: ['products-for-settings'],
    queryFn: () => adminApi.listProducts({ limit: 100 }),
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>([]);
  const [heroImagePreview, setHeroImagePreview] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Initialize form when settings load
  if (settings && !initialized) {
    setForm({
      store_name: settings.store_name || 'TechMart',
      store_phone: settings.store_phone || '',
      store_email: settings.store_email || '',
      hero_title: settings.hero_title || '',
      hero_subtitle: settings.hero_subtitle || '',
      hero_image_url: settings.hero_image_url || '',
    });
    const ids = JSON.parse(settings.sidebar_sale_product_ids || '[]');
    setSelectedSaleIds(ids);
    setHeroImagePreview(settings.hero_image_url || '');
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, string>) => adminApi.saveSettings(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-settings'] });
      toast.success('Тохиргоо хадгалагдлаа ✓');
    },
    onError: () => toast.error('Алдаа гарлаа'),
  });

  const handleSave = () => {
    saveMutation.mutate({
      ...form,
      sidebar_sale_product_ids: JSON.stringify(selectedSaleIds),
    });
  };

  const toggleSaleProduct = (id: string) => {
    setSelectedSaleIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : prev.length >= 10
          ? (toast.error('Хамгийн ихдээ 10 бараа сонгоно'), prev)
          : [...prev, id]
    );
  };

  const handleHeroImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setHeroImagePreview(preview);
    // Upload via cloudinary - use first product slot as workaround
    // For now save as data URL
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, hero_image_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
    toast.success('Зураг сонгогдлоо — хадгалахаа мартуузай');
  };

  const products = allProducts?.data || [];
  const saleProducts = products.filter((p: any) => p.sale_price);

  if (isLoading) return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Тохиргоо</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Дэлгүүрийн контентыг удирдах</p>
        </div>
        <button onClick={handleSave} disabled={saveMutation.isPending}
          className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
      </div>

      {/* Store Info */}
      <div className="card p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Star className="w-4 h-4 text-brand-primary" /> Дэлгүүрийн мэдээлэл
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Дэлгүүрийн нэр</label>
            <input value={form.store_name || ''} onChange={e => setForm(f => ({ ...f, store_name: e.target.value }))}
              className="input text-sm" placeholder="TechMart" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Утасны дугаар</label>
            <input value={form.store_phone || ''} onChange={e => setForm(f => ({ ...f, store_phone: e.target.value }))}
              className="input text-sm" placeholder="+976 9900 0000" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Имэйл</label>
            <input value={form.store_email || ''} onChange={e => setForm(f => ({ ...f, store_email: e.target.value }))}
              className="input text-sm" placeholder="info@techmart.mn" />
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="card p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Image className="w-4 h-4 text-brand-primary" /> Hero Banner
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Гарчиг</label>
              <input value={form.hero_title || ''} onChange={e => setForm(f => ({ ...f, hero_title: e.target.value }))}
                className="input text-sm" placeholder="Хамгийн сүүлийн Tech гаджетууд" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Дэд гарчиг</label>
              <input value={form.hero_subtitle || ''} onChange={e => setForm(f => ({ ...f, hero_subtitle: e.target.value }))}
                className="input text-sm" placeholder="Laptop, Phone, Monitor болон бусад" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Banner зураг</label>
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleHeroImage} className="hidden" />
                <button onClick={() => fileRef.current?.click()}
                  className="btn-ghost border rounded-xl px-4 py-2 text-sm flex items-center gap-2"
                  style={{ borderColor: 'var(--border)' }}>
                  <Upload className="w-4 h-4" /> Зураг оруулах
                </button>
                {heroImagePreview && (
                  <button onClick={() => { setHeroImagePreview(''); setForm(f => ({ ...f, hero_image_url: '' })); }}
                    className="btn-ghost rounded-xl p-2 text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)', minHeight: 160 }}>
            {heroImagePreview ? (
              <img src={heroImagePreview} alt="Hero preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-8 text-center"
                style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', minHeight: 160 }}>
                <span className="text-4xl">🖼️</span>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Зураг сонгоогүй — default banner харагдана</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sale Sidebar Products */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Package className="w-4 h-4 text-red-500" /> Хямдралтай sidebar бараа
          </h2>
          <span className="badge text-xs" style={{ background: selectedSaleIds.length > 0 ? 'rgba(239,68,68,0.1)' : 'var(--surface-2)', color: selectedSaleIds.length > 0 ? '#EF4444' : 'var(--text-secondary)' }}>
            {selectedSaleIds.length}/10 сонгогдсон
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
          Home хуудасны зүүн талд харагдах хямдралтай барааг сонгоно. Сонгоогүй бол хамгийн сүүлийн хямдралтай бараанууд автоматаар харагдана.
        </p>

        {saleProducts.length === 0 ? (
          <div className="text-center py-10 rounded-xl" style={{ background: 'var(--surface-1)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Хямдралтай бараа байхгүй байна</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Бараанд "Хямдралсан үнэ" оруулна уу</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
            {saleProducts.map((p: any) => {
              const selected = selectedSaleIds.includes(p.id);
              const discount = p.sale_price ? Math.round((1 - p.sale_price / p.price) * 100) : 0;
              return (
                <button key={p.id} onClick={() => toggleSaleProduct(p.id)}
                  className="flex items-center gap-3 p-3 rounded-xl border text-left transition-all"
                  style={{
                    borderColor: selected ? '#EF4444' : 'var(--border)',
                    background: selected ? 'rgba(239,68,68,0.06)' : 'var(--surface-1)',
                  }}>
                  <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ background: 'var(--surface-2)' }}>
                    {p.image_url
                      ? <img src={imgUrl(p.image_url)} alt={p.name} className="w-11 h-11 object-contain" />
                      : <span className="text-xl">📦</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                    <p className="text-xs mt-0.5 text-red-500 font-bold">{formatPrice(Number(p.sale_price))}</p>
                    <p className="text-xs line-through" style={{ color: 'var(--text-tertiary)' }}>{formatPrice(Number(p.price))}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#EF4444' }}>
                      -{discount}%
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'bg-red-500 border-red-500' : 'border-[var(--border)]'}`}>
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedSaleIds.length > 0 && (
          <button onClick={() => setSelectedSaleIds([])}
            className="mt-3 text-xs text-red-500 hover:underline">
            Бүгдийг цэвэрлэх
          </button>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saveMutation.isPending}
          className="btn-primary flex items-center gap-2 px-8">
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Хадгалж байна...' : 'Тохиргоо хадгалах'}
        </button>
      </div>
    </div>
  );
}
