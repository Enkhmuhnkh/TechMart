import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api';

const FEATURES = [
  { icon: '🚀', title: 'Хурдан хүргэлт', desc: 'Улаанбаатар дотор 24 цагт' },
  { icon: '🛡️', title: '100% Баталгаа', desc: 'Жинхэнэ бараа, мөнгө буцаалт' },
  { icon: '🎧', title: '24/7 Дэмжлэг', desc: 'Мэргэжлийн зөвлөгөө үргэлж' },
  { icon: '💳', title: 'Аюулгүй төлбөр', desc: 'Олон төрлийн төлбөрийн арга' },
];

export default function AuthLayout() {
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => adminApi.getSettings(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const storeName = settings?.store_name || 'TechMart';
  const storeLogo = settings?.store_logo || null;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface-0)' }}>

      {/* ── Left panel — branding (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(145deg, #0f0f1a 0%, #1a1030 40%, #0f2040 100%)' }}>

        {/* Animated orbs */}
        <div className="orb absolute top-[-60px] left-[-60px] w-96 h-96 opacity-30"
          style={{ background: '#6C63FF' }} />
        <div className="orb absolute bottom-[-40px] right-[-40px] w-72 h-72 opacity-20"
          style={{ background: '#00D4AA', animationDelay: '3s' }} />
        <div className="orb absolute top-1/2 left-1/3 w-48 h-48 opacity-10"
          style={{ background: '#a855f7', animationDelay: '5s' }} />

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }} />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className="w-10 h-10 rounded-xl object-contain"
                style={{ background: 'rgba(255,255,255,0.1)' }} />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)' }}>
                <span className="text-white font-bold text-lg">T</span>
              </div>
            )}
            <span className="font-display font-bold text-xl text-white">{storeName}</span>
          </Link>
        </motion.div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: 'rgba(108,99,255,0.8)' }}>
              ✦ Монголын шилдэг tech дэлгүүр
            </p>
            <h2 className="font-display font-bold text-white leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)' }}>
              Хамгийн сайн техник
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #6C63FF, #a855f7, #00D4AA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                хамгийн сайн үнээр
              </span>
            </h2>
          </motion.div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.45 }}
                className="flex items-start gap-3 p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="relative z-10 flex items-center gap-8">
          {[
            { value: '10,000+', label: 'Хэрэглэгч' },
            { value: '500+', label: 'Бараа' },
            { value: '4.9★', label: 'Үнэлгээ' },
          ].map(s => (
            <div key={s.label}>
              <p className="font-display font-bold text-xl text-white">{s.value}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}>
          <Link to="/" className="flex items-center gap-2">
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className="w-8 h-8 rounded-lg object-contain"
                style={{ background: 'var(--surface-1)' }} />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)' }}>
                <span className="text-white font-bold text-sm">T</span>
              </div>
            )}
            <span className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              {storeName}
            </span>
          </Link>
          <Link to="/" className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            ← Буцах
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm">

            {/* Card */}
            <div className="rounded-2xl p-6 sm:p-8"
              style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--border)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.08)',
              }}>
              <Outlet />
            </div>

            {/* Back to home */}
            <p className="text-center mt-5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <Link to="/" className="hover:text-brand-primary transition-colors flex items-center justify-center gap-1">
                ← Дэлгүүр рүү буцах
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
