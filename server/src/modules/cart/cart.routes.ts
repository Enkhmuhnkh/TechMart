import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../shared/db';
import { requireAuth } from '../../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';
import { Errors } from '../../shared/errors';

const router = Router();

async function getOrCreateCart(userId: string) {
  let cart = await queryOne<{ id: string }>(
    'SELECT id FROM carts WHERE user_id = $1', [userId]
  );
  if (!cart) {
    cart = await queryOne<{ id: string }>(
      'INSERT INTO carts (id, user_id, updated_at) VALUES ($1, $2, NOW()) RETURNING id',
      [uuidv4(), userId]
    );
  }
  return cart!.id;
}

async function getCartWithItems(userId: string) {
  const cartId = await getOrCreateCart(userId);
  const { rows } = await query(
    `SELECT ci.id, ci.quantity, ci.product_id,
            p.name, p.name_mn, p.slug, p.price, p.sale_price, p.stock_quantity,
            (SELECT url FROM product_images WHERE product_id = p.id AND is_primary=true LIMIT 1) as image_url
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = $1`,
    [cartId]
  );
  const total = rows.reduce((sum, item) => {
    const price = (item as any).sale_price || (item as any).price;
    return sum + price * (item as any).quantity;
  }, 0);
  return { cartId, items: rows, total };
}

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await getCartWithItems(req.user!.userId);
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
});

router.post('/items', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const cartId = await getOrCreateCart(req.user!.userId);

    const existing = await queryOne<{ id: string; quantity: number }>(
      'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cartId, product_id]
    );

    if (existing) {
      await query('UPDATE cart_items SET quantity = $1 WHERE id = $2',
        [existing.quantity + quantity, existing.id]);
    } else {
      await query(
        'INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES ($1,$2,$3,$4)',
        [uuidv4(), cartId, product_id, quantity]
      );
    }

    const cart = await getCartWithItems(req.user!.userId);
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
});

router.patch('/items/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity } = req.body;
    if (quantity < 1) {
      await query('DELETE FROM cart_items WHERE id = $1', [req.params.id]);
    } else {
      await query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [quantity, req.params.id]);
    }
    const cart = await getCartWithItems(req.user!.userId);
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
});

router.delete('/items/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await query('DELETE FROM cart_items WHERE id = $1', [req.params.id]);
    const cart = await getCartWithItems(req.user!.userId);
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
});

router.delete('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartId = await getOrCreateCart(req.user!.userId);
    await query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    res.json({ success: true, data: { items: [], total: 0 } });
  } catch (err) { next(err); }
});

export default router;
