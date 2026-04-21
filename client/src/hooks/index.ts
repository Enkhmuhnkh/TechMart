import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, cartApi, ordersApi, wishlistApi, authApi } from '../api';
import { useCartStore, useWishlistStore } from '../store';
import type { ProductFilters } from '../types';
import toast from 'react-hot-toast';

// ─── PRODUCTS ──────────────────────────────────────────────────────────────
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.list(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: productsApi.getCategories,
    staleTime: 60 * 60 * 1000,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: productsApi.getBrands,
    staleTime: 60 * 60 * 1000,
  });
}

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => productsApi.getReviews(productId),
    enabled: !!productId,
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsApi.submitReview,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['reviews', vars.product_id] });
      toast.success('Review submitted! It will appear after moderation.');
    },
    onError: () => toast.error('Failed to submit review'),
  });
}

// ─── CART ──────────────────────────────────────────────────────────────────
export function useCart() {
  const setCart = useCartStore((s) => s.setCart);
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const cart = await cartApi.get();
      setCart(cart);
      return cart;
    },
    staleTime: 0,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  const setCart = useCartStore((s) => s.setCart);
  const openCart = useCartStore((s) => s.openCart);
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity?: number }) =>
      cartApi.addItem(productId, quantity),
    onSuccess: (cart) => {
      setCart(cart);
      qc.setQueryData(['cart'], cart);
      openCart();
    },
    onError: () => toast.error('Failed to add to cart'),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  const setCart = useCartStore((s) => s.setCart);
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateItem(itemId, quantity),
    onSuccess: (cart) => { setCart(cart); qc.setQueryData(['cart'], cart); },
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  const setCart = useCartStore((s) => s.setCart);
  return useMutation({
    mutationFn: (itemId: string) => cartApi.removeItem(itemId),
    onSuccess: (cart) => { setCart(cart); qc.setQueryData(['cart'], cart); },
  });
}

// ─── ORDERS ────────────────────────────────────────────────────────────────
export function useOrders(page = 1) {
  return useQuery({
    queryKey: ['orders', page],
    queryFn: () => ordersApi.list(page),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  const setCart = useCartStore((s) => s.setCart);
  return useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      setCart({ cartId: '', items: [], total: 0 });
      qc.setQueryData(['cart'], { cartId: '', items: [], total: 0 });
      toast.success('Order placed successfully!');
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Order failed'),
  });
}

// ─── WISHLIST ──────────────────────────────────────────────────────────────
export function useWishlist() {
  const setIds = useWishlistStore((s) => s.setIds);
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const items = await wishlistApi.get();
      setIds(items.map((i: any) => i.product_id));
      return items;
    },
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  const toggle = useWishlistStore((s) => s.toggle);
  const has = useWishlistStore((s) => s.has);
  return useMutation({
    mutationFn: async (productId: string) => {
      if (has(productId)) {
        await wishlistApi.remove(productId);
      } else {
        await wishlistApi.add(productId);
      }
      return productId;
    },
    onMutate: (productId) => toggle(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
    onError: (_, productId) => toggle(productId),
  });
}

// ─── PROFILE ───────────────────────────────────────────────────────────────
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });
}
