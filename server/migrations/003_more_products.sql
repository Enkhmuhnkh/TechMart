-- Олон бүтээгдэхүүн нэмэх

-- Эхлээд ангилалуудын ID-г авна
DO $$
DECLARE
  cat_laptops UUID;
  cat_phones UUID;
  cat_monitors UUID;
  cat_keyboards UUID;
  cat_mice UUID;
  cat_earbuds UUID;
  cat_gpus UUID;
  cat_storage UUID;
  cat_smartwatches UUID;

  brand_apple UUID;
  brand_samsung UUID;
  brand_asus UUID;
  brand_lenovo UUID;
  brand_dell UUID;
  brand_nvidia UUID;
  brand_logitech UUID;
  brand_sony UUID;
  brand_lg UUID;
  brand_xiaomi UUID;

BEGIN
  -- Categories
  SELECT id INTO cat_laptops FROM categories WHERE slug = 'laptops';
  SELECT id INTO cat_phones FROM categories WHERE slug = 'phones';
  SELECT id INTO cat_monitors FROM categories WHERE slug = 'monitors';
  SELECT id INTO cat_keyboards FROM categories WHERE slug = 'keyboards';
  SELECT id INTO cat_mice FROM categories WHERE slug = 'mice';
  SELECT id INTO cat_earbuds FROM categories WHERE slug = 'earbuds';
  SELECT id INTO cat_gpus FROM categories WHERE slug = 'gpus';
  SELECT id INTO cat_storage FROM categories WHERE slug = 'storage';

  -- Brands
  SELECT id INTO brand_apple FROM brands WHERE name = 'Apple';
  SELECT id INTO brand_samsung FROM brands WHERE name = 'Samsung';
  SELECT id INTO brand_asus FROM brands WHERE name = 'ASUS';
  SELECT id INTO brand_lenovo FROM brands WHERE name = 'Lenovo';
  SELECT id INTO brand_dell FROM brands WHERE name = 'Dell';
  SELECT id INTO brand_nvidia FROM brands WHERE name = 'NVIDIA';
  SELECT id INTO brand_logitech FROM brands WHERE name = 'Logitech';
  SELECT id INTO brand_sony FROM brands WHERE name = 'Sony';
  SELECT id INTO brand_lg FROM brands WHERE name = 'LG';
  SELECT id INTO brand_xiaomi FROM brands WHERE name = 'Xiaomi';

  -- ═══════════════════════════════════════════
  -- LAPTOPS
  -- ═══════════════════════════════════════════

  -- MacBook Pro 16 M3 Max
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'MacBook Pro 16" M3 Max', 'MacBook Pro 16" M3 Max', 'macbook-pro-16-m3-max-' || substr(md5(random()::text), 1, 8),
    cat_laptops, brand_apple, 8990000, NULL, 8,
    'The most powerful MacBook Pro ever. M3 Max chip with 16-core CPU, stunning 16.2" Liquid Retina XDR display, and up to 128GB unified memory.',
    'Хэзээ ч байгаагүй хамгийн хүчирхэг MacBook Pro. M3 Max chip, 16.2" Liquid Retina XDR дэлгэц.', 'active');

  -- MacBook Air M2
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'MacBook Air 13" M2', 'MacBook Air 13" M2', 'macbook-air-13-m2-' || substr(md5(random()::text), 1, 8),
    cat_laptops, brand_apple, 3990000, 3790000, 15,
    'Strikingly thin. Remarkably powerful. The M2 chip brings a next-generation 8-core CPU and 10-core GPU.',
    'Нимгэн биетэй, хүчирхэг гүйцэтгэлтэй. M2 chip, 18 цагийн батарей.', 'active');

  -- ASUS ROG Strix G18
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'ASUS ROG Strix G18 Gaming', 'ASUS ROG Strix G18 Геймийн', 'asus-rog-strix-g18-' || substr(md5(random()::text), 1, 8),
    cat_laptops, brand_asus, 4500000, 4200000, 6,
    'Dominate every game with ROG Strix G18. Intel Core i9-14900HX, RTX 4080, 240Hz display.',
    'ROG Strix G18 — геймийн ертөнцийг эзлэ. Intel Core i9, RTX 4080, 240Hz дэлгэц.', 'active');

  -- Lenovo ThinkPad X1 Carbon
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Lenovo ThinkPad X1 Carbon Gen 12', 'Lenovo ThinkPad X1 Carbon Gen 12', 'lenovo-thinkpad-x1-carbon-gen12-' || substr(md5(random()::text), 1, 8),
    cat_laptops, brand_lenovo, 3500000, NULL, 10,
    'Ultra-lightweight business laptop. Intel Core Ultra 7, 32GB LPDDR5, 1TB SSD, 2.8K OLED display.',
    'Хэт хөнгөн бизнесийн зөөврийн компьютер. Intel Core Ultra 7, 2.8K OLED дэлгэц.', 'active');

  -- Dell XPS 15
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Dell XPS 15 9530', 'Dell XPS 15 9530', 'dell-xps-15-9530-' || substr(md5(random()::text), 1, 8),
    cat_laptops, brand_dell, 4200000, 3900000, 7,
    'Dell XPS 15 with Intel Core i9-13900H, NVIDIA RTX 4070, 15.6" 3.5K OLED touchscreen.',
    'Dell XPS 15 — Intel Core i9, RTX 4070, 15.6" 3.5K OLED сенсор дэлгэцтэй.', 'active');

  -- ASUS ZenBook 14
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'ASUS ZenBook 14 OLED', 'ASUS ZenBook 14 OLED', 'asus-zenbook-14-oled-' || substr(md5(random()::text), 1, 8),
    cat_laptops, brand_asus, 2200000, 1990000, 12,
    'ASUS ZenBook 14 with AMD Ryzen 7 8700U, 16GB RAM, 512GB SSD, 14" 2.8K OLED display.',
    'ASUS ZenBook 14 — AMD Ryzen 7, 14" 2.8K OLED дэлгэцтэй, нимгэн биетэй.', 'active');

  -- ═══════════════════════════════════════════
  -- PHONES
  -- ═══════════════════════════════════════════

  -- iPhone 15 Pro Max
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Apple iPhone 15 Pro Max', 'Apple iPhone 15 Pro Max', 'apple-iphone-15-pro-max-' || substr(md5(random()::text), 1, 8),
    cat_phones, brand_apple, 3200000, NULL, 20,
    'iPhone 15 Pro Max. Titanium design, A17 Pro chip, 48MP main camera, Action button, USB 3.',
    'iPhone 15 Pro Max — Титаниум биетэй, A17 Pro chip, 48MP камер, USB 3.', 'active');

  -- iPhone 15
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Apple iPhone 15', 'Apple iPhone 15', 'apple-iphone-15-' || substr(md5(random()::text), 1, 8),
    cat_phones, brand_apple, 2100000, 1990000, 25,
    'iPhone 15 with A16 Bionic chip, Dynamic Island, 48MP camera, and USB-C.',
    'iPhone 15 — Dynamic Island, 48MP камер, USB-C порт.', 'active');

  -- Samsung Galaxy S24 Ultra
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Samsung Galaxy S24 Ultra', 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra-' || substr(md5(random()::text), 1, 8),
    cat_phones, brand_samsung, 2500000, NULL, 18,
    'Samsung Galaxy S24 Ultra with Snapdragon 8 Gen 3, 200MP camera, built-in S Pen, 5000mAh battery.',
    'Galaxy S24 Ultra — Snapdragon 8 Gen 3, 200MP камер, S Pen, 5000mAh батарей.', 'active');

  -- Samsung Galaxy A55
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Samsung Galaxy A55 5G', 'Samsung Galaxy A55 5G', 'samsung-galaxy-a55-5g-' || substr(md5(random()::text), 1, 8),
    cat_phones, brand_samsung, 1100000, 990000, 30,
    'Samsung Galaxy A55 5G with Exynos 1480, 50MP camera, 5000mAh battery, IP67 rating.',
    'Galaxy A55 5G — Exynos 1480, 50MP камер, 5000mAh батарей, IP67.', 'active');

  -- Xiaomi 14 Pro
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Xiaomi 14 Pro', 'Xiaomi 14 Pro', 'xiaomi-14-pro-' || substr(md5(random()::text), 1, 8),
    cat_phones, brand_xiaomi, 1800000, 1690000, 15,
    'Xiaomi 14 Pro with Snapdragon 8 Gen 3, Leica optics, 50MP triple camera, 120W fast charging.',
    'Xiaomi 14 Pro — Snapdragon 8 Gen 3, Leica гурвалсан камер, 120W хурдан цэнэглэлт.', 'active');

  -- ═══════════════════════════════════════════
  -- MONITORS
  -- ═══════════════════════════════════════════

  -- LG UltraWide
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'LG 34" UltraWide QHD Monitor', 'LG 34" UltraWide QHD Дэлгэц', 'lg-34-ultrawide-qhd-' || substr(md5(random()::text), 1, 8),
    cat_monitors, brand_lg, 1290000, NULL, 8,
    'LG 34" UltraWide QHD IPS display, 160Hz refresh rate, 1ms response time, HDR10.',
    'LG 34" UltraWide QHD — 160Hz, 1ms хариу хугацаа, HDR10.', 'active');

  -- Samsung Odyssey G7
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Samsung Odyssey G7 32" Gaming', 'Samsung Odyssey G7 32" Геймийн', 'samsung-odyssey-g7-32-' || substr(md5(random()::text), 1, 8),
    cat_monitors, brand_samsung, 1590000, 1390000, 6,
    'Samsung Odyssey G7 32" curved gaming monitor, 4K 144Hz, 1ms, G-Sync compatible.',
    'Samsung Odyssey G7 — 32" муруй дэлгэц, 4K 144Hz, G-Sync.', 'active');

  -- Dell 27 4K
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Dell UltraSharp 27" 4K USB-C', 'Dell UltraSharp 27" 4K USB-C', 'dell-ultrasharp-27-4k-usbc-' || substr(md5(random()::text), 1, 8),
    cat_monitors, brand_dell, 1190000, NULL, 10,
    'Dell UltraSharp 27" 4K IPS, 60Hz, USB-C 90W charging, 99% sRGB, factory calibrated.',
    'Dell UltraSharp 27" 4K — USB-C 90W, 99% sRGB, үйлдвэрт тохируулсан.', 'active');

  -- ═══════════════════════════════════════════
  -- KEYBOARDS
  -- ═══════════════════════════════════════════

  -- Logitech MX Keys
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Logitech MX Keys Advanced', 'Logitech MX Keys Advanced', 'logitech-mx-keys-advanced-' || substr(md5(random()::text), 1, 8),
    cat_keyboards, brand_logitech, 229000, NULL, 20,
    'Logitech MX Keys wireless keyboard with smart illumination, multi-device pairing, and premium typing feel.',
    'Logitech MX Keys — утасгүй, гэрэлтдэг, олон төхөөрөмжтэй холбогдох боломжтой.', 'active');

  -- ASUS ROG Strix Scope
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'ASUS ROG Strix Scope TKL', 'ASUS ROG Strix Scope TKL', 'asus-rog-strix-scope-tkl-' || substr(md5(random()::text), 1, 8),
    cat_keyboards, brand_asus, 189000, 169000, 15,
    'ROG Strix Scope TKL mechanical keyboard with Cherry MX switches, RGB backlight, compact tenkeyless design.',
    'ROG Strix Scope TKL механик гар — Cherry MX switch, RGB гэрэлтэлт.', 'active');

  -- ═══════════════════════════════════════════
  -- MICE
  -- ═══════════════════════════════════════════

  -- Logitech G Pro X Superlight
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Logitech G Pro X Superlight 2', 'Logitech G Pro X Superlight 2', 'logitech-gpro-x-superlight2-' || substr(md5(random()::text), 1, 8),
    cat_mice, brand_logitech, 229000, NULL, 18,
    'Logitech G Pro X Superlight 2 — ultra-lightweight wireless gaming mouse, 32000 DPI, 95 hours battery life.',
    'Logitech G Pro X Superlight 2 — хэт хөнгөн утасгүй геймийн хулгана, 32000 DPI, 95 цагийн батарей.', 'active');

  -- Logitech MX Master 3S
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Logitech MX Master 3S', 'Logitech MX Master 3S', 'logitech-mx-master-3s-' || substr(md5(random()::text), 1, 8),
    cat_mice, brand_logitech, 189000, NULL, 25,
    'Logitech MX Master 3S with MagSpeed electromagnetic scrolling, 8000 DPI, multi-device Bluetooth.',
    'Logitech MX Master 3S — MagSpeed гүйлтийн дугуй, 8000 DPI, олон төхөөрөмж.', 'active');

  -- ═══════════════════════════════════════════
  -- EARBUDS
  -- ═══════════════════════════════════════════

  -- AirPods Pro 2
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Apple AirPods Pro 2nd Gen', 'Apple AirPods Pro 2-р үе', 'apple-airpods-pro-2nd-gen-' || substr(md5(random()::text), 1, 8),
    cat_earbuds, brand_apple, 590000, NULL, 30,
    'AirPods Pro with active noise cancellation, Adaptive Audio, Personalized Spatial Audio, H2 chip.',
    'AirPods Pro 2 — идэвхтэй чимээ арилгах, Adaptive Audio, H2 chip.', 'active');

  -- Sony WF-1000XM5
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Sony WF-1000XM5', 'Sony WF-1000XM5', 'sony-wf-1000xm5-' || substr(md5(random()::text), 1, 8),
    cat_earbuds, brand_sony, 490000, 450000, 20,
    'Sony WF-1000XM5 with industry-leading noise cancellation, 8-hour battery, LDAC hi-res audio.',
    'Sony WF-1000XM5 — салбарын хамгийн сайн чимээ арилгалт, 8 цагийн батарей, LDAC.', 'active');

  -- Samsung Galaxy Buds3 Pro
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Samsung Galaxy Buds3 Pro', 'Samsung Galaxy Buds3 Pro', 'samsung-galaxy-buds3-pro-' || substr(md5(random()::text), 1, 8),
    cat_earbuds, brand_samsung, 390000, 350000, 22,
    'Galaxy Buds3 Pro with intelligent ANC, 360 Audio, up to 30 hours total battery with case.',
    'Galaxy Buds3 Pro — ухаалаг ANC, 360 Audio, нийт 30 цагийн батарей.', 'active');

  -- ═══════════════════════════════════════════
  -- GPUs
  -- ═══════════════════════════════════════════

  -- RTX 4090
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'NVIDIA GeForce RTX 4090 24GB', 'NVIDIA GeForce RTX 4090 24GB', 'nvidia-rtx-4090-24gb-' || substr(md5(random()::text), 1, 8),
    cat_gpus, brand_nvidia, 3990000, NULL, 4,
    'NVIDIA RTX 4090 — the ultimate GeForce GPU. 24GB GDDR6X, 16384 CUDA cores, DLSS 3.5.',
    'RTX 4090 — хамгийн хүчирхэг GeForce GPU. 24GB GDDR6X, DLSS 3.5.', 'active');

  -- RTX 4070 Ti Super
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'NVIDIA RTX 4070 Ti Super 16GB', 'NVIDIA RTX 4070 Ti Super 16GB', 'nvidia-rtx-4070-ti-super-16gb-' || substr(md5(random()::text), 1, 8),
    cat_gpus, brand_nvidia, 1990000, 1790000, 7,
    'RTX 4070 Ti Super with 16GB GDDR6X, 8448 CUDA cores, 285W TDP, DLSS 3.5 and Frame Generation.',
    'RTX 4070 Ti Super — 16GB GDDR6X, DLSS 3.5, Frame Generation технологитой.', 'active');

  -- RTX 4060
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'NVIDIA GeForce RTX 4060 8GB', 'NVIDIA GeForce RTX 4060 8GB', 'nvidia-rtx-4060-8gb-' || substr(md5(random()::text), 1, 8),
    cat_gpus, brand_nvidia, 890000, NULL, 12,
    'RTX 4060 — great 1080p gaming performance, 8GB GDDR6, DLSS 3, low power 115W TDP.',
    'RTX 4060 — 1080p геймд тохиромжтой, 8GB GDDR6, DLSS 3, 115W цахилгаан хэрэглээ.', 'active');

  -- ═══════════════════════════════════════════
  -- STORAGE
  -- ═══════════════════════════════════════════

  -- Samsung 990 Pro NVMe
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Samsung 990 Pro 2TB NVMe SSD', 'Samsung 990 Pro 2TB NVMe SSD', 'samsung-990-pro-2tb-nvme-' || substr(md5(random()::text), 1, 8),
    cat_storage, brand_samsung, 390000, 350000, 25,
    'Samsung 990 Pro 2TB PCIe 4.0 NVMe SSD. Read 7450MB/s, Write 6900MB/s, optimized for gaming.',
    'Samsung 990 Pro 2TB — PCIe 4.0, 7450MB/s унших, 6900MB/s бичих хурд.', 'active');

  -- Samsung T7 Portable
  INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price, stock_quantity, description, description_mn, status)
  VALUES (gen_random_uuid(), 'Samsung T7 Shield 2TB Portable SSD', 'Samsung T7 Shield 2TB Зөөврийн SSD', 'samsung-t7-shield-2tb-' || substr(md5(random()::text), 1, 8),
    cat_storage, brand_samsung, 290000, NULL, 20,
    'Samsung T7 Shield portable SSD, 2TB, 1050MB/s read speed, IP65 rated, USB 3.2 Gen 2.',
    'Samsung T7 Shield 2TB — IP65 хамгаалалттай, 1050MB/s, USB 3.2 Gen 2.', 'active');

