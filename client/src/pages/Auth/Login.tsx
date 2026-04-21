// Login.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authApi.login(form.email, form.password);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success(t('auth.loginSuccess'));
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>
        {t('auth.login')}
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-brand-primary hover:underline font-medium">{t('nav.register')}</Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="badge-danger p-3 rounded-xl text-sm w-full">{error}</div>}
        <div>
          <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
            {t('auth.email')}
          </label>
          <input type="email" required value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="input" placeholder="you@example.com" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
            {t('auth.password')}
          </label>
          <input type="password" required value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="input" placeholder="••••••••" />
          <div className="text-right mt-1.5">
            <Link to="/forgot-password" className="text-xs text-brand-primary hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t('common.loading') : t('auth.login')}
        </button>
      </form>

      <div className="mt-6 p-3 rounded-xl text-xs" style={{ background: 'var(--surface-1)', color: 'var(--text-secondary)' }}>
        <strong>Demo admin:</strong> admin@techmart.mn / Admin1234!
      </div>
    </div>
  );
}
