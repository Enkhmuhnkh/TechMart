// client/src/components/payment/QPayModal.tsx
// Захиалгын дараа QPay QR харуулах modal

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { paymentsApi } from '../../api';

interface Props {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
}

const BANKS = [
  { name: 'Khan Bank', app: 'khanbank://', color: '#E8A020' },
  { name: 'Golomt', app: 'golomtbank://', color: '#0066CC' },
  { name: 'TDB', app: 'tdbbank://', color: '#CC0000' },
  { name: 'State Bank', app: 'statebank://', color: '#009933' },
];

export function QPayModal({ orderId, amount, onSuccess, onClose }: Props) {
  const [step, setStep] = useState<'loading' | 'qr' | 'checking' | 'success' | 'error'>('loading');
  const [qrImage, setQrImage] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [deepLinks, setDeepLinks] = useState<Array<{ name: string; link: string; logo: string }>>([]);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState('');

  // Create invoice
  useEffect(() => {
    const create = async () => {
      try {
        const result = await paymentsApi.createQPay(orderId, amount);
        setQrImage(result.qrImage);
        setInvoiceId(result.invoiceId);
        setDeepLinks(result.urls || []);
        setStep('qr');
      } catch (e: any) {
        setError(e.message || 'QPay холболт амжилтгүй');
        setStep('error');
      }
    };
    create();
  }, [orderId, amount]);

  // Poll payment status
  const checkStatus = useCallback(async () => {
    if (!invoiceId || step === 'success') return;
    try {
      const result = await paymentsApi.checkStatus(invoiceId);
      if (result.status === 'paid') {
        setStep('success');
        setTimeout(onSuccess, 2000);
      }
    } catch {}
    setPollCount(c => c + 1);
  }, [invoiceId, step, onSuccess]);

  useEffect(() => {
    if (step !== 'qr') return;
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [step, checkStatus]);

  const formatPrice = (n: number) => n.toLocaleString() + '₮';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="card w-full max-w-sm overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                style={{ background: 'rgba(107,92,231,0.1)' }}>💳</div>
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>QPay төлбөр</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatPrice(amount)}</p>
              </div>
            </div>
            <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
              <X className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          <div className="p-5">
            {/* Loading */}
            {step === 'loading' && (
              <div className="flex flex-col items-center py-8 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>QR код үүсгэж байна...</p>
              </div>
            )}

            {/* QR */}
            {step === 'qr' && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                  Банкны app-аар QR скан хийж төлнө үү
                </p>

                {/* QR Image */}
                <div className="p-3 rounded-2xl border-2" style={{ borderColor: 'var(--border)' }}>
                  {qrImage ? (
                    <img src={`data:image/png;base64,${qrImage}`} alt="QPay QR" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center" style={{ background: 'var(--surface-1)' }}>
                      <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                    </div>
                  )}
                </div>

                {/* Polling indicator */}
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Төлбөр хүлээж байна... ({pollCount})
                </div>

                {/* Deep links */}
                {deepLinks.length > 0 && (
                  <div className="w-full">
                    <p className="text-xs mb-2 text-center" style={{ color: 'var(--text-secondary)' }}>Эсвэл банкаа сонгоно уу:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {deepLinks.slice(0, 4).map((link, i) => (
                        <a key={i} href={link.link} target="_blank" rel="noreferrer"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl border hover:border-brand-primary/40 transition-colors text-xs font-medium"
                          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                          {link.logo && <img src={link.logo} className="w-5 h-5 rounded" alt="" />}
                          <span className="truncate">{link.name}</span>
                          <ExternalLink className="w-3 h-3 ml-auto opacity-50 flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual banks if no deep links */}
                {deepLinks.length === 0 && (
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {BANKS.map(b => (
                      <div key={b.name}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                        {b.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Success */}
            {step === 'success' && (
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
                className="flex flex-col items-center py-8 gap-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Төлбөр амжиллтай!</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatPrice(amount)} төлөгдлөө</p>
              </motion.div>
            )}

            {/* Error */}
            {step === 'error' && (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <X className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>{error}</p>
                <button onClick={onClose} className="btn-primary btn-sm">Хаах</button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