END $$;

-- Specs нэмэх
INSERT INTO product_specs (id, product_id, spec_key, spec_value, spec_group, sort_order)
SELECT gen_random_uuid(), p.id, s.key, s.value, s.grp, s.ord
FROM products p
CROSS JOIN (VALUES
  ('CPU', 'Apple M3 Max 16-core', 'Performance', 1),
  ('RAM', '36GB Unified Memory', 'Performance', 2),
  ('Storage', '1TB SSD', 'Performance', 3),
  ('Display', '16.2" Liquid Retina XDR 120Hz', 'Display', 4),
  ('Battery', '100Wh, up to 22 hours', 'Battery', 5),
  ('Weight', '2.14 kg', 'Physical', 6)
) AS s(key, value, grp, ord)
WHERE p.name = 'MacBook Pro 16" M3 Max'
AND NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id = p.id);

INSERT INTO product_specs (id, product_id, spec_key, spec_value, spec_group, sort_order)
SELECT gen_random_uuid(), p.id, s.key, s.value, s.grp, s.ord
FROM products p
CROSS JOIN (VALUES
  ('Chipset', 'Snapdragon 8 Gen 3', 'Performance', 1),
  ('RAM', '12GB', 'Performance', 2),
  ('Storage', '256GB', 'Performance', 3),
  ('Display', '6.8" Dynamic AMOLED 2X 120Hz', 'Display', 4),
  ('Camera', '200MP + 12MP + 10MP + 50MP', 'Camera', 5),
  ('Battery', '5000mAh, 45W fast charge', 'Battery', 6),
  ('S Pen', 'Built-in', 'Features', 7)
) AS s(key, value, grp, ord)
WHERE p.name = 'Samsung Galaxy S24 Ultra'
AND NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id = p.id);

