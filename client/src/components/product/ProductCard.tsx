import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, GitCompare, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { Product } from '../../types';
import { formatPrice, effectivePrice, discountPercent, cn, imgUrl } from '../../utils';
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
      className={cn('group relative flex flex-col overflow-hidden rounded-2xl border bg-[var(--surface-0)]', className)}
      style={{
        borderColor: 'var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(108,99,255,0.12)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(108,99,255,0.3)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
      }}
    >
      <Link to={`/products/${product.slug}`} className="flex flex-col flex-1">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden" style={{ background: 'var(--surface-1)' }}>
          {product.image_url ? (
            <img
              src={imgUrl(product.image_url)}
              alt={displayName}
              className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="w-12 h-12" style={{ color: 'var(--text-tertiary)' }} />
            </div>
          )}

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="badge-danger text-xs font-bold">
                -{discount}%
              </motion.span>
            )}
            {isLowStock && <span className="badge-warning text-xs">{t('product.lowStock', { count: product.stock_quantity })}</span>}
            {isOutOfStock && <span className="badge-gray text-xs">{t('product.outOfStock')}</span>}
          </div>

          {/* Action buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 translate-x-10 group-hover:translate-x-0 transition-transform duration-300">
            <motion.button onClick={handleWishlist} whileTap={{ scale: 0.85 }}
              className={cn('w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition-all',
                isWishlisted
                  ? 'bg-red-500 text-white'
                  : 'bg-[var(--surface-0)] text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-500')}>
              <Heart className={cn('w-3.5 h-3.5', isWishlisted && 'fill-current')} />
            </motion.button>
            <motion.button onClick={handleCompare} whileTap={{ scale: 0.85 }}
              className={cn('w-8 h-8 rounded-xl flex items-center justify-center shadow-md transition-all',
                inComp
                  ? 'bg-brand-primary text-white'
                  : 'bg-[var(--surface-0)] text-[var(--text-secondary)] hover:bg-brand-primary/10 hover:text-brand-primary')}>
              <GitCompare className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1 gap-1">
          <p className="text-xs font-medium tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            {product.brand_name}
          </p>
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-brand-primary transition-colors duration-200"
            style={{ color: 'var(--text-primary)' }}>
            {displayName}
          </h3>

          <div className="mt-auto pt-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-base font-bold text-brand-primary">{formatPrice(price)}</p>
              {product.sale_price && (
                <p className="text-xs line-through" style={{ color: 'var(--text-tertiary)' }}>
                  {formatPrice(product.price)}
                </p>
              )}
            </div>

            <motion.button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAddingCart}
              whileTap={{ scale: 0.88 }}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative overflow-hidden',
                isOutOfStock
                  ? 'bg-[var(--surface-2)] cursor-not-allowed'
                  : 'bg-brand-primary hover:brightness-110 shadow-sm hover:shadow-md'
              )}
              style={!isOutOfStock ? { boxShadow: '0 4px 12px rgba(108,99,255,0.35)' } : {}}>
              {isAddingCart
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <ShoppingCart className={cn('w-4 h-4', isOutOfStock ? 'text-[var(--text-tertiary)]' : 'text-white')} />}
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="skeleton aspect-square" />
      <div className="p-4 space-y-2.5">
        <div className="skeleton h-3 w-14 rounded-full" />
        <div className="skeleton h-4 w-full rounded-lg" />
        <div className="skeleton h-4 w-2/3 rounded-lg" />
        <div className="flex justify-between items-center pt-2">
          <div className="skeleton h-5 w-20 rounded-lg" />
          <div className="skeleton w-10 h-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
