import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../../api';
import { useCompareStore } from '../../store';
import { formatPrice, effectivePrice } from '../../utils';
import { X, Plus, GitCompare, Check, Minus, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAddToCart } from '../../hooks';
import { cn } from '../../utils';

export default function ComparePage() {
  const { t, i18n } = useTranslation();
  const { ids, products, remove, clear } = useCompareStore();
  const { mutate: addToCart } = useAddToCart();

  // Fetch full product data with specs
  const { data: fullProducts, isLoading } = useQuery({
    queryKey: ['compare', ids],
    queryFn: () => productsApi.compare(ids),
    enabled: ids.length > 0,
  });

  const items = fullProducts || products;

  // Collect all unique spec keys across all products
  const allSpecGroups: Record<string, Set<string>> = {};
  items.forEach((p: any) => {
    if (!p.specs) return;
    p.specs.forEach((s: any) => {
      const key = s.spec_key || s.key;
      const group = s.spec_group || s.group || 'General';
      if (!allSpecGroups[group]) allSpecGroups[group] = new Set();
      allSpecGroups[group].add(key);
    });
  });

  const getSpec = (product: any, key: string) => {
    if (!product.specs) return null;
    const spec = product.specs.find((s: any) => (s.spec_key || s.key) === key);
    return spec ? (spec.spec_value || spec.value) : null;
  };

  if (ids.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
             style={{ background: 'var(--surface-2)' }}>
          <GitCompare className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} />
        </div>
        <h1 className="font-display font-bold text-2xl mb-3" style={{ color: 'var(--text-primary)' }}>
          Харьцуулах бараа байхгүй байна
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Дэлгүүрт очиж бараануудын харьцуулах дүрс дээр дарна уу
        </p>
        <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Бараа нэмэх
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
            Бараа харьцуулах
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {ids.length} бараа харьцуулж байна
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/shop" className="btn-ghost btn-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Нэмэх
          </Link>
          <button onClick={clear} className="btn-ghost btn-sm text-red-500 flex items-center gap-1.5">
            <X className="w-4 h-4" /> Бүгдийг арилгах
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth: `${ids.length * 240 + 160}px` }}>

          {/* Product headers */}
          <thead>
            <tr>
              <td className="w-40 pb-4 pr-4 align-bottom">
                <span className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-tertiary)' }}>Бараа</span>
              </td>
              {(isLoading ? products : items).map((product: any) => {
                const name = i18n.language === 'mn' && product.name_mn ? product.name_mn : product.name;
                const price = effectivePrice(product.price, product.sale_price);
                return (
                  <td key={product.id} className="pb-4 px-3 align-top" style={{ width: 240 }}>
                    <div className="card p-4 relative">
                      {/* Remove button */}
                      <button onClick={() => remove(product.id)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors">
                        <X className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                      </button>

                      {/* Image */}
                      <div className="aspect-square rounded-xl mb-3 flex items-center justify-center overflow-hidden"
                           style={{ background: 'var(--surface-1)' }}>
                        {product.image_url
                          ? <img src={product.image_url} alt={name} className="w-full h-full object-contain p-3" />
                          : <span className="text-4xl">📦</span>}
                      </div>

                      {/* Info */}
                      <p className="text-xs mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{product.brand_name}</p>
                      <Link to={`/products/${product.slug}`}>
                        <h3 className="font-semibold text-sm leading-snug mb-2 hover:text-brand-primary transition-colors"
                            style={{ color: 'var(--text-primary)' }}>
                          {name}
                        </h3>
                      </Link>

                      {/* Price */}
                      <p className="font-bold text-lg text-brand-primary mb-1">{formatPrice(price)}</p>
                      {product.sale_price && (
                        <p className="text-xs line-through mb-3" style={{ color: 'var(--text-tertiary)' }}>
                          {formatPrice(product.price)}
                        </p>
                      )}

                      {/* Stock */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <div className={cn('w-1.5 h-1.5 rounded-full',
                          product.stock_quantity === 0 ? 'bg-red-500' : 'bg-emerald-500')} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {product.stock_quantity === 0 ? 'Нөөц дууссан' : `${product.stock_quantity} нөөцтэй`}
                        </span>
                      </div>

                      {/* Add to cart */}
                      <button
                        onClick={() => addToCart({ productId: product.id })}
                        disabled={product.stock_quantity === 0}
                        className="w-full btn-primary btn-sm flex items-center justify-center gap-1.5 disabled:opacity-40">
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Сагсанд нэмэх
                      </button>
                    </div>
                  </td>
                );
              })}

              {/* Empty slots */}
              {ids.length < 4 && Array.from({ length: 4 - ids.length }).map((_, i) => (
                <td key={`empty-${i}`} className="pb-4 px-3 align-top" style={{ width: 240 }}>
                  <Link to="/shop"
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed hover:border-brand-primary transition-colors h-full min-h-64 gap-2"
                    style={{ borderColor: 'var(--border)' }}>
                    <Plus className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Бараа нэмэх</span>
                  </Link>
                </td>
              ))}
            </tr>
          </thead>

          {/* Specs rows */}
          <tbody>
            {Object.entries(allSpecGroups).map(([group, keys]) => (
              <>
                {/* Group header */}
                <tr key={`group-${group}`}>
                  <td colSpan={5} className="py-2 px-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">{group}</span>
                      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    </div>
                  </td>
                </tr>

                {/* Spec rows */}
                {Array.from(keys).map(key => {
                  const values = items.map((p: any) => getSpec(p, key));
                  const allSame = values.every(v => v === values[0]);
                  return (
                    <tr key={`${group}-${key}`}
                        className="hover:bg-[var(--surface-1)] transition-colors"
                        style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="py-3 pr-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {key}
                      </td>
                      {items.map((p: any) => {
                        const val = getSpec(p, key);
                        return (
                          <td key={p.id} className="py-3 px-3 text-sm"
                              style={{ color: val ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                            {val || <Minus className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />}
                          </td>
                        );
                      })}
                      {/* Fill empty slots */}
                      {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                        <td key={i} className="py-3 px-3" />
                      ))}
                    </tr>
                  );
                })}
              </>
            ))}

            {/* If no specs available */}
            {Object.keys(allSpecGroups).length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Техникийн үзүүлэлт байхгүй байна
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