INSERT INTO product_specs (id, product_id, spec_key, spec_value, spec_group, sort_order)
SELECT gen_random_uuid(), p.id, s.key, s.value, s.grp, s.ord
FROM products p
CROSS JOIN (VALUES
  ('Chip', 'A17 Pro', 'Performance', 1),
  ('Storage', '256GB', 'Performance', 2),
  ('Display', '6.7" Super Retina XDR, 120Hz', 'Display', 3),
  ('Camera', '48MP main + 12MP ultrawide + 12MP 5x telephoto', 'Camera', 4),
  ('Battery', '4422mAh, USB 3', 'Battery', 5),
  ('Build', 'Titanium frame', 'Physical', 6)
) AS s(key, value, grp, ord)
WHERE p.name = 'Apple iPhone 15 Pro Max'
AND NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id = p.id);

INSERT INTO product_specs (id, product_id, spec_key, spec_value, spec_group, sort_order)
SELECT gen_random_uuid(), p.id, s.key, s.value, s.grp, s.ord
FROM products p
CROSS JOIN (VALUES
  ('VRAM', '24GB GDDR6X', 'Performance', 1),
  ('CUDA Cores', '16384', 'Performance', 2),
  ('Memory Bandwidth', '1008 GB/s', 'Performance', 3),
  ('TDP', '450W', 'Power', 4),
  ('Ray Tracing', '3rd Gen RT Cores', 'Features', 5),
  ('DLSS', 'DLSS 3.5 + Frame Generation', 'Features', 6)
) AS s(key, value, grp, ord)
WHERE p.name = 'NVIDIA GeForce RTX 4090 24GB'
AND NOT EXISTS (SELECT 1 FROM product_specs WHERE product_id = p.id);

