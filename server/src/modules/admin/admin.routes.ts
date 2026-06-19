import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../shared/db';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import { parsePagination, buildMeta } from '../../shared/paginate';

const router = Router();
router.use(requireAuth, requireAdmin);

// Comprehensive dashboard stats — all data in one parallel request
router.get('/dashboard-stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      kpiRow,
      userRow,
      productRow,
      dailyRevenue,
      monthlyRevenue,
      ordersByStatus,
      topProducts,
      categoryStats,
      lowStock,
      recentOrders,
      recentUsers,
    ] = await Promise.all([

      // ① Revenue + order KPI comparisons (today/month/year vs prior period)
      queryOne<{
        today_revenue: string; yesterday_revenue: string;
        this_month_revenue: string; last_month_revenue: string;
        this_year_revenue: string; last_year_revenue: string;
        today_orders: string; yesterday_orders: string;
        this_month_orders: string; last_month_orders: string;
        active_orders: string; avg_order_value: string;
      }>(`
        SELECT
          COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE
            AND status = 'delivered' THEN total_amount END), 0)                                         AS today_revenue,
          COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE - 1
            AND status = 'delivered' THEN total_amount END), 0)                                         AS yesterday_revenue,
          COALESCE(SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
            AND status = 'delivered' THEN total_amount END), 0)                                         AS this_month_revenue,
          COALESCE(SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
            AND status = 'delivered' THEN total_amount END), 0)                                         AS last_month_revenue,
          COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
            AND status = 'delivered' THEN total_amount END), 0)                                         AS this_year_revenue,
          COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW()) - 1
            AND status = 'delivered' THEN total_amount END), 0)                                         AS last_year_revenue,
          COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE
            AND status NOT IN ('cancelled','refunded'))                                                  AS today_orders,
          COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE - 1
            AND status NOT IN ('cancelled','refunded'))                                                  AS yesterday_orders,
          COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
            AND status NOT IN ('cancelled','refunded'))                                                  AS this_month_orders,
          COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
            AND status NOT IN ('cancelled','refunded'))                                                  AS last_month_orders,
          COUNT(*) FILTER (WHERE status NOT IN ('cancelled','refunded'))                                 AS active_orders,
          COALESCE(ROUND(AVG(total_amount) FILTER (WHERE status NOT IN ('cancelled','refunded')), 0), 0) AS avg_order_value
        FROM orders
      `),

      // ② User growth: total + this month vs last month
      queryOne<{ total: string; new_this_month: string; new_last_month: string }>(`
        SELECT
          COUNT(*)                                                                                               AS total,
          COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()))                 AS new_this_month,
          COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')) AS new_last_month
        FROM users WHERE role = 'customer'
      `),

      // ③ Product inventory snapshot
      queryOne<{ total_active: string; out_of_stock: string; low_stock_count: string }>(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'active')                              AS total_active,
          COUNT(*) FILTER (WHERE stock_quantity = 0 AND status = 'active')       AS out_of_stock,
          COUNT(*) FILTER (WHERE stock_quantity <= 5 AND stock_quantity > 0 AND status = 'active') AS low_stock_count
        FROM products
      `),

      // ④ Daily revenue — last 30 days
      query<{ day: string; revenue: string; order_count: string }>(`
        SELECT
          TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS day,
          COALESCE(SUM(total_amount), 0)                        AS revenue,
          COUNT(*)                                              AS order_count
        FROM orders
        WHERE status = 'delivered'
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY DATE_TRUNC('day', created_at)
      `),

      // ⑤ Monthly revenue — last 12 months
      query<{ month: string; revenue: string; order_count: string }>(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM-01') AS month,
          COALESCE(SUM(total_amount), 0)                          AS revenue,
          COUNT(*)                                                AS order_count
        FROM orders
        WHERE status = 'delivered'
          AND created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
      `),

      // ⑥ Orders count by each status
      query<{ status: string; count: string }>(`
        SELECT status, COUNT(*) AS count
        FROM orders
        GROUP BY status
        ORDER BY count DESC
      `),

      // ⑦ Top 10 products by revenue (delivered orders only)
      query<{ id: string; name: string; units_sold: string; revenue: string; image_url: string | null }>(`
        SELECT
          p.id,
          p.name,
          SUM(oi.quantity)              AS units_sold,
          SUM(oi.quantity * oi.unit_price) AS revenue,
          (SELECT url FROM product_images
           WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o   ON o.id = oi.order_id AND o.status = 'delivered'
        GROUP BY p.id, p.name
        ORDER BY revenue DESC
        LIMIT 10
      `),

      // ⑧ Revenue + units sold per category (delivered only)
      query<{ category: string; units_sold: string; revenue: string }>(`
        SELECT
          c.name                              AS category,
          COALESCE(SUM(oi.quantity), 0)       AS units_sold,
          COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue
        FROM categories c
        LEFT JOIN products p     ON p.category_id = c.id
        LEFT JOIN order_items oi ON oi.product_id = p.id
        LEFT JOIN orders o       ON o.id = oi.order_id AND o.status = 'delivered'
        GROUP BY c.name
        ORDER BY revenue DESC
      `),

      // ⑨ Low stock products (stock ≤ 5)
      query(`
        SELECT id, name, stock_quantity
        FROM products
        WHERE stock_quantity <= 5 AND status = 'active'
        ORDER BY stock_quantity ASC
        LIMIT 20
      `),

      // ⑩ Recent 10 orders with item count
      query(`
        SELECT o.id, o.status, o.total_amount, o.created_at, o.payment_status,
               u.full_name, u.email,
               COUNT(oi.id) AS item_count
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        GROUP BY o.id, u.full_name, u.email
        ORDER BY o.created_at DESC
        LIMIT 10
      `),

      // ⑪ Recent 5 registered customers
      query(`
        SELECT id, full_name, email, created_at
        FROM users WHERE role = 'customer'
        ORDER BY created_at DESC
        LIMIT 5
      `),
    ]);

    res.json({
      success: true,
      data: {
        revenue: {
          today:     parseFloat(kpiRow?.today_revenue      || '0'),
          yesterday: parseFloat(kpiRow?.yesterday_revenue  || '0'),
          thisMonth: parseFloat(kpiRow?.this_month_revenue || '0'),
          lastMonth: parseFloat(kpiRow?.last_month_revenue || '0'),
          thisYear:  parseFloat(kpiRow?.this_year_revenue  || '0'),
          lastYear:  parseFloat(kpiRow?.last_year_revenue  || '0'),
        },
        orders: {
          today:         parseInt(kpiRow?.today_orders      || '0'),
          yesterday:     parseInt(kpiRow?.yesterday_orders  || '0'),
          thisMonth:     parseInt(kpiRow?.this_month_orders || '0'),
          lastMonth:     parseInt(kpiRow?.last_month_orders || '0'),
          active:        parseInt(kpiRow?.active_orders     || '0'),
          avgOrderValue: parseFloat(kpiRow?.avg_order_value || '0'),
        },
        users: {
          total:        parseInt(userRow?.total          || '0'),
          newThisMonth: parseInt(userRow?.new_this_month || '0'),
          newLastMonth: parseInt(userRow?.new_last_month || '0'),
        },
        products: {
          totalActive:   parseInt(productRow?.total_active    || '0'),
          outOfStock:    parseInt(productRow?.out_of_stock    || '0'),
          lowStockCount: parseInt(productRow?.low_stock_count || '0'),
        },
        dailyRevenue: dailyRevenue.rows.map(r => ({
          day:        r.day,
          revenue:    parseFloat(r.revenue),
          orderCount: parseInt(r.order_count),
        })),
        monthlyRevenue: monthlyRevenue.rows.map(r => ({
          month:      r.month,
          revenue:    parseFloat(r.revenue),
          orderCount: parseInt(r.order_count),
        })),
        ordersByStatus: ordersByStatus.rows.map(r => ({
          status: r.status,
          count:  parseInt(r.count),
        })),
        topProducts: topProducts.rows.map(r => ({
          id:        r.id,
          name:      r.name,
          unitsSold: parseInt(r.units_sold),
          revenue:   parseFloat(r.revenue),
          imageUrl:  r.image_url,
        })),
        categoryStats: categoryStats.rows.map(r => ({
          category:  r.category,
          unitsSold: parseInt(r.units_sold),
          revenue:   parseFloat(r.revenue),
        })),
        lowStockProducts: lowStock.rows,
        recentOrders: recentOrders.rows.map((r: any) => ({
          ...r,
          item_count: parseInt(r.item_count),
        })),
        recentUsers: recentUsers.rows,
      },
    });
  } catch (err) { next(err); }
});

