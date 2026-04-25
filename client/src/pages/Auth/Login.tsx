import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';
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
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authApi.login(form.email, form.password);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success('Тавтай морил! 👋');
      navigate(res.data.user.role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Нэвтрэх мэдээлэл буруу байна');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)' }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
              Нэвтрэх
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>TechMart-д тавтай морил</p>
          </div>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Бүртгэл байхгүй юу?{' '}
          <Link to="/register" className="font-semibold text-brand-primary hover:underline">
            Бүртгүүлэх
          </Link>
        </p>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="flex items-center gap-2.5 p-3.5 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <motion.form onSubmit={handleSubmit} className="space-y-4"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}>

        {/* Email */}
        <div>
          <label className="text-xs font-semibold mb-1.5 block uppercase tracking-wide"
            style={{ color: 'var(--text-tertiary)' }}>Имэйл</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
              style={{ color: focused === 'email' ? 'var(--brand-primary)' : 'var(--text-tertiary)' }} />
            <input
              type="email" required value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              placeholder="you@example.com"
              className="input pl-10 transition-all"
              style={{ paddingLeft: 40 }}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="text-xs font-semibold mb-1.5 block uppercase tracking-wide"
            style={{ color: 'var(--text-tertiary)' }}>Нууц үг</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
              style={{ color: focused === 'password' ? 'var(--brand-primary)' : 'var(--text-tertiary)' }} />
            <input
              type={showPass ? 'text' : 'password'} required value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              placeholder="••••••••"
              className="input pr-10 transition-all"
              style={{ paddingLeft: 40 }}
            />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--text-tertiary)' }}>
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex justify-end mt-1.5">
            <Link to="/forgot-password"
              className="text-xs font-medium text-brand-primary hover:underline">
              Нууц үг мартсан?
            </Link>
          </div>
        </div>

        {/* Submit */}
        <motion.button
          type="submit" disabled={loading}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)', boxShadow: '0 8px 24px rgba(108,99,255,0.35)' }}>
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Нэвтрэх
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </motion.form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>эсвэл</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      {/* Demo credentials */}
      <motion.button
        type="button"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        onClick={() => setForm({ email: 'admin@techmart.mn', password: 'Admin1234!' })}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(168,85,247,0.15))' }}>
          <span className="text-base">🔑</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Demo admin оруулах</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>admin@techmart.mn</p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
      </motion.button>
    </div>
  );
}
