import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../shared/db';
import { requireAuth } from '../../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';
import { Errors } from '../../shared/errors';

const router = Router();

router.get('/product/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await query(
      `SELECT r.id, r.rating, r.body, r.created_at, u.full_name as user_name
       FROM reviews r JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1 AND r.approved = true ORDER BY r.created_at DESC`,
      [req.params.productId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { product_id, rating, body } = req.body;
    if (rating < 1 || rating > 5) throw Errors.VALIDATION('Rating must be 1-5');

    const existing = await queryOne(
      'SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2',
      [req.user!.userId, product_id]
    );
    if (existing) throw Errors.CONFLICT('You have already reviewed this product');

    const review = await queryOne(
      `INSERT INTO reviews (id, user_id, product_id, rating, body, approved, created_at)
       VALUES ($1,$2,$3,$4,$5, false, NOW()) RETURNING *`,
      [uuidv4(), req.user!.userId, product_id, rating, body]
    );
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await queryOne(
      'SELECT id FROM reviews WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user!.userId]
    );
    if (!review) throw Errors.NOT_FOUND('Review');
    await query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export default router;
