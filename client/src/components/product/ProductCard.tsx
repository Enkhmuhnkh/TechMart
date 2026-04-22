import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, GitCompare, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { Product } from '../../types';
import { formatPrice, effectivePrice, discountPercent, cn, imgUrl } from '../../utils';
import { useAddToCart, useToggleWishlist } from '../../hooks';
import { useWishlistStore, useCompareStore, useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface ProductCardProps { product: Product; className?: string; }

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
    try { addCompare(product); } catch { toast.error(t('compare.maxItems')); }
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn('group relative flex flex-col overflow-hidden rounded-2xl bg-[var(--surface-0)]', className)}
      style={{ border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 0.3s ease, border-color 0.3s ease' }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = '0 16px 40px rgba(108,99,255,0.15), 0 0 0 1px rgba(108,99,255,0.2)';
        el.style.borderColor = 'rgba(108,99,255,0.25)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
        el.style.borderColor = 'var(--border)';
      }}
    >
      <Link to={`/products/${product.slug}`} className="flex flex-col flex-1">
        {/* Image area */}
        <div className="relative aspect-square overflow-hidden img-zoom" style={{ background: 'var(--surface-1)' }}>
          {product.image_url ? (
            <img src={imgUrl(product.image_url)} alt={displayName}
              className="w-full h-full object-contain p-4" loading="lazy" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <span className="text-4xl">{product.category_slug ? CATEGORY_ICONS[product.category_slug] || '📦' : '📦'}</span>
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {discount && (
              <span className="badge-danger text-xs font-bold shadow-sm animate-scale-in">
                -{discount}%
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="badge-warning text-xs shadow-sm">
                {product.stock_quantity} үлдсэн
              </span>
            )}
            {isOutOfStock && (
              <span className="badge-gray text-xs shadow-sm">{t('product.outOfStock')}</span>
            )}
          </div>

          {/* Action buttons - slide in from right */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
            <motion.button onClick={handleWishlist} whileTap={{ scale: 0.85 }}
              title="Хадгалах"
              className={cn('w-8 h-8 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-200',
                isWishlisted ? 'bg-red-500 text-white' : 'bg-white/90 dark:bg-gray-800/90 text-gray-500 hover:bg-red-50 hover:text-red-500')}>
              <Heart className={cn('w-3.5 h-3.5', isWishlisted && 'fill-current')} />
            </motion.button>
            <motion.button onClick={handleCompare} whileTap={{ scale: 0.85 }}
              title="Харьцуулах"
              className={cn('w-8 h-8 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-200',
                inComp ? 'bg-brand-primary text-white' : 'bg-white/90 dark:bg-gray-800/90 text-gray-500 hover:bg-brand-primary/10 hover:text-brand-primary')}>
              <GitCompare className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.85 }}
              title="Харах"
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 text-gray-500 hover:bg-brand-primary/10 hover:text-brand-primary transition-all duration-200">
              <Eye className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1 gap-1.5">
          <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-tertiary)' }}>
            {product.brand_name}
          </p>
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-brand-primary transition-colors duration-200"
            style={{ color: 'var(--text-primary)' }}>
            {displayName}
          </h3>

          <div className="mt-auto pt-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-base font-bold" style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {formatPrice(price)}
              </p>
              {product.sale_price && (
                <p className="text-xs line-through" style={{ color: 'var(--text-tertiary)' }}>
                  {formatPrice(product.price)}
                </p>
              )}
            </div>

            <motion.button onClick={handleAddToCart}
              disabled={isOutOfStock || isAddingCart}
              whileTap={{ scale: 0.88 }}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0',
                isOutOfStock ? 'cursor-not-allowed' : 'hover:brightness-110'
              )}
              style={!isOutOfStock ? {
                background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
                boxShadow: '0 4px 14px rgba(108,99,255,0.4)',
              } : { background: 'var(--surface-2)' }}>
              {isAddingCart
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <ShoppingCart className={cn('w-4 h-4', isOutOfStock ? '' : 'text-white')}
                    style={isOutOfStock ? { color: 'var(--text-tertiary)' } : {}} />}
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

const CATEGORY_ICONS: Record<string, string> = {
  laptops: '💻', phones: '📱', tablets: '📟', monitors: '🖥️',
  keyboards: '⌨️', mice: '🖱️', earbuds: '🎧', headphones: '🎧',
  smartwatches: '⌚', gpus: '🎮', storage: '💾', accessories: '📦',
};

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="skeleton aspect-square" />
      <div className="p-4 space-y-2.5">
        <div className="skeleton h-2.5 w-12 rounded-full" />
        <div className="skeleton h-4 w-full rounded-lg" />
        <div className="skeleton h-4 w-2/3 rounded-lg" />
        <div className="flex justify-between items-center pt-2">
          <div className="skeleton h-5 w-24 rounded-lg" />
          <div className="skeleton w-10 h-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
