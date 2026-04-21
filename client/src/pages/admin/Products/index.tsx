import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api';
import { formatPrice, effectivePrice } from '../../../utils';
import { Plus, Pencil, Trash2, X, Upload, Package } from 'lucide-react';
import toast from 'react-hot-toast';

interface SpecRow { key: string; value: string; group: string; }

const SPEC_GROUPS = ['Performance', 'Display', 'Battery', 'Camera', 'Connectivity', 'Physical', 'Features', 'Software', 'General'];

function ProductModal({ product, categories, brands, onClose }: {
  product?: any; categories: any[]; brands: any[]; onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: product?.name || '',
    name_mn: product?.name_mn || '',
    category_id: product?.category_id || '',
    brand_id: product?.brand_id || '',
    price: product?.price || '',
    sale_price: product?.sale_price || '',
    stock_quantity: product?.stock_quantity ?? 0,
    description: product?.description || '',
    description_mn: product?.description_mn || '',
    status: product?.status || 'active',
  });

  const [specs, setSpecs] = useState<SpecRow[]>(
    product?.specs?.map((s: any) => ({ key: s.spec_key, value: s.spec_value, group: s.spec_group })) || []
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(product?.image_url || '');
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addSpec = () => setSpecs(s => [...s, { key: '', value: '', group: 'General' }]);
  const removeSpec = (i: number) => setSpecs(s => s.filter((_, idx) => idx !== i));
  const setSpec = (i: number, field: keyof SpecRow, val: string) =>
    setSpecs(s => s.map((sp, idx) => idx === i ? { ...sp, [field]: val } : sp));

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category_id || !form.brand_id || !form.price) {
      toast.error('Нэр, ангилал, брэнд, үнэ заавал бөглөнө'); return;
    }
    setLoading(true);
    try {
      let prod;
      if (isEdit) {
        prod = await adminApi.updateProduct(product.id, { ...form, price: Number(form.price), sale_price: form.sale_price ? Number(form.sale_price) : null, stock_quantity: Number(form.stock_quantity) });
      } else {
        prod = await adminApi.createProduct({ ...form, price: Number(form.price), sale_price: form.sale_price ? Number(form.sale_price) : null, stock_quantity: Number(form.stock_quantity) });
      }

      // Upload image
      if (imageFile && prod?.id) {
        await adminApi.uploadImage(prod.id, imageFile, true);
      }

      // Save specs
      if (prod?.id && specs.length > 0) {
        const validSpecs = specs.filter(s => s.key && s.value);
        if (validSpecs.length > 0) {
          await adminApi.updateSpecs(prod.id, validSpecs.map((s, i) => ({ key: s.key, value: s.value, group: s.group, sort: i })));
        }
      }

      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success(isEdit ? 'Бүтээгдэхүүн шинэчлэгдлээ' : 'Бүтээгдэхүүн нэмэгдлээ! 🎉');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-3xl rounded-2xl shadow-modal" style={{ background: 'var(--surface-0)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Бүтээгдэхүүн засах' : 'Шинэ бүтээгдэхүүн нэмэх'}
          </h2>
          <button onClick={onClose} className="btn-ghost rounded-xl p-2">
            <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image upload */}
          <div className="flex gap-4 items-start">
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer relative"
                 style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
              {imagePreview
                ? <img src={imagePreview} alt="" className="w-full h-full object-contain p-2" />
                : <Package className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} />}
              <input type="file" accept="image/*" onChange={handleImage} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Зураг оруулах</p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>JPG, PNG, WEBP — max 5MB</p>
              <label className="btn-ghost btn-sm cursor-pointer inline-flex items-center gap-2 border rounded-xl px-3 py-2" style={{ borderColor: 'var(--border)' }}>
                <Upload className="w-4 h-4" /> Зураг сонгох
                <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </label>
            </div>
          </div>

          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Нэр (Англи) *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} required className="input text-sm" placeholder="MacBook Pro 14" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Нэр (Монгол)</label>
              <input value={form.name_mn} onChange={e => set('name_mn', e.target.value)} className="input text-sm" placeholder="МакБүүк Про 14" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Ангилал *</label>
              <select value={form.category_id} onChange={e => set('category_id', e.target.value)} required className="input text-sm">
                <option value="">Ангилал сонгох</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Брэнд *</label>
              <select value={form.brand_id} onChange={e => set('brand_id', e.target.value)} required className="input text-sm">
                <option value="">Брэнд сонгох</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          {/* Price & Stock */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Үнэ (₮) *</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} required min="0" className="input text-sm" placeholder="1990000" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Хямдарсан үнэ (₮)</label>
              <input type="number" value={form.sale_price} onChange={e => set('sale_price', e.target.value)} min="0" className="input text-sm" placeholder="1790000" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Нөөц</label>
              <input type="number" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} min="0" className="input text-sm" placeholder="10" />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Статус</label>
            <div className="flex gap-3">
              {[['active', '✅ Идэвхтэй'], ['draft', '📝 Ноорог'], ['archived', '📦 Архивласан']].map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="status" value={val} checked={form.status === val} onChange={() => set('status', val)} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Тайлбар (Англи)</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="input text-sm resize-none" placeholder="Product description in English..." />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Тайлбар (Монгол)</label>
              <textarea value={form.description_mn} onChange={e => set('description_mn', e.target.value)} rows={3} className="input text-sm resize-none" placeholder="Монгол тайлбар..." />
            </div>
          </div>

          {/* Specs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Техникийн үзүүлэлт ({specs.length})
              </label>
              <button type="button" onClick={addSpec} className="btn-ghost btn-sm text-xs flex items-center gap-1 text-brand-primary">
                <Plus className="w-3.5 h-3.5" /> Нэмэх
              </button>
            </div>

            {specs.length === 0 && (
              <div className="text-center py-6 rounded-xl border border-dashed" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Үзүүлэлт нэмэгдээгүй байна</p>
                <button type="button" onClick={addSpec} className="btn-ghost btn-sm text-xs text-brand-primary mt-2">
                  + Үзүүлэлт нэмэх
                </button>
              </div>
            )}

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {specs.map((spec, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <select value={spec.group} onChange={e => setSpec(i, 'group', e.target.value)}
                      className="input text-xs py-1.5">
                      {SPEC_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <input value={spec.key} onChange={e => setSpec(i, 'key', e.target.value)}
                      placeholder="CPU, RAM, Display..." className="input text-xs py-1.5" />
                  </div>
                  <div className="col-span-4">
                    <input value={spec.value} onChange={e => setSpec(i, 'value', e.target.value)}
                      placeholder="M3 Pro, 16GB, 14.2&quot;..." className="input text-xs py-1.5" />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button type="button" onClick={() => removeSpec(i)} className="p-1 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {specs.length > 0 && (
              <div className="grid grid-cols-12 gap-2 mt-1 px-0.5">
                <div className="col-span-3 text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>Бүлэг</div>
                <div className="col-span-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>Шинж чанар</div>
                <div className="col-span-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>Утга</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <button type="button" onClick={onClose} className="btn-ghost px-6">Болих</button>
            <button type="submit" disabled={loading} className="btn-primary px-8 disabled:opacity-60">
              {loading ? 'Хадгалж байна...' : isEdit ? 'Хадгалах' : 'Нэмэх'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, q: search }],
    queryFn: () => adminApi.listProducts({ page, limit: 20, q: search || undefined }),
  });

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => adminApi.listCategories() });
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: () => adminApi.listBrands() });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Устгагдлаа');
      setDeleteId(null);
    },
    onError: () => toast.error('Устгаж чадсангүй'),
  });

  const products = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
            Бүтээгдэхүүн
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Нийт {meta?.total || 0} бүтээгдэхүүн
          </p>
        </div>
        <button onClick={() => { setEditProduct(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Бүтээгдэхүүн нэмэх
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Бүтээгдэхүүн хайх..."
          className="input text-sm max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-1)' }}>
                {['Бүтээгдэхүүн', 'Ангилал', 'Брэнд', 'Үнэ', 'Нөөц', 'Статус', 'Үйлдэл'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
                : products.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <Package className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                        <p style={{ color: 'var(--text-secondary)' }}>Бүтээгдэхүүн байхгүй байна</p>
                        <button onClick={() => { setEditProduct(null); setShowModal(true); }}
                          className="btn-primary btn-sm mt-4">
                          + Анхны бүтээгдэхүүн нэмэх
                        </button>
                      </td>
                    </tr>
                  )
                  : products.map((p: any) => (
                    <tr key={p.id} className="hover:bg-[var(--surface-1)] transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                            {p.image_url
                              ? <img src={(p.image_url)} alt={p.name} className="w-9 h-9 object-contain rounded-lg" />
                              : <Package className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[180px]" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                            {p.name_mn && <p className="text-xs truncate max-w-[180px]" style={{ color: 'var(--text-tertiary)' }}>{p.name_mn}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{p.category_name || '—'}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{p.brand_name || '—'}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-brand-primary text-xs">{formatPrice(effectivePrice(p.price, p.sale_price))}</p>
                          {p.sale_price && <p className="text-xs line-through" style={{ color: 'var(--text-tertiary)' }}>{formatPrice(p.price)}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${p.stock_quantity === 0 ? 'badge-danger' : p.stock_quantity < 10 ? 'badge-warning' : 'badge-success'}`}>
                          {p.stock_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${p.status === 'active' ? 'badge-success' : p.status === 'draft' ? 'badge-warning' : 'badge-gray'}`}>
                          {p.status === 'active' ? 'Идэвхтэй' : p.status === 'draft' ? 'Ноорог' : 'Архив'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditProduct(p); setShowModal(true); }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors">
                            <Pencil className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                          </button>
                          <button onClick={() => setDeleteId(p.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {meta.page} / {meta.totalPages} хуудас
            </p>
            <div className="flex gap-2">
              <button disabled={!meta.hasPrev} onClick={() => setPage(p => p - 1)}
                className="btn-ghost btn-sm text-xs disabled:opacity-40">← Өмнөх</button>
              <button disabled={!meta.hasNext} onClick={() => setPage(p => p + 1)}
                className="btn-ghost btn-sm text-xs disabled:opacity-40">Дараах →</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-6 max-w-sm w-full text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Устгах уу?</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Энэ бүтээгдэхүүнийг устгасны дараа сэргээх боломжгүй.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)} className="btn-ghost px-6">Болих</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}
                className="btn-danger px-6">
                {deleteMutation.isPending ? 'Устгаж байна...' : 'Устгах'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product modal */}
      {showModal && (
        <ProductModal
          product={editProduct}
          categories={categories}
          brands={brands}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
        />
      )}
    </div>
  );
}
