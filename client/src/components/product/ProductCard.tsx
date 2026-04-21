import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, GitCompare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { Product } from '../../types';
import { formatPrice, effectivePrice, discountPercent, cn } from '../../utils';
import { useAddToCart, useToggleWishlist } from '../../hooks';
import { useWishlistStore, useCompareStore, useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { mutate: addToCart, isPending: isAddingCart } = useAddToCart();
  const { mutate: toggleWishlist } = useToggleWishlist();
  const isWishlisted = useWishlistStore(s => s.has(product.id));
  const { add: addCompare, remove: removeCompare, has: inCompare } = useCompareStore();

  const displayName = i18n.language === 'mn' && product.name_mn ? product.name_mn : product.name;
  const price = effectivePrice(product.price, product.sale_price);
  const discount = discountPercent(product.price, product.sale_price);
  const isOutOfStock = product.stock_quantity === 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const inComp = inCompare(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (isOutOfStock) return;
    addToCart({ productId: product.id });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    toggleWishlist(product.id);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inComp) { removeCompare(product.id); return; }
    try { addCompare(product); }
    catch { toast.error(t('compare.maxItems')); }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.15 }}
      className={cn('card group relative flex flex-col overflow-hidden', className)}
    >
      <Link to={`/products/${product.slug}`} className="flex flex-col flex-1">
        {/* Image */}
        <div className="relative aspect-square bg-[var(--surface-1)] overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={displayName}
              className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="w-12 h-12" style={{ color: 'var(--text-tertiary)' }} />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount && <span className="badge-danger">{discount}% OFF</span>}
            {isLowStock && <span className="badge-warning">{t('product.lowStock', { count: product.stock_quantity })}</span>}
            {isOutOfStock && <span className="badge-gray">{t('product.outOfStock')}</span>}
          </div>

          {/* Action buttons on hover */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleWishlist}
              className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm',
                isWishlisted
                  ? 'bg-red-50 text-red-500 dark:bg-red-900/30'
                  : 'bg-[var(--surface-0)] text-[var(--text-secondary)] hover:text-red-500')}>
              <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
            </button>
            <button onClick={handleCompare}
              className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm',
                inComp
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'bg-[var(--surface-0)] text-[var(--text-secondary)] hover:text-brand-primary')}>
              <GitCompare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1 gap-1">
          <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {product.brand_name}
          </p>
          <h3 className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
            {displayName}
          </h3>
          <div className="mt-auto pt-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-base font-bold text-brand-primary">
                {formatPrice(price)}
              </p>
              {product.sale_price && (
                <p className="text-xs line-through" style={{ color: 'var(--text-tertiary)' }}>
                  {formatPrice(product.price)}
                </p>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAddingCart}
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                isOutOfStock
                  ? 'bg-[var(--surface-2)] cursor-not-allowed'
                  : 'bg-brand-primary hover:brightness-110 active:scale-95'
              )}
            >
              <ShoppingCart className={cn('w-4 h-4', isOutOfStock ? 'text-[var(--text-tertiary)]' : 'text-white')} />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-square" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="flex justify-between pt-2">
          <div className="skeleton h-5 w-20 rounded" />
          <div className="skeleton w-9 h-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
