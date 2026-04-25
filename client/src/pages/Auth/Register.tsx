import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, Sparkles, AlertCircle, Check } from 'lucide-react';
import { authApi } from '../../api';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}
const STRENGTH_LABEL = ['', 'Сул', 'Дунд', 'Сайн', 'Маш сайн'];
const STRENGTH_COLOR = ['', '#EF4444', '#F59E0B', '#00D4AA', '#6C63FF'];

function PasswordStrength({ pw }: { pw: string }) {
  const s = getStrength(pw);
  if (!pw) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <motion.div key={i}
            className="flex-1 h-1 rounded-full"
            animate={{ background: i <= s ? STRENGTH_COLOR[s] : 'var(--surface-2)' }}
            transition={{ duration: 0.3 }} />
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color: STRENGTH_COLOR[s] }}>
        {STRENGTH_LABEL[s]}
      </p>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { setError('Үйлчилгээний нөхцөлийг зөвшөөрнө үү'); return; }
    setLoading(true); setError('');
    try {
      const res = await authApi.register(form);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success('Бүртгэл амжилттай! 🎉');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Бүртгэл амжилтгүй болсон');
    } finally { setLoading(false); }
  };

  const FIELDS = [
    { key: 'full_name', label: 'Нэр', type: 'text', placeholder: 'Батэрдэнэ', icon: User },
    { key: 'email', label: 'Имэйл', type: 'email', placeholder: 'you@example.com', icon: Mail },
    { key: 'phone', label: 'Утас (заавал биш)', type: 'tel', placeholder: '+976 9900 0000', icon: Phone },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)' }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
              Бүртгүүлэх
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>TechMart-д тавтай морил</p>
          </div>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Аль хэдийн бүртгэлтэй юу?{' '}
          <Link to="/login" className="font-semibold text-brand-primary hover:underline">Нэвтрэх</Link>
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

      <motion.form onSubmit={handleSubmit} className="space-y-4"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}>

        {/* Regular fields */}
        {FIELDS.map(({ key, label, type, placeholder, icon: Icon }, i) => (
          <motion.div key={key}
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 + 0.1 }}>
            <label className="text-xs font-semibold mb-1.5 block uppercase tracking-wide"
              style={{ color: 'var(--text-tertiary)' }}>{label}</label>
            <div className="relative">
              <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none"
                style={{ color: focused === key ? 'var(--brand-primary)' : 'var(--text-tertiary)' }} />
              <input
                type={type}
                value={form[key]}
                placeholder={placeholder}
                required={key !== 'phone'}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                onFocus={() => setFocused(key)}
                onBlur={() => setFocused(null)}
                className="input transition-all"
                style={{ paddingLeft: 40 }}
              />
            </div>
          </motion.div>
        ))}

        {/* Password */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}>
          <label className="text-xs font-semibold mb-1.5 block uppercase tracking-wide"
            style={{ color: 'var(--text-tertiary)' }}>Нууц үг</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none"
              style={{ color: focused === 'password' ? 'var(--brand-primary)' : 'var(--text-tertiary)' }} />
            <input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              placeholder="Хамгийн багадаа 8 тэмдэгт"
              required minLength={8}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              className="input pr-10 transition-all"
              style={{ paddingLeft: 40 }}
            />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-tertiary)' }}>
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrength pw={form.password} />
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="rounded-xl p-3.5 space-y-2"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}>
          {[
            '🛒 Захиалгаа хянах',
            '❤️ Хүслийн жагсаалт хадгалах',
            '🔥 Хямдрал, урамшуулал авах',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(108,99,255,0.15)' }}>
                <Check className="w-2.5 h-2.5" style={{ color: 'var(--brand-primary)' }} />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item}</span>
            </div>
          ))}
        </motion.div>

        {/* Agreement */}
        <motion.label
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
          className="flex items-start gap-3 cursor-pointer group">
          <div
            onClick={() => setAgreed(a => !a)}
            className="w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
            style={{
              borderColor: agreed ? 'var(--brand-primary)' : 'var(--border)',
              background: agreed ? 'var(--brand-primary)' : 'transparent',
            }}>
            {agreed && <Check className="w-3 h-3 text-white" />}
          </div>
          <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            <span
              className="text-brand-primary font-medium cursor-pointer hover:underline"
              onClick={() => setAgreed(a => !a)}>
              Үйлчилгээний нөхцөл
            </span>
            {' '}болон{' '}
            <span
              className="text-brand-primary font-medium cursor-pointer hover:underline"
              onClick={() => setAgreed(a => !a)}>
              Нууцлалын бодлого
            </span>
            -той зөвшөөрч байна
          </span>
        </motion.label>

        {/* Submit */}
        <motion.button
          type="submit" disabled={loading}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
            boxShadow: '0 8px 24px rgba(108,99,255,0.35)',
            opacity: agreed ? 1 : 0.6,
          }}>
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Бүртгүүлэх
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </motion.form>
    </div>
  );
}
