import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, ShoppingCart, GitCompare, Star, ChevronLeft, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { useProduct, useProductReviews, useSubmitReview } from '../../hooks';
import { useAddToCart, useToggleWishlist } from '../../hooks';
import { useWishlistStore, useCompareStore, useAuthStore } from '../../store';
import { formatPrice, effectivePrice, discountPercent, groupSpecsByGroup } from '../../utils';
import { ProductCard, ProductCardSkeleton } from '../../components/product/ProductCard';
import { useProducts } from '../../hooks';
import { cn } from '../../utils';
import toast from 'react-hot-toast';

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button key={i} type="button"
          onClick={() => onChange(i + 1)}
          onMouseEnter={() => setHover(i + 1)}
          onMouseLeave={() => setHover(0)}>
          <Star className={cn('w-6 h-6 transition-colors',
            i < (hover || value) ? 'text-amber-400 fill-current' : 'text-gray-300')} />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const { data: product, isLoading } = useProduct(slug!);
  const { data: reviews = [] } = useProductReviews(product?.id || '');
  const { mutate: submitReview, isPending: submittingReview } = useSubmitReview();
  const { mutate: addToCart, isPending } = useAddToCart();
  const { mutate: toggleWishlist } = useToggleWishlist();
  const isWishlisted = useWishlistStore(s => s.has(product?.id || ''));
  const { add: addCompare, has: inCompare } = useCompareStore();
  const { isAuthenticated } = useAuthStore();

  const { data: related } = useProducts({
    category: product?.category_slug,
    limit: 4,
  });

  const [imgIndex, setImgIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews'>('specs');
  const [qty, setQty] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 0, body: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);

  if (isLoading) return <ProductDetailSkeleton />;
  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <p className="text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>Бараа олдсонгүй</p>
      <Link to="/shop" className="btn-primary">← Дэлгүүр рүү буцах</Link>
    </div>
  );

  const name = i18n.language === 'mn' && product.name_mn ? product.name_mn : product.name;
  const description = i18n.language === 'mn' && product.description_mn ? product.description_mn : product.description;
  const price = effectivePrice(product.price, product.sale_price);
  const discount = discountPercent(product.price, product.sale_price);
  const images = product.images?.length ? product.images : (product.image_url ? [{ url: product.image_url, id: 'main' }] : []);
  const specs = product.specs ? groupSpecsByGroup(product.specs) : {};
  const isOutOfStock = product.stock_quantity === 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const avgRating = reviews.length ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0;

  const handleSubmitReview = () => {
    if (!reviewForm.rating) { toast.error('Үнэлгээ өгнө үү'); return; }
    submitReview({
      product_id: product.id,
      rating: reviewForm.rating,
      body: reviewForm.body,
    }, {
      onSuccess: () => {
        setReviewForm({ rating: 0, body: '' });
        setShowReviewForm(false);
      }
    });
  };

  const relatedProducts = related?.data?.filter((p: any) => p.id !== product.id).slice(0, 4) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
        <Link to="/" className="hover:text-brand-primary transition-colors">Нүүр</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-brand-primary transition-colors">Дэлгүүр</Link>
        {product.category_slug && (
          <>
            <span>/</span>
            <Link to={`/shop?category=${product.category_slug}`} className="hover:text-brand-primary transition-colors">
              {product.category_name}
            </Link>
          </>
        )}
        <span>/</span>
        <span style={{ color: 'var(--text-primary)' }} className="truncate max-w-xs">{name}</span>
      </nav>

      {/* Main grid */}
      <div className="grid lg:grid-cols-2 gap-10 mb-14">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden"
               style={{ background: 'var(--surface-1)' }}>
            {images.length > 0 && images[imgIndex]?.url ? (
              <img src={images[imgIndex].url!} alt={name}
                className="w-full h-full object-contain p-6" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">📦</div>
            )}
            {discount && (
              <div className="absolute top-4 left-4 badge-danger text-sm">-{discount}%</div>
            )}
            {images.length > 1 && (
              <>
                <button onClick={() => setImgIndex(i => Math.max(0, i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-white/90 dark:bg-black/50 shadow flex items-center justify-center hover:scale-105 transition-transform">
                  <ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                </button>
                <button onClick={() => setImgIndex(i => Math.min(images.length - 1, i + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-white/90 dark:bg-black/50 shadow flex items-center justify-center hover:scale-105 transition-transform">
                  <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img: any, i: number) => (
                <button key={img.id} onClick={() => setImgIndex(i)}
                  className={cn('w-16 h-16 rounded-xl border-2 flex-shrink-0 overflow-hidden transition-all',
                    i === imgIndex ? 'border-brand-primary' : 'border-transparent hover:border-brand-primary/40')}>
                  <img src={img.url!} alt="" className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
              {product.brand_name}
            </p>
            <h1 className="font-display font-bold text-2xl md:text-3xl leading-tight"
                style={{ color: 'var(--text-primary)' }}>
              {name}
            </h1>

            {/* Rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn('w-4 h-4', i < Math.round(avgRating) ? 'text-amber-400 fill-current' : 'text-gray-300')} />
                  ))}
                </div>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {avgRating.toFixed(1)} ({reviews.length} сэтгэгдэл)
                </span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="font-display font-bold text-3xl text-brand-primary">{formatPrice(price)}</span>
            {product.sale_price && (
              <span className="text-lg line-through mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {formatPrice(product.price)}
              </span>
            )}
            {discount && <span className="badge-danger">-{discount}%</span>}
          </div>

          {/* Stock status */}
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full',
              isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500')} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {isOutOfStock
                ? 'Нөөц дууссан'
                : isLowStock
                  ? `Зөвхөн ${product.stock_quantity} ширхэг үлдсэн`
                  : 'Нөөцтэй'}
            </span>
          </div>

          {/* Key specs preview */}
          {product.specs && product.specs.slice(0, 4).map((s: any) => (
            <div key={s.id || s.spec_key} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {s.spec_key || s.key}:
                </strong>{' '}
                {s.spec_value || s.value}
              </span>
            </div>
          ))}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border rounded-xl px-2 py-2"
                 style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-lg font-medium"
                style={{ color: 'var(--text-primary)' }}>−</button>
              <span className="w-10 text-center font-semibold" style={{ color: 'var(--text-primary)' }}>{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-lg font-medium"
                style={{ color: 'var(--text-primary)' }}>+</button>
            </div>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Нийт: {formatPrice(price * qty)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button
              disabled={isOutOfStock || isPending}
              onClick={() => addToCart({ productId: product.id, quantity: qty })}
              className="btn-primary flex items-center gap-2 flex-1 min-w-40 justify-center disabled:opacity-50">
              <ShoppingCart className="w-4 h-4" />
              {isOutOfStock ? 'Нөөц дууссан' : 'Сагсанд нэмэх'}
            </button>
            <button
              onClick={() => isAuthenticated && toggleWishlist(product.id)}
              className={cn('w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all',
                isWishlisted ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'hover:border-red-400')}
              style={{ borderColor: isWishlisted ? undefined : 'var(--border)' }}>
              <Heart className={cn('w-5 h-5', isWishlisted ? 'text-red-500 fill-current' : '')}
                     style={{ color: isWishlisted ? undefined : 'var(--text-secondary)' }} />
            </button>
            <button
              onClick={() => addCompare(product)}
              className={cn('w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all',
                inCompare(product.id) ? 'border-brand-primary bg-brand-primary/10' : 'hover:border-brand-primary')}
              style={{ borderColor: inCompare(product.id) ? undefined : 'var(--border)' }}
              title="Харьцуулах">
              <GitCompare className={cn('w-5 h-5', inCompare(product.id) ? 'text-brand-primary' : '')}
                          style={{ color: inCompare(product.id) ? undefined : 'var(--text-secondary)' }} />
            </button>
          </div>

          {inCompare(product.id) && (
            <Link to="/compare" className="text-xs text-brand-primary hover:underline flex items-center gap-1">
              → Харьцуулах хуудас руу очих
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-10">
        <div className="flex gap-1 border-b mb-6" style={{ borderColor: 'var(--border)' }}>
          {[
            { id: 'specs', label: 'Техникийн үзүүлэлт' },
            { id: 'reviews', label: `Сэтгэгдэл (${reviews.length})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={cn('px-5 py-3 text-sm font-medium -mb-px border-b-2 transition-colors',
                activeTab === tab.id ? 'border-brand-primary text-brand-primary' : 'border-transparent hover:text-brand-primary')}
              style={{ color: activeTab === tab.id ? undefined : 'var(--text-secondary)' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Specs tab */}
        {activeTab === 'specs' && (
          <div className="space-y-6">
            {description && (
              <div className="card p-5">
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Тайлбар</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{description}</p>
              </div>
            )}
            {Object.entries(specs).length > 0 ? (
              Object.entries(specs).map(([group, items]) => (
                <div key={group}>
                  <h4 className="font-semibold text-sm mb-3 text-brand-primary">{group}</h4>
                  <div className="card overflow-hidden">
                    {(items as any[]).map((s, i) => (
                      <div key={i} className={cn('flex text-sm', i > 0 && 'border-t')}
                           style={{ borderColor: 'var(--border)' }}>
                        <div className="w-44 px-4 py-3 font-medium flex-shrink-0"
                             style={{ background: 'var(--surface-1)', color: 'var(--text-secondary)' }}>
                          {s.key}
                        </div>
                        <div className="px-4 py-3 flex-1" style={{ color: 'var(--text-primary)' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                Техникийн үзүүлэлт байхгүй байна
              </p>
            )}
          </div>
        )}

        {/* Reviews tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {/* Write review button */}
            {isAuthenticated && !showReviewForm && (
              <button onClick={() => setShowReviewForm(true)} className="btn-secondary">
                Сэтгэгдэл бичих
              </button>
            )}

            {/* Review form */}
            {showReviewForm && (
              <div className="card p-5 space-y-4">
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Сэтгэгдэл бичих</h3>
                <div>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Үнэлгээ:</p>
                  <StarInput value={reviewForm.rating} onChange={v => setReviewForm(f => ({ ...f, rating: v }))} />
                </div>
                <textarea
                  value={reviewForm.body}
                  onChange={e => setReviewForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Энэ бүтээгдэхүүний талаар туршлагаа хуваалцаарай..."
                  rows={4}
                  className="input text-sm resize-none"
                />
                <div className="flex gap-3">
                  <button onClick={handleSubmitReview} disabled={submittingReview} className="btn-primary px-6">
                    {submittingReview ? 'Илгээж байна...' : 'Илгээх'}
                  </button>
                  <button onClick={() => setShowReviewForm(false)} className="btn-ghost px-6">Болих</button>
                </div>
              </div>
            )}

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <div className="text-center py-10">
                <Star className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Сэтгэгдэл байхгүй байна. Эхний сэтгэгдэл үлдээгээрэй!</p>
              </div>
            ) : (
              reviews.map((r: any) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-primary text-sm font-bold">{r.user_name?.[0]}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{r.user_name}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn('w-3.5 h-3.5', i < r.rating ? 'text-amber-400 fill-current' : 'text-gray-300')} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {r.body && <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{r.body}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-xl mb-5" style={{ color: 'var(--text-primary)' }}>
            Төстэй бараанууд
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-12">
      <div className="skeleton aspect-square rounded-2xl" />
      <div className="space-y-4">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-8 w-3/4 rounded" />
        <div className="skeleton h-9 w-32 rounded" />
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-4 w-full rounded" />)}
        <div className="skeleton h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}