// Dashboard overview (legacy — kept for backwards compat)
router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [users, products, orders, brands, revenue, lowStock, recentOrders, recentUsers] =
      await Promise.all([
        queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users WHERE role = $1', ['customer']),
        queryOne<{ count: string }>("SELECT COUNT(*) as count FROM products WHERE status = 'active'"),
        queryOne<{ count: string }>("SELECT COUNT(*) as count FROM orders WHERE status NOT IN ('cancelled', 'refunded')"),
        queryOne<{ count: string }>('SELECT COUNT(*) as count FROM brands'),
        queryOne<{ total: string }>("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'delivered'"),
        query("SELECT id, name, stock_quantity FROM products WHERE stock_quantity <= 5 AND status = 'active' ORDER BY stock_quantity LIMIT 10"),
        query(`SELECT o.id, o.status, o.total_amount, o.created_at, u.full_name, u.email
               FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5`),
        query('SELECT id, full_name, email, created_at FROM users WHERE role = $1 ORDER BY created_at DESC LIMIT 5', ['customer']),
      ]);

    res.json({
      success: true,
      data: {
        stats: {
          users:    parseInt(users?.count    || '0'),
          products: parseInt(products?.count || '0'),
          orders:   parseInt(orders?.count   || '0'),
          brands:   parseInt(brands?.count   || '0'),
          revenue:  parseFloat(revenue?.total || '0'),
        },
        lowStock:     lowStock.rows,
        recentOrders: recentOrders.rows,
        recentUsers:  recentUsers.rows,
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
    const status = req.query.status as string | undefined;

    const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    const safeStatus = status && VALID_STATUSES.includes(status) ? status : null;

    const countParams: unknown[] = safeStatus ? [safeStatus] : [];
    const countWhere = safeStatus ? 'WHERE o.status = $1' : '';
    const count = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM orders o ${countWhere}`, countParams);

    const listParams: unknown[] = safeStatus ? [safeStatus, limit, offset] : [limit, offset];
    const listWhere = safeStatus ? 'WHERE o.status = $1' : '';
    const limitParam  = safeStatus ? '$2' : '$1';
    const offsetParam = safeStatus ? '$3' : '$2';
    const { rows } = await query(
      `SELECT o.*, u.full_name, u.email,
              COUNT(oi.id) as item_count
       FROM orders o JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${listWhere} GROUP BY o.id, u.full_name, u.email
       ORDER BY o.created_at DESC LIMIT ${limitParam} OFFSET ${offsetParam}`,
      listParams
    );
    res.json({ success: true, data: rows, meta: buildMeta(page, limit, parseInt(count?.count || '0')) });
  } catch (err) { next(err); }
});

router.patch('/orders/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ success: false, error: { message: 'Буруу статус утга' } });
      return;
    }

    // Cash orders: auto-mark paid when delivered
    // QPay orders: payment_status is set by webhook/callback — don't touch it here
    const order = await queryOne(
      `UPDATE orders
       SET status         = $1,
           payment_status = CASE
             WHEN $1 = 'delivered' AND payment_method = 'cash' THEN 'paid'
             ELSE payment_status
           END,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
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

    let products: any[];
    if (customIds.length > 0) {
      // Return custom selected products
      const { rows } = await query(
        `SELECT p.id, p.name, p.name_mn, p.slug, p.price, p.sale_price, p.stock_quantity,
                c.slug as category_slug, b.name as brand_name,
                (SELECT url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as image_url
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
                (SELECT url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as image_url
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
