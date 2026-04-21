-- TechMart AI — Full PostgreSQL Schema
-- Run: psql techmart < migrations/001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ─────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(30),
  role          VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  language_pref VARCHAR(5) NOT NULL DEFAULT 'en' CHECK (language_pref IN ('mn', 'en')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ─── CATEGORIES ────────────────────────────────────────────────────────────
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(100) NOT NULL,
  name_mn    VARCHAR(100),
  slug       VARCHAR(100) UNIQUE NOT NULL,
  parent_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  icon       VARCHAR(100),
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- ─── BRANDS ────────────────────────────────────────────────────────────────
CREATE TABLE brands (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name     VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  country  VARCHAR(100)
);

CREATE INDEX idx_brands_name ON brands(name);

-- ─── PRODUCTS ──────────────────────────────────────────────────────────────
CREATE TABLE products (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(255) NOT NULL,
  name_mn        VARCHAR(255),
  slug           VARCHAR(300) UNIQUE NOT NULL,
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand_id       UUID REFERENCES brands(id) ON DELETE SET NULL,
  price          NUMERIC(15, 2) NOT NULL CHECK (price >= 0),
  sale_price     NUMERIC(15, 2) CHECK (sale_price >= 0),
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  description    TEXT,
  description_mn TEXT,
  status         VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_stock ON products(stock_quantity);
CREATE INDEX idx_products_fts ON products
  USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ─── PRODUCT IMAGES ────────────────────────────────────────────────────────
CREATE TABLE product_images (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ─── PRODUCT SPECS ─────────────────────────────────────────────────────────
-- Flexible key-value spec system — supports any category without schema changes
CREATE TABLE product_specs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  spec_key   VARCHAR(100) NOT NULL,
  spec_value VARCHAR(500) NOT NULL,
  spec_group VARCHAR(100) NOT NULL DEFAULT 'General',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_product_specs_product ON product_specs(product_id);
CREATE INDEX idx_product_specs_key ON product_specs(spec_key);
CREATE INDEX idx_product_specs_key_value ON product_specs(spec_key, spec_value);

-- ─── CARTS ─────────────────────────────────────────────────────────────────
CREATE TABLE carts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id    UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

-- ─── ORDERS ────────────────────────────────────────────────────────────────
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id),
  status           VARCHAR(30) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount     NUMERIC(15, 2) NOT NULL,
  shipping_address JSONB NOT NULL,
  payment_method   VARCHAR(50),
  payment_status   VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

CREATE TABLE order_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity   INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(15, 2) NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ─── WISHLISTS ─────────────────────────────────────────────────────────────
CREATE TABLE wishlists (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX idx_wishlists_user ON wishlists(user_id);

-- ─── REVIEWS ───────────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body       TEXT,
  approved   BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_approved ON reviews(approved);

-- ─── AI CHAT SESSIONS ──────────────────────────────────────────────────────
CREATE TABLE ai_chat_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  session_token VARCHAR(100) UNIQUE NOT NULL,
  messages      JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_sessions_token ON ai_chat_sessions(session_token);
CREATE INDEX idx_ai_sessions_user ON ai_chat_sessions(user_id);
