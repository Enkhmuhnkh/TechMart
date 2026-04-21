// product.ts
export interface ProductImage {
  id: string;
  url: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductSpec {
  id: string;
  spec_key: string;
  spec_value: string;
  spec_group: string;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  name_mn: string | null;
  slug: string;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  description: string | null;
  description_mn: string | null;
  status: 'active' | 'draft' | 'archived';
  category_id: string;
  brand_id: string;
  category_name: string;
  category_slug: string;
  brand_name: string;
  brand_logo: string | null;
  image_url: string | null;
  images?: ProductImage[];
  specs?: ProductSpec[];
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_mn: string | null;
  slug: string;
  parent_id: string | null;
  icon: string | null;
  sort_order: number;
  product_count?: number;
}

export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  country: string | null;
  product_count?: number;
}

export interface ProductFilters {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  inStock?: boolean;
  page?: number;
  limit?: number;
}

export interface Review {
  id: string;
  user_id: string;
  user_name: string;
  product_id: string;
  rating: number;
  body: string | null;
  approved: boolean;
  created_at: string;
}

// user.ts
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'customer' | 'admin';
  language_pref: 'mn' | 'en';
  created_at: string;
}

// order.ts
export interface OrderItem {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  image_url: string | null;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address: {
    full_name: string;
    phone: string;
    address: string;
    city: string;
    district: string;
  };
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  items?: OrderItem[];
}

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  name_mn: string | null;
  slug: string;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  image_url: string | null;
  quantity: number;
}

export interface Cart {
  cartId: string;
  items: CartItem[];
  total: number;
}

// ai.ts
export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  timestamp?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}
