import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart, usePlaceOrder } from '../../hooks';
import { useCartStore } from '../../store';
import { formatPrice, effectivePrice } from '../../utils';
import { ShoppingBag, MapPin, CreditCard, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { cn } from '../../utils';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Бэлэн мөнгө', sublabel: 'Хүргэлтийн үед төлнө', icon: '💵' },
  { id: 'qpay', label: 'QPay', sublabel: 'QR кодоор төлнө', icon: '📱' },
  { id: 'card', label: 'Карт', sublabel: 'Visa / Mastercard', icon: '💳' },
];

const DISTRICTS = [
  'Баянгол', 'Баянзүрх', 'Сүхбаатар', 'Чингэлтэй', 'Хан-Уул',
  'Налайх', 'Багануур', 'Багахангай', 'Сонгинохайрхан',
];

type Step = 'shipping' | 'payment' | 'confirm';

export default function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: cart, isLoading } = useCart();
  const cartStore = useCartStore();
  const closeCart = useCartStore(s => s.closeCart);
  const items = cartStore.cart?.items || cart?.items || [];
  const total = cartStore.cart?.total || cart?.total || 0;

  // Close cart drawer when checkout page opens
  useEffect(() => {
    closeCart();
  }, []);

  const [step, setStep] = useState<Step>('shipping');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [address, setAddress] = useState({
    full_name: '',
    phone: '',
    city: 'Улаанбаатар',
    district: 'Баянгол',
    address: '',
  });

  const { mutate: placeOrder, isPending } = usePlaceOrder();

  const setAddr = (k: string, v: string) => setAddress(a => ({ ...a, [k]: v }));

  const validateShipping = () => {
    if (!address.full_name.trim()) { toast.error('Нэрээ оруулна уу'); return false; }
    if (!address.phone.trim()) { toast.error('Утасны дугаараа оруулна уу'); return false; }
    if (!address.address.trim()) { toast.error('Хаягаа оруулна уу'); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 'shipping') {
      if (!validateShipping()) return;
      setStep('payment');
    } else if (step === 'payment') {
      setStep('confirm');
    }
  };

  const handlePlaceOrder = () => {
    placeOrder(
      { shipping_address: address, payment_method: paymentMethod },
      { onSuccess: (order: any) => navigate(`/orders/${order.id}`) }
    );
  };

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="skeleton h-8 w-48 rounded-xl mb-8" />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 skeleton h-80 rounded-2xl" />
        <div className="skeleton h-60 rounded-2xl" />
      </div>
    </div>
  );

  if (!items.length) return (
    <div className="max-w-5xl mx-auto px-4 py-24 text-center">
      <ShoppingBag className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
      <h2 className="font-display font-bold text-xl mb-3" style={{ color: 'var(--text-primary)' }}>Сагс хоосон байна</h2>
      <Link to="/shop" className="btn-primary inline-flex items-center gap-2">Дэлгүүр хэсэх</Link>
    </div>
  );

  const STEPS = [
    { id: 'shipping', label: 'Хаяг', icon: MapPin },
    { id: 'payment', label: 'Төлбөр', icon: CreditCard },
    { id: 'confirm', label: 'Баталгаажуулах', icon: Check },
  ];

  const stepIndex = STEPS.findIndex(s => s.id === step);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/cart" className="btn-ghost rounded-xl p-2">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </Link>
        <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
          {t('checkout.title')}
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                done ? 'bg-brand-primary' : active ? 'bg-brand-primary' : 'bg-[var(--surface-2)]'
              )}>
                {done
                  ? <Check className="w-4 h-4 text-white" />
                  : <Icon className={cn('w-4 h-4', active ? 'text-white' : '')} style={{ color: active ? undefined : 'var(--text-tertiary)' }} />}
              </div>
              <span className={cn('text-sm font-medium hidden sm:block', active ? 'text-brand-primary' : '')}
                    style={{ color: active ? undefined : done ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="w-8 sm:w-16 h-0.5 mx-1" style={{ background: done ? 'var(--brand-primary, #6C63FF)' : 'var(--border)' }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left — form */}
        <div className="md:col-span-2 space-y-4">

          {/* STEP 1: Хүргэлтийн хаяг */}
          {step === 'shipping' && (
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <MapPin className="w-5 h-5 text-brand-primary" /> {t('checkout.shippingInfo')}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    {t('checkout.fullName')} *
                  </label>
                  <input value={address.full_name} onChange={e => setAddr('full_name', e.target.value)}
                    className="input text-sm" placeholder="Батэрдэнэ" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    {t('checkout.phone')} *
                  </label>
                  <input value={address.phone} onChange={e => setAddr('phone', e.target.value)}
                    className="input text-sm" placeholder="+976 9900 0000" type="tel" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    {t('checkout.city')}
                  </label>
                  <input value={address.city} onChange={e => setAddr('city', e.target.value)}
                    className="input text-sm" placeholder="Улаанбаатар" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    {t('checkout.district')}
                  </label>
                  <select value={address.district} onChange={e => setAddr('district', e.target.value)} className="input text-sm">
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    {t('checkout.address')} *
                  </label>
                  <textarea value={address.address} onChange={e => setAddr('address', e.target.value)}
                    className="input text-sm resize-none" rows={3}
                    placeholder="Гудамж, байр, тоот..." />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Төлбөрийн хэлбэр */}
          {step === 'payment' && (
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <CreditCard className="w-5 h-5 text-brand-primary" /> {t('checkout.paymentMethod')}
              </h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(pm => (
                  <label key={pm.id}
                    className={cn('flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all',
                      paymentMethod === pm.id ? 'border-brand-primary bg-brand-primary/5' : 'hover:border-brand-primary/40')}
                    style={{ borderColor: paymentMethod === pm.id ? undefined : 'var(--border)' }}>
                    <input type="radio" name="payment" value={pm.id} checked={paymentMethod === pm.id}
                      onChange={() => setPaymentMethod(pm.id)} className="hidden" />
                    <span className="text-2xl">{pm.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{pm.label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{pm.sublabel}</p>
                    </div>
                    <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      paymentMethod === pm.id ? 'border-brand-primary bg-brand-primary' : '')}
                         style={{ borderColor: paymentMethod === pm.id ? undefined : 'var(--border)' }}>
                      {paymentMethod === pm.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Баталгаажуулах */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="card p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <MapPin className="w-4 h-4 text-brand-primary" /> Хүргэлтийн хаяг
                </h3>
                <div className="text-sm space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{address.full_name}</p>
                  <p>{address.phone}</p>
                  <p>{address.district} дүүрэг, {address.city}</p>
                  <p>{address.address}</p>
                </div>
                <button onClick={() => setStep('shipping')} className="text-xs text-brand-primary hover:underline mt-2">Засах</button>
              </div>
              <div className="card p-5">
                <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <CreditCard className="w-4 h-4 text-brand-primary" /> Төлбөрийн хэлбэр
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.icon}{' '}
                  {PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label}
                </p>
                <button onClick={() => setStep('payment')} className="text-xs text-brand-primary hover:underline mt-2">Засах</button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            {step !== 'shipping'
              ? <button onClick={() => setStep(step === 'confirm' ? 'payment' : 'shipping')} className="btn-ghost flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Буцах
                </button>
              : <div />}
            {step !== 'confirm'
              ? <button onClick={handleNext} className="btn-primary flex items-center gap-2">
                  Үргэлжлэх <ChevronRight className="w-4 h-4" />
                </button>
              : <button onClick={handlePlaceOrder} disabled={isPending}
                  className="btn-primary flex items-center gap-2 px-8 disabled:opacity-60">
                  {isPending ? 'Захиалга өгч байна...' : t('checkout.placeOrder')}
                </button>}
          </div>
        </div>

        {/* Right — Order summary */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-24">
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              {t('checkout.orderSummary')}
            </h3>
            <div className="space-y-3 mb-4">
              {items.map((item: any) => {
                const price = effectivePrice(item.price, item.sale_price);
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden" style={{ background: 'var(--surface-1)' }}>
                      {item.image_url
                        ? <img src={(item.image_url)} alt={item.name} className="w-full h-full object-contain p-1" />
                        : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>× {item.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold flex-shrink-0 text-brand-primary">
                      {formatPrice(price * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="border-t pt-3 space-y-2" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Бараа ({items.length})</span>
                <span style={{ color: 'var(--text-primary)' }}>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>Хүргэлт</span>
                <span className="text-emerald-500 font-medium">Үнэгүй</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                <span>Нийт</span>
                <span className="text-brand-primary">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
