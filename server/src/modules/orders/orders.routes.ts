import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { query, queryOne, transaction } from '../../shared/db';
import { requireAuth } from '../../middleware/auth.middleware';
import { parsePagination, buildMeta } from '../../shared/paginate';
import { v4 as uuidv4 } from 'uuid';
import { Errors } from '../../shared/errors';

const router = Router();

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shipping_address, payment_method } = req.body;
    const userId = req.user!.userId;

    const order = await transaction(async (db) => {
      // Get cart items
      const cart = await queryOne<{ id: string }>(
        'SELECT id FROM carts WHERE user_id = $1', [userId]
      );
      if (!cart) throw Errors.VALIDATION('Cart is empty');

      const { rows: items } = await query(
        `SELECT ci.quantity, p.id as product_id, p.price, p.sale_price, p.stock_quantity, p.name
         FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = $1`,
        [cart.id]
      );
      if (!items.length) throw Errors.VALIDATION('Cart is empty');

      // Check stock
      for (const item of items) {
        if ((item as any).stock_quantity < (item as any).quantity) {
          throw Errors.VALIDATION(`Insufficient stock for ${(item as any).name}`);
        }
      }

      const total = items.reduce((sum, item) => {
        const price = (item as any).sale_price || (item as any).price;
        return sum + price * (item as any).quantity;
      }, 0);

      const orderId = uuidv4();
      await db.query(
        `INSERT INTO orders (id, user_id, status, total_amount, shipping_address, payment_method, payment_status, created_at)
         VALUES ($1,$2,'pending',$3,$4,$5,'pending', NOW())`,
        [orderId, userId, total, JSON.stringify(shipping_address), payment_method]
      );

      for (const item of items) {
        const price = (item as any).sale_price || (item as any).price;
        await db.query(
          'INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4,$5)',
          [uuidv4(), orderId, (item as any).product_id, (item as any).quantity, price]
        );
        await db.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
          [(item as any).quantity, (item as any).product_id]
        );
      }

      // Clear cart
      await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);

      return queryOne('SELECT * FROM orders WHERE id = $1', [orderId]);
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
});

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as any);
    const userId = req.user!.userId;

    const countResult = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = $1', [userId]
    );
    const total = parseInt(countResult?.count || '0');

    const { rows } = await query(
      `SELECT o.*, COUNT(oi.id) as item_count
       FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ success: true, data: rows, meta: buildMeta(page, limit, total) });
  } catch (err) { next(err); }
});

router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await queryOne(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.userId]
    );
    if (!order) throw Errors.NOT_FOUND('Order');

    const { rows: items } = await query(
      `SELECT oi.*, p.name, p.slug,
              (SELECT url FROM product_images WHERE product_id = p.id AND is_primary=true LIMIT 1) as image_url
       FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...order, items } });
  } catch (err) { next(err); }
});

export default router;
