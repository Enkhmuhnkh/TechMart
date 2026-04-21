import { Link } from 'react-router-dom';
export function Footer() {
  return (
    <footer className="border-t mt-20 py-12" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>TechMart</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Mongolia's premier AI-powered tech store.
            </p>
          </div>
          {[
            { title: 'Shop', links: [['Laptops', '/shop?category=laptops'], ['Phones', '/shop?category=phones'], ['All Products', '/shop']] },
            { title: 'Company', links: [['About', '/about'], ['AI Assistant', '/ai'], ['Compare', '/compare']] },
            { title: 'Support', links: [['Orders', '/orders'], ['Profile', '/profile'], ['Contact', '/contact']] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>{title}</h4>
              <ul className="space-y-2">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <Link to={href} className="text-sm hover:text-brand-primary transition-colors"
                          style={{ color: 'var(--text-secondary)' }}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t pt-8 flex flex-col sm:flex-row justify-between gap-4" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            © {new Date().getFullYear()} TechMart AI. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Built with ❤️ in Mongolia
          </p>
        </div>
      </div>
    </footer>
  );
}
