-- TechMart AI — Seed Data
-- Run: psql techmart < migrations/002_seed.sql

-- Admin user (password: Admin1234!)
INSERT INTO users (id, email, password_hash, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'admin@techmart.mn',
   '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbxTNkiWy',
   'TechMart Admin', 'admin');

-- Categories
INSERT INTO categories (id, name, name_mn, slug, sort_order, icon) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Laptops', 'Зөөврийн компьютер', 'laptops', 1, 'laptop'),
  ('c0000000-0000-0000-0000-000000000002', 'Smartphones', 'Ухаалаг гар утас', 'phones', 2, 'smartphone'),
  ('c0000000-0000-0000-0000-000000000003', 'Tablets', 'Таблет', 'tablets', 3, 'tablet'),
  ('c0000000-0000-0000-0000-000000000004', 'Monitors', 'Дэлгэц', 'monitors', 4, 'monitor'),
  ('c0000000-0000-0000-0000-000000000005', 'Keyboards', 'Гар', 'keyboards', 5, 'keyboard'),
  ('c0000000-0000-0000-0000-000000000006', 'Mice', 'Хулгана', 'mice', 6, 'mouse'),
  ('c0000000-0000-0000-0000-000000000007', 'Earbuds', 'Чихэвч', 'earbuds', 7, 'headphones'),
  ('c0000000-0000-0000-0000-000000000008', 'Headphones', 'Том чихэвч', 'headphones', 8, 'headphones'),
  ('c0000000-0000-0000-0000-000000000009', 'Smartwatches', 'Ухаалаг цаг', 'smartwatches', 9, 'watch'),
  ('c0000000-0000-0000-0000-000000000010', 'GPUs', 'Видео карт', 'gpus', 10, 'gpu'),
  ('c0000000-0000-0000-0000-000000000011', 'Storage', 'Хадгалах төхөөрөмж', 'storage', 11, 'hdd'),
  ('c0000000-0000-0000-0000-000000000012', 'Accessories', 'Нэмэлт хэрэгсэл', 'accessories', 12, 'box');

-- Brands
INSERT INTO brands (id, name, country) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Apple', 'USA'),
  ('b0000000-0000-0000-0000-000000000002', 'Samsung', 'South Korea'),
  ('b0000000-0000-0000-0000-000000000003', 'Dell', 'USA'),
  ('b0000000-0000-0000-0000-000000000004', 'ASUS', 'Taiwan'),
  ('b0000000-0000-0000-0000-000000000005', 'Lenovo', 'China'),
  ('b0000000-0000-0000-0000-000000000006', 'HP', 'USA'),
  ('b0000000-0000-0000-0000-000000000007', 'Sony', 'Japan'),
  ('b0000000-0000-0000-0000-000000000008', 'LG', 'South Korea'),
  ('b0000000-0000-0000-0000-000000000009', 'NVIDIA', 'USA'),
  ('b0000000-0000-0000-0000-000000000010', 'Logitech', 'Switzerland'),
  ('b0000000-0000-0000-0000-000000000011', 'Xiaomi', 'China'),
  ('b0000000-0000-0000-0000-000000000012', 'Microsoft', 'USA');

