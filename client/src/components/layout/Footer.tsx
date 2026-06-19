import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api';
import { useStoreSettings } from '../../hooks';

interface FooterLink { label: string; href: string; }
interface FooterColumn { title: string; links: FooterLink[]; }
interface FooterConfig {
  description: string;
  copyright: string;
  tagline: string;
  columns: FooterColumn[];
}

const DEFAULTS: FooterConfig = {
  description: "Mongolia's premier AI-powered tech store.",
  copyright: '',
  tagline: 'Built with ❤️ in Mongolia',
  columns: [
    { title: 'Shop', links: [{ label: 'Laptops', href: '/shop?category=laptops' }, { label: 'Phones', href: '/shop?category=phones' }, { label: 'All Products', href: '/shop' }] },
    { title: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'AI Assistant', href: '/ai' }, { label: 'Compare', href: '/compare' }] },
    { title: 'Support', links: [{ label: 'Orders', href: '/orders' }, { label: 'Profile', href: '/profile' }, { label: 'Contact', href: '/contact' }] },
  ],
};

export function Footer() {
  const { store_name, store_logo } = useStoreSettings();
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => adminApi.getSettings(),
    staleTime: 60_000,
  });

  const footer: FooterConfig = (() => {
    try { return { ...DEFAULTS, ...JSON.parse(settings?.footer_settings || '{}') }; }
    catch { return DEFAULTS; }
  })();

  return (
    <footer className="border-t mt-20 py-12" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                style={{ background: store_logo ? 'transparent' : 'var(--brand-primary)' }}>
                {store_logo
                  ? <img src={store_logo} alt={store_name} className="w-full h-full object-contain" />
                  : <span className="text-white font-bold text-sm">{store_name[0]?.toUpperCase() || 'T'}</span>
                }
              </div>
              <span className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>{store_name}</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {footer.description}
            </p>
          </div>

          {footer.columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm hover:text-brand-primary transition-colors"
                      style={{ color: 'var(--text-secondary)' }}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t pt-8 flex flex-col sm:flex-row justify-between gap-4" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {footer.copyright || `© ${new Date().getFullYear()} ${store_name}. All rights reserved.`}
          </p>
          {footer.tagline && (
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {footer.tagline}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
