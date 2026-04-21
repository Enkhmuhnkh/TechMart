import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, X, ChevronDown, Search } from 'lucide-react';
import { useProducts, useCategories, useBrands } from '../../hooks';
import { ProductCard, ProductCardSkeleton } from '../../components/product/ProductCard';
import { cn } from '../../utils';
import type { ProductFilters } from '../../types';

const SORT_OPTIONS = [
  { value: 'created:desc', label: 'shop.sort.newest' },
  { value: 'price:asc',    label: 'shop.sort.priceLow' },
  { value: 'price:desc',   label: 'shop.sort.priceHigh' },
  { value: 'name:asc',     label: 'shop.sort.name' },
];

export default function ShopPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<ProductFilters>(() => ({
    q: params.get('q') || undefined,
    category: params.get('category') || undefined,
    brand: params.get('brand') || undefined,
    sortBy: 'created',
    sortDir: 'desc',
    inStock: false,
    page: 1,
    limit: 24,
  }));

  // Sync URL params → filters whenever URL changes
  useEffect(() => {
    const q = params.get('q') || undefined;
    const category = params.get('category') || undefined;
    setFilters(f => ({ ...f, q, category, page: 1 }));
  }, [params.get('q'), params.get('category')]);

  const { data, isLoading } = useProducts(filters);
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();

  const setFilter = useCallback((key: keyof ProductFilters, value: any) => {
    setFilters(f => ({ ...f, [key]: value || undefined, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ sortBy: 'created', sortDir: 'desc', page: 1, limit: 24 });
  }, []);

  const handleSort = (val: string) => {
    const [sortBy, sortDir] = val.split(':');
    setFilters(f => ({ ...f, sortBy, sortDir: sortDir as 'asc' | 'desc' }));
  };

  const hasActiveFilters = !!(filters.q || filters.category || filters.brand ||
    filters.minPrice || filters.maxPrice || filters.inStock);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">

        {/* Sidebar */}
        <aside className={cn('w-full md:w-56 flex-shrink-0', showFilters ? 'block' : 'hidden md:block')}>
          <div className="card p-4 space-y-5 sticky top-24">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {t('shop.filters')}
              </h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-brand-primary hover:underline">
                  {t('shop.clearFilters')}
                </button>
              )}
            </div>

            {/* Category */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                {t('shop.category')}
              </p>
              <div className="space-y-0.5">
                <button onClick={() => setFilter('category', undefined)}
                  className={cn('w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors',
                    !filters.category ? 'bg-brand-primary/10 text-brand-primary font-medium' : 'hover:bg-[var(--surface-1)]')}
                  style={{ color: filters.category ? 'var(--text-secondary)' : undefined }}>
                  {t('common.all', 'Бүгд')}
                </button>
                {categories?.map(cat => (
                  <button key={cat.id} onClick={() => setFilter('category', cat.slug)}
                    className={cn('w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between',
                      filters.category === cat.slug ? 'bg-brand-primary/10 text-brand-primary font-medium' : 'hover:bg-[var(--surface-1)]')}
                    style={{ color: filters.category === cat.slug ? undefined : 'var(--text-secondary)' }}>
                    <span>{cat.name}</span>
                    {cat.product_count !== undefined && (
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{cat.product_count}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                {t('shop.brand')}
              </p>
              <div className="space-y-0.5 max-h-44 overflow-y-auto">
                {brands?.map(brand => (
                  <label key={brand.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--surface-1)] cursor-pointer">
                    <input type="checkbox"
                      checked={filters.brand === brand.name}
                      onChange={e => setFilter('brand', e.target.checked ? brand.name : undefined)}
                      className="rounded text-brand-primary w-3.5 h-3.5"
                    />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{brand.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                {t('shop.priceRange')}
              </p>
              <div className="space-y-2">
                <input type="number" placeholder="Min ₮" value={filters.minPrice || ''}
                  onChange={e => setFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                  className="input py-1.5 text-sm" />
                <input type="number" placeholder="Max ₮" value={filters.maxPrice || ''}
                  onChange={e => setFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                  className="input py-1.5 text-sm" />
              </div>
            </div>

            {/* In stock */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={!!filters.inStock}
                onChange={e => setFilter('inStock', e.target.checked)}
                className="rounded text-brand-primary w-4 h-4" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('shop.inStockOnly')}</span>
            </label>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setShowFilters(!showFilters)}
                className="btn-ghost btn-sm md:hidden flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4" /> {t('shop.filters')}
              </button>

              {data && (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {t('shop.results', { count: data.meta?.total || 0 })}
                </p>
              )}

              {/* Active filter chips */}
              {filters.q && (
                <span className="badge-primary flex items-center gap-1 text-xs">
                  🔍 "{filters.q}"
                  <button onClick={() => setFilter('q', undefined)}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.category && (
                <span className="badge-primary flex items-center gap-1 text-xs">
                  {categories?.find(c => c.slug === filters.category)?.name || filters.category}
                  <button onClick={() => setFilter('category', undefined)}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.brand && (
                <span className="badge-primary flex items-center gap-1 text-xs">
                  {filters.brand}
                  <button onClick={() => setFilter('brand', undefined)}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.inStock && (
                <span className="badge-success flex items-center gap-1 text-xs">
                  {t('shop.inStockOnly')}
                  <button onClick={() => setFilter('inStock', false)}><X className="w-3 h-3" /></button>
                </span>
              )}
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">
                  {t('shop.clearFilters')}
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative flex-shrink-0">
              <select onChange={e => handleSort(e.target.value)}
                value={`${filters.sortBy}:${filters.sortDir}`}
                className="input py-2 pr-8 text-sm appearance-none cursor-pointer"
                style={{ width: 'auto', minWidth: 160 }}>
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{t(o.label)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                           style={{ color: 'var(--text-tertiary)' }} />
            </div>
          </div>

          {/* Page title */}
          {filters.category && (
            <h1 className="font-display font-bold text-xl mb-4" style={{ color: 'var(--text-primary)' }}>
              {categories?.find(c => c.slug === filters.category)?.name || filters.category}
            </h1>
          )}
          {filters.q && (
            <h1 className="font-display font-bold text-xl mb-4" style={{ color: 'var(--text-primary)' }}>
              "{filters.q}" {t('shop.results', { count: data?.meta?.total || 0 })}
            </h1>
          )}

          {/* Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {isLoading
              ? Array.from({ length: 24 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : !data?.data?.length
                ? (
                  <div className="col-span-full text-center py-24">
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {t('shop.noProducts')}
                    </p>
                    <button onClick={clearFilters} className="btn-ghost text-sm text-brand-primary mt-3">
                      {t('shop.clearFilters')}
                    </button>
                  </div>
                )
                : data.data.map(p => <ProductCard key={p.id} product={p} />)}
          </div>

          {/* Pagination */}
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button disabled={!data.meta.hasPrev}
                onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) - 1 }))}
                className="btn-ghost btn-sm disabled:opacity-40">
                ← {t('common.previous')}
              </button>
              <span className="text-sm px-3" style={{ color: 'var(--text-secondary)' }}>
                {data.meta.page} / {data.meta.totalPages}
              </span>
              <button disabled={!data.meta.hasNext}
                onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) + 1 }))}
                className="btn-ghost btn-sm disabled:opacity-40">
                {t('common.next')} →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
