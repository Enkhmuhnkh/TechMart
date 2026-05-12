CREATE TABLE IF NOT EXISTS payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_sandbox BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'qpay',
  invoice_id VARCHAR(200),
  qr_text TEXT,
  qr_image TEXT,
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',
  paid_at TIMESTAMP,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

INSERT INTO payment_gateways (provider, is_active, is_sandbox, config)
VALUES ('qpay', false, true, '{"username":"","password":"","invoice_code":""}')
ON CONFLICT (provider) DO NOTHING;
