import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../shared/db';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import { v4 as uuidv4 } from 'uuid';
import { Errors } from '../../shared/errors';

const router = Router();

async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { rows } = await query(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
       GROUP BY c.id
       ORDER BY c.sort_order, c.name`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, name_mn, slug, parent_id, icon, sort_order } = req.body;
    const category = await queryOne(
      `INSERT INTO categories (id, name, name_mn, slug, parent_id, icon, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [uuidv4(), name, name_mn, slug, parent_id ?? null, icon ?? null, sort_order ?? 0]
    );
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, name_mn, slug, parent_id, icon, sort_order } = req.body;
    const category = await queryOne(
      `UPDATE categories SET name=$1,name_mn=$2,slug=$3,parent_id=$4,icon=$5,sort_order=$6
       WHERE id=$7 RETURNING *`,
      [name, name_mn, slug, parent_id ?? null, icon ?? null, sort_order ?? 0, req.params.id]
    );
    if (!category) throw Errors.NOT_FOUND('Category');
    res.json({ success: true, data: category });
  } catch (err) { next(err); }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
}

router.get('/', list);
router.post('/', requireAuth, requireAdmin, create);
router.put('/:id', requireAuth, requireAdmin, update);
router.delete('/:id', requireAuth, requireAdmin, remove);

export default router;
