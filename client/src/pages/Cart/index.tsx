// ─── CART PAGE ─────────────────────────────────────────────────────────────
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Trash2, ShoppingBag } from 'lucide-react';
import { useCart, useUpdateCartItem, useRemoveCartItem } from '../../hooks';
import { formatPrice, effectivePrice } from '../../utils';

export default function CartPage() {
  const { t, i18n } = useTranslation();
  const { data: cart, isLoading } = useCart();
  const { mutate: update } = useUpdateCartItem();
  const { mutate: remove } = useRemoveCartItem();

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="skeleton h-64 rounded-2xl" /></div>;

  const items = cart?.items || [];

  if (!items.length) return (
    <div className="max-w-4xl mx-auto px-4 py-24 text-center">
      <ShoppingBag className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
      <p className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>{t('cart.empty')}</p>
      <Link to="/shop" className="btn-primary">{t('cart.continueShopping')}</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display font-bold text-2xl mb-8" style={{ color: 'var(--text-primary)' }}>{t('cart.title')}</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => {
            const name = i18n.language === 'mn' && item.name_mn ? item.name_mn : item.name;
            const price = effectivePrice(item.price, item.sale_price);
            return (
              <div key={item.id} className="card p-4 flex gap-4">
                <Link to={`/products/${item.slug}`}
                  className="w-20 h-20 rounded-xl bg-[var(--surface-1)] flex-shrink-0 overflow-hidden">
                  {item.image_url
                    ? <img src={(item.image_url)} alt={name} className="w-full h-full object-contain p-1" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.slug}`}
                    className="font-medium text-sm hover:text-brand-primary transition-colors" style={{ color: 'var(--text-primary)' }}>
                    {name}
                  </Link>
                  <p className="text-brand-primary font-bold mt-1">{formatPrice(price)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => remove(item.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 border rounded-lg px-2 py-1" style={{ borderColor: 'var(--border)' }}>
                    <button onClick={() => update({ itemId: item.id, quantity: item.quantity - 1 })} className="w-5 h-5 flex items-center justify-center text-sm">−</button>
                    <span className="text-sm w-6 text-center" style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                    <button onClick={() => update({ itemId: item.id, quantity: item.quantity + 1 })} className="w-5 h-5 flex items-center justify-center text-sm">+</button>
                  </div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {formatPrice(price * item.quantity)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="card p-6 h-fit space-y-4">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('cart.subtotal')}</h3>
          <div className="flex justify-between text-lg font-bold">
            <span style={{ color: 'var(--text-primary)' }}>Total</span>
            <span className="text-brand-primary">{formatPrice(cart?.total || 0)}</span>
          </div>
          <Link to="/checkout" className="btn-primary w-full">{t('cart.checkout')}</Link>
          <Link to="/shop" className="btn-ghost w-full text-center text-sm">{t('cart.continueShopping')}</Link>
        </div>
      </div>
    </div>
  );
}
