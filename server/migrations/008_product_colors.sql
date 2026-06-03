-- Product colors table
CREATE TABLE product_colors (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  hex        VARCHAR(7)   NOT NULL DEFAULT '#000000',
  sort_order INT          NOT NULL DEFAULT 0
);

CREATE INDEX idx_product_colors_product ON product_colors(product_id);
