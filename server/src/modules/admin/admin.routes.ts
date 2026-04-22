import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../shared/db';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import { parsePagination, buildMeta } from '../../shared/paginate';

const router = Router();
router.use(requireAuth, requireAdmin);

// Dashboard overview
router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [users, products, orders, brands, revenue, lowStock, recentOrders, recentUsers] =
      await Promise.all([
        queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users WHERE role = $1', ['customer']),
        queryOne<{ count: string }>("SELECT COUNT(*) as count FROM products WHERE status = 'active'"),
        queryOne<{ count: string }>('SELECT COUNT(*) as count FROM orders'),
        queryOne<{ count: string }>('SELECT COUNT(*) as count FROM brands'),
        queryOne<{ total: string }>(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid'`),
        query("SELECT id, name, stock_quantity FROM products WHERE stock_quantity < 10 AND status = 'active' ORDER BY stock_quantity LIMIT 10"),
        query(`SELECT o.id, o.status, o.total_amount, o.created_at, u.full_name, u.email
               FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5`),
        query('SELECT id, full_name, email, created_at FROM users ORDER BY created_at DESC LIMIT 5'),
      ]);

    res.json({
      success: true,
      data: {
        stats: {
          users: parseInt(users?.count || '0'),
          products: parseInt(products?.count || '0'),
          orders: parseInt(orders?.count || '0'),
          brands: parseInt(brands?.count || '0'),
          revenue: parseFloat(revenue?.total || '0'),
        },
        lowStock: lowStock.rows,
        recentOrders: recentOrders.rows,
        recentUsers: recentUsers.rows,
      },
    });
  } catch (err) { next(err); }
});

// Analytics - monthly revenue
router.get('/analytics/revenue', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query(
      `SELECT DATE_TRUNC('month', created_at) as month,
              COUNT(*) as order_count,
              SUM(total_amount) as revenue
       FROM orders WHERE payment_status = 'paid'
         AND created_at >= NOW() - INTERVAL '12 months'
       GROUP BY month ORDER BY month`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// Analytics - top products
router.get('/analytics/products', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows: topSellers } = await query(
      `SELECT p.id, p.name, SUM(oi.quantity) as units_sold, SUM(oi.quantity * oi.unit_price) as revenue
       FROM order_items oi JOIN products p ON oi.product_id = p.id
       GROUP BY p.id, p.name ORDER BY units_sold DESC LIMIT 10`
    );
    const { rows: byCategory } = await query(
      `SELECT c.name as category, COUNT(p.id) as product_count, SUM(oi.quantity) as units_sold
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       GROUP BY c.name ORDER BY units_sold DESC`
    );
    res.json({ success: true, data: { topSellers, byCategory } });
  } catch (err) { next(err); }
});

// Analytics - user growth
router.get('/analytics/users', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query(
      `SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as new_users
       FROM users WHERE role = 'customer' AND created_at >= NOW() - INTERVAL '12 months'
       GROUP BY month ORDER BY month`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// Analytics - stock overview
router.get('/analytics/stock', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query(
      `SELECT c.name as category,
              COUNT(*) FILTER (WHERE p.stock_quantity > 10) as in_stock,
              COUNT(*) FILTER (WHERE p.stock_quantity BETWEEN 1 AND 10) as low_stock,
              COUNT(*) FILTER (WHERE p.stock_quantity = 0) as out_of_stock
       FROM products p JOIN categories c ON p.category_id = c.id
       WHERE p.status = 'active'
       GROUP BY c.name ORDER BY c.name`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// Order management
router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as any);
    const status = req.query.status as string;
    const conditions = status ? [`o.status = '${status}'`] : [];
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const count = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM orders o ${where}`);
    const { rows } = await query(
      `SELECT o.*, u.full_name, u.email,
              COUNT(oi.id) as item_count
       FROM orders o JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${where} GROUP BY o.id, u.full_name, u.email
       ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ success: true, data: rows, meta: buildMeta(page, limit, parseInt(count?.count || '0')) });
  } catch (err) { next(err); }
});

router.patch('/orders/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const order = await queryOne(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// User management
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as any);
    const search = req.query.search as string;
    const vals: unknown[] = [limit, offset];
    const where = search ? `WHERE full_name ILIKE $3 OR email ILIKE $3` : '';
    if (search) vals.push(`%${search}%`);

    const count = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM users ${where}`, search ? [`%${search}%`] : []);
    const { rows } = await query(
      `SELECT id, email, full_name, phone, role, language_pref, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      vals
    );
    res.json({ success: true, data: rows, meta: buildMeta(page, limit, parseInt(count?.count || '0')) });
  } catch (err) { next(err); }
});

router.patch('/users/:id/role', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    if (!['customer', 'admin'].includes(role)) throw new Error('Invalid role');
    const user = await queryOne(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, full_name, role',
      [role, req.params.id]
    );
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// Review moderation
router.get('/reviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as any);
    const approved = req.query.approved;
    const where = approved !== undefined ? `WHERE r.approved = ${approved === 'true'}` : '';

    const count = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM reviews r ${where}`);
    const { rows } = await query(
      `SELECT r.*, u.full_name as user_name, p.name as product_name
       FROM reviews r JOIN users u ON r.user_id = u.id JOIN products p ON r.product_id = p.id
       ${where} ORDER BY r.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ success: true, data: rows, meta: buildMeta(page, limit, parseInt(count?.count || '0')) });
  } catch (err) { next(err); }
});

router.patch('/reviews/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await queryOne('UPDATE reviews SET approved = true WHERE id = $1 RETURNING *', [req.params.id]);
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
});

router.delete('/reviews/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export default router;

// ═══════════════════════════════════════════════════
// STORE SETTINGS
// ═══════════════════════════════════════════════════

// Get all settings
router.get('/settings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query('SELECT key, value FROM store_settings ORDER BY key');
    const settings: Record<string, string> = {};
    rows.forEach((r: any) => { settings[r.key] = r.value; });
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

// Update settings
router.post('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) {
      await query(
        `INSERT INTO store_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, typeof value === 'object' ? JSON.stringify(value) : String(value)]
      );
    }
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Get sale sidebar products (products with sale_price, limit 10)
router.get('/settings/sale-products', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if custom list is set
    const setting = await queryOne<{ value: string }>(
      "SELECT value FROM store_settings WHERE key = 'sidebar_sale_product_ids'"
    );
    const customIds = setting ? JSON.parse(setting.value || '[]') : [];

    let products;
    if (customIds.length > 0) {
      // Return custom selected products
      const { rows } = await query(
        `SELECT p.id, p.name, p.name_mn, p.slug, p.price, p.sale_price, p.stock_quantity,
                c.slug as category_slug, b.name as brand_name,
                (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN brands b ON p.brand_id = b.id
         WHERE p.id = ANY($1) AND p.status = 'active'
         ORDER BY p.sale_price ASC`,
        [customIds]
      );
      products = rows;
    } else {
      // Default: latest discounted products
      const { rows } = await query(
        `SELECT p.id, p.name, p.name_mn, p.slug, p.price, p.sale_price, p.stock_quantity,
                c.slug as category_slug, b.name as brand_name,
                (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN brands b ON p.brand_id = b.id
         WHERE p.sale_price IS NOT NULL AND p.status = 'active'
         ORDER BY p.created_at DESC
         LIMIT 10`
      );
      products = rows;
    }
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
});
