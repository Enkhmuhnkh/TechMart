import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Cart, Product } from '../types';

// ─── AUTH STORE ─────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    { name: 'techmart-auth', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
);

// ─── CART STORE ─────────────────────────────────────────────────────────────
interface CartState {
  cart: Cart | null;
  isOpen: boolean;
  setCart: (cart: Cart) => void;
  openCart: () => void;
  closeCart: () => void;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  cart: null,
  isOpen: false,
  setCart: (cart) => set({ cart }),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  itemCount: () => get().cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0,
}));

// ─── UI STORE ───────────────────────────────────────────────────────────────
interface UIState {
  theme: 'light' | 'dark';
  language: 'mn' | 'en';
  toggleTheme: () => void;
  setLanguage: (lang: 'mn' | 'en') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      language: 'en',

      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', next === 'dark');
        set({ theme: next });
      },

      setLanguage: (language) => {
  set({ language });
  import('i18next').then(({ default: i18n }) => i18n.changeLanguage(language));
},
    }),
    { name: 'techmart-ui' }
  )
);

// ─── COMPARE STORE ──────────────────────────────────────────────────────────
interface CompareState {
  ids: string[];
  products: Product[];
  add: (product: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      products: [],

      add: (product) => {
        if (get().ids.length >= 4) return;
        if (get().ids.includes(product.id)) return;
        set((s) => ({ ids: [...s.ids, product.id], products: [...s.products, product] }));
      },

      remove: (id) =>
        set((s) => ({
          ids: s.ids.filter((i) => i !== id),
          products: s.products.filter((p) => p.id !== id),
        })),

      clear: () => set({ ids: [], products: [] }),

      has: (id) => get().ids.includes(id),
    }),
    { name: 'techmart-compare' }
  )
);

// ─── WISHLIST STORE ─────────────────────────────────────────────────────────
interface WishlistState {
  ids: Set<string>;
  setIds: (ids: string[]) => void;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  ids: new Set(),
  setIds: (ids) => set({ ids: new Set(ids) }),
  toggle: (id) => {
    const next = new Set(get().ids);
    if (next.has(id)) next.delete(id); else next.add(id);
    set({ ids: next });
  },
  has: (id) => get().ids.has(id),
}));
