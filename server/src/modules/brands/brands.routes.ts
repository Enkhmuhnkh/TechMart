import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../shared/db';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import { v4 as uuidv4 } from 'uuid';
import { Errors } from '../../shared/errors';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT b.*, COUNT(p.id) as product_count
       FROM brands b LEFT JOIN products p ON p.brand_id = b.id AND p.status = 'active'
       GROUP BY b.id ORDER BY b.name`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, logo_url, country } = req.body;
    const brand = await queryOne(
      'INSERT INTO brands (id, name, logo_url, country) VALUES ($1,$2,$3,$4) RETURNING *',
      [uuidv4(), name, logo_url ?? null, country ?? null]
    );
    res.status(201).json({ success: true, data: brand });
  } catch (err) { next(err); }
});

router.put('/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, logo_url, country } = req.body;
    const brand = await queryOne(
      'UPDATE brands SET name=$1, logo_url=$2, country=$3 WHERE id=$4 RETURNING *',
      [name, logo_url ?? null, country ?? null, req.params.id]
    );
    if (!brand) throw Errors.NOT_FOUND('Brand');
    res.json({ success: true, data: brand });
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await query('DELETE FROM brands WHERE id = $1', [req.params.id]);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
});

export default router;
