// RootLayout.tsx
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { CartDrawer } from '../components/layout/CartDrawer';

export function RootLayout() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--surface-0)' }}>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
