import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api';
import { Plus, Pencil, Trash2, X, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';

function BrandModal({ brand, onClose }: { brand?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!brand;
  const [form, setForm] = useState({ name: brand?.name || '', logo_url: brand?.logo_url || '', country: brand?.country || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Нэр заавал бөглөнө'); return; }
    setLoading(true);
    try {
      if (isEdit) await adminApi.updateBrand(brand.id, form);
      else await adminApi.createBrand(form);
      qc.invalidateQueries({ queryKey: ['brands'] });
      toast.success(isEdit ? 'Шинэчлэгдлээ' : 'Нэмэгдлээ!');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Алдаа гарлаа');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-sm rounded-2xl shadow-modal" style={{ background: 'var(--surface-0)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{isEdit ? 'Брэнд засах' : 'Шинэ брэнд'}</h2>
          <button onClick={onClose} className="btn-ghost rounded-xl p-2"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Брэндийн нэр *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="input text-sm" placeholder="Apple" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Лого URL</label>
            <input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} className="input text-sm" placeholder="https://..." />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Улс</label>
            <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="input text-sm" placeholder="USA, South Korea..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost px-6">Болих</button>
            <button type="submit" disabled={loading} className="btn-primary px-8">{loading ? 'Хадгалж байна...' : isEdit ? 'Хадгалах' : 'Нэмэх'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBrands() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editBrand, setEditBrand] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: brands = [], isLoading } = useQuery({ queryKey: ['brands'], queryFn: adminApi.listBrands });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteBrand,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['brands'] }); toast.success('Устгагдлаа'); setDeleteId(null); },
    onError: () => toast.error('Устгаж чадсангүй — бүтээгдэхүүн холбоотой байж болзошгүй'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Брэндүүд</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Нийт {brands.length} брэнд</p>
        </div>
        <button onClick={() => { setEditBrand(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Брэнд нэмэх
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)
          : brands.map((brand: any) => (
            <div key={brand.id} className="card p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                    {brand.logo_url
                      ? <img src={brand.logo_url} alt={brand.name} className="w-8 h-8 object-contain" />
                      : <Bookmark className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{brand.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{brand.country || '—'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditBrand(brand); setShowModal(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors">
                    <Pencil className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  <button onClick={() => setDeleteId(brand.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
              <div className="border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                <span className="badge-gray text-xs">{brand.product_count || 0} бүтээгдэхүүн</span>
              </div>
            </div>
          ))}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-6 max-w-sm w-full text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Устгах уу?</h3>
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={() => setDeleteId(null)} className="btn-ghost px-6">Болих</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="btn-danger px-6">
                {deleteMutation.isPending ? 'Устгаж байна...' : 'Устгах'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && <BrandModal brand={editBrand} onClose={() => { setShowModal(false); setEditBrand(null); }} />}
    </div>
  );
}
