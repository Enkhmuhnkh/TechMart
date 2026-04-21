import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authApi.register(form);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success(t('auth.registerSuccess'));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const field = (key: keyof typeof form, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <input type={type} value={form[key]} placeholder={placeholder}
        required={key !== 'phone'}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="input" />
    </div>
  );

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>
        {t('auth.register')}
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="text-brand-primary hover:underline font-medium">{t('auth.login')}</Link>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="badge-danger p-3 rounded-xl text-sm w-full">{error}</div>}
        {field('full_name', t('auth.fullName'), 'text', 'Bat-Erdene')}
        {field('email', t('auth.email'), 'email', 'you@example.com')}
        {field('phone', t('auth.phone'), 'tel', '+976 9900 0000')}
        {field('password', t('auth.password'), 'password', '••••••••')}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t('common.loading') : t('auth.register')}
        </button>
      </form>
    </div>
  );
}
