// Admin Settings-д нэмэх Payment tab
// client/src/pages/admin/Settings/PaymentTab.tsx

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../api';
import { Save, Shield, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const BANKS = [
  { code: 'KHB', name: 'Khan Bank', color: '#E8A020', emoji: '🏦' },
  { code: 'GOLOMT', name: 'Golomt Bank', color: '#0066CC', emoji: '🏦' },
  { code: 'TDB', name: 'Худалдаа Хөгжлийн Банк', color: '#CC0000', emoji: '🏦' },
  { code: 'STATE', name: 'Хадгаламж Зээлийн Банк', color: '#009933', emoji: '🏦' },
  { code: 'CAPITRON', name: 'Капитрон Банк', color: '#8B5CF6', emoji: '🏦' },
  { code: 'MOST', name: 'Most Money', color: '#F59E0B', emoji: '💳' },
];

export function PaymentTab() {
  const qc = useQueryClient();
  const [config, setConfig] = useState({
    username: '',
    password: '',
    invoice_code: '',
  });
  const [isActive, setIsActive] = useState(false);
  const [isSandbox, setIsSandbox] = useState(true);

  const { data: gateways, isLoading } = useQuery({
    queryKey: ['payment-gateways'],
    queryFn: () => adminApi.getPaymentGateways(),
  });

  useEffect(() => {
    const qpay = gateways?.find((g: any) => g.provider === 'qpay');
    if (qpay) {
      const cfg = typeof qpay.config === 'string' ? JSON.parse(qpay.config) : qpay.config;
      setConfig({ username: cfg.username || '', password: cfg.password || '', invoice_code: cfg.invoice_code || '' });
      setIsActive(qpay.is_active);
      setIsSandbox(qpay.is_sandbox);
    }
  }, [gateways]);

  const saveMutation = useMutation({
    mutationFn: () => adminApi.savePaymentGateway('qpay', config, isActive, isSandbox),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payment-gateways'] }); toast.success('QPay тохиргоо хадгалагдлаа ✓'); },
    onError: () => toast.error('Алдаа гарлаа'),
  });

  return (
    <div className="space-y-5">

      {/* QPay */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style={{ background: 'rgba(107,92,231,0.1)' }}>💳</div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>QPay</h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>20+ банкийг дэмждэг нэгдсэн систем</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`badge text-xs ${isActive ? 'badge-success' : 'badge-gray'}`}>
              {isActive ? '● Идэвхтэй' : '○ Идэвхгүй'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
              <div className={`w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-brand-primary' : 'bg-[var(--surface-2)]'}`}>
                <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform shadow-sm ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>
        </div>

        {/* Sandbox / Production toggle */}
        <div className="flex gap-3 mb-5">
          <button onClick={() => setIsSandbox(true)}
            className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${isSandbox ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 'hover:border-brand-primary/40'}`}
            style={{ borderColor: isSandbox ? undefined : 'var(--border)', color: isSandbox ? undefined : 'var(--text-secondary)' }}>
            🧪 Sandbox (туршилт)
          </button>
          <button onClick={() => setIsSandbox(false)}
            className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${!isSandbox ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'hover:border-brand-primary/40'}`}
            style={{ borderColor: !isSandbox ? undefined : 'var(--border)', color: !isSandbox ? undefined : 'var(--text-secondary)' }}>
            🚀 Production (бодит)
          </button>
        </div>

        {isSandbox && (
          <div className="flex items-start gap-2 p-3 rounded-xl mb-4 text-xs"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#92400e' }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
            Sandbox горимд бодит мөнгө шилжихгүй. QPay-ийн туршилтын нэвтрэх мэдээллийг ашиглана уу.
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              QPay Username
              <a href="https://merchant.qpay.mn" target="_blank" rel="noreferrer"
                className="ml-2 text-brand-primary hover:underline inline-flex items-center gap-0.5">
                merchant.qpay.mn <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </label>
            <input value={config.username} onChange={e => setConfig(c => ({ ...c, username: e.target.value }))}
              className="input text-sm font-mono" placeholder="TECHMART_MERCHANT" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              QPay Password
            </label>
            <input type="password" value={config.password} onChange={e => setConfig(c => ({ ...c, password: e.target.value }))}
              className="input text-sm font-mono" placeholder="••••••••••••" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>
              Invoice Code
              <span className="ml-1 font-normal" style={{ color: 'var(--text-tertiary)' }}>
                (QPay dashboard-аас авна)
              </span>
            </label>
            <input value={config.invoice_code} onChange={e => setConfig(c => ({ ...c, invoice_code: e.target.value }))}
              className="input text-sm font-mono" placeholder="TECHMART_INVOICE" />
          </div>
        </div>

        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="btn-primary mt-4 flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Хадгалж...' : 'QPay тохиргоо хадгалах'}
        </button>
      </div>

      {/* Дэмжих банкнууд — мэдээллийн хэсэг */}
      <div className="card p-6">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Shield className="w-4 h-4 text-brand-primary" /> QPay-ээр дэмжих банкнууд
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BANKS.map(bank => (
            <div key={bank.code}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
              <span className="text-base">{bank.emoji}</span>
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{bank.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Дэмжигдсэн</span>
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-center p-2.5 rounded-xl border"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--text-tertiary)' }}>
            <span className="text-xs">+ 14 банк</span>
          </div>
        </div>
      </div>
    </div>
  );
}