-- Sample Products
INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, status)
VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'MacBook Pro 14" M3 Pro',
   'MacBook Pro 14" M3 Pro',
   'macbook-pro-14-m3-pro-p0000001',
   'c0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001',
   5990000, NULL, 15,
   'The MacBook Pro 14-inch with M3 Pro chip delivers exceptional performance for professionals. Features a stunning Liquid Retina XDR display, up to 22 hours battery life, and the power of Apple Silicon.',
   'active'),

  ('a0000000-0000-0000-0000-000000000002',
   'ASUS ROG Strix G16 Gaming Laptop',
   'ASUS ROG Strix G16 Геймийн зөөврийн компьютер',
   'asus-rog-strix-g16-gaming-p0000002',
   'c0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000004',
   3200000, 2990000, 8,
   'Dominate every game with the ROG Strix G16. Powered by Intel Core i9, NVIDIA RTX 4070, and a 240Hz display for the ultimate gaming experience.',
   'active'),

  ('a0000000-0000-0000-0000-000000000003',
   'Samsung Galaxy S24 Ultra',
   'Samsung Galaxy S24 Ultra',
   'samsung-galaxy-s24-ultra-p0000003',
   'c0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000002',
   2200000, NULL, 22,
   'The ultimate Galaxy experience with Snapdragon 8 Gen 3, 200MP camera, built-in S Pen, and 5000mAh battery.',
   'active'),

  ('a0000000-0000-0000-0000-000000000004',
   'Dell UltraSharp 27" 4K Monitor',
   'Dell UltraSharp 27" 4K Дэлгэц',
   'dell-ultrasharp-27-4k-p0000004',
   'c0000000-0000-0000-0000-000000000004',
   'b0000000-0000-0000-0000-000000000003',
   1490000, NULL, 12,
   'Professional 4K IPS display with 99% sRGB color accuracy, USB-C connectivity, and ergonomic stand.',
   'active'),

  ('a0000000-0000-0000-0000-000000000005',
   'Lenovo ThinkPad X1 Carbon Gen 11',
   'Lenovo ThinkPad X1 Carbon Gen 11',
   'lenovo-thinkpad-x1-carbon-gen11-p0000005',
   'c0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000005',
   2800000, 2600000, 6,
   'Ultra-lightweight business laptop with Intel Core i7, 16GB RAM, 512GB SSD, and legendary ThinkPad reliability.',
   'active'),

  ('a0000000-0000-0000-0000-000000000006',
   'Apple AirPods Pro 2nd Gen',
   'Apple AirPods Pro 2-р үе',
   'apple-airpods-pro-2nd-gen-p0000006',
   'c0000000-0000-0000-0000-000000000007',
   'b0000000-0000-0000-0000-000000000001',
   590000, NULL, 35,
   'Industry-leading Active Noise Cancellation, Adaptive Transparency, Personalized Spatial Audio, and up to 30 hours battery with case.',
   'active'),

  ('a0000000-0000-0000-0000-000000000007',
   'Logitech MX Master 3S Mouse',
   'Logitech MX Master 3S Хулгана',
   'logitech-mx-master-3s-p0000007',
   'c0000000-0000-0000-0000-000000000006',
   'b0000000-0000-0000-0000-000000000010',
   189000, NULL, 28,
   'The most advanced Master Series mouse with ultra-fast MagSpeed scrolling, 8000 DPI sensor, and multi-device connectivity.',
   'active'),

  ('a0000000-0000-0000-0000-000000000008',
   'NVIDIA RTX 4070 Super 12GB',
   'NVIDIA RTX 4070 Super 12GB Видео карт',
   'nvidia-rtx-4070-super-12gb-p0000008',
   'c0000000-0000-0000-0000-000000000010',
   'b0000000-0000-0000-0000-000000000009',
   1390000, NULL, 5,
   'Supercharged for gaming and creative work. Ada Lovelace architecture, 12GB GDDR6X, DLSS 3.5, and ray tracing.',
   'active');

-- Product Specs
INSERT INTO product_specs (id, product_id, spec_key, spec_value, spec_group, sort_order) VALUES
  -- MacBook Pro M3 Pro
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', 'CPU', 'Apple M3 Pro 11-core', 'Performance', 1),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', 'RAM', '18GB Unified Memory', 'Performance', 2),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', 'Storage', '512GB SSD', 'Performance', 3),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', 'GPU', 'Apple M3 Pro 14-core GPU', 'Performance', 4),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', 'Display', '14.2" Liquid Retina XDR, 3024x1964, 120Hz', 'Display', 5),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', 'Battery', '70Wh, up to 22 hours', 'Battery', 6),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', 'Weight', '1.61 kg', 'Physical', 7),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000001', 'OS', 'macOS Sonoma', 'Software', 8),

  -- ASUS ROG Strix G16
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000002', 'CPU', 'Intel Core i9-13980HX', 'Performance', 1),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000002', 'RAM', '16GB DDR5 4800MHz', 'Performance', 2),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000002', 'Storage', '1TB NVMe SSD', 'Performance', 3),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000002', 'GPU', 'NVIDIA RTX 4070 8GB', 'Performance', 4),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000002', 'Display', '16" FHD 240Hz IPS', 'Display', 5),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000002', 'Battery', '90Wh, up to 8 hours', 'Battery', 6),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000002', 'Weight', '2.5 kg', 'Physical', 7),

  -- Samsung Galaxy S24 Ultra
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000003', 'Chipset', 'Snapdragon 8 Gen 3', 'Performance', 1),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000003', 'RAM', '12GB', 'Performance', 2),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000003', 'Storage', '256GB', 'Performance', 3),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000003', 'Display', '6.8" Dynamic AMOLED 2X, 120Hz', 'Display', 4),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000003', 'Camera', '200MP main + 12MP ultra + 10MP + 50MP telephoto', 'Camera', 5),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000003', 'Battery', '5000mAh, 45W fast charge', 'Battery', 6),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000003', 'S Pen', 'Built-in S Pen', 'Features', 7),

  -- RTX 4070 Super
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000008', 'VRAM', '12GB GDDR6X', 'Performance', 1),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000008', 'Core Clock', '2475 MHz Boost', 'Performance', 2),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000008', 'Memory Bandwidth', '672 GB/s', 'Performance', 3),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000008', 'TDP', '220W', 'Power', 4),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000008', 'Ray Tracing', '3rd Gen RT Cores', 'Features', 5),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000008', 'DLSS', 'DLSS 3.5', 'Features', 6),
  (uuid_generate_v4(), 'a0000000-0000-0000-0000-000000000008', 'Outputs', '3x DisplayPort 1.4a, 1x HDMI 2.1', 'Connectivity', 7);
