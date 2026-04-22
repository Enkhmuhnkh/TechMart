import { Router } from 'express';
import multer from 'multer';
import * as c from './products.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';

// Use memory storage — Cloudinary-д шууд upload хийнэ
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

// Public
router.get('/', c.list);
router.get('/compare', c.compare);
router.get('/:slug', c.getBySlug);

// Admin
router.post('/', requireAuth, requireAdmin, c.create);
router.put('/:id', requireAuth, requireAdmin, c.update);
router.delete('/:id', requireAuth, requireAdmin, c.remove);
router.put('/:id/specs', requireAuth, requireAdmin, c.updateSpecs);
router.post('/:id/images', requireAuth, requireAdmin, upload.single('image'), c.uploadImage);
router.delete('/:id/images/:imageId', requireAuth, requireAdmin, c.deleteImage);

export default router;
