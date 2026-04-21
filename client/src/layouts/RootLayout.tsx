import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { CartDrawer } from '../components/layout/CartDrawer';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function FloatingAIButton() {
  const location = useLocation();
  // Hide on AI page
  if (location.pathname === '/ai') return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.5, type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Link to="/ai">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            className="relative flex items-center gap-2.5 px-4 py-3 rounded-2xl text-white text-sm font-semibold shadow-xl cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #6C63FF, #a855f7)',
              boxShadow: '0 8px 32px rgba(108,99,255,0.5)',
            }}
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-2xl animate-ping opacity-20"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #a855f7)' }} />
            <Sparkles className="w-4 h-4 relative z-10" />
            <span className="relative z-10 hidden sm:block">AI Туслагч</span>
          </motion.div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}

export function RootLayout() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--surface-0)' }}>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <FloatingAIButton />
    </div>
  );
}
