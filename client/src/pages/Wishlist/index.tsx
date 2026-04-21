import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi, cartApi } from '../../api';
import { formatPrice, effectivePrice, discountPercent } from '../../utils';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '../../store';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function WishlistPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const { toggle } = useWishlistStore();

  const { data: items, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistApi.get,
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.remove(productId),
    onMutate: (productId) => toggle(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Хасагдлаа');
    },
    onError: (_, productId) => toggle(productId),
  });

  const addCartMutation = useMutation({
    mutationFn: (productId: string) => cartApi.addItem(productId, 1),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Сагсанд нэмэгдлээ 🛒');
    },
    onError: () => toast.error('Алдаа гарлаа'),
  });

  const handleAddAllToCart = async () => {
    if (!items?.length) return;
    for (const item of items) {
      if (item.stock_quantity > 0) {
        await cartApi.addItem(item.product_id, 1);
      }
    }
    qc.invalidateQueries({ queryKey: ['cart'] });
    toast.success('Бүгд сагсанд нэмэгдлээ 🛒');
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="skeleton h-8 w-48 rounded-xl mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
            {t('nav.wishlist')}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {items?.length || 0} бараа хадгалагдсан
          </p>
        </div>
        {items && items.length > 0 && (
          <button onClick={handleAddAllToCart}
            className="btn-primary flex items-center gap-2 text-sm">
            <ShoppingCart className="w-4 h-4" />
            Бүгдийг сагсанд нэмэх
          </button>
        )}
      </div>

      {/* Empty state */}
      {!items?.length && (
        <div className="text-center py-24">
          <div className="w-24 h-24 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
            Хадгалсан бараа байхгүй байна
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Таалагдсан бараандаа ❤️ дарж хадгалаарай
          </p>
          <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
            Дэлгүүр хэсэх <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Wishlist grid */}
      <AnimatePresence>
        {items && items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item: any) => {
              const name = i18n.language === 'mn' && item.name_mn ? item.name_mn : item.name;
              const price = effectivePrice(item.price, item.sale_price);
              const discount = discountPercent(item.price, item.sale_price);
              const isOutOfStock = item.stock_quantity === 0;

              return (
                <motion.div key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="card group overflow-hidden flex flex-col">

                  {/* Image */}
                  <Link to={`/products/${item.slug}`} className="relative aspect-square block bg-[var(--surface-1)] overflow-hidden">
                    {item.image_url
                      ? <img src={(item.image_url)} alt={name} className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105" />
                      : <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {discount && <span className="badge-danger text-xs">-{discount}%</span>}
                      {isOutOfStock && <span className="badge-gray text-xs">Дууссан</span>}
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={(e) => { e.preventDefault(); removeMutation.mutate(item.product_id); }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/30 shadow-sm">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </Link>

                  {/* Info */}
                  <div className="p-3 flex flex-col flex-1 gap-1">
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.brand_name}</p>
                    <Link to={`/products/${item.slug}`}>
                      <h3 className="text-sm font-medium leading-snug line-clamp-2 hover:text-brand-primary transition-colors"
                          style={{ color: 'var(--text-primary)' }}>
                        {name}
                      </h3>
                    </Link>

                    <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm text-brand-primary">{formatPrice(price)}</p>
                        {item.sale_price && (
                          <p className="text-xs line-through" style={{ color: 'var(--text-tertiary)' }}>
                            {formatPrice(item.price)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => addCartMutation.mutate(item.product_id)}
                        disabled={isOutOfStock || addCartMutation.isPending}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-brand-primary hover:brightness-110 active:scale-95">
                        <ShoppingCart className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Continue shopping */}
      {items && items.length > 0 && (
        <div className="text-center mt-10">
          <Link to="/shop" className="btn-ghost inline-flex items-center gap-2 text-sm text-brand-primary">
            Дэлгүүр үргэлжлүүлэх <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
