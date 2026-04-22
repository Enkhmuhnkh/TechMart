INSERT INTO store_settings (key, value) VALUES
  ('hero_banners', '[
    {"id":1,"tag":"Шинэ ирэлт","title":"Хамгийн сүүлийн\nTech гаджетууд","subtitle":"Laptop, Phone, Monitor болон бусад","cta":"Үзэх","emoji":"💻","accent":"#6C63FF","image_url":"","bg":"linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"},
    {"id":2,"tag":"Gaming Setup","title":"Тоглоомын\nДэлгэрэнгүй дэлгүүр","subtitle":"Monitor, GPU, Keyboard, Mouse","cta":"Харах","emoji":"🎮","accent":"#00D4AA","image_url":"","bg":"linear-gradient(135deg, #0d0d0d 0%, #1a0a2e 50%, #2d1b69 100%)"}
  ]'),
  ('trust_items', '[
    {"icon":"truck","title":"Үнэгүй хүргэлт","desc":"100,000₮-аас дээш захиалгад","color":"#6C63FF"},
    {"icon":"headphones","title":"24/7 Дэмжлэг","desc":"Мэргэжлийн техникийн тусламж","color":"#00D4AA"},
    {"icon":"shield","title":"Мөнгө буцаалт","desc":"30 хоногийн баталгаа","color":"#F59E0B"},
    {"icon":"zap","title":"Жинхэнэ бараа","desc":"100% баталгаат бүтээгдэхүүн","color":"#EF4444"}
  ]'),
  ('announcement', '')
ON CONFLICT (key) DO NOTHING;