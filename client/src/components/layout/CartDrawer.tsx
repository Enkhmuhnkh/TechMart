import { X, ShoppingCart, Trash2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCartStore } from '../../store';
import { formatPrice, effectivePrice } from '../../utils';
import { useUpdateCartItem, useRemoveCartItem } from '../../hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

export function CartDrawer() {
  const cart = useCartStore(s => s.cart);
  const isOpen = useCartStore(s => s.isOpen);
  const closeCart = useCartStore(s => s.closeCart);
  const { mutate: update } = useUpdateCartItem();
  const { mutate: remove } = useRemoveCartItem();
  const navigate = useNavigate();
  const location = useLocation();
  const items = cart?.items || [];

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeCart]);

  // Close when route changes
  useEffect(() => {
    closeCart();
  }, [location.pathname]);

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.45)' }}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm z-50 flex flex-col"
            style={{ background: 'var(--surface-0)', boxShadow: '-4px 0 30px rgba(0,0,0,0.15)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
                 style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                  Миний сагс
                </h2>
                {items.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors"
              >
                <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                       style={{ background: 'var(--surface-2)' }}>
                    <ShoppingCart className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                  <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Сагс хоосон байна</p>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Бараа нэмж эхлээрэй</p>
                  <button onClick={closeCart} className="btn-primary btn-sm">
                    Дэлгүүр хэсэх
                  </button>
                </div>
              ) : (
                items.map(item => {
                  const price = effectivePrice(item.price, item.sale_price);
                  return (
                    <div key={item.id} className="flex gap-3 py-2">
                      <Link to={`/products/${item.slug}`} onClick={closeCart}
                        className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden"
                        style={{ background: 'var(--surface-1)' }}>
                        {item.image_url
                          ? <img src={(item.image_url)} alt={item.name} className="w-full h-full object-contain p-1" />
                          : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link to={`/products/${item.slug}`} onClick={closeCart}>
                          <p className="text-sm font-medium leading-snug line-clamp-2 hover:text-brand-primary transition-colors"
                             style={{ color: 'var(--text-primary)' }}>
                            {item.name}
                          </p>
                        </Link>
                        <p className="text-sm font-bold text-brand-primary mt-0.5">
                          {formatPrice(price)}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 border rounded-lg px-1"
                               style={{ borderColor: 'var(--border)' }}>
                            <button
                              onClick={() => update({ itemId: item.id, quantity: item.quantity - 1 })}
                              className="w-6 h-6 flex items-center justify-center text-sm hover:text-brand-primary transition-colors"
                              style={{ color: 'var(--text-secondary)' }}>−</button>
                            <span className="w-6 text-center text-sm font-medium"
                                  style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                            <button
                              onClick={() => update({ itemId: item.id, quantity: item.quantity + 1 })}
                              disabled={item.quantity >= item.stock_quantity}
                              className="w-6 h-6 flex items-center justify-center text-sm hover:text-brand-primary transition-colors disabled:opacity-30"
                              style={{ color: 'var(--text-secondary)' }}>+</button>
                          </div>
                          <button
                            onClick={() => remove(item.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-5 py-4 border-t flex-shrink-0 space-y-3"
                   style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Нийт дүн</span>
                  <span className="font-bold text-lg text-brand-primary">{formatPrice(cart?.total || 0)}</span>
                </div>
                <button onClick={handleCheckout} className="btn-primary w-full text-sm">
                  Захиалга хийх
                </button>
                <Link to="/cart" onClick={closeCart}
                  className="block text-center text-sm hover:text-brand-primary transition-colors"
                  style={{ color: 'var(--text-secondary)' }}>
                  Сагс харах →
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
