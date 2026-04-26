import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api';
import { Plus, Pencil, Trash2, X, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const ICONS = ['laptop','smartphone','monitor','keyboard','mouse','headphones','watch','gpu','hdd','box','tablet','camera'];

function CategoryModal({ cat, categories, onClose }: { cat?: any; categories: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!cat;
  const [form, setForm] = useState({
    name: cat?.name || '',
    name_mn: cat?.name_mn || '',
    slug: cat?.slug || '',
    parent_id: cat?.parent_id || '',
    icon: cat?.icon || '',
    sort_order: cat?.sort_order ?? 0,
  });
  const [loading, setLoading] = useState(false);

  const slugify = (text: string) =>
    text.toLowerCase()
      .replace(/[өӨ]/g, 'o').replace(/[үҮ]/g, 'u').replace(/[өөхайгдаж байна]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Монгол нэр оруулахад slug автоматаар үүснэ
  const handleNameMn = (val: string) => {
    setForm(f => ({
      ...f,
      name_mn: val,
      name: val,                          // name = name_mn
      slug: isEdit ? f.slug : slugify(val), // засах үед slug өөрчлөхгүй
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name_mn || !form.slug) { toast.error('Монгол нэр, slug заавал бөглөнө'); return; }
    setLoading(true);
    try {
      const payload = { ...form, name: form.name_mn }; // name = name_mn
      if (isEdit) await adminApi.updateCategory(cat.id, payload);
      else await adminApi.createCategory(payload);
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success(isEdit ? 'Шинэчлэгдлээ' : 'Нэмэгдлээ!');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Алдаа гарлаа');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-modal" style={{ background: 'var(--surface-0)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Ангилал засах' : 'Шинэ ангилал'}
          </h2>
          <button onClick={onClose} className="btn-ghost rounded-xl p-2"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Зөвхөн Монгол нэр — Англи нэр хасагдсан */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
              Ангилалын нэр *
            </label>
            <input
              value={form.name_mn}
              onChange={e => handleNameMn(e.target.value)}
              required
              className="input text-sm"
              placeholder="Зөөврийн компьютер"
            />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Slug *</label>
            <input
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              required
              className="input text-sm font-mono"
              placeholder="laptops"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              URL-д ашиглагдана. Зөвхөн a-z, 0-9, зураас.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Эцэг ангилал</label>
              <select value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))} className="input text-sm">
                <option value="">Үгүй</option>
                {categories.filter(c => c.id !== cat?.id).map(c => (
                  <option key={c.id} value={c.id}>{c.name_mn || c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Дараалал</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                className="input text-sm"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>Дүрс</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(icon => (
                <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${form.icon === icon ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'hover:border-brand-primary/40'}`}
                  style={{ borderColor: form.icon === icon ? undefined : 'var(--border)', color: form.icon === icon ? undefined : 'var(--text-secondary)' }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost px-6">Болих</button>
            <button type="submit" disabled={loading} className="btn-primary px-8">
              {loading ? 'Хадгалж байна...' : isEdit ? 'Хадгалах' : 'Нэмэх'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCategories() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: adminApi.listCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Устгагдлаа');
      setDeleteId(null);
    },
    onError: () => toast.error('Устгаж чадсангүй — бүтээгдэхүүн холбоотой байж болзошгүй'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>Ангилалууд</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Нийт {categories.length} ангилал</p>
        </div>
        <button onClick={() => { setEditCat(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Ангилал нэмэх
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-1)' }}>
              {['Нэр', 'Slug', 'Бүтээгдэхүүн', 'Дараалал', 'Үйлдэл'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold"
                  style={{ color: 'var(--text-secondary)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded w-20" /></td>
                  ))}
                </tr>
              ))
              : categories.map((cat: any) => (
                <tr key={cat.id} className="hover:bg-[var(--surface-1)] transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--surface-2)' }}>
                        <Tag className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                      </div>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {cat.name_mn || cat.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>{cat.slug}</td>
                  <td className="px-4 py-3"><span className="badge-gray text-xs">{cat.product_count || 0}</span></td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{cat.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditCat(cat); setShowModal(true); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors">
                        <Pencil className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
                      </button>
                      <button onClick={() => setDeleteId(cat.id)}
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

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="card p-6 max-w-sm w-full text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Устгах уу?</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
              Энэ ангилалтай холбоотой бүтээгдэхүүн байвал устгагдахгүй.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)} className="btn-ghost px-6">Болих</button>
              <button onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending} className="btn-danger px-6">
                {deleteMutation.isPending ? 'Устгаж байна...' : 'Устгах'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <CategoryModal
          cat={editCat}
          categories={categories}
          onClose={() => { setShowModal(false); setEditCat(null); }}
        />
      )}
    </div>
  );
}
