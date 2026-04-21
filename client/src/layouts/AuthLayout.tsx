// AuthLayout.tsx
import { Outlet, Link } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--surface-1)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-display font-bold">T</span>
            </div>
            <span className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>TechMart</span>
          </Link>
        </div>
        <div className="card p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
