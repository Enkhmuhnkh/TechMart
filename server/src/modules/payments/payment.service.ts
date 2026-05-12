import { query, queryOne } from '../../shared/db';

const QPAY_SANDBOX = 'https://sandbox.qpay.mn/v2';
const QPAY_PROD    = 'https://api.qpay.mn/v2';

interface QPayConfig {
  username: string;
  password: string;
  invoice_code: string;
}

interface GatewayRow {
  config: QPayConfig;
  is_sandbox: boolean;
  is_active: boolean;
}

// ── Get QPay config from DB ──────────────────────────────────────────────────
async function getQPayConfig(): Promise<{ config: QPayConfig; baseUrl: string } | null> {
  const gw = await queryOne<GatewayRow>(
    "SELECT config, is_sandbox, is_active FROM payment_gateways WHERE provider = 'qpay'"
  );
  if (!gw || !gw.is_active) return null;
  const cfg = typeof gw.config === 'string' ? JSON.parse(gw.config) : gw.config;
  if (!cfg.username || !cfg.password) return null;
  return { config: cfg, baseUrl: gw.is_sandbox ? QPAY_SANDBOX : QPAY_PROD };
}

// ── QPay auth token ──────────────────────────────────────────────────────────
let tokenCache: { token: string; exp: number } | null = null;

async function getToken(config: QPayConfig, baseUrl: string): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.exp) return tokenCache.token;

  const res = await fetch(`${baseUrl}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64'),
    },
  });
  if (!res.ok) throw new Error(`QPay auth failed: ${res.status}`);
  const data = await res.json() as any;
  tokenCache = { token: data.access_token, exp: Date.now() + (data.expires_in - 60) * 1000 };
  return tokenCache.token;
}

// ── Create QPay invoice ──────────────────────────────────────────────────────
export async function createQPayInvoice(orderId: string, amount: number, description: string) {
  const gw = await getQPayConfig();
  if (!gw) throw new Error('QPay тохируулагдаагүй байна. Admin → Тохиргоо → Төлбөр хэсэгт идэвхжүүлнэ үү.');

  const token = await getToken(gw.config, gw.baseUrl);

  const body = {
    invoice_code: gw.config.invoice_code,
    sender_invoice_no: orderId.replace(/-/g, '').slice(0, 20),
    invoice_receiver_code: 'terminal',
    invoice_description: description.slice(0, 100),
    amount,
    callback_url: `${process.env.SERVER_URL || 'https://techmart-server.onrender.com'}/api/payments/qpay/callback`,
  };

  const res = await fetch(`${gw.baseUrl}/invoice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`QPay invoice алдаа: ${err}`);
  }

  const data = await res.json() as any;

  // Save to DB
  await query(
    `INSERT INTO payments (order_id, provider, invoice_id, qr_text, qr_image, amount, status)
     VALUES ($1, 'qpay', $2, $3, $4, $5, 'pending')
     ON CONFLICT DO NOTHING`,
    [orderId, data.invoice_id, data.qr_text, data.qr_image, amount]
  );

  return {
    invoiceId: data.invoice_id,
    qrText: data.qr_text,
    qrImage: data.qr_image,
    urls: data.urls || [],
  };
}

// ── Check QPay payment status ────────────────────────────────────────────────
export async function checkQPayStatus(invoiceId: string): Promise<'pending' | 'paid' | 'failed'> {
  const gw = await getQPayConfig();
  if (!gw) return 'pending';

  try {
    const token = await getToken(gw.config, gw.baseUrl);
    const res = await fetch(`${gw.baseUrl}/payment/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ object_type: 'INVOICE', object_id: invoiceId }),
    });

    if (!res.ok) return 'pending';
    const data = await res.json() as any;
    const rows = data.rows || [];
    const paid = rows.some((r: any) => r.payment_status === 'PAID');

    if (paid) {
      await query(
        `UPDATE payments SET status='paid', paid_at=NOW(), updated_at=NOW() WHERE invoice_id=$1`,
        [invoiceId]
      );
      const payment = await queryOne<{ order_id: string }>(
        'SELECT order_id FROM payments WHERE invoice_id = $1', [invoiceId]
      );
      if (payment) {
        await query(
          `UPDATE orders SET status='processing', payment_status='paid', updated_at=NOW() WHERE id=$1`,
          [payment.order_id]
        );
      }
      return 'paid';
    }
    return 'pending';
  } catch {
    return 'pending';
  }
}

// ── Handle QPay webhook callback ─────────────────────────────────────────────
export async function handleQPayCallback(invoiceId: string) {
  return checkQPayStatus(invoiceId);
}

// ── Get payment info ─────────────────────────────────────────────────────────
export async function getPaymentByOrder(orderId: string) {
  return queryOne(
    'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
    [orderId]
  );
}

// ── Gateway CRUD (admin) ─────────────────────────────────────────────────────
export async function saveGateway(provider: string, config: object, isActive: boolean, isSandbox: boolean) {
  tokenCache = null; // Clear token cache when config changes
  await query(
    `INSERT INTO payment_gateways (provider, config, is_active, is_sandbox, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (provider)
     DO UPDATE SET config=$2, is_active=$3, is_sandbox=$4, updated_at=NOW()`,
    [provider, JSON.stringify(config), isActive, isSandbox]
  );
}

export async function getGateways() {
  const { rows } = await query('SELECT * FROM payment_gateways ORDER BY provider');
  return rows;
}
