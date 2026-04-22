CREATE TABLE IF NOT EXISTS store_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
 
-- Default settings
INSERT INTO store_settings (key, value) VALUES
  ('store_name', 'TechMart'),
  ('store_phone', '+976 9900 0000'),
  ('store_email', 'info@techmart.mn'),
  ('hero_title', 'Хамгийн сүүлийн Tech гаджетууд'),
  ('hero_subtitle', 'Laptop, Phone, Monitor болон бусад'),
  ('hero_image_url', ''),
  ('sidebar_sale_product_ids', '[]'),
  ('featured_product_ids', '[]')
ON CONFLICT (key) DO NOTHING;
 