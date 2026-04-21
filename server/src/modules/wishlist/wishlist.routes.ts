import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../shared/db';
import { requireAuth } from '../../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query(
      `SELECT w.id, w.created_at, p.id as product_id, p.name, p.name_mn, p.slug,
              p.price, p.sale_price, p.stock_quantity,
              (SELECT url FROM product_images WHERE product_id = p.id AND is_primary=true LIMIT 1) as image_url
       FROM wishlists w JOIN products p ON w.product_id = p.id
       WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
      [req.user!.userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { product_id } = req.body;
    const existing = await queryOne(
      'SELECT id FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [req.user!.userId, product_id]
    );
    if (!existing) {
      await query(
        'INSERT INTO wishlists (id, user_id, product_id, created_at) VALUES ($1,$2,$3,NOW())',
        [uuidv4(), req.user!.userId, product_id]
      );
    }
    res.json({ success: true, data: { product_id } });
  } catch (err) { next(err); }
});

router.delete('/:productId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await query(
      'DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [req.user!.userId, req.params.productId]
    );
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export default router;
