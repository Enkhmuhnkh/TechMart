import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { Product } from '../../types';
import { formatPrice, effectivePrice, discountPercent, cn, imgUrl } from '../../utils';
import { useAddToCart, useToggleWishlist } from '../../hooks';
import { useWishlistStore, useAuthStore, useUIStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CATEGORY_EMOJI: Record<string, string> = {
  laptops:'💻', phones:'📱', tablets:'📟', monitors:'🖥️',
  keyboards:'⌨️', mice:'🖱️', earbuds:'🎧', headphones:'🎧',
  smartwatches:'⌚', gpus:'🎮', storage:'💾', accessories:'📦',
};

interface Props { product: Product; className?: string; }

export function ProductCard({ product, className }: Props) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { theme } = useUIStore();
  const { mutate: addToCart, isPending } = useAddToCart();
  const { mutate: toggleWishlist } = useToggleWishlist();
  const isWishlisted = useWishlistStore(s => s.has(product.id));

  const name = i18n.language === 'mn' && product.name_mn ? product.name_mn : product.name;
  const price = effectivePrice(product.price, product.sale_price);
  const discount = discountPercent(product.price, product.sale_price);
  const outOfStock = product.stock_quantity === 0;
  const emoji = CATEGORY_EMOJI[product.category_slug || ''] || '📦';

  const handleCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (outOfStock) return;
    addToCart({ productId: product.id });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    toggleWishlist(product.id);
  };

  return (
    <motion.div
      className={cn('product-card group', className)}
      whileHover={{ y: -7, scale: 1.01 }}
      whileTap={{ scale: 0.98, y: -2 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = 'transparent';
        el.style.boxShadow = theme === 'dark'
          ? '0 20px 48px rgba(200,255,87,0.06), 0 0 0 0.5px rgba(200,255,87,0.15)'
          : '0 20px 48px rgba(12,12,15,0.1), 0 0 0 0.5px rgba(12,12,15,0.06)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = '';
        el.style.boxShadow = '';
      }}
    >
      <Link to={`/products/${product.slug}`} className="flex flex-col">

        {/* Image */}
        <div className="img-wrap relative aspect-square" style={{ background: 'var(--bg-2)' }}>
          {product.image_url ? (
            <img
              src={imgUrl(product.image_url)}
              alt={name}
              loading="lazy"
              className="w-full h-full object-contain p-4"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl opacity-40">{emoji}</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {discount && (
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="mono text-xs font-medium px-2 py-0.5 rounded-md text-white"
                style={{ background: 'var(--red)', fontSize: '10px' }}
              >
                -{discount}%
              </motion.span>
            )}
            {outOfStock && (
              <span className="badge badge-gray text-xs">Дууссан</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="card-actions absolute top-2.5 right-2.5 flex flex-col gap-1.5">
            <motion.button
              onClick={handleWishlist}
              whileTap={{ scale: 0.82 }}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: isWishlisted ? 'var(--red)' : 'var(--bg)',
                border: `0.5px solid ${isWishlisted ? 'var(--red)' : 'var(--line-strong)'}`,
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <Heart
                className="w-3.5 h-3.5"
                style={{ color: isWishlisted ? 'white' : 'var(--ink-3)' }}
                fill={isWishlisted ? 'white' : 'none'}
              />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.82 }}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'var(--bg)',
                border: '0.5px solid var(--line-strong)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <Eye className="w-3.5 h-3.5" style={{ color: 'var(--ink-3)' }} />
            </motion.button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-2.5">
          <div>
            <p className="eyebrow mb-1">{product.brand_name}</p>
            <h3
              className="text-sm font-medium leading-snug line-clamp-2 tracking-tight"
              style={{ color: 'var(--ink)', fontFamily: "'DM Sans', sans-serif" }}
            >
              {name}
            </h3>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="price text-base">{formatPrice(price)}</p>
              {product.sale_price && (
                <p className="mono text-xs line-through" style={{ color: 'var(--ink-4)', fontSize: '11px' }}>
                  {formatPrice(product.price)}
                </p>
              )}
            </div>

            <motion.button
              onClick={handleCart}
              disabled={outOfStock || isPending}
              whileTap={{ scale: 0.85 }}
              className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 disabled:opacity-30 transition-all ripple-btn"
              style={{
                background: outOfStock ? 'var(--bg-3)' : theme === 'dark' ? '#6366F1' : 'var(--ink)',
                boxShadow: outOfStock ? 'none' : theme === 'dark' ? '0 4px 16px rgba(99,102,241,0.4)' : 'var(--shadow-sm)',
              }}
            >
              {isPending ? (
                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"
                  style={{ color: 'white' }} />
              ) : (
                <ShoppingCart
                  className="w-4 h-4"
                  style={{ color: outOfStock ? 'var(--ink-4)' : 'white' }}
                />
              )}
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-[20px] overflow-hidden border" style={{ borderColor: 'var(--line-strong)' }}>
      <div className="skeleton" style={{ aspectRatio: '1', background: 'var(--bg-2)' }} />
      <div className="p-4 space-y-2.5">
        <div className="skeleton h-2.5 w-14 rounded-full" />
        <div className="skeleton h-4 w-full rounded-lg" />
        <div className="skeleton h-3.5 w-2/3 rounded-lg" />
        <div className="flex justify-between items-center pt-1">
          <div className="skeleton h-5 w-24 rounded-lg" />
          <div className="skeleton w-9 h-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
